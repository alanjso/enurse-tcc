const historicoService = require('./historico-service');

module.exports = server => {
  const SERVICE = '/historico'
  /*
      Funcionalidade: Retorna array com as conversas de um determinado contato.
      Quem usa: flex-channel.
    */
  server.get(`${SERVICE}/cliente/:id`, historicoService.arrayConversas);
  /*
      Funcionalidade: Retorna um array de IDs de conversa para paginação de histórico
      Quem usa: flex-channel.
    */
  server.get(`${SERVICE}/paginacao/conversa/:idContato`, historicoService.arrayIdsConversas);

  /*
      Funcionalidade: Retorna uma conversa baseada no ID
      Quem usa: flex-channel.
    */
  server.get(`${SERVICE}/conversa/:id`, historicoService.buscaConversaId);
};
