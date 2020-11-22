let rp = require('request-promise-native');
const ConversaAtendimento = require('../conversa_atendimento.model');
const limpaCache = require('../../util/limpaCache');
const ConfigGeral = require('../../configuracao/configuracao.model');

async function disconnect(event, io, socket) {
    console.log(`Disconnect event: ${event}`);
    let conversa = await ConversaAtendimento.findOne({ 'id_socket_cliente': socket.id });
    try {
        if (conversa) {
            if (conversa.isMobile == false) { // isMobile == false então é atendimento web
                if (conversa.situacao == 'nao_atendida' || conversa.situacao == 'transferida' || conversa.atendimentoBot == true) {
                    conversa.situacao = 'abandonada';
                    conversa.observacao = 'cliente abandonou conversa na fila';
                    conversa.encerrada_por = 'CLIENTE';
                    conversa.timeline.push({
                        atividade: 'abandonada',
                        descricao: 'Conversa abandonada pelo cliente na fila'
                    });
                    conversa.encerrada = true;
                    conversa.hora_fim_conversa = new Date();

                    const conversaAtendimento = await ConversaAtendimento.findOneAndUpdate({ _id: conversa._id }, conversa);
                    await limpaCache(conversaAtendimento._id);

                    // ----------------------Email de abandono-------------------------------------------------------
                    const config = await ConfigGeral.findOne();
                    const emailSender = config.email;
                    let textoAbandono = 'Você abandonou nossa conversa\n Se precisar, entre em contato novamente';
                    if (emailSender.habilitarEmailAoAbandonar) { //habilitarEmailAoAbandonar
                        await rp({
                            uri: 'http://flexia.g4flex.com.br:5555/enviaremail',
                            headers: {
                                'Content-type': 'application/json',
                            },
                            method: 'POST',
                            body: {
                                hostSMTP: emailSender.hostSMTP,
                                address: emailSender.address,
                                sendFrom: emailSender.sendFrom ? emailSender.sendFrom : '',
                                password: emailSender.password,
                                name: emailSender.name,
                                emailTo: conversa.cliente.email ? conversa.cliente.email : '',
                                subject: 'Abandono Atendimento',
                                text: emailSender.textoAbandono ? emailSender.textoAbandono : textoAbandono,
                                html: emailSender.htmlAbandono ? emailSender.htmlAbandono : ''
                            },
                            json: true
                        });
                    }
                    // ----------------------------------------------------------------------------------------------
                    // socket.emit('remover_conversa_abandonada', conversa._id);
                    io.emit('conversa_encerrada', { id: conversa._id, nome: conversa.cliente.nome });
                    io.emit('atualizar_pagina_administrador');
                    io.emit('conversa_abandonada_cliente', { id: conversa._id, nome: conversa.cliente.nome });
                    //eventEmit.emit('send_monit_adm', {});
                } else if (conversa.situacao == 'em_atendimento') {
                    // O que fazer nessa situação?
                    console.log(`Cliente recarregou a página durante atendimento web. ID: ${conversa._id}`);
                } else if (conversa.situacao == 'encerrada') {
                    // Atendimento encerrado pelo atendente ou bot, não fazer nada
                }
            } else if (conversa.isMobile == true) {
                // Por enquanto não fazer nada no transport close se for mobile
                // TODO: Estratégia no conect para clientes com mesmo email
                console.log(`------------------------------------------------------------------------`);
                console.log(`Pagina recarregada no celular`);
                console.log(`${conversa.plataforma}`);
                console.log(`${conversa.navegador}`);
                console.log(`------------------------------------------------------------------------`);
                if (conversa.situacao == 'nao_atendida' || conversa.situacao == 'transferida' || conversa.atendimentoBot) {
                    // O que fazer nessa situação?
                } else if (conversa.situacao == 'em_atendimento') {
                    // O que fazer nessa situação?
                } else if (conversa.situacao == 'encerrada') {
                    // Atendimento encerrado pelo atendente ou bot, não fazer nada
                }
                // conversa.situacao = 'encerrada';
                // conversa.observacao = 'cliente fechou a conversa antes do atendente encerrar';
                // conversa.fechou_janela = true;
                // conversa.encerrada_por = 'ATENDENTE';
                // conversa.timeline.push({
                //     atividade: 'encerrada',
                //     descricao: 'Conversa encerrada durante atendimento'
                // });

                //INICIO
                //conversa.encerrada = true;
                //conversa.hora_fim_conversa = new Date();

                // const conversaAtendimento = await ConversaAtendimento.findOneAndUpdate({ _id: conversa._id }, conversa);
                // modificação para transferir a chamada que estava na coleção de chamadas atendidas para chamadas encerradas [nossa maneira de fazer cache com mongo]
                // await limpaCache(conversaAtendimento._id);

                // socket.emit('remover_conversa_abandonada', conversa._id);
                // io.emit('conversa_encerrada', { id: conversa._id, nome: conversa.cliente.nome });
                // io.emit('atualizar_pagina_administrador');
                // io.emit('cliente_fechou_a_janela_em_atendimento', { nome: conversa.cliente.nome, id: conversa._id });
                //FIM
            }

        } else {
            // Sem conversa ativa ou atendente fechando janela
        }
    } catch (error) {
        log.error(`*** Erro ao desconectar conversa***`);
        log.error(`*** Erro: ${error} ***`);
    }
}
module.exports = disconnect;