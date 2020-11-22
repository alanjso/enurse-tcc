const RelatorioPausa = require('./relatorioPausa-model');
const User = require('../user/user-model');

module.exports = {

    lista: async (req, res) => {
        try {
            const relatorioPausa = await RelatorioPausa.find();
            res.status(200).json(relatorioPausa);
        } catch (error) {
            console.log('Erro ao listar relatorioPausa');
            console.log(error)
            res.status(500).json({ error });
        }
    },

    adiciona: async (req, res) => {
        try {
            await RelatorioPausa.create(req.body);
            res.status(202).json({ msg: 'relatorioPausa criado com sucesso' });
        } catch (error) {
            console.log('Erro ao adicionar relatorioPausa');
            console.log(error)
            res.status(500).json({ error });
        }
    },

    edita: async (req, res) => {
        try {
            await RelatorioPausa.findByIdAndUpdate(req.params.id, req.body);
            res.status(200).json({ msg: 'relatorioPausa atualizado com sucesso' });
        } catch (error) {
            console.log('Erro ao editar relatorioPausa');
            console.log(error)
            res.status(500).json({ error });
        }
    },

    buscaPorId: async (req, res) => {
        try {
            const relatorioPausa = await RelatorioPausa.findById(req.params.id);
            res.status(200).json(relatorioPausa);
        } catch (error) {
            console.log('Erro ao buscar relatorioPausa por id');
            console.log(error)
            res.status(500).json({ error });
        }
    },

    deleta: async (req, res) => {
        try {
            const { id } = req.params;
            await RelatorioPausa.findByIdAndDelete(id);
            res.status(200).json({ msg: 'relatorio Pausa removido com sucesso' });
        } catch (error) {
            console.log('Erro ao deletar relatorioPausa');
            console.log(error)
            res.status(500).json({ error });
        }
    },

    listaPausasAbertas: async (req, res) => {
        try {
            const relatorioPausa = await RelatorioPausa.find({ isClosed: false });
            res.status(200).json(relatorioPausa);
        } catch (error) {
            console.log('Erro ao listar relatorioPausa aberta');
            console.log(error)
            res.status(500).json({ error });
        }
    },

    iniciarPausa: async (req, res) => {
        try {
            await RelatorioPausa.create({
                tipoPausa: {
                    _id: req.body.idPausa,
                    nome: req.body.nomePausa
                },
                usuario: {
                    _id: req.body.idUser,
                    nome: req.body.nomeUser
                },
            });

            await User.findByIdAndUpdate(req.body.idUser, {
                $set: {
                    isPaused: true,
                    tipoPausa: req.body.tipoPausa,
                }
            });
            res.status(200).json({ msg: `${req.body.nomeUser} entrou em pausa: ${req.body.nomePausa}` });
        } catch (error) {
            console.log(`Erro ao criar iniciar pausa`);
            console.log(error)
            res.status(500).json({ error });
        }
    },

    encerrarPausa: async (req, res) => {
        try {
            await RelatorioPausa.findOneAndUpdate(
                { 'tipoPausa._id': req.params.idPausa, 'usuario._id': req.params.idUser, isClosed: false }, {
                $set: {
                    encerramento_pausa: new Date(),
                    isClosed: true
                }
            });

            await User.findByIdAndUpdate(req.params.idUser, {
                $set: {
                    isPaused: false,
                    tipoPausa: '',
                }
            });
            res.status(200).json({ msg: `pausa encerrada com sucesso` });
        } catch (error) {
            console.log(`Erro ao encerrar pausa`);
            console.log(error)
            res.status(500).json({ error });
        }
    },
}