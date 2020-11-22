const ConversaAtendimento = require('../conversa_atendimento.model')

async function conversasDoAtendente(event, socket) {
    //receber uma array com as filas do usuario
    const query = {
        'atendente._id': event.atendente_id,
        'situacao': 'em_atendimento'
    };
    const filas = event.filas.map(fila => {
        return fila.nome;
    });
    //conversas não atendidas    
    const conversasDasMinhasFilas = await ConversaAtendimento.find()
        .where('fila').in(filas)
        .where('atendida').equals(false);
    //todas conversas = não atendidas + em andamento
    const minhasConversas = await ConversaAtendimento.find(query);
    let conversas = conversasDasMinhasFilas.concat(minhasConversas);
    socket.emit('conversas_do_atendente', conversas);
    // socket.emit('conversasNaoAtendidas', conversas);

}

module.exports = conversasDoAtendente;