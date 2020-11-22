const Predefinidas = require('./msgs-predefinidas.model');

const quantidadeDeConversaPorPagina = 10;

module.exports = {

  adiciona: async (req, res) => {
    const { titulo } = req.body;
    const verifica = await Predefinidas.find({ titulo });
    if (verifica.length > 0) {
      res.status(400).json('título já existe');
    } else {
      await Predefinidas.create(req.body);
      res.status(202).json('ok');
    }
  },

  lista: async (req, res) => {
    const predefinidas = await Predefinidas.find().sort({ tipo: 1, titulo: 1 });
    /* .aggregate([
      {
        $group: {
          _id: "$tipo",
          mensagens: { $push: "$$ROOT"}
        }
      },
      {
        $sort: { titulo: 1 }
      }
    ]) */

    res.status(200).json(predefinidas);
  },

  edita: async (req, res) => {
    await Predefinidas.findByIdAndUpdate(req.params.id, req.body);
    res.status(200).json('ok');
  },

  deleta: async (req, res) => {
    await Predefinidas.findByIdAndDelete(req.params.id);
    res.status(200).json('');
  },

  listaComFiltros: async (req, res) => {
    let pagina = req.query.pagina;
    let filtro = req.query.filtro;

    try {
      let quantidadeDeMsgsPredefinidas = await Predefinidas.find({
        "$or": [
          { "titulo": { $regex: `${filtro}`, '$options': 'i' } },
          { "mensagem": { $regex: `${filtro}`, '$options': 'i' } },
          { "tipo": { $regex: `${filtro}`, '$options': 'i' } }
        ]
      })
        .countDocuments();

      const msgsPredefinidas = await Predefinidas.find({
        "$or": [
          { "titulo": { $regex: `${filtro}`, '$options': 'i' } },
          { "mensagem": { $regex: `${filtro}`, '$options': 'i' } },
          { "tipo": { $regex: `${filtro}`, '$options': 'i' } }
        ]
      })
        .sort({ tipo: 1, titulo: 1 })
        .skip(quantidadeDeConversaPorPagina * (pagina - 1))
        .limit(quantidadeDeConversaPorPagina);

      res.status(200).json({ msgsPredefinidas, quantidadeDeMsgsPredefinidas });
    } catch (err) {
      console.log("Erro na lista msgsPredefinidas com filtros:", err);
      res.status(500).json();
    }
  },

  buscaPorId: async (req, res) => {
    const predefinida = await Predefinidas.findById(req.params.id);
    res.status(200).json(predefinida);
  }

}
