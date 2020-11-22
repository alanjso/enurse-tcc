const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    nome: {
        type: String
    },

    email: {
        type: String
    },

    celular: {
        type: String
    },

    senha: {
        type: String
    },

    tipoDeUsuario: {
        type: String
    },

    filas: {
        type: Array
    },

    trocouSenha: {
        type: Boolean
    },

    codigoDoAgente: {
        type: String
    },

    ramal: {
        type: String
    },

    userAtivo: {
        type: Boolean,
        default: true
    },

    darkMode: {
        type: Boolean,
        default: false
    },

    userProfilePic: {
        type: String,
        default: 'https://pngimage.net/wp-content/uploads/2018/05/default-user-profile-image-png-7.png'
    },

    isPaused: {
        type: Boolean,
        default: false
    },

    tipoPausa: {
        type: String,
    },
});

const user = mongoose.model('user', userSchema);

module.exports = user;