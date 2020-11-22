const Contato = require('../../contato/contato.model');

module.exports = async function cria(body, telefone) {

    let cliente = {};

    cliente.nome = body.chat.last_name ? `${body.chat.first_name} ${body.chat.last_name}` : `${body.chat.first_name}`;
    cliente.celular = telefone;
    cliente.id_telegram = body.chat.id;

    return await Contato.create(cliente, { returnNewDocument: true });
}