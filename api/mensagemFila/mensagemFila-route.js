const mensagemFilaService = require('./mensagemFila-service');

module.exports = server => {

  const SERVICE = '/mensagemFila'

  server.get(`${SERVICE}`, mensagemFilaService.lista);

  server.post(`${SERVICE}`, mensagemFilaService.adiciona);

  server.put(`${SERVICE}/:id`, mensagemFilaService.edita);

  server.delete(`${SERVICE}/:id`, mensagemFilaService.deleta);

  server.get(`${SERVICE}/:id`, mensagemFilaService.buscaPorId);

  server.get(`${SERVICE}/porfila/:fila`, mensagemFilaService.buscapPorFila);

}