const setorService = require('./setor.service');

module.exports = server => {

  const SERVICE = '/setores'

  server.get(`${SERVICE}`,setorService.lista);

  server.get(`${SERVICE}/busca/filtrados`, setorService.listaComFiltros);

  server.post(`${SERVICE}`,setorService.adiciona);

  server.put(`${SERVICE}/:id`,setorService.edita);

  server.delete(`${SERVICE}/:id`,setorService.deleta);

  server.get(`${SERVICE}/:id`,setorService.buscaPorId);
}