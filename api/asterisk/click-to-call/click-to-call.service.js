const Call = require('./click-to-call.model');
const realizaLigacao = require('./realiza-ligacao');

module.exports = {
  realizaLigacao: async (req, res) => {
    console.log('Realizando ligação');
    console.log(req.body);
    console.log('============================ FIM DO BODY ====================');

    await Call.create(req.body);

    realizaLigacao(req.body.origem,req.body.destino,req.body.other_variable);

    res.status(200).json({ msg: 'Ligação Realizada' });
  }
}