const { getLabImageURLs } = require("../util/poe");

module.exports = class {
  constructor (client) {
    this.client = client;
  }

  async run () {

    // Why await here? Because the ready event isn't actually ready, sometimes
    // guild information will come in *after* ready. 1s is plenty, generally,
    // for all of them to be loaded.
    // NOTE: client.wait is added by ./modules/functions.js!
    await this.client.user.setPresence({ activity: { name: "Moosting...  (✿ ˃ ︿ ˂)" }, status: "dnd" });
    await this.client.wait(5000);

    // This loop ensures that client.appInfo always contains up to date data
    // about the app's status. This includes whether the bot is public or not,
    // its description, owner, etc. Used for the dashboard amongs other things.
    this.client.appInfo = await this.client.fetchApplication();
    setInterval( async () => {
      this.client.appInfo = await this.client.fetchApplication();
    }, 60000);

    // Check whether the "Default" guild settings are loaded in the enmap.
    // If they're not, write them in. This should only happen on first load.
    if (!this.client.settings.has("default")) {
      if (!this.client.config.defaultSettings) throw new Error("defaultSettings not preset in config.js or settings database. Bot cannot load.");
      this.client.settings.set("default", this.client.config.defaultSettings);
    }

    // Update items and ninja data every 30 minutes.
    await this.client.tracker.load();
    await this.client.items.update();
    await this.client.ninja.update();
    this.client.labLayouts = await getLabImageURLs();
    setInterval( async () => {
      await this.client.user.setPresence({ activity: { name: "Updating ninja prices..." }, status: "dnd" });
      const UTCnow = new Date();
      const date = `${UTCnow.getUTCFullYear()}-${(UTCnow.getUTCMonth()+1).toString().padStart(2, "0")}-${UTCnow.getUTCDate().toString().padStart(2, "0")}`;
      if (!this.client.labLayouts.every(el => el.includes(date))) {
        this.client.labLayouts = await getLabImageURLs();
      }
      await this.client.items.update();
      await this.client.ninja.update();
      await this.client.user.setPresence({ activity: { name: `huhu (✿ =‿‿=) ${this.client.settings.get("default").prefix}help` }, status: "online" });
    }, 30 * 60 * 1000);

    // Set the game as the default help command + guild count.
    // NOTE: This is also set in the guildCreate and guildDelete events!
    await this.client.user.setPresence({ activity: { name: `huhu (✿ =‿‿=) ${this.client.settings.get("default").prefix}help` }, status: "online" });

    // Log that we're ready to serve, so we know the bot accepts commands.
    this.client.logger.log(`${this.client.user.tag}, ready to serve ${this.client.users.cache.size} users in ${this.client.guilds.cache.size} servers.`, "ready");
  }
};
