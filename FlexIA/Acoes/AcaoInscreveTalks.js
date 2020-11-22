const log = require('../../api/util/logs')
const TrataAcoes = require("./TrataAcoes");
const ConversaAtendimento = require("../../api/conversa/conversa_atendimento.model");
const sendToSalesforce = require("../../api/services/sendToSalesforce");
const config = require('config');


class AcaoInscreveTalks extends TrataAcoes {
    constructor() {
        super();
    }

    setSucessor(sucessor) {
        this.sucessor = sucessor;
    }

    async trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem) {
        log.log('Passou na Action: inscreveTalks');
        try {
            if (acao === 'inscreveTalks') {
                log.success(` ==> Entrou na Action: inscreveTalks <== `);

                let data = {
                    talksId: responseFlexIA.output.actions[0].parameters.idTalks,
                    inscritoId: conversa.idSF,
                    tipoInscrito: conversa.tipoCadastroSF
                };

                let responseSF = JSON.parse(await sendToSalesforce(data, `${config.get('salesforce_url')}/services/apexrest/talks/inscricao`, 'POST'));

                // console.log(`Inscrição do talks: ${JSON.stringify(responseSF)}`);

                responseFlexIA = await flexIA_Assistente.enviarMensagem(origem, conversa.idSessao, '', { inscricaoTalks: responseSF.inscricaoTalksId, erro: responseSF.erro });

                conversa = await flexIA_Assistente.insereNoModelConversa(conversa, responseFlexIA, null, conversa.idSessao, null);
                await ConversaAtendimento.findByIdAndUpdate(conversa._id, conversa);

                return true;

            } else {
                return await this.sucessor.trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem);
            }
        } catch (err) {
            log.error('** Erro na Action: inscreveTalks **')
            log.error(`** Erro: ${err} **`);
        }
    }
}

module.exports = new AcaoInscreveTalks();