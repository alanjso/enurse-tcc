var jwt = require("jsonwebtoken");

const secret = "l*7hA7h1#@h12hj7Qj12";

let request = 0;

function autenticacaoMiddleware(req, res, next) {
  //console.log("Time:", Date.now(), req.url);
  console.log('Token: ',req.headers["x-access-token"]);
  console.log(req.url);

  if(req.path.includes('/login')){
    return next();
  }

  if(req.path.includes('socket')){
    console.log('socket passou');
    return next();
  }

  verificaToken(req,res,next);
  //next();
}

async function verificaToken(req, res, next) {
  var token = await req.headers["x-access-token"];

  if (!token) {
    return res.status(401).json({data: "Não autenticado"});
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err)
      return res
        .status(401)
        .send({ auth: false, message: "Falha ao autênticar o token." });

    console.log('#################### DECODED ####################')
    console.log(decoded);

    req.nomeDoUsuario = decoded.nome;

    next();
  });
}

module.exports = autenticacaoMiddleware;
