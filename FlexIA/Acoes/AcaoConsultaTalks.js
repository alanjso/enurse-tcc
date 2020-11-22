const TrataAcoes = require("./TrataAcoes");
const ConversaAtendimento = require("../../api/conversa/conversa_atendimento.model");
const sendToSalesforce = require("../../api/services/sendToSalesforce");
const log = require('../../api/util/logs')
const config = require('config');

class AcaoConsultaTalks extends TrataAcoes {
    constructor() {
        super();
    }

    setSucessor(sucessor) {
        this.sucessor = sucessor;
    }

    async trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem) {
        log.log('Passou na Action: AcaoConsultaTalks');
        try {
            if (acao === 'consultaTalks') {
                log.success(` ==> Entrou na Action: AcaoConsultaTalks <==`);

                let talks = JSON.parse(await sendToSalesforce({}, `${config.get('salesforce_url')}/services/apexrest/talks`, 'GET'));

                let responseFlexIA2 = await flexIA_Assistente.enviarMensagem(origem, conversa.idSessao, '', { talks: talks });

                conversa = await flexIA_Assistente.insereNoModelConversa(conversa, responseFlexIA2, null, conversa.idSessao, { talks: talks });
                await ConversaAtendimento.findByIdAndUpdate(conversa._id, conversa);

                responseFlexIA = await flexIA_Assistente.resolveAcao(responseFlexIA2, conversa, flexIA_Assistente, origem);

                return true;
            } else {
                return await this.sucessor.trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem);
            }
        } catch (err) {
            log.error('** Erro na Action: AcaoConsultaTalks **')
            log.error(`** Erro: ${err} **`);
        }
    }
}

module.exports = new AcaoConsultaTalks();