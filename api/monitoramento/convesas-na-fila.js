const Conversa = require('../conversa/conversa_atendimento.model');

async function conversasNaFila() {
  const query = {
    situacao: 'transferida'
  }

  const conversas = await Conversa.find(query);

  return conversas;
}

module.exports = conversasNaFila;