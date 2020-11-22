const mongoose = require('mongoose');

const setorSchema = mongoose.Schema({
    nome: {
        type: String,
    },
    descricao: {
        type: String
    }
});

const setor = mongoose.model('Setor', setorSchema);

module.exports = setor;