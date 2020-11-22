const rp = require('request-promise-native');
const config = require('config');
const dateFns = require('date-fns');
const { getDateFormatted } = require('../../../api/util/date-util');

module.exports = {
    getAgendaConsultas: async (parametros) => {
        try {
            console.log('Parametros getAgendaConsultas: ', parametros);

            let isSameMonth = dateFns.isSameMonth(parametros.dataInicio, parametros.dataFinal);
            let respostaMes1 = {};
            let agendas = [];

            let urlMes1 = `${config.get('baseUrlPronutrir')}/api/v1/AgendaConsultas/filtroDataConsulta/${encodeURIComponent(parametros.medico.nM_GUERRA)}?`;

            if (isSameMonth == true) {

                if (parametros.dataInicio) { urlMes1 = urlMes1 + `dataInicio=${parametros.dataInicio}&`; }
                if (parametros.dataFinal) { urlMes1 = urlMes1 + `dataFinal=${parametros.dataFinal}&`; }
                if (parametros.pagina) { urlMes1 = urlMes1 + `pagina=${parametros.pagina}`; }

                respostaMes1 = await rp({
                    method: 'GET',
                    uri: urlMes1,
                    encoding: "utf-8",
                    json: true,
                    headers: {
                        Authorization: `Bearer ${parametros.token}`,
                        // Connection: 'keep-alive',
                    }
                });

                if (respostaMes1.result.length > 0) {
                    agendas = respostaMes1.result;
                }

            } else {

                if (parametros.dataInicio) { urlMes1 = urlMes1 + `dataInicio=${parametros.dataInicio}&`; }
                if (parametros.dataFinal) {
                    let fimMes = dateFns.format(dateFns.endOfMonth(parametros.dataInicio), "YYYY/MM/DD HH:mm:ss");
                    console.log('Fim do 1 mês: ', fimMes);
                    urlMes1 = urlMes1 + `dataFinal=${fimMes}&`;
                }
                if (parametros.pagina) { urlMes1 = urlMes1 + `pagina=${parametros.pagina}`; }

                respostaMes1 = await rp({
                    method: 'GET',
                    uri: urlMes1,
                    encoding: "utf-8",
                    json: true,
                    headers: {
                        Authorization: `Bearer ${parametros.token}`,
                        // Connection: 'keep-alive',
                    }
                });

                if (respostaMes1.result.length > 0) {
                    console.log('Chegou no mes 1');
                    agendas = respostaMes1.result;
                    console.log('Tamanho mes 1: ', agendas.length);
                }

                let urlMes2 = `${config.get('baseUrlPronutrir')}/api/v1/AgendaConsultas/filtroDataConsulta/${encodeURIComponent(parametros.medico.nM_GUERRA)}?`;

                if (parametros.dataInicio) {
                    let comecoMes = dateFns.format(dateFns.startOfMonth(parametros.dataFinal, "YYYY/MM/DD HH:mm:ss"));
                    console.log('Começo mes: ', comecoMes);
                    urlMes2 = urlMes2 + `dataInicio=${comecoMes}&`;
                }
                if (parametros.dataFinal) { urlMes2 = urlMes2 + `dataFinal=${parametros.dataFinal}`; }

                let respostaMes2 = await rp({
                    method: 'GET',
                    uri: urlMes2,
                    encoding: "utf-8",
                    json: true,
                    headers: {
                        Authorization: `Bearer ${parametros.token}`,
                        // Connection: 'keep-alive',
                    }
                });

                if (respostaMes2.result.length > 0) {
                    agendas = agendas.concat(respostaMes2.result);
                }

            }

            let apenas_datas = [];

            if (agendas.length > 0) {
                console.log(`================================>>>>>>>>>>> Achou ${agendas.length} resultados!`);
                agendas.forEach((agenda, index) => {
                    // Data formatada DD/MM/YYYY HH:mm
                    agendas[index].data_formatada = getDateFormatted(agendas[index].dT_AGENDA, "DD/MM/YYYY HH:mm");

                    // Array apenas com as datas
                    if (index == 0) {
                        apenas_datas.push(getDateFormatted(agendas[index].dT_AGENDA, "DD/MM/YYYY"));
                    } else {
                        let data_teste = getDateFormatted(agendas[index].dT_AGENDA, "DD/MM/YYYY");
                        if (data_teste != apenas_datas[apenas_datas.length - 1]) {
                            apenas_datas.push(data_teste);
                        }
                    }
                });
                console.log('Apenas as datas:\n', apenas_datas);
            }

            return { result: agendas, apenas_datas };
        } catch (error) {
            console.log('Error in getAgendaConsultas');
            console.log(error);
            return error;
        }
    },
}