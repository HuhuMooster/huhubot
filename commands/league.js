const Command = require("../base/Command");

class League extends Command {
  constructor (client) {
    super(client, {
      name: "league",
      category: "Path of Exile",
      description: "Displays information about the specified league.",
      usage: "league <league name>",
      aliases: ["l"]
    });
  }

  async run (message, args, level) {  // eslint-disable-line no-unused-vars

    const { colors } = require("../assets/colors");
    const { getAllLeagues } = require("../util/poe");
    const { getDefaultEmbed } = require("../util/embed");
    const { DateTime } = require("luxon");
    const Fuse = require("fuse.js");

    const leagueEmbed = getDefaultEmbed(this.client, message);

    getAllLeagues()
      .then(leagues => {
        let league = args[0] ? leagues.filter(l => l.name.toLowerCase() === args[0].toLowerCase())[0] : leagues.filter(l => l.challenge && (l.active || l.upcoming))[0];
        const fuse = new Fuse(leagues.map(l => l.name));
        try {
          league = league ? league : leagues.filter(l => l.name === fuse.search(args[0])[0].item)[0];
        }
        catch (err) {
          if (err.name.includes("TypeError")) {
            throw new Error("Requested league doesn't exist.");
          }
        }
        let timeZones = undefined;
        try {
          timeZones = [... this.client.settings.get(message.guild.id).timezones.split(" ")];
        } catch(err) {
          timeZones = ["Europe/Amsterdam"];
        }
        const fields = [];
        const now = DateTime.utc();
        const utcStart = DateTime.fromISO(league.start).toUTC();
        const utcEnd = league.end ? DateTime.fromISO(league.end).toUTC() : null;
        const fieldsToAdd = {
          utcStart: utcStart,
          utcEnd: utcEnd,
          countdownStart: utcStart - now,
          countdownEnd: utcEnd ? utcEnd - now : null,
          leagueDuration: utcEnd && utcStart ? utcEnd - utcStart : null,
        };

        // populate embed fields
        for (const [key, date] of Object.entries(fieldsToAdd)) {
          const field = { name: "", value: "", inline: false };
          if (key.includes("Start")) {
            if (typeof date === "object") {
              field.name = "Start";
              field.value = formatTimezones(timeZones, date);
              field.inline = true;
            }
            else {
              field.name = "Start countdown";
              field.inline = false;
              field.value = date > 0 ? `League starts in ${formatTime(date)}.` : `League started ${formatTime(-date)} ago.`;
            }
          }
          else if (key.includes("End") && date) {
            if (typeof date === "object") {
              field.name = "End";
              field.value = formatTimezones(timeZones, date);
              field.inline = true;
            }
            else {
              field.name = "End countdown";
              field.value = date > 0 ? `League ends in ${formatTime(date)}.` : `League ended ${formatTime(-date)} ago.`;
              field.inline = false;
            }
          }
          else if (date > 0) {
            field.name = "League duration";
            field.value = formatTime(date);
          }

          if (field.name && field.value) {
            fields.push(field);
          }
        }

        leagueEmbed.title = league.name;
        leagueEmbed.color = colors.green;
        leagueEmbed.fields = fields;
        leagueEmbed.url = `https://pathofexile.gamepedia.com/${encodeURI(league.name)}_league`;
      })
      .catch(err => {
        leagueEmbed.title = "Invalid league";
        leagueEmbed.description = err.message;
        leagueEmbed.color = colors.red;
      })
      .finally(() => {
        message.channel.send({ embed: leagueEmbed });
      });
  }
}

const formatTimezones = (tZones, date) => {
  return tZones.map(zone => `${date.setZone(zone).toFormat("dd.MM.yyyy HH:mm")} ${zone.split("/")[1].replace("_", " ")}`).join("\n");
};

const formatTime = (millisecs) => {
  let secs = Math.floor(millisecs / 1000);
  let mins = Math.floor(secs / 60);
  secs %= 60;
  let hours = Math.floor(mins / 60);
  mins %= 60;
  const days = Math.floor(hours / 24);
  hours %= 24;

  let timeFmt = "";
  if (days) {
    timeFmt += `${days} day${days > 1 ? "s" : ""}${hours && mins ? ", " : ""}`;
  }
  if (hours) {
    timeFmt += `${hours && !mins ? " and " : ""}${hours} hour${hours > 1 ? "s" : ""}`;
  }
  if (mins) {
    timeFmt += `${days || hours ? " and " : ""}${mins} minute${mins > 1 ? "s" : ""}`;
  }

  return timeFmt;
};

module.exports = League;