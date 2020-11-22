module.exports = function cria(sender) {

    let cliente = {};

    cliente.nome = sender.name;
    cliente.celular = sender.phone;

    return cliente;
}