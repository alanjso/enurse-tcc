const TrataAcoes = require("./TrataAcoes");
const ConversaAtendimento = require("../../api/conversa/conversa_atendimento.model");
const log = require('../../api/util/logs');

class AcaoSucessoBot extends TrataAcoes {
    constructor() {
        super();
    }

    setSucessor(sucessor) {
        this.sucessor = sucessor;
    }

    async trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem) {
        try {
            if (acao === 'sucessoAtendimento') {
                console.log(`entrou em sucessoAtendimento`);

                conversa = await ConversaAtendimento.findByIdAndUpdate(conversa._id,
                    {
                        $set:
                        {
                            sucessoAtendimento: true
                        }
                    });

                return true;

            } else {
                return await this.sucessor.trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem);
            }
        } catch (err) {
            log.error('** Erro na Action sucessoAtendimento **');
            log.error(`** Erro: ${err} **`);
        }
    }
}

module.exports = new AcaoSucessoBot();