class TrataAcoes {
  constructor() {}
  async trataAcao(){}
}

module.exports = TrataAcoes;

// Modelo de classes filhas - ultima classe chamada não chama sucessor
/*
const TrataAcoes = require("./TrataAcoes");
const Conversa = require("../../api/conversa/conversa.model");

class CLASSE extends TrataAcoes {
  constructor() {
    super();
  }

  setSucessor(sucessor) {
    this.sucessor = sucessor;
  }

  async trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem) {
    try {
      if( acao === 'VALOR' ) {

        // TO DO
        return true;

      } else {
        // return this.sucessor.trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem);
      }
    } catch(err) {
      console.log(`ERRO em CLASS: ${err}`);
    }
  }
}

module.exports = new CLASSE();
*/