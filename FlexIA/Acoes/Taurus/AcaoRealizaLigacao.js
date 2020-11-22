const log = require('../../../api/util/logs');

const TrataAcoes = require("../TrataAcoes");

const ConversaAtendimento = require('../../../api/conversa/conversa_atendimento.model');
const limpaCache = require('../../../api/util/limpaCache');

const realizaLigacao = require('../../../api/asterisk/click-to-call/realiza-ligacao');

class AcaoRealizaLigacao extends TrataAcoes {

  constructor() {
    super();
  }

  setSucessor(sucessor) {
    this.sucessor = sucessor;
  }

  async trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem) {

    log.log('Passou na Action: AcaoRealizaLigacao');

    try {
      if (acao === 'acaoRealizaLigacao') {
        log.success(` ==> Entrou na Action: acaoRealizaLigacao <== `);

        const cpf = responseFlexIA.output.user_defined.actions[0].parameters.cpf;
        const origem = '4444';
        const destino = conversa.cliente.celular;
        const nome = conversa.cliente.nome;

        console.log('cpf,origem,destino,nome: ',cpf,origem,destino,nome);

        if(responseFlexIA.output.user_defined.actions[0].parameters.cpf){
          realizaLigacao(origem,destino,cpf);
        }else {
          realizaLigacao(origem,destino,nome);
        }

        setTimeout(async () => {
          await ConversaAtendimento.findByIdAndUpdate(conversa._id, {
            $set: {
              encerrada: true,
              atendida: true,
              situacao: "encerrada",
              encerrada_por: "BOT",
              hora_fim_conversa: new Date(),
            }
          });
  
          await limpaCache(conversa._id);
        },3000);

        return true;
      } else {
        return await this.sucessor.trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem);
      }
    } catch (err) {
      log.error('** Erro na Action: AcaoRealizaLigacao **')
      log.error(`** Erro: ${err} **`);
    }
  }
}

module.exports = new AcaoRealizaLigacao();