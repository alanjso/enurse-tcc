const Rijndael = require('rijndael-js');
const md5 = require('md5');

let cpfOuCnpj = '00000000000191'; // CNPJ OU CPF plainText
let expectations = 'qZa/8DRPMCJyfTg9h5ereOY3M2rzd5h24PxFHuRYSSQ=';

try {
  const encode = 'p@rc3iroLiberG4fl3x'; // ENCODE
  let key = md5(encode);
  let iv = md5(md5(encode))
  
  const cipher = new Rijndael(key, 'cbc');
  const ciphertext = Buffer.from(cipher.encrypt(cpfOuCnpj, 256, iv));
 
  console.log(ciphertext.toString("base64"));
  console.log(ciphertext.toString("base64")==expectations);

} catch (error) {

  console.log('Error in encoderLibercard');
  console.log(error);
  return error;
}