const Command = require("../base/Command");

class LabLadder extends Command {
  constructor (client) {
    super(client, {
      name: "labladder",
      category: "Path of Exile",
      description: "Uber lab ladder.",
      usage: "lab <league>",
      aliases: []
    });
  }

  async run (message, args, level) {  // eslint-disable-line no-unused-vars
    const { getJsonData } = require("../util/network");
    const { getDefaultLeague, getActiveLeagues, labReset } = require("../util/poe");
    const { colors } = require("../assets/colors");
    const { getDefaultEmbed, PaginatedEmbed } = require("../util/embed");
    const Fuse = require("fuse.js");

    const chosenLeague = args.length ? args[0] : await getDefaultLeague();
    const leagues = await getActiveLeagues();
    const fuse = new Fuse(leagues);
    const league = fuse.search(chosenLeague)[0].item;
    const difficulties = {
      normal: "1",
      norm: "1",
      n: "1",
      1: "1",
      cruel: "2",
      c: "2",
      2: "2",
      merciless: "3",
      merc: "3",
      m: "3",
      3: "3",
      uber: "4",
      u: "4",
      4: "4",
      null: "4",
      undefined: "4"
    };

    const difficulty = difficulties.uber;
    const ladderURL = (league, diff) => `http://api.pathofexile.com/ladders/${league}?type=labyrinth&difficulty=${parseInt(diff)}`;

    const labLadderEmbed = getDefaultEmbed(this.client, message);
    labLadderEmbed.color = colors.green;

    const functions = [];

    for (const league of leagues) {
      functions.push(
        async function (embed, client) {  // eslint-disable-line no-unused-vars
          const ladderData = await getJsonData(ladderURL(league, difficulty));
          embed.description = `Daily labyrinth reset in: ${labReset()}\n\n`;
          for (const entry of ladderData.entries) {
            const mins = Math.floor(entry.time / 60);
            let timeFmt = `${mins}m`;
            const secs = Math.ceil(((entry.time / 60) - Math.floor(entry.time / 60)) * 60);
            timeFmt += secs ? ` ${secs}s` : "";
            embed.description += `${"`"}Rank ${entry.rank.toString().padStart(2, "0")}: ${entry.character.name} (${entry.account.name}) ${timeFmt}${"`"}\n`;
          }
          embed.title = ladderData.title;
          embed.url = `https://www.pathofexile.com/ladder/labyrinth/${encodeURI(league)}/${parseInt(difficulty)}/${ladderData["startTime"]}`;
        }
      );
    }

    const paginatedEmbed = new PaginatedEmbed(labLadderEmbed, null, functions, this.client);
    paginatedEmbed.currentPage = leagues.indexOf(league);
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

module.exports = LabLadder;