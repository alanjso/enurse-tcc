const log = require('../../api/util/logs')
const TrataAcoes = require("./TrataAcoes");
const ConversaAtendimento = require("../../api/conversa/conversa_atendimento.model");
const rp = require('request-promise-native');

class AcaoConsultaCnpj extends TrataAcoes {
    constructor() {
        super();
    }

    setSucessor(sucessor) {
        this.sucessor = sucessor;
    }

    async trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem) {
        log.log('Passou na Action: consultaCNPJ');
        try {

            if (acao === 'consultaCNPJ') {
                log.success(` ==> Entrou na Action: consultaCNPJ <==`);
                const CNPJ = responseFlexIA.output.user_defined.actions[0].parameters.CNPJ;
                const resp = await rp({
                    method: 'GET',
                    uri: `http://161.35.3.212:4127/api/v1/revenda/verifica/${CNPJ}`,
                    encoding: "binary",
                    json: true
                });
                // console.log(`Resposta CNPJ: ${JSON.stringify(resp)}`);
                let revenda = {};
                if (resp.error) {
                    revenda.error = resp.error
                } else {
                    revenda = {
                        idRevenda: resp.revenda.id,
                        nome: resp.revenda.nome,
                        cnpj: resp.revenda.cnpj
                    };
                }

                let responseFlexIA2 = await flexIA_Assistente.enviarMensagem(origem, conversa.idSessao, '', { revenda });

                conversa = await flexIA_Assistente.insereNoModelConversa(conversa, responseFlexIA2, null, conversa.idSessao, revenda);
                await ConversaAtendimento.findByIdAndUpdate(conversa._id, conversa);

                responseFlexIA = await flexIA_Assistente.resolveAcao(responseFlexIA2, conversa, flexIA_Assistente, origem);

                return true;

            } else {
                return await this.sucessor.trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem);
            }
        } catch (error) {
            log.error('** Erro na Action: consultaCNPJ **')
            log.error(`** Erro: ${error} **`);
        }
    }
}

module.exports = new AcaoConsultaCnpj();