const fetch = require("node-fetch");

const checkStatus = async (response) => {
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  return response;
};

const getJsonData = async (url, headers) => {
  if (!headers) {
    headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': `huhu-bot/1.0.0 orangelumpywaspkapow@gmail.com`,
    };
  }
  try {
    const response = await fetch(url, { headers: headers });
    const responseSuccess = await checkStatus(response);
    const jsonData = await responseSuccess.json();
    return jsonData;
  }
  catch (err) {
    throw new Error(err.message);
  }
};

module.exports = {
  getJsonData,
};