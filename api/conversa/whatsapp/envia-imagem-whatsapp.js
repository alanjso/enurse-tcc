const axios = require('axios');
const qs = require('querystring');
const Configuracao = require('../../configuracao/configuracao.model');

module.exports = async (type, urlImagem, numeroDestino) => new Promise(async (resolve, reject) => {

  let configuracao = await Configuracao.findOne();
  let configWhatsapp = configuracao.whatsapp;

  console.log('url image: ', urlImagem);
  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cache-Control': 'no-cache',
      'apikey': configWhatsapp.apikey ? configWhatsapp.apikey : ''
    }
  }

  let sendImage = `{"type":${type},"originalUrl":"${urlImagem}","previewUrl":"${urlImagem}","caption":""}`;
  let sendFile = `{"type":${type},"url":"${urlImagem}","filename":"arquivo"}`;

  const requestBody = {
    channel: configWhatsapp.channel ? configWhatsapp.channel : 'whatsapp',
    source: configWhatsapp.source ? configWhatsapp.source : '',
    destination: numeroDestino,
    'src.name': configWhatsapp.srcName ? configWhatsapp.srcName : '',
    'message.payload': type == 'image' ? sendImage : type == 'file' ? sendFile : '',
  }
  //parametro caption é o texto que vem junto com a imagem

  // console.log('request body: ', requestBody);

  axios.post('https://api.gupshup.io/sm/api/v1/msg', qs.stringify(requestBody), config)
    .then((result) => {
      resolve(result);
    })
    .catch((err) => {
      reject(err);
    })
});


// const requestBody = {
//   channel: 'whatsapp',
//   source: '558539240077',
//   destination: telefone,
//   message: mensagem,
//   'src.name': 'G4FlexApp01' ou G4FlexApp02
// }

// const config = {
//   headers: {
//     'Content-Type': 'application/x-www-form-urlencoded',
//     'Cache-Control': 'no-cache',
//     'apikey': '69cb713b279b48acc88370f7ca00c91f'
//   }
// }

// axios.post('https://api.gupshup.io/sm/api/v1/msg', qs.stringify(requestBody), config)
//   .then((result) => {
//     resolve();
//     console.log('result: ', result);
//   })
//   .catch((err) => {
//     reject();
//     console.log('error: ', err);
//   })
// });