const ConversaAtendimento = require('./conversa_atendimento.model');

module.exports = async function verifica(telefone) {
    const conversaDoCliente = await ConversaAtendimento.findOne({ 'cliente.celular': telefone, canal: 'whatsapp', encerrada: false });
    return conversaDoCliente;
}