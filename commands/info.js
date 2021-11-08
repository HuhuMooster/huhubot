const Command = require("../base/Command");

class Info extends Command {
  constructor (client) {
    super(client, {
      name: "info",
      description: "User information.",
      usage: "info <@member|member>",
      guildOnly: true,
      aliases: ["whois"]
    });
  }

  async run (message, args, level) {  // eslint-disable-line no-unused-vars

    const { User } = require("discord.js");
    const { colors } = require("../assets/colors");
    const { getDefaultEmbed } = require("../util/embed");

    const user = getUser(this.client, args.length ? args[0] : message.author);
    const member = message.guild.member(new User(this.client, user));

    const infoEmbed = getDefaultEmbed(this.client, message);
    const fields = [
      {
        name: "Name",
        value: member.user.username,
        inline: true,
      },
      {
        name: "Tag",
        value: member.user.discriminator,
        inline: true,
      },
      {
        name: "ID",
        value: member.user.id,
        inline: true,
      },
      {
        name: "Joined Discord",
        value: `${`0${member.user.createdAt.getDate()}`.slice(-2)}.${`0${member.user.createdAt.getMonth() + 1}`.slice(-2)}.${`${member.user.createdAt.getFullYear()}`}`,
        inline: true,
      },
      {
        name: "Joined Server",
        value: `${`0${member.joinedAt.getDate()}`.slice(-2)}.${`0${member.joinedAt.getMonth() + 1}`.slice(-2)}.${`${member.joinedAt.getFullYear()}`}`,
        inline: true,
      },
      {
        name: "Roles",
        value: `${member.roles.cache.map(r => r.name).join(", ")}`,
        inline: true
      }
    ];
    infoEmbed.title = `${member.user.username} info`;
    infoEmbed.color = colors.green;
    infoEmbed.thumbnail.url = member.user.avatarURL() || member.user.defaultAvatarURL;
    infoEmbed.fields = fields;

    message.channel.send({ embed: infoEmbed });
  }
}

const getUser = (client, name) => {
  if (typeof name === "object") {
    return name;
  }
  if (typeof name === "string") {
    if (name.includes("<@")) {
      return client.users.cache.get(name.match(/\d+/)[0]);
    }
    return client.users.cache.find(user => user.username.toLowerCase() == name.toLowerCase());
  }
};

module.exports = Info;