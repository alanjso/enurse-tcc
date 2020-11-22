const ConversaEmAtendimento = require('../conversa_atendimento.model');

module.exports =  (email, socketId) => new Promise(async (resolve, reject) => {
  
  console.log('##### Atualiza socketId do cliente #####');
  
  
  try {
    
    const query = {
      'cliente.email': email,
    };
    
    // let conversa = await ConversaEmAtendimento.findOne(query);
    
    await ConversaEmAtendimento.updateOne(query, {
      $set: {
        id_socket_cliente: socketId,
      }
    });

    resolve();
  } catch (err) {
    reject(err);
  }
});