const mongoose = require('mongoose');
const yup = require('yup');

const assuntoSchema = mongoose.Schema({
  nome: {
    type: String,
    required: true
  },

  descricao: {
    type: String,
    required: true
  }
});

const assunto = mongoose.model('assunto', assuntoSchema);

const schema = yup.object().shape({
  nome: yup.string().required(),
  descricao: yup.string().required()
});

module.exports = assunto;