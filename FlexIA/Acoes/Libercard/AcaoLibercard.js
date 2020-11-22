const log = require('../../../api/util/logs');
const TrataAcoes = require('../TrataAcoes');
const ConversaAtendimento = require("../../../api/conversa/conversa_atendimento.model");
const { consultarCredenciado } = require('./consultarCredenciado');

class AcaoLibercard extends TrataAcoes {
    constructor() {
        super();
    }

    setSucessor(sucessor) {
        this.sucessor = sucessor;
    }

    async trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem) {
        log.log('Passou na Action: libercard');
        try {

            if (acao === 'libercard') {
                log.success(` ==> Entrou na Action: libercard <==`);
                const parametros = responseFlexIA.output.user_defined.actions[0].parameters;

                let resposta = {
                    erro: true
                };
                console.log(`============================================================`);
                console.log(`PRONUTRIR: ${new Date()} para fazer ${parametros.function}`);
                console.log(`============================================================`);

                if (parametros.function == 'consultarCredenciado') {
                    resposta.credenciado = await consultarCredenciado(parametros);
                    if (resposta.credenciado.idRetorno == "00") {
                        resposta.erro = false;
                    }
                    console.log(`============================================================`);
                    console.log('Resposta credenciado', resposta);
                    console.log(`============================================================`);
                } else {
                    console.log(`============================================================`);
                    console.log(`libercard: Function ${parametros.function} não encontrada`);
                    console.log(`============================================================`);
                }

                let responseFlexIA2 = await flexIA_Assistente.enviarMensagem(origem, conversa.idSessao, '', { resposta });

                conversa = await flexIA_Assistente.insereNoModelConversa(conversa, responseFlexIA2, null, conversa.idSessao, resposta);
                await ConversaAtendimento.findByIdAndUpdate(conversa._id, conversa);

                responseFlexIA = await flexIA_Assistente.resolveAcao(responseFlexIA2, conversa, flexIA_Assistente, origem);

                return true;

            } else {
                return await this.sucessor.trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem);
            }
        } catch (error) {
            log.error('** Erro na Action: pronutrir **')
            log.error(`** Erro: ${error} **`);
        }
    }
}

module.exports = new AcaoLibercard();