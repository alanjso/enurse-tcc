const axios = require('axios');
const qs = require('querystring');

module.exports = async (mensagem, telefoneDestino) => new Promise((resolve, reject) => {
  // console.log('Enviando mensagem para a gupshup');
  let configWhatsapp;
  Configuracao.findOne()
    .then(function (configuracao) {
      configWhatsapp = configuracao.whatsapp;
    });

  const requestBody = {
    channel: configWhatsapp.channel ? configWhatsapp.channel : 'whatsapp',
    source: configWhatsapp.source ? configWhatsapp.source : '558539240077',
    destination: telefoneDestino,
    message: mensagem,
    'src.name': configWhatsapp.srcName ? configWhatsapp.srcName : 'G4FlexApp02'
  }

  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cache-Control': 'no-cache',
      'apikey': configWhatsapp.apikey ? configWhatsapp.apikey : '69cb713b279b48acc88370f7ca00c91f'
    }
  }

  axios.post('https://api.gupshup.io/sm/api/v1/msg', qs.stringify(requestBody), config)
    .then((result) => {
      resolve();
      // console.log('result: ', result);
    })
    .catch((err) => {
      reject();
      console.log('error: ', err);
    })
});


