const Command = require("../base/Command");

class Characters extends Command {
  constructor (client) {
    super(client, {
      name: "characters",
      category: "Path of Exile",
      description: "Returns a list of characters with the given profile name.",
      usage: "characters [profile name]",
      aliases: ["char", "chars"]
    });
  }

  async run (message, args, level) {  // eslint-disable-line no-unused-vars

    const { colors } = require("../assets/colors");
    const { getJsonData } = require("../util/network");
    const { getDefaultLeague } = require("../util/poe");
    const { getDefaultEmbed } = require("../util/embed");

    const profileName = args[0];
    const league = await getDefaultLeague();
    const profileEmbed = getDefaultEmbed(this.client, message);

    let chars = null;

    try {
      const json = await getJsonData(`http://192.168.5.19:3000/characters?account=${encodeURIComponent(profileName)}`);
      if (!json.length) {
        throw new Error("Characters not found.");
      }
      chars = await json;
    } catch (err) {
      profileEmbed.title = "No characters found";
      profileEmbed.description = `Couldn't find any characters associated with a profile named "${profileName}".`;
      profileEmbed.color = colors.red;
    } finally {
      if (chars) {
        const characters = chars;
        const profileURL = `https://www.pathofexile.com/account/view-profile/${profileName}/characters`;
        const shopURL = `https://www.pathofexile.com/trade/search/${league}?q={"query":{"status":{"option":"any"},"stats":[{"type":"and","filters":[]}],"filters":{"trade_filters":{"disabled":false,"filters":{"account":{"input":"${profileName}"}}}}},"sort":{"price":"asc"}}`;
        profileEmbed.title = `${profileName}`;
        profileEmbed.description = `Player "${profileName}" has the following characters:\n${characters.join("\n")}\n\n[Profile](${profileURL})\n[Shop](${shopURL})`;
        profileEmbed.url = profileURL;
        profileEmbed.color = colors.green;
      }
      message.channel.send({ embed: profileEmbed });
    }
  }
}

module.exports = Characters;