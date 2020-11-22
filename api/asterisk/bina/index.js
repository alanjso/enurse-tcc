const Contato = require('../../contato/contato.model');

module.exports = (ami, io) => {

  ami.on('Newstate', data => {
    // console.log('event: ', data);
  });

  ami.on('Newchannel', data => {
    // console.log('event: ', data);
  });

  ami.on('AgentConnect', async data => {

    console.log('event: ', data);

    const contato = await Contato.findOne({ celular: data.CallerIDNum });

    console.log('Contato: ', contato);

    let ligacao = {
      ramal: data.ConnectedLineNum,
      telefone_cliente: data.CallerIDNum,
      cliente: contato
    }

    io.emit('ligacao_para_ramal', {ligacao});
  });

  ami.on('AgentComplete', data => {
    //console.log('event: ', data);
  });

  ami.on('AgentDump', data => {
    // console.log('event: ', data);
  });

  ami.on('AgentLogin', data => {
    //console.log('event: ', data);
  });

  ami.on('AgentLogoff', data => {
    //console.log('event: ', data);
  });

  ami.on('AgentRingNoAnswer', data => {
    //console.log('event: ', data);
  });

  ami.on('DialBegin', data => {
    //console.log('event: ', data);
  });

  ami.on('DialEnd', data => {
    //console.log('event: ', data);
  });

  ami.on('DialState', data => {
    //console.log('event: ', data);
  });

  ami.on('QueueMemberStatus', data => {
    //console.log('event: ', data);
  });
}