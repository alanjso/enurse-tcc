const ConversaAtendimento = require('../conversa_atendimento.model');

async function digitando(socket,msg) {
  let conversa = await ConversaAtendimento.findById(msg);
  if (socket.id == conversa.id_socket_atendente) {
    socket.to(conversa.id_socket_cliente).emit('digitando_atendente', { digitando: true, conversaId: conversa.id });
  } else if (socket.id == conversa.id_socket_cliente) {
    socket.to(conversa.id_socket_atendente).emit('digitando_cliente', { digitando: true, conversaId: conversa.id });
  }
}

module.exports = digitando;

