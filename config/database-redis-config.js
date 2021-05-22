// const redis = require('redis');
const config = require('config');
const log = require('../api/util/logs');

let client = {}; // redis.createClient('6379', `${config.get('database_redis_ip')}`);

// client.on('connect', function () {
//     log.success(' ==> Client Redis Conectado com sucesso <==');
// });

// client.on('error', function (err) {
//     log.error('** Erro Client Redis **');
//     log.error(`** Erro: ${err} **`);
// });

// client.del('atendentes_logados',(err, reply) => {
//     log.log('Resetando variável atendentes_logados')
// });

module.exports = client;