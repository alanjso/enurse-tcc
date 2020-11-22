const mongoose = require('mongoose');

const produtoSchema = mongoose.Schema({
    nome: {
        type: String,
    },
    descricao: {
        type: String
    }
});

const produto = mongoose.model('produto', produtoSchema);

module.exports = produto;