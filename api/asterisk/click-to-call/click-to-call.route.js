const ClickToCallService = require('./click-to-call.service');

module.exports = server => {

  const SERVICE = '/clicktocall';

  server.post(`${SERVICE}`, ClickToCallService.realizaLigacao);
  
}