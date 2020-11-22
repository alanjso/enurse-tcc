const log = require('../util/logs');
const SubMotivo = require('./sub-motivo.model');
const yup = require('yup');
const quantidadeDeConversaPorPagina = 10;

module.exports = {

  lista: async (req, res) => {
    const subMotivos = await SubMotivo.find().populate('motivo').sort({ nome: 1 });
    res.status(200).json(subMotivos);
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
    const subMotivo = await SubMotivo.create(req.body);
    res.status(202).json(subMotivo);
  },

  edita: async (req, res) => {
      await SubMotivo.findByIdAndUpdate(req.params.id, req.body);
      res.status(200).json("");
  },

  buscaPorId: async (req, res) => {
    const subMotivo = await SubMotivo.findById(req.params.id).populate('motivo');
    res.status(200).json(subMotivo);
  },

  deleta: async (req, res) => {
    await SubMotivo.findByIdAndDelete(req.params.id);
    res.status(200).json('');
  }

}