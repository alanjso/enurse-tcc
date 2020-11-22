const mongoose = require('mongoose');
const Schema = require('mongoose').Schema;

const responsavelSchema = mongoose.Schema({
  usuario: {
    type: Schema.Types.ObjectId, 
      ref: 'user'
  },
  data_inicio: {
    type: Date,
    default: Date.now
  },
  data_fim: {
    type: Date
  }
});

module.exports = responsavelSchema;