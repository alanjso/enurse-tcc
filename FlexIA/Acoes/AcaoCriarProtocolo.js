const log = require('../../api/util/logs')
const TrataAcoes = require("./TrataAcoes");
const ConversaAtendimento = require("../../api/conversa/conversa_atendimento.model");
const servicoSMS = require("../../api/services/ServiceSMS");
const sendToSalesforce = require("../../api/services/sendToSalesforce");
const config = require('config');

class AcaoCriarProtocolo extends TrataAcoes {
  constructor() {
    super();
  }

  setSucessor(sucessor) {
    this.sucessor = sucessor;
  }

  async trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem) {
    log.log('Passou na Action: criarProtocolo');
    try {
      if (acao === 'criarProtocolo') {
        log.success(` ==> Entrou na Action: criarProtocolo <== `);

        let protocoloCompleto = true;
        let protocoloToSalesforce = {};
        if ([undefined, null, ''].includes(responseFlexIA.output.actions[0].parameters.protocolo)) {
          protocoloToSalesforce = { // Pegar do contexto
            assunto: responseFlexIA.output.actions[0].parameters.assunto,
            descricao: responseFlexIA.output.actions[0].parameters.descricao,
            idcontato: responseFlexIA.output.actions[0].parameters.idcontato,
            idempresa: responseFlexIA.output.actions[0].parameters.idempresa
          };
        } else {
          protocoloToSalesforce = { // Pegar do contexto
            assunto: responseFlexIA.output.actions[0].parameters.assunto,
            descricao: responseFlexIA.output.actions[0].parameters.descricao,
            protocolo: responseFlexIA.output.actions[0].parameters.protocolo
          };
          protocoloCompleto = false;
        }

        let responseSF = JSON.parse(await sendToSalesforce(protocoloToSalesforce, `${config.get('salesforce_url')}/services/apexrest/case`, 'POST'));

        let protocolo = {};
        protocolo.numeroProtocolo = responseSF.protocolo;
        // conversa.idSF = responseSF.id;

        let responseFlexIA2 = await flexIA_Assistente.enviarMensagem(origem, conversa.idSessao, '', { protocolo });

        conversa = await flexIA_Assistente.insereNoModelConversa(conversa, responseFlexIA2, null, conversa.idSessao, protocolo);
        await ConversaAtendimento.findByIdAndUpdate(conversa._id, conversa);

        responseFlexIA = await flexIA_Assistente.resolveAcao(responseFlexIA2, conversa, flexIA_Assistente, origem);
        /* TODO subir serviço de SMS em servidor externo para não quebrar action
                if (protocoloCompleto) {
                  let responseSMSAPI = await servicoSMS.login('admin', 'g3quatro!@#flexreload');
                  await servicoSMS.sendSMS(responseSMSAPI.token, `Numero do seu protocolo criado pela FlexIA  ${responseSF.protocolo}`, [responseSF.telefone]);
                }
        */
        return true;

      } else {
        return this.sucessor.trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem);
      }
    } catch (err) {
      log.error('** Erro na Action: criarProtocolo **')
      log.error(`** Erro: ${err} **`)
    }
  }
}

module.exports = new AcaoCriarProtocolo();
