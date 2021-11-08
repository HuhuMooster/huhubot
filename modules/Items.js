const Enmap = require("enmap");

class Items {
  constructor (client) {
    this.client = client;
    this.data = new Enmap("items");
    this.extraAbbreviations = {
      "alch": "Orb of Alchemy",
      "alchemy": "Orb of Alchemy",
      "alt": "Orb of Alteration",
      "alteration": "Orb of Alteration",
      "ancient": "Ancient Orb",
      "annul": "Orb of Annulment",
      "annulment": "Orb of Annulment",
      "armourer's": "Armourer's Scrap",
      "bauble": "Glassblower's Bauble",
      "binding": "Orb of Binding",
      "blacksmith's": "Blacksmith's Whetstone",
      "blessed": "Blessed Orb",
      "chance": "Orb of Chance",
      "chaos": "Chaos Orb",
      "chayula blessing": "Blessing of Chayula",
      "chayula splinter": "Splinter of Chayula",
      "chisel": "Cartographer's Chisel",
      "chrome": "Chromatic Orb",
      "divine": "Divine Orb",
      "engineer": "Engineer's Orb",
      "esh blessing": "Blessing of Esh",
      "esh splinter": "Splinter of Esh",
      "eternal": "Eternal Orb",
      "ex": "Exalted Orb",
      "exa": "Exalted Orb",
      "exalt": "Exalted Orb",
      "exalted": "Exalted Orb",
      "fuse": "Orb of Fusing",
      "fusing": "Orb of Fusing",
      "gcp": "Gemcutter's Prism",
      "harbinger": "Harbinger's Orb",
      "horizon": "Orb of Horizons",
      "jew": "Jeweller's Orb",
      "jeweller": "Jeweller's Orb",
      "mirror": "Mirror of Kalandra",
      "regal": "Regal Orb",
      "regret": "Orb of Regret",
      "scour": "Orb of Scouring",
      "scouring": "Orb of Scouring",
      "scrap": "Armourer's Scrap",
      "silver": "Silver Coin",
      "tul blessing":	"Blessing of Tul",
      "tul splinter": "Splinter of Tul",
      "uul-netol blessing": "Blessing of Uul-Netol",
      "uul-netol splinter": "Splinter of Uul-Netol",
      "vaal": "Vaal Orb",
      "vorb":	"Vaal Orb",
      "whetstone": "Blacksmith's Whetstone",
      "xoph blessing": "Blessing of Xoph",
      "xoph splinter": "Splinter of Xoph",
    };
  }

  async update () {
    const { getJsonData } = require("../util/network.js");
    const itemsDataURL = "https://www.pathofexile.com/api/trade/data/items";

    await this.data.defer;

    getJsonData(itemsDataURL)
      .then(jsonData => {
        const itemData = this.parseJsonData(jsonData.result);
        for (const [key, val] of Object.entries(this.extraAbbreviations)) {
          if (!Object.keys(itemData).includes(key)) {
            itemData[key] = val;
          }
        }
        this.data.set("items", itemData);
        this.client.logger.log("Successfully loaded all items.");
      })
      .catch(err => {
        this.client.logger.error(`Can't fetch items due to ${err.name}: ${err.message}`);
      });
  }

  parseJsonData (fields) {
    const itemData = {};
    fields.forEach(field => {
      field.entries.forEach(item => {
        if (Object.keys(item).includes("name")) {
          itemData[item.name.toLowerCase()] = item.name;
        } else {
          if (item.type.toLowerCase().includes(" map") && !item.type.toLowerCase().includes("shaped ") && !item.type.toLowerCase().includes("elder ")) {
            itemData[`"elder ${item.type.toLowerCase().replace(" map", "")}`] = `Elder ${item.type}`;
            itemData[`"shaper ${item.type.toLowerCase().replace(" map", "")}`] = `Shaper ${item.type}`;
            itemData[item.type.toLowerCase().replace(" map", "")] = item.type;
          } else {
            itemData[item.type.toLowerCase().replace("essence of ", "").replace(" support", "")] = item.type;
          }
        }
      });
    });
    return itemData;
  }
}

module.exports = Items;
