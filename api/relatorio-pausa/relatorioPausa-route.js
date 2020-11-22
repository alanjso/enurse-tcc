const relatorioPausaService = require('./relatorioPausa-service');

module.exports = server => {

    const SERVICE = '/relatoriopausa'

    server.get(`${SERVICE}`, relatorioPausaService.lista);

    server.post(`${SERVICE}`, relatorioPausaService.adiciona);

    server.put(`${SERVICE}/:id`, relatorioPausaService.edita);

    server.delete(`${SERVICE}/:id`, relatorioPausaService.deleta);

    server.get(`${SERVICE}/:id`, relatorioPausaService.buscaPorId);

    server.post(`${SERVICE}/pausa/iniciar`, relatorioPausaService.iniciarPausa);

    server.get(`${SERVICE}/pausa/abertas`, relatorioPausaService.listaPausasAbertas);

    server.put(`${SERVICE}/pausa/encerrar/:idPausa/:idUser`, relatorioPausaService.encerrarPausa);

}