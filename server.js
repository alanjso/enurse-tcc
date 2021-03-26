const fs = require('fs')
const log = require('./api/util/logs')
const server = require("./config/express-config");
const config = require("config");
const redisAdapter = require('socket.io-redis');
//const redis = require('./config/database-redis-config');
//const redis = require('socket.io-redis');
const eventEmit = require('./api/util/eventEmmiter');
require('./api/util/schedule');
require('./api/conversa/Telegram/conversa-telegram-service')();
require('./api/util/mqtt');

// var https = require('https').createServer({
//   key: fs.readFileSync('./certificados-ssl/flexchannel.key'),
//   cert: fs.readFileSync('./certificados-ssl/flexchannel.crt'),
//   ca: [
//     fs.readFileSync('./certificados-ssl/flexchannel_b.crt')
//   ]
// }, server);

var http = require('http').createServer(server);

let io = require('socket.io')(http);
// io.adapter(redisAdapter({ host: config.get('database_redis_ip'), port: 6379 }));
// io.set("transports", ["websocket"]);
io.set('heartbeat timeout', 4000000);
io.set('heartbeat interval', 2000000);
require('./api/conversa/v2/conversa-socket-service')(io);
// const asterisk = require('./api/asterisk/connections');

// https.listen(config.get("port"), () => {
//   log.success(' ==> Servidor HTTPS Rodando na Porta: ' + config.get("port"))
// });

http.listen(config.get("port_http"), () => {
  log.success(' ==> Servidor HTTP Rodando na Porta: ' + config.get("port_http"))
});

server.get("/api/health", (req, res) => {
  res.json({ message: 'Server up.' });
});

module.exports = server;


