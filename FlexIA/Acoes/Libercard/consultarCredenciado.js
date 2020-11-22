const rp = require('request-promise-native');
const config = require('config');
const { encoderLibercard } = require('./encoderLibercard');

module.exports = {
    consultarCredenciado: async (parametros) => {
        try {
            console.log('Consulta Credenciado Params:  ', parametros);

            const response = await rp({
                uri: `${config.get('baseUrlLibercard')}/g4f_ws_consultaCredenciado.php`,
                method: 'POST',
                json: true,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                formData: {
                    codigo: encoderLibercard(parametros.codigo)
                }
            });
            console.log(`Response `, response);
            return response;
        } catch (error) {
            console.log('Error in consultarCredenciado');
            console.log(error);
            return error;
        }
    },
}