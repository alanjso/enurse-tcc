const mongoose = require('mongoose');

const contatoSchema = mongoose.Schema({

    nome: {
        type: String,
        default: ''
    },

    email: {
        type: String,
        default: ''
    },

    celular: {
        type: String,
        default: ''
    },

    cnpj: {
        type: String,
        default: ''
    },

    rg: {
        type: String,
        default: ''
    },

    cpf: {
        type: String,
        default: ''
    },

    id_telegram: {
        type: String,
        default: ''
    },

    id_facebook: {
        type: String,
        default: ''
    },

    data_nascimento: {
        type: String,
        default: ''
    }

});

const contato = mongoose.model('contato', contatoSchema);

module.exports = contato;