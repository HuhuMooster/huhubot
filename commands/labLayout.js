const Command = require("../base/Command");

class LabLayout extends Command {
  constructor (client) {
    super(client, {
      name: "lab",
      category: "Path of Exile",
      description: "Lab layout image of a chosen difficulty.",
      usage: "lab <difficulty>",
      aliases: ["labs", "lablayout", "lablayouts"]
    });
  }

  async run (message, args, level) {  // eslint-disable-line no-unused-vars
    const { colors } = require("../assets/colors");
    const { labReset } = require("../util/poe");
    const { getDefaultEmbed, ResponsiveEmbed } = require("../util/embed");

    const difficulties = {
      normal: "normal",
      norm: "normal",
      n: "normal",
      1: "normal",
      cruel: "cruel",
      c: "cruel",
      2: "cruel",
      merciless: "merciless",
      merc: "merciless",
      m: "merciless",
      3: "merciless",
      uber: "uber",
      u: "uber",
      4: "uber",
      null: "uber",
      undefined: "uber",
    };

    const difficulty = args.length ? (Object.keys(difficulties).includes(args[0].toString()) ? difficulties[args[0].toString().toLowerCase()] : difficulties[null]) : difficulties[null];

    // unicode emojis
    const regionalIndicatorN = String.fromCodePoint("0x1F1F3");
    const regionalIndicatorC = String.fromCodePoint("0x1F1E8");
    const regionalIndicatorM = String.fromCodePoint("0x1F1F2");
    const regionalIndicatorU = String.fromCodePoint("0x1F1FA");

    const labLayoutEmbed = getDefaultEmbed(this.client, message);
    labLayoutEmbed.color = colors.green;

    const emojis = [
      regionalIndicatorN,
      regionalIndicatorC,
      regionalIndicatorM,
      regionalIndicatorU,
    ];
    const functions = [];

    for (const diff of [...new Set(Object.values(difficulties))]) {
      functions.push(
        async function (embed, client) {  // eslint-disable-line no-unused-vars
          embed.description = `Daily labyrinth reset in: ${labReset()}`;
          embed.title = `${diff.toProperCase()} lab layout`;
          embed.url = client.labLayouts.filter(el => el.includes(diff))[0];
          embed.image.url = embed.url;
        }
      );
    }

    const responsiveEmbed = new ResponsiveEmbed(labLayoutEmbed, emojis, functions, this.client);
    const diffs =  [...new Set(Object.values(difficulties))];
    await responsiveEmbed.populateEmbed(emojis[diffs.indexOf(difficulty)]);

    const msg = await message.channel.send({ embed: responsiveEmbed.embed });
    try {
      for (const emoji of responsiveEmbed.emojis) {
        await msg.react(emoji);
      }
    } catch (err) {
      this.client.logger.error(`One of the emojis failed to react: ${err.name}: ${err.message}`);
    }

    const filter = (reaction, user) => responsiveEmbed.emojis.includes(reaction.emoji.name) && user.id !== msg.author.id;
    const collector = msg.createReactionCollector(filter);
    collector.on("collect", async (reaction, collector) => {  // eslint-disable-line no-unused-vars
      await responsiveEmbed.populateEmbed(reaction.emoji.name);
      await msg.edit({ embed: responsiveEmbed.embed });
      const lastUser = await reaction.users.cache.last();
      await reaction.users.remove(lastUser);
    });
  }
}

module.exports = LabLayout;