const SubMotivoService = require('./sub-motivo.service');

module.exports = server => {

  const SERVICE = '/submotivo'

  server.get(`${SERVICE}`,SubMotivoService.lista);

  // server.get(`${SERVICE}/busca/filtrados`, statusService.listaComFiltros);

  server.post(`${SERVICE}`,SubMotivoService.adiciona);

  server.put(`${SERVICE}/:id`,SubMotivoService.edita);

  server.delete(`${SERVICE}/:id`,SubMotivoService.deleta);

  server.get(`${SERVICE}/:id`,SubMotivoService.buscaPorId);
}