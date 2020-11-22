const rp = require('request-promise-native');
const config = require('config');

module.exports = {
    getValorParticular: async (parametros) => {
        try {
            console.log('medico Consulta particular: ', parametros.medico.nM_GUERRA);
            const { result } = await rp({
                method: 'GET',
                uri: `${config.get('baseUrlPronutrir')}/api/v1/Convenios/filtroConvenioParticular/${encodeURIComponent(parametros.medico.nM_GUERRA)}`,
                encoding: "utf-8",
                json: true,
                headers: {
                    Authorization: `Bearer ${parametros.token}`,
                    // Connection: 'keep-alive',
                }
            });
            console.log(`Particular 0:`, result[0]);
            return result;
        } catch (error) {
            console.log('Error in getValorParticular');
            console.log(error);
            return error;
        }
    },
}