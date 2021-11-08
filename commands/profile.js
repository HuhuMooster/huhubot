const Command = require("../base/Command");

class Profile extends Command {
  constructor (client) {
    super(client, {
      name: "profile",
      category: "Path of Exile",
      description: "Returns a link to the profile with the given character name.",
      usage: "profile [character name]",
      aliases: []
    });
  }

  async run (message, args, level) {  // eslint-disable-line no-unused-vars

    const { colors } = require("../assets/colors");
    const { getJsonData } = require("../util/network");
    const { getDefaultLeague } = require("../util/poe");
    const { getDefaultEmbed } = require("../util/embed");

    const characterName = args[0];
    const league = await getDefaultLeague();
    const profileEmbed = getDefaultEmbed(this.client, message);

    let acc = null;

    try {
      const json = await getJsonData(`https://www.pathofexile.com/character-window/get-account-name-by-character?character=${encodeURIComponent(characterName)}`);
      if (!("error" in json)) {
        acc = await json.accountName;
      } else {
        throw new Error("Character not found.");
      }
    } catch (err) {
      try {
        const json = await getJsonData(`http://192.168.5.19:3000/accounts?character=${encodeURIComponent(characterName)}`);
        if (!json.length) {
          throw new Error("Profile not found.");
        }
        acc = await json[json.length - 1];
      } catch (err) {
        profileEmbed.title = "Profile not found";
        profileEmbed.description = `Profile with a character named "${characterName}" is set to private or doesn't exist.`;
        profileEmbed.color = colors.red;
      }
    } finally {
      if (acc) {
        const profileName = acc;
        const profileURL = `https://www.pathofexile.com/account/view-profile/${profileName}/characters`;
        const shopURL = `https://www.pathofexile.com/trade/search/${league}?q={"query":{"status":{"option":"any"},"stats":[{"type":"and","filters":[]}],"filters":{"trade_filters":{"disabled":false,"filters":{"account":{"input":"${profileName}"}}}}},"sort":{"price":"asc"}}`;
        profileEmbed.title = `${profileName}`;
        profileEmbed.description = `Character "${characterName}" belongs to "${profileName}".\n\n[Profile](${profileURL})\n[Shop](${shopURL})`;
        profileEmbed.url = profileURL;
        profileEmbed.color = colors.green;
      }
      message.channel.send({ embed: profileEmbed });
    }
  }
}

module.exports = Profile;