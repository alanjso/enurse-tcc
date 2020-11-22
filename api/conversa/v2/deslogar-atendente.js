const redis = require('../../../config/database-redis-config');
const log = require('../../util/logs');

module.exports = (atendenteID) => {
  redis.lrange('atendentes_logados', 0, -1, (err, reply) => {
    if (err) {
      log.error('** Error no socket logout_do_atendente **');
      log.error(`** Erro: ${err} **`);
      return;
    }
    let flagAtendenteLogado = false;
    log.log('========= Atendentes Logados =========');
    reply.forEach(atendente => {
      log.log(`atendenteID: ${atendente}`);
      if (atendente == atendenteID) {
        flagAtendenteLogado = true;
      }
    });
    log.log('======================================');
    if (flagAtendenteLogado) {
      redis.lrem('atendentes_logados', 0, atendenteID, (error, reply) => {
        if (reply != 0) console.log(`O Atendente ${atendenteID} Deslogou`)
      });
    } else {
      // console.log(`O Atendente ${atendenteID} não está logado`)
    }
  });
}