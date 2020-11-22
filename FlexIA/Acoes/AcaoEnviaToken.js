const log = require('../../api/util/logs')
const TrataAcoes = require('./TrataAcoes');
const crypto = require('crypto');
const rp = require('request-promise-native');
const Configuracao = require('../../api/configuracao/configuracao.model');
// const emailSender = require('../../api/util/emailSender');
// const servicoSMS = require('../../api/services/ServiceSMS');

class AcaoEnviaToken extends TrataAcoes {
    constructor() {
        super();
    }

    setSucessor(sucessor) {
        this.sucessor = sucessor;
    }

    async trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem) {
        log.log('Passou na Action: enviaToken');
        try {
            if (acao === 'enviaToken') {
                log.success(` ==> Entrou na Action: enviaToken <== `);
                const canal = responseFlexIA.output.user_defined.actions[0].parameters.canal;
                // Gerar token randomico de 6 digitos
                let token = crypto.randomBytes(3).toString('hex').toLowerCase();

                // Token baseada numa nova data
                // console.log(`New date: ${(+new Date).toString(36)}`);

                if (canal === 'email') {
                    // Enviar email com a token
                    // await emailSender(conversa.cliente.email, 'Token de Verificação', emailText, null);
                    const config = await Configuracao.findOne();
                    const emailSender = config.email;
                    let emailText = `Olá, digite apenas sua token exatamente como mostrada a seguir na conversa atual.\n Token: ${token}`;
                    await rp({
                        uri: 'https://flexia.g4flex.com.br:5555/enviaremail',
                        headers: {
                            'Content-type': 'application/x-www-form-urlencoded',
                        },
                        method: 'POST',
                        body: {
                            'hostSMTP': emailSender.hostSMTP,
                            'address': emailSender.address,
                            'password': emailSender.password,
                            'name': emailSender.name,
                            'emailTo': conversa.cliente.email,
                            'subject': 'Token de Verificação',
                            'text': emailText,
                            'html': ''
                        },
                    });
                } else if (canal === 'sms') {
                    let smsText = `Sua token de verificacao e ${token}`;
                    await rp({
                        uri: 'http://187.60.42.212:4050/v1/avulso',
                        headers: {
                            'x-access-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjpbInBlcm1pc3Npb24iLCJncnVwbyIsImNvbnRhdG8iLCJzbXNfYW5hbGl0aWNvIiwic21zX3NpbnRhdGljbyIsInVzZXIiLCJzbXMiLCJjaGlwIl0sImlhdCI6MTU4NzQxMjk2Mn0.5NK23STS79vsB7dDR9IWVnS01-HmI7uJ5JyQEk9a5NY',
                        },
                        method: 'POST',
                        body: {
                            'mensagem': smsText,
                            'numero': conversa.cliente.celular
                        },
                    });
                    // let responseSMSAPI = await servicoSMS.login('admin', 'g3quatro!@#flexreload');
                    // await servicoSMS.sendSMS(responseSMSAPI.token, `Texto a ser decidido junto da token: ${token}`, [conversa.cliente.celular]);

                } else {
                    console.log('Canal email ou sms não definido');
                }
                // Enviar token para o watson comparar
                responseFlexIA = await flexIA_Assistente.enviarMensagem(origem, conversa.idSessao, '', { token: token });
                conversa = await flexIA_Assistente.insereNoModelConversa(conversa, responseFlexIA, null, conversa.idSessao, null);

                return true;

            } else {
                return await this.sucessor.trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem);
            }
        } catch (err) {
            log.error('** Erro na Action: enviaToken **')
            log.error(`** Erro: ${err} **`);
        }
    }
}

module.exports = new AcaoEnviaToken();