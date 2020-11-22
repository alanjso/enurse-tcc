const mongoose = require('mongoose');
const Schema = require('mongoose').Schema;

const subMotivoSchema = mongoose.Schema({
  nome: {
    type: String
  },

  descricao: {
    type: String
  },

  motivo: {
    type: Schema.Types.ObjectId,
    ref: 'motivo'
  }
});

const subMotivo = mongoose.model('submotivo', subMotivoSchema);

module.exports = subMotivo;