const contatoService = require('./contato.service');

module.exports = server => {

    const SERVICE = '/contatos'

    server.get(`${SERVICE}`, contatoService.lista);

    server.get(`${SERVICE}/filtrados`, contatoService.listaComFiltros);

    server.post(`${SERVICE}`, contatoService.adiciona);

    server.get(`${SERVICE}/email/:email`, contatoService.buscaPorEmail);

    server.put(`${SERVICE}/:id`, contatoService.edita);

    server.delete(`${SERVICE}/:id`, contatoService.deleta);

    server.get(`${SERVICE}/busca/:id`, contatoService.buscaPorId);
}