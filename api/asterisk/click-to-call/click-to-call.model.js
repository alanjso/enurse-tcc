const mongoose = require('mongoose');
const yup = require('yup');

const callSchema = mongoose.Schema({
  origem: {
    type: String,
    required: true
  },

  destino: {
    type: String,
    required: true
  },

  hora_ligacao: {
    type: Date,
    default: Date.now
  }
});

const call = mongoose.model('call', callSchema);

module.exports = call;