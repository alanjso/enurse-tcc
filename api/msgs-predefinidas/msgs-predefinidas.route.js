const predefinidasService = require('./msgs-predefinidas.service');

module.exports = server => {

  const SERVICE = '/msgspredefinidas'

  server.get(`${SERVICE}`,predefinidasService.lista);

  server.get(`${SERVICE}/busca/filtradas`, predefinidasService.listaComFiltros);

  server.get(`${SERVICE}/:id`,predefinidasService.buscaPorId);

  server.post(`${SERVICE}`,predefinidasService.adiciona);

  server.put(`${SERVICE}/:id`,predefinidasService.edita);

  server.delete(`${SERVICE}/:id`,predefinidasService.deleta);

}