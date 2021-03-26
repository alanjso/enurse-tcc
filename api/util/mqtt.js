const mqtt = require('mqtt')
let client = mqtt.connect({ host: 'broker.hivemq.com', port: 1883 })

client.on('connect', function () {
    client.subscribe('enurse/tcc2Alan', function (err) {
        if (!err) {
            client.publish('enurse/tcc2Alan', "Conectado ao HiveMQ Broker", { qos: 1, retain: true });
        }
    })
})

client.on('message', function (topic, message) {
    // message is Buffer
    console.log(`Topic: ${topic}\nMessage: ${message.toString()}`);
    if (message.toString() == 'client.end()') {
        console.log('Vamos desconectar');
        client.publish('enurse/tcc2Alan', "Desconectando do HiveMQ Broker", { qos: 1, retain: true });
        client.end()
    }
})