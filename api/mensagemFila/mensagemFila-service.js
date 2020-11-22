const MensagemFila = require('./mensagemFila-model');

module.exports = {

  lista: async (req, res) => {
    try {
      const mensagemFila = await MensagemFila.find();
      res.status(200).json(mensagemFila);
    } catch (error) {
      console.log('Erro ao listar mensagemFila');
      console.log(error)
      res.status(500).json({ error });
    }
  },

  adiciona: async (req, res) => {
    try {
      await MensagemFila.create(req.body);
      res.status(202).json({ msg: 'Mensagem Fila criado com sucesso' });
    } catch (error) {
      console.log('Erro ao adicionar mensagemFila');
      console.log(error)
      res.status(500).json({ error });
    }
  },

  edita: async (req, res) => {
    try {
      await MensagemFila.findByIdAndUpdate(req.params.id, req.body);
      res.status(200).json({ msg: 'Mensagem Fila atualizado com sucesso' });
    } catch (error) {
      console.log('Erro ao editar mensagemFila');
      console.log(error)
      res.status(500).json({ error });
    }
  },

  buscaPorId: async (req, res) => {
    try {
      const mensagemFila = await MensagemFila.findById(req.params.id);
      res.status(200).json(mensagemFila);
    } catch (error) {
      console.log('Erro ao buscar mensagemFila por id');
      console.log(error)
      res.status(500).json({ error });
    }
  },

  buscapPorFila: async (req, res) => {
    try {
      const mensagensFila = await MensagemFila.find({ 'filas.nome': req.params.fila });
      res.status(200).json({ mensagens: mensagensFila });
    } catch (error) {
      console.log('Erro ao buscar mensagemFila por id');
      console.log(error)
      res.status(500).json({ error });
    }
  },

  deleta: async (req, res) => {
    try {
      const { id } = req.params;
      await MensagemFila.findByIdAndDelete(id);
      res.status(200).json({ msg: 'Mensagem Fila removido com sucesso' });
    } catch (error) {
      console.log('Erro ao deletar mensagemFila');
      console.log(error)
      res.status(500).json({ error });
    }
  },
}