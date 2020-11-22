const rp = require('request-promise-native');

/**
 * trocar resposta por 'resposta'
 */

const SMSFunctions = {

    login(user, password) {
        const options = {
            method: 'POST',
            uri: 'http://10.8.8.201:5000/v1/sign_in',
            headers: {
                "Content-type": "application/json"
            },
            body: {
                "username": user,
                "password": password
            },
            json: true
        };

        return new Promise((resolve, reject) => {
            rp(options)
                .then((resposta) => {
                    if (resposta.status === '-1') {
                        reject(resposta.error);
                    } else {
                        resolve(resposta);
                    }
                })
                .catch((err) => reject(err));
        });
    },

    sendOneSMS(token, message, number) {
        const options = {
            method: 'POST',
            uri: 'http://10.8.8.201:5000/v1/avulso',
            headers: {
                "x-access-token": token,
                "Content-type": "application/json"
            },
            body: {
                "mensagem": message,
                "numero": number
            },
            json: true
        };

        return new Promise((resolve, reject) => {
            rp(options)
                .then((resposta) => {
                    if (resposta.status === '-1') {
                        reject(resposta.error);
                    } else if (resposta.status === '0') {
                        resolve(resposta.message);
                    }
                })
                .catch(err => reject(err));
        })
    },

    sendSMS(token, message, numbers) {
        numbers = numbers.map((number) => '021'+number)

        const options = {
            method: 'POST',
            uri: `http://10.8.8.201:5000/v1/lote`,
            headers: {
                "x-access-token": token,
                "Content-type": "application/json"
            },
            body: {
                "mensagem": message,
                "numeros": numbers
            },
            json: true
        }

        console.log(options)

        return new Promise((resolve, reject) => {
            rp(options)
                .then((resposta) => {
                    if(resposta.status === '-1') {
                        reject(resposta.error);
                    } else if (resposta.status === '0') {
                        resolve(resposta.message);
                    }
                })
                .catch(err => reject(err));
        })
    }
}

module.exports = SMSFunctions;
