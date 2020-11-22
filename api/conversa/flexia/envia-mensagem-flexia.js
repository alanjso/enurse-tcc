const FlexIA = require('../../../FlexIA/Assistente');
// const ConversaEncerrada = require('../conversa.model');
const ConversaAtendimento = require('../conversa_atendimento.model');
const ConfigGeral = require('../../configuracao/configuracao.model');
const Usuario = require('../../user/user-model');
const limpaCache = require('../../util/limpaCache');
/*
  data: {

  }
*/
module.exports = async function (conversa, mensagem) {
  const config = await ConfigGeral.findOne();
  let configWatson = config.watson // await ConfigWatson.find();
  let atendente = configWatson ? await Usuario.findById(configWatson.atendenteBotId) : '';
  let flexIA = new FlexIA(configWatson.apiKey, configWatson.assistantId);

  try {
    let origem = conversa.canal;
    let id = conversa._id;
    let promisesAssincronas = await Promise.all([
      await ConversaAtendimento.findById(id),
      await flexIA.enviarMensagem(
        origem,
        conversa.idSessao,
        mensagem,
        null
      )
    ]);

    let modelConversa = promisesAssincronas[0];
    let responseFlexIA = promisesAssincronas[1];

    let respostaUsuario = {
      mensagem,
      escrita_por: conversa.cliente.nome
    }

    modelConversa = await flexIA.insereNoModelConversa(
      modelConversa,
      responseFlexIA,
      respostaUsuario,
      conversa.idSessao,
      null
    );
    let conversaAntesDoUpdate = await ConversaAtendimento.findByIdAndUpdate(
      modelConversa._id,
      modelConversa
    );
    let tamanhoMensagensAntesDoUpdate =
      conversaAntesDoUpdate.mensagens.length;
    // Salva a conversa a primeira VEZ

    await flexIA.resolveAcao(responseFlexIA, modelConversa, flexIA, origem);
    modelConversa = await ConversaAtendimento.findById(conversa._id);
    // Sempre buscar conversa=modelConversa no banco -> para o caso da ACAO modifica-la.

    //responseFlexIA.output.user_defined.actions[0].type === 'client'
    let resposta;
    if (responseFlexIA.output.user_defined && responseFlexIA.output.user_defined.actions[0].name == 'encerrar') {
      resposta = [{
        response_type: 'text',
        texto: 'Sua conversa está sendo encerrada, obrigada pela atenção.'
      }];
    } else {
      resposta = await flexIA.defineRespostaAtendente(
        tamanhoMensagensAntesDoUpdate,
        modelConversa,
        origem,
        false,
        responseFlexIA
      );
    }


    return resposta;
  } catch (err) {
    console.log('err: ', err);
    if (err.code === 404 || err.code === 500) {
      let conversaNaoRespondida = await ConversaAtendimento.findById(conversa._id);

      if (configWatson.encerrarTimeoutWatson) {
        conversaNaoRespondida.situacao = 'encerrada';
        conversaNaoRespondida.atendida = false;
        conversaNaoRespondida.atendimentoBot = true;
        conversaNaoRespondida.encerrada = true;
        conversaNaoRespondida.timeline.push({
          atividade: 'encerrada',
          descricao: `Conversa encerrada após erro em enviar mensagem para o Watson`
        });
        conversaNaoRespondida.mensagens.push({
          escrita_por: conversaNaoRespondida.cliente.nome,
          texto: mensagem,
          cliente_ou_atendente: 'cliente',
          response_type: 'text'
        });
        // Mensagem 
        conversaNaoRespondida.mensagens.push({
          texto: `Detectamos um probleminha de conexão com nossa base de inteligência… Aguarde um pouquinho e tente novamente`,
          escrita_por: "Atendente",
          cliente_ou_atendente: "atendente",
          response_type: "text"
        });
        await ConversaAtendimento.findByIdAndUpdate({ _id: conversa._id }, conversaNaoRespondida);
        // Limpar o chace e encerrar conversa
        await limpaCache(conversaNaoRespondida._id);

      } else {
        let conversaNaoRespondida = await ConversaAtendimento.findById(conversa._id);
        conversaNaoRespondida.situacao = 'transferida';
        conversaNaoRespondida.atendida = false;
        conversaNaoRespondida.atendimentoBot = false;
        conversaNaoRespondida.timeline.push({
          atividade: 'transferida',
          descricao: `Cliente transferido por erro ao enviar mensagem para Watson`
        });
        conversaNaoRespondida.mensagens.push({
          escrita_por: conversaNaoRespondida.cliente.nome,
          texto: mensagem,
          cliente_ou_atendente: 'cliente',
          response_type: 'text'
        });
        // Mensagem 
        conversaNaoRespondida.mensagens.push({
          texto: `Detectamos um probleminha de conexão com nossa base de inteligência… Aguarde um pouquinho que um humano logo te contactará por aqui.`,
          escrita_por: "Atendente",
          cliente_ou_atendente: "atendente",
          response_type: "text"
        });
        await ConversaAtendimento.update({ _id: conversa._id }, conversaNaoRespondida);
      }
      let respostaFinal = [];
      respostaFinal.push(conversaNaoRespondida.mensagens.pop());

      console.log('Resposta final apos erro: ');
      console.log(respostaFinal);

      return respostaFinal;
    }
  }
}