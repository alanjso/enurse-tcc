const log = require('../util/logs')
const config = require("config");
const ConversaAtendimento = require('./conversa_atendimento.model');
const ConversaEncerrada = require("./conversa.model");
const Contato = require("../contato/contato.model");
const eventEmit = require('../util/eventEmmiter');
const FlexIA = require("../../FlexIA/Assistente");
const Fila = require('../fila/fila-model');
const rp = require('request-promise-native');
const Usuario = require("../user/user-model");
const ConfigGeral = require('../configuracao/configuracao.model');
const getConfigs = require('config');
const limpaCache = require('../util/limpaCache');
const LogFlexia = require('../../FlexIA/log-flexia-model');
const enviaImageWhatsApp = require('./whatsapp/envia-imagem-whatsapp');
let urlFacebook = ''; // 'https://graph.facebook.com/v2.6/me/messages';
let configFacebook;
let configWhatsapp;
let configWatson;
let flexIA;

async function atualizaCredenciaisCanais() {
  // Inicializando constantes para utilizar no código
  try {
    let config = await ConfigGeral.findOne();
    configFacebook = config.facebook;
    configWhatsapp = config.whatsapp;
    configWatson = config.watson;
    urlFacebook = configFacebook ? configFacebook.urlFacebook : 'Sem URL cadastrada para Facebook';
    if (configWatson) {
      if (configWatson.apiKey) {
        if (configWatson.assistantId) {
          flexIA = new FlexIA(configWatson.apiKey, configWatson.assistantId);
        }
      }
    }
  } catch (error) {
    log.error('** Erro ao atualizar credenciais dos Canais **');
    log.error(`** Erro: ${error} **`);
  }
}

let request = require("request");

(function usaSalesforce() {
  return config.get("usa_salesforce")
    ? (sendToSalesforce = require("../services/sendToSalesforce"))
    : "";
})();

const mensageria = require("../services/servicoRabbitMQ");
const makeSFUpdateCase = obj =>
  new Promise((resolve, reject) => {
    try {
      const obj_sf = {};
      obj_sf.assunto = obj.assunto;
      obj_sf.idSF = obj.idSF;
      obj_sf.observacao = obj.observacao;
      obj_sf.fila = obj.fila;
      obj_sf.canal = obj.canal;
      resolve(obj_sf);
    } catch (err) {
      log.error(err);
    }
  });

async function enviarFacebook(mensagem, userID) {
  await rp({
    uri: urlFacebook,
    qs: { access_token: configFacebook.facebook_access_token },
    method: 'POST',
    json: {
      recipient: { id: userID },
      message: { text: mensagem }
    }
  })
}

async function enviarArquivoFacebook(urlArquivo, userID, type) {
  await rp({
    uri: urlFacebook,
    qs: { access_token: configFacebook.facebook_access_token },
    method: 'POST',
    json: {
      recipient: { id: userID },
      message: {
        attachment: {
          type: type,
          payload: { url: urlArquivo, is_reusable: true }
        }
      }
    }
  })
}

module.exports = {
  adicionaMensagem: async (req, res) => {
    await atualizaCredenciaisCanais();

    console.log('Link: ', req.body);

    let idDaConversa = req.body.idDaConversa;

    let conversa = await ConversaAtendimento.findById(idDaConversa);

    conversa.mensagens.push(req.body.mensagem);

    try {
      await ConversaAtendimento.findOneAndUpdate({ _id: req.body.idDaConversa }, conversa);
      if (conversa.canal === 'telegram') {
        //console.log('Enviado Mensagem Telegram');
        // await telegramBot.sendMessage(req.body.id_telegram, req.body.mensagem.texto);
        eventEmit.emit('enviar_msg_telegram', req.body.id_telegram, req.body.mensagem.texto);
      } else if (conversa.canal === 'facebook') {
        await enviarFacebook(req.body.mensagem.texto, conversa.cliente.id_facebook);
      }
    } catch (err) {
      console.log(err);
    }
    res.json("ok");
  },

  adicionaSussuro: async (req, res) => {

    let idDaConversa = req.body.idDaConversa;
    let conversa = await ConversaAtendimento.findById(idDaConversa);
    conversa.mensagens.push(req.body.mensagem);

    try {
      await ConversaAtendimento.findOneAndUpdate({ _id: req.body.idDaConversa }, conversa);
    } catch (err) {
      log.error(`** Erro em adicionar surruro na conversa **`);
      log.error(`** Erro: ${err} **`);
    }
    res.json("ok");
  },

  adicionaMidia: async (req, res) => {
    await atualizaCredenciaisCanais();
    const files = req.files;
    let idDaConversa = req.body.idDaConversa;
    let type = req.body.type;
    let fullPath = `${config.get("url_midia")}${files[0].filename}`;

    let conversa = await ConversaAtendimento.findById(idDaConversa);
    //console.log(`URL ====================================== >>>>>>>> ${fullPath}`);
    //console.log(`Type ===================================== >>>>>>>> ${type}`);
    conversa.mensagens.push({
      escrita_por: `${req.body.escrita_por}`,
      source: fullPath,
      description: `${req.body.legenda}` ? `${req.body.legenda}` : '',
      cliente_ou_atendente: `${req.body.cliente_ou_atendente}`,
      response_type: type
    });

    await ConversaAtendimento.updateOne({ _id: idDaConversa }, conversa);

    if (req.body.cliente_ou_atendente == 'atendente') {
      try {
        await ConversaAtendimento.findOneAndUpdate({ _id: idDaConversa }, conversa);
        if (conversa.canal === 'telegram') {
          if (type === 'image') {
            eventEmit.emit('enviar_foto_telegram', conversa.cliente.id_telegram, fullPath);
          } else if (type === 'file') {
            eventEmit.emit('enviar_arquivo_telegram', conversa.cliente.id_telegram, fullPath);
          }
        } else if (conversa.canal === 'whatsapp') {
          const response = await enviaImageWhatsApp(type, fullPath, conversa.cliente.celular);
        } else if (conversa.canal === 'facebook') {
          await enviarArquivoFacebook(fullPath, conversa.cliente.id_facebook, type)
        } else if (conversa.canal === 'chat' || conversa.canal === 'ChatFlexIA') {
          eventEmit.emit('atendente_enviar_arquivo', conversa, conversa.mensagens[(conversa.mensagens.length - 1)]);
        }
      } catch (err) {
        console.log(err);
      }
    } else if (req.body.cliente_ou_atendente == 'cliente') {
      eventEmit.emit('cliente_enviar_arquivo', conversa, conversa.mensagens[(conversa.mensagens.length - 1)]);
    }

    res.status(200).json(conversa.mensagens[(conversa.mensagens.length - 1)]);
  },

  atualizaStatus: async (req, res) => {
    try {
      const conversa = await ConversaAtendimento.findOneAndUpdate({ _id: req.body.id }, { $set: { nova_mensagem: req.body.nova_mensagem } });
      // console.log(conversa);
      res.json(conversa);
    } catch (er) {
      console.log(er);
    }
  },

  buscaConversaPorId: async (req, res) => {
    let conversa = await ConversaAtendimento.findById(req.params.id);
    res.json(conversa);
  },

  buscaMaisDeUmaConversaPorId: async (req, res) => {
    //console.log('##### buscaMaisDeUmaConversaPorId #####');

    let conversas = [];

    let idDasConversas = req.body.conversasId;
    //console.log('Id das conversas: ',idDasConversas);
    if (idDasConversas) {
      conversas = await ConversaEncerrada.find({ _id: idDasConversas });
      res.status(200).json({ conversas });
    } else {
      res.status(200).json({ conversas: [] });
    }

  },

  buscarConversasPorUser: async (req, res) => {
    try {
      // let conversas = await Conversa.find({"cliente.email": req.body.userEmail });
      let conversas = await ConversaEncerrada.find().or([
        { "cliente.email": req.body.userEmail },
        { "atendente.email": req.body.userEmail }
      ]);
      res.json(conversas);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  buscaTodasConversas: async (req, res) => {
    // let pagina = req.query.pagina;
    // let quantidadeDeConversas = await Conversa.find().countDocuments();
    try {
      let conversas = await ConversaAtendimento.find();
      //  .skip(10 * (pagina - 1))
      //  .limit(10);
      res.json(conversas);
    } catch (err) {
      res.status(500).json();
    }
  },

  buscaTodasConversasEncerradas: async (req, res) => {
    try {
      let conversas = await ConversaEncerrada.find();
      res.json(conversas);
    } catch (err) {
      res.status(500).json();
    }
  },

  clienteEncerraConversa: async (req, res) => {
    let conversa = await ConversaAtendimento.findByIdAndUpdate(req.params.id, {
      $set: {
        encerrada: true,
        encerrada_por: "CLIENTE",
        hora_fim_conversa: new Date(),
        situacao: 'encerrada'
      }
    });

    await limpaCache(conversa._id);

    try {
      if (config.get("usa_salesforce")) {
        const obj_sf = await makeSFUpdateCase(conversa);
        sendToSalesforce(
          obj_sf,
          config.get("salesforce_url") + "/chat/atualizarcaso",
          "POST"
        )
          .then(async data => {
            //console.log(data);
          })
          .catch(err => {
            console.log(err);
          });
      }

      res.status(200).json("Sucesso");
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },

  encerraConversa: async (req, res) => {
    console.log('########### ENCERRA CONVERSA SERVICE ##########################');
    const dados = { ...req.body };
    try {
      let conversa = await ConversaAtendimento.findByIdAndUpdate(req.params.id, {
        $set: {
          encerrada: true,
          atendida: true,
          encerrada_por: "ATENDENTE",
          situacao: "encerrada",
          assunto: dados.assunto ? dados.assunto : '',
          status: dados.status ? dados.status : '',
          produto: dados.produto ? dados.produto : '',
          setor: dados.setor ? dados.setor : '',
          observacao: dados.observacao ? dados.observacao : '',
          hora_fim_conversa: new Date()
        }
      });

      await limpaCache(conversa._id);

      // if (config.get("usa_salesforce")) {
      //   const obj_sf = await makeSFUpdateCase(conversa);
      //   sendToSalesforce(
      //     obj_sf,
      //     config.get("salesforce_url") + "/chat/atualizarcaso",
      //     "POST"
      //   )
      //     .then(async data => {
      //       //console.log(data);
      //     })
      //     .catch(err => {
      //       console.log(err);
      //     });
      // }

      // if (config.get('usa_amqp')) {
      //   let usuarioCliente;

      //   //(conversa.atendente);
      //   //console.log(conversa.cliente);
      //   // console.log(usuarioAtendente);

      //   if (conversa.cliente) {
      //     (conversa.cliente.nome && conversa.cliente.email) ? usuarioCliente = JSON.parse(JSON.stringify(await Usuario.findOne({ email: conversa.cliente.email }))) : '';
      //   }

      //   if (!usuarioCliente) {

      //     //console.log('Não tem user de cliente no banco');
      //     let senhaRandomica = crypto.randomBytes(4).toString('hex');

      //     let cliente = conversa.cliente;
      //     delete cliente._id;
      //     cliente.senha = '';
      //     cliente.trocouSenha = false;

      //     await bcrypt.hash(senhaRandomica, 3, async (err, hash) => {
      //       cliente.senha = hash;
      //       await Usuario.create(cliente);
      //     });

      //     conversa.cliente.senha = senhaRandomica;

      //     mensageria.enviarParaFila(conversa, 'conversas');

      //     return res.status(200).json("Sucesso");

      //   }

      // }
      const configGeral = await ConfigGeral.findOne();
      if (configGeral.email.habilitado) {
        if (conversa.cliente.email) {
          const conv = await ConversaEncerrada.findById(conversaNova._id);
          let texto = '\n';
          texto = texto + `A conversa de ID: ${conv._id} foi encerrada pelo atendente ${conv.atendente.name}.\n`;
          texto = texto + `Horário de início da conversa: ${conv.hora_do_atendimento}\n`;
          texto = texto + `Horário de encerramento da conversa: ${conv.hora_fim_conversa}.\n`;
          if (conv.resumoBot); {
            conv.resumoBot.forEach(resumo => {
              texto = texto + `${resumo.id} - ${resumo.value}\n`
            });
          }
          try {
            await enviaEmail(conv.cliente.email, 'Atendimento Flex Channel', texto, '');
          } catch (error) {
            //console.log('Erro ao enviar email');
            console.log(error);
          }
        }
      }

      return res.status(200).json('success');

    } catch (err) {
      //console.log(err);
      res.status(500).json(err);
    }
  },

  iniciaConversaComFlexia: async (req, res) => {
    await atualizaCredenciaisCanais();
    try {
      let chatFormulario = {
        nomeUsuario: req.body.nome,
        telefone: req.body.telefone ? req.body.telefone : req.body.celular,
        email: req.body.email,
        formulario: req.body.formulario,
      };
      let variaveisContexto = {};
      chatFormulario ? variaveisContexto = { 'skills': { 'main skill': { 'user_defined': chatFormulario } } } : 0;
      variaveisContexto['global'] = { 'system': { 'user_id': config.get('watson').user_id } }
      let flagPrimeiraRequisicao = true;
      let origem = req.headers.origem;

      let sessionId = await flexIA.iniciarSessao(origem);
      let responseFlexIA = await flexIA.iniciarConversa(origem, sessionId, variaveisContexto);
      //console.log('INICIA ------ Response flexia: ', responseFlexIA);
      let cont = await Contato.findOne({ "email": chatFormulario.email });
      let cliente = cont ? cont : await Contato.create({
        nome: chatFormulario.nomeUsuario,
        email: chatFormulario.email,
        celular: chatFormulario.telefone
      });

      let user = configWatson ? await Usuario.findById(configWatson.atendenteBotId) : '';
      let atendente = configWatson ? { _id: user._id, name: user.nome } : { name: "Watson Bot" };
      let filaBot = configWatson.filaBotId ? await Fila.findById(configWatson.filaBotId) : 'Fila Bot';

      let modelConversa = await ConversaAtendimento.create({
        id_socket_cliente: req.body.socketId,
        plataforma: req.body.plataforma,
        navegador: req.body.navegador,
        isMobile: req.body.isMobile,
        situacao: "em_atendimento",
        atendente: atendente,
        cliente: cliente,
        atendida: false,
        canal: origem,
        atendimentoBot: true,
        fila: filaBot.nome,
        origem: req.body.origemChamada,
        hora_do_atendimento: new Date(),
        timeline: [{ atividade: 'em_atendimento', descricao: `${cliente.nome} entrou em atendimento por ${atendente.name} na fila ${filaBot.nome}` }],
      });

      let tamanhoMensagensAntesDoUpdate = 0;

      modelConversa = await flexIA.insereNoModelConversa(
        modelConversa,
        responseFlexIA,
        null,
        sessionId,
        null
      );

      await ConversaAtendimento.findByIdAndUpdate(modelConversa._id, modelConversa);

      await flexIA.resolveAcao(responseFlexIA, modelConversa, flexIA, origem);

      modelConversa = await ConversaAtendimento.findById(modelConversa._id);
      // Sempre buscar conversa=modelConversa no banco -> para o caso da ACAO modifica-la.

      await LogFlexia.create({
        idDaConversa: modelConversa._id,
        textos_da_conversa: [
          {
            resposta_watson: responseFlexIA,
            texto_do_cliente: "Inicio da conversa"
          }
        ]
      });

      let resposta = await flexIA.defineResposta(
        tamanhoMensagensAntesDoUpdate,
        modelConversa,
        origem,
        false,
        responseFlexIA
      );
      //eventEmit.emit('send_monit_adm', {});
      res.status(200).json(resposta);
    } catch (err) {
      console.log(`Erro em iniciaConversaComFlexIA: ${err}. `);
      if (err.code === "EAI_AGAIN" || err.code === 404 || err.code === 500) {
        //console.log('Detectamos um probleminha de conexão com nossa base de inteligência… Aguarde um pouquinho que um humano logo te contactará por aqui.');

        let cont = await Contato.findOne({ "email": req.body.user.email });
        let cliente = cont ? cont : await Contato.create(req.body.user);

        let atendente = configWatson ? await Usuario.findById(configWatson.atendenteBotId) : { name: "Watson Bot" };

        if (configWatson.encerrarTimeoutWatson) {
          let conversa = await ConversaEncerrada.create({
            situacao: "encerrada",
            atendimentoBot: true,
            cliente: cliente,
            atendida: true,
            encerrada: true,
            origem: req.body.origemChamada,
            timeline: [
              { atividade: 'encerrada', descricao: 'Um erro ocorreu ao conectar com o Watson. Conversa encerrada' }],
            mensagens: [
              {
                "texto": `Detectamos um probleminha de conexão com nossa base de inteligência… Aguarde um pouquinho e tente novamente.`,
                "escrita_por": `${atendente.nome}`,
                "cliente_ou_atendente": "atendente",
                "response_type": "text"
              }
            ]
          });
          res.status(200).json(conversa);
        } else {
          let conversa = await ConversaAtendimento.create({
            situacao: "transferida",
            atendimentoBot: false,
            cliente: cliente,
            atendida: false,
            encerrada: false,
            origem: req.body.origemChamada,
            timeline: [
              {
                atividade: 'transferida',
                descricao: `Erro ao iniciar conversa com o Watson. Conversa transferida e o ${cliente.nome} entrou na fila ${filaBot.nome}`
              }],
            mensagens: [
              {
                "texto": `Detectamos um probleminha de conexão com nossa base de inteligência… Aguarde um pouquinho que um humano logo te contactará por aqui.`,
                "escrita_por": `${atendente.nome}`,
                "cliente_ou_atendente": "atendente",
                "response_type": "text"
              }
            ]
          });
          res.status(200).json(conversa);
        }
      }
    }
  },

  enviarMensagemParaFlexia: async (req, res) => {
    try {
      let origem = req.headers.origem;

      let promisesAssincronas = await Promise.all([
        await ConversaAtendimento.findById(req.body.idDaConversa),
        await flexIA.enviarMensagem(
          origem,
          req.body.sessionID,
          req.body.mensagem.texto,
          null
        )
      ]);
      let modelConversa = promisesAssincronas[0];
      let responseFlexIA = promisesAssincronas[1];

      //console.log('Conversa em andamento ---------- Response flexia: ', responseFlexIA);

      // await LogFlexia.create({
      //   resposta_watson:responseFlexIA.output.generic[0],
      //   texto_do_cliente: req.body.mensagem.texto
      // });
      //console.log('ida da conversa ', req.body.idDaConversa);
      let logFlexia = await LogFlexia.findOne({ idDaConversa: req.body.idDaConversa });

      logFlexia.textos_da_conversa.push({
        resposta_watson: responseFlexIA,
        texto_do_cliente: req.body.mensagem.texto
      })

      await LogFlexia.findByIdAndUpdate(logFlexia.id, logFlexia);

      modelConversa = await flexIA.insereNoModelConversa(
        modelConversa,
        responseFlexIA,
        req.body,
        req.body.sessionID,
        null
      );

      let conversaAntesDoUpdate = await ConversaAtendimento.findByIdAndUpdate(
        modelConversa._id,
        modelConversa
      );

      let tamanhoMensagensAntesDoUpdate =
        conversaAntesDoUpdate.mensagens.length;
      //console.log("-> Salvou no banco 1º");
      // Salva a conversa a primeira VEZ

      await flexIA.resolveAcao(responseFlexIA, modelConversa, flexIA, origem);

      modelConversa = await ConversaAtendimento.findById(modelConversa._id);
      // Sempre buscar conversa=modelConversa no banco -> para o caso da ACAO modifica-la.

      // console.log(responseFlexIA);
      let resposta = await flexIA.defineResposta(
        tamanhoMensagensAntesDoUpdate,
        modelConversa,
        origem,
        false,
        responseFlexIA
      );

      res.status(200).json(resposta);
    } catch (err) {
      console.log(`Erro em enviarMensagemParaFlexIA: ${err}`);
      if (err.code === 404 || err.code === 500) {
        console.log('Detectamos um probleminha de conexão com nossa base de inteligência… Aguarde um pouquinho que um humano logo te contactará por aqui.');

        let atendente = configWatson ? await Usuario.findById(configWatson.atendenteBotId) : { name: "Watson Bot" };

        if (configWatson.encerrarTimeoutWatson) {
          let conversaNaoRespondida = await ConversaAtendimento.findById(req.body.idDaConversa);
          conversaNaoRespondida.situacao = 'encerrada';
          conversaNaoRespondida.atendida = true;
          conversaNaoRespondida.atendimentoBot = true;
          conversaNaoRespondida.encerrada = true;
          conversaNaoRespondida.mensagens.push(req.body.mensagem);
          conversaNaoRespondida.mensagens.push({
            texto: `Detectamos um probleminha de conexão com nossa base de inteligência… Aguarde um pouquinho e tente novamente.`,
            escrita_por: atendente.nome,
            cliente_ou_atendente: "atendente",
            response_type: 'text'
          });
          conversaNaoRespondida.timeline.push({ atividade: 'encerrada', descricao: `Conversa encerrada por timeout do watson` });
          await ConversaAtendimento.findOneAndUpdate({ _id: req.body.idDaConversa }, conversaNaoRespondida);
          await limpaCache(conversaNaoRespondida._id);

          res.status(200).json("ok");
        } else {
          let conversaNaoRespondida = await ConversaAtendimento.findById(req.body.idDaConversa);
          conversaNaoRespondida.situacao = 'transferida';
          conversaNaoRespondida.atendida = false;
          conversaNaoRespondida.atendimentoBot = false;
          conversaNaoRespondida.encerrada = false;
          conversaNaoRespondida.mensagens.push(req.body.mensagem);
          conversaNaoRespondida.mensagens.push({
            texto: `Detectamos um probleminha de conexão com nossa base de inteligência… Aguarde um pouquinho que um humano logo te contactará por aqui.`,
            escrita_por: atendente.nome,
            cliente_ou_atendente: "atendente",
            response_type: 'text'
          });
          conversaNaoRespondida.timeline.push({ atividade: 'transferida', descricao: `O cliente ${conversaNaoRespondida.cliente.nome} transferido por timeout do watson` });
          await ConversaAtendimento.update({ _id: req.body.idDaConversa }, conversaNaoRespondida);
          res.status(200).json("ok");
        }
      }
    }
  },

  enviarMensagemParaFlexiaV2: async (req, res) => {
    console.log(new Date());
    console.log('##### function - enviarMensagemParaFlexiaV2 #####');
    try {
      let origem = req.headers.origem;

      let promisesAssincronas = await Promise.all([
        await ConversaAtendimento.findById(req.body.idDaConversa),
        await flexIA.enviarMensagem(
          origem,
          req.body.sessionID,
          req.body.mensagem.texto,
          null
        )
      ]);
      let modelConversa = promisesAssincronas[0];
      let responseFlexIA = promisesAssincronas[1];
      //console.log('modelConversa 1: ', modelConversa.mensagens);

      let quantidadeMensagemAnterior = modelConversa.mensagens.length;
      //console.log('Conversa em andamento ---------- Response flexia: ', responseFlexIA.output.generic[0]);
      // await LogFlexia.create({
      //   resposta_watson:responseFlexIA.output.generic[0],
      //   texto_do_cliente: req.body.mensagem.texto
      // });
      //console.log('ida da conversa ',req.body.idDaConversa);


      /* LOG DA FLEXIA
      let logFlexia = await LogFlexia.findOne({ idDaConversa: req.body.idDaConversa });

      logFlexia.textos_da_conversa.push({
        resposta_watson: responseFlexIA,
        texto_do_cliente: req.body.mensagem.texto
      })

      await LogFlexia.findByIdAndUpdate(logFlexia.id, logFlexia);
      */

      modelConversa = await flexIA.insereNoModelConversa(
        modelConversa,
        responseFlexIA,
        req.body,
        req.body.sessionID,
        null
      );
      // consoleconsole.log('modelConversa 2: ', modelConversa.mensagens);
      let conversaAntesDoUpdate = await ConversaAtendimento.findByIdAndUpdate(
        modelConversa._id,
        modelConversa
      );

      let tamanhoMensagensAntesDoUpdate =
        conversaAntesDoUpdate.mensagens.length;
      //console.log("-> Salvou no banco 1º");
      // Salva a conversa a primeira VEZ
      //console.log('tamanhoMensagensAntesDoUpdate: ', tamanhoMensagensAntesDoUpdate);
      await flexIA.resolveAcao(responseFlexIA, modelConversa, flexIA, origem);

      let flagDeEncerramento = false;
      let flagDeTransferir = false;
      let filaTransferencia;

      if (responseFlexIA.output.user_defined && responseFlexIA.output.user_defined.actions[0].name == 'encerrar') {
        modelConversa = await ConversaEncerrada.findOne({ idSessao: req.body.sessionID });
        flagDeEncerramento = true;
        //adicionar mais uma variavel para encerrar a conversae
      } else if (responseFlexIA.output.user_defined && responseFlexIA.output.user_defined.actions[0].name == 'transferir') {
        flagDeTransferir = true;
        console.log('fila: ', modelConversa.fila);
        filaTransferencia = responseFlexIA.output.user_defined.actions[0].parameters.fila;
      }
      else {
        modelConversa = await ConversaAtendimento.findById(modelConversa._id);
      }
      // console.log('modelConversa 3: ', modelConversa.mensagens);
      // Sempre buscar conversa=modelConversa no banco -> para o caso da ACAO modifica-la.

      // console.log(responseFlexIA);
      let resposta = await flexIA.defineResposta(
        tamanhoMensagensAntesDoUpdate,
        modelConversa,
        origem,
        false,
        responseFlexIA
      );
      // console.log('resposta: ', resposta.mensagens);
      console.log(new Date());
      res.status(200).json({ mensagens: resposta.mensagens.splice(quantidadeMensagemAnterior + 1), flagDeEncerramento, flagDeTransferir, filaTransferencia });
    } catch (err) {
      console.log(`Erro em enviarMensagemParaFlexIA: ${err}`);
      if (err.code === 404 || err.code === 500) {
        console.log('Detectamos um probleminha de conexão com nossa base de inteligência… Aguarde um pouquinho que um humano logo te contactará por aqui.');

        let atendente = configWatson ? await Usuario.findById(configWatson.atendenteBotId) : { name: "Watson Bot" };

        if (configWatson.encerrarTimeoutWatson) {
          let conversaNaoRespondida = await ConversaAtendimento.findById(req.body.idDaConversa);
          conversaNaoRespondida.situacao = 'encerrada';
          conversaNaoRespondida.atendida = true;
          conversaNaoRespondida.atendimentoBot = true;
          conversaNaoRespondida.encerrada = true;
          conversaNaoRespondida.mensagens.push(req.body.mensagem);
          conversaNaoRespondida.mensagens.push({
            texto: `Detectamos um probleminha de conexão com nossa base de inteligência… Aguarde um pouquinho e tente novamente.`,
            escrita_por: atendente.nome,
            cliente_ou_atendente: "atendente",
            response_type: 'text'
          });
          conversaNaoRespondida.timeline.push({ atividade: 'encerrada', descricao: `Conversa encerrada por timeout do watson` });
          await ConversaAtendimento.findOneAndUpdate({ _id: req.body.idDaConversa }, conversaNaoRespondida);
          await limpaCache(conversaNaoRespondida._id);

          res.status(200).json("ok");
        } else {
          let conversaNaoRespondida = await ConversaAtendimento.findById(req.body.idDaConversa);
          conversaNaoRespondida.situacao = 'transferida';
          conversaNaoRespondida.atendida = false;
          conversaNaoRespondida.atendimentoBot = false;
          conversaNaoRespondida.encerrada = false;
          conversaNaoRespondida.mensagens.push(req.body.mensagem);
          conversaNaoRespondida.mensagens.push({
            texto: `Detectamos um probleminha de conexão com nossa base de inteligência… Aguarde um pouquinho que um humano logo te contactará por aqui.`,
            escrita_por: atendente.nome,
            cliente_ou_atendente: "atendente",
            response_type: 'text'
          });
          conversaNaoRespondida.timeline.push({ atividade: 'transferida', descricao: `O cliente ${conversaNaoRespondida.cliente.nome} transferido por timeout do watson` });
          await ConversaAtendimento.update({ _id: req.body.idDaConversa }, conversaNaoRespondida);
          res.status(200).json("ok");
        }
      }
    }
  },

  transferir: async (req, res) => {
    let idConversa = req.params.idConversa;

    let fila = req.params.fila;

    let conversa = await ConversaAtendimento.findById(idConversa);
    await ConversaAtendimento.update(
      { _id: idConversa },
      {
        $set: {
          atendida: false,
          fila: fila,
          situacao: "transferida",
          atendente: {},
          assunto: req.body.assunto ? req.body.assunto : '',
          setor: req.body.setor ? req.body.setor : '',
          observacao: req.body.observacao ? req.body.observacao : '',
          timeline: [{
            atividade: 'transferida',
            descricao: `Cliente transferido para a fila ${fila} pelo atendente ${conversa.atendente.name}`
          }],
        }
      }
    );

    res.status(200).json("ok");
  },

  quantidadeDeClienteNaFila: async (req, res) => {
    const fila = req.params.fila;

    let quantidade = await ConversaAtendimento.countDocuments().where({ fila, atendida: false });

    // -1 pq? Para não contar o próprio cliente

    res.status(200).json({
      clientesNaFIla: quantidade
    });
  },

  posicaoDaConversaNaFila: async (req, res) => {
    let fila = req.params.fila;
    console.log('------------------ POSICAO FILA -----------');
    console.log('fila', fila);
    let idDaConversa = req.params.idDaConversa;

    try {
      let conversas = await ConversaAtendimento.find({
        fila: fila,
        encerrada: false,
        atendida: false
      }).sort({ hora_criacao: 1 });

      //console.log(conversas);

      let posicao = conversas.findIndex((conversa, index) => {
        if (conversa._id == idDaConversa) {
          index++;
          return index;
        }
      });

      console.log('posicao', posicao);


      posicao = posicao + 1;
      res.status(200).json({ posicao });

    } catch (e) {
      console.log(e);
      res.status(500).json("error");
    }
  },

  satisfacao: async (req, res) => {

    await ConversaEncerrada.findByIdAndUpdate(req.params.id, {
      $set: { satisfacao_do_cliente: req.body.satisfacao }
    });

    res.status(200).json("ok");
  },

  foraHorario: async (req, res) => {
    let conversa = req.body;

    let cont = await Contato.findOne({ "email": req.body.cliente.email });
    let cliente = cont ? cont : await Contato.create(req.body.cliente);

    conversa.cliente = cliente
    conversa.encerrada = true;
    conversa.hora_fim_conversa = Date.now();

    try {
      let conversa = await ConversaEncerrada.create(req.body);

      res.status(202).json(conversa);
    } catch (error) {
      res.status(500).json(error);
    }
  },

  updateEncerramento: async (req, res) => {
    let idConversa = req.params.id;
    const dados = { ...req.body };

    let update = {};
    if (dados.assunto) update.assunto = dados.assunto;
    if (dados.status) update.status = dados.status;
    if (dados.produto) update.produto = dados.produto;
    if (dados.setor) update.setor = dados.setor;
    if (dados.observacao) update.observacao = dados.observacao;

    await ConversaEncerrada.findOneAndUpdate(
      { _id: idConversa },
      { $set: update }
    );

    res.status(200).json('success');
  },

  updateConversaContato: async (req, res) => {
    try {
      let idConversa = req.params.idConversa;
      let idContato = req.params.idContato;
      let contato = await Contato.find({ _id: idContato });
      let update = { cliente: contato[0] };

      await ConversaAtendimento.findOneAndUpdate(
        { _id: idConversa },
        { $set: update }
      );

      res.status(200).json('success');
    } catch (error) {
      console.log('Erro ao atualizar conversa: ', error);
      res.status(400).json('fail');
    }
  },

  clienteAbandonouConversa: (req, res) => {

    if (req.query.email) {
      eventEmit.emit('cliente_fechou_janela', req.query.email);
    }

    console.log('##### clienteAbandonouConversa #####');

    res.status(200).json({
      message: 'ok'
    });
  },

  verificaSeExisteConversaPorEmail: async (req, res) => {

    const { email } = req.params;

    console.log()

    const conversa = await ConversaAtendimento.findOne({ 'cliente.email': email });

    console.log('conversa: ', conversa);

    if (!conversa) {
      return res.status(200).json({ message: 'Conversa não existe' });
    }

    res.status(200).json({
      message: 'OK',
      conversa
    });
  }

};