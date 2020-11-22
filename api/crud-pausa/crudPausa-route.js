const crudPausaService = require('./crudPausa-service');

module.exports = server => {

  const SERVICE = '/crudPausa'

  server.get(`${SERVICE}`, crudPausaService.lista);

  server.post(`${SERVICE}`, crudPausaService.adiciona);

  server.put(`${SERVICE}/:id`, crudPausaService.edita);

  server.delete(`${SERVICE}/:id`, crudPausaService.deleta);

  server.get(`${SERVICE}/:id`, crudPausaService.buscaPorId);

}