const mongoose = require('mongoose');

const clientesApodiSchema = mongoose.Schema({

    CODIGO: {
        type: String,
        default: ''
    },

    CNPJ: {
        type: String,
        default: ''
    },

    NOME: {
        type: String,
        default: ''
    },

    ENDERECO: {
        type: String,
        default: ''
    },

    BAIRRO: {
        type: String,
        default: ''
    },

    CIDADE: {
        type: String,
        default: ''
    },

    UF: {
        type: String,
        default: ''
    },

    FONE1: {
        type: String,
        default: ''
    },

    FONE2: {
        type: String,
        default: ''
    },

    EMAIL1: {
        type: String,
        default: ''
    },

    EMAIL2: {
        type: String,
        default: ''
    }
});

const apodiClientes = mongoose.model('apodicliente', clientesApodiSchema);

module.exports = apodiClientes;