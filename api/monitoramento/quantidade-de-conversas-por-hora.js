const Conversa = require('../conversa/conversa.model');
var formatData = require('date-fns/format')

/*
[
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }
        }
      }
    ],
*/

async function quantidadeDeConversasPorHora() {

  var data = formatData(
    new Date(),
    'YYYY-MM-DD'
  )

  // const dataInicial = `${data}T00:00:00.0Z`;
  // const dataFinal = `${data}T23:59:59.0Z`;

  const dataInicial = `2020-05-01T00:00:00.0Z`;
  const dataFinal = `2020-05-25T23:59:59.0Z`;

  const aggregator = [
    {
      $match: { hora_criacao: { $gte: new Date(dataInicial), $lt: new Date(dataFinal) } }
    },
    {
      $group: {
        _id: {
          hora: { $dateToString: { format: "%HH", date: "$hora_criacao" } },
          canal: "$canal"
        },
        quantidadet: { $sum: 1 }
      }
    },
    // {
    //   $group: {
    //     _id: { hora: { $dateToString: { format: "%HH", date: "$hora_criacao" } }, dia: { $dateToString: { format: "%dd", date: "$hora_criacao" } } },
    //     quantidadet: { $sum: 1 }
    //   }
    // },
    // {
    //   $sort: { hora_criacao: 1 }
    // }
  ]

  const quanntidadeDeConversas = await Conversa.aggregate(aggregator);
  // console.log(quanntidadeDeConversas);
  return quanntidadeDeConversas;
}

module.exports = quantidadeDeConversasPorHora;