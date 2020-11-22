const FraseModel = require('./frases.model');

module.exports = {

    cadastrarFrase: async (req, res) => {
        try {
            let frase = req.body;
            let result = await FraseModel.find({ texto: frase.texto });
            if( result[0] === undefined) {
                await FraseModel.create(frase);
            } else {
                throw new Error('Mensagem já existe');
            }
            res.status(201).json('ok');
        } catch(erro) {
            console.log(`Erro ao cadastrar frase: ${erro}`);
            res.status(500).json(`Erro interno do servidor ao cadastrar frase: ${erro.message}`);
        }
    },

    listarFrases: async (req, res) => {
        try {
            let frases = await FraseModel.find();
            res.status(200).json(frases);
        } catch(erro) {
            console.log(`Erro ao listar frases ${erro}`);
            res.status(500).json('Erro interno do servidor ao listar frases');
        }
    },

    deletarFrases: async (req, res) => {
        try {
            let id = req.params.id;
            await FraseModel.deleteOne({ _id: id });
            res.status(200).json('ok');
        } catch(erro) {
            console.log(`Erro ao listar frases ${erro}`);
            res.status(500).json('Erro interno do servidor ao deletar frases');
        }
    },

    atualizarFrase: async (req, res) => {
        try {
            let frase = req.body;
            let fraseAtualizada = '';

            let { ok } = await FraseModel.updateOne({ _id: frase.id }, { texto: frase.texto });
            if( ok ) {
                fraseAtualizada = req.body.texto;
            } else {
                throw new Error('Não foi possivel atualizar');
            }
            res.status(200).json(fraseAtualizada);
        } catch(erro) {
            console.log(`Erro ao atualizar a frase ${erro}`);
            res.status(500).json(`Erro interno do servidor ao atualizar frases: ${erro}`);
        }
    }

}