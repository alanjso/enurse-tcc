const ConversaAtendimento = require('../conversa_atendimento.model');

async function parouDeDigitar(socket,msg) {
  let conversa = await ConversaAtendimento.findById(msg);
  if (socket.id == conversa.id_socket_atendente) {
    socket.to(conversa.id_socket_cliente).emit('parou_digitar_atendente', { digitando: false, conversaId: conversa.id });
  } else if (socket.id == conversa.id_socket_cliente) {
    socket.to(conversa.id_socket_atendente).emit('parou_digitar_cliente', { digitando: false, conversaId: conversa.id });
  }
}

module.exports = parouDeDigitar;