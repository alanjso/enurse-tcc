const log = require('../../api/util/logs')
const TrataAcoes = require('./TrataAcoes');
const rp = require('request-promise-native');
const Configuracao = require('../../api/configuracao/configuracao.model');

class AcaoEnviaEmail extends TrataAcoes {
    constructor() {
        super();
    }

    setSucessor(sucessor) {
        this.sucessor = sucessor;
    }

    async trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem) {
        log.log('Passou na Action: enviaEmail');
        try {
            if (acao === 'enviaEmail') {
                log.success(` ==> Entrou na Action: enviaEmail <== `);

                const parameters = responseFlexIA.output.user_defined.actions[0].parameters;
                const config = await Configuracao.findOne();
                const emailSender = config.email;

                const response = await rp({
                    uri: 'http://flexia.g4flex.com.br:5555/enviaremail',
                    headers: {
                        'Content-type': 'application/json',
                    },
                    method: 'POST',
                    body: {
                        hostSMTP: emailSender.hostSMTP,
                        address: emailSender.address,
                        password: emailSender.password,
                        name: emailSender.name,
                        emailTo: parameters.email ? parameters.email : conversa.cliente.email,
                        subject: parameters.subject ? parameters.subject : 'assunto',
                        text: parameters.emailText ? parameters.emailText : 'texto',
                        html: parameters.html ? parameters.html : ''
                    },
                    json: true
                });

                let enviado;
                if (response.msg == 'Email na fila para ser enviado') {
                    enviado = true;
                } else {
                    enviado = false
                }

                responseFlexIA = await flexIA_Assistente.enviarMensagem(origem, conversa.idSessao, '', { enviado: enviado });
                conversa = await flexIA_Assistente.insereNoModelConversa(conversa, responseFlexIA, null, conversa.idSessao, null);

                return true;

            } else {
                return await this.sucessor.trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem);
            }
        } catch (err) {
            log.error('** Erro na Action: enviaEmail **')
            log.error(`** Erro: ${err} **`);
        }
    }
}

module.exports = new AcaoEnviaEmail();