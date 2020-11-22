const config = require('config');
const log = require('../api/util/logs')
const User = require('../api/user/user-model');
module.exports = (url) => {

    const mongoose = require('mongoose');

    mongoose.connect(`mongodb://${config.get('database_mongo_ip')}/flexchat`, { useNewUrlParser: true }); //Testa ajuste: { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }

    mongoose.connection.on('connected', function () {
        log.success(' ==> Conectado ao MongoDB com sucesso <== ');
    });

    mongoose.connection.on('error', function (error) {
        log.error(' ** Erro ao conectar ao MongoDB ** ')
        log.error(' ** Erro: ' + error + ' ** ')
    });

    mongoose.connection.on('disconnected', function () {
        log.success(' ==> Desconectado com sucesso do MongoDB <==');
    });
}