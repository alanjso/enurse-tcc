var autenticacaoService = require('./autenticacao-service');

module.exports = server => {

    server.post('/login', autenticacaoService.login);

    server.post('/logout', autenticacaoService.logout);

    server.post('/verificaSenha', autenticacaoService.verificaSenha);
    
}