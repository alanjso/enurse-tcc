const motivoService = require('./motivo-service');

module.exports = server => {

  const SERVICE = '/motivos'

  server.get(`${SERVICE}`, motivoService.lista);

  // server.get(`${SERVICE}/busca/filtrados`, casoService.listaComFiltros);

  server.post(`${SERVICE}`, motivoService.adiciona);

  server.put(`${SERVICE}/:id`, motivoService.edita);

  server.delete(`${SERVICE}/:id`, motivoService.deleta);

  server.get(`${SERVICE}/:id`, motivoService.buscaPorId);

}