const filaService = require('./fila-service');

module.exports = server => {

    /*
        Funcionalidade: quando o cliente escolhe sua fila uma conversa é criada no mongodb.
        Quem usa: flex-channel e flex-chat-client.
    */
    server.post('/add/queue/client', filaService.addClientInQueue);

    /*
        Funcionalidade: "remove" o cliente da fila, nesse momento ele é colocado na situacao "em_atendimento".
        Quem usa: flex-channel.
    */
    server.post('/remove/queue/client', filaService.removeClientFromQueue)

    /*
        Funcionalidade: o chat-client faz requisições de 1 em 1 segundo para saber se o cliente está na fila.
        ou se já foi atendido.
    */
    server.post('/queue/verify/client', filaService.verifyIfClientInQueue)

    /*
        Funcionalidade: cria uma fila.
        Quem usa: flex-channel.
    */
    server.post('/filas', filaService.save);

    /*
        Funcionalidade: lista todas as filas.
        Quem usa: flex-channel e flex-chat-client.
    */
    server.get('/filas', filaService.list);

    /*
        Funcionalidade: lista os clientes que estão em um determinada fila.
        Quem usa: flex-channel.
        Motivo: para saver os clientes que estão na fila, de 1 em 1 segundo faz a requisição.
    */
    server.get('/filas/listaClientesEmFila/:fila', filaService.listaClientesEmFila);

    /*
        Funcionalidade: lista os clientes de todas as filas que não foram atendidos.
        Quem usa: flex-channel.
        Motivo: caso ele precise atender clientes de outras filas, esse serviço mostra todos.
    */
    server.get('/filas/listaclientes/todasasfilas', filaService.listaClientesEmTodasAsFilas);

    server.get('/v2/filas/listaclientes/todasasfilas', filaService.V2listaClientesEmTodasAsFilas);

    /*
        Funcionalidade: remover fila pelo id.
        Quem usa: flex-channel.
    */
    server.delete(`/filas/:id`, filaService.remove);

    /*
        Funcionalidade: atualiza a fila.
        Quem usa: flex-channel.
    */
    server.put(`/filas/:id`, filaService.update);

    /*
        Funcionalidade: busca a fila pelo id.
    */
    server.get(`/filas/:id`, filaService.findById);

    server.get(`/filas/busca/filtrados`, filaService.listaComFiltros);

}