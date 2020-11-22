const produtoService = require('./produto.service');

module.exports = server => {

  const SERVICE = '/produtos'

  server.get(`${SERVICE}`, produtoService.lista);

  server.get(`${SERVICE}/busca/filtrados`, produtoService.listaComFiltros);

  server.post(`${SERVICE}`, produtoService.adiciona);

  server.put(`${SERVICE}/:id`, produtoService.edita);

  server.delete(`${SERVICE}/:id`, produtoService.deleta);

  server.get(`${SERVICE}/:id`, produtoService.buscaPorId);
}