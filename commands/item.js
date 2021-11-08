// TODO: switch to https://www.poewiki.net/ instead of the fandom wiki
// TODO: populate a db every league start with items and their stats
const Command = require("../base/Command");

class Item extends Command {
  constructor (client) {
    super(client, {
      name: "item",
      description: "Get item information from wiki and poe.ninja.",
      usage: "item [itemName]",
      aliases: ["wiki", "ninja"]
    });
  }

  async run (message, args, level) { // eslint-disable-line no-unused-vars
    const { colors } = require("../assets/colors");
    const { getDefaultEmbed, PaginatedEmbed } = require("../util/embed");


    const requestedItem = args.join(" ").replace(";", "");
    const itemEmbed = getDefaultEmbed(this.client, message);
    let foundItem = null;
    try {
      foundItem = await getItemName(requestedItem, this.client.items.data.get("items"));
    } catch (err) {
      itemEmbed.description = err.message;
      itemEmbed.color = colors.red;
      await message.channel.send({ embed: itemEmbed });
      return;
    }

    const emojis = null;
    const functions = [];

    const embeds = await getItemEmbeds(foundItem);
    const itemValueEmbed = await getItemValue(foundItem, this.client.ninja.data.get("itemValues"));
    for (const em of embeds) {
      functions.push(
        function (embed, client) {  // eslint-disable-line no-unused-vars
          embed.description = em.description;
          embed.image.url = em.image;
          embed.url = em.url;
          embed.thumbnail.url = em.thumbnail;
          embed.title = em.title;
          embed.color = colors.green;
        }
      );
    }

    // Add item value from poe.ninja
    if (itemValueEmbed.description) {
      functions.push(
        function (embed, client) {  // eslint-disable-line no-unused-vars
          embed.description = itemValueEmbed.description;
          embed.url = "https://poe.ninja/";
          embed.thumbnail.url = embed.image.url || embed.thumbnail.url;
          embed.image.url = "";
        }
      );
    }

    // Create a new PaginatedEmbed object and set the embed to the first page
    const paginatedEmbed = new PaginatedEmbed(itemEmbed, emojis, functions, this.client);
    await paginatedEmbed.populateEmbed();

    const msg = await message.channel.send({ embed: paginatedEmbed.embed });
    try {
      for (const emoji of paginatedEmbed.emojis) {
        await msg.react(emoji);
      }
    } catch (err) {
      this.client.logger.error(`One of the emojis failed to react: ${err.name}: ${err.message}`);
    }
    const filter = (reaction, user) => paginatedEmbed.emojis.includes(reaction.emoji.name) && user.id !== msg.author.id;
    const collector = msg.createReactionCollector(filter);
    collector.on("collect", async (reaction, collector) => {  // eslint-disable-line no-unused-vars
      await paginatedEmbed.populateEmbed(reaction.emoji.name);
      await msg.edit({ embed: paginatedEmbed.embed });
      const lastUser = await reaction.users.cache.last();
      await reaction.users.remove(lastUser);
    });
  }
}

