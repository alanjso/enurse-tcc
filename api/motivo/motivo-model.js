const mongoose = require('mongoose');

const motivoSchema = mongoose.Schema({
    nome: {
        type: String,
    },
    descricao: {
        type: String
    }
});

const motivo = mongoose.model('motivo', motivoSchema);

module.exports = motivo;