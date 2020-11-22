const conversaEmAtendimento = require('../conversa_atendimento.model');

async function diminuirPosicaoFila(socket, fila) {
  console.log("##### DIMINUIR POSICAO FILA #####");
  const conversas = await conversaEmAtendimento.find({ fila });

  conversas.map(conversa => {
    socket.to(conversa.id_socket_cliente).emit('diminuir_posicao', { fila: conversa.fila });
  });

}

module.exports = diminuirPosicaoFila;