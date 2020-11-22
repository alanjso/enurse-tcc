const emitter = require('events').EventEmitter;
const log = require('../util/logs');
const Status = require('./status.model');
const Conversa = require("../conversa/conversa.model");
const yup = require('yup');
const quantidadeDeConversaPorPagina = 10;

const eventEmit = new emitter();

eventEmit.on('atualizaConversaStatus', async (status, statusNovo) => {
  try {
    await Conversa.updateMany({ status: status }, { $set: { status: statusNovo } });
  } catch (error) {
    log.error(error)
  }
});

module.exports = {

  lista: async (req, res) => {
    const listStatus = await Status.find().sort({ nome: 1 });
    res.status(200).json(listStatus);
  },

  adiciona: async (req, res) => {

    let schema = yup.object().shape({
      nome: yup.string().required(),
      descricao: yup.string().required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const statusExists = await Status.findOne({ nome: req.body.nome });

    if (statusExists) {
      return res.status(400).json({ error: 'Status já existe' });
    }

    const status = await Status.create(req.body);
    res.status(202).json(status);
  },

  edita: async (req, res) => {
    try {

      const statusExists = await Status.findOne({ _id: { $ne: req.params.id} ,nome: req.body.nome });

      if (statusExists) {
       // console.log(statusExists)
        return res.status(400).json({ error: 'Status já existe' });
      }

      let status = await Status.findById(req.params.id);
      await Status.findByIdAndUpdate(req.params.id, req.body);
      if (status.nome != req.body.nome) eventEmit.emit('atualizaConversaStatus', status.nome, req.body.nome);
      
      res.status(200).json('');
    } catch (error) {
      log.error('** Erro no update do status **');
      log.error(`** Erro: ${error} **`);
      res.status(500).json();
    }
  },

  buscaPorId: async (req, res) => {
    const status = await Status.findById(req.params.id);
    res.status(200).json(status);
  },

  deleta: async (req, res) => {
    await Status.findByIdAndDelete(req.params.id);
    res.status(200).json('');
  },

  listaComFiltros: async (req, res) => {
    let pagina = req.query.pagina;
    let filtro = req.query.filtro;

    try {
      let quantidadeDeStatus = await Status.find({
        "$or": [
          { "nome": { $regex: `${filtro}`, '$options': 'i' } },
          { "descricao": { $regex: `${filtro}`, '$options': 'i' } }
        ]
      }).countDocuments();

      const status = await Status.find({
        "$or": [
          { "nome": { $regex: `${filtro}`, '$options': 'i' } },
          { "descricao": { $regex: `${filtro}`, '$options': 'i' } }
        ]
      })
        .sort({ nome: 1 })
        .skip(quantidadeDeConversaPorPagina * (pagina - 1))
        .limit(quantidadeDeConversaPorPagina);

      res.status(200).json({ status, quantidadeDeStatus });
    } catch (err) {
      log.error('** Erro na lista status com filtros **');
      log.error(`** Erro: ${err} **`);
      res.status(500).json();
    }
  }

}