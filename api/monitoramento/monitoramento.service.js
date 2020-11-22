const atendentesLogadosComConversas = require('./atendentesLogadosComQuantidadeAtendimento');
const eventEmit = require('../util/eventEmmiter');
//eventEmit.emit('enviar_msg_telegram', grupoTelegramParaEnviarAlerta, `Cliente: ${conversa.cliente.nome} entrou na fila: ${conversa.fila}, data: ${new Date()}`);

module.exports = (socket, io) => {

  socket.on('monit_adm_req', async event => {
    socket.emit('monit_adm_res', await atendentesLogadosComConversas());
  })

}