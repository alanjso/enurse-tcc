const Empresa = require('./empresa.model');

module.exports = {

  lista: async (req, res) => {
    const empresas = await Empresa.find();
    res.status(200).json(empresas);
  },

  adiciona: async (req, res) => {
    await Empresa.create(req.body);
    res.status(202).json('ok');
  },

  edita: async (req, res) => {
    await Empresa.findByIdAndUpdate(req.params.id, req.body);
    res.status(200).json('');
  },

  buscaPorId: async (req, res) => {
    const empresa = await Empresa.findById(req.params.id);
    res.status(200).json(empresa);
  },

  deleta: async (req, res) => {
    await Empresa.findByIdAndDelete(req.params.id);
    res.status(200).json('');
  }

}