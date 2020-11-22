const AssistantV2 = require('ibm-watson/assistant/v2');
const { IamAuthenticator } = require('ibm-watson/auth');
const config = require('config');

let WatsonV2 = new AssistantV2({
  version: '2019-02-28',
  authenticator: new IamAuthenticator({ apikey: config.get('watson.apiKey') }),
  url: 'https://gateway.watsonplatform.net/assistant/api'
});

module.exports = WatsonV2;
