const log = require('../../../api/util/logs');
const TrataAcoes = require('../TrataAcoes');
const ConversaAtendimento = require("../../../api/conversa/conversa_atendimento.model");
const rp = require('request-promise-native');
const { getMedicos } = require('./getMedicos');
const { getConveniosFiltrados } = require('./getConveniosFiltrados');
const { getToken } = require('./getToken');
const { getValorParticular } = require('./getValorParticular');
const { getAgendaConsultas } = require('./getAgendaConsultas');
const { getPessoaFisica } = require('./getPessoaFisica');
const { putAgendarConsulta } = require('./putAgendarConsulta');
const { getPlanosFiltrados } = require('./getPlanosFiltrados');
const { putTelefonePessoaFisica } = require('./putTelefonePessoaFisica');
const { postPessoaFisica } = require('./postPessoaFisica');
const { getHorariosData } = require('./getHorariosData');

class AcaoPronutrir extends TrataAcoes {
    constructor() {
        super();
    }

    setSucessor(sucessor) {
        this.sucessor = sucessor;
    }

    async trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem) {
        log.log('Passou na Action: pronutrir');
        try {

            if (acao === 'pronutrir') {
                log.success(` ==> Entrou na Action: pronutrir <==`);
                const parametros = responseFlexIA.output.user_defined.actions[0].parameters;

                let resposta = {
                    erro: true
                };
                console.log(`Esteve aqui as: ${new Date()} para fazer ${parametros.function}`);
                if (parametros.function == 'getToken') {
                    resposta.token = await getToken();
                    if (resposta.token) {
                        resposta.erro = false;
                        console.log(resposta.token);
                    }
                } else if (parametros.function == 'getMedicos') {
                    resposta.nr_medicos = 0;
                    resposta.medicos = await getMedicos(parametros);
                    if (resposta.medicos.length > 0) {
                        resposta.nr_medicos = resposta.medicos.length;
                        resposta.erro = false;
                    }
                    console.log(resposta.nr_medicos);
                    console.log(resposta.erro);
                } else if (parametros.function == 'getConveniosFiltrados') {
                    resposta.nr_convenios = 0;
                    resposta.erro = true;
                    resposta.convenios = await getConveniosFiltrados(parametros);
                    if (resposta.convenios.length > 0) {
                        resposta.nr_convenios = resposta.convenios.length;
                        resposta.erro = false;
                    }
                    console.log(resposta.nr_convenios);
                    console.log(resposta.erro);
                } else if (parametros.function == 'getPlanosFiltrados') {
                    resposta.nr_planos = 0;
                    let result = await getPlanosFiltrados(parametros);
                    resposta.planos = result.Lista;
                    if (resposta.planos) {
                        if (resposta.planos.length > 0) {
                            resposta.nr_planos = result.Cont;
                            resposta.erro = false;
                        }
                    }
                    console.log(resposta.nr_planos);
                    console.log(resposta.erro);
                } else if (parametros.function == 'getValorParticular') {
                    resposta.atendeParticular = false;
                    resposta.particular = await getValorParticular(parametros);
                    if (resposta.particular.length > 0) {
                        resposta.vl_medico = resposta.particular[0].vL_MEDICO;
                        resposta.atendeParticular = true;
                        resposta.erro = false;
                    }
                    console.log(resposta.vl_medico);
                    console.log(resposta.atendeParticular);
                    console.log(resposta.erro);
                } else if (parametros.function == 'getAgendaConsultas') {
                    resposta.nr_datas = 0;

                    let resultados = await getAgendaConsultas(parametros);
                    resposta.agendas = resultados.result;
                    resposta.apenas_datas = resultados.apenas_datas;

                    if (resposta.agendas.length > 0) {
                        resposta.nr_datas = resposta.apenas_datas.length;
                        resposta.erro = false;
                        console.log(resposta.erro);
                    }
                } else if (parametros.function == 'getHorariosData') {
                    resposta.nr_horarios = 0;
                    resposta.horarios = await getHorariosData(parametros);
                    if (resposta.horarios.length > 0) {
                        resposta.nr_horarios = resposta.horarios.length;
                        resposta.erro = false;
                        console.log(resposta.erro);
                    }
                } else if (parametros.function == 'getPessoaFisica') {
                    resposta.nr_pacientes = 0;
                    resposta.paciente = await getPessoaFisica(parametros);
                    if (resposta.paciente) {
                        // resposta.paciente = resposta.resultados[1];
                        // resposta.pessoaFisica = resposta.resultados[0];
                        resposta.nr_pacientes = 1;
                        resposta.erro = false;
                    }
                    console.log('Numero pacientes: ', resposta.nr_pacientes);
                    console.log('Erro: ', resposta.erro);
                } else if (parametros.function == 'postPessoaFisica') {
                    resposta.paciente_criado = await postPessoaFisica(parametros);
                    if (resposta.paciente_criado != null) {
                        resposta.erro = false;
                    }
                    console.log('Erro Criar Paciente: ', resposta.erro);
                } else if (parametros.function == 'putTelefonePessoaFisica') {
                    resposta.update_paciente = await putTelefonePessoaFisica(parametros);
                    if (resposta.update_paciente != null) {
                        resposta.erro = false;
                    }
                    console.log('Erro Put Telefone: ', resposta.erro);
                } else if (parametros.function == 'putAgendarConsulta') {
                    resposta.consultaMarcada = await putAgendarConsulta(parametros);
                    if (resposta.consultaMarcada != null) {
                        resposta.erro = false;
                    }
                    console.log('Erro: ', resposta.erro);
                } else {
                    console.log(`Function ${parametros.function} não encontrada`);
                }

                let responseFlexIA2 = await flexIA_Assistente.enviarMensagem(origem, conversa.idSessao, '', { resposta });

                conversa = await flexIA_Assistente.insereNoModelConversa(conversa, responseFlexIA2, null, conversa.idSessao, resposta);
                await ConversaAtendimento.findByIdAndUpdate(conversa._id, conversa);

                responseFlexIA = await flexIA_Assistente.resolveAcao(responseFlexIA2, conversa, flexIA_Assistente, origem);

                return true;

            } else {
                return await this.sucessor.trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem);
            }
        } catch (error) {
            log.error('** Erro na Action: pronutrir **')
            log.error(`** Erro: ${error} **`);
        }
    }
}

module.exports = new AcaoPronutrir();