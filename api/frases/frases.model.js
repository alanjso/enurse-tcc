const mongoose = require('mongoose');

const FraseModel = mongoose.model('frase', mongoose.Schema({
    texto: {
        type: String,
        required: true
    }
}), 'frases');

module.exports = FraseModel;
