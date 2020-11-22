const mongoose = require("mongoose");

const filaSchema = mongoose.Schema({
  nome: {
    type: String
  },
  descricao: {
    type: String
  },
  cor: {
    type: String
  }
});

const fila = mongoose.model("Fila", filaSchema);

module.exports = fila;
