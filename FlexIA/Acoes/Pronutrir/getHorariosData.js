const config = require('config');
const { getDateFormatted } = require('../../../api/util/date-util');

module.exports = {
    getHorariosData: async (parametros) => {
        try {
            console.log('Horários para o dia: ', parametros.diaEscolhido);

            let apenas_horarios = [];
            let agendasConsultas = parametros.agendas

            if (agendasConsultas.length > 0) {
                agendasConsultas.forEach((agenda, index) => {
                    // Array apenas com os horarios
                    let data_teste = getDateFormatted(agendasConsultas[index].dT_AGENDA, "DD/MM/YYYY")
                    if (data_teste == parametros.diaEscolhido) {
                        apenas_horarios.push(getDateFormatted(agendasConsultas[index].dT_AGENDA, "HH:mm"));
                    }
                });
                console.log('Apenas as horarios:\n', apenas_horarios);
            }

            return apenas_horarios;
        } catch (error) {
            console.log('Error in getHorariosData');
            console.log(error);
            return error;
        }
    },
}