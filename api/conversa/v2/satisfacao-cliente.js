const ConversaEncerrada = require('../conversa.model');

async function satisfacaoCliente(data, io, socket) {

    await ConversaEncerrada.findOneAndUpdate({ id_socket_cliente: socket.id },
        {
            $set: {
                satisfacao_do_cliente: data.nota
            }
        });
}

module.exports = satisfacaoCliente;