const encodeItemName = (name) => {
  return name.replace(/ /gm, "_").replace(/'/gm, "%27").replace(/,/gm, "%2C");
};

const getItemName = async (item, itemsDB) => {
  const { getJsonData } = require("../util/network.js");
  const Fuse = require("fuse.js");
  const fuse = new Fuse(Object.keys(itemsDB));
  let search;
  const fuzzySearchResults = fuse.search(item);
  if (Object.keys(itemsDB).includes(item)) {
    search = item;
  } else if (fuzzySearchResults.length) {
    search = fuzzySearchResults[0].item;
  } else {
    throw new Error(`Cannot find an item called "${item}".`);
  }
  const foundItem = itemsDB[search];

  const wikiURL = `http://pathofexile.gamepedia.com/api.php?action=opensearch&search=${encodeItemName(foundItem)}`;
  try {
    const jsonData = await getJsonData(wikiURL);
    if (jsonData.length) {
      if (jsonData[1].length) {
        return jsonData[1][0];
      } else {
        return foundItem;
      }
    } else {
      return foundItem;
    }
  } catch (err) {
    throw Error(err);
  }
};

const fixFormatting = text => {
  const removeHTMLTags = text => {
    return text.replace(/<[^>]+>/gm, "");
  };

  const removeBrackets = text => {
    let newText = text.replace(/(\[\[)([:()a-zA-Z0-9 ]+\|)/gm, "");
    newText = newText.replace(/(\[\[)/gm, "");
    newText = newText.replace(/(\]\])/gm, "");

    return newText;
  };

  return removeHTMLTags(removeBrackets(text));
};

const parseItemMods = async entry => {
  const he = require("he");
  const htmlData = he.decode(entry.html);

  const name = entry.name;
  let stats = "";
  let stat_req = "";
  let gemQuality = "";
  let gemDescription = "";
  let affixes = "";
  let flavour = "";
  let prophecyText = "";
  let sealCost = "";
  let image = "";
  let thumbnail = "";

  for (const mod of htmlData.split("</span>")) {
    if (mod.includes("item-stats")) {
      stats += `${fixFormatting(mod.replace(/<br>/gm, "\n"))}\n\n`;
    } else if (mod.includes("group tc -value")) {
      prophecyText = `${fixFormatting(mod.trim())}\n`;
    } else if (mod.includes("Seal Cost")) {
      sealCost = `Seal Cost: ${mod.match(/\dx/)[0]} Silver Coins\n`;
    } else if (mod.includes("group") && mod.includes("-default") && !mod.includes("-mod")) {
      stat_req = `${fixFormatting(mod.replace(/<br>/gm, "\n"))}\n\n`;
    } else if (mod.includes("group") && mod.includes("-mod") && !mod.includes("-default")) {
      affixes += `${fixFormatting(mod.replace(/<br>/gm, "\n").replace(/<br\/>/gm, "\n").replace(/<br \/>/gm, "\n"))}\n\n`;
    } else if (mod.includes("-flavour")) {
      flavour = `*${fixFormatting(mod.trim().replace(/<br \/><br \/>/gm, "\n").replace(/<br \/>/gm, " ").replace(/<br>/gm, "\n"))}*\n\n`;
    } else if (mod.includes("-mod") && mod.includes("Per") && mod.includes("Quality")) {
      gemQuality = `${fixFormatting(mod.trim().replace(/<br>/gm, "\n"))}\n\n`;
    } else if (mod.includes("-gemdesc")) {
      gemDescription = `${fixFormatting(mod.trim().replace(/<br>/gm, " "))}\n\n`;
    }
  }

  let description = "";
  if (entry["class id"].includes("DivinationCard")) {
    const { divinationCards } = require("../assets/divinationCardRewards.js");
    description += `Reward: ${divinationCards[entry.name]}\n\n`;
    description += flavour ? flavour : "";
    image = await getCardArt(name);
  } else {
    if (entry["base item"].includes("Prophecy")) {
      thumbnail = "https://gamepedia.cursecdn.com/pathofexile_gamepedia/3/31/Prophecy_inventory_icon.png";
    } else {
      thumbnail = await getInventoryIcon(name);
    }
    description += entry["drop leagues"] ? `League${entry["drop leagues"].split(",").length > 1 ? "s": ""}: ${entry["drop leagues"].replace(",", ", ")}\n\n` : "";
    description += stats.replace(/&ndash;/gm, "-");
    description += stat_req;
    description += gemDescription ? gemDescription : "";
    description += gemQuality ? gemQuality : "";
    description += affixes.replace(/&#60;|&lt;/gm, "<").replace(/&#62;|&gt;/gm, ">").replace(/&ndash;/gm, "-");
    description += prophecyText ? prophecyText : "";
    description += sealCost ? sealCost : "";
    description += flavour ? flavour : "";
  }

  return {
    description: description,
    image: image,
    thumbnail: thumbnail,
    title: `${entry.name} ${entry["base item"]}`.trim(),
    url: `http://pathofexile.gamepedia.com/${encodeItemName(name)}`,
  };
};

const getCardArt = async cardName => {
  const fetch = require("node-fetch");
  try {
    const resp = await fetch(`http://pathofexile.gamepedia.com/${encodeURI(cardName)}`);
    const html = await resp.text();
    return html.match(/(https?:\/\/[a-zA-Z0-9./_%]+_card_art+\.png\?version=[a-zA-Z0-9]+)/gm)[0];
  } catch (err) {
    this.client.logger.log(err);
  }
};

const getInventoryIcon = async itemName => {
  const fetch = require("node-fetch");
  try {
    const resp = await fetch(`http://pathofexile.gamepedia.com/${encodeURI(itemName)}`);
    const html = await resp.text();
    // const matches = html.match(/(https?:\/\/[a-zA-Z0-9./_%-]+_inventory_icon+\.png\?version=[a-zA-Z0-9]+)/gm);
    const matches = html.match(/(https?:\/\/[a-zA-Z0-9./_%-]+_inventory_icon+\.png)/gm);
    for (const match of matches) {
      if (match.includes(encodeItemName(itemName))) {
        return match;
      }
    }
  } catch (err) {
    this.client.logger.log(err);
  }
};

const getItemEmbeds = async item => {
  const { getJsonData } = require("../util/network.js");
  const encodedItem = encodeURI(item);
  // const cargoqueryURL = `https://pathofexile.gamepedia.com/api.php?action=cargoquery&tables=items&fields=items.base_item,items.drop_leagues,items.html,items.name,items.class_id,items.explicit_stat_text,items.rarity,items.supertype,items.flavour_text,items.required_level,items.required_strength,items.required_dexterity,items.required_intelligence&where=items.name=%22${encodedItem}%22&format=json`;
  const cargoqueryURL = `https://pathofexile.gamepedia.com/api.php?action=cargoquery&tables=items&fields=items.base_item,items.drop_leagues,items.html,items.name,items.class_id&where=items.name=%22${encodedItem}%22&format=json`;
  const itemVariants = [];
  try {
    const jsonData = await getJsonData(cargoqueryURL);
    if (Object.keys(jsonData).includes("cargoquery")) {
      for (const cargoqueryEntry of jsonData.cargoquery) {
        itemVariants.push(await parseItemMods(cargoqueryEntry.title));
      }
    }
    return itemVariants;
  } catch (err) {
    this.client.logger.log(err);
  }
};

const getItemValue = async (item, valueDB) => {
  const { getActiveLeagues } = require("../util/poe.js");
  const chaosValuePerLeague = {};
  const exaltValuePerLeague = {};
  const leagues = await getActiveLeagues();

  for (const league of leagues) {
    chaosValuePerLeague[league] = null;
    exaltValuePerLeague[league] = null;
  }

  for (const league of leagues) {
    if (item in valueDB[league]) {
      chaosValuePerLeague[league] = valueDB[league][item]["chaos"];
      exaltValuePerLeague[league] = valueDB[league][item]["exalted"];
    }
  }

  let description = "";

  for (const league of leagues) {
    if ([null, undefined].every(el => chaosValuePerLeague[league] !== el)) {
      description += `**Chaos orb (${league})**: ${chaosValuePerLeague[league]}\n`;
      description += !item.startsWith("Exalted") ? `**Exalted orb (${league})**: ${exaltValuePerLeague[league]}\n\n` : "\n";
    }
  }

  return { description: description };

};

module.exports = Item;
