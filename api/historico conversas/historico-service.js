const ConversaEncerrada = require('../conversa/conversa.model');

module.exports = {
    arrayConversas: async (req, res) => {
        try {
            let query = {
                'cliente._id': req.params.id,
                'situacao': { $in: ['encerrada', 'abandonada'] }
            };

            let conversas = await ConversaEncerrada.find(query);

            res.json(conversas);
        } catch (err) {
            console.log(`Erro em busca histórico`);
            console.log(`${err}`);
            res.status(500).json(err);
        }
    },

    arrayIdsConversas: async (req, res) => {
        try {
            let query = {};
            query["cliente._id"] = req.params.idContato

            let conversas = await ConversaEncerrada.find(query).select('_id')
            res.json(conversas);
        } catch (err) {
            res.status(500).json(err);
        }
    },

    buscaConversaId: async (req, res) => {
        try {
            let conversa = await ConversaEncerrada.findById({ _id: req.params.id });

            res.json(conversa);
        } catch (err) {
            res.status(500).json(err);
        }
    },
}