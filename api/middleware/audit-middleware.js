const Log = require('../auditoria/auditoria-model');
var jwt = require("jsonwebtoken");

const secret = "l*7hA7h1#@h12hj7Qj12";

async function auditMiddleware(req,res,next) {
  console.log('SERVIÇO DE AUDITORIA: ',req.method);
  
  await Log.create({
    url: req.originalUrl,
    method: req.method,
    user: req.nomeDoUsuario
  });
  next(); 
}

module.exports = auditMiddleware;