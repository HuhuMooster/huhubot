const Enmap = require("enmap");

class Ninja {
  constructor (client) {
    this.client = client;
    this.data = new Enmap("itemValues");
    if (!this.data.get("exValues")) {
      this.data.set("exValues", {});
    }
  }

  async update () {
    const [itemValues, exValues] = await this._update();
    if (itemValues && exValues) {
      this.data.set("itemValues", itemValues);
      this.data.set("exValues", exValues);
    }
  }

  async _update () {
    const { getJsonData } = require("../util/network.js");
    const { getActiveLeagues } = require("../util/poe.js");

    await this.data.defer;

    let leagues = null;
    const itemValues = {};
    const exValues = {};

    try {
      leagues = await getActiveLeagues();
    } catch (err) {
      this.client.logger.error(`Can't fetch leagues due to ${err.name}: ${err.message}`);
      return;
    }

    leagues.forEach(league => {
      itemValues[league] = {};
      exValues[league] = null;
    });

    const ninjaCategories = [
      "Beast",
      "Currency",
      "DeliriumOrb",
      "DivinationCard",
      "Essence",
      "Fossil",
      "Fragment",
      "Incubator",
      "Invitation",
      "Map",
      "Oil",
      "Prophecy",
      "Resonator",
      "Scarab",
      "SkillGem",
      "UniqueAccessory",
      "UniqueArmour",
      "UniqueFlask",
      "UniqueJewel",
      "UniqueMap",
      "UniqueWeapon",
      "Vial",
      "Watchstone",
    ];

    for (const league of leagues) {
      for (const category of ninjaCategories) {
        const categoryURL = `https://poe.ninja/api/data/${["Currency", "Fragment"].includes(category) ? "currency" : "item"}overview?league=${league}&type=${category}`;
        let jsonData;
        try {
          jsonData = (await getJsonData(categoryURL)).lines;
        } catch (err) {
          this.client.logger.error(`Error while fetching ${league} item prices: "${err.name}: ${err.message}"`);
        } finally {
          if ((jsonData !== undefined && jsonData !== null) && Object.keys(jsonData).length > 0) {
            if (!exValues[league]) {
              exValues[league] = this.getChaosEquivalent("Exalted Orb", jsonData);
            }
            await this.parseJsonData(itemValues[league], exValues[league], jsonData);
          }
        }
      }
      this.client.logger.log(`Successfully got ${league} item prices from poe.ninja.`);
    }
    return [itemValues, exValues];
  }

  async parseJsonData (itemPrices, exValue, entries) {
    for (const entry of entries) {
      if (Object.keys(entry).includes("currencyTypeName")) {
        itemPrices[entry.currencyTypeName] = {
          chaos: parseFloat(entry.chaosEquivalent),
          exalted: parseFloat(parseFloat(entry.chaosEquivalent/exValue).toFixed(2))
        };
      } else {
        itemPrices[entry.name] = {
          chaos: parseFloat(entry.chaosValue),
          exalted: parseFloat(entry.exaltedValue)
        };
      }
    }
  }

  getChaosEquivalent (currency, entries) {
    if (currency.includes("Chaos Orb")) {
      return 1.0;
    }
    for (const entry of entries) {
      if (Object.keys(entry).includes("currencyTypeName")) {
        if (entry.currencyTypeName === currency) {
          return entry.chaosEquivalent;
        }
      }
    }
  }
}

module.exports = Ninja;
