const crypto = require('crypto');
const mime = require('mime');
let rp = require('request-promise-native');
const fs = require('fs');

const createNameFile = () => new Promise((resolve, reject) => {
    crypto.pseudoRandomBytes(16, function (err, raw) { resolve(raw.toString('hex') + Date.now()) })
})

const requestFile = (uri, type, origem) => new Promise((resolve, reject) => {
    rp({
        method: 'GET',
        uri: uri,
        encoding: "binary",
        resolveWithFullResponse: true,
        headers: {
            "Content-type": origem === "whatsapp" ? "" : "multipart/form-data"
        }

    }).then(async function (response) {
        let arquivo = ''
        arquivo = await createNameFile();
        let writeStream = fs.createWriteStream(`uploads/${arquivo}.${type}`);
        writeStream.write(response.body, 'binary');
        writeStream.end();
        resolve(`${arquivo}.${type}`)
    }).catch(err => {
        console.log('Erro em baixar midia: ', err);
    })
})

module.exports = requestFile;