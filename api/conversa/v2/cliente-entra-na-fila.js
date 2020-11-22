const ConversaEmAtendimento = require('../conversa_atendimento.model');
const Caso = require('../../case/case-model');
const Contato = require('../../contato/contato.model');
const Config = require('../../configuracao/configuracao.model');
const axios = require('axios');
const { getDiaSemana } = require('../../util/date-util');

const TITULO = 'Caso criado a partir de uma conversa do chat';
const DESCRICAO = 'Editar a descrição';

const eventEmit = require('../../util/eventEmmiter');
const grupoTelegramParaEnviarAlerta = '-397120811';

async function clienteEntraNaFila(data, io, socket) {

  const config = await Config.find();
  const horarioPorDia = config[0].configuracao_horario_atendimento;
  const horaQueEntrouNaFila = new Date();

  let today = getDiaSemana();
  today = horarioPorDia.find((element) => element.dia == today)
  console.log(today);

  const horaInicial = today.horaInicio.split(':')[0];
  const minutoInicial = today.horaInicio.split(':')[1];

  const inicioDoAtendimento = new Date();
  inicioDoAtendimento.setHours(horaInicial, minutoInicial, '00');

  const horaFinal = today.horaFim.split(':')[0];
  const minutoFinal = today.horaFim.split(':')[1];

  const fimDoAtendimento = new Date();
  fimDoAtendimento.setHours(horaFinal, minutoFinal, '00');


  if (today.habilitado == false || horaQueEntrouNaFila < inicioDoAtendimento || horaQueEntrouNaFila > fimDoAtendimento) {
    // if (false) {
    //enviar email para o cliente
    //enviar email para a empresa
    console.log('não deixar entrar na fila');
    socket.emit('entrou_na_fila_cliente', {
      foraHorario: true,
      horarioInicial: config[0].atendimentoConfig.horarioInicio,
      horarioFinal: config[0].atendimentoConfig.horarioFim
    });

    const email = data.email;

    response = await axios({
      method: 'post',
      url: 'http://flexia.g4flex.com.br:5555/enviaremail',
      data: {
        "hostSMTP": config[0].email.hostSMTP,
        "address": config[0].email.address,
        "sendFrom": config[0].email.sendFrom ? config[0].email.sendFrom : '',
        "password": config[0].email.password,
        "name": config[0].email.name,
        "emailTo": email,
        "subject": config[0].email.name,
        "text": config[0].email.textEmailForaHorario,
        "html": ""
      }
    });

  } else {
    let user = {
      nome: data.nome,
      cpf: data.cpf,
      email: data.email,
      celular: data.celular
    };

    try {

      let contato = await Contato.findOne({ "email": data.email });
      let cliente = contato ? contato : await Contato.create(user);

      //verificar se já existe conversa com aquele email
      let query = {};

      if (data.cpf) {
        query['cliente.cpf'] = data.cpf;
      }

      query['cliente.email'] = data.email;

      const verificaSeJaExisteConversa = await ConversaEmAtendimento.findOne(query);
      console.log('verificaSeJaExisteConversa: ', verificaSeJaExisteConversa);
      if (verificaSeJaExisteConversa) {
        socket.to(verificaSeJaExisteConversa.id_socket_cliente).emit('entrou_em_outra_janela', { message: "OK" });

        // io.emit('entrou_em_outra_janela', { id: verificaSeJaExisteConversa.id_socket_cliente });
        console.log("##### Já existe conversa com esse email ##### ", verificaSeJaExisteConversa.cliente.email);

        await ConversaEmAtendimento.updateOne({ _id: verificaSeJaExisteConversa._id }, {
          $set: {
            id_socket_cliente: socket.id
          }
        });

        socket.emit('entrou_na_fila_cliente', { conversa: verificaSeJaExisteConversa, conversaJaExistia: true });
        //io.sockets.connected[verificaSeJaExisteConversa.id_socket_cliente].disconnect();

        return;
      }

      const conversa = await ConversaEmAtendimento.create({
        id_socket_cliente: socket.id,
        fila: data.fila,
        cliente: cliente,
        situacao: "nao_atendida",
        canal: "chat",
        plataforma: data.plataforma,
        navegador: data.navegador,
        isMobile: data.isMobile,
        atendimentoBot: false,
        timeline: [{ atividade: 'nao_atendida', descricao: `${cliente.nome} entrou na fila ${data.fila}` }]
      });

      //########################### Criar Caso no momento que o cliente entrar na fila ###########################
      let caso = {
        titulo: TITULO,
        descricao: DESCRICAO,
        conversa: conversa._id
      };

      //console.log('caso: ', caso);

      //await Caso.create(caso);

      io.emit('entrou_na_fila', { conversa });
      socket.emit('entrou_na_fila_cliente', { conversa, conversaJaExistia: false });
      eventEmit.emit('send_monit_adm', {});
      // eventEmit.emit('alerta_telegram_entrou_na_fila', { conversa });
      //verificar se o cliente usa telegram
      //eventEmit.emit('enviar_msg_telegram', grupoTelegramParaEnviarAlerta, `Cliente: ${conversa.cliente.nome} entrou na fila: ${conversa.fila}, data: ${new Date()}`);
    } catch (erro) {
      console.log('** Error no socket on entrar_na_fila **');
      console.log(`** Erro: ${error} **`);
    }
  }
}

function verificaHorarioDeAtendimento() {
  console.log('Verifica horario de atendimento');
}

module.exports = clienteEntraNaFila;