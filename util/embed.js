const getDefaultEmbed = (client, message) => {
  const { defaultIcon } = require("./poe.js");
  const defaultEmbed = {
    color: "",
    title: "",
    author: {
      name: `${client.user.username}`,
      icon_url: client.user.avatarURL() || client.user.defaultAvatarURL,
    },
    thumbnail: {
      url: defaultIcon,
    },
    description: "",
    timestamp: new Date(),
    image: {
      url: ""
    },
    url: "",
    footer: {
      text: `Requested by ${message.author.username}`,
      icon_url: message.author.avatarURL(),
    },
  };

  return defaultEmbed;
};

class ResponsiveEmbed {
  constructor (embedObject, emojis, functions, client) {
    this._client = client;
    this.embed = embedObject;
    this.emojis = emojis || null;
    this.functions = functions;
  }

  async populateEmbed (reactionEmoji) {
    const index = this.emojis.indexOf(reactionEmoji);
    await this.functions[index](this.embed, this.client);
  }

  get client () {
    return this._client;
  }

  set client (newClient) {
    throw new Error("Cannot change the default client.");
  }
}

class PaginatedEmbed extends ResponsiveEmbed {
  constructor (embedObject, emojis, functions, client) {
    super(embedObject, emojis, functions, client);
    this._currentPage = 0;
    this.validateEmojis();
  }

  async populateEmbed (reactionEmoji=null) {
    if (reactionEmoji) {
      this.changePage(reactionEmoji);
    }
    this.embed.footer.text = `Page ${this.currentPage + 1}/${this.maxPageCount()}`;
    await this.functions[this.currentPage](this.embed, this.client);
  }

  changePage (emoji) {
    switch (this.emojis.indexOf(emoji)) {
      case 0: // first page
        this.currentPage = 0;
        break;
      case 1: // previous page
        this.currentPage = this.currentPage - 1;
        break;
      case 2: // next page
        this.currentPage = this.currentPage + 1;
        break;
      case 3: // last page
        this.currentPage = this.maxPageCount() - 1;
        break;
    }
  }

  maxPageCount () {
    return this.functions.length;
  }

  validateEmojis () {
    if (!this.emojis || this.emojis.length !== 4 || !this.emojis.every(emoji => "⏮️◀️▶️⏭️".includes(emoji))) {
      this.emojis = [ "⏮️", "◀️", "▶️", "⏭️" ];
    }
  }

  get currentPage () {
    return this._currentPage;
  }

  set currentPage (newPage) {
    if (newPage !== null && newPage !== undefined) {
      // wrap around to the last page
      if (newPage < 0) {
        this._currentPage = this.maxPageCount() - 1;
      // wrap around to the first page
      } else {
        this._currentPage = newPage % this.maxPageCount();
      }
    }
  }
}

module.exports = {
  getDefaultEmbed,
  ResponsiveEmbed,
  PaginatedEmbed,
};