const mongoose = require('mongoose');

const mensagemSchema = mongoose.Schema({

}, {
    _id: false
});

const clienSchema = mongoose.Schema({

}, {
    _id: false
});

const atendenteSchema = mongoose.Schema({

}, {
    _id: false
});

const conversaSchema = mongoose.Schema({

    id_socket_atendente: {
        type: String
    },

    id_socket_cliente: {
        type: String
    },

    data_criacao: {
        type: Date,
        default: Date.now
    },

    atendida: {
        type: Boolean,
        default: false
    },

    encerrada: {
        type: Boolean,
        default: false
    },

    historico_atendimento: {
        type: String
    },

    id_session_watson: {
        type: String
    },

    id_telegram: {
        type: String
    }
});

const conversa = mongoose.model('conversav2', conversaSchema);

module.exports = conversa;