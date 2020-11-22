const config = require('config');
const amqp = require('amqplib/callback_api');
let canal;
const log = require('../util/logs');

module.exports = {

  criarConexao: () => {
    amqp.connect(`amqp://${config.get('servidor-rabbitmq')}:5672`, (err, conn) => {
      if (err) {
        console.log(`Não foi possivel realizar conexão com servidor rabbitMQ`);
      } else {
        conn.createChannel((err, ch) => {
          if (err) {
            console.log(`Não foi possivel criar canal com servidor rabbitMQ`);
          } else {
            canal = ch;'Conectado ao rabbitMQ'
            log.success('==> Conectado ao rabbitMQ');
          }
        });
      }
    });
  },

  enviarParaFila: (objeto, fila) => {
    const conteudo = JSON.stringify(objeto);
    ch.assertQueue(fila, { durable: true });
    ch.sendToQueue(fila, new Buffer(conteudo));
  }

}

