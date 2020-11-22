const axios = require('axios');
const qs = require('querystring');
const Conversa = require('./conversav2-model');
const Conversa_old = require('../conversa.model');
const Contato = require('../../contato/contato.model');
const Fila = require("../../fila/fila-model");
const log = require('../../util/logs');
const redis = require('../../../config/database-redis-config');
const eventEmit = require('../../util/eventEmmiter');
const ConfigGeral = require('../../configuracao/configuracao.model');
let rp = require('request-promise-native');
const Caso = require('../../case/case-model');
const enviaEmail = require('../../util/emailSender');
const getConfigs = require('config');
const limpaCache = require('../../util/limpaCache');
const ConversaAtendimento = require('../conversa_atendimento.model');
// const amqp = require('../../services/servicoRabbitMQ');
// amqp.criarConexao();

const clienteEntraNaFila = require('./cliente-entra-na-fila');
const clienteEnviaMensagem = require('./cliente-envia-mensagem');
const satisfacaoCliente = require('./satisfacao-cliente');
const iniciarConversaComFlexia = require('./iniciar-conversa-flexia');
const logarAtendente = require('./logar-atendente');
const deslogarAtendente = require('./deslogar-atendente');
const atualizaSocketIdCliente = require('./atualiza-socketid-cliente');
const atenderLigacao = require('./atender-licacao');
const diminuirPosicaoFila = require('./diminuir-posicao-fila');
let urlMsgWpp = ''; // "https://eu25.chat-api.com/instance45195/sendMessage?token=dillsapyt8n8dmtw";

const atendentesLogadosComConversas = require('../../monitoramento/atendentesLogadosComQuantidadeAtendimento')
const digitando = require('./digitando')
const parouDeDigitar = require('./parou-de-digitar')
const conversasDoAtendente = require('./conversas-do-atendente')
const MensagemFila = require('../../mensagemFila/mensagemFila-model');
const encerraConversaCliente = require('./encerra-conversa-cliente')
const disconnect = require('./disconnect')

const grupoTelegramParaEnviarAlerta = '-397120811';

async function enviaMsgWpp(mensagem, telefoneDestino) {
    console.log("mensagem, telefoneDestino: ",mensagem, telefoneDestino);
    // Função para pegar credenciais do whatsapp no banco de dados
    try {
        const configGeral = await ConfigGeral.findOne();
        configWpp = configGeral.whatsapp;
    } catch (error) {
        console.log('** Erro ao atualizar credencial WPP socket **');
        console.log(`** Erro: ${error} **`);
    }

    console.log('configWpp.source,configWpp.srcName,configWpp.apikey: ',configWpp.source,configWpp.srcName,configWpp.apikey);

    return new Promise((resolve, reject) => {
        console.log('Enviando mensagem para a gupshup socket');
        const requestBody = {
            channel: 'whatsapp',
            source: configWpp.source ? configWpp.source : '558539240077',
            destination: telefoneDestino,
            message: mensagem,
            'src.name': configWpp.srcName ? configWpp.srcName : 'G4FlexApp01'
        };

        const config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cache-Control': 'no-cache',
                'apikey': configWpp.apikey ? configWpp.apikey : '69cb713b279b48acc88370f7ca00c91f'
            }
        };

        axios.post('https://api.gupshup.io/sm/api/v1/msg', qs.stringify(requestBody), config)
            .then((result) => {
                resolve();
                // console.log('result: ', result);
            })
            .catch((err) => {
                reject();
                console.log('error socket envia msg gupshup: ', err);
            })
    });

    // console.log('dados: ', mensagem, telefone);

    // console.log('Enviando mensagem para a gupshup');

    // const requestBody = {
    //     channel: 'whatsapp',
    //     source: '558539240077',
    //     destination: telefone,
    //     message: mensagem,
    //     'src.name': 'G4FlexApp02'
    // }

    // const config = {
    //     headers: {
    //         'Content-Type': 'application/x-www-form-urlencoded',
    //         'Cache-Control': 'no-cache',
    //         'apikey': '69cb713b279b48acc88370f7ca00c91f'
    //     }
    // }

    // axios.post('https://api.gupshup.io/sm/api/v1/msg', qs.stringify(requestBody), config)
    //     .then((result) => {
    //         // console.log('mensagem enviar para a gupshup com sucesso');
    //     })
    //     .catch((err) => {
    //         console.log('erro ao enviar mensagem para a gupshup');
    //     })
}

async function enviarMsgFacebook(mensagem, userID) {
    const config = await ConfigGeral.findOne();
    await rp({
        uri: config.facebook.urlFacebook,
        qs: { access_token: config.facebook.facebook_access_token },
        method: 'POST',
        json: {
            recipient: { id: userID },
            message: { text: mensagem }
        }
    });
}

async function atualizaConversasAtendente(atendenteId, socketId) {
    const query = {
        'atendente._id': atendenteId,
        'situacao': 'em_atendimento'
    };

    const conversas = await ConversaAtendimento.find(query);

    if (conversas.length > 0) {
        for (const conversa of conversas) {
            await ConversaAtendimento.updateOne({ _id: conversa._id }, {
                $set: {
                    id_socket_atendente: socketId,
                }
            });
        }
    }
}

//variável socket é visivel em todos os eventos
module.exports = function (io) {

    eventEmit.on('envia_mensagem_para_gupshup', data => {
        console.log('data: ',data);
        console.log('enviando mensagem legal super correta');

        if(data.mensagem.finaliza){
            enviaMsgWpp('Espero que estas informações tenham sido úteis pra ti.',data.telefone_cliente);
            setTimeout(() => {
                enviaMsgWpp('Tchauzinho da Vida!',data.telefone_cliente);
            }, 1000);
            return ;
        }

        const mensagem = `O endereco da farmácia é: ${data.mensagem.endereco}, seu numero para contato é o seguinte: ${data.mensagem.telefone} e ela se encontra ${data.mensagem.aberta?'aberta':'fechada'} nesse momento`;

        enviaMsgWpp(mensagem,data.telefone_cliente);
    });

    eventEmit.on('send_monit_adm', async () => {
        io.emit('monit_adm_res', await atendentesLogadosComConversas());
    })

    eventEmit.on('cliente_fechou_janela', async (data) => {

        log.warning(` ============> Cliente fechou a janela ${data}`);

        let conversa = await ConversaAtendimento.findOne({ 'cliente.email': data });
        if (conversa) {
            if (conversa.situacao === 'nao_atendida' || conversa.situacao === 'transferida' || conversa.atendimentoBot) {
                conversa.situacao = 'abandonada';
                conversa.observacao = 'cliente abandonou conversa';
                conversa.encerrada_por = 'CLIENTE';
                conversa.timeline.push({
                    atividade: 'abandonada',
                    descricao: 'Conversa abandonada pelo cliente'
                });

                conversa.encerrada = true;
                conversa.hora_fim_conversa = new Date();

                const conversaAtendimento = await ConversaAtendimento.findOneAndUpdate({ _id: conversa._id }, conversa);
                await limpaCache(conversaAtendimento._id);

                //socket.emit('remover_conversa_abandonada', conversa._id);
                io.emit('conversa_encerrada', { id: conversa._id, nome: conversa.cliente.nome });
                io.emit('atualizar_pagina_administrador');
                //FIM
                io.emit('conversa_abandonada_cliente', { id: conversa._id, nome: conversa.cliente.nome });
                eventEmit.emit('send_monit_adm', {});
            } else {

                // conversa.observacao = 'cliente fechou a conversa antes do atendente encerrar';
                // conversa.fechou_janela = true;

                // const conversaAtendimento = await ConversaAtendimento.findOneAndUpdate({ _id: conversa._id }, conversa);

                // io.emit('cliente_fechou_a_janela_em_atendimento', { nome: conversa.cliente.nome, id: conversa._id });
                //FIM
                io.emit('cliente_abandonou_conversa_em_atendimento', { id: conversa._id })
            }

        }
    });


    eventEmit.on('alerta_telegram_entrou_na_fila', (data) => {
        // console.log('entroui aqui');
        eventEmit.emit('enviar_msg_telegram', grupoTelegramParaEnviarAlerta, `Cliente: ${data.conversa.cliente.nome} entrou na fila: ${data.conversa.fila}, data: ${new Date()}`);
    });

    eventEmit.on('conversa_abandonada_ociosidade', async (conversa_id, nome_cliente) => {
        try {
            // const conversa = await ConversaAtendimento.findById(conversa_id);
            io.emit('remover_conversa_abandonada', conversa_id);
            io.emit('conversa_encerrada', { id: conversa_id, nome: nome_cliente });
            io.emit('conversa_abandonada_cliente', { id: conversa_id, nome: nome_cliente });
            await limpaCache(conversa._id);

        } catch (error) {
            log.error(`** Erro no event.on conversa_abandonada_ociosidade **`);
            log.error(`** Erro ${error} **`);
        }
    });

    eventEmit.on('transferir_conversa_watson', async (conversa_id) => {
        try {
            console.log('##### transferir_conversa_watson #####');
            console.log('id da conversa: ',conversa_id);
            const conversa = await ConversaAtendimento.findById(conversa_id);
            const mensagensFila = await MensagemFila.find({ 'filas.nome': conversa.fila });

            io.emit('entrou_na_fila', { conversa });
            io.to(conversa.id_socket_cliente).emit('cliente_transferido', { conversa, mensagens: mensagensFila.length > 0 ? mensagensFila : [] });
            io.emit('atualizar_pagina_administrador');
        } catch (error) {
            log.error(`** Erro no event.on transferir_conversa_watson **`);
            log.error(`** Erro ${error} **`);
        }
    });

    eventEmit.on('criar_conversa_canal', async (conversa_id) => {
        try {
            const conversa = await ConversaAtendimento.findById(conversa_id);
            io.emit('entrou_na_fila', { conversa });
        } catch (error) {
            log.error(`** Erro no event.on criar_conversa_canal **`);
            log.error(`** Erro ${error} **`);
        }
    });

    eventEmit.on('enviar_msg_canal', async (msg) => {
        let conversa = await ConversaAtendimento.findById(msg.idDaConversa);
        io.to(conversa.id_socket_atendente).emit('cliente_enviou_mensagem', { idDaConversa: msg.idDaConversa, mensagem: msg.mensagem });
    });

    eventEmit.on('enviar_msg_fila', async (msgFilaAleatoria) => {
        io.emit('enviar_msg_fila', { mensagem: msgFilaAleatoria });
    });

    eventEmit.on('atendente_enviar_arquivo', async (conversa, msgArquivo) => {
        io.to(conversa.id_socket_cliente).emit('atendente_enviou_mensagem', [msgArquivo]);
    });

    eventEmit.on('cliente_enviar_arquivo', async (conversa, msgArquivo) => {
        io.to(conversa.id_socket_atendente).emit('cliente_enviou_mensagem', { idDaConversa: conversa._id, mensagem: msgArquivo, novas_mensagens: conversa.novas_mensagens + 1 });
    });

    eventEmit.on('encerrar_conversa_telegram', async (conversa_id) => {
        try {
            let conversa = await Conversa_old.findById(conversa_id);
            if (conversa) {
                // se estava em atendimento avisar ao atendente que a conversa foi removida
                io.emit('remover_conversa_abandonada', conversa._id);
                // se estava em fila, remover da fila e emitir broadcast
                io.emit('conversa_encerrada', { id: conversa._id, nome: conversa.cliente.nome });
                io.emit('conversa_abandonada_cliente', { id: conversa._id, nome: conversa.cliente.nome });
                eventEmit.emit('send_monit_adm', {});
                log.log(`============= >>>>>> ID da conversa abandonada: ${conversa._id}`);
            } else {
                log.warning(`*** CONVERSA NÃO ENCONTRADA PARA ID ${conversa_id} ***`);
            }

        } catch (error) {
            log.error(`*** Erro no evento encerrar_conversa_telegram***`);
            log.error(`*** Erro: ${error} ***`);
        }
    });

    io.on('connection', async socket => {

        // console.log('alguem esta se conectando');
        console.log('socket.handshake.query.clienteEmail: ', socket.handshake.query.clienteEmail);
        require('../../monitoramento/monitoramento.service')(socket, io);

        if (socket.handshake.query.atendente) {
            await atualizaConversasAtendente(socket.handshake.query.atendente, socket.id);
        }

        // if (socket.handshake.query.clienteEmail) {
        //     atualizaSocketIdCliente(socket.handshake.query.clienteEmail, socket.id)
        // }

        socket.on('connect', msg => {
            // console.log('msg', msg);
        })

        socket.on('digitando', async (msg) => digitando(socket, msg));

        socket.on('parou_digitar', async (msg) => parouDeDigitar(socket, msg));
        /*
            {
                "fila":""
                "nome":"",
                "email":"",
                "cpf":"",
            }
        */
        socket.on('iniciar_conversa_flexia', async data => iniciarConversaComFlexia(data));

        socket.on('entrar_na_fila', async data => clienteEntraNaFila(data, io, socket));

        socket.on('satisfacao_do_cliente', async data => satisfacaoCliente(data, io, socket));

        socket.on('login_do_atendente', (atendenteID) => logarAtendente(atendenteID));

        socket.on('logout_do_atendente', (atendenteID) => deslogarAtendente(atendenteID));

        socket.on('busca_filas', async msg => {
            const filas = await Fila.find().sort({ nome: 1 });
            socket.emit('filas', { filas });
        });

        socket.on('atender_conversa', async msg => {
            let conversa = await ConversaAtendimento.findOne({ _id: msg.id });


            // modificação da unifor 
            // if (conversa.atendida && !conversa.atendiatendimentoBot) {
            //     socket.emit('conversa_atendida', { conversa, atendida: true });
            //     return;
            // }

            let timeline = conversa.timeline;
            // console.log('Mensagens da conversa: ', conversa.mensagens);

            let conversaParaEnviarAoCliente = {
                mensagens: []
            };

            conversa.mensagens.forEach(mensagem => {
                conversaParaEnviarAoCliente.mensagens.push(mensagem);
            });

            timeline.push({
                atividade: 'atender',
                descricao: `${msg.atendente.nome} atendeu a conversa`
            })
            await ConversaAtendimento.updateOne({ _id: msg.id }, {
                $set: {
                    id_socket_atendente: socket.id,
                    atendida: true,
                    situacao: 'em_atendimento',
                    timeline: timeline,
                    hora_do_atendimento: new Date(),
                    atendente: {
                        _id: msg.atendente._id,
                        name: msg.atendente.nome
                    },
                }
            });

            const config = await ConfigGeral.findOne();

            if (config) {
                if (config.mensagens) {
                    if (config.mensagens.sendAtendente) {
                        const mensagemNomeAtendente = {
                            escrita_por: msg.atendente.nome,
                            texto: `Olá, meu nome é ${msg.atendente.nome}`,
                            cliente_ou_atendente: "atendente",
                            response_type: "text"
                        }
                        conversaParaEnviarAoCliente.mensagens.push(mensagemNomeAtendente);
                        let conversa = await ConversaAtendimento.findById(msg.id);
                        conversa.mensagens.push(mensagemNomeAtendente);
                        await ConversaAtendimento.findOneAndUpdate({ _id: msg.id }, conversa);

                        if (conversa.canal === 'telegram') {
                            eventEmit.emit('enviar_msg_telegram', conversa.cliente.id_telegram, mensagemNomeAtendente.texto);
                        } else if (conversa.canal === 'facebook') {
                            await enviarMsgFacebook(mensagemNomeAtendente.texto, conversa.cliente.id_facebook);
                        } else if (conversa.canal === 'whatsapp') {
                            urlMsgWpp = config.whatsapp.urlMsg;
                            await enviaMsgWpp(mensagemNomeAtendente.texto, conversa.cliente.celular);
                        }

                    }
                }
            }

            if (config) {
                if (config.mensagens) {
                    if (config.mensagens.hasMsgAtm) {
                        if (config.mensagens.msgSaudacao != "") {
                            const mensagemSaudacao = {
                                escrita_por: msg.atendente.nome,
                                texto: config.mensagens.msgSaudacao,
                                cliente_ou_atendente: "atendente",
                                response_type: "text"
                            }
                            conversaParaEnviarAoCliente.mensagens.push(mensagemSaudacao);
                            let conversa = await ConversaAtendimento.findById(msg.id);
                            conversa.mensagens.push(mensagemSaudacao);
                            await ConversaAtendimento.findOneAndUpdate({ _id: msg.id }, conversa);

                            if (conversa.canal === 'telegram') {
                                eventEmit.emit('enviar_msg_telegram', conversa.cliente.id_telegram, mensagemSaudacao.texto);
                            } else if (conversa.canal === 'facebook') {
                                await enviarMsgFacebook(mensagemSaudacao.texto, conversa.cliente.id_facebook);
                            } else if (conversa.canal === 'whatsapp') {
                               await enviaMsgWpp(mensagemSaudacao.texto, conversa.cliente.celular);
                            }
                        }
                    }
                }
            }

            //emitir evento para a conversa em que foi atendida
            //aqui deve mandar a conversa 
            //console.log('mensagens: ', conversaParaEnviarAoCliente.mensagens)
            conversa = await ConversaAtendimento.findOne({ _id: msg.id });
            socket.to(conversa.id_socket_cliente).emit('conversa_atendida_cliente', { msg: 'conversa atendida', mensagens: conversaParaEnviarAoCliente.mensagens });

            //Modificação teste unifor
            //socket.emit('conversa_atendida', { conversa, atendida: true });
            socket.emit('conversa_atendida', { conversa });

            io.emit('remove_conversa_fila', conversa._id);

            diminuirPosicaoFila(socket, conversa.fila);
            // io.emit('diminuir_posicao', { fila: conversa.fila });

            eventEmit.emit('send_monit_adm', {});
            //socket.to(conversa.id_socket_cliente).emit('atualiza_conversa',conversa);
        });

        socket.on('atender_ligacao', data => atenderLigacao(io, socket, data));

        socket.on('cliente_enviar_mensagem', data => clienteEnviaMensagem(data, io, socket));

        // socket.on('cliente_enviar_mensagem', async msg => {
        //     console.log('msg: ', msg);
        //     let conversa = await ConversaAtendimento.findById(msg.idDaConversa);
        //     console.log('1: ', conversa);
        //     conversa.mensagens.push(msg.mensagem);
        //     let converasAtualizada = await ConversaAtendimento.findOneAndUpdate({ _id: conversa._id }, conversa);
        //     console.log('2: ', converasAtualizada);
        //     socket.to(conversa.id_socket_atendente).emit('cliente_enviou_mensagem', { idDaConversa: msg.idDaConversa, mensagem: msg.mensagem });
        //     console.log('3');
        //     socket.emit('atualiza_conversa', conversa);
        // });

        socket.on('atendente_enviar_mensagem', async data => {
            // console.log('##### atendente_enviar_mensagem ##### ', data);
            // console.log('[SOCKET] - antendente_enviar_mensagem - dados: ',msg);
            let conversa = await ConversaAtendimento.findById(data.idDaConversa);

            //inicio

            conversa.mensagens.push(data.conversa.mensagem);
            conversa.novas_mensagens = 0;

            await ConversaAtendimento.findOneAndUpdate({ _id: data.idDaConversa }, conversa);
            socket.emit('atendente_leu_mensagem', { idDaConversa: conversa._id, novas_mensagens: conversa.novas_mensagens });

            if (conversa.canal === 'telegram') {
                eventEmit.emit('enviar_msg_telegram', conversa.cliente.id_telegram, data.conversa.mensagem.texto);
            } else if (conversa.canal === 'facebook') {
                await enviarMsgFacebook(data.conversa.mensagem.texto, conversa.cliente.id_facebook);
            } else if (conversa.canal === 'whatsapp') {
                console.log('Enviando mensagem para o cliente: ',data.conversa.mensagem.texto, conversa.cliente.celular);
                await enviaMsgWpp(data.conversa.mensagem.texto, conversa.cliente.celular);
            } else {
                socket.to(conversa.id_socket_cliente).emit('atendente_enviou_mensagem', [data.conversa.mensagem]);
            }
            //fim
        });

        socket.on('buscar_conversa_id', async idDaConversa => {
            console.log('##### buscar_conversa_id #####', idDaConversa);
            let conversa = await ConversaAtendimento.findById(idDaConversa);
            //conversa_atendida
            socket.emit('conversa_atendida', { conversa });
            socket.emit('conversa_respondida', { conversa });
        });

        socket.on('transferir_conversa', async msg => {

            let conv = await ConversaAtendimento.findOne({ _id: msg.id });

            const config = await ConfigGeral.findOne();
            if (config) {
                if (config.mensagens) {
                    if (config.mensagens.hasMsgAtm) {
                        if (config.mensagens.msgTransferencia != "") {
                            const mensagemTransferencia = {
                                escrita_por: conv.atendente.name,
                                texto: config.mensagens.msgTransferencia,
                                cliente_ou_atendente: "atendente",
                                response_type: "text"
                            }
                            let conversa = await ConversaAtendimento.findById(msg.id);
                            conversa.mensagens.push(mensagemTransferencia);
                            await ConversaAtendimento.findOneAndUpdate({ _id: msg.id }, conversa);

                            if (conversa.canal === 'telegram') {
                                eventEmit.emit('enviar_msg_telegram', conversa.cliente.id_telegram, mensagemTransferencia.texto);
                            } else if (conversa.canal === 'facebook') {
                                await enviarMsgFacebook(mensagemTransferencia.texto, conversa.cliente.id_facebook);
                            } else if (conversa.canal === 'whatsapp') {
                                await enviaMsgWpp(mensagemTransferencia.texto, conversa.cliente.celular);
                            }
                        }
                    }
                }
            }

            let timeline = conv.timeline;
            timeline.push({
                atividade: 'transferida',
                descricao: `Cliente transferido para a fila ${msg.fila} pelo atendente ${conv.atendente.name}`
            });
            let conversaAntesAtualizar = await ConversaAtendimento.findByIdAndUpdate(msg.id,
                {
                    $set:
                    {
                        atendida: false,
                        fila: msg.fila,
                        situacao: 'transferida',
                        assunto: msg.formulario.assunto ? msg.formulario.assunto : '',
                        setor: msg.formulario.setor ? msg.formulario.setor : '',
                        observacao: msg.formulario.observacao ? msg.formulario.observacao : '',
                        timeline: timeline,
                    }
                });

            let conversa = await ConversaAtendimento.findById(conversaAntesAtualizar._id);
            //fazer broadcast para os atendentes que tem mais um cliente na fila
            io.emit('entrou_na_fila', { conversa });
            socket.emit('conversa_transferida', conversa._id);
            // fazer um emit para o cliente
            socket.to(conversa.id_socket_cliente).emit('cliente_transferido', { conversa });
            io.emit('atualizar_pagina_administrador');
            eventEmit.emit('send_monit_adm', {});
        });

        /*
    
        */
        socket.on('encerra_conversa_atendente', async msg => {
            console.log('###### ENCERRA_CONVERSA_ATENDENTE ########');
            // console.log(msg);

            // console.log('111');
            const config = await ConfigGeral.findOne();
            if (config) {
                if (config.mensagens) {
                    if (config.mensagens.hasMsgAtm) {
                        if (config.mensagens.msgEncerramento != "") {
                            let conversa = await ConversaAtendimento.findById(msg.id);

                            const mensagemEncerramento = {
                                escrita_por: conversa.atendente ? conversa.atendente.name : 'Atendente',
                                texto: config.mensagens.msgEncerramento,
                                cliente_ou_atendente: "atendente",
                                response_type: "text"
                            }
                            conversa.mensagens.push(mensagemEncerramento);

                            await ConversaAtendimento.findOneAndUpdate({ _id: msg.id }, conversa);

                            if (conversa.canal === 'telegram') {
                                eventEmit.emit('enviar_msg_telegram', conversa.cliente.id_telegram, mensagemEncerramento.texto);
                            } else if (conversa.canal === 'facebook') {
                                await enviarMsgFacebook(mensagemEncerramento.texto, conversa.cliente.id_facebook);
                            } else if (conversa.canal === 'whatsapp') {
                                urlMsgWpp = config.whatsapp.urlMsg;
                                await enviaMsgWpp(mensagemEncerramento.texto, conversa.cliente.celular);
                            } else if (conversa.canal === 'chat') {
                            }
                        }
                    }
                }
            }
            console.log('##### MSG ID ##### ', msg.id);

            let conversa2 = await ConversaAtendimento.findOneAndUpdate({ _id: msg.id }, {
                $set: {
                    encerrada: true,
                    atendida: true,
                    encerrada_por: "ATENDENTE",
                    situacao: "encerrada",
                    assunto: msg.body.assunto ? msg.body.assunto : '',
                    status: msg.body.status ? msg.body.status : '',
                    produto: msg.body.produto ? msg.body.produto : '',
                    setor: msg.body.setor ? msg.body.setor : '',
                    observacao: msg.body.observacao ? msg.body.observacao : '',
                    hora_fim_conversa: new Date()
                }
            });
            //console.log('################## conversa2 ############################', conversa2);
            //modificação para transferir a chamada que estava na coleção de chamadas atendidas para chamadas encerradas [nossa maneira de fazer cache com mongo]
            await limpaCache(msg.id);
            //const configGeral = await ConfigGeral.findOne();
            // if (configGeral.email.habilitado) {
            //     if (conversa.cliente.email) {
            //         const conv = await Conversa_old.findById(conversa._id);
            //         let texto = '\n';
            //         texto = texto + `A conversa de ID: ${conv._id} foi encerrada pelo atendente ${conv.atendente.name}.\n`;
            //         texto = texto + `Horário de início da conversa: ${conv.hora_do_atendimento}\n`;
            //         texto = texto + `Horário de encerramento da conversa: ${conv.hora_fim_conversa}.\n`;
            //         if (conv.resumoBot) {
            //             conv.resumoBot.forEach(resumo => {
            //                 texto = texto + `${resumo.id} - ${resumo.value}\n`
            //             });
            //         }
            //         try {
            //             await enviaEmail(conv.cliente.email, 'Atendimento Flex Channel', texto, '');
            //         } catch (error) {
            //             console.log('Erro ao enviar email');
            //             console.log(error);
            //         }
            //     }
            // }
            console.log('###################################### CONVERSA ENCERRADA #################################');
            // console.log(conversa2);
            socket.emit('conversa_encerrada', { id: msg.id, nome: conversa2.cliente.nome });
            socket.to(conversa2.id_socket_cliente).emit('encerrar_conversa_cliente');

            io.emit('atualizar_pagina_administrador');
            eventEmit.emit('send_monit_adm', {});
        });

        socket.on('encerrar_conversa_administrador', async msg => {
            //console.log('**** ENCERRA_CONVERSA_ADMIN ****');
            //console.log(msg);

            const config = await ConfigGeral.findOne();
            if (config) {
                if (config.mensagens) {
                    if (config.mensagens.hasMsgAtm) {
                        if (config.mensagens.msgEncerramento != "") {
                            let conversa = await ConversaAtendimento.findById(msg._id);

                            const mensagemEncerramento = {
                                escrita_por: msg.admin,
                                texto: config.mensagens.msgEncerramento,
                                cliente_ou_atendente: "atendente",
                                response_type: "text"
                            }

                            conversa.mensagens.push(mensagemEncerramento);

                            await ConversaAtendimento.findOneAndUpdate({ _id: msg._id }, conversa);

                            if (conversa.canal === 'telegram') {
                                eventEmit.emit('enviar_msg_telegram', conversa.cliente.id_telegram, mensagemEncerramento.texto);
                            } else if (conversa.canal === 'facebook') {
                                await enviarMsgFacebook(mensagemEncerramento.texto, conversa.cliente.id_facebook);
                            } else if (conversa.canal === 'whatsapp') {
                                urlMsgWpp = config.whatsapp.urlMsg;
                                await enviaMsgWpp(mensagemEncerramento.texto, conversa.cliente.celular);
                            } else if (conversa.canal === 'chat') {
                            }
                        }
                    }
                }
            }

            try {
                let conversa = await ConversaAtendimento.findByIdAndUpdate(msg._id, {
                    $set: {
                        encerrada: true,
                        atendida: true,
                        encerrada_por: "ADMINISTRADOR",
                        situacao: "encerrada",
                        assunto: msg.body.assunto ? msg.body.assunto : '',
                        status: msg.body.status ? msg.body.status : '',
                        produto: msg.body.produto ? msg.body.produto : '',
                        setor: msg.body.setor ? msg.body.setor : '',
                        observacao: msg.body.observacao ? msg.body.observacao : '',
                        hora_fim_conversa: new Date()
                    }
                });

                //modificação para transferir a chamada que estava na coleção de chamadas atendidas para chamadas encerradas [nossa maneira de fazer cache com mongo]
                await limpaCache(msg._id);

                socket.to(conversa.id_socket_atendente).emit('encerrar_conversa_administrador', conversa._id);
                // socket.to(conversa.id_socket_atendente).emit('conversa_encerrada_atendendo', { id: conversa._id });
                socket.to(conversa.id_socket_atendente).emit('conversa_encerrada', { id: conversa._id, nome: conversa.cliente.nome });
                socket.to(conversa.id_socket_atendente).emit('notificar_encerramento_admin', { id: conversa._id });
                socket.to(conversa.id_socket_cliente).emit('encerrar_conversa_cliente');
                io.emit('atualizar_pagina_administrador');

            } catch (error) {
                log.error(`** Erro ao encerrar pelo tela de administrador **`);
                log.error(`** Erro ${error} **`);
            }

        });

        socket.on('encerra_conversa_cliente', async (msg) => encerraConversaCliente(msg));

        socket.on('conversas_do_atendente', async (event) => conversasDoAtendente(event, socket));

        socket.on('disconnect', async (event) => disconnect(event, io, socket));
    });

}