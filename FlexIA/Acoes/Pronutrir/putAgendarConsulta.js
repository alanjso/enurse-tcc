const rp = require('request-promise-native');
const config = require('config');
const { getDateFormatted } = require('../../../api/util/date-util');

module.exports = {
    putAgendarConsulta: async (parametros) => {
        try {
            console.log(`Parametros agendar consulta: \n${JSON.stringify(parametros)}`);
            let body = {};
            // TO DO: filtrar agenda pela data e horario escolhido
            let agendas = parametros.agendas;
            agendas.forEach((agenda, index) => {
                // Array apenas com os horarios
                let data_teste = getDateFormatted(agendas[index].dT_AGENDA, "DD/MM/YYYY")
                let horario_teste = getDateFormatted(agendas[index].dT_AGENDA, "HH:mm");
                if (data_teste == parametros.diaEscolhido && horario_teste == parametros.horarioEscolhido) {
                    body = agendas[index];
                }
            });

            body.nM_PACIENTE = parametros.pacienteEscolhido.nM_PESSOA_FISICA;
            body.nR_TELEFONE_CELULAR = parametros.pacienteEscolhido.nR_TELEFONE_CELULAR;
            body.cD_PESSOA_FISICA = parametros.pacienteEscolhido.cD_PESSOA_FISICA;
            body.dT_NASCIMENTO_PAC = parametros.pacienteEscolhido.dT_NASCIMENTO;

            body.nM_USUARIO = "flexia";
            body.iE_STATUS_AGENDA = "N";
            body.iE_CLASSIF_AGENDA = "N";
            body.dT_ATUALIZACAO = new Date();

            body.cD_CONVENIO = parametros.planoEscolhido.cD_CONVENIO;
            body.cD_CATEGORIA = parametros.planoEscolhido.cD_CATEGORIA.toString();
            body.cD_PLANO = parametros.planoEscolhido.cD_PLANO;

            body.dS_PLANO = parametros.planoEscolhido.dS_PLANO;
            body.dS_CONVENIO = parametros.planoEscolhido.dS_CONVENIO;

            const respostaAgendamentoConsulta = await rp({
                method: 'PUT',
                uri: `${config.get('baseUrlPronutrir')}/api/v1/AgendaConsultas/${body.nR_SEQUENCIA}`,
                encoding: "utf-8",
                json: true,
                headers: {
                    Authorization: `Bearer ${parametros.token}`,
                    // Connection: 'keep-alive',
                },
                body
            });

            console.log(`Resposta Agendamento Consulta\n `, respostaAgendamentoConsulta);
            if (respostaAgendamentoConsulta.statusCode == 200) {
                let agendamento = respostaAgendamentoConsulta.result;
                agendamento.dT_AGENDA_FORMATADA = getDateFormatted(agendamento.dT_AGENDA, "DD/MM/YYYY HH:mm");
                return agendamento;
            } else {
                return null
            }
        } catch (error) {
            console.log('Error in putAgendarConsulta');
            console.log(error);
            return error;
        }
    },
}