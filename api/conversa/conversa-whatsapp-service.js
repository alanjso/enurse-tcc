// const ConversaEncerrada = require('./conversa.model');
const ConversaAtendimento = require('./conversa_atendimento.model');
const Contato = require('../contato/contato.model');
const verificaSeJaExisteConversa = require('./verifica-se-ja-existe-conversa');
const config = require('config')
const iniciaConversaComFlexia = require('./flexia/inicia-conversa-flexia');
const enviaMensagemParaFlexia = require('./flexia/envia-mensagem-flexia');
const criaClienteWhatsapp = require('./cria-cliente-do-whatspp');
let request = require('request');
let rp = require('request-promise-native');
const requestFile = require('./conversa-utils/request-file');
const ConfigGeral = require('../configuracao/configuracao.model');
const eventEmit = require('../util/eventEmmiter');
const log = require('../util/logs');
const axios = require('axios');
const qs = require('querystring');

let configWpp;
let usaChatbot = ''; // config.get('usa_chatbot');
let url = ''; // "https://eu25.chat-api.com/instance45195/sendMessage?token=dillsapyt8n8dmtw";
let urlMidiaWpp = ''; // "https://eu25.chat-api.com/instance45195/sendFile?token=dillsapyt8n8dmtw";

const IMAGE = 'image';
const TEXT = 'text';
const AUDIO = 'audio';
const VIDEO = 'video';
const FILE = 'file';

// Função para pegar credenciais do whatsapp no banco de dados
async function atualizaCredenciaisWhatsapp() {
  // Inicializando constantes para utilizar no código
  try {
    log.log('Atualizando valores das credenciais do Whatsapp');
    const config = await ConfigGeral.findOne();
    configWpp = config.whatsapp;
    usaChatbot = configWpp.usaBot;
  } catch (error) {
    log.error('** Erro ao atualizar credencial WPP **');
    log.error(`** Erro: ${error} **`);
  }
}

async function envia(mensagem, telefoneDestino) {
  return new Promise((resolve, reject) => {
    console.log('Enviando mensagem para a gupshup');
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

    console.log('body: ',requestBody);
    console.log('config: ',config);

    axios.post('https://api.gupshup.io/sm/api/v1/msg', qs.stringify(requestBody), config)
      .then((result) => {
        resolve();
        console.log('mensagem enviada com sucesso para a gupshup');
      })
      .catch((err) => {
        console.log('error: ', err);
        reject();
      })
  });
}

async function sendPhoto(celular, image, filename, caption) {

  const data = {
    phone: celular,
    body: image,
    filename: filename,
    caption: caption
  }
  request({
    url: urlMidiaWpp,
    method: "POST",
    json: data
  }, function (error, response, body) {});
}

module.exports = {
  recebe: async (req, res) => {

    // console.log('Recebendo dados do whatsapp');
    //console.log("CONVERSA -> CONVERSA WHATSAP -> RECEBE");

    if (req.body.type == 'user-event' && req.body.payload.type == 'sandbox-start') {
      res.status(200).send('Ok');
      return;
    }

    if (req.body.type == 'message-event') {
      res.status(200).send('Ok');
      return;
    }

    await atualizaCredenciaisWhatsapp();

    const telefone = req.body.payload.source;

    const texto = req.body.payload.payload.text;

    const sender = req.body.payload.sender;

    console.log('sender: ', sender,telefone,texto);

    const conversaDoUsuario = await verificaSeJaExisteConversa(telefone);

    if (usaChatbot && !conversaDoUsuario) { //usa bot e não possui conversa
      console.log('1');
      let cont = await Contato.find({
        "celular": telefone
      });
      let cliente = cont.length > 0 ? cont[0] : criaClienteWhatsapp(sender);
      console.log('2');
      const conversaCriadaFlexIA = await iniciaConversaComFlexia({
        nomeUsuario: sender.name,
        origem: 'whatsapp',
        formulario: false,
        cliente: cliente
      });
      console.log('3');
      for (const mensagem of conversaCriadaFlexIA) {
        console.log('4: ',mensagem);
        if (mensagem.response_type == 'text') {
          if (mensagem.texto) {
            await envia(mensagem.texto, telefone);
          } else if (mensagem.title) {
            await envia(mensagem.title, telefone);
          } else if (mensagem.description) {
            await envia(mensagem.description, telefone);
          }
        } else if (mensagem.response_type == 'image') {
          await sendPhoto(telefone, mensagem.source, mensagem.title, mensagem.description);
        } else {
          await envia(mensagem.options, telefone);
        }
      }
      res.status(200).json();
    } else if (usaChatbot && conversaDoUsuario && conversaDoUsuario.atendimentoBot) { //usa bot e a flexia esta atendendo

      let resposta = await enviaMensagemParaFlexia(conversaDoUsuario, texto);

      for (const mensagem of resposta) {
        if (mensagem.response_type == 'text') {
          if (mensagem.texto) {
            await envia(mensagem.texto, telefone);
          } else if (mensagem.title) {
            await envia(mensagem.title, telefone);
          } else if (mensagem.description) {
            await envia(mensagem.description, telefone);
          }
        } else if (mensagem.response_type == 'image') {
          await sendPhoto(telefone, mensagem.source, mensagem.title, mensagem.description);
        } else {
          await envia(mensagem.options, telefone);
        }
      }
      res.status(200).json();
    } else if (usaChatbot && conversaDoUsuario && !conversaDoUsuario.atendimentoBot) { //usa bot e a conversa foi transferia para o atendente

      const typeMessage = req.body.payload.type;

      if (typeMessage === TEXT) {
        conversaDoUsuario.mensagens.push({
          escrita_por: sender.name,
          texto: texto,
          cliente_ou_atendente: 'cliente',
          response_type: 'text'
        });
      } else if (typeMessage === IMAGE) {
        conversaDoUsuario.mensagens.push({
          escrita_por: sender.name,
          source: req.body.payload.payload.url,
          cliente_ou_atendente: 'cliente',
          response_type: 'image',
          description: req.body.payload.payload.caption
        });
      } else if (typeMessage === FILE) {
        conversaDoUsuario.mensagens.push({
          escrita_por: sender.name,
          source: req.body.payload.payload.url,
          cliente_ou_atendente: 'cliente',
          response_type: 'file',
          description: req.body.payload.payload.caption
        });
      } else if (typeMessage === VIDEO) {
        conversaDoUsuario.mensagens.push({
          escrita_por: sender.name,
          source: req.body.payload.payload.url,
          cliente_ou_atendente: 'cliente',
          response_type: 'VIDEO',
          description: req.body.payload.payload.caption
        });
      } else if (typeMessage === AUDIO) {
        conversaDoUsuario.mensagens.push({
          escrita_por: sender.name,
          source: req.body.payload.payload.url,
          cliente_ou_atendente: 'cliente',
          response_type: 'AUDIO',
          description: req.body.payload.payload.caption
        });
      }

      await ConversaAtendimento.findOneAndUpdate({
        _id: conversaDoUsuario._id
      }, conversaDoUsuario);
      eventEmit.emit('enviar_msg_canal', {
        idDaConversa: conversaDoUsuario._id,
        mensagem: conversaDoUsuario.mensagens[conversaDoUsuario.mensagens.length - 1]
      });
      res.status(200).json();
    } else if (!usaChatbot) { //não usa bot
      try {
        if (conversaDoUsuario) {
          const typeMessage = req.body.payload.type;

          if (typeMessage === TEXT) {
            conversaDoUsuario.mensagens.push({
              escrita_por: sender.name,
              texto: texto,
              cliente_ou_atendente: 'cliente',
              response_type: 'text'
            });
          } else if (typeMessage === IMAGE) {
            conversaDoUsuario.mensagens.push({
              escrita_por: sender.name,
              source: req.body.payload.payload.url,
              cliente_ou_atendente: 'cliente',
              response_type: 'image',
              description: req.body.payload.payload.caption
            });
          } else if (typeMessage === FILE) {
            conversaDoUsuario.mensagens.push({
              escrita_por: sender.name,
              source: req.body.payload.payload.url,
              cliente_ou_atendente: 'cliente',
              response_type: 'file',
              description: req.body.payload.payload.caption
            });
          } else if (typeMessage === VIDEO) {
            conversaDoUsuario.mensagens.push({
              escrita_por: sender.name,
              source: req.body.payload.payload.url,
              cliente_ou_atendente: 'cliente',
              response_type: 'VIDEO',
              description: req.body.payload.payload.caption
            });
          } else if (typeMessage === AUDIO) {
            conversaDoUsuario.mensagens.push({
              escrita_por: sender.name,
              source: req.body.payload.payload.url,
              cliente_ou_atendente: 'cliente',
              response_type: 'AUDIO',
              description: req.body.payload.payload.caption
            });
          }

          await ConversaAtendimento.findOneAndUpdate({
            _id: conversaDoUsuario._id
          }, conversaDoUsuario);
          eventEmit.emit('enviar_msg_canal', {
            idDaConversa: conversaDoUsuario._id,
            mensagem: conversaDoUsuario.mensagens[conversaDoUsuario.mensagens.length - 1]
          });
          res.status(200).json();
        } else {

          let cont = await Contato.find({
            "celular": telefone
          });
          let cliente = cont.length > 0 ? cont[0] : criaClienteWhatsapp(sender);

          let conversaCriada = await ConversaAtendimento.create({
            cliente: cliente,
            fila: "Whatsapp",
            canal: "whatsapp",
            atendimentoBot: false,
            situacao: "nao_atendida"
          });

          const typeMessage = req.body.payload.type;

          if (typeMessage === TEXT) {
            conversaCriada.mensagens.push({
              escrita_por: sender.name,
              texto: texto,
              cliente_ou_atendente: 'cliente',
              response_type: 'text'
            });
          } else if (typeMessage === IMAGE) {
            conversaCriada.mensagens.push({
              escrita_por: sender.name,
              source: req.body.payload.payload.url,
              cliente_ou_atendente: 'cliente',
              response_type: 'image',
              description: req.body.payload.payload.caption
            });
          } else if (typeMessage === FILE) {
            conversaCriada.mensagens.push({
              escrita_por: sender.name,
              source: req.body.payload.payload.url,
              cliente_ou_atendente: 'cliente',
              response_type: 'file',
              description: req.body.payload.payload.caption
            });
          } else if (typeMessage === VIDEO) {
            conversaCriada.mensagens.push({
              escrita_por: sender.name,
              source: req.body.payload.payload.url,
              cliente_ou_atendente: 'cliente',
              response_type: 'VIDEO',
              description: req.body.payload.payload.caption
            });
          } else if (typeMessage === AUDIO) {
            conversaCriada.mensagens.push({
              escrita_por: sender.name,
              source: req.body.payload.payload.url,
              cliente_ou_atendente: 'cliente',
              response_type: 'AUDIO',
              description: req.body.payload.payload.caption
            });
          }


          await ConversaAtendimento.findOneAndUpdate({
            _id: conversaCriada._id
          }, conversaCriada);

          console.log('id: ',conversaCriada._id);

          eventEmit.emit('criar_conversa_canal', 
             conversaCriada._id
          );
          res.status(200).json();
        }
      } catch (err) {
        console.log(err);
        return res.status(200).json();
      }
    }
    res.status(200).json();
  },

  envia: async (req, res) => {
    console.log('Enviando mensagem para o gushup');
    // console.log('Enviando mensagem para a gupshup');
    await atualizaCredenciaisWhatsapp();

    const requestBody = {
      channel: configWpp.channel ? configWpp.channel : 'whatsapp',
      source: configWpp.source ? configWpp.source : '558539240077',
      destination: req.body.phone,
      message: req.body.body,
      'src.name': configWpp.srcName ? configWpp.srcName : 'G4FlexApp02'
    }

    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
        'apikey': configWpp.apikey ? configWpp.apikey : '69cb713b279b48acc88370f7ca00c91f'
      }
    }

    console.log('header:',config);

    console.log('body: ', requestBody);

    axios.post('https://api.gupshup.io/sm/api/v1/msg', qs.stringify(requestBody), config)
      .then((result) => {
        res.status(200).json(result);
      })
      .catch((err) => {
        console.log('erro ao enviar mensagem para a gupshup');
        res.status(200).json(err);
      })

  },

  iniciaConversaComCliente: async (req, res) => {
    //console.log("API -> CONVERSA WHATSAP -> INICIA CONVERSA COM CLIENTE");
    await atualizaCredenciaisWhatsapp();
    let telefone = req.body.telefone;

    //primeiro verifica se já existe essa conversa no banco
    let conversa = ConversaAtendimento.find({
      "cliente.celular": telefone
    });

    //se já existe faça isso
    if (conversa) {
      conversa.encerrada = false;
      conversa.atendida = true;
      conversa.situacao = "em_atendimento";
    } else {
      //se não existe faça isso, criar conversa e colocar uma mensagem padrão
    }
  }
};