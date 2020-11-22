const TrataAcoes = require("./TrataAcoes");
const config = require('config');
const ConversaAtendimento = require('../../api/conversa/conversa_atendimento.model');
// const ConversaEncerrada = require("../../api/conversa/conversa.model");
const limpaCache = require('../../api/util/limpaCache')

class AcaoEncerrar extends TrataAcoes {
  constructor() {
    super();
  }

  async trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem) {
    //console.log('Passou em açãoEncerrar');
    try {
      if (acao === 'encerrar') {
        //(`entrou em acaoEncerrar`);
        const nota = '';
        if (responseFlexIA.output.user_defined.actions[0].parameters) {
          if (responseFlexIA.output.user_defined.actions[0].parameters.nota) {
            nota = responseFlexIA.output.user_defined.actions[0].parameters.nota;
          }
        }

        await ConversaAtendimento.findByIdAndUpdate(conversa._id, {
          $set: {
            encerrada: true,
            atendida: true,
            situacao: "encerrada",
            encerrada_por: "BOT",
            hora_fim_conversa: new Date(),
            satisfacao_do_cliente: nota
          }
        });

        await limpaCache(conversa._id);

        await flexIA_Assistente.encerrarSessao(origem, conversa.idSessao);

        return true;

      } else {
        // return this.sucessor.trataAcao(acao, conversa);
        // No ultimo tratamento lembre de disparar erro, pois não haverá tratamento para a ação vinda.
        throw new Error(`Não existe tratamento para a Ação: ${acao}`);
      }
    } catch (err) {
      console.log(`ERRO em AcaoEncerrar: ${err}`);
    }
  }
}

module.exports = new AcaoEncerrar();