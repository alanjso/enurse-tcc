const log = require('../../api/util/logs')
const TrataAcoes = require("./TrataAcoes");
const ConversaAtendimento = require("../../api/conversa/conversa_atendimento.model");
const ClienteApodi = require('../../api/clientes apodi/clientesapodi.model');

class AcaoConsultaClienteApodi extends TrataAcoes {
    constructor() {
        super();
    }

    setSucessor(sucessor) {
        this.sucessor = sucessor;
    }

    async trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem) {
        log.log('Passou na Action: consultaClienteApodi');
        try {

            if (acao === 'consultaClienteApodi') {
                log.success(` ==> Entrou na Action: consultaClienteApodi <==`);

                let varContext = {};
                let codigo = responseFlexIA.output.user_defined.actions[0].parameters.codCliente;
                let clienteApodi = await ClienteApodi.findOne({ "CODIGO": codigo });

                if (clienteApodi) {
                    varContext.CODIGO = clienteApodi.CODIGO;
                    varContext.CNPJ = clienteApodi.CNPJ;
                    varContext.NOME = clienteApodi.NOME;
                    varContext.ENDERECO = clienteApodi.ENDERECO;
                    varContext.BAIRRO = clienteApodi.BAIRRO;
                    varContext.CIDADE = clienteApodi.CIDADE;
                    varContext.UF = clienteApodi.UF;
                    varContext.FONE1 = clienteApodi.FONE1;
                    varContext.FONE2 = clienteApodi.FONE2;
                    varContext.EMAIL1 = clienteApodi.EMAIL1;
                    varContext.EMAIL2 = clienteApodi.EMAIL2;
                    varContext.EMAIL = clienteApodi.EMAIL;
                    varContext.encontrado = true;
                } else {
                    varContext.encontrado = false;
                }

                let responseFlexIA2 = await flexIA_Assistente.enviarMensagem(origem, conversa.idSessao, '', varContext);

                conversa = await flexIA_Assistente.insereNoModelConversa(conversa, responseFlexIA2, null, conversa.idSessao, varContext);
                await ConversaAtendimento.findByIdAndUpdate(conversa._id, conversa);

                responseFlexIA = await flexIA_Assistente.resolveAcao(responseFlexIA2, conversa, flexIA_Assistente, origem);

                return true;

            } else {
                return await this.sucessor.trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem);
            }
        } catch (error) {
            log.error('** Erro na Action: consultaClienteApodi **')
            log.error(`** Erro: ${error} **`);
        }
    }
}

module.exports = new AcaoConsultaClienteApodi();