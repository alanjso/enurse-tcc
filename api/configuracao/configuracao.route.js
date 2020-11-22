const configuracao = require('./configuracao.service');
const mime = require('mime');
const crypto = require('crypto');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        crypto.pseudoRandomBytes(16, function (err, raw) {
            if (req.query.local === 'home') {
                cb(null, 'logohome.' + mime.getExtension(file.mimetype));
            } else if (req.query.local === 'mini') {
                cb(null, 'logomini.' + mime.getExtension(file.mimetype));
            } else if (req.query.local === 'chat') {
                cb(null, 'logochat.' + mime.getExtension(file.mimetype));
            } else if (req.query.local === 'profilepic') {
                cb(null, 'profilepic.' + mime.getExtension(file.mimetype));
            } else {
                console.log('TIPO DE LOGO NÃO ESPECIFICADA');
                cb(null, 'logo.' + mime.getExtension(file.mimetype));
            }
        });
    }
});
const upload = multer({ storage: storage });

module.exports = server => {

    const SERVICE = '/configuracao/api'

    server.get(`/usaFlexia`, configuracao.usaFlexia);

    server.get(`${SERVICE}`, configuracao.lista);

    server.post(`${SERVICE}`, configuracao.adiciona);

    server.get(`${SERVICE}/get/logo/mini`, configuracao.getLogoMini);

    server.post(`${SERVICE}/upload/logo/mini`, upload.any(), configuracao.uploadLogoMini);

    server.get(`${SERVICE}/get/logo/home`, configuracao.getLogoHome);

    server.post(`${SERVICE}/upload/logo/home`, upload.any(), configuracao.uploadLogoHome);

    server.get(`${SERVICE}/get/logo/chat`, configuracao.getLogoChat);

    server.post(`${SERVICE}/upload/logo/chat`, upload.any(), configuracao.uploadLogoChat);

    server.get(`${SERVICE}/get/chat/profilepic`, configuracao.getProfilePic);

    server.post(`${SERVICE}/upload/chat/profilepic`, upload.any(), configuracao.uploadProfilePic);

    server.put(`${SERVICE}/:id`, configuracao.edita);

    server.get(`${SERVICE}/busca/:id`, configuracao.buscaPorId);

    server.delete(`${SERVICE}/:id`, configuracao.deleta);

    server.get(`${SERVICE}/horariofuncionamento`, configuracao.buscaHorarioAtendimento);

    // server.put(`${SERVICE}/horariofuncionamento/:id`,configuracao.configuraHorarioAtendimento);
}