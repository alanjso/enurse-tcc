const mongoose = require('mongoose');

const enderecoSchema = mongoose.Schema({
  rua: {
    type: String
  },

  numero: {
    type: String
  },

  bairro: {
    type: String
  },

  complemento: {
    type: String
  }
});

const empresaSchema = mongoose.Schema({
 
  nome: {
    type: String
  },

  cnpj: {
    type: String
  },

  endereco: enderecoSchema
});

const empresa = mongoose.model('empresa', empresaSchema);

module.exports = empresa;