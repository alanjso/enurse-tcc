const ConversaEncerrada = require('../conversa/conversa.model');
const ConversaAtendimento = require('../conversa/conversa_atendimento.model');
const User = require('../user/user-model');
const RelPausa = require('../relatorio-pausa/relatorioPausa-model');
const Performance = require('../util/temposMedios');
const log = require('../util/logs');
const { getDateFormatted, calcDifference, calcDifferenceInSeconds, calcTempoMedio } = require("../util/date-util");
const { exportPdf, exportExcel } = require("./flex-export-client");
const ObjectId = require('mongodb').ObjectID;

const quantidadeDeConversaPorPagina = 10;

module.exports = {
  //Analítico
  buscaTodasConversas: async (req, res) => {
    let pagina = req.query.pagina ? req.query.pagina : 1;
    let fila = req.query.fila ? req.query.fila : 'Todas';
    let dataInicial = req.query.dataInicial;
    let dataFinal = req.query.dataFinal;
    let atendente = req.query.atendente ? req.query.atendente : 'Todos';
    let cpf = req.query.cpf ? req.query.cpf : 'Todos';
    let nomeCliente = req.query.nome ? req.query.nome : 'Todos';
    let celular = req.query.telefone ? req.query.telefone : 'Todos';
    let email = req.query.email ? req.query.email : 'Todos';
    let status = req.query.status ? req.query.status : 'Todos';
    // Novos filtros SOMA
    let atendimentoBot = req.query.atendimentoBot ? req.query.atendimentoBot : 'Todos';
    let sucessoAtendimento = req.query.sucessoAtendimento ? req.query.sucessoAtendimento : 'Todos';
    let situacao = req.query.situacao ? req.query.situacao : 'Todos';
    let encerrada_por = req.query.encerradaPor ? req.query.encerradaPor : 'Todos';
    let satisfacao = req.query.satisfacao ? req.query.satisfacao : 'Todos';
    let canal = req.query.canal ? req.query.canal : 'Todos';
    let isMobile = req.query.isMobile ? req.query.isMobile : 'Todos';

    let query = {
      hora_criacao: {
        $gte: new Date(dataInicial + "T00:00:00Z"),
        $lt: new Date(dataFinal + "T23:59:59Z")
      }
    };

    if (fila != "Todas") query["fila"] = fila;
    if (atendente != "Todos") query["atendente._id"] = atendente;
    if (cpf !== "" && cpf !== "Todos") query["cliente.cpf"] = cpf;
    if (nomeCliente !== "" && nomeCliente !== "Todos") query["cliente.nome"] = nomeCliente;
    if (celular !== "" && celular !== "Todos") query["cliente.celular"] = celular;
    if (email !== "" && email !== "Todos") query["cliente.email"] = email;
    if (status !== "" && status !== "Todos") query["status"] = status;
    // Novos Filtros SOMA
    if (atendimentoBot !== undefined && atendimentoBot !== "" && atendimentoBot != "Todos") {
      query["atendimentoBot"] = atendimentoBot == 'true' ? true : false;
    }
    if (sucessoAtendimento !== undefined && sucessoAtendimento !== "" && sucessoAtendimento != "Todos") {
      query["sucessoAtendimento"] = sucessoAtendimento == 'true' ? true : false;
    }
    if (isMobile !== undefined && isMobile !== "" && isMobile != "Todos") {
      query["isMobile"] = isMobile == 'true' ? true : false;
    }
    if (situacao !== "" && situacao !== "Todos") query["situacao"] = situacao;
    if (encerrada_por !== "" && encerrada_por !== "Todos") query["encerrada_por"] = encerrada_por;
    if (satisfacao !== "" && satisfacao !== "Todos") query["satisfacao_do_cliente"] = satisfacao;
    if (canal !== "" && canal !== "Todos") query["canal"] = canal;
    try {
      let quantidadeDeConversas = await ConversaEncerrada.find(query).countDocuments();

      let conversas = await ConversaEncerrada.find(query)
        .skip(quantidadeDeConversaPorPagina * (pagina - 1))
        .limit(quantidadeDeConversaPorPagina);

      res.json({ conversas, quantidadeDeConversas });
    } catch (err) {
      console.log(err);
      res.status(500).json();
    }
  },

  buscaTodasAsConversasPdf: async (req, res) => {
    //console.log("buscaTodasAsConversasPdf");

    let fila = req.query.fila;
    let dataInicial = req.query.dataInicial;
    let dataFinal = req.query.dataFinal;
    let atendente = req.query.atendente;
    let cpf = req.query.cpf;

    let query = {
      hora_criacao: {
        $gte: new Date(dataInicial + "T00:00:00Z"),
        $lt: new Date(dataFinal + "T23:59:59Z")
      }
    };

    if (fila !== "" && fila !== "Todas") query["fila"] = fila;

    if (atendente !== "" && atendente !== "Todos")
      query["atendente._id"] = atendente;

    if (cpf !== "" && cpf !== "Todos") query["cliente.cpf"] = cpf;

    let conversas = await ConversaEncerrada.find(query);

    var fonts = {
      Roboto: {
        normal: "./api/relatorio/Roboto-Regular.ttf",
        bold: "./api/relatorio/Roboto-Medium.ttf",
        italics: "./api/relatorio/Roboto-Italic.ttf",
        bolditalics: "./api/relatorio/Roboto-MediumItalic.ttf"
      }
    };

    let convDateFormat = conversas;

    convDateFormat = conversas.map(conversa => {
      conversa.hora_criacao_date_format = getDateFormatted(
        conversa.hora_criacao
      );
      conversa.hora_do_atendimento_date_format = getDateFormatted(
        conversa.hora_do_atendimento
      );
      conversa.hora_fim_conversa_date_format = getDateFormatted(
        conversa.hora_fim_conversa
      );
      conversa.tempo_espera = calcDifference(
        conversa.hora_criacao,
        conversa.hora_do_atendimento
      );
      conversa.tempo_atendimento = calcDifference(
        conversa.hora_do_atendimento,
        conversa.hora_fim_conversa
      );
      return conversa;
    });

    let body = [];

    convDateFormat.forEach(conversa => {
      body.push([
        conversa["cliente"] ? conversa["cliente"]["nome"] : '',
        conversa["cliente"] ? conversa["cliente"]["email"] : '',
        conversa["cliente"] ? conversa["cliente"]["cpf"] : '',
        conversa["cliente"] ? conversa["cliente"]["celular"] : '',
        conversa.satisfacao_do_cliente,
        conversa["atendente"] ? conversa["atendente"]["name"] : '',
        conversa["atendente"] ? conversa["atendente"]["codigoDoAgente"] : '',
        conversa.fila,
        conversa.canal,
        conversa.hora_criacao_date_format,
        conversa.hora_do_atendimento_date_format,
        conversa.tempo_espera,
        conversa.hora_fim_conversa_date_format,
        conversa.tempo_atendimento,
        conversa.produto,
        conversa.assunto,
        conversa.status,
        conversa.setor,
        conversa.observacao,
        conversa.stringResumoBot,
        conversa.situacao,
        conversa.atendimentoBot ? 'Sim' : 'Não',
        conversa.sucessoAtendimento ? 'Sim' : 'Não',
        conversa.encerrada_por,
      ]);
    });

    header = [
      "Nome do cliente",
      "Email do cliente",
      "Cpf do cliente",
      "Telefone do cliente",
      "Satisfação do Cliente",
      "Atendente",
      "Código do Agente",
      "Fila",
      "Canal",
      "Criação da conversa",
      "Inicio do atendimento",
      "Tempo de espera",
      "Fim do atendimento",
      "Tempo de atendimento",
      "Produto",
      "Assunto",
      "Status",
      "Setor",
      "Observação",
      "Resumo",
      "Situacao",
      "Atendimento Bot",
      "Sucesso",
      "Encerrada Por",
    ];

    exportPdf("relatorio_conversas.pdf", "Conversas", header, body, res);
  },

  buscaTodasAsConversasCSV: async (req, res) => {
    //("buscaTodasAsConversasCSV");

    let fila = req.query.fila ? req.query.fila : 'Todas';
    let dataInicial = req.query.dataInicial;
    let dataFinal = req.query.dataFinal;
    let atendente = req.query.atendente ? req.query.atendente : 'Todos';
    let cpf = req.query.cpf ? req.query.cpf : 'Todos';
    let nome = req.query.nome ? req.query.nome : 'Todos';
    let telefone = req.query.telefone ? req.query.telefone : 'Todos';
    let status = req.query.status ? req.query.status : 'Todos';
    // Novos filtros SOMA
    let atendimentoBot = req.query.atendimentoBot ? req.query.atendimentoBot : 'Todos';
    let sucessoAtendimento = req.query.sucessoAtendimento ? req.query.sucessoAtendimento : 'Todos';
    let situacao = req.query.situacao ? req.query.situacao : 'Todos';
    let encerrada_por = req.query.encerradaPor ? req.query.encerradaPor : 'Todos';
    let satisfacao = req.query.satisfacao ? req.query.satisfacao : 'Todos';
    let canal = req.query.canal ? req.query.canal : 'Todos';
    let isMobile = req.query.isMobile ? req.query.isMobile : 'Todos';

    let query = {
      hora_criacao: {
        $gte: new Date(dataInicial + "T00:00:00Z"),
        $lt: new Date(dataFinal + "T23:59:59Z")
      }
    };

    if (fila !== "" && fila !== "Todas") query["fila"] = fila;
    if (atendente !== "" && atendente !== "Todos") query["atendente._id"] = atendente;
    if (cpf !== "" && cpf !== "Todos") query["cliente.cpf"] = cpf;
    if (nome !== "" && nome !== "Todos") query["cliente.nome"] = nome;
    if (telefone !== "" && telefone !== "Todos") query["cliente.celular"] = telefone;
    if (status !== "" && status !== "Todos") query["status"] = status;
    // Novos Filtros SOMA
    if (atendimentoBot !== undefined && atendimentoBot !== "" && atendimentoBot != "Todos") {
      query["atendimentoBot"] = atendimentoBot == 'true' ? true : false;
    }
    if (sucessoAtendimento !== undefined && sucessoAtendimento !== "" && sucessoAtendimento != "Todos") {
      query["sucessoAtendimento"] = sucessoAtendimento == 'true' ? true : false;
    }
    if (isMobile !== undefined && isMobile !== "" && isMobile != "Todos") {
      query["isMobile"] = isMobile == 'true' ? true : false;
    }
    if (situacao !== "" && situacao !== "Todos") query["situacao"] = situacao;
    if (encerrada_por !== "" && encerrada_por !== "Todos") query["encerrada_por"] = encerrada_por;
    if (satisfacao !== "" && satisfacao !== "Todos") query["satisfacao_do_cliente"] = satisfacao;
    if (canal !== "" && canal !== "Todos") query["canal"] = canal;

    let conversas = await ConversaEncerrada.find(query);
    let convDateFormat = conversas;

    let mediaSatisfacao = 0;
    let countSatisfacao = 0;
    let tma = 0;
    let tme = 0;
    let tmd = 0;
    let countTime = 0;
    let countTMD = 0;

    convDateFormat = conversas.map(conversa => {
      // Formata as datas para exibição humanizada
      conversa.hora_criacao_date_format = getDateFormatted(conversa.hora_criacao);
      conversa.hora_do_atendimento_date_format = getDateFormatted(conversa.hora_do_atendimento);
      conversa.hora_fim_conversa_date_format = getDateFormatted(conversa.hora_fim_conversa);
      conversa.tempo_espera = calcDifference(conversa.hora_criacao, conversa.hora_do_atendimento);
      conversa.tempo_atendimento = calcDifference(conversa.hora_do_atendimento, conversa.hora_fim_conversa);

      if (conversa.hora_criacao && conversa.hora_do_atendimento && conversa.hora_fim_conversa) {
        // TME
        tme = tme + calcDifferenceInSeconds(conversa.hora_criacao, conversa.hora_do_atendimento);
        // TMA
        tma = tma + calcDifferenceInSeconds(conversa.hora_do_atendimento, conversa.hora_fim_conversa);
        // Total de atendimentos
        countTime++;
      } else if (conversa.hora_criacao && !conversa.hora_do_atendimento && conversa.hora_fim_conversa) {
        // TMD
        tmd = tmd + calcDifferenceInSeconds(conversa.hora_criacao, conversa.hora_fim_conversa);
        // Total de desistencias
        countTMD++;
      }

      if (conversa.satisfacao_do_cliente) {
        mediaSatisfacao = mediaSatisfacao + conversa.satisfacao_do_cliente;
        countSatisfacao++;
      }

      // Formata resumo bot para exibição humanizada
      if (conversa.resumoBot) {
        conversa.stringResumoBot = '';
        conversa.resumoBot.forEach(resumo => {
          conversa.stringResumoBot = conversa.stringResumoBot + `${resumo.id} - ${resumo.value} |`
        });
      }

      return conversa;
    });

    let body = [];

    convDateFormat.forEach(conversa => {
      body.push([
        conversa["cliente"] ? conversa["cliente"]["nome"] : '',
        conversa["cliente"] ? conversa["cliente"]["email"] : '',
        conversa["cliente"] ? conversa["cliente"]["cpf"] : '',
        conversa["cliente"] ? conversa["cliente"]["celular"] : '',
        conversa.satisfacao_do_cliente,
        conversa["atendente"] ? conversa["atendente"]["name"] : '',
        conversa["atendente"] ? conversa["atendente"]["codigoDoAgente"] : '',
        conversa.fila,
        conversa.canal,
        conversa.hora_criacao_date_format,
        conversa.hora_do_atendimento_date_format,
        conversa.tempo_espera,
        conversa.hora_fim_conversa_date_format,
        conversa.tempo_atendimento,
        conversa.produto,
        conversa.assunto,
        conversa.status,
        conversa.setor,
        conversa.observacao,
        conversa.stringResumoBot,
        conversa.situacao,
        conversa.atendimentoBot ? 'Sim' : 'Não',
        conversa.sucessoAtendimento ? 'Sim' : 'Não',
        conversa.encerrada_por,
        conversa.isMobile ? 'Celular' : 'Computador',
        conversa.plataforma,
        conversa.navegador,
      ]);
    });

    // Conversa Fake para inserir TMA, TME e Média de satisfação do cliente
    body.push([
      'Totais e Médias', //Nome
      '---------------', // Email
      '---------------', // CPF
      `Satisfação média de ${countSatisfacao} conversas =>`, // Celular
      countSatisfacao > 0 ? `${(mediaSatisfacao / countSatisfacao)}` : '0', // Média satisfacao_do_cliente,
      '---------------', // Nome atendente
      '---------------', // Cod agente
      '---------------', // Fila
      '---------------', // Canal
      '---------------', // hora_criacao_date_format
      `TME e TMA em ${countTime} conversas =>`, // .hora_do_atendimento_date_format,
      `TME: ${calcTempoMedio(tme, countTime)}`, // .tempo_espera,
      '', // .hora_fim_conversa_date_format,
      `TMA: ${calcTempoMedio(tma, countTime)}`, // .tempo_atendimento,
      '---------------', // .produto,
      '---------------', // .assunto,
      '---------------', // .status,
      `TMD em ${countTMD} conversas =>`, // .setor,
      `TMD: ${calcTempoMedio(tmd, countTMD)}`, // .observacao,
      '---------------', // .stringResumoBot
      '---------------', // situação
      '---------------', // atendimentoBot
      '---------------', // sucessoAtendimento
      '---------------', // encerrada por
      '---------------',
      '---------------',
      '---------------',
    ]);

    header = [
      "Nome do cliente",
      "Email do cliente",
      "Cpf do cliente",
      "Telefone do cliente",
      "Satisfação do Cliente",
      "Atendente",
      "Código do Agente",
      "Fila",
      "Canal",
      "Criação da conversa",
      "Inicio do atendimento",
      "Tempo de espera",
      "Fim do atendimento",
      "Tempo de atendimento",
      "Produto",
      "Assunto",
      "Status",
      "Setor",
      "Observação",
      "Resumo",
      "Situacao",
      "Atendimento Bot",
      "Sucesso",
      "Encerrada Por",
      "Aparelho",
      "Sistema",
      "Navegador",
    ];

    exportExcel("relatorio_conversas.xls", "Conversas", header, body, res);
  },

  buscaTodasPausas: async (req, res) => {
    let pagina = req.query.pagina ? req.query.pagina : 1;
    let dataInicial = req.query.dataInicial;
    let dataFinal = req.query.dataFinal;
    let usuario = req.query.usuario ? req.query.usuario : 'Todos';
    let tipoPausa = req.query.tipoPausa ? req.query.tipoPausa : 'Todos';
    let isClosed = req.query.isClosed ? req.query.isClosed : 'Todos';

    let query = {
      inicio_pausa: {
        $gte: new Date(dataInicial + "T00:00:00Z"),
        $lt: new Date(dataFinal + "T23:59:59Z")
      }
    };

    if (usuario != "Todos") query["usuario._id"] = usuario;
    if (tipoPausa != "Todos") query["tipoPausa._id"] = tipoPausa;
    if (isClosed !== undefined && isClosed !== "" && isClosed != "Todos") {
      query["isClosed"] = isClosed == 'true' ? true : false;
    }
    try {
      let quantidadeDePausas = await RelPausa.find(query).countDocuments();

      let pausas = await RelPausa.find(query)
        .skip(quantidadeDeConversaPorPagina * (pagina - 1))
        .limit(quantidadeDeConversaPorPagina);

      res.json({ pausas, quantidadeDePausas });
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },

  buscaTodasPausasCsv: async (req, res) => {
    let dataInicial = req.query.dataInicial;
    let dataFinal = req.query.dataFinal;
    let usuario = req.query.usuario ? req.query.usuario : 'Todos';
    let tipoPausa = req.query.tipoPausa ? req.query.tipoPausa : 'Todos';
    let isClosed = req.query.isClosed ? req.query.isClosed : 'Todos';

    let query = {
      inicio_pausa: {
        $gte: new Date(dataInicial + "T00:00:00Z"),
        $lt: new Date(dataFinal + "T23:59:59Z")
      }
    };

    if (usuario != "Todos") query["usuario._id"] = usuario;
    if (tipoPausa != "Todos") query["tipoPausa._id"] = tipoPausa;
    if (isClosed !== undefined && isClosed !== "" && isClosed != "Todos") {
      query["isClosed"] = isClosed == 'true' ? true : false;
    }

    let header = [
      "Atendente",
      "Tipo de Pausa",
      "Horário de Início",
      "Horário de Fim",
      "Situação",
    ];
    let body = [];
    let pausas = await RelPausa.find(query);

    if (pausas.length > 0) {
      pausas.forEach(pausa => {
        body.push([
          pausa.usuario.nome,
          pausa.tipoPausa.nome,
          getDateFormatted(pausa.inicio_pausa),
          getDateFormatted(pausa.encerramento_pausa),
          pausa.isClosed ? 'Fechada' : 'Aberta',
        ]);
      });
    }

    exportExcel(`Pausas ${dataInicial} - ${dataFinal}.xls`, "Pausas", header, body, res);
  },
  buscarResumosBotCSV: async (req, res) => {
    let fila = req.query.fila;
    let dataInicial = req.query.dataInicial;
    let dataFinal = req.query.dataFinal;
    let atendente = req.query.atendente;
    let cpf = req.query.cpf;
    let nome = req.query.nome;
    let telefone = req.query.telefone;
    let status = req.query.status;

    let query = {
      hora_criacao: {
        $gte: new Date(dataInicial + "T00:00:00Z"),
        $lt: new Date(dataFinal + "T23:59:59Z")
      }
    };

    if (fila !== "" && fila !== "Todas") query["fila"] = fila;

    if (atendente !== "" && atendente !== "Todos") query["atendente._id"] = atendente;

    if (cpf !== "" && cpf !== "Todos") query["cliente.cpf"] = cpf;

    if (nome !== "" && nome !== "Todos") query["cliente.nome"] = nome;

    if (telefone !== "" && telefone !== "Todos") query["cliente.celular"] = telefone;

    if (status !== "" && status !== "Todos") query["status"] = status;

    let body = [];
    let header = [];
    let resumos = [];

    let conversas = await ConversaEncerrada.find(query);

    if (conversas.length > 0) {
      // para cada id fazer um push no header com seu nome de campo
      conversas.forEach(conversa => {
        if (conversa.resumoBot.length > 0) {
          resumos.push(conversa.resumoBot);
        }
      });

      if (resumos.length > 0) {
        resumos[0].forEach(res => {
          header.push(res.id);
        });

        resumos.forEach(resumo => {
          let res = [];
          resumo.forEach(valor => {
            res.push(valor.value);
          });
          body.push(res);
        });
      }

      //console.log(`=====> Resumo Bot Header: ${header}`);
      //console.log(`=====> Resumo Bot Body: ${body}`);
      if (header.length > 0) {
        exportExcel("relatorio_conversas.xls", "Conversas", header, body, res);
      } else {
        return res.json({ "error": "Nenhuma conversa com resumo bot salvo" });
      }
    } else {
      return res.json({ "error": "Nenhum resultado encontrado" });
    }
  },

  buscaAnaliticoPerformance: async (req, res) => {
    let fila = req.query.fila;
    let dataInicial = req.query.dataInicial;
    let dataFinal = req.query.dataFinal;
    let cpf = req.query.cpf;
    let nome = req.query.nome;
    let telefone = req.query.telefone;
    let status = req.query.status;
    let atendimentoBot = req.query.atendimentoBot;
    let sucessoAtendimento = req.query.sucessoAtendimento;
    let situacao = req.query.situacao;
    let encerrada_por = req.query.encerradaPor
    let satisfacao = req.query.satisfacao
    let canal = req.query.canal;
    let apenasAtivos = req.query.apenasAtivos;

    let query = {
      hora_criacao: {
        $gte: new Date(dataInicial + "T00:00:00Z"),
        $lt: new Date(dataFinal + "T23:59:59Z")
      }
    };

    if (fila !== "" && fila !== "Todas") query["fila"] = fila;
    // if (atendente !== "" && atendente !== "Todos") query["atendente._id"] = atendente;
    if (cpf !== "" && cpf !== "Todos") query["cliente.cpf"] = cpf;
    if (nome !== "" && nome !== "Todos") query["cliente.nome"] = nome;
    if (telefone !== "" && telefone !== "Todos") query["cliente.celular"] = telefone;
    if (status !== "" && status !== "Todos") query["status"] = status;
    if (atendimentoBot !== undefined && atendimentoBot !== "" && atendimentoBot != "Todos") {
      query["atendimentoBot"] = atendimentoBot == 'true' ? true : false;
    }
    if (sucessoAtendimento !== undefined && sucessoAtendimento !== "" && sucessoAtendimento != "Todos") {
      query["sucessoAtendimento"] = sucessoAtendimento == 'true' ? true : false;
    }
    if (situacao !== "" && situacao !== "Todos") query["situacao"] = situacao;
    if (encerrada_por !== "" && encerrada_por !== "Todos") query["encerrada_por"] = encerrada_por;
    if (satisfacao !== "" && satisfacao !== "Todos") query["satisfacao_do_cliente"] = satisfacao;
    if (canal !== "" && canal !== "Todos") query["canal"] = canal;
    if (apenasAtivos !== undefined && apenasAtivos !== "" && apenasAtivos != "Todos") {
      apenasAtivos = apenasAtivos == 'true' ? true : false;
    }

    let body = [];
    let atendentes = []

    if (apenasAtivos == true) {
      atendentes = await User.find({ 'userAtivo': true });
    } else if (apenasAtivos == false) {
      atendentes = await User.find();
    }

    if (atendentes.length > 0) {
      for (const atendente of atendentes) {
        query["atendente._id"] = atendente._id;
        let conversas = await ConversaEncerrada.find(query);
        body.push(Performance.getPerformanceOperador(atendente.nome, conversas));
      }
    }
    res.status(200).json({ performance: body });
  },

  buscaAnaliticoPerformanceCSV: async (req, res) => {
    let fila = req.query.fila;
    let dataInicial = req.query.dataInicial;
    let dataFinal = req.query.dataFinal;
    let cpf = req.query.cpf;
    let nome = req.query.nome;
    let telefone = req.query.telefone;
    let status = req.query.status;
    let atendimentoBot = req.query.atendimentoBot;
    let sucessoAtendimento = req.query.sucessoAtendimento;
    let situacao = req.query.situacao;
    let encerrada_por = req.query.encerradaPor
    let satisfacao = req.query.satisfacao
    let canal = req.query.canal;
    let apenasAtivos = req.query.apenasAtivos;

    let query = {
      hora_criacao: {
        $gte: new Date(dataInicial + "T00:00:00Z"),
        $lt: new Date(dataFinal + "T23:59:59Z")
      }
    };

    if (fila !== "" && fila !== "Todas") query["fila"] = fila;
    // if (atendente !== "" && atendente !== "Todos") query["atendente._id"] = atendente;
    if (cpf !== "" && cpf !== "Todos") query["cliente.cpf"] = cpf;
    if (nome !== "" && nome !== "Todos") query["cliente.nome"] = nome;
    if (telefone !== "" && telefone !== "Todos") query["cliente.celular"] = telefone;
    if (status !== "" && status !== "Todos") query["status"] = status;
    if (atendimentoBot !== undefined && atendimentoBot !== "" && atendimentoBot != "Todos") {
      query["atendimentoBot"] = atendimentoBot == 'true' ? true : false;
    }
    if (sucessoAtendimento !== undefined && sucessoAtendimento !== "" && sucessoAtendimento != "Todos") {
      query["sucessoAtendimento"] = sucessoAtendimento == 'true' ? true : false;
    }
    if (situacao !== "" && situacao !== "Todos") query["situacao"] = situacao;
    if (encerrada_por !== "" && encerrada_por !== "Todos") query["encerrada_por"] = encerrada_por;
    if (satisfacao !== "" && satisfacao !== "Todos") query["satisfacao_do_cliente"] = satisfacao;
    if (canal !== "" && canal !== "Todos") query["canal"] = canal;
    if (apenasAtivos !== undefined && apenasAtivos !== "" && apenasAtivos != "Todos") {
      apenasAtivos = apenasAtivos == 'true' ? true : false;
    }

    header = [
      "Atendente",
      "Quantidade de Conversas Satisfação",
      "Satisfação Média",
      "Quantidade de Conversas Total",
      "Quantidade de Conversas TMA/TME/TTA",
      "TMA",
      "TME",
      "TTA",
    ];

    let body = [];
    let atendentes = []

    if (apenasAtivos == true) {
      atendentes = await User.find({ 'userAtivo': true });
    } else if (apenasAtivos == false) {
      atendentes = await User.find();
    }

    if (atendentes.length > 0) {
      for (const atendente of atendentes) {
        query["atendente._id"] = atendente._id;
        let conversas = await ConversaEncerrada.find(query);
        body.push(Performance.getPerformanceOperador(atendente.nome, conversas));
      }
    }

    // Total | Qtde Conversas | TTA | TMA | TTE
    // 9 colunas para por as tabelas abaixo

    // Conversas por Situação | Quantidade
    // encerrada                   428
    // em_atendimento               0
    // transferida                  0
    // nao_atendida                 0
    // abandonada                  175

    // Indicadores            | Duração
    // TMA do BOT               0:03:30
    // TMA dos Operadores       0:50:39
    // TMA Geral                0:05:37
    // TME do BOT               0:00:00
    // TME dos Operadores       1:39:17
    // TME Geral                0:04:27

    // Conversas Encerradas por: | Quantidade
    // CLIENTE                       175
    // ATENDENTE                     428
    // BOT                            0
    // OCIOSIDADE                     0
    // ADMINISTRADOR                  0

    // Conversas por: | Atendimento BOT Sucesso | Atendimento BOT
    // Sim                      401                     0
    // Não                      202                    603

    exportExcel(`Perfomance ${dataInicial} - ${dataFinal}.xls`, "Performance", header, body, res);
  },
  //Sintético(s)
  buscaConversaPorFila: async (req, res) => {
    ConversaEncerrada.aggregate(
      [{ $group: { _id: "$fila", count: { $sum: 1 } } }],
      function (err, result) {
        console.log(result);
        res.json(result);
      }
    );

    //db.conversas.aggregate({$group:{_id:'$fila',count:{$sum:1}}});

    /*
        try {
            let conversas = await Conversa.find({ "fila": req.body.fila });
            res.json(conversas);
        } catch (err) {
            res.status(500).json();
        }
        */
  },

  buscaConversaPorCanal: async (req, res) => {
    try {
      let dataInicial = req.query.dataInicial;
      let dataFinal = req.query.dataFinal;

      let conversasFinalizadas = await ConversaEncerrada.aggregate([
        {
          $match: {
            encerrada: true,
            situacao: 'encerrada',
            hora_criacao: {
              $gte: new Date(dataInicial + "T00:00:00Z"),
              $lt: new Date(dataFinal + "T23:59:59Z")
            }
          }
        },
        {
          $group: {
            _id: "$canal",
            count: { $sum: 1 }
          }
        }
      ]);

      let conversasAbandonadas = await ConversaEncerrada.aggregate([
        {
          $match: {
            encerrada: true,
            situacao: 'abandonada',
            hora_criacao: {
              $gte: new Date(dataInicial + "T00:00:00Z"),
              $lt: new Date(dataFinal + "T23:59:59Z")
            }
          }
        },
        {
          $group: {
            _id: "$canal",
            count: { $sum: 1 }
          }
        }
      ]);

      let conversasNaoAtendidas = await ConversaEncerrada.aggregate([
        {
          $match: {
            situacao: {
              $in: ['transferida', 'nao_atendida']
            },
            hora_criacao: {
              $gte: new Date(dataInicial + "T00:00:00Z"),
              $lt: new Date(dataFinal + "T23:59:59Z")
            }
          }
        },
        {
          $group: {
            _id: "$canal",
            count: { $sum: 1 }
          }
        }
      ]);

      res.status(200).json({ conversasFinalizadas, conversasAbandonadas, conversasNaoAtendidas });
    } catch (error) {
      log.error(`** Erro Relatório Sintético por CANAL **`);
      log.error(`** Erro: ${error} **`);
    }
  },

  buscaConversaPorAtendente: async (req, res) => {
    try {

      let dataInicial = req.query.dataInicial;
      let dataFinal = req.query.dataFinal;

      let conversasFinalizadas = await ConversaEncerrada.aggregate([
        {
          $match: {
            encerrada: true,
            situacao: 'encerrada',
            hora_criacao: {
              $gte: new Date(dataInicial + "T00:00:00Z"),
              $lt: new Date(dataFinal + "T23:59:59Z")
            }
          }
        },
        {
          $group: {
            _id: "$atendente.name",
            count: { $sum: 1 }
          }
        }
      ]);

      let conversasAbandonadas = await ConversaEncerrada.aggregate([
        {
          $match: {
            encerrada: true,
            situacao: 'abandonada',
            hora_criacao: {
              $gte: new Date(dataInicial + "T00:00:00Z"),
              $lt: new Date(dataFinal + "T23:59:59Z")
            }
          }
        },
        {
          $group: {
            _id: "$atendente.name",
            count: { $sum: 1 }
          }
        }
      ]);

      let conversasNaoAtendidas = await ConversaAtendimento.aggregate([
        {
          $match: {
            situacao: {
              $in: ['transferida', 'nao_atendida']
            },
            hora_criacao: {
              $gte: new Date(dataInicial + "T00:00:00Z"),
              $lt: new Date(dataFinal + "T23:59:59Z")
            }
          }
        },
        {
          $group: {
            _id: "$atendente.name",
            count: { $sum: 1 }
          }
        }
      ]);

      res.status(200).json({ conversasFinalizadas, conversasAbandonadas, conversasNaoAtendidas });
    } catch (error) {
      log.error('** Erro no relatorio sintetico por ATENDENTE **');
      log.error(`** Erro: ${error} **`);
    }
  },

  buscaRelatorioSinteticoPorFila: async (req, res) => {
    try {

      let dataInicial = req.query.dataInicial;
      let dataFinal = req.query.dataFinal;

      let conversasFinalizadas = await ConversaEncerrada.aggregate([
        {
          $match: {
            encerrada: true,
            situacao: 'encerrada',
            hora_criacao: {
              $gte: new Date(dataInicial + "T00:00:00Z"),
              $lt: new Date(dataFinal + "T23:59:59Z")
            }
          }
        },
        {
          $group: {
            _id: "$fila",
            count: { $sum: 1 }
          }
        }
      ]);

      let conversasAbandonadas = await ConversaEncerrada.aggregate([
        {
          $match: {
            encerrada: true,
            situacao: 'abandonada',
            hora_criacao: {
              $gte: new Date(dataInicial + "T00:00:00Z"),
              $lt: new Date(dataFinal + "T23:59:59Z")
            }
          }
        },
        {
          $group: {
            _id: "$fila",
            count: { $sum: 1 }
          }
        }
      ]);

      let conversasNaoAtendidas = await ConversaAtendimento.aggregate([
        {
          $match: {
            situacao: {
              $in: ['transferida', 'nao_atendida']
            },
            hora_criacao: {
              $gte: new Date(dataInicial + "T00:00:00Z"),
              $lt: new Date(dataFinal + "T23:59:59Z")
            }
          }
        },
        {
          $group: {
            _id: "$fila",
            count: { $sum: 1 }
          }
        }
      ]);

      res.status(200).json({ conversasFinalizadas, conversasAbandonadas, conversasNaoAtendidas });
    } catch (error) {
      log.error('** Erro no relatorio sintetico por FILA **');
      log.error(`** Erro: ${error} **`);
    }
  },

  buscaConversaPorFiltro: async (req, res) => {
    let dataInicial = req.query.dataInicial;
    let dataFinal = req.query.dataFinal;
    let group = req.query.group;
    let fila = req.query.fila;
    let atendente = req.query.atendente;
    let status = req.query.status;
    let encerrada = req.query.encerrada;
    let situacao = req.query.situacao;
    let setor = req.query.setor;
    let produto = req.query.produto;
    let assunto = req.query.assunto;
    let canal = req.query.canal;
    let atendimentoBot = req.query.atendimentoBot;
    let satisfacao = req.query.satisfacao;

    let match = {
      hora_criacao: {
        $gte: new Date(dataInicial + "T00:00:00Z"),
        $lt: new Date(dataFinal + "T23:59:59Z")
      }
    };

    if (group == 'atendente') group = 'atendente.name';
    if (fila !== undefined && fila !== "" && fila != "Todas") match["fila"] = fila;
    if (atendente !== undefined && atendente !== "" && atendente != "Todos") match["atendente._id"] = ObjectId(atendente);
    if (situacao !== undefined && situacao !== "" && situacao != "Todos") match["situacao"] = situacao;
    if (status !== undefined && status !== "" && status !== "Todos") match["status"] = status;
    if (setor !== undefined && setor !== "" && setor !== "Todos") match["setor"] = setor;
    if (produto !== undefined && produto !== "" && produto !== "Todos") match["produto"] = produto;
    if (assunto !== undefined && assunto !== "" && assunto !== "Todos") match["assunto"] = assunto;
    if (canal !== undefined && canal !== "" && canal !== "Todos") match["canal"] = canal;
    if (encerrada !== undefined && encerrada !== "" && encerrada != "Todos") {
      match["encerrada"] = encerrada == 'true' ? true : false;
    }
    if (satisfacao !== undefined && satisfacao !== "" && satisfacao !== "Todos") match["satisfacao"] = satisfacao;
    if (atendimentoBot !== undefined && atendimentoBot !== "" && atendimentoBot != "Todos") {
      match["atendimentoBot"] = atendimentoBot == 'true' ? true : false;
    }

    try {
      let conversasFiltradas;
      // if (situacao == 'encerrada') {
      conversasFiltradas = await ConversaEncerrada.aggregate([
        {
          $match: match
        },
        {
          $group: {
            _id: `$${group}`,
            count: { $sum: 1 }
          }
        }
      ]);
      // } else {
      //   conversasFiltradas = await ConversaAtendimento.aggregate([
      //     {
      //       $match: match
      //     },
      //     {
      //       $group: {
      //         _id: `$${group}`,
      //         count: { $sum: 1 }
      //       }
      //     }
      //   ]);
      // }
      res.status(200).json({ conversasFiltradas });
    } catch (error) {
      log.error('** Erro no relatorio sintetico por FILTRO **');
      log.error(`** Erro: ${error} **`);
    }
  }
};