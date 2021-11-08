const Command = require("../base/Command");

class Name extends Command {
  constructor (client) {
    super(client, {
      name: "name",
      description: "Generates 20 random twitch clip style names.",
      usage: "name",
      aliases: ["randomname"]
    });
  }

  async run (message, args, level) { // eslint-disable-line no-unused-vars

    const { colors } = require("../assets/colors");
    const { getDefaultEmbed } = require("../util/embed");

    const nameCount = 20;
    const maxPoeCharNameLength = 23;
    const names = [];
    while (names.length < nameCount) {
      const name = generateName();
      if (name.length <= maxPoeCharNameLength) {
        names.push(name);
      }
    }

    const nameEmbed = getDefaultEmbed(this.client, message);
    nameEmbed.title = "Random twitch clip style names";
    nameEmbed.description = `Your random names are:\n\n${names.join("\n")}`;
    nameEmbed.color = colors.green;
    nameEmbed.thumbnail.url = this.client.user.avatarURL() || this.client.user.defaultAvatarURL;

    message.channel.send({ embed: nameEmbed });
  }
}

const generateName = () => {
  const { animals, emotes, adjectives } = require("../assets/names");
  return `${adjectives.random()}${adjectives.random()}${animals.random()}${emotes.random()}`;
};

module.exports = Name;