const ConversaAtendimento = require('../conversa_atendimento.model');

module.exports = async function verifica(id_telegram, medico) {
    let conversa = {};

    if (id_telegram == medico.id_telegram) {
        conversa = await ConversaAtendimento.findOne({ 'atendente.id_telegram': medico.id_telegram, canal: 'telegram', encerrada: false });
    } else {
        conversa = await ConversaAtendimento.findOne({ 'cliente.id_telegram': id_telegram, canal: 'telegram', encerrada: false });
    }
    return conversa;
}