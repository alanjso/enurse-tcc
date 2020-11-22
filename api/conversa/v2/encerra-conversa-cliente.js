const ConversaAtendimento = require('../conversa_atendimento.model');
const eventEmit = require('../../util/eventEmmiter');
const limpaCache = require('../../util/limpaCache');

async function encerraConversaCliente(msg) {
    console.log('##### encerra_conversa_cliente ##### ', msg.idDaConversa);

    const conversa = await ConversaAtendimento.findById(msg.idDaConversa);

    //console.log(conversa);

    if (conversa.atendimentoBot) {
        await ConversaAtendimento.findOneAndUpdate({ _id: msg.idDaConversa }, {
            $set: {
                    encerrada: true,
                    atendida: true,
                    encerrada_por: "CLIENTE",
                    situacao: "encerrada",
                    observacao: 'Cliente encerrou a conversa',
                    hora_fim_conversa: new Date(),
                    timeline: []
                }
            });
            eventEmit.emit('send_monit_adm', {});
            await limpaCache(msg.idDaConversa);
    } else {
        await ConversaAtendimento.findOneAndUpdate({ _id: msg.idDaConversa }, {
            $set: {
                    encerrada: true,
                    atendida: true,
                    encerrada_por: "CLIENTE",
                    situacao: "encerrada",
                    observacao: 'Cliente encerrou a conversa',
                    hora_fim_conversa: new Date(),
                    timeline: []
                }
            });
            eventEmit.emit('send_monit_adm', {});
            await limpaCache(msg.idDaConversa);
    }
} 

module.exports = encerraConversaCliente;