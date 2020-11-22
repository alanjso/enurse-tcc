const Produto = require('./produto.model');

const quantidadeDeConversaPorPagina = 10;

module.exports = {

  lista: async (req, res) => {
    const produtos = await Produto.find().sort({ nome: 1 });
    res.status(200).json(produtos);
  },

  listaComFiltros: async (req, res) => {
    let pagina = req.query.pagina;
    let filtro = req.query.filtro;

    try{
      let quantidadeDeProdutos = await Produto.find({              
        "$or":[
            {"nome": {$regex: `${filtro}`, '$options': 'i'}},
            {"descricao": {$regex: `${filtro}`, '$options': 'i'}}
        ]}).countDocuments();

            const produtos = await Produto.find({              
                "$or":[
                    {"nome": {$regex: `${filtro}`, '$options': 'i'}},
                    {"descricao": {$regex: `${filtro}`, '$options': 'i'}}
                ]})
                .skip(quantidadeDeConversaPorPagina * (pagina - 1))
                .limit(quantidadeDeConversaPorPagina)
                .sort({ nome: 1});

        res.status(200).json({produtos, quantidadeDeProdutos});
    }catch(err){
        console.log("Erro na lista assuntos com filtros:", err);
        res.status(500).json();
    }
  },

  adiciona: async (req, res) => {
    await Produto.create(req.body);
    res.status(201).json('ok');
  },

  edita: async (req, res) => {
    await Produto.findByIdAndUpdate(req.params.id, req.body);
    res.status(200).json('');
  },

  buscaPorId: async (req, res) => {
    const produto = await Produto.findById(req.params.id);
    res.status(200).json(produto);
  },

  deleta: async (req, res) => {
    await Produto.findByIdAndDelete(req.params.id);
    res.status(200).json('');
  }

}