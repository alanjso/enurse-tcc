const Usuario = require('./user-model');
//const bcrypt = require('bcrypt');
const crypto = require('crypto');
const amqp = require('amqplib/callback_api');
const yup = require('yup');
const config = require('config');
const quantidadeDeConversaPorPagina = 10;

module.exports = {

    save: async (req, res) => {

        const schema = yup.object().shape({
            nome: yup.string().required(),
            email: yup.string().required().email(),
            senha: yup.string().required()
        });

        if (!(await schema.isValid(req.body))) {
            return res.status(400).json({ error: 'Validation fails' });
        }

        const user = await Usuario.create(req.body);
        res.status(202).json(user);
    },

    list: async (req, res) => {
        //console.log('user');
        const usuarios = await Usuario.find().sort({ nome: 1 });
        res.status(200).json(usuarios);
    },

    listaComFiltros: async (req, res) => {
        let pagina = req.query.pagina;
        let filtro = req.query.filtro;

        try {
            let quantidadeDeUsuarios = await Usuario.find({
                "$or": [
                    { "nome": { $regex: `${filtro}`, '$options': 'i' } },
                    { "email": { $regex: `${filtro}`, '$options': 'i' } },
                    { "codigoDoAgente": { $regex: `${filtro}`, '$options': 'i' } },
                    { "ramal": { $regex: `${filtro}`, '$options': 'i' } }
                ]
            }).countDocuments();

            const usuarios = await Usuario.find({
                "$or": [
                    { "nome": { $regex: `${filtro}`, '$options': 'i' } },
                    { "email": { $regex: `${filtro}`, '$options': 'i' } },
                    { "codigoDoAgente": { $regex: `${filtro}`, '$options': 'i' } },
                    { "ramal": { $regex: `${filtro}`, '$options': 'i' } }
                ]
            })
                .skip(quantidadeDeConversaPorPagina * (pagina - 1))
                .limit(quantidadeDeConversaPorPagina)
                .sort({ nome: 1 });

            res.status(200).json({ usuarios, quantidadeDeUsuarios });
        } catch (err) {
            //("Erro na lista usuarios com filtros:", err);
            res.status(500).json();
        }
    },

    update: async (req, res) => {
        await Usuario.findByIdAndUpdate(req.params.id, req.body);
        res.status(200).json();
    },

    changePassword: async (req, res) => {
        // bcrypt.hash(req.body.senha, 3, async (err, hash) => {

        try {

            await Usuario.findByIdAndUpdate(req.body.id, { $set: { senha: req.body.senha, trocouSenha: true } });
            res.status(200).json();
        } catch (err) {
            //console.log(err);
            res.status(500).json();
        }
        // });
    },

    resetPassword: async (req, res) => {
        try {

            let senhaRandomica = crypto.randomBytes(4).toString('hex');
            let email = req.body.email;
            let usuarioDoBanco = {};
            let usuario;

            // bcrypt.hash(senhaRandomica, 3, async (err, hash) => {
            try {

                await Usuario.findOneAndUpdate({ email: email }, { $set: { senha: hash, trocouSenha: false } });
            } catch (err) {
                console.log(`Error no user-service -> resetPassword: ${err}`);
            }
            // });

            usuarioDoBanco = await Usuario.findOne({ email });

            //console.log(usuarioDoBanco);

            usuario = {
                nome: usuarioDoBanco.nome,
                email,
                senha: senhaRandomica
            };

            amqp.connect('amqp://localhost:5672', (err, conn) => {
                conn.createChannel((err, ch) => {
                    const queue = 'redefinicao';
                    const conteudo = JSON.stringify(usuario);
                    ch.assertQueue(queue, { durable: true });
                    ch.sendToQueue(queue, new Buffer(conteudo));
                });
            });

            res.status(200).json("Sucesso");
        } catch (err) {
            res.status(500).json(err);
        }
    },

    remove: async (req, res) => {
        const response = await Usuario.findByIdAndDelete(req.params.id);
        res.status(200).json(response);
    },

    findById: async (req, res) => {
        const user = await Usuario.findById(req.params.id);
        res.status(200).json(user);
    },

    getUserProfilePic: async (req, res) => {
        try {
            const user = await Usuario.findById(req.params.id);
            res.status(200).json(user.userProfilePic);
        } catch (error) {
            //console.log(`Erro no get user profile pic`);
            res.status(500).json(error);
        }
    },

    uploadUserProfilePic: async (req, res) => {
        const files = req.files;
        let fullPath = `${config.get("url_midia")}${files[0].filename}`;
        try {
            let user = await Usuario.findById(req.params.id);
            let update = user
            update.userProfilePic = fullPath;
            await Usuario.findByIdAndUpdate(user._id, update, { returnNewDocument: true })
            user = await Usuario.findById(req.params.id);
            res.status(200).json(user.userProfilePic);
        } catch (err) {
            res.status(500).json(err);
        }
    }
}