const TrataAcoes = require("./TrataAcoes");
const ConversaAtendimento = require("../../api/conversa/conversa_atendimento.model");
const log = require('../../api/util/logs');
const eventEmit = require('../../api/util/eventEmmiter');

class AcaoTransferir extends TrataAcoes {
  constructor() {
    super();
  }

  setSucessor(sucessor) {
    this.sucessor = sucessor;
  }

  async trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem) {
    //('Passou em açãoTransferir');
    try {
      if (acao === 'transferir') {
        console.log(`entrou em acaoTransferir`);
        let tipoTransferencia;
        if (responseFlexIA.output.user_defined.actions[0].parameters.tipo === "chat") {
          tipoTransferencia = "chat";
        } else if (responseFlexIA.output.user_defined.actions[0].parameters.tipo === "call") {
          tipoTransferencia = "call";
        }

        let cliente = {};
        let timeline = conversa.timeline;
        let fila = responseFlexIA.output.user_defined.actions[0].parameters.fila;
        // conversa.cliente.nome ? cliente.nome = responseFlexIA.output.user_defined.actions[0].parameters.nome : cliente.nome = conversa.cliente.nome;
        // conversa.cliente.celular ? cliente.telefone = responseFlexIA.output.user_defined.actions[0].parameters.telefone : cliente.celular = conversa.cliente.celular;
        // conversa.cliente.email ? cliente.email = responseFlexIA.output.user_defined.actions[0].parameters.email : cliente.email = conversa.cliente.email;
        // conversa.cliente.empresa ? cliente.empresa = responseFlexIA.output.user_defined.actions[0].parameters.empresa : cliente.empresa = conversa.cliente.empresa;
        // conversa.cliente.cpf ? cliente.cpf = responseFlexIA.output.user_defined.actions[0].parameters.cpf : cliente.cpf = conversa.cliente.cpf;
        // conversa.resumoBot ? conversa.resumoBot = responseFlexIA.output.user_defined.actions[0].parameters.resumoBot : conversa.resumoBot = '';
        cliente.nome = conversa.cliente.nome ? conversa.cliente.nome : responseFlexIA.output.user_defined.actions[0].parameters.nome;
        cliente.email = conversa.cliente.email ? conversa.cliente.email : responseFlexIA.output.user_defined.actions[0].parameters.email;
        cliente.celular = conversa.cliente.celular ? conversa.cliente.celular : responseFlexIA.output.user_defined.actions[0].parameters.telefone;
        cliente.id_telegram = conversa.cliente.id_telegram ? conversa.cliente.id_telegram : '';
        cliente.id_facebook = conversa.cliente.id_facebook ? conversa.cliente.id_facebook : '';
        timeline.push({
          atividade: 'transferida',
          descricao: `Cliente transferido para fila ${fila} pelo atendente ${conversa.atendente.name}`
        });

        conversa = await ConversaAtendimento.findByIdAndUpdate(conversa._id,
          {
            $set:
            {
              atendida: false,
              atendente: {},
              fila: responseFlexIA.output.user_defined.actions[0].parameters.fila,
              cliente: cliente,
              situacao: 'transferida',
              meioTransferencia: tipoTransferencia,
              atendimentoBot: false,
              resumoBot: responseFlexIA.output.user_defined.actions[0].parameters.resumoBot,
              timeline: timeline
            }
          });

        eventEmit.emit('transferir_conversa_watson', conversa._id);

        return true;

      } else {
        return await this.sucessor.trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem);
      }
    } catch (err) {
      log.error('** Erro na Action Transferir **');
      log.error(`** Erro: ${err} **`);
    }
  }
}

module.exports = new AcaoTransferir();