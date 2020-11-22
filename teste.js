const enviaImagem = require('./api/conversa/whatsapp/envia-imagem-whatsapp');

enviaImagem('https://flexia.g4flex.com.br/uploads/4816413fe805005d5618ec92e09f99891585672513158.jpeg', '558581516447', '558539240077').then(response => {
  console.log(response);
}).catch(err => {
  console.log(err);
});