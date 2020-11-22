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

let tempoTarefaOciosidade = 600000; // 1800000 = 30 min / 600000 = 10 min / 60000 = 1 min
setInterval(async function () {
    try {
        const config = await Configuracao.findOne();

        if (config.timeoutAtendimento.habilitado) {

            // let conversasPresas = await ConversaAtendimento.find({ 'encerrada': true });
            // if (conversasPresas.length > 0) {
            //     for (const presa of conversasPresas) {
            //         await limpaCacheSemAlterar(presa._id);
            //     }
            // }

            let conversas = await ConversaAtendimento.find({ 'encerrada': false, 'situacao': 'em_atendimento' });
            // console.log(`Hora da tarefa: ${new Date()}, Quantidade de conversas: ${conversas.length}`);
            // let encerradas = 0;
            if (conversas.length > 0) {
                for (const conversa of conversas) {
                    if (conversa.mensagens && conversa.mensagens.length > 0) {
                        diff = dateFns.differenceInMilliseconds(new Date(), conversa.mensagens[conversa.mensagens.length - 1].hora_da_mensagem, { unit: 'ms' });
                        if (diff > config.timeoutAtendimento.timeout) {
                            await ConversaAtendimento.updateOne({ _id: conversa._id }, {
                                $set: {
                                    encerrada: true,
                                    situacao: 'abandonada',
                                    hora_fim_conversa: new Date(),
                                    observacao: `Conversa sem interação a mais de ${config.timeoutAtendimento.timeout}ms`,
                                    encerrada_por: 'OCIOSIDADE'
                                }
                            });
                            await limpaCache(conversa._id);
                            // log.success(`Conversa com ID: ${conversa._id} encerrada por ociosidade`);
                            eventEmit.emit('conversa_abandonada_ociosidade', conversa._id), conversa.cliente.nome;
                            // encerradas = encerradas + 1;
                        }
                    }
                }
                //console.log(`${encerradas} foram encerradas durante essa tarefa`);
            }
        }


    } catch (error) {
        log.error('** Erro na schedule de conversas ociosas **');
        log.error(`** Erro: ${error} **`);
    }

}, tempoTarefaOciosidade);

let tempoTarefaMensagemFila = 1000; // 1800000 = 30 min / 600000 = 10 min / 60000 = 1 min
setInterval(async function () {
    try {
        // Buscar conversas em fila pelo canal chat para broadcast
        const msgFila = await MensagemFila.find();
        if (msgFila.length > 0) {
            const msgFilaAleatoria = msgFila[Math.floor(Math.random() * msgFila.length)];

            let query = { 'encerrada': false }
            query["situacao"] = { $in: ['nao_atendida', 'transferida'] };
            query["canal"] = { $in: ['chat', 'ChatFlexIA'] };
            let conversasFilaChat = await ConversaAtendimento.find(query);

            if (conversasFilaChat.length > 0) {
                eventEmit.emit('enviar_msg_fila', msgFilaAleatoria);
            }

            // Buscar conversas em fila pelos canais não-chat para enviar uma a uma
            query["canal"] = { $ne: ['chat', 'ChatFlexIA'] };
            let conversasFilaCanais = await ConversaAtendimento.find(query);

            if (conversasFilaCanais.length > 0) {
                await atualizaCredenciaisCanais();

                for (const conversa of conversasFilaCanais) {
                    if (msgFilaAleatoria.response_type == 'text') {
                        // Envia texto nos canais
                        if (conversa.canal == 'whatsapp') {
                            // enviar para wpp
                            await enviaMsgWhatsapp(msgFilaAleatoria.texto, conversa.cliente.celular);
                        } else if (conversa.canal == 'telegram') {
                            //   enviar para telegram
                            eventEmit.emit('enviar_msg_telegram', conversa.cliente.id_telegram, msgFilaAleatoria.texto);
                        } else if (conversa.canal == 'facebook') {
                            // enviar para fb
                            await enviarFacebook(msgFilaAleatoria.texto, conversa.cliente.id_facebook);
                        }
                    } else if (msgFilaAleatoria.response_type == 'image') {
                        // enviar foto nos canais
                        if (conversa.canal == 'whatsapp') {
                            // enviar para wpp
                            await enviaImageWhatsApp(msgFilaAleatoria.source, conversa.cliente.celular, '558539240077');
                        } else if (conversa.canal == 'telegram') {
                            //   enviar para telegram
                            eventEmit.emit('enviar_foto_telegram', conversa.cliente.id_telegram, msgFilaAleatoria.source);
                        } else if (conversa.canal == 'facebook') {
                            // enviar para fb
                            await enviarArquivoFacebook(msgFilaAleatoria.source, conversa.cliente.id_facebook, 'image');
                        }
                    } else {
                        // Outros: lançar futuramente
                        console.log('mensagem com solução não mapeada');
                    }
                }
            }
        }

    } catch (error) {
        log.error('** Erro na schedule de mensagens automaticas na fila **');
        log.error(`** Erro: ${error} **`);
    }

}, tempoTarefaMensagemFila);
// setInterval(async function () {
//     try {
//         // Buscar conversas em fila
//         let query = { 'encerrada': false }
//         query["situacao"] = { $in: ['nao_atendida', 'transferida'] };
//         let conversasFila = await ConversaAtendimento.find(query);

//         if (conversasFila.length > 0) {
//             // Para cada conversa buscar mensagemFila
//             for (const conversa of conversasFila) {
//                 const msgFila = await MensagemFila.find({ 'filas.nome': conversa.fila });
//                 if (msgFila.length > 0) {
//                     // Atualizar configurações dos canais antes de tentar enviar
//                     await atualizaCredenciaisCanais();
//                     // Escolher aleatoriamente uma mensagemFila
//                     const msgFilaAleatoria = msgFila[Math.floor(Math.random() * msgFila.length)]
//                     // Atualizar conversa com a nova msg automatica
//                     conversa.mensagens.push(msgFilaAleatoria);
//                     await ConversaAtendimento.findOneAndUpdate({ _id: conversa._id }, conversa);
//                     // Enviar mensagem de acordo com tipo de midia e de canal
//                     if (msgFilaAleatoria.response_type == 'text') {
//                         // Envia texto nos canais
//                         if (conversa.canal == 'whatsapp') {
//                             // enviar para wpp
//                             await enviaMsgWhatsapp(msgFilaAleatoria.texto, conversa.cliente.celular);
//                         } else if (conversa.canal == 'telegram') {
//                             //   enviar para telegram
//                             eventEmit.emit('enviar_msg_telegram', conversa.cliente.id_telegram, msgFilaAleatoria.texto);
//                         } else if (conversa.canal == 'facebook') {
//                             // enviar para fb
//                             await enviarFacebook(msgFilaAleatoria.texto, conversa.cliente.id_facebook);
//                         } else if (conversa.canal == 'chat' || conversa.canal == 'ChatFlexIA') {
//                             // enviar para chat
//                             console.log('chat');
//                             eventEmit.emit('enviar_msg_fila', conversa, msgFilaAleatoria);
//                         }
//                     } else if (msgFilaAleatoria.response_type == 'image') {
//                         // enviar foto nos canais
//                         if (conversa.canal == 'whatsapp') {
//                             // enviar para wpp
//                             await enviaImageWhatsApp(msgFilaAleatoria.source, conversa.cliente.celular, '558539240077');
//                         } else if (conversa.canal == 'telegram') {
//                             //   enviar para telegram
//                             eventEmit.emit('enviar_foto_telegram', conversa.cliente.id_telegram, msgFilaAleatoria.source);
//                         } else if (conversa.canal == 'facebook') {
//                             // enviar para fb
//                             await enviarArquivoFacebook(msgFilaAleatoria.source, conversa.cliente.id_facebook, 'image');
//                         } else if (conversa.canal == 'chat' || conversa.canal == 'ChatFlexIA') {
//                             // enviar para chat
//                             eventEmit.emit('enviar_msg_fila', conversa, msgFilaAleatoria);
//                         }
//                     } else {
//                         // Outros: lançar futuramente
//                         console.log('mensagem com solução não mapeada');
//                     }
//                 } else {
//                     console.log(`Sem mensagens cadastradas para a fila ${conversa.fila}`);
//                 }
//             }
//         }
//     } catch (error) {
//         log.error('** Erro na schedule de mensagens automaticas na fila **');
//         log.error(`** Erro: ${error} **`);
//     }

// }, tempoTarefaMensagemFila);

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