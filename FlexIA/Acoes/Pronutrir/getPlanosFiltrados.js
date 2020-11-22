const rp = require('request-promise-native');
const config = require('config');

module.exports = {
    getPlanosFiltrados: async (parametros) => {
        try {
            console.log('Página: ', parametros.pagina);
            console.log('convenio escolhido: ', parametros.convenioEscolhido);
            const { result } = await rp({
                method: 'GET',
                uri: `${config.get('baseUrlPronutrir')}/api/v1/Convenios/ListarConveniosComPlanos?codigoConvenio=${parametros.convenioEscolhido.cD_CONVENIO}`,
                qs: { nomePlano: parametros.ds_plano, pagina: parametros.pagina },
                encoding: "utf-8",
                json: true,
                headers: {
                    Authorization: `Bearer ${parametros.token}`,
                    // Connection: 'keep-alive',
                }
            });
            console.log('Quantidade de planos: ', result.Cont);
            console.log(`Plano 0: `, result.Lista[0]);
            return result;
        } catch (error) {
            console.log('Error in getPlanosFiltrados');
            console.log(error);
            return error;
        }
    },
}