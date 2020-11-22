const log = require('../util/logs')
let Conversa = require('../conversa/conversa.model');

let criarCliente = require('./criar-cliente');

module.exports = {

    cria: async (req, res) => {

        let clientes = [];

        clientes = req.body.campanhaJson;

        log.log(clientes);

        clientes.forEach(async (c) => {

            let cliente = criarCliente(c);

            let conversa = {};

            conversa.cliente = cliente;

            conversa.fila = c.fila;

            conversa = await Conversa.create(conversa);

            log.log(conversa);

        });

        res.status(200).json('ok');
    }
}