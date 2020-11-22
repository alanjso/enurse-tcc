const casoService = require('./case-service');

module.exports = server => {

  const SERVICE = '/casos'

  server.get(`${SERVICE}`, casoService.lista);

  // server.get(`${SERVICE}/busca/filtrados`, casoService.listaComFiltros);

  server.post(`${SERVICE}`, casoService.adiciona);

  server.put(`${SERVICE}/:id`, casoService.edita);

  server.delete(`${SERVICE}/:id`, casoService.deleta);

  server.get(`${SERVICE}/:id`, casoService.buscaPorId);

  server.put(`${SERVICE}/:id/encerra`,casoService.encerra);

  server.post(`${SERVICE}/:id/comentario`,casoService.adicionaComentario);

  server.post(`${SERVICE}/:id/tarefa`,casoService.adicionaTarefa);

  server.put(`${SERVICE}/:id/reabrircaso`,casoService.reabrirCaso);

  server.put(`${SERVICE}/:id/mudarresponsavel`,casoService.mudarResponsavel);

  server.put(`${SERVICE}/:id/modificarstatus`,casoService.modificarStatus);

  server.put(`${SERVICE}/:id/modificarmotivo`,casoService.modificarMotivo);
  
}