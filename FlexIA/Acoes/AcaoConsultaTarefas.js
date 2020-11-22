const TrataAcoes = require("./TrataAcoes");
const ConversaAtendimento = require("../../api/conversa/conversa_atendimento.model");
const sendToSalesforce = require("../../api/services/sendToSalesforce");
const moment = require('moment');
const config = require('config');


class AcaoConsultarTarefas extends TrataAcoes {
  constructor() {
    super();
  }

  setSucessor(sucessor) {
    this.sucessor = sucessor;
  }

  async trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem) {
    //console.log('Passou em açãoConsultarTarefas');
    try {
      moment.locale('pt-BR');

      if (acao === 'consultaTarefa') {
        //console.log(`entrou em AcaoConsultarTarefas`);
        // Início da lógica
        let variaveisContexto = {};
        // console.log(responseFlexIA.output.user_defined.actions[0]);
        let data = {
          idConsultor: responseFlexIA.output.user_defined.actions[0].parameters.idConsultor,
          dataAtividade: responseFlexIA.output.user_defined.actions[0].parameters.dataAtividade
        };

        //console.log(data);

        let responseSF = JSON.parse(await sendToSalesforce(data, `${config.get('salesforce_url')}/services/apexrest/task`, 'POST'));

        let retornoSaleforce = {
          tarefas: responseSF.tarefas,
          existemTarefas: responseSF.existemTarefas,
          eventos: responseSF.eventos
        };

        if (responseSF.existemTarefas) {
          //console.log('Foram encontradas tarefas');

          if (responseSF.eventos) {

            retornoSaleforce.eventos.forEach((evento, indice) => {
              retornoSaleforce.eventos[indice].ActivityDateTime = moment(evento.ActivityDateTime).format('DD/MM/YYYY HH:mm:ss');
              retornoSaleforce.eventos[indice].EndDateTime = moment(evento.EndDateTime).format('DD/MM/YYYY HH:mm:ss');
            });

            variaveisContexto.eventos = retornoSaleforce.eventos;

          }


          variaveisContexto.tarefas = retornoSaleforce.tarefas;
          variaveisContexto.existemTarefas = retornoSaleforce.existemTarefas;

        } else {
          //console.log('Não foram encontradas tarefas nesse periodo');
        }
        // console.log(responseSF.eventos);
        //================================================================================================================
        let responseFlexIA2 = await flexIA_Assistente.enviarMensagem(origem, conversa.idSessao, 'enterx', variaveisContexto);

        conversa = await flexIA_Assistente.insereNoModelConversa(conversa, responseFlexIA2, null, conversa.idSessao, variaveisContexto);
        await ConversaAtendimento.findByIdAndUpdate(conversa._id, conversa);

        responseFlexIA = await flexIA_Assistente.resolveAcao(responseFlexIA2, conversa, flexIA_Assistente, origem);
        //================================================================================================================
        // Fim da lógica
        return true;
      } else {
        return await this.sucessor.trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem);
      }
    } catch (err) {
      console.log(`ERRO em AcaoConsultarTarefas: ${err}`);
    }
  }
}

module.exports = new AcaoConsultarTarefas();