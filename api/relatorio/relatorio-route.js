const relatorioService = require("./relatorio-service");

module.exports = server => {
  /*
    Funcionalidade: Mostrar o relatório analiticom com paginação.
    Quem usa: flex-channel.
  */
  server.get("/relatorio/analitico", relatorioService.buscaTodasConversas);

  /*
    Funcionalidade: Fazer o download do relatório em pdf.
    Quem usa: flex-channel.
  */
  server.get("/relatorio/analitico/pdf", relatorioService.buscaTodasAsConversasPdf);

  /*
    Funcionalidade: Fazer o download do relatório em excel.
    Quem usa: flex-channel.
  */
  server.get("/relatorio/analitico/csv", relatorioService.buscaTodasAsConversasCSV);

  /*
    Funcionalidade: Fazer o download do relatório de performance em excel.
    Quem usa: flex-channel.
  */
  server.get("/relatorio/performance/csv", relatorioService.buscaAnaliticoPerformanceCSV);

  /*
    Funcionalidade: Exibir relatório de performance na tela.
    Quem usa: flex-channel.
  */
  server.get("/relatorio/performance", relatorioService.buscaAnaliticoPerformance);

  /*
    Funcionalidade: Mostrar o relatório de pausas com paginação.
    Quem usa: flex-channel.
  */
  server.get("/relatorio/pausa", relatorioService.buscaTodasPausas);

  /*
    Funcionalidade: Fazer o download do relatório em pdf.
    Quem usa: flex-channel.
  */
  server.get("/relatorio/pausa/csv", relatorioService.buscaTodasPausasCsv);

  /*
  Funcionalidade: Fazer o download dos resumos gerados pelo Watson em excel.
  Quem usa: flex-channel.
  */
  server.get("/relatorio/resumobot/csv", relatorioService.buscarResumosBotCSV);

  /*
    Funcionalidade: Retornar os valores do Relatório sintético para construção dos gráficos no frontend
    Quem usa: flex-channel.
  */
  server.get("/relatorio/sintetico/fila", relatorioService.buscaRelatorioSinteticoPorFila);

  /*
    Funcionalidade: Valores para gráficos agrupados por Canal
    Quem usa: flex-channel.
  */
  server.get("/relatorio/sintetico/canal", relatorioService.buscaConversaPorCanal);

  /*
    Funcionalidade: Valores para gráficos agrupados por Atendente
    Quem usa: flex-channel.
  */
  server.get("/relatorio/sintetico/atendente", relatorioService.buscaConversaPorAtendente);

  /*
    Funcionalidade: Gera um relatorio analítico baesado num filtro
    Quem usa: flex-channel.
  */
  server.get("/relatorio/sintetico/filtrado", relatorioService.buscaConversaPorFiltro);
};
