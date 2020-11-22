const Setor = require('./setor.model');
const yup = require('yup');

const quantidadeDeConversaPorPagina = 10;

module.exports = {

  lista: async (req, res) => {
    const setores = await Setor.find().sort({ nome: 1 });
    res.status(200).json(setores);
  },

  listaComFiltros: async (req, res) => {
    let pagina = req.query.pagina;
    let filtro = req.query.filtro;

    try{
      let quantidadeDeSetores = await Setor.find({              
        "$or":[
            {"nome": {$regex: `${filtro}`, '$options': 'i'}},
            {"descricao": {$regex: `${filtro}`, '$options': 'i'}}
        ]}).countDocuments();

            const setores = await Setor.find({              
                "$or":[
                    {"nome": {$regex: `${filtro}`, '$options': 'i'}},
                    {"descricao": {$regex: `${filtro}`, '$options': 'i'}}
                ]})
                .skip(quantidadeDeConversaPorPagina * (pagina - 1))
                .limit(quantidadeDeConversaPorPagina)
                .sort({ nome: 1});

        res.status(200).json({setores, quantidadeDeSetores});
    }catch(err){
       // console.log("Erro na lista setores com filtros:", err);
        res.status(500).json();
    }
},

  adiciona: async (req, res) => {

    const { nome } = req.body

    let schema = yup.object().shape({
      nome: yup.string().required(),
      descricao: yup.string().required()
    });
    
    if(!(await schema.isValid(req.body))){
      return res.status(400).json({ error: 'Validation fails' });
    }
    
    const setorExists = await Setor.findOne({nome});

    if(setorExists){
      return res.status(400).json({error: 'Setor já existe'});
    }

    await Setor.create(req.body);
    
    res.status(202).json('ok');
  },

  edita: async (req, res) => {
    await Setor.findByIdAndUpdate(req.params.id, req.body);
    res.status(200).json('');
  },

  buscaPorId: async (req, res) => {
    const setor = await Setor.findById(req.params.id);
    res.status(200).json(setor);
  },

  deleta: async (req, res) => {

    const { id } = req.params;

    const setorExiste = await Setor.findById(id);

    if(!setorExiste){
      return res.status(404).json({err: 'Setor não existe'});
    }

    await Setor.findByIdAndDelete(id);
    res.status(200).json({msg: 'Setor removido com sucesso'});
  }

}