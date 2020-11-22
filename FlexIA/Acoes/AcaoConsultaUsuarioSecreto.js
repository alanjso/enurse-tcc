const TrataAcoes = require("./TrataAcoes");
const ConversaAtendimento = require("../../api/conversa/conversa_atendimento.model");
const sendToSalesforce = require("../../api/services/sendToSalesforce");
const config = require('config');


class AcaoConsultaUsuarioSecreto extends TrataAcoes {
  constructor() {
    super();
  }

  setSucessor(sucessor) {
    this.sucessor = sucessor;
  }

  async trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem) {
    //console.log('Passou em açãoConsultaUsuarioSecreto');
    try {
      if (acao === 'consultaUsuarioSecreto') {

        let variaveisContexto = {};

        let secretCode = responseFlexIA.output.user_defined.actions[0].parameters.secretCode;

        let responseSF = JSON.parse(await sendToSalesforce({ 'secretCode': secretCode }, `${config.get('salesforce_url')}/services/apexrest/user`, 'POST'));

        variaveisContexto.resultado_codigo = responseSF.found;

        if (responseSF.found == true) {
          //console.log('ENTROU CORRETAMENTE');
          variaveisContexto.idConsultor = responseSF.ID;
          variaveisContexto.nome = responseSF.nome;
          variaveisContexto.telefone = responseSF.telefone;
          variaveisContexto.email = responseSF.email;
        }

        let responseFlexIA2 = await flexIA_Assistente.enviarMensagem(origem, conversa.idSessao, 'enterx', variaveisContexto);

        conversa = await flexIA_Assistente.insereNoModelConversa(conversa, responseFlexIA2, null, conversa.idSessao, variaveisContexto);

        await ConversaAtendimento.findByIdAndUpdate(conversa._id, conversa);

        responseFlexIA = await flexIA_Assistente.resolveAcao(responseFlexIA2, conversa, flexIA_Assistente, origem);

        return true;

      } else {
        return this.sucessor.trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem);
      }
    } catch (err) {
      console.log(`ERRO em AcaoConsultaUsuarioSecreto: ${err}`);
    }
  }
}

module.exports = new AcaoConsultaUsuarioSecreto();