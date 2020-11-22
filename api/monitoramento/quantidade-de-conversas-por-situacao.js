const Conversa = require('../conversa/conversa_atendimento.model');
var format = require('date-fns/format')
/*
[
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }
        }
      }
    ],
*/

async function quantidadeDeConversasPorSituacao() {

  var data = format(
    new Date(),
    'YYYY-MM-DD'
  )

  const dataInicial = `${data}T00:00:00.0Z`;
  const dataFinal = `${data}T23:59:59.0Z`;

  const aggregator = [
    {
      $match: { hora_criacao: { $gte: new Date(dataInicial), $lt: new Date(dataFinal) } }
    },
    {
      $group: {
        _id: "$situacao",
        quantidadet: { $sum: 1 }
      }
    }
  ]

  const conversas = await Conversa.aggregate(aggregator);
  // console.log('quantidadeDeConversasPorSituacao: ',conversas);
  return conversas;
}

module.exports = quantidadeDeConversasPorSituacao;