module.exports = server => {

    require('../api/fila/fila-route')(server);
    require('../api/conversa/conversa-route')(server);
    require('../api/user/user-route')(server);
    require('../api/autenticacao/autenticacao-route')(server);
    require('../api/relatorio/relatorio-route')(server);
    require('../api/assunto/assunto.route')(server);
    require('../api/status/status.route')(server);
    require('../api/produto/produto.route')(server);
    require('../api/setor/setor.route')(server);
    require('../api/contato/contato.route')(server);
    // require('../api/monitoramento/monitoramento.route')(server);
    require('../api/campanha/campanha.route')(server);
    require('../api/services/facebook/webhook.route')(server);
    require('../api/frases/frases.route')(server);
    require('../api/msgs-predefinidas/msgs-predefinidas.route')(server);
    require('../api/dashboard/dashboard-route')(server);
    require('../api/historico conversas/historico-route')(server);
    require('../api/horario/horario-route')(server);
    require('../api/configuracao/configuracao.route')(server);
    require('../api/case/case-route')(server);
    require('../api/motivo/motivo-route')(server);
    require('../api/crud campos/crudCampos.route')(server);
    require('../api/sub-motivo/sub-motivo.route')(server);
    require('../api/integracoes/integracao.route')(server);
    require('../api/mensagemFila/mensagemFila-route')(server);
    require('../api/asterisk/click-to-call/click-to-call.route')(server);
    require('../api/crud-pausa/crudPausa-route')(server);
    require('../api/relatorio-pausa/relatorioPausa-route')(server);
}