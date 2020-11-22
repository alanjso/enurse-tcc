const mongoose = require("mongoose");

const resumoSchema = mongoose.Schema({
  id: {
    type: String
  },
  value: {
    type: String
  },
}, { _id: false });

const origemConversaSchema = mongoose.Schema({
  estado: {
    type: String
  },
  codigo_do_estado: {
    type: String
  },
  cidade: {
    type: String
  },
  pais: {
    type: String
  },
  codigo_do_pais: {
    type: String
  },
  longitude: {
    type: String
  },
  latitude: {
    type: String
  },
}, { _id: false });

const atendenteSchema = mongoose.Schema({
  name: {
    type: String
  },
  email: {
    type: String
  },

  codigo: {
    type: String
  },

  codigoDoAgente: {
    type: String
  }
});

const clienteSchema = mongoose.Schema({
  nome: {
    type: String
  },

  email: {
    type: String
  },

  celular: {
    type: String
  },

  empresa: {
    type: String
  },

  cpf: {
    type: String
  },

  id_telegram: {
    type: String
  },

  id_facebook: {
    type: String
  }
});

const mensagem = mongoose.Schema({
  hora_da_mensagem: {
    type: Date,
    default: Date.now
  },

  texto: {
    type: String
  },

  escrita_por: {
    type: String
  },

  cliente_ou_atendente: {
    type: String
  },

  options: {
    type: String
  },

  response_type: {
    type: String
  },

  title: {
    type: String
  },

  description: {
    type: String
  },

  tag: {
    type: String
  },

  source: {
    type: String
  }
});

const marcoSchema = mongoose.Schema({
  atividade: {
    type: String,
    enum: ['nao_atendida', 'atender', 'transferida', 'encerrada', 'abandonada', 'em_atendimento'],
  },
  descricao: {
    type: String
  },
  horaAtividade: {
    type: Date,
    default: Date.now
  },
}, { _id: false });

const conversaSchema = mongoose.Schema({
  hora_criacao: {
    type: Date,
    default: Date.now
  },

  id_socket_atendente: {
    type: String
  },

  id_socket_cliente: {
    type: String
  },

  linkedId: {
    type: String
  },

  hora_fim_conversa: {
    type: Date
  },

  hora_do_atendimento: {
    type: Date
  },

  nova_mensagem: {
    type: Boolean,
    default: false
  },

  cliente: clienteSchema,

  atendente: atendenteSchema,

  mensagens: [mensagem],

  timeline: [marcoSchema],

  origem: origemConversaSchema,

  fila: {
    type: String
  },

  canal: {
    type: String
  },

  idSessao: {
    type: String
  },

  encerrada: {
    type: Boolean,
    default: false
  },

  atendida: {
    type: Boolean,
    default: false
  },

  atendimentoBot: {
    type: Boolean,
    default: false
  },

  sucessoAtendimento: {
    type: Boolean,
    default: false
  },

  //encerrada,em_atendimento,transferida, abandonada
  situacao: {
    type: String,
    default: "nao_atendida"
  },

  //apontar para o modelo assunto
  assunto: {
    type: String
  },

  //apontar para o modelo status
  status: {
    type: String
  },

  idSF: {
    type: String
  },

  tipoCadastroSF: {
    type: String
  },

  produto: {
    type: String
  },

  setor: {
    type: String
  },

  meioTransferencia: {
    type: String,
    default: "chat"
  },

  observacao: {
    type: String
  },

  resumoBot: [resumoSchema],

  satisfacao_do_cliente: {
    type: Number
  },

  encerrada_por: {
    type: String,
    enum: ["CLIENTE", "ATENDENTE", "BOT", "OCIOSIDADE", "ADMINISTRADOR", ""],
    default: ""
  },

  fechou_janela: {
    type: Boolean,
    default: false
  },

  novas_mensagens: {
    type: Number,
    default: 0
  },

  plataforma: {
    type: String,
  },

  navegador: {
    type: String,
  },

  isMobile: {
    type: Boolean,
  },

  info: {
    type: String,
  },
});

const conversa = mongoose.model("Conversa_em_atendimento", conversaSchema);

module.exports = conversa;
