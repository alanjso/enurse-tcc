const ConversaAtendimento = require('../conversa_atendimento.model');

module.exports = async function verifica(id_telegram) {
    const conversaDoCliente = await ConversaAtendimento.findOne({ 'cliente.id_telegram': id_telegram, canal: 'telegram', encerrada: false });
    return conversaDoCliente;
}