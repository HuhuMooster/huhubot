const { getJsonData } = require("./network.js");

const defaultIcon = "https://i.imgur.com/QmDteP1.png";

const labReset = () => {
  const UTCnow = new Date();
  return `${23 - UTCnow.getUTCHours()}h:${59 - UTCnow.getUTCMinutes()}m:${60 - UTCnow.getUTCSeconds()}s`;
};

const getLabImageURLs = async () => {
  const fetch = require("node-fetch");
  const labLayoutAPI = "http://192.168.5.19:3000/labs";
  const resp = await fetch(labLayoutAPI);
  const layouts = await resp.json();
  return layouts;
};

const getActiveLeagues = async () => {
  const url = "https://api.poe.watch/leagues";
  try {
    const response = await getJsonData(url);
    const leagues = await response.map(league => league.name);
    return leagues;
  }
  catch (err) {
    throw new Error(err);
  }
};

const getAllLeagues = async () => {
  const url = "https://api.jsonbin.io/b/5ffd721b8aa7af359da900b8/latest";
  try {
    const leagues = await getJsonData(url);
    return leagues;
  }
  catch (err) {
    throw new Error(err);
  }
};

const getDefaultLeague = async () => {
  try {
    const defaultLeague = await getActiveLeagues();
    return defaultLeague[0];
  }
  catch (err) {
    try {
      const allLeagues = await getAllLeagues();
      const defaultLeague = allLeagues.filter(l => l.challenge && l.active)[0];
      return defaultLeague.name;
    }
    catch (err) {
      throw new Error(err);
    }
  }
};

module.exports = {
  defaultIcon,
  getActiveLeagues,
  getAllLeagues,
  getDefaultLeague,
  getLabImageURLs,
  labReset,
};