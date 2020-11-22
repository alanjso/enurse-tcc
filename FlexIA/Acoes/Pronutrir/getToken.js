const rp = require('request-promise-native');
const config = require('config');

module.exports = {
    getToken: async () => {
        try {
            console.log('Entrou pega token');
            const { token } = await rp({
                method: 'POST',
                uri: `${config.get('baseUrlPronutrir')}/api/v1/Auth/login`,
                encoding: "utf-8",
                json: true,
                body: {
                    "id": 2,
                    "username": "User@Externo#0110",
                    "password": "9ddsc001215600k",
                    "role": "default_g4flex"
                }
            });
            return token;
        } catch (error) {
            console.log('Error in getToken');
            console.log(error);
            return error;
        }
    },
}