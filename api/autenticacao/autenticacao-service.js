const log = require('../util/logs')
var jwt = require("jsonwebtoken");
const Usuario = require("../user/user-model");
//const bcrypt = require('bcrypt');

const secret = "l*7hA7h1#@h12hj7Qj12";

module.exports = {
  login: async (req, res) => {
    const usuario = req.body;
    var usuarioDB = await Usuario.findOne({ email: req.body.email });

    if (usuarioDB) {
      let senhaHash = usuarioDB.senha;
      try {
        if (usuarioDB.userAtivo) {
          if (senhaHash === req.body.senha) {
            var token = jwt.sign(
              {
                nome: usuarioDB.nome,
                tipo: usuarioDB.tipoDeUsuario,
                email: usuarioDB.email,
                idDoUSuario: usuarioDB.id
              },
              secret,
              {
                expiresIn: 28000
              }
            );

            res.status(200).send({
              id: usuarioDB._id,
              nome: usuarioDB.nome,
              filasDoUsuario: usuarioDB.filas,
              token: token,
              tipoDeUsuario: usuarioDB.tipoDeUsuario,
              ramal: usuarioDB.ramal,
              codigoDoAgente: usuarioDB.codigoDoAgente,
              darkMode: usuarioDB.darkMode,
              isPaused: usuarioDB.isPaused,
              tipoPausa: usuarioDB.tipoPausa,
            });
            log.log(usuarioDB);
            return;
          } else {
            res.status(401).send({ auth: false, message: "Usuário ou senha inválidos" });
            return;
          }
        } else {
          res.status(401).send({ auth: false, message: "Usuário Desabilitado" });
          return;
        }
      } catch (err) {
        log.error(err);
      }
      // });
    } else {
      res.status(401).send({ auth: false, message: "Email invalido." });
    }
  },

  verificaToken: async (req, res, next) => {
    var token = await req.headers["x-access-token"];
    if (!token)
      return res
        .status(401)
        .send({ auth: false, message: "Não foram providos tokens." });

    jwt.verify(token, secret, (err, decoded) => {
      if (err)
        return res
          .status(500)
          .send({ auth: false, message: "Falha ao autênticar o token." });

      req.usuarioId = decoded.id;
      next();
    });
  },

  verificaSenha: async (req, res) => {
    try {
      var usuario = await Usuario.findById(req.body.id);
      let senhaHash = usuario.senha;

      // bcrypt.compare(req.body.senha, senhaHash, (err, match) => {
      if (match) {
        res.status(200).send({ correto: true });
      } else {
        log.log(
          `User requisição: ${req.body.senha}\n User do banco ${senhaHash}`
        );
        res.status(200).send({ correto: false });
      }
      // });
    } catch (err) {
      res.status(500).json();
    }
  },

  logout: (req, res) => {
    res.send(200).send({ auth: false, token: null });
  }
};
