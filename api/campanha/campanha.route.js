let campanhaService = require('./campanha.service');

module.exports = server => {

    server.post('/campanha', campanhaService.cria);

}