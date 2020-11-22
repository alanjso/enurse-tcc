const rp = require('request-promise-native');
const config = require('config');

module.exports = {
    getConveniosFiltrados: async (parametros) => {
        try {
            console.log('Médico escolhido: ', parametros.medico);
            const { result } = await rp({
                method: 'GET',
                uri: `${config.get('baseUrlPronutrir')}/api/v1/Convenios/filtroConvenioGeral`,
                encoding: "utf-8",
                qs: { nomeGuerraMedico: parametros.medico.nM_GUERRA, estabelecimento: parametros.medico.cD_ESTABELECIMENTO },
                json: true,
                headers: {
                    Authorization: `Bearer ${parametros.token}`,
                    // Connection: 'keep-alive',
                }
            });
            console.log(`Convenio 0: ${result[0].dS_CONVENIO}`);
            return result;
        } catch (error) {
            console.log('Error in getConvenios');
            console.log(error);
            return error;
        }
    },
}