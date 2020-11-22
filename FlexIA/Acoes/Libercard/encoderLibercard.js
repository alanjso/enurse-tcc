const Rijndael = require('rijndael-js');
const md5 = require('md5');

module.exports = {
    encoderLibercard: (codigo) => {
        try {
            let codigoApenasNumeros = codigo;
            console.log('Codigo Completo: ', codigo);
            codigoApenasNumeros = codigoApenasNumeros.replace(/\D+/g, '');
            console.log('Codigo Apenas Números: ', codigoApenasNumeros);

            const encode = 'p@rc3iroLiberG4fl3x'; // ENCODE
            let key = md5(encode);
            let iv = md5(md5(encode))

            const cipher = new Rijndael(key, 'cbc');
            const ciphertext = Buffer.from(cipher.encrypt(codigoApenasNumeros, 256, iv));

            return ciphertext.toString("base64");

        } catch (error) {
            console.log('Error in encoderLibercard');
            console.log(error);
            return error;
        }
    },
}