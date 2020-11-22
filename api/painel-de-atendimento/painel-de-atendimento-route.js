module.exports = server => {

  const SERVICE = '/paineldeatendimento';

  server.post(`${SERVICE}/logar`);

  server.post(`${SERVICE}/entrarempausa`);

  server.post(`${SERVICE}/sairdapausa`);

  server.post(`${SERVICE}/deslogar`)

  server.get(`${SERVICE}/situacaodoagente`);
}