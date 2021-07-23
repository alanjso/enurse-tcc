const dateFns = require('date-fns');
const eventEmit = require('../util/eventEmmiter');
const log = require('../util/logs');
const Configuracao = require('../configuracao/configuracao.model');
const User = require('../user/user-model');
const ConversaAtendimento = require('../conversa/conversa_atendimento.model');
const ConversaEncerrada = require('../conversa/conversa.model');
const Fila = require('../fila/fila-model');
const limpaCache = require('./limpaCache');
// const limpaCacheSemAlterar = require('./limpaCacheSemAlterar');
const MensagemFila = require('../mensagemFila/mensagemFila-model');
const rp = require('request-promise-native');
const enviaImageWhatsApp = require('../conversa/whatsapp/envia-imagem-whatsapp');
const config = require('config');

let configSinaisVitais = require('../util/minMaxSinaisVitais');
let sinaisVitaisAtuais = {
    frequenciaCardiaca: 0,
    saturacaoOxigenio: 0,
    temperatura: 0,
    fluxoRespiratorio: 0,
    sudorese: 0
}
eventEmit.on('verifica_range', async (sinaisVitais) => {
    // console.log("Novos valores:");
    // console.log(sinaisVitais);
    sinaisVitaisAtuais = sinaisVitais;
    if (typeof sinaisVitaisAtuais.frequenciaCardiaca == 'string') {
        let fc = sinaisVitaisAtuais.frequenciaCardiaca;
        sinaisVitaisAtuais.frequenciaCardiaca = parseInt(fc.replace(/BPM/g, ''));
    }

    if (typeof sinaisVitaisAtuais.saturacaoOxigenio == 'string') {
        let so = sinaisVitaisAtuais.saturacaoOxigenio;
        sinaisVitaisAtuais.saturacaoOxigenio = parseInt(so.replace(/SPO2/g, ''));
    }

    if (typeof sinaisVitaisAtuais.temperatura == 'string') {
        let temp = sinaisVitaisAtuais.temperatura;
        sinaisVitaisAtuais.temperatura = parseFloat(temp.replace(/ºC/g, ''));
    }
    // sinaisVitaisAtuais.fluxoRespiratorio = parseInt(sinaisVitaisAtuais.fluxoRespiratorio.replace(/\D+/g, ''));
    // sinaisVitaisAtuais.sudorese = parseInt(sinaisVitaisAtuais.sudorese.replace(/\D+/g, ''));

});

let configWhatsapp;
let configFacebook;

async function atualizaCredenciaisCanais() {
    // Inicializando constantes para utilizar no código
    try {
        let config = await Configuracao.findOne();
        configWhatsapp = config.whatsapp;
        configFacebook = config.facebook;
    } catch (error) {
        log.error('** Erro ao atualizar credenciais dos Canais **');
        log.error(`** Erro: ${error} **`);
    }
}

async function enviaMsgWhatsapp(mensagem, celular) {
    return new Promise((resolve, reject) => {
        const requestBody = {
            channel: configWhatsapp.channel ? configWhatsapp.channel : 'whatsapp',
            source: configWhatsapp.source ? configWhatsapp.source : '558530331787',
            destination: celular,
            message: mensagem,
            'src.name': configWhatsapp.srcName ? configWhatsapp.srcName : 'G4FlexApp03'
        }

        const config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cache-Control': 'no-cache',
                'apikey': configWhatsapp.apikey ? configWhatsapp.apikey : '69cb713b279b48acc88370f7ca00c91f'
            }
        }

        axios.post('https://api.gupshup.io/sm/api/v1/msg', qs.stringify(requestBody), config)
            .then((result) => {
                resolve();
                // console.log('result: ', result);
            })
            .catch((err) => {
                reject();
                console.log('error: ', err);
            })
    });
}

async function enviarFacebook(mensagem, userID) {
    await rp({
        uri: configFacebook.urlFacebook,
        qs: { access_token: configFacebook.facebook_access_token },
        method: 'POST',
        json: {
            recipient: { id: userID },
            message: { text: mensagem }
        }
    });
}

async function enviarArquivoFacebook(urlArquivo, userID, type) {
    await rp({
        uri: configFacebook.urlFacebook,
        qs: { access_token: configFacebook.facebook_access_token },
        method: 'POST',
        json: {
            recipient: { id: userID },
            message: {
                attachment: {
                    type: type,
                    payload: { url: urlArquivo, is_reusable: true }
                }
            }
        }
    });
}

let tempoTarefaNotificacaoSinais = 300000; // 1800000 = 30 min / 600000 = 10 min / 300000 = 5 min / 60000 = 1 min
setInterval(async function () {
    try {
        console.log(new Date());
        let texto = "";
        console.log('Configuração dos sinais:');
        console.log(configSinaisVitais);

        console.log('Valor dos sinais:');
        console.log(sinaisVitaisAtuais);

        if (sinaisVitaisAtuais.frequenciaCardiaca < configSinaisVitais.minBpm || sinaisVitaisAtuais.frequenciaCardiaca > configSinaisVitais.maxBpm) {
            texto = "Frequência Cardiaca do paciente fora dos limites\n";
            texto = texto + "valor atual: " + sinaisVitaisAtuais.frequenciaCardiaca;
            eventEmit.emit('notificar_medico', texto);
            texto = "";
        }

        if (sinaisVitaisAtuais.saturacaoOxigenio < configSinaisVitais.minSpo2 || sinaisVitaisAtuais.saturacaoOxigenio > configSinaisVitais.maxSpo2) {
            texto = "Saturacao de Oxigenio do paciente fora dos limites\n";
            texto = texto + "valor atual: " + sinaisVitaisAtuais.saturacaoOxigenio;
            eventEmit.emit('notificar_medico', texto);
            texto = "";
        }

        if (sinaisVitaisAtuais.temperatura < configSinaisVitais.minTemp || sinaisVitaisAtuais.temperatura > configSinaisVitais.maxTemp) {
            texto = "Temperatura do paciente fora dos limites\n";
            texto = texto + "valor atual: " + sinaisVitaisAtuais.temperatura;
            eventEmit.emit('notificar_medico', texto);
            texto = "";
        }


    } catch (error) {
        console.log('** Erro na schedule de  **');
        console.log(`** Erro: ${error} **`);
    }

}, tempoTarefaNotificacaoSinais);


async function criaConfigBasica() {
    try {
        // Cria fila Admin caso não exista!
        let filas = await Fila.find();
        let filaAdmin = null;
        if (filas.length == 0) {
            //console.log('Criando Fila');
            filaAdmin = await Fila.create({
                'nome': 'Admin',
                'descricao': 'Fila Admin G4Flex'
            });
        }

        // Cria user Admin caso não exista!
        let user = await User.findOne({ 'email': 'admin@admin.com' })
        if (!user) {
            await User.create({
                'nome': 'Admin',
                'email': 'admin@admin.com',
                'tipoDeUsuario': 'ADMINISTRADOR',
                'senha': '123456',
                'userAtivo': true,
                'darkMode': true,
                'filas': filaAdmin == null ? filas : [filaAdmin]
            });
        }
        // Cria configurações básicas caso não exista!
        const configuracao = await Configuracao.findOne();
        if (!configuracao) {
            await Configuracao.create({
                'timeoutAtendimento': {
                    'habilitado': false,
                    'timeout': 300000
                },
                'mensagens': {
                    'hasMsgAtm': false,
                    'sendAtendente': false,
                    'msgSaudacao': '',
                    'msgEncerramento': '',
                    'msgTransferencia': '',
                },
                'chat': {
                    'logoChat': '',
                    'profilePic': '',
                    'nome_chat': 'Chat',
                    'nome_atendente': 'Atendente'
                },
                'configuracao_horario_atendimento': [
                    {
                        'dia': 'SEGUNDA'
                    },
                    {
                        'dia': 'TERÇA'
                    },
                    {
                        'dia': 'QUARTA'
                    },
                    {
                        'dia': 'QUINTA'
                    },
                    {
                        'dia': 'SEXTA'
                    },
                    {
                        'dia': 'SÁBADO'
                    },
                    {
                        'dia': 'DOMINGO'
                    }
                ],
                'telegram': {
                    'tokenTelegram': '1432517810:AAE10yQt0i5csDTDH_is5-6fdaw4MgNiS2M',
                    'descricao': '@enurse_bot',
                    'usaBot': false,
                    'ativado': true
                },
                // 'watson': {

                //     'nome_canal': 'Watson',
                //     'descricao': 'Pronutrir',
                //     'atendenteBotId': `${user._id}`,
                //     'filaBotId': filas[0]._id,
                //     'assistantId': 'bccbc6f3-3211-478b-a123-f58beab657b8',
                //     'apiKey': 'XLRuiygtG2YvHpnk-qOjjFMksaveaw5U05U_SU_fTYvh',
                //     'ativado': true,
                //     'encerrarTimeoutWatson': true,

                // }
            });
        }
    } catch (error) {
        log.error('** Erro ao tentar criar configurações básicas do sistema **');
        log.error(`** Erro: ${error} **`);
    }

}
async function testes() {
    try {
    } catch (error) {
        console.log('Erro na função de teste do ');
        console.log(error);
    }
}

criaConfigBasica();
// testes();