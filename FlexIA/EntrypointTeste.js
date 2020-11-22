var FlexIA = require('./Assistente');

async function main() {
  try {

    let idSessao = await FlexIA.iniciarSessao();
    
    let conversa = await FlexIA.iniciarConversa(idSessao);

    // conversa.output.generic.forEach((mensagem) => {
    //   if(mensagem.response_type === 'text') {
    //     console.log(mensagem.text);
    //   } else if (mensagem.response_type == 'option') {
    //     mensagem.options.forEach((mensagemOption) => {
    //       console.log(mensagemOption.label);
    //     })
    //   }
    // });

    console.log(conversa/*.output.generic[2].options[0].value*/);

    // let respostaFlexIA = await FlexIA.enviarMensagem(idSessao, `Suporte`);

    // console.log(respostaFlexIA.output);

    await FlexIA.encerrarSessao(idSessao);

  } catch(err) {
    console.log(`ERRO-HTTP-${err.code}: ${err.message}`);
  } finally {
    console.log('Sempre roda');
  }
}

main();
