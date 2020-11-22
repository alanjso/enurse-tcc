const usuarioService = require('./user-service');
const mime = require('mime');
const crypto = require('crypto');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        crypto.pseudoRandomBytes(16, function (err, raw) {
            cb(null, `${req.params.id}.` + mime.getExtension(file.mimetype));
        });
    }
});
const upload = multer({ storage: storage });

module.exports = server => {

    const SERVICE = '/user'

    server.get(`${SERVICE}`, usuarioService.list);

    server.get(`${SERVICE}/get/userprofilepic/:id`, usuarioService.getUserProfilePic);

    server.post(`${SERVICE}/upload/userprofilepic/:id`, upload.any(), usuarioService.uploadUserProfilePic);

    server.get(`/usuarios/busca/filtrados`, usuarioService.listaComFiltros);

    server.post(`${SERVICE}`, usuarioService.save);

    server.put(`${SERVICE}/:id`, usuarioService.update);

    server.post(`${SERVICE}/changePassword`, usuarioService.changePassword);

    server.post(`${SERVICE}/resetPassword`, usuarioService.resetPassword);

    server.delete(`${SERVICE}/:id`, usuarioService.remove);

    server.get(`${SERVICE}/:id`, usuarioService.findById);
}