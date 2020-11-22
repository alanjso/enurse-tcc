const mongoose = require('mongoose');

const predefinidasSchema = mongoose.Schema({
  titulo: {
    type: String
  },
  mensagem: {
    type: String
  },
  tipo: {
    type: String
  }
});

const predefinidas = mongoose.model('predefinidas', predefinidasSchema);

module.exports = predefinidas;