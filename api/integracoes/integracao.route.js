const CriarProtocolo = require('./asterisk/criar-caso');

module.exports = server => {

  server.post('/integracao/asterisk/protocolo', CriarProtocolo.criar);

}