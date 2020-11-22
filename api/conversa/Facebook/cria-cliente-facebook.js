const Contato = require('../../contato/contato.model');

module.exports = async function cria(user, telefone) {

    let cliente = {};

    cliente.nome = user.last_name ? `${user.first_name} ${user.last_name}` : `${user.first_name}`;
    cliente.celular = telefone;
    cliente.id_facebook = user.id;

    return await Contato.create(cliente, { returnNewDocument: true });
}