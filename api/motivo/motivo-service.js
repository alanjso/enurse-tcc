const Motivo = require('./motivo-model');
const yup = require('yup');

const quantidadeDeConversaPorPagina = 10;

module.exports = {

  lista: async (req, res) => {
    const motivos = await Motivo.find().lean();
    res.status(200).json(motivos);
  },

  adiciona: async (req, res) => {

    let schema = yup.object().shape({
      nome: yup.string().required(),
      descricao: yup.string().required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    await Motivo.create(req.body);

    res.status(202).json({ msg: 'Motivo criado com sucesso' });
  },

  edita: async (req, res) => {
    await Motivo.findByIdAndUpdate(req.params.id, req.body);
    res.status(200).json({ msg: 'Motivo atualizado com sucesso' });
  },

  buscaPorId: async (req, res) => {
    console.log('################ BUSCANDO MOTIVO POR ID');
    const motivo = await Motivo.findById(req.params.id).lean();
    res.status(200).json(motivo);
  },

  deleta: async (req, res) => {

    console.log('############ DELETANDO MOTIVO ########################');

    const { id } = req.params;

    const motivoExiste = await Motivo.findById(id);

    if (!motivoExiste) {
      return res.status(404).json({ err: 'Motivo não existe' });
    }

    await Motivo.findByIdAndDelete(id);
    res.status(200).json({ msg: 'Motivo removido com sucesso' });
  },
  
}