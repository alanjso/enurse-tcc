const mqtt = require('mqtt')
const subscribeTopic = 'tcc2Alan/enurse/sinaisVitais';
const eventEmmit = require('./eventEmmiter')

let client = mqtt.connect({ host: 'broker.hivemq.com', port: 1883 })

client.on('connect', function () {
    client.subscribe(subscribeTopic, function (err) {
        if (!err) {
            client.publish(subscribeTopic, "Conectado ao HiveMQ Broker", { qos: 1, retain: true });
        } else {
            console.log(`Erro subscribe ${subscribeTopic}`);
        }
    });

    client.subscribe(`${subscribeTopic}/frequenciaCardiaca`, function (err) {
        if (!err) {
            console.log(`Sucesso no subscribe ${subscribeTopic}/frequenciaCardiaca`)
        } else {
            console.log(`Erro subscribe ${subscribeTopic}/frequenciaCardiaca`);
        }
    });

    client.subscribe(`${subscribeTopic}/saturacaoOxigênio`, function (err) {
        if (!err) {
            console.log(`Sucesso no subscribe ${subscribeTopic}/saturacaoOxigênio`)
        } else {
            console.log(`Erro subscribe ${subscribeTopic}/saturacaoOxigênio`);
        }
    });


    client.subscribe(`${subscribeTopic}/temperatura`, function (err) {
        if (!err) {
            console.log(`Sucesso no subscribe ${subscribeTopic}/temperatura`)
        } else {
            console.log(`Erro subscribe ${subscribeTopic}/temperatura`);
        }
    });


    client.subscribe(`${subscribeTopic}/fluxoRespiratorio`, function (err) {
        if (!err) {
            console.log(`Sucesso no subscribe ${subscribeTopic}/fluxoRespiratorio`)
        } else {
            console.log(`Erro subscribe ${subscribeTopic}/fluxoRespiratorio`);
        }
    });


    client.subscribe(`${subscribeTopic}/sudorese`, function (err) {
        if (!err) {
            console.log(`Sucesso no subscribe ${subscribeTopic}/sudorese`)
        } else {
            console.log(`Erro subscribe ${subscribeTopic}/sudorese`);
        }
    });
});

client.on('message', function (topic, message) {

    console.log(`Topic: ${topic}\nMessage: ${message.toString()}`);

    if (topic == `${subscribeTopic}/frequenciaCardiaca`) {
        eventEmmit.emit('atualizar_sinaisVitais', message.toString(), 'frequenciaCardiaca');
    } else if (topic == `${subscribeTopic}/saturacaoOxigênio`) {
        eventEmmit.emit('atualizar_sinaisVitais', message.toString(), 'saturacaoOxigênio');
    } else if (topic == `${subscribeTopic}/temperatura`) {
        eventEmmit.emit('atualizar_sinaisVitais', message.toString(), 'temperatura');
    } else if (topic == `${subscribeTopic}/fluxoRespiratorio`) {
        eventEmmit.emit('atualizar_sinaisVitais', message.toString(), 'fluxoRespiratorio');
    } else if (topic == `${subscribeTopic}/sudorese`) {
        eventEmmit.emit('atualizar_sinaisVitais', message.toString(), 'sudorese');
    } else if (message.toString() == 'client.end()') {
        console.log('Vamos desconectar');
        client.publish(subscribeTopic, "Desconectando do HiveMQ Broker", { qos: 1, retain: true });
        client.end()
    }
});

eventEmmit.on('tts', async (tts) => {
    client.publish(`${subscribeTopic}/tts`, tts, { qos: 1, retain: true });
});

// Frequência Cardíaca
// Saturação de Oxigênio
// Temperatura
// Fluxo Respiratório
// Sudorese