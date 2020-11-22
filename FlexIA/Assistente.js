const log = require('../api/util/logs')
const iniciaCadeiaDeResponsabilidade = require("./Acoes/cadeiaDeResponsabilidade");
const config = require('config');
const AssistantV2 = require('ibm-watson/assistant/v2');
const { IamAuthenticator } = require('ibm-watson/auth');

let WatsonV2 = '';

class Assistente {
  constructor(apiKey, assistantId) {
    this.WatsonV2 = new AssistantV2({
      version: '2019-02-28',
      authenticator: new IamAuthenticator({ apikey: apiKey }), //config.get('watson.apiKey')
      url: 'https://gateway.watsonplatform.net/assistant/api'
    }); // require("./WatsonV2");
    this._idAssistenteChat = assistantId; // config.get('watson.assistantId');
    // this._idAssistenteAsterisk = '078d9d3f-5580-4bb4-be76-c8455af583aa';
  }

  // Retorna o ID da sessão que vai para o Flex-Chat-Client
  iniciarSessao(origem) {
    let idAssistente = origem === "Asterisk" ? this._idAssistenteAsterisk : this._idAssistenteChat;

    return new Promise((resolve, reject) => {
      this.WatsonV2.createSession({
        assistantId: idAssistente
      }, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response.result.session_id);
        }
      });
    });
  }

  encerrarSessao(origem, sessionId) {
    let idAssistente = origem === "Asterisk" ? this._idAssistenteAsterisk : this._idAssistenteChat;

    return new Promise((resolve, reject) => {
      this.WatsonV2.deleteSession({
        assistantId: idAssistente,
        sessionId: sessionId
      }, (err, response) => {
        if (err) {
          reject(err);
        } else {
          log.success(` ==> Sessão encerrada com sucesso para o ID: '${sessionId}' <== `);
          resolve(true);
        }
      })
    });
  }

  iniciarConversa(origem, sessionId, variaveisContexto) {
    let idAssistente = origem === "Asterisk" ? this._idAssistenteAsterisk : this._idAssistenteChat;

    return new Promise((resolve, reject) => {
      this.WatsonV2.message({
        assistantId: idAssistente,
        sessionId: sessionId,
        input: {
          'message_type': 'text',
          'text': ''
        },
        context: variaveisContexto
      }, (err, response) => {
        if (err) {
          reject(err);
        } else {
          log.success(` ==> Conversa iniciada com sucesso para o ID: '${sessionId}' <== `);
          resolve(response.result);
        }
      });
    });
  }

  /*Formato de variaveisContexto
  variaveisContexto = {
    'account_number': '123456',
    'encontrado_salesforce': true
  }
  */
  enviarMensagem(origem, sessionId, mensagem, variaveisContexto) {
    mensagem = mensagem.replace(/\n/g, ' ');
    // log.log('Enviando mensagem para a flexia: ' + mensagem);
    let idAssistente = origem === "Asterisk" ? this._idAssistenteAsterisk : this._idAssistenteChat;

    let params = {};
    params.assistantId = idAssistente;
    params.sessionId = sessionId;
    params.input = {
      'message_type': 'text',
      'text': mensagem,
      'options': {
        'return_context': true
      }
    }
    params.context = {}
    variaveisContexto ? params.context = { 'skills': { 'main skill': { 'user_defined': variaveisContexto } } } : 0;
    params.context['global'] = { 'system': { 'user_id': config.get('watson').user_id } }
    return new Promise((resolve, reject) => {
      this.WatsonV2.message(params, (err, response) => {
        if (err) {
          //console.log(' ========================= >>>>>>>>>>> Erro em this.WatsonV2.message(params, (err, response)');
          reject(err);
        } else {
          // log.success(` ==> Mensagem enviada com sucesso para o ID: ${sessionId} <== `);
          resolve(response.result);
        }
      })
    });
  }

  insereNoModelConversa(modelConversa, responseFlexIA, responseUsuario, idSessao, variaveisContexto) { // inserir variaveis de contexto para salvar informações importantes passadas nelas.
    return new Promise((resolve, reject) => {

      modelConversa.atendente.name === "" ? modelConversa.atendente.name = "FlexIA" : 0;

      if (responseUsuario) {
        modelConversa.cliente.nome === "" ? modelConversa.cliente.nome = responseUsuario.mensagem.escrita_por : 0;

        if (modelConversa.canal === 'whatsapp' || modelConversa.canal === 'telegram' || modelConversa.canal === 'facebook') {
          modelConversa.mensagens.push({
            escrita_por: responseUsuario.escrita_por,
            texto: responseUsuario.mensagem,
            cliente_ou_atendente: 'cliente',
            response_type: 'text'
          });
        } else {
          modelConversa.mensagens.push({
            escrita_por: responseUsuario.mensagem.escrita_por,
            texto: responseUsuario.mensagem.texto,
            cliente_ou_atendente: 'cliente',
            response_type: 'text'
          });
        }




      }
      /* Ajustar cliente sendo substituido
            if (variaveisContexto) {
              Object.keys(variaveisContexto).forEach((chave, indice) => {
                if ((Object.values(variaveisContexto)[indice] != undefined) && (chave === "nome" || chave === "email" || chave === "telefone" || chave === "empresa" || chave === "cpf")) {
                  modelConversa.cliente[chave] = Object.values(variaveisContexto)[indice];
                }
              })
            }
      */
      responseFlexIA.output.generic.forEach((mensagem) => {

        if (mensagem.response_type === 'text') {
          modelConversa.mensagens.push({
            "escrita_por": modelConversa.atendente.name,
            "texto": mensagem.text,
            "cliente_ou_atendente": "atendente",
            "response_type": mensagem.response_type
          });
        }
        else if (mensagem.response_type == 'option') {
          modelConversa.mensagens.push({
            "escrita_por": modelConversa.atendente.name,
            "title": mensagem.title,
            "description": mensagem.description,
            "cliente_ou_atendente": 'atendente',
            "response_type": 'text'
          });
          mensagem.options.forEach((mensagemOption) => {
            modelConversa.mensagens.push({
              "escrita_por": modelConversa.atendente.name,
              "options": mensagemOption.label,
              "cliente_ou_atendente": 'atendente',
              "response_type": mensagem.response_type
            });
          });
        }
        else if (mensagem.response_type === 'image') {
          if (responseFlexIA.output.user_defined) {
            if (responseFlexIA.output.user_defined.tag) {
              if (responseFlexIA.output.user_defined.tag === 'video') {
                modelConversa.mensagens.push({
                  "escrita_por": modelConversa.atendente.name,
                  "source": mensagem.source,
                  "cliente_ou_atendente": "atendente",
                  "response_type": "video",
                  "title": mensagem.title,
                  "description": mensagem.description
                });
              }
            }
          }
          else {
            modelConversa.mensagens.push({
              "escrita_por": modelConversa.atendente.name,
              "source": mensagem.source,
              "cliente_ou_atendente": "atendente",
              "response_type": mensagem.response_type,
              "title": mensagem.title,
              "description": mensagem.description
            });
          }
        }

      });
      modelConversa.idSessao = idSessao;

      // log.success(' ==> Inseriu no model com sucesso <== ');

      resolve(modelConversa);

    });
  }

  resolveAcao(responseFlexIA, conversa, flexIA_Assistente, origem) {
    // Todo método que trata ação retorna BOOLEANO TRUE
    return new Promise((resolve, reject) => {
      if (responseFlexIA.output.user_defined) {
        if (responseFlexIA.output.user_defined.actions) {
          if (responseFlexIA.output.user_defined.actions[0].type === 'client') {
            let acao = responseFlexIA.output.user_defined.actions[0].name;
            iniciaCadeiaDeResponsabilidade(acao, conversa, responseFlexIA, flexIA_Assistente, origem)
              .then(result => resolve(result))
              .catch(err => reject(err));
          }
        } else {
          resolve(false);
        }
      } else {
        resolve(false);
      }
    });
  }

  async defineResposta(inicioArray, modelConversa, origem, flagPrimeiraRequisicao, responseFlexIA) {

    let respostaFinal = {};
    let resposta = '';

    let tamanhoMensagensDepoisDoUpdate = modelConversa.mensagens.length;
    // log.log('ModelConversa no defineResposta: ' + modelConversa);
    let mensagensNovas = modelConversa.mensagens.slice(inicioArray, tamanhoMensagensDepoisDoUpdate);

    mensagensNovas.forEach((mensagem) => {
      if (mensagem.texto && (mensagem.cliente_ou_atendente === 'atendente')) {
        resposta += mensagem.texto + '. ';
      }
      else if (mensagem.options && (mensagem.cliente_ou_atendente === 'atendente')) {
        resposta += mensagem.options + '. ';
      }
    });

    if (flagPrimeiraRequisicao) {
      respostaFinal.id = modelConversa._id;
      respostaFinal.idSessao = modelConversa.idSessao;
      respostaFinal.resposta = resposta;
      respostaFinal.flagNumero = "false";

      temFlagNumero(responseFlexIA) ? respostaFinal.flagNumero = responseFlexIA.output.user_defined.flagNumero : 0;

    } else {
      respostaFinal.resposta = resposta;
      respostaFinal.flagNumero = "false";

      if (temFlagNumero(responseFlexIA)) {
        respostaFinal.flagNumero = responseFlexIA.output.user_defined.flagNumero;
      }
    }

    switch (origem) {
      case 'Asterisk':
        return respostaFinal;
      default:
        return modelConversa;
    }

    function temFlagNumero(responseFlexIA) {
      if (responseFlexIA.output) {
        if (responseFlexIA.output.user_defined) {
          if (responseFlexIA.output.user_defined.flagNumero) {
            return true;
          }
        }
      }
    }
  }

  async defineRespostaAtendente(inicioArray, modelConversa, origem, flagPrimeiraRequisicao, responseFlexIA) {

    let tamanhoMensagensDepoisDoUpdate = modelConversa.mensagens.length;
    let mensagensNovas = modelConversa.mensagens.slice(inicioArray, tamanhoMensagensDepoisDoUpdate);
    let respostaFinal = mensagensNovas.filter(r => r.cliente_ou_atendente === 'atendente');

    if (Array.isArray(respostaFinal)) {
      return respostaFinal;
    } else {
      return [respostaFinal];
    }
  }
}



module.exports = Assistente;
