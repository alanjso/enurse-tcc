const log = require('../../util/logs');
// const ConversaEncerrada = require('../conversa.model');
const ConversaAtendimento = require('../conversa_atendimento.model');
const Contato = require('../../contato/contato.model');
const verificaSeJaExisteConversaFb = require('./verifica-existe-conversa-facebook');
const iniciaConversaComFlexia = require('../flexia/inicia-conversa-flexia');
const enviaMensagemParaFlexia = require('../flexia/envia-mensagem-flexia');
const criaClienteFacebook = require('./cria-cliente-facebook');
const config = require('config');
const rp = require('request-promise-native');
const requestFile = require('../conversa-utils/request-file');
const ConfigGeral = require('../../configuracao/configuracao.model');
const eventEmit = require('../../util/eventEmmiter');

let usaChatbot = ''; // config.get('usa_chatbot');
let url = ''; // 'https://graph.facebook.com/v2.6/me/messages';
let PAGE_ACCESS_TOKEN = ''; // config.get('facebook_access_token');
let configFacebook;
// Função para pegar credenciais do facebook no banco de dados
async function atualizaCredenciaisFacebook() {
    // Inicializando constantes para utilizar no código
    try {
        log.log('Atualizando valores das credenciais do Facebook');
        const config = await ConfigGeral.findOne();
        configFacebook = config.facebook
        url = configFacebook.urlFacebook
        PAGE_ACCESS_TOKEN = configFacebook.facebook_access_token
        usaChatbot = configFacebook.usaBot;
    } catch (error) {
        log.error('** Erro ao atualizar credencial FB **');
        log.error(`** Erro: ${error} **`);
    }
}

// Função para enviar mensagem para o facebook
async function enviaFacebook(mensagem, userID) {
    await rp({
        uri: url,
        qs: { access_token: PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: {
            recipient: { id: userID },
            message: { text: mensagem }
        }
    })
}

// Função para enviar arquivo para o facebook
async function enviarArquivoFacebook(urlArquivo, userID, type) {
    await atualizaCredenciaisFacebook();

    await rp({
        uri: url,
        qs: { access_token: PAGE_ACCESS_TOKEN },
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
    })
}

// Função para pegar Info do Usuário
// Usando o id do Facebook
async function getUserInfo(userPSID) {
    log.success(' ==> getUserInfo <==')
    let options = {
        method: 'GET',
        url: 'https://graph.facebook.com/' + userPSID + '?fields=id,first_name,last_name,profile_pic&access_token=' + PAGE_ACCESS_TOKEN,
        json: true
    }
    return rp(options)
}

module.exports = {

    // Função GET para autenticar o facebook
    autenticaFacebook: async (req, res) => {
        try {
            await atualizaCredenciaisFacebook();
            log.success(' ==> Autenticando Facebook <==')
            let VERIFY_TOKEN = configFacebook.tokenFacebook;
            let challenge = req.query['hub.challenge'];
            let token = req.query['hub.verify_token'];
            let mode = req.query['hub.mode'];
            if (mode && token) {
                if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                    log.success(' ==> Autenticado com Sucesso <==')
                    res.status(200).send(challenge);
                } else {
                    log.error('** Error na autenticação com Facebook **')
                    log.error('** Erro: Token de Verificação Inválido **')
                    res.sendStatus(403);
                }
            }
        } catch (error) {
            log.error('** Erro na Autenticação com Facebook **')
            log.error(`** Erro: ${error} **`);
            res.status(400).json('fail');
        }
    },

    // Função POST que recebe a mensagem do facebook
    recebeMensagemFacebook: async (req, res) => {
        try {
            await atualizaCredenciaisFacebook();
            //console.log("CONVERSA -> CONVERSA FACEBOOK -> RECEBE");
            if (req.body.object !== 'page') return res.status(403).json('Não autorizado: o objeto não é uma página');
            //console.log('Req.body: ', JSON.stringify(req.body, null, 4))

            // Colocando possíveis entradas em um array
            let messagesFacebook = []
            req.body.entry.forEach((entry) => {
                messagesFacebook.push(entry.messaging[0]);
            })
            //console.log('Array de Mensagens do Facebook: ', JSON.stringify(messagesFacebook[0].message, null, 2));

            // Inicializando variável do usuário
            let user = {
                id: messagesFacebook[0].sender.id
            }

            // console.log('Mensagem do facebook: ', messagesFacebook);

            // Verificando se já existe conversa aberta com aquela facebook id
            const conversaDoUsuario = await verificaSeJaExisteConversaFb(user.id);

            if (usaChatbot && !conversaDoUsuario) { //usa bot e não possui conversa
                // Pegando informações do usuario e atualizando
                // console.log('usa bot e não possui conversa');
                user = await getUserInfo(user.id)

                let cont = await Contato.find({ "id_facebook": user.id });
                let cliente = cont.length > 0 ? cont[0] : await criaClienteFacebook(user);

                const conversaCriadaFlexIA = await iniciaConversaComFlexia({
                    nomeUsuario: user.last_name ? `${user.first_name} ${user.last_name}` : `${user.first_name}`,
                    origem: 'facebook',
                    formulario: false,
                    cliente: cliente
                });

                for (const mensagem of conversaCriadaFlexIA) {
                    if (mensagem.response_type == 'text') {
                        if (mensagem.texto) {
                            await enviaFacebook(mensagem.texto, user.id);
                        } else if (mensagem.title) {
                            await enviaFacebook(mensagem.title, user.id);
                        } else if (mensagem.description) {
                            await enviaFacebook(mensagem.description, user.id);
                        }
                    } else if (mensagem.response_type == 'image') {
                        await enviarArquivoFacebook(mensagem.source, user.id, 'image');
                    } else {
                        await enviaFacebook(mensagem.options, user.id);
                    }
                }

            } else if (usaChatbot && conversaDoUsuario && conversaDoUsuario.atendimentoBot) { //usa bot e a flexia esta atendendo
                // console.log('usa bot e a flexia esta atendendo');
                let resposta = [];
                resposta = await enviaMensagemParaFlexia(conversaDoUsuario, messagesFacebook[0].message.text);
                // console.log('Resposta da flexia: ', resposta);
                if (!resposta) {
                    // console.log('mensagem de encerramento');
                    await enviaFacebook('Conversa encerrada', user.id);
                    return;
                }
                for (const mensagem of resposta) {
                    if (mensagem.response_type == 'text') {
                        if (mensagem.texto) {
                            await enviaFacebook(mensagem.texto, user.id);
                        } else if (mensagem.title) {
                            await enviaFacebook(mensagem.title, user.id);
                        } else if (mensagem.description) {
                            await enviaFacebook(mensagem.description, user.id);
                        }
                    } else if (mensagem.response_type == 'image') {
                        await enviarArquivoFacebook(mensagem.source, user.id, 'image');
                    } else {
                        await enviaFacebook(mensagem.options, user.id);
                    }
                }
            } else if (usaChatbot && conversaDoUsuario && !conversaDoUsuario.atendimentoBot) { //usa bot e a conversa foi transferia para o atendente

                // TODO Atualizar a variavel user com a informações que estão na conversa

                for (const messaging of messagesFacebook) {
                    if (messaging.message.text) {
                        conversaDoUsuario.mensagens.push({
                            escrita_por: conversaDoUsuario.cliente.nome,
                            texto: messaging.message.text,
                            cliente_ou_atendente: 'cliente',
                            response_type: 'text'
                        });
                    }
                    if (messaging.message.attachments) {
                        for (const attachment of messaging.message.attachments) {
                            if (attachment.type === 'image') {
                                let nomeArquivo = await requestFile(attachment.payload.url, 'jpg', 'facebook');
                                conversaDoUsuario.mensagens.push({
                                    escrita_por: conversaDoUsuario.cliente.nome,
                                    source: `${config.get("url_midia")}${nomeArquivo}`,
                                    description: attachment.payload.title ? attachment.payload.title : '',
                                    cliente_ou_atendente: 'cliente',
                                    response_type: 'image'
                                });
                            } else if (attachment.type === 'file') {
                                let nomeArquivo = await requestFile(attachment.payload.url, attachment.payload.url.split('?')[0].split('.').pop(), 'facebook');
                                conversaDoUsuario.mensagens.push({
                                    escrita_por: conversaDoUsuario.cliente.nome,
                                    source: `${config.get("url_midia")}${nomeArquivo}`,
                                    description: attachment.payload.title ? attachment.payload.title : '',
                                    cliente_ou_atendente: 'cliente',
                                    response_type: 'file'
                                });
                            }
                        }
                    }
                }

                await ConversaAtendimento.findOneAndUpdate({ _id: conversaDoUsuario._id }, conversaDoUsuario);
                eventEmit.emit('enviar_msg_canal', { idDaConversa: conversaDoUsuario._id, mensagem: conversaDoUsuario.mensagens[conversaDoUsuario.mensagens.length - 1] });
            } else if (!usaChatbot) { //não usa bot
                if (conversaDoUsuario) {

                    // TODO Atualizar a variavel user com a informações que estão na conversa
                    for (const messaging of messagesFacebook) {
                        if (messaging.message.text) {
                            conversaDoUsuario.mensagens.push({
                                escrita_por: conversaDoUsuario.cliente.nome,
                                texto: messaging.message.text,
                                cliente_ou_atendente: 'cliente',
                                response_type: 'text'
                            });
                        }
                        if (messaging.message.attachments) {
                            for (const attachment of messaging.message.attachments) {
                                if (attachment.type === 'image') {

                                    let nomeArquivo = await requestFile(attachment.payload.url, 'jpg', 'facebook');
                                    conversaDoUsuario.mensagens.push({
                                        escrita_por: conversaDoUsuario.cliente.nome,
                                        source: `${config.get("url_midia")}${nomeArquivo}`,
                                        description: attachment.payload.title ? attachment.payload.title : '',
                                        cliente_ou_atendente: 'cliente',
                                        response_type: 'image'
                                    });
                                } else if (attachment.type === 'file') {
                                    let nomeArquivo = await requestFile(attachment.payload.url, attachment.payload.url.split('?')[0].split('.').pop(), 'facebook');
                                    conversaDoUsuario.mensagens.push({
                                        escrita_por: conversaDoUsuario.cliente.nome,
                                        source: `${config.get("url_midia")}${nomeArquivo}`,
                                        description: attachment.payload.title ? attachment.payload.title : '',
                                        cliente_ou_atendente: 'cliente',
                                        response_type: 'file'
                                    });
                                }
                            }
                        }
                    }


                    await ConversaAtendimento.updateOne({ _id: conversaDoUsuario._id }, conversaDoUsuario);
                    eventEmit.emit('enviar_msg_canal', { idDaConversa: conversaDoUsuario._id, mensagem: conversaDoUsuario.mensagens[conversaDoUsuario.mensagens.length - 1] });
                    res.send('Ok');
                } else {

                    // TODO Atualizar a variavel user com a informações que estão na conversa
                    user = await getUserInfo(user.id)

                    let cont = await Contato.find({ "id_facebook": user.id });
                    let cliente = cont.length > 0 ? cont[0] : await criaClienteFacebook(user, user.id);

                    let conversaCriada = await ConversaAtendimento.create({
                        cliente: cliente,
                        atendente: { name: "" },
                        fila: 'Facebook',
                        canal: 'facebook',
                        atendida: false,
                        encerrada: false,
                        atendimentoBot: false,
                        situacao: "nao_atendida"
                    });

                    for (const messaging of messagesFacebook) {

                        if (messaging.message.text) {
                            conversaCriada.mensagens.push({
                                escrita_por: conversaCriada.cliente.nome,
                                texto: messaging.message.text,
                                cliente_ou_atendente: 'cliente',
                                response_type: 'text'
                            });
                        }
                        if (messaging.message.attachments) {
                            for (const attachment of messaging.message.attachments) {
                                if (attachment.type === 'image') {

                                    let nomeArquivo = await requestFile(attachment.payload.url, 'jpg', 'facebook');
                                    conversaCriada.mensagens.push({
                                        escrita_por: conversaCriada.cliente.nome,
                                        source: `${config.get("url_midia")}${nomeArquivo}`,
                                        description: attachment.payload.title ? attachment.payload.title : '',
                                        cliente_ou_atendente: 'cliente',
                                        response_type: 'image'
                                    });
                                } else if (attachment.type === 'file') {
                                    let nomeArquivo = await requestFile(attachment.payload.url, attachment.payload.url.split('?')[0].split('.').pop(), 'facebook');
                                    conversaCriada.mensagens.push({
                                        escrita_por: conversaDoUsuario.cliente.nome,
                                        source: `${config.get("url_midia")}${nomeArquivo}`,
                                        description: attachment.payload.title ? attachment.payload.title : '',
                                        cliente_ou_atendente: 'cliente',
                                        response_type: 'file'
                                    });
                                }

                            }
                        }
                    }

                    await ConversaAtendimento.updateOne({ _id: conversaCriada._id }, conversaCriada);
                    eventEmit.emit('criar_conversa_canal', conversaCriada._id);
                    eventEmit.emit('enviar_msg_canal', { idDaConversa: conversaCriada._id, mensagem: conversaCriada.mensagens[conversaCriada.mensagens.length - 1] });
                    res.send('Ok');
                }

            }
            return res.status(200).json('sucess');
        } catch (error) {
            console.log('Erro na integração de conversa com facebook: ', error);
            res.status(400).json('fail');
        }
    }
};
