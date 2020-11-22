const TelegramBot = require(`node-telegram-bot-api`);
const config = require('config');
const criaClienteTelegram = require('./cria-cliente-do-telegram');
// const ConversaEncerrada = require('../conversa.model');
const ConversaAtendimento = require('../conversa_atendimento.model');
const Contato = require('../../contato/contato.model');
const verificaExisteConversaTelegram = require('./verifica-existe-conversa-telegram');
const limpaCache = require('../../util/limpaCache');
// const usa_chatbot = config.get('usa_chatbot');
const iniciaConversaComFlexia = require('../flexia/inicia-conversa-flexia');
const enviaMensagemParaFlexia = require('../flexia/envia-mensagem-flexia');
const rp = require('request-promise-native');
const fs = require('fs');
const requestFile = require('../conversa-utils/request-file');
const log = require('../../util/logs');
const ConfigGeral = require('../../configuracao/configuracao.model');
const eventEmit = require('../../util/eventEmmiter');

// Config Telegram
let TOKEN = ''; // config.get("tokenTelegram");
let telegramBot; // new TelegramBot(TOKEN, { polling: true });
let configTelegram = [];
let usa_chatbot = '';
//Eventos Telegram

const urlMidia = config.get('url_midia');
let medico = { name: 'Joel Sotero', id_telegram: 1454955671 };
let sinaisVitais = '150 bpm'
eventEmit.on('iniciar_config_telegram', async () => {

    //console.log('Emitido: iniciar_config_telegram');
    try {
        const config = await ConfigGeral.findOne();
        configTelegram = config.telegram // await ConfigTelegram.find();
        if (configTelegram && configTelegram.ativado) {
            usa_chatbot = configTelegram.usaBot;
            TOKEN = configTelegram.tokenTelegram;
            telegramBot = new TelegramBot(TOKEN, { polling: true });
            log.log('Utilizando telegram para o Token: ' + TOKEN);
            // eventEmit.emit('iniciar_server_telegram');

            if (configTelegram) {
                telegramBot.onText(/\/start/, async function (msg) {
                    let start = `/start : Envia a lista de comandos
                /encerrar : Encerra o atendimento
                /DDD9XXXXYYYY : Envie uma / seguido por seu número com DDD caso seja necessário que um de nossos atendentes lhe ligue`;

                    // await telegramBot.sendMessage(msg.chat.id, start);
                });

                telegramBot.onText(/\/(?:\(?([1-9][0-9])\)?\s?)?(?:((?:9\d|[2-9])\d{3})\-?(\d{4}))/, async function (msg, match) {
                    // (?:(?:\+|00)?(55)\s?)?(?:\(?([1-9][0-9])\)?\s?)?(?:((?:9\d|[2-9])\d{3})\-?(\d{4}))

                    const conversaExistente = await verificaExisteConversaTelegram(msg.chat.id, medico);

                    if (conversaExistente) {

                        conversaExistente.cliente.celular = `${match[1]}${match[2]}${match[3]}`;

                        await ConversaAtendimento.findOneAndUpdate({ _id: conversaExistente._id }, conversaExistente);
                    }

                    await telegramBot.sendMessage(msg.chat.id, `Celular ${match[1]}${match[2]}${match[3]} atualizado`);
                });

                telegramBot.onText(/\/encerrar/, async function (msg, match) {

                    const conversaExistente = await verificaExisteConversaTelegram(msg.chat.id, medico);

                    if (conversaExistente) {

                        if (conversaExistente.situacao === 'nao_atendida' || conversaExistente.situacao === 'transferida') {
                            conversaExistente.situacao = 'abandonada';
                            conversaExistente.observacao = 'cliente encerrou a conversa';
                            conversaExistente.encerrada_por = 'CLIENTE';
                            conversaExistente.timeline.push({
                                atividade: 'abandonada',
                                descricao: `${conversaExistente.cliente.nome} abandonou a conversa`
                            });
                        } else {
                            conversaExistente.situacao = 'encerrada';
                            conversaExistente.observacao = 'cliente fechou a conversa antes do atendente encerrar';
                            conversaExistente.encerrada_por = 'ATENDENTE';
                            conversaExistente.timeline.push({
                                atividade: 'encerrada',
                                descricao: `Conversa encerrada durante atendimento`
                            })
                        }

                        conversaExistente.encerrada = true;
                        conversaExistente.hora_fim_conversa = new Date();
                        conversaExistente.atendida = true;
                        await ConversaAtendimento.findByIdAndUpdate({ '_id': conversaExistente._id }, conversaExistente);
                        await limpaCache(conversaExistente._id);

                        eventEmit.emit('encerrar_conversa_telegram', conversaExistente._id);
                    }
                    await telegramBot.sendMessage(msg.chat.id, `Conversa com ID '${conversaExistente._id}' encerrada pelo cliente`);
                });

                telegramBot.onText(/\/setMedico/, async function (msg, match) {
                    // console.log('Detalhes do médico: ', msg);
                    let conversaExistente = await verificaExisteConversaTelegram(msg.chat.id, medico);

                    if (conversaExistente) {

                        medico.id_telegram = msg.chat.id;
                        medico.name = msg.chat.last_name ? `${msg.chat.first_name} ${msg.chat.last_name}` : `${msg.chat.first_name}`;

                        conversaExistente.atendente = medico

                        await ConversaAtendimento.findOneAndUpdate({ _id: conversaExistente._id }, conversaExistente);
                        console.log('Médico salvo: ', medico);

                        await telegramBot.sendMessage(conversaExistente.atendente.id_telegram, `Novo médico: ${medico.name}`);
                    }
                });

                telegramBot.onText(/\/getSinais/, async function (msg, match) {
                    // console.log('Detalhes do médico: ', msg);
                    if (medico.id_telegram != '') {
                        await telegramBot.sendMessage(medico.id_telegram, sinaisVitais);
                        console.log('Enviando sinais vitais para o médico: ', medico);
                    }
                });

                telegramBot.on('message', async function (msg) {
                    // console.log('CONVERSA -> CONVERSA TELEGRAM -> RECEBE');
                    let conversaExistente = await verificaExisteConversaTelegram(msg.chat.id, medico);

                    // if (usa_chatbot && !conversaDoUsuario) {

                    //     let cont = await Contato.find({ "id_telegram": msg.chat.id });

                    //     let cliente = cont.length > 0 ? cont[0] : await criaClienteTelegram(msg, '');

                    //     const conversaCriadaFlexIA = await iniciaConversaComFlexia({
                    //         nomeUsuario: msg.chat.last_name ? `${msg.chat.first_name} ${msg.chat.last_name}` : `${msg.chat.first_name}`,
                    //         origem: 'telegram',
                    //         formulario: false,
                    //         cliente: cliente
                    //     });
                    //     let keyboardOptions = [];
                    //     let textoTeclado = 'Você pode usar as opções no teclado abaixo tambem!';
                    //     for (const mensagem of conversaCriadaFlexIA) {
                    //         if (mensagem.response_type == 'text') {
                    //             if (mensagem.texto) {
                    //                 await telegramBot.sendMessage(msg.chat.id, mensagem.texto);
                    //             } else if (mensagem.title) {
                    //                 await telegramBot.sendMessage(msg.chat.id, mensagem.title);
                    //             } else if (mensagem.description) {
                    //                 await telegramBot.sendMessage(msg.chat.id, mensagem.description);
                    //             }
                    //         } else if (mensagem.response_type == 'image') {
                    //             await telegramBot.sendPhoto(msg.chat.id, mensagem.source);
                    //         } else {
                    //             await telegramBot.sendMessage(msg.chat.id, mensagem.options);
                    //             keyboardOptions.push([{ text: mensagem.options }]);
                    //         }
                    //     }

                    //     // Envia teclado de opções customizadas
                    //     if (keyboardOptions.length > 0) {
                    //         keyboardOptions.push([{ text: '/encerrar' }]);
                    //         await telegramBot.sendMessage(msg.chat.id, textoTeclado, { reply_markup: { keyboard: keyboardOptions } });
                    //     }
                    //     eventEmit.emit('send_monit_adm', {});
                    // } else if (usa_chatbot && conversaDoUsuario && conversaDoUsuario.atendimentoBot) { // existe a conversa do usuário
                    //     //console.log('update da conversa');
                    //     let resposta = await enviaMensagemParaFlexia(conversaDoUsuario, msg.text);

                    //     let keyboardOptions = [];
                    //     let textoTeclado = 'Você pode usar as opções no teclado abaixo tambem!';

                    //     for (const mensagem of resposta) {
                    //         if (mensagem.response_type == 'text') {
                    //             if (mensagem.texto) {
                    //                 await telegramBot.sendMessage(msg.chat.id, mensagem.texto);
                    //             } else if (mensagem.title) {
                    //                 await telegramBot.sendMessage(msg.chat.id, mensagem.title);
                    //             } else if (mensagem.description) {
                    //                 await telegramBot.sendMessage(msg.chat.id, mensagem.description);
                    //             }
                    //         } else if (mensagem.response_type == 'image') {
                    //             await telegramBot.sendPhoto(msg.chat.id, mensagem.source);
                    //         } else {
                    //             await telegramBot.sendMessage(msg.chat.id, mensagem.options);
                    //             keyboardOptions.push([{ text: mensagem.options }]);
                    //         }
                    //     }
                    //     // Envia teclado de opções customizadas
                    //     if (keyboardOptions.length > 0) {
                    //         keyboardOptions.push([{ text: '/encerrar' }]);
                    //         await telegramBot.sendMessage(msg.chat.id, textoTeclado, { reply_markup: { one_time_keyboard: true, keyboard: keyboardOptions } });
                    //     }

                    // } else if (usa_chatbot && conversaDoUsuario && !conversaDoUsuario.atendimentoBot) {
                    //     if (msg.photo) {
                    //         let nomeArquivo = await requestFile(await telegramBot.getFileLink(msg.photo[0].file_id), 'jpg', 'telegram');



                    //         conversaDoUsuario.mensagens.push({
                    //             escrita_por: msg.chat.last_name ? `${msg.chat.first_name} ${msg.chat.last_name}` : `${msg.chat.first_name}`,
                    //             source: `${urlMidia}${nomeArquivo}`,
                    //             description: msg.caption ? msg.caption : '',
                    //             cliente_ou_atendente: 'cliente',
                    //             response_type: 'image'
                    //         });

                    //     } else if (msg.text) {
                    //         conversaDoUsuario.mensagens.push({
                    //             escrita_por: msg.chat.last_name ? `${msg.chat.first_name} ${msg.chat.last_name}` : `${msg.chat.first_name}`,
                    //             texto: msg.text,
                    //             cliente_ou_atendente: 'cliente',
                    //             response_type: 'text'
                    //         });
                    //     } else if (msg.document) {
                    //         let nomeArquivo = await requestFile(await telegramBot.getFileLink(msg.document.file_id), msg.document.file_name.split('.').pop(), 'telegram');
                    //         conversaDoUsuario.mensagens.push({
                    //             escrita_por: msg.chat.last_name ? `${msg.chat.first_name} ${msg.chat.last_name}` : `${msg.chat.first_name}`,
                    //             source: `${urlMidia}${nomeArquivo}`,
                    //             cliente_ou_atendente: 'cliente',
                    //             response_type: 'file'
                    //         });
                    //     }

                    //     await ConversaAtendimento.findOneAndUpdate({ _id: conversaDoUsuario._id }, conversaDoUsuario);
                    //     eventEmit.emit('enviar_msg_canal', { idDaConversa: conversaDoUsuario._id, mensagem: conversaDoUsuario.mensagens[conversaDoUsuario.mensagens.length - 1] });
                    // }
                    // }
                    // else 
                    if (!usa_chatbot) {
                        if (conversaExistente) {
                            if (msg.photo) {
                                let nomeArquivo = await requestFile(await telegramBot.getFileLink(msg.photo[0].file_id), 'jpg', 'telegram');
                                //console.log('Nome arquivo: ', nomeArquivo);

                                conversaExistente.mensagens.push({
                                    escrita_por: msg.chat.last_name ? `${msg.chat.first_name} ${msg.chat.last_name}` : `${msg.chat.first_name}`,
                                    source: `${urlMidia}${nomeArquivo}`,
                                    description: msg.caption ? msg.caption : '',
                                    cliente_ou_atendente: 'cliente',
                                    response_type: 'image'
                                });

                            } else if (msg.text) {
                                if (msg.chat.id == conversaExistente.cliente.id_telegram) {
                                    conversaExistente.mensagens.push({
                                        escrita_por: msg.chat.last_name ? `${msg.chat.first_name} ${msg.chat.last_name}` : `${msg.chat.first_name}`,
                                        texto: msg.text,
                                        cliente_ou_atendente: 'cliente',
                                        response_type: 'text'
                                    });
                                    if (medico.id_telegram != '') {
                                        await telegramBot.sendMessage(medico.id_telegram, msg.text);
                                        console.log('Enviando mensagem de texto para o médico: ', medico);
                                    }
                                } else if (msg.chat.id == medico.id_telegram) {
                                    conversaExistente.mensagens.push({
                                        escrita_por: msg.chat.last_name ? `${msg.chat.first_name} ${msg.chat.last_name}` : `${msg.chat.first_name}`,
                                        texto: msg.text,
                                        cliente_ou_atendente: 'atendente',
                                        response_type: 'text'
                                    });
                                    if (conversaExistente.cliente.id_telegram != '') {
                                        await telegramBot.sendMessage(conversaExistente.cliente.id_telegram, msg.text);
                                        console.log('Enviando mensagem de texto para o paciente: ', conversaExistente.cliente);
                                    }
                                }
                            } else if (msg.document) {
                                let nomeArquivo = await requestFile(await telegramBot.getFileLink(msg.document.file_id), msg.document.file_name.split('.').pop(), 'telegram');
                                conversaExistente.mensagens.push({
                                    escrita_por: msg.chat.last_name ? `${msg.chat.first_name} ${msg.chat.last_name}` : `${msg.chat.first_name}`,
                                    source: `${urlMidia}${nomeArquivo}`,
                                    cliente_ou_atendente: 'cliente',
                                    response_type: 'file'
                                });
                            }


                            await ConversaAtendimento.findOneAndUpdate({ _id: conversaExistente._id }, conversaExistente);
                            console.log('Mensagem nova salva no banco da conversa existente');
                            // eventEmit.emit('enviar_msg_canal', { idDaConversa: conversaDoUsuario._id, mensagem: conversaDoUsuario.mensagens[conversaDoUsuario.mensagens.length - 1] });
                        } else if (!usa_chatbot && !conversaExistente) {

                            let cont = await Contato.find({ "id_telegram": msg.chat.id });
                            let cliente = cont.length > 0 ? cont[0] : await criaClienteTelegram(msg, '');

                            let conversaCriada = await ConversaAtendimento.create({
                                cliente: cliente,
                                atendente: medico,
                                fila: 'Telegram',
                                canal: 'telegram',
                                atendida: false,
                                encerrada: false,
                                situacao: "em_atendimento",
                                timeline: [{ atividade: 'em_atendimento', descricao: `${cliente.nome} entrou em atendimento pelo Telegram` }]
                            }); // mudar para em_atendimento quando integrar a FlexIA

                            if (msg.photo) {
                                let uri = await telegramBot.getFileLink(msg.photo[0].file_id);
                                rp({
                                    method: 'GET',
                                    uri: uri,
                                    encoding: "binary",
                                    headers: {
                                        "Content-type": "multipart/form-data"
                                    }
                                }).then(function (body) {
                                    let writeStream = fs.createWriteStream(`uploads/${msg.photo[0].file_id}.jpg`);
                                    writeStream.write(body, 'binary');
                                    writeStream.end();
                                })
                                conversaCriada.mensagens.push({
                                    escrita_por: msg.chat.last_name ? `${msg.chat.first_name} ${msg.chat.last_name}` : `${msg.chat.first_name}`,
                                    source: `${urlMidia}${msg.photo[0].file_id}.jpg`,
                                    description: msg.caption ? msg.caption : '',
                                    cliente_ou_atendente: 'cliente',
                                    response_type: 'image'
                                });

                            } else if (msg.text) {
                                if (msg.chat.id == conversaCriada.cliente.id_telegram) {
                                    conversaCriada.mensagens.push({
                                        escrita_por: msg.chat.last_name ? `${msg.chat.first_name} ${msg.chat.last_name}` : `${msg.chat.first_name}`,
                                        texto: msg.text,
                                        cliente_ou_atendente: 'cliente',
                                        response_type: 'text'
                                    });
                                    if (medico.id_telegram != '') {
                                        await telegramBot.sendMessage(medico.id_telegram, msg.text);
                                        console.log('Enviando mensagem de texto para o médico: ', medico);
                                    }
                                } else if (msg.chat.id == medico.id_telegram) {
                                    conversaCriada.mensagens.push({
                                        escrita_por: msg.chat.last_name ? `${msg.chat.first_name} ${msg.chat.last_name}` : `${msg.chat.first_name}`,
                                        texto: msg.text,
                                        cliente_ou_atendente: 'atendente',
                                        response_type: 'text'
                                    });
                                    if (conversaCriada.cliente.id_telegram != '') {
                                        await telegramBot.sendMessage(conversaCriada.cliente.id_telegram, msg.text);
                                        console.log('Enviando mensagem de texto para o paciente: ', conversaCriada.cliente);
                                    }
                                }
                            } else if (msg.document) {
                                let nomeArquivo = await requestFile(await telegramBot.getFileLink(msg.document.file_id), msg.document.file_name.split('.').pop());
                                conversaCriada.mensagens.push({
                                    escrita_por: msg.chat.last_name ? `${msg.chat.first_name} ${msg.chat.last_name}` : `${msg.chat.first_name}`,
                                    source: `${urlMidia}${nomeArquivo}`,
                                    cliente_ou_atendente: 'cliente',
                                    response_type: 'file'
                                });
                            }

                            await ConversaAtendimento.findOneAndUpdate({ _id: conversaCriada._id }, conversaCriada);
                            await telegramBot.sendMessage(msg.chat.id, 'Olá, bem vindo ao nosso atendimento');
                            // eventEmit.emit('criar_conversa_canal', conversaCriada._id);
                            // eventEmit.emit('enviar_msg_canal', { idDaConversa: conversaCriada._id, mensagem: conversaCriada.mensagens[conversaCriada.mensagens.length - 1] });
                            console.log('Criou conversa');
                        }
                    }

                });
            }

        } else {
            await telegramBot.stopPolling();
            log.warning('** TelegramBot Desativado! **')
        }
    } catch (error) {
        log.error('** Erro no evento iniciar_config_telegram **');
        log.error(`** Erro: ${error} **`);
    }
});

eventEmit.on('enviar_msg_telegram', async (telegram_id, texto) => {
    console.log('##### enviar_msg_telegram #####');
    telegramBot.sendMessage(telegram_id, texto);
});

eventEmit.on('enviar_foto_telegram', async (telegram_id, urlPhoto) => {
    telegramBot.sendPhoto(telegram_id, urlPhoto);
});

eventEmit.on('enviar_arquivo_telegram', async (telegram_id, urlFile) => {
    telegramBot.sendDocument(telegram_id, urlFile);
});

module.exports = async () => {
    const config = await ConfigGeral.findOne();
    // console.log(configTelegram);
    if (config.telegram.ativado) {
        eventEmit.emit('iniciar_config_telegram');
    }
};