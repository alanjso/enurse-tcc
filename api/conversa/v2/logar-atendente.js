const log = require('../../util/logs');
const redis = require('../../../config/database-redis-config');
const eventEmit = require('../../util/eventEmmiter');

module.exports = (atendenteID) => {
  redis.lrange('atendentes_logados', 0, -1, (err, reply) => {
    if (err) {
      log.error('** Error no socket login_do_atendente **');
      log.error(`** Erro: ${err} **`);
      return;
    }

    let flagAtendenteLogado = false;
    log.log('========= Atendentes Logados =========');
    eventEmit.emit('send_monit_adm', {});
    reply.forEach(atendente => {
      log.log(`atendenteID: ${atendente}`);
      if (atendente == atendenteID) {
        flagAtendenteLogado = true;
      }
    });
    log.log('======================================');
    if (!flagAtendenteLogado) {
      redis.lpush('atendentes_logados', atendenteID, () => {
        log.success(` ==> O Atendente ${atendenteID} Logou`);

      });
    } else {
      log.log('Atendente ja está logado');
    }
  });
}