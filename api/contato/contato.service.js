const log = require('../util/logs')
const Contato = require('./contato.model');

const quantidadeDeContatosPorPagina = 10;

module.exports = {

    lista: async (req, res) => {
        const contatos = await Contato.find().sort({ nome: 1 });
        res.status(200).json(contatos);
    },

    listaComFiltros: async (req, res) => {
        let pagina = req.query.pagina;
        let filtro = req.query.filtro;


        try {
            let quantidadeDeContatos = await Contato.find({
                "$or": [
                    { "nome": { $regex: `${filtro}`, '$options': 'i' } },
                    { "email": { $regex: `${filtro}`, '$options': 'i' } },
                    { "celular": { $regex: `${filtro}`, '$options': 'i' } },
                    { "cpf": { $regex: `${filtro}`, '$options': 'i' } },
                    { "rg": { $regex: `${filtro}`, '$options': 'i' } },
                    { "cnpj": { $regex: `${filtro}`, '$options': 'i' } },
                    { "data_nascimento": { $regex: `${filtro}`, '$options': 'i' } }
                ]
            })
                .countDocuments();

            const contatos = await Contato.find({
                "$or": [
                    { "nome": { $regex: `${filtro}`, '$options': 'i' } },
                    { "email": { $regex: `${filtro}`, '$options': 'i' } },
                    { "celular": { $regex: `${filtro}`, '$options': 'i' } },
                    { "cpf": { $regex: `${filtro}`, '$options': 'i' } },
                    { "rg": { $regex: `${filtro}`, '$options': 'i' } },
                    { "cnpj": { $regex: `${filtro}`, '$options': 'i' } },
                    { "data_nascimento": { $regex: `${filtro}`, '$options': 'i' } }
                ]
            })
                .sort({ nome: 1 })
                .skip(quantidadeDeContatosPorPagina * (pagina - 1))
                .limit(quantidadeDeContatosPorPagina);

            res.status(200).json({ contatos, quantidadeDeContatos });
        } catch (err) {
            log.error(' ** Erro na lista com filtros **')
            log.error(` ** Erro: ${err} **`)
            res.status(500).json();
        }
    },

    adiciona: async (req, res) => {
        let contato = await Contato.create(req.body);
        //console.log('CONTADO ADICIONADO: { returnNewDocument: true } ', contato);
        res.status(202).json(contato);
    },

    edita: async (req, res) => {
        let contato = await Contato.findByIdAndUpdate(req.params.id, req.body, { returnNewDocument: true });
        //console.log('EDITADO; ', contato);
        res.status(200).json(contato);
    },

    buscaPorId: async (req, res) => {
        const contato = await Contato.findById(req.params.id);
        res.status(200).json(contato);
    },

    buscaPorEmail: async (req, res) => {
        let contato = await Contato.find({ "email": { $regex: `${req.params.email}`, "$options": "i" } });
        res.status(200).json(contato);
    },

    deleta: async (req, res) => {
        await Contato.findByIdAndDelete(req.params.id);
        res.status(200).json('');
    }

}