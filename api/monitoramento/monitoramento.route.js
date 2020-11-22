const monitoramentoService = require('./monitoramento.service');

module.exports = server => {

  const SERVICE = '/monitoramento'

  //server.get('/monitoramento/filas',monitoramentoService.monitorarConversas);
  server.get(`${SERVICE}/tempomedio/atendimento`, async (req, res) => {
    res.status(200).json({ status: 'OK' });
  });

  server.get(`${SERVICE}/tempomedio/espera`, async (req, res) => {
    res.status(200).json({ status: 'OK' });
  });

  server.get(`${SERVICE}/tempomedio/desistencia`, async (req, res) => {
    res.status(200).json({ status: 'OK' });
  });

  server.get(`${SERVICE}/quantidadeconversas/hora`, async (req, res) => {
    res.status(200).json({ status: 'OK' });
  });

  server.get(`${SERVICE}/quantidadeconversas/situacao`, async (req, res) => {
    res.status(200).json({ status: 'OK' });
  });

}