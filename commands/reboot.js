const Command = require("../base/Command");

class Reboot extends Command {
  constructor (client) {
    super(client, {
      name: "reboot",
      description: "If running under PM2, bot will restart.",
      category: "System",
      usage: "reboot",
      permLevel: "Bot Owner",
      aliases: ["quit", "q"]
    });
  }

  async run (message, args, level) { // eslint-disable-line no-unused-vars
    try {
      await message.reply("Bot is shutting down.");
      await Promise.all(this.client.commands.map(cmd => this.client.unloadCommand(cmd)));
      process.exit(1);
    } catch (e) {
      this.client.logger.log(e);
    }
  }
}

module.exports = Reboot;
