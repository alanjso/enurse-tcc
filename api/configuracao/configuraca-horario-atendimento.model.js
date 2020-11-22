const mongoose = require('mongoose');

const configuracaoHorarioAtendimentoSchema = mongoose.Schema({
  horarios:[
    {
      dia: {
        type: String,
        enum : ['SEGUNDA', 'TERÇA','QUARTA',"QUINTA","SEXTA",'SÁBADO','DOMINGO'],
      },
      horaInicio: {
        type: String,
        default: '08:00'
      },
      horaFim: {
        type: String,
        default: '18:00'
      },
      habilitado: {
        type: Boolean,
        default: true
      }
    }
  ]

});

const configuracaoHorarioAtendimento = mongoose.model('configuracao_horario_atendimento',configuracaoHorarioAtendimentoSchema);

module.exports = configuracaoHorarioAtendimento;