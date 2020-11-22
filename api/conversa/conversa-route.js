const conversaService = require('./conversa-service');
const conversaFacebookService = require('./Facebook/conversa-facebook-service');
const conversaWhatsAppService = require('./conversa-whatsapp-service');
const mime = require('mime');
const crypto = require('crypto');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        crypto.pseudoRandomBytes(16, function (err, raw) {
            cb(null, raw.toString('hex') + Date.now() + '.' + mime.getExtension(file.mimetype));
        });
    }
});
const upload = multer({ storage: storage });

module.exports = server => {
    const SERVICE = '/conversa'
    /*
        Funcionalidade: busca todoas as conversas com paginação, a variável
        de paginação é: pagina.
        Quem usa: flex-channel.
    */
    server.get(`${SERVICE}/listatodas`, conversaService.buscaTodasConversas);

    /*
        Funcionalidade: busca todas as conversas encerradas
        Quem usa: app-integracao-mongo-psql.
    */
    server.get(`${SERVICE}/listatodasencerradas`, conversaService.buscaTodasConversasEncerradas);

    /*
        Funcionalidade: busca as conversas por usuário.
        Quem usa: flex-channel.
    */
    server.post(`${SERVICE}/lista`, conversaService.buscarConversasPorUser);

    /*
        Funcionalidade: Integração Facebook com API para Autenticar os uso do chat.
        Quem usa: flex-channel.autenticaFacebook
    */

    server.get(`${SERVICE}/facebook/recebe`, conversaFacebookService.autenticaFacebook);
    /*
        Funcionalidade: Integração Facebook com API para falar com a FlexIA e Channel.
        Quem usa: flex-channel.
    */
    server.post(`${SERVICE}/facebook/recebe`, conversaFacebookService.recebeMensagemFacebook);

    /*
        Funcionalidade: receber as mensagens das conversas do whatspp.
        Quem usa: flex-channel.
    */
    server.post(`${SERVICE}/whatsapp/recebe`, conversaWhatsAppService.recebe);

    /*
        Funcionalidade: enviar as mensagens para a API do whatsapp.
        Quem usa: flex-channel.
    */
    server.post(`${SERVICE}/whatsapp/envia`, conversaWhatsAppService.envia);

    /*
        Funcionalidade: enviar as mensagens para a API do whatsapp.
        Quem usa: flex-channel.
    */
    server.post(`${SERVICE}/whatsapp/iniciaconversacomcliente`, conversaWhatsAppService.iniciaConversaComCliente);

    /*
        Funcionalidade: adiciona uma mensagem na conversa atualizando
        a conversa.
        Quem usa: flex-channel.
    */
    server.post(`${SERVICE}`, conversaService.adicionaMensagem);

    /*
        Funcionalidade: adiciona um sussuro na conversa .
        Quem usa: flex-channel.
    */
    server.post(`${SERVICE}/add/whisper`, conversaService.adicionaSussuro);

    /*
        Funcionalidade: adiciona um arquivo de midia na conversa atualizando
        a conversa.
        Quem usa: flex-channel.
    */
    server.post(`${SERVICE}/upload/arquivo`, upload.any(), conversaService.adicionaMidia);

    /*
        Funcionalidade: de 1 em 1 segundo o front faz uma requisão para
        pegar a conversa de forma atualizada.
        Quem usa: flex-channel.
    */
    server.post(`${SERVICE}/update`, conversaService.atualizaStatus);

    /*
        Funcionalidade: de 1 em 1 segundo o front faz uma requisão para
        pegar a conversa de forma atualizada.
        Quem usa: flex-channel.
    */
    server.get(`${SERVICE}/:id`, conversaService.buscaConversaPorId);

    /*
        Funcionalidade: encerrar a conversa.
        Quem usa: flex-channel.
        Modificação: mudar para put
    */
    server.put(`${SERVICE}/encerra/:id`, conversaService.encerraConversa);

    /*
        Funcionalidade: atualizar o encerramento da conversa.
        Quem usa: flex-channel.
    */
    server.put(`${SERVICE}/atualiza/encerramento/:id`, conversaService.updateEncerramento);

    /*
        Funcionalidade: Atualizar o contato/cliente da conversa.
        Quem usa: flex-channel.
    */
    server.put(`${SERVICE}/atualiza/:idConversa/contato/:idContato`, conversaService.updateConversaContato);

    server.put(`${SERVICE}/encerra/cliente/:id`, conversaService.clienteEncerraConversa);

    /*
        Funcionalidade: iniciar a conversa com a Flexia.
        Quem usa: flex-channel.
    */
    server.post(`${SERVICE}/flexia/iniciaConversaComFlexia`, conversaService.iniciaConversaComFlexia);

    /*
        Funcionalidade: enviar mensagem para a Flexia.
        Quem usa: flex-channel.
    */
    server.post(`${SERVICE}/enviarMensagemParaFlexia`, conversaService.enviarMensagemParaFlexia);

    server.post(`/v2${SERVICE}/enviarMensagemParaFlexia`, conversaService.enviarMensagemParaFlexiaV2);

    /*
        Funcionalidade: mudar a fila que a conversa está naquele momento.
        Quem usa: flex-channel.
    */
    server.put(`${SERVICE}/:idConversa/transferir/:fila`, conversaService.transferir);

    /*
        Funcionalidade: mostrar a quantidade de clientes na fila para que o cliente que está no chat
        saiba quantas pessoas tem na frente dele até ele ser atendido.
        Quem usa: flex-channel.
    */
    server.get(`${SERVICE}/clientenafila/:fila`, conversaService.quantidadeDeClienteNaFila);

    server.get(`${SERVICE}/posicaoDaConversaNaFila/:fila/:idDaConversa`, conversaService.posicaoDaConversaNaFila);

    /*
        Funcionalidade: um atendente pode atender mais de uma cliente por vez, logo ele precisa saber suas conversas ativas,
        passando um vetor com os id`s das conversas ativas ele recebe um vetor de conversas.
        Quem usa: flex-channel.
    */
    server.post(`${SERVICE}/buscaConversasAtivas`, conversaService.buscaMaisDeUmaConversaPorId);

    /*
        Funcionalidade: adicionar uma nota que corresponde a satisfação do cliente relacionado ao 
        sei atendimento.
        Quem usa: flex-chat-api.
    */
    server.put(`${SERVICE}/satisfacao/:id`, conversaService.satisfacao);

    /*
        Funcionalidade: caso esteja fora do horário de atendimento a conversa será criada como encerrada.
        Quem usa: flex-chat-client.
    */
    server.post(`${SERVICE}/foraHorario`, conversaService.foraHorario);

    /*
        Funcionalidade: encerrar conversa quando o cliente fechar a janela do chat
        Quem usa: flex-chat-client.
    */

    server.get(`${SERVICE}/cliente/abandonou`, conversaService.clienteAbandonouConversa);

    server.get(`${SERVICE}/verificaSeExisteConversaPorEmail/:email`, conversaService.verificaSeExisteConversaPorEmail);

    server.get(`${SERVICE}/delete/:id`, conversaService.deleteConversaId);
}