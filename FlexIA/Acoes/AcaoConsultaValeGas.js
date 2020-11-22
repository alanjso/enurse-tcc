const log = require('../../api/util/logs')
const TrataAcoes = require("./TrataAcoes");
const ConversaAtendimento = require("../../api/conversa/conversa_atendimento.model");
const rp = require('request-promise-native');

class AcaoConsultaValeGas extends TrataAcoes {
    constructor() {
        super();
    }

    setSucessor(sucessor) {
        this.sucessor = sucessor;
    }

    async trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem) {
        log.log('Passou na Action: consultaValeGas');
        try {

            if (acao === 'consultaValeGas') {
                log.success(` ==> Entrou na Action: consultaValeGas <==`);

                let valeGas = responseFlexIA.output.user_defined.actions[0].parameters.valeGas;
                let idRevenda = responseFlexIA.output.user_defined.actions[0].parameters.idRevenda
                const resp = await rp({
                    method: 'PUT',
                    uri: `http://161.35.3.212:4127/api/v1/vale/verifica/${valeGas}`,
                    encoding: "binary",
                    body: {
                        id_revenda: idRevenda
                    },
                    json: true
                });

                // console.log(`Resposta Vale: ${JSON.stringify(resp)}`);
                let vale = {};
                if (resp.error) {
                    vale.error = resp.error
                } else {
                    vale.message = resp.message;
                }


                let responseFlexIA2 = await flexIA_Assistente.enviarMensagem(origem, conversa.idSessao, '', { vale });

                conversa = await flexIA_Assistente.insereNoModelConversa(conversa, responseFlexIA2, null, conversa.idSessao, vale);
                await ConversaAtendimento.findByIdAndUpdate(conversa._id, conversa);

                responseFlexIA = await flexIA_Assistente.resolveAcao(responseFlexIA2, conversa, flexIA_Assistente, origem);

                return true;

            } else {
                return await this.sucessor.trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem);
            }
        } catch (error) {
            log.error('** Erro na Action: consultaValeGas **')
            log.error(`** Erro: ${error} **`);
        }
    }
}

module.exports = new AcaoConsultaValeGas();