const assuntoService = require('./assunto.service');

module.exports = server => {

  const SERVICE = '/assuntos'

  server.get(`${SERVICE}`,assuntoService.lista);

  server.get(`${SERVICE}/busca/filtrados`, assuntoService.listaComFiltros);

  server.post(`${SERVICE}`,assuntoService.adiciona);

  server.put(`${SERVICE}/:id`,assuntoService.edita);

  server.delete(`${SERVICE}/:id`,assuntoService.deleta);

  server.get(`${SERVICE}/:id`,assuntoService.buscaPorId);
}