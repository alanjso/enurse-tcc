const rp = require('request-promise-native');
const config = require('config');

module.exports = {
    getMedicos: async (parametros) => {
        try {
            console.log(parametros.nome);
            const { result } = await rp({
                method: 'GET',
                uri: `${config.get('baseUrlPronutrir')}/api/v1/Medicos/filtro`,
                qs: { nome: parametros.nome, especialidade: parametros.especialidade, estabelecimento: parametros.unidadeEscolhida },
                encoding: "utf-8",
                json: true,
                headers: {
                    Authorization: `Bearer ${parametros.token}`,
                    // Connection: 'keep-alive',
                }
            });
            console.log(`Médico 0: `, result[0]);
            return result;
        } catch (error) {
            console.log('Error in getMedicos');
            console.log(error);
            return error;
        }
    },
}