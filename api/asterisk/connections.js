const AmiClient = require('asterisk-ami-client');
const log = require('../util/logs');

let client = new AmiClient();

log.success(' ==> Conectando ao asterisk');

client.connect('flexuc', 'segredoflex', { host: 'taurus.g4flex.com.br', port: 5038 })
  // client.connect('flexuc', 'segredoflex', { host: '177.200.93.254', port: 5038 })
  .then(amiConnection => {
    log.success(' ==> Conectado ao asterisk');
    //require('../asterisk/bina')(client, io);
  })
  .catch(error => {
    console.log(`** Erro ao se conectar com os Asterisk **`);
    console.log(`** Erro: ${error} **`);
  });


module.exports = client;

