const Command = require("../base/Command");

class Ping extends Command {
  constructor (client) {
    super(client, {
      name: "ping",
      description: "Latency and API response times.",
      usage: "ping",
      aliases: ["pong"]
    });
  }

  async run (message, args, level) { // eslint-disable-line no-unused-vars
    const { colors } = require("../assets/colors");
    const { getDefaultEmbed } = require("../util/embed");

    const pingEmbed = getDefaultEmbed(this.client, message);
    pingEmbed.title = "Pong";
    pingEmbed.description = "Ping?";
    pingEmbed.color = colors.yellow;
    pingEmbed.thumbnail.url = this.client.user.avatarURL() || this.client.user.defaultAvatarURL;

    const msg = await message.channel.send({ embed: pingEmbed });
    pingEmbed.description = `Latency: ${msg.createdTimestamp - message.createdTimestamp}ms.\nAPI Latency: ${Math.round(this.client.ws.ping)}ms`;
    pingEmbed.color = colors.green;
    msg.edit({ embed: pingEmbed });
  }
}

module.exports = Ping;
