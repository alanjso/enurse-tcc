const mongoose = require('mongoose');

const mensagemFilaSchema = mongoose.Schema({
    texto: {
        type: String
    },

    escrita_por: {
        type: String,
        default: 'Mensagem Automática'
    },

    cliente_ou_atendente: {
        type: String,
        default: 'atendente'
    },

    response_type: {
        type: String
    },

    title: {
        type: String
    },

    description: {
        type: String
    },

    source: {
        type: String
    },

    filas: {
        type: Array
    },
});

const mensagemFila = mongoose.model('mensagemfila', mensagemFilaSchema);

module.exports = mensagemFila;