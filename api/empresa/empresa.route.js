const setorService = require('./empresa.service');

module.exports = server => {

  const SERVICE = '/empresas'

  server.get(`${SERVICE}`,setorService.lista);
 
  server.post(`${SERVICE}`,setorService.adiciona);

  server.put(`${SERVICE}/:id`,setorService.edita);

  server.delete(`${SERVICE}/:id`,setorService.deleta);

  server.get(`${SERVICE}/:id`,setorService.buscaPorId);

}