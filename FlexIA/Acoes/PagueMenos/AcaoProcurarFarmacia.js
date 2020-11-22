const log = require('../../../api/util/logs');
const TrataAcoes = require("../TrataAcoes");
const buscaLatitudeLongitude = require('./busca-longitude-latitude');
const buscaFarmaciaMaisProxima = require('./busca-farmacias-mais-proximas');
const buscaDetalheDaFarmacia = require('./busca-detalhe-da-farmacia');
const event = require('../../../api/util/eventEmmiter');
const ConversaAtendimento = require('../../../api/conversa/conversa_atendimento.model');
const limpaCache = require('../../../api/util/limpaCache')
class AcaoProcurarFarmacia extends TrataAcoes {
  constructor() {
    super();
  }

  setSucessor(sucessor) {
    this.sucessor = sucessor;
  }

  async trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem) {

    log.log('Passou na Action: AcaoProcurarFarmacia');

    try {
      if (acao === 'acaoProcurarFarmacia') {
        log.success(` ==> Entrou na Action: acaoProcurarFarmacia <== `);

        //responseFlexIA.output.actions[0].parameters.cidade,
        const cidade = responseFlexIA.output.user_defined.actions[0].parameters.cidade;
        const endereco = responseFlexIA.output.user_defined.actions[0].parameters.endereco;
        const bairro = responseFlexIA.output.user_defined.actions[0].parameters.bairro;

        const local = endereco + ' ' + cidade + ' ' + bairro;

        const coordenadas = await buscaLatitudeLongitude(local);
        console.log('coordenada: ', coordenadas);
        const idsFarmacia = await buscaFarmaciaMaisProxima(coordenadas);
        console.log('id farmacia: ', idsFarmacia);

        idsFarmacia.forEach( async (id) => {
          const detalheDaFarmacia = await buscaDetalheDaFarmacia(id);
          console.log('Cliente: ', conversa.cliente);

          setTimeout(() => {
            event.emit('envia_mensagem_para_gupshup', {
              mensagem: {
                endereco: detalheDaFarmacia.formatted_address,
                telefone: detalheDaFarmacia.formatted_phone_number,
                aberta: detalheDaFarmacia.opening_hours.open_now,
              },
              telefone_cliente: conversa.cliente.celular
            });
          }, 3000);
          
        })


        setTimeout(async () => {
        
          event.emit('envia_mensagem_para_gupshup', {
            mensagem: {
              finaliza: true,
              texto: 'Espero que estas informações tenham sido úteis pra ti.Tchauzinho da Vida!',
            },
            telefone_cliente: conversa.cliente.celular
          });

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

        },5000);

        
        return true;
      } else {
        return await this.sucessor.trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem);
      }
    } catch (err) {
      log.error('** Erro na Action: acaoProcurarFarmacia **')
      console.log(err);
    }
  }
}

module.exports = new AcaoProcurarFarmacia();