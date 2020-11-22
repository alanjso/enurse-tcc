const ConversaAtendimento = require('../conversa/conversa_atendimento.model');
const ConversaEncerrada = require('../conversa/conversa.model');
const Case = require('../case/case-model');

module.exports = async function limpaCache(idConversaAtendimento) {
    console.log('############## limpando cache ################# ', idConversaAtendimento);
    try {
        let conversaEmAtendimento = await ConversaAtendimento.findById(idConversaAtendimento);
        await ConversaAtendimento.deleteOne({ '_id': idConversaAtendimento });

        conversaEmAtendimento.timeline.push({
            atividade: 'encerrada',
            descricao: conversaEmAtendimento.atendente ? `Conversa encerrada pelo atendente ${conversaEmAtendimento.atendente.name}` : `Conversa encerrada`
        });

        let conversaNoCache = {
            idSessao: conversaEmAtendimento.idSessao,
            idSF: conversaEmAtendimento.idSF,
            tipoCadastroSF: conversaEmAtendimento.tipoCadastroSF,
            nova_mensagem: conversaEmAtendimento.nova_mensagem,
            encerrada: conversaEmAtendimento.encerrada,
            atendida: conversaEmAtendimento.atendida,
            atendimentoBot: conversaEmAtendimento.atendimentoBot,
            sucessoAtendimento: conversaEmAtendimento.sucessoAtendimento,
            situacao: conversaEmAtendimento.situacao,
            meioTransferencia: conversaEmAtendimento.meioTransferencia,
            encerrada_por: conversaEmAtendimento.encerrada_por,
            id_socket_cliente: conversaEmAtendimento.id_socket_cliente,
            fila: conversaEmAtendimento.fila,
            cliente: conversaEmAtendimento.cliente,
            canal: conversaEmAtendimento.canal,
            hora_criacao: conversaEmAtendimento.hora_criacao,
            mensagens: conversaEmAtendimento.mensagens,
            origem: conversaEmAtendimento.origem,
            resumoBot: conversaEmAtendimento.resumoBot,
            satisfacao_do_cliente: conversaEmAtendimento.satisfacao_do_cliente,
            atendente: conversaEmAtendimento.atendente,
            hora_do_atendimento: conversaEmAtendimento.hora_do_atendimento,
            id_socket_atendente: conversaEmAtendimento.id_socket_atendente,
            assunto: conversaEmAtendimento.assunto ? conversaEmAtendimento.assunto : '',
            status: conversaEmAtendimento.status ? conversaEmAtendimento.status : '',
            produto: conversaEmAtendimento.produto ? conversaEmAtendimento.produto : '',
            setor: conversaEmAtendimento.setor ? conversaEmAtendimento.setor : '',
            observacao: conversaEmAtendimento.observacao ? conversaEmAtendimento.observacao : '',
            hora_fim_conversa: new Date(),
            timeline: conversaEmAtendimento.timeline,
            plataforma: conversaEmAtendimento.plataforma,
            navegador: conversaEmAtendimento.navegador,
            isMobile: conversaEmAtendimento.isMobile,
            info: conversaEmAtendimento.info,
        }
        const conversa = await ConversaEncerrada.create(conversaNoCache);
        // await Case.create({
        //     conversa: conversa._id,
        //     titulo: 'Caso criado com encerramento do chat',
        //     descricao: 'Edite a descricao'
        // });
    } catch (error) {
        console.log('** Erro ao  limpar cache **');
        console.log(`** Erro: ${error}`);
    }
}