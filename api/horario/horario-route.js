const horarioService = require('./horario-service');

module.exports = server => {
    /*
        Funcionalidade: Seta horario de atendimento.
        Quem usa: flex-channel.
    */
    server.post('/set/atendimento/horario', horarioService.setHorarioAtendimento);

    /*
        Funcionalidade: Pega horario de atendimento.
        Quem usa: flex-channel.
    */
    server.get('/get/atendimento/horario', horarioService.getHorarioAtendimento);
}