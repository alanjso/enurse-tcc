const crudCampos = require('./crudCampos.service');

module.exports = server => {

    const SERVICE = '/crud/campos'

    server.get(`${SERVICE}`, crudCampos.lista);

    server.post(`${SERVICE}`, crudCampos.adiciona);

    server.put(`${SERVICE}/:id`, crudCampos.edita);

    server.delete(`${SERVICE}/:id`, crudCampos.deleta);

    server.get(`${SERVICE}/busca/:id`, crudCampos.buscaPorId);
}