const mongoose = require('mongoose');
const Schema = require('mongoose').Schema;

const comentarioSchema = require('./comentario/comentario-model');
const tarefaSchema = require('./tarefa/tarefa-model');
const responsavelSchema = require('./responsavel/responsavel-model');

const caseSchema = mongoose.Schema({

  titulo: {
    type: String,
    required: true
  },

  aberto_por: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },

  conversa: {
    type: Schema.Types.ObjectId,
    ref: 'Conversa'
  },

  responsavel: [
    responsavelSchema
  ],

  descricao: {
    type: String,
    required: true
  },

  contato: {
    type: Schema.Types.ObjectId,
    ref: 'contato'
  },

  status: [
    {
      type: Schema.Types.ObjectId,
      ref: 'status'
    }
  ],

  motivo: [
    {
      type: Schema.Types.ObjectId,
      ref: 'motivo'
    }
  ],

  produto: {
    type: Schema.Types.ObjectId,
    ref: 'produto'
  },

  data_criacao: {
    type: Date,
    default: Date.now
  },

  data_prevista_encerramento: {
    type: Date
  },

  situacao_do_caso: [
    {
      encerrado: {
        type: Boolean
      },
      data: {
        type: Date
      }
    }
  ],

  comentarios: [comentarioSchema],

  tarefas: [tarefaSchema],

  uniqueid_telefone: {
    type: String
  },

});

const caso = mongoose.model('caso', caseSchema);

module.exports = caso;