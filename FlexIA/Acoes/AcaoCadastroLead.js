const log = require('../../api/util/logs')
const TrataAcoes = require("./TrataAcoes");
const ConversaAtendimento = require("../../api/conversa/conversa_atendimento.model");
const sendToSalesforce = require("../../api/services/sendToSalesforce");
const servicoSMS = require("../../api/services/ServiceSMS");
const config = require('config');


class AcaoCadastroLead extends TrataAcoes {
  constructor() {
    super();
  }

  setSucessor(sucessor) {
    this.sucessor = sucessor;
  }

  async trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem) {
    log.log('Passou na Action: cadastroLead');
    try {
      if (acao === 'cadastroLead') {
        log.success(` ==> Entrou na Action: cadastroLead <== `);

        let data = {};
        if (responseFlexIA.output.actions[0].parameters.flag === 'humanoAssistido') {
          data = {
            LastName: responseFlexIA.output.actions[0].parameters.nome,
            email: responseFlexIA.output.actions[0].parameters.email,
            LeadSource: 'FlexIA',
            Redes_Sociais__c: responseFlexIA.output.actions[0].parameters.redesSociais
          }
        } else if (responseFlexIA.output.actions[0].parameters.flag === 'cadastroLead') {
          data = {
            LastName: responseFlexIA.output.actions[0].parameters.nome,
            email: responseFlexIA.output.actions[0].parameters.email,
            Company: responseFlexIA.output.actions[0].parameters.empresa,
            MobilePhone: responseFlexIA.output.actions[0].parameters.telefone,
            LeadSource: responseFlexIA.output.actions[0].parameters.eventoDeOrigem,
            Description: responseFlexIA.output.actions[0].parameters.descricao,
          }
        } else if (responseFlexIA.output.actions[0].parameters.flag === 'cadastroLeadConsultor') {
          data = {
            LastName: responseFlexIA.output.actions[0].parameters.nome,
            email: responseFlexIA.output.actions[0].parameters.email,
            Company: responseFlexIA.output.actions[0].parameters.empresa,
            MobilePhone: responseFlexIA.output.actions[0].parameters.telefone,
            LeadSource: responseFlexIA.output.actions[0].parameters.eventoDeOrigem,
            idConsultor: responseFlexIA.output.actions[0].parameters.idConsultor
          }
        }

        let responseSF = JSON.parse(await sendToSalesforce(data, `${config.get('salesforce_url')}/services/apexrest/contatolead`, 'POST'));
        // let responseSF = JSON.parse(await sendToSalesforce(data, `${config.get('salesforce_url')}/services/apexrest/lead`, 'POST'));

        //let responseFlexIA2 = await flexIA_Assistente.enviarMensagem(origem, conversa.idSessao, '', {lead: responseSF.idCadastro})

        if (data.idConsultor) {
          // Serviço quebra na nuvem, necessário migrar serviço
          // let responseSMSAPI = await servicoSMS.login('admin', 'g3quatro!@#flexreload');
          // await servicoSMS.sendSMS(responseSMSAPI.token, `Link do Lead criado por voce: ${config.get('salesforce_url')}/${responseSF.idCadastro}`, [responseSF.telefoneConsultor]);
        }

        if (responseFlexIA.output.actions[0].parameters.flag === 'humanoAssistido' || responseFlexIA.output.actions[0].parameters.flag === 'cadastroLead') {
          let cliente = {
            nome: responseFlexIA.output.actions[0].parameters.nome,
            email: responseFlexIA.output.actions[0].parameters.email,
          }

          responseFlexIA.output.actions[0].parameters.telefone ? cliente.telefone = responseFlexIA.output.actions[0].parameters.telefone : 0;
          responseFlexIA.output.actions[0].parameters.empresa ? cliente.empresa = responseFlexIA.output.actions[0].parameters.empresa : 0;
          conversa.cliente.cpf ? cliente.cpf = conversa.cliente.cpf : 0;

          await ConversaAtendimento.findByIdAndUpdate(conversa._id,
            {
              $set:
              {
                idSF: responseSF.idCadastro,
                tipoCadastroSF: responseSF.tipoCadastro
              }
            });
        }

        responseFlexIA = await flexIA_Assistente.enviarMensagem(origem, conversa.idSessao, '', { lead: responseSF.idCadastro });

        conversa = await flexIA_Assistente.insereNoModelConversa(conversa, responseFlexIA, null, conversa.idSessao, null);
        await ConversaAtendimento.findByIdAndUpdate(conversa._id, conversa);

        return true;

      } else {
        return await this.sucessor.trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem);
      }
    } catch (err) {
      log.error('** Erro na Action: cadastroLead **')
      log.error(`** Erro: ${err} **`);
    }
  }
}

module.exports = new AcaoCadastroLead();