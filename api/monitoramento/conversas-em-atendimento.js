const Conversa = require('../conversa/conversa_atendimento.model');

async function conversasEmAtendimento() {
  const query = {
    situacao: 'em_atendimento'
  }

  const conversas = await Conversa.find(query);

  return conversas;
}

module.exports = conversasEmAtendimento;