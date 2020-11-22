const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    nome: {
        type: String
    },
});

const tipoPausaSchema = mongoose.Schema({
    nome: {
        type: String
    },
});

const relatorioPausaSchema = mongoose.Schema({
    tipoPausa: tipoPausaSchema,

    usuario: userSchema,

    inicio_pausa: {
        type: Date,
        default: Date.now
    },

    encerramento_pausa: {
        type: Date,
    },

    isClosed: {
        type: Boolean,
        default: false
    },
});

const relatorioPausa = mongoose.model('relatorioPausa', relatorioPausaSchema);

module.exports = relatorioPausa;