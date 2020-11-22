const statusService = require('./status.service');

module.exports = server => {

  const SERVICE = '/status'

  server.get(`${SERVICE}`,statusService.lista);

  server.get(`${SERVICE}/busca/filtrados`, statusService.listaComFiltros);

  server.post(`${SERVICE}`,statusService.adiciona);

  server.put(`${SERVICE}/:id`,statusService.edita);

  server.delete(`${SERVICE}/:id`,statusService.deleta);

  server.get(`${SERVICE}/:id`,statusService.buscaPorId);
}