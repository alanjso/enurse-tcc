const mongoose = require('mongoose');

const statusSchema = mongoose.Schema({
  nome: {
    type: String
  },

  descricao: {
    type: String
  },

  acao:{
    type:[String],
    enum:['SMS','TELEFONE','EMAIL']
  }
});

const status = mongoose.model('status', statusSchema);

module.exports = status;