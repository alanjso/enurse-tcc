const fraseService = require('./frases.service');

module.exports = (server) => {

    server.get('/frases', fraseService.listarFrases);
    server.post('/frases', fraseService.cadastrarFrase);
    server.put('/frases', fraseService.atualizarFrase);
    server.delete('/frases/:id', fraseService.deletarFrases);

}
