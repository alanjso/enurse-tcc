const ConversaAtendimento = require('../conversa_atendimento.model');

async function atenderLigacao(io, socket, data) {
  await ConversaAtendimento.updateOne({ _id: data.id }, {
    $set: {
      id_socket_atendente: socket.id,
      atendida: true,
      situacao: 'em_atendimento',
      hora_do_atendimento: new Date(),
      atendente: {
        _id: data.atendente._id,
        name: data.atendente.nome
      },
    }
  });
  let conversa = await ConversaAtendimento.findOne({ _id: data.id });

  //emitir evento para a conversa em que foi atendida
  socket.to(conversa.id_socket_cliente).emit('conversa_atendida_cliente', { msg: 'conversa atendida' });
  socket.emit('conversa_atendida', { conversa });
  io.emit('remove_conversa_fila', conversa._id);
}

module.exports = atenderLigacao;