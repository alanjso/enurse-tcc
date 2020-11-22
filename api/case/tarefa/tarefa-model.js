const mongoose = require('mongoose');

const tarefaSchema = mongoose.Schema({
  titulo: {
    type: String,
    required: true
  },
  descricao: {
    type: String,
    required: true
  },
  data_criacao: {
    type: Date,
    default: Date.now
  },
  data_execucao: {
    type: Date
  }
});

module.exports = tarefaSchema;