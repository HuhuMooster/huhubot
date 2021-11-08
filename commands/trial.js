const Command = require("../base/Command");

class Trial extends Command {
  constructor (client) {
    super(client, {
      name: "trial",
      category: "Path of Exile",
      description: "Your own uber lab trial tracker.",
      usage: "trial",
      aliases: ["trials", "tracker", "trialtracker", "trialstracker"]
    });
  }

  async run (message, args, level) {  // eslint-disable-line no-unused-vars
    const { colors } = require("../assets/colors");
    const { getDefaultEmbed, ResponsiveEmbed } = require("../util/embed");

    const userName = message.author.username;
    const userID = message.author.id;

    if (args[0] && (args[0].toLowerCase().includes("reset") || args[0].toLowerCase().includes("clear"))) {
      await this.client.tracker.resetTracker();
      this.client.logger.log("Resetting trial trackers for all users.");
      return;
    }

    const trialsWiki = "https://pathofexile.gamepedia.com/Trial_of_Ascendancy";
    const trialsImage = "https://i.imgur.com/VfC7JF2.png";

    // unicode emojis
    const regionalIndicatorT = String.fromCodePoint("0x1F1F9");
    const regionalIndicatorF = String.fromCodePoint("0x1F1EB");
    const regionalIndicatorG = String.fromCodePoint("0x1F1EC");
    const regionalIndicatorR = String.fromCodePoint("0x1F1F7");
    const regionalIndicatorP = String.fromCodePoint("0x1F1F5");
    const regionalIndicatorD = String.fromCodePoint("0x1F1E9");
    const crossMark = String.fromCodePoint("0x274c");
    const checkMark = String.fromCodePoint("0x2705");

    let trialTracker = await this.client.tracker.getTracker(userID);

    const checkTrial = position => trialTracker[position] ? checkMark : crossMark;
    const updateEmbedFields = (embed) => {
      embed.fields = [
        {
          name: "Left",
          value: `1 Piercing ${regionalIndicatorT}ruth ${checkTrial(0)}\n2 Swirling ${regionalIndicatorF}ear ${checkTrial(1)}\n3 Crippling ${regionalIndicatorG}rief ${checkTrial(2)}`,
          inline: true,
        },
        {
          name: "Right",
          value: `4 Burning ${regionalIndicatorR}age ${checkTrial(3)}\n5 Lingering ${regionalIndicatorP}ain ${checkTrial(4)}\n6 Stinging ${regionalIndicatorD}oubt ${checkTrial(5)}`,
          inline: true,
        }
      ];
    };

    const trialEmbed = getDefaultEmbed(this.client, message);
    trialEmbed.title = `${userName}'s uber lab trial tracker`;
    trialEmbed.description = `[Story mode trials](${trialsWiki})`;
    trialEmbed.color = colors.green;
    trialEmbed.image.url = trialsImage;
    updateEmbedFields(trialEmbed);

    // ReponsiveEmbed requires that the number of functions matches the number of emojis
    // The order of emojis and functions needs to match
    const emojis = [
      regionalIndicatorT,
      regionalIndicatorF,
      regionalIndicatorG,
      regionalIndicatorR,
      regionalIndicatorP,
      regionalIndicatorD,
      crossMark,
    ];
    const functions = [];

    for (let i = 0; i < emojis.length - 1; i++) {
      functions.push(
        async function (embed, client) {
          await client.tracker.update(userID, i);
          trialTracker = await client.tracker.getTracker(userID);
          updateEmbedFields(embed);
        }
      );
    }

    functions.push(
      async function (embed, client) {
        await client.tracker.resetTracker(userID);
        trialTracker = await client.tracker.getTracker(userID);
        updateEmbedFields(embed);
      }
    );

    const responsiveEmbed = new ResponsiveEmbed(trialEmbed, emojis, functions, this.client);

    const msg = await message.channel.send({ embed: trialEmbed });
    try {
      for (const emoji of responsiveEmbed.emojis) {
        await msg.react(emoji);
      }
    } catch (err) {
      this.client.logger.error(`One of the emojis failed to react: ${err.name}: ${err.message}`);
    }

    // Only listen for reactions from the user that initiated the trial command
    const filter = (reaction, user) => responsiveEmbed.emojis.includes(reaction.emoji.name) && user.id !== msg.author.id && user.id === userID;
    const collector = msg.createReactionCollector(filter);
    collector.on("collect", async (reaction, collector) => {  // eslint-disable-line no-unused-vars
      await responsiveEmbed.populateEmbed(reaction.emoji.name);
      await msg.edit({ embed: responsiveEmbed.embed });
      const lastUser = await reaction.users.cache.last();
      await reaction.users.remove(lastUser);
    });
  }
}

module.exports = Trial;
