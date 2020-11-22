module.exports = function (c) {
    let cliente = {};

    cliente.nome = c.nome;
    cliente.celular = c.celular;
    cliente.cpf = c.cpf;

    return cliente;
}