const TrataAcoes = require("./TrataAcoes");
const ConversaAtendimento = require("../../api/conversa/conversa_atendimento.model");
const log = require('../../api/util/logs');
const eventEmit = require('../../api/util/eventEmmiter');

class Checkpoint extends TrataAcoes {
    constructor() {
        super();
    }

    setSucessor(sucessor) {
        this.sucessor = sucessor;
    }

    async trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem) {
        //console.log('Passou em checkpoint');
        try {
            if (acao === 'checkpoint') {
                //console.log(`entrou em checkpoint`);
                let update = {};

                if (responseFlexIA.output.user_defined.actions[0].parameters.fila)
                    update["fila"] = responseFlexIA.output.user_defined.actions[0].parameters.fila;

                if (responseFlexIA.output.user_defined.actions[0].parameters.resumoBot)
                    update["resumoBot"] = responseFlexIA.output.user_defined.actions[0].parameters.resumoBot;

                if (responseFlexIA.output.user_defined.actions[0].parameters.nome) {
                    let cliente = {};
                    cliente.nome = conversa.cliente.nome ? conversa.cliente.nome : responseFlexIA.output.user_defined.actions[0].parameters.nome;
                    cliente.email = conversa.cliente.email ? conversa.cliente.email : responseFlexIA.output.user_defined.actions[0].parameters.email;
                    cliente.cpf = conversa.cliente.cpf ? conversa.cliente.cpf : responseFlexIA.output.user_defined.actions[0].parameters.cpf;
                    cliente.celular = conversa.cliente.celular ? conversa.cliente.celular : responseFlexIA.output.user_defined.actions[0].parameters.telefone;
                    cliente.id_telegram = conversa.cliente.id_telegram ? conversa.cliente.id_telegram : '';
                    cliente.id_facebook = conversa.cliente.id_facebook ? conversa.cliente.id_facebook : '';
                    update["cliente"] = cliente;
                }
                conversa = await ConversaAtendimento.findByIdAndUpdate(conversa._id,
                    {
                        $set: update
                    });

                return true;

            } else {
                return await this.sucessor.trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem);
            }
        } catch (err) {
            log.error('** Erro na Checkpoint **');
            log.error(`** Erro: ${err} **`);
        }
    }
}

module.exports = new Checkpoint();