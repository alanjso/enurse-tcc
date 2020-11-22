const CrudPausa = require('./crudPausa-model');

module.exports = {

  lista: async (req, res) => {
    try {
      const crudPausa = await CrudPausa.find();
      res.status(200).json(crudPausa);
    } catch (error) {
      console.log('Erro ao listar crudPausa');
      console.log(error)
      res.status(500).json({ error });
    }
  },

  adiciona: async (req, res) => {
    try {
      await CrudPausa.create(req.body);
      res.status(202).json({ msg: 'Crud Pausa criado com sucesso' });
    } catch (error) {
      console.log('Erro ao adicionar crudPausa');
      console.log(error)
      res.status(500).json({ error });
    }
  },

  edita: async (req, res) => {
    try {
      await CrudPausa.findByIdAndUpdate(req.params.id, req.body);
      res.status(200).json({ msg: 'Crud Pausa atualizado com sucesso' });
    } catch (error) {
      console.log('Erro ao editar crudPausa');
      console.log(error)
      res.status(500).json({ error });
    }
  },

  buscaPorId: async (req, res) => {
    try {
      const crudPausa = await CrudPausa.findById(req.params.id);
      res.status(200).json(crudPausa);
    } catch (error) {
      console.log('Erro ao buscar crudPausa por id');
      console.log(error)
      res.status(500).json({ error });
    }
  },

  deleta: async (req, res) => {
    try {
      const { id } = req.params;
      await CrudPausa.findByIdAndDelete(id);
      res.status(200).json({ msg: 'crud Pausa removido com sucesso' });
    } catch (error) {
      console.log('Erro ao deletar crudPausa');
      console.log(error)
      res.status(500).json({ error });
    }
  },
}