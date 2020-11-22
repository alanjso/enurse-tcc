let chai = require('chai');

let assert = chai.assert;
var expect = chai.expect;

const ConversaEmAtendimento = require('../api/conversa/conversa_atendimento.model');
const ConversaEncerrada = require('../api/conversa/conversa.model');

const conversasEmAtendimento = require('../api/monitoramento/conversas-em-atendimento');
const quantidadeDeConversasPorSituacao = require('../api/monitoramento/quantidade-de-conversas-por-situacao');
const quantidadeDeConversasPorHora = require('../api/monitoramento/quantidade-de-conversas-por-hora');
const atendentesLogadosComQuantidadeAtendimento = require('../api/monitoramento/atendentesLogadosComQuantidadeAtendimento');

describe('Monitoramento de conversas', () => {

  before(async () => {
    require('../config/database-mongo-config')();
    await ConversaEmAtendimento.deleteMany({});
    await ConversaEncerrada.create([
      {
        atendida: true,
        situacao: 'encerrada',
        encerrada: true,  
        hora_criacao: new Date('2020-05-15T12:00:00')
      },
      {
        atendida: true,
        situacao: 'encerrada',
        encerrada: true,
        hora_criacao: new Date('2020-05-15T12:00:00')
      },
      {
        atendida: true,
        situacao: 'encerrada',
        encerrada: true
      },
      {
        atendida: true,
        situacao: 'encerrada',
        encerrada: true
      }
    ]);
    await ConversaEmAtendimento.create([
      {
        atendida: true,
        situacao: 'em_atendimento'

      },
      {
        atendida: true,
        situacao: 'em_atendimento'
      },
      {
        atendida: false,
        situacao: 'em_atendimento'
      },
      {
        atendida: true,
        situacao: 'transferida'
      }
    ]);

  });

  it('##### Retorna conversas em atendimento #####', async () => {

    const conversas = await conversasEmAtendimento();
    expect(conversas).to.have.length(3);
  });

  it('##### Quantidade de conversas por situação #####', async () => {
    const conversasPorSituacao = await quantidadeDeConversasPorSituacao();

  })

  it('##### Quantidade de conversas por hora #####', async () => {
    const conversasPorSituacao = await quantidadeDeConversasPorHora();

  })

  it('##### Atendentes logado #####', async () => {
    atendentesLogadosComQuantidadeAtendimento();
  });

});

