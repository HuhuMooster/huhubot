const Command = require("../base/Command");

class DadJoke extends Command {
  constructor (client) {
    super(client, {
      name: "dadjoke",
      description: "Get a dad joke.",
      usage: "dadjoke",
      aliases: []
    });
  }

  async run (message, args, level) {  // eslint-disable-line no-unused-vars

    const { colors } = require("../assets/colors");
    const { getJsonData } = require("../util/network");
    const { getDefaultEmbed } = require("../util/embed");

    const url = "https://icanhazdadjoke.com";
    const headers = { "Accept": "application/json" };
    const jokeEmbed = getDefaultEmbed(this.client, message);

    jokeEmbed.title = "Dadjoke";
    jokeEmbed.thumbnail.url = this.client.user.avatarURL() || this.client.user.defaultAvatarURL;

    getJsonData(url, headers)
      .then(jsonData => {
        jokeEmbed.description = jsonData.joke;
        jokeEmbed.color = colors.green;
      })
      .catch(err => {
        jokeEmbed.description = err.message;
        jokeEmbed.color = colors.red;
      })
      .finally(() => {
        message.channel.send({ embed: jokeEmbed });
      });
  }
}

module.exports = DadJoke;