const mongoose = require('mongoose');

const Schema = require('mongoose').Schema;

const comentarioSchema = mongoose.Schema({
  usuario: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
  texto: {
    type: String,
    required: true
  },
  data: {
    type: Date,
    required: true
  }
});

module.exports = comentarioSchema;