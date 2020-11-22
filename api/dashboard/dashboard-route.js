const dashboardService = require('./dashboard-service');

module.exports = server => {
  const SERVICE = '/dashboard'
  /*
      Funcionalidade: Retornar quantidade de conversas por cada canal de comunicação (Whatsapp, Telegram, facebook...),
      além das quantidades de conversas em cada situação.
      Quem usa: flex-channel.
    */
  server.get(`${SERVICE}/total`, dashboardService.totalConversas);

  /*
    Funcionalidade: Retornar TMA e TME das conversas encerradas.
    Quem usa: flex-channel.
  */
  server.get(`${SERVICE}/tmatme`, dashboardService.tempoMedioAtendimentoEspera);

  /*
      Funcionalidade: Retorna a quantidade de conversas em atendimento por um atendente
      Quem usa: flex-channel.
    */
  server.get(`${SERVICE}/conversa/atendente/ematendimento`, dashboardService.atendimentoPorAtendente);

  /*
      Funcionalidade: Retorna a quantidade de conversas encerrada por atendente
      Quem usa: flex-channel.
    */
  server.get(`${SERVICE}/conversa/atendente/encerrada`, dashboardService.encerradaPorAtendente);

  /*
      Funcionalidade: Retorna a quantidade de conversas não atendida por fila
      Quem usa: flex-channel.
    */
  server.get(`${SERVICE}/conversa/fila/naoatendida`, dashboardService.naoAtendidaPorFila);

  /*
      Funcionalidade: Retorna a quantidade de conversas iniciadas por hora
      Quem usa: flex-channel.
    */
  server.get(`${SERVICE}/conversas/hora/canal`, dashboardService.conversasPorHoraCanal);

  /*
      Funcionalidade: Retorna a quantidade de conversas por um único canal
      Quem usa: flex-channel.
    */
  server.get(`${SERVICE}/conversa/:canal`, dashboardService.contaConversaPorCanalUnico);

  /*
    Funcionalidade: Retorna a versão atual do cliente
    Quem usa: Painel do Flex Versions
  */
  server.get(`${SERVICE}/version`, dashboardService.getVersion);

};
