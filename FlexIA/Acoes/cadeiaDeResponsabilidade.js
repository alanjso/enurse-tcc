const log = require('../../api/util/logs');

// Instancia todas as Ações
const AcaoTransferir = require('./AcaoTransferir');
const AcaoCadastroLead = require('./AcaoCadastroLead');
const AcaoCriarProtocolo = require('./AcaoCriarProtocolo');
const AcaoConsultaContato = require('./AcaoConsultaContato');
const AcaoConsultaTalks = require('./AcaoConsultaTalks');
const AcaoConsultaUsuarioSecreto = require('./AcaoConsultaUsuarioSecreto');
const AcaoConsultaTarefas = require('./AcaoConsultaTarefas');
const AcaoEncerrar = require('./AcaoEncerrar');
const AcaoConsultaClienteApodi = require('./AcaoConsultaClitenteApodi');
const AcaoEnviaToken = require('./AcaoEnviaToken');
const AcaoInscreveTalks = require('./AcaoInscreveTalks');
const Checkpoint = require('./Checkpoint');
const SucessoAtendimento = require('./AcaoSucessoBot');
const AcaoConsultaCNPJ = require('./AcaoConsultaCNPJ');
const AcaoConsultaValeGas = require('./AcaoConsultaValeGas');
const AcaoUnificaContato = require('./AcaoUnificaContato');
const AcaoEnviaEmail = require('./AcaoEnviaEmail');
const AcaoPronutrir = require('./Pronutrir/AcaoPronutrir');
const AcaoProcurarFarmacia = require('./PagueMenos/AcaoProcurarFarmacia');
const AcaoLibercard = require('./Libercard/AcaoLibercard');

module.exports = async function iniciaCadeiaDeResponsabilidade(acao, conversa, responseFlexIA, flexIA_Assistente, origem) {
  try {

    //1º Defina toda a cadeia antes de tratar a primeira ação. ULTIMA AÇÃO AQUI - encerrar
    AcaoTransferir.setSucessor(AcaoCadastroLead);
    AcaoCadastroLead.setSucessor(AcaoUnificaContato);
    AcaoUnificaContato.setSucessor(AcaoConsultaContato)
    AcaoConsultaContato.setSucessor(AcaoConsultaTalks);
    AcaoConsultaTalks.setSucessor(AcaoInscreveTalks);
    AcaoInscreveTalks.setSucessor(AcaoEnviaToken);
    AcaoEnviaToken.setSucessor(AcaoEnviaEmail);
    AcaoEnviaEmail.setSucessor(SucessoAtendimento);
    SucessoAtendimento.setSucessor(AcaoConsultaCNPJ);
    AcaoConsultaCNPJ.setSucessor(AcaoConsultaValeGas);
    AcaoConsultaValeGas.setSucessor(Checkpoint);
    Checkpoint.setSucessor(AcaoConsultaClienteApodi);
    AcaoConsultaClienteApodi.setSucessor(AcaoConsultaUsuarioSecreto);
    AcaoConsultaUsuarioSecreto.setSucessor(AcaoCriarProtocolo);
    AcaoCriarProtocolo.setSucessor(AcaoProcurarFarmacia);
    AcaoProcurarFarmacia.setSucessor(AcaoLibercard);
    AcaoLibercard.setSucessor(AcaoPronutrir);
    AcaoPronutrir.setSucessor(AcaoConsultaTarefas)
    AcaoConsultaTarefas.setSucessor(AcaoEncerrar);

    //Trate a primeira acao e espere o resultado.
    return await AcaoTransferir.trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem);

  } catch (err) {
    log.error('** Erro na Cadeia de Responsabilidade **');
    log.error(`** Erro: ${err} **`);
  }


}
