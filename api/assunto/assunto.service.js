const emitter = require('events').EventEmitter;
const log = require('../util/logs');
const Assunto = require('./assunto.model');
const Conversa = require("../conversa/conversa.model");
const yup = require('yup');
const quantidadeDeConversaPorPagina = 10;

const eventEmit = new emitter();

eventEmit.on('atualizaConversaAssunto', async (assunto, assuntoNovo) => {
  try {
    await Conversa.updateMany({ assunto: assunto }, { $set: { assunto: assuntoNovo } });
  } catch (error) {
    log.error(error)
  }
})

module.exports = {

  lista: async (req, res) => {
    const assuntos = await Assunto.find().sort({ nome: 1 });
    res.status(200).json(assuntos);
  },

  listaComFiltros: async (req, res) => {
    let pagina = req.query.pagina;
    let filtro = req.query.filtro;

    try {
      let quantidadeDeAssuntos = await Assunto.find({
        "$or": [
          { "nome": { $regex: `${filtro}`, '$options': 'i' } },
          { "descricao": { $regex: `${filtro}`, '$options': 'i' } }
        ]
      })
        .countDocuments()

      const assuntos = await Assunto.find({
        "$or": [
          { "nome": { $regex: `${filtro}`, '$options': 'i' } },
          { "descricao": { $regex: `${filtro}`, '$options': 'i' } }
        ]
      })
        .sort({ nome: 1 })
        .skip(quantidadeDeConversaPorPagina * (pagina - 1))
        .limit(quantidadeDeConversaPorPagina);

      res.status(200).json({ assuntos, quantidadeDeAssuntos });
    } catch (err) {
      log.error('** Erro na lista assuntos com filtros **');
      log.error(`** Erro: ${err} **`)
      res.status(500).json();
    }
  },

  adiciona: async (req, res) => {

    const schema = yup.object().shape({
      nome: yup.string().required(),
      descricao: yup.string().required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const assuntoExists = await Assunto.findOne({ nome: req.body.nome });

    if (assuntoExists) {
      //console.log(assuntoExists)
      return res.status(400).json({ error: 'Assunto já existe' });
    }

    const assunto = await Assunto.create(req.body);
    res.status(202).json(assunto);
  },

  edita: async (req, res) => {
    try {
      const assuntoExists = await Assunto.findOne({ _id: { $ne: req.params.id }, nome: req.body.nome });

      if (assuntoExists) {
        //console.log(assuntoExists)
        return res.status(400).json({ error: 'Assunto já existe' });
      }

      let assunto = await Assunto.findById(req.params.id);
      await Assunto.findByIdAndUpdate(req.params.id, req.body);
      if (assunto.nome != req.body.nome) eventEmit.emit('atualizaConversaAssunto', assunto.nome, req.body.nome);
      res.status(200).json("");
    } catch (error) {
      log.error('** Erro no update do assunto **');
      log.error(`** Erro: ${error} **`);
      res.status(500).json();
    }
  },

  buscaPorId: async (req, res) => {
    const assunto = await Assunto.findById(req.params.id);
    res.status(200).json(assunto);
  },

  deleta: async (req, res) => {
    await Assunto.findByIdAndDelete(req.params.id);
    res.status(200).json('');
  }

}