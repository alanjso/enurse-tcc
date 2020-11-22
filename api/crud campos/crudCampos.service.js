const log = require('../util/logs')
const CrudCampos = require('./crudCampos.model');

module.exports = {

    lista: async (req, res) => {
        const crudCampos = await CrudCampos.find().sort({ nome: 1 });
        res.status(200).json(crudCampos);
    },
    adiciona: async (req, res) => {
        let crudCampos = await CrudCampos.create(req.body);
       // console.log('CONTADO ADICIONADO: { returnNewDocument: true } ', crudCampos);
        res.status(202).json(crudCampos);
    },

    edita: async (req, res) => {
        let crudCampos = await CrudCampos.findByIdAndUpdate(req.params.id, req.body, { returnNewDocument: true });
        //console.log('EDITADO; ', crudCampos);
        res.status(200).json(crudCampos);
    },

    buscaPorId: async (req, res) => {
        const crudCampos = await CrudCampos.findById(req.params.id);
        res.status(200).json(crudCampos);
    },

    deleta: async (req, res) => {
        await CrudCampos.findByIdAndDelete(req.params.id);
        res.status(200).json('');
    }

}