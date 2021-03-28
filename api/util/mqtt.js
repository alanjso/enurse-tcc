const mqtt = require('mqtt')
const subscribeTopic = 'tcc2Alan/enurse/sinaisVitais';
const eventEmmit = require('./eventEmmiter')

let client = mqtt.connect({ host: 'broker.hivemq.com', port: 1883 })

client.on('connect', function () {
    client.subscribe(subscribeTopic, function (err) {
        if (!err) {
            client.publish(subscribeTopic, "Conectado ao HiveMQ Broker", { qos: 1, retain: true });
        } else {
            console.log(`Erro subscribe `)
        }
    });
});

client.on('message', function (topic, message) {

    console.log(`Topic: ${topic}\nMessage: ${message.toString()}`);
    if (topic == subscribeTopic && message.toString() != "Conectado ao HiveMQ Broker") {
        eventEmmit.emit('atualizar_sinaisVitais', message.toString());
    } else if (message.toString() == 'client.end()') {
        console.log('Vamos desconectar');
        client.publish(subscribeTopic, "Desconectando do HiveMQ Broker", { qos: 1, retain: true });
        client.end()
    }
});