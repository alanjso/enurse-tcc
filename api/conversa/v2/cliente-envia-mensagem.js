const ConversaAtendimento = require('../conversa_atendimento.model');

async function clienteEnviaMensagem(data, io, socket) {
  // console.log('data: ', data);
  let conversa = await ConversaAtendimento.findById(data.idDaConversa);
  conversa.mensagens.push(data.mensagem);
  conversa.novas_mensagens = conversa.novas_mensagens + 1;
  let converasAtualizada = await ConversaAtendimento.findOneAndUpdate({ _id: conversa._id }, conversa);

  //problema de perder o socket -> rever depois
  try {
    await ConversaAtendimento.updateOne({ _id: conversa._id }, {
      $set: {
        id_socket_cliente: socket.id
      }
    });
  } catch (err) {
    console.log(err);
  }


  socket.to(conversa.id_socket_atendente).emit('cliente_enviou_mensagem', { idDaConversa: data.idDaConversa, mensagem: data.mensagem, novas_mensagens: conversa.novas_mensagens });
  //socket.emit('atualiza_conversa', conversa);
}

module.exports = clienteEnviaMensagem;