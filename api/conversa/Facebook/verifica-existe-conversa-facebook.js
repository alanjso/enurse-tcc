const ConversaAtendimento = require('../conversa_atendimento.model');

module.exports = async function verifica(id_facebook) {
    const conversaDoCliente = await ConversaAtendimento.findOne({ 'cliente.id_facebook': id_facebook, canal: 'facebook', encerrada: false });
    return conversaDoCliente;
}