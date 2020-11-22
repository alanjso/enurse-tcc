const ConversaAtendimento = require('../conversa_atendimento.model');
const log = require('../../util/logs');
const eventEmit = require('../../util/eventEmmiter');

module.exports = async (event) => {
  try {
    await ConversaAtendimento.findByIdAndUpdate(event.idDaConversa,
      {
        $set: { id_socket_cliente: event.socket_id }
      });
    eventEmit.emit('send_monit_adm', {});
  } catch (error) {
    log.error('** Error no socket on iniciar_conversa_flexia **');
    log.error(`** Erro: ${error} **`);
  }
}