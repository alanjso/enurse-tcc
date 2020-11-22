const log = require('../../api/util/logs')
const TrataAcoes = require("./TrataAcoes");
const ConversaAtendimento = require("../../api/conversa/conversa_atendimento.model");
const sendToSalesforce = require("../../api/services/sendToSalesforce");
const config = require('config');


class AcaoConsultaContato extends TrataAcoes {
  constructor() {
    super();
  }

  setSucessor(sucessor) {
    this.sucessor = sucessor;
  }

  async trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem) {
    log.log('Passou na Action: consultaContato');
    try {

      if (acao === 'consultaContato') {
        log.success(` ==> Entrou na Action: consultaContato <==`);
        let data = {
          email: responseFlexIA.output.actions[0].parameters.email
        }
        let responseSF = JSON.parse(await sendToSalesforce(data, `${config.get('salesforce_url')}/services/apexrest/contact`, 'POST'));

        let cliente = conversa.cliente;
        let contato = {};
        if (responseSF.encontrado) {
          contato.nomeUsuario = conversa.cliente.nome;
          contato.empresa = responseSF.empresa;
          contato.idcontato = responseSF.IDContato;
          contato.idempresa = responseSF.IDEmpresa;
          contato.celular = conversa.cliente.celular ? conversa.cliente.celular : responseSF.telefone;
          contato.email = responseSF.email;

          cliente.nome = conversa.cliente.nome ? conversa.cliente.nome : responseSF.nome;
          cliente.email = conversa.cliente.email ? conversa.cliente.email : responseSF.email;
          cliente.celular = conversa.cliente.celular ? conversa.cliente.celular : responseSF.telefone;
          conversa = await ConversaAtendimento.findByIdAndUpdate(conversa._id,
            {
              $set: {
                cliente: cliente,
                idSF: responseSF.IDContato,
                tipoCadastroSF: 'contato'
              }
            }, { new: true });
        } else {
          contato.nomeUsuario = conversa.cliente.nome;;
          contato.email = responseFlexIA.output.actions[0].parameters.email;
          cliente.nome = conversa.cliente.nome ? conversa.cliente.nome : responseFlexIA.output.actions[0].parameters.nome;
          cliente.email = conversa.cliente.email ? conversa.cliente.email : responseFlexIA.output.actions[0].parameters.email;
          cliente.celular = conversa.cliente.celular ? conversa.cliente.celular : responseFlexIA.output.actions[0].parameters.telefone;

          conversa = await ConversaAtendimento.findByIdAndUpdate(conversa._id, { $set: { cliente } }, { new: true });
        }
        contato.encontrado = responseSF.encontrado // false

        let responseFlexIA2 = await flexIA_Assistente.enviarMensagem(origem, conversa.idSessao, '', { contato });

        conversa = await flexIA_Assistente.insereNoModelConversa(conversa, responseFlexIA2, null, conversa.idSessao, contato);
        await ConversaAtendimento.findByIdAndUpdate(conversa._id, conversa);

        responseFlexIA = await flexIA_Assistente.resolveAcao(responseFlexIA2, conversa, flexIA_Assistente, origem);

        return true;

      } else {
        return await this.sucessor.trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem);
      }
    } catch (err) {
      log.error('** Erro na Action: consultaContato **')
      log.error(`** Erro: ${err} **`);
    }
  }
}

module.exports = new AcaoConsultaContato();