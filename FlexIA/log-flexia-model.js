const mongoose = require("mongoose");

const logWatsonSchema = mongoose.Schema({
  idDaConversa: {
    type: String
  },

  textos_da_conversa: [{
    resposta_watson: {
      type: Object
    },
    texto_do_cliente: {
      type: String
    }
  }]


});

const logWatson = mongoose.model("log_watson", logWatsonSchema);

module.exports = logWatson;
