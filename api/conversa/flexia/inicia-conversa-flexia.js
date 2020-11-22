const config = require('config');
const ConversaEncerrada = require('../conversa.model');
const ConversaAtendimento = require('../conversa_atendimento.model');
const FlexIA = require("../../../FlexIA/Assistente");
const ConfigGeral = require('../../configuracao/configuracao.model');
const Usuario = require('../../user/user-model');
const Fila = require('../../fila/fila-model');
const log = require('../../util/logs');

let configWatson = [];
let user = ''
let atendente = ''
let filaBot = ''
let flexIA;

async function atualizaCredenciaisCanais() {
  try {
    log.log('Atualizando valores das credenciais do Watson');
    const config = await ConfigGeral.findOne();
    configWatson = config.watson
    user = configWatson ? await Usuario.findById(configWatson.atendenteBotId) : '';
    atendente = configWatson ? { _id: user._id, name: user.nome } : { name: "Watson Bot" };
    filaBot = configWatson.filaBotId ? await Fila.findById(configWatson.filaBotId) : 'Fila Bot';
    flexIA = new FlexIA(configWatson.apiKey, configWatson.assistantId);
  } catch (error) {
    log.error(' ** Erro em atualizar credenciais watson **')
    log.error(` ** Erro: ${error} **`)
  }
}

module.exports = async function (data) {

  const { nomeUsuario, email, telefone, celular, origem, cliente, formulario } = data;
  await atualizaCredenciaisCanais();
  // console.log('cliente: ', cliente);
  try {
    let chatFormulario = {
      nomeUsuario,
      email,
      telefone,
      celular,
      formulario,
    };
    let variaveisContexto = {};
    chatFormulario ? variaveisContexto = { 'skills': { 'main skill': { 'user_defined': chatFormulario } } } : 0;
    variaveisContexto['global'] = { 'system': { 'user_id': config.get('watson').user_id } }
    let sessionId = await flexIA.iniciarSessao(origem);
    let responseFlexIA = await flexIA.iniciarConversa(origem, sessionId, variaveisContexto);
    let modelConversa = await ConversaAtendimento.create({
      situacao: "em_atendimento",
      atendente: atendente,
      cliente,
      atendida: false,
      canal: origem,
      fila: filaBot.nome,
      hora_do_atendimento: new Date(),
      atendimentoBot: true,
      timeline: [{ atividade: 'em_atendimento', descricao: `${cliente.nome} entrou em atendimento com ${atendente.name} na fila ${filaBot.nome}` }]
    });
    // console.log('model conversa: ', modelConversa);
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

    let resposta = await flexIA.defineRespostaAtendente(
      tamanhoMensagensAntesDoUpdate,
      modelConversa,
      origem,
      false,
      responseFlexIA
    );
    return resposta;
  } catch (err) {
    console.log('erro: ', err);
    if (err.code === "EAI_AGAIN" || err.code === 404 || err.code === 500) {
      if (configWatson.encerrarTimeoutWatson) {
        let conversa = await ConversaEncerrada.create({
          situacao: "encerrada",
          atendente: atendente,
          cliente: cliente,
          atendida: true,
          atendimentoBot: true,
          fila: filaBot.nome,
          encerrada: true,
          origem: req.body.origemChamada,
          timeline: [
            { atividade: 'encerrada', descricao: 'Um erro ocorreu ao conectar com o Watson. Conversa encerrada' }],
          mensagens: [
            {
              texto: `Detectamos um probleminha de conexão com nossa base de inteligência… Por gentileza tente novamente em alguns instanstes`,
              escrita_por: atendente.nome,
              cliente_ou_atendente: "atendente",
              response_type: 'text'
            }
          ]
        });
        return conversa;
      } else {
        let conversa = await ConversaAtendimento.create({
          situacao: "transferida",
          atendente: atendente,
          cliente: cliente,
          atendida: false,
          atendimentoBot: false,
          fila: filaBot.nome,
          encerrada: false,
          origem: req.body.origemChamada,
          timeline: [
            {
              atividade: 'transferida',
              descricao: `Erro ao iniciar conversa com o Watson. Cliente ${cliente.nome} entrou na fila ${filaBot.nome}`
            }],
          mensagens: [
            {
              texto: `Detectamos um probleminha de conexão com nossa base de inteligência… Aguarde um pouquinho que um humano logo te contactará por aqui.`,
              escrita_por: atendente.nome,
              cliente_ou_atendente: "atendente",
              response_type: 'text'
            }
          ]
        });
        return conversa;
      }

    }
  }
}