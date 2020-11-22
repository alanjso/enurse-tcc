const mongoose = require('mongoose');

const alertaSchema = mongoose.Schema({
    telegram: {
        ativo: {
            type: Boolean,
            default: false
        },
        grupo_id: {
            type: String
        }
    },
    email: {
        ativo: {
            type: Boolean,
            default: false
        },
        endereco_email: {
            type: String
        }
    }
}, { _id: false });

const atendimentoSchema = mongoose.Schema({

    horarioInicio: {
        type: String,
        default: '08:00'
    },

    horarioFim: {
        type: String,
        default: '20:00'
    },

}, { _id: false });

const emailSchema = mongoose.Schema({

    habilitado: {
        type: Boolean,
        default: false
    },

    habilitarEmailAoEncerrar: {
        type: Boolean,
        default: false
    },

    enviarConversaPorEmail: {
        type: Boolean,
        default: false
    },

    enviarEmailForaHorario: {
        type: Boolean,
        default: false
    },

    hostSMTP: {
        type: String,
        default: ''
    },
    name: {
        type: String,
        default: ''
    },
    sendFrom: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    password: {
        type: String,
        default: ''
    },
    defaultText: {
        type: String,
        default: ''
    },
    textEmailEncerramento: {
        type: String,
        default: ''
    },
    textEmailForaHorario: {
        type: String,
        default: ''
    },

    textoAbandono: {
        type: String,
        default: ''
    },

    htmlAbandono: {
        type: String,
        default: ''
    },

    habilitarEmailAoAbandonar: {
        type: Boolean,
        default: false
    },

}, { _id: false });

const asteriskSchema = mongoose.Schema({

    port: {
        type: String
    },

    host: {
        type: String
    },

    context: {
        type: String
    },

    username: {
        type: String
    },

    password: {
        type: String
    }

}, { _id: false });

const chatSchema = mongoose.Schema({

    nome_chat: {
        type: String
    },

    nome_atendente: {
        type: String
    },

    cor: {
        type: String
    },

    encerrarAoFecharJanelaCliente: {
        type: Boolean,
        default: false
    },

    logoChat: {
        type: String,
        default: ''
    },

    profilePic: {
        type: String,
        default: ''
    },

    mensagemFinal: {
        type: String,
        default: 'Nosso chat está disponível de segunda a sexta, de 08 às 20h.'
    }

}, { _id: false });

const timeoutAtendimentoSchema = mongoose.Schema({

    timeout: {
        type: Number
    },
    habilitado: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const facebookSchema = mongoose.Schema({

    nome_canal: {
        type: String,
        default: 'Facebook'
    },

    descricao: {
        type: String
    },

    tokenFacebook: {
        type: String
    },

    facebook_access_token: {
        type: String
    },

    urlFacebook: {
        type: String
    },

    usaBot: {
        type: Boolean,
        default: false
    },

    ativado: {
        type: Boolean,
        default: false
    },

    skillWatson: {
        type: String,
        default: ''
    }

}, { _id: false });

const telegramSchema = mongoose.Schema({

    nome_canal: {
        type: String,
        default: 'Telegram'
    },

    descricao: {
        type: String
    },

    tokenTelegram: {
        type: String
    },

    usaBot: {
        type: Boolean,
        default: false
    },

    ativado: {
        type: Boolean,
        default: false
    },

    skillWatson: {
        type: String,
        default: ''
    }

}, { _id: false });

const watsonSchema = mongoose.Schema({

    nome_canal: {
        type: String,
        default: 'Watson',
    },

    descricao: {
        type: String
    },

    atendenteBotId: {
        type: String
    },

    filaBotId: {
        type: String
    },

    assistantId: {
        type: String
    },

    apiKey: {
        type: String
    },

    ativado: {
        type: Boolean,
        default: false
    },

    encerrarTimeoutWatson: {
        type: Boolean,
        default: false
    },

}, { _id: false });

const whatsappSchema = mongoose.Schema({

    nome_canal: {
        type: String,
        default: 'Whatsapp'
    },

    descricao: {
        type: String
    },

    apikey: {
        type: String,
    },

    channel: {
        type: String,
        default: 'whatsapp'
    },

    source: {
        type: String
    },

    srcName: {
        type: String
    },

    usaBot: {
        type: Boolean,
        default: false
    },

    ativado: {
        type: Boolean,
        default: false
    },

    skillWatson: {
        type: String,
        default: ''
    }

}, { _id: false });

const mensagensSchema = mongoose.Schema({

    autor: {
        type: String
    },

    msgSaudacao: {
        type: String
    },

    msgEncerramento: {
        type: String
    },

    msgTransferencia: {
        type: String
    },

    hasMsgAtm: {
        type: Boolean,
        default: false
    },

    sendAtendente: {
        type: Boolean,
        default: true
    },

}, { _id: false });

const logosSchema = mongoose.Schema({

    logoMini: {
        type: String,
        default: ''
    },

    logoHome: {
        type: String,
        default: ''
    }

}, { _id: false });

horarioSchema = mongoose.Schema({
    dia: {
        type: String,
        enum: ['SEGUNDA', 'TERÇA', 'QUARTA', "QUINTA", "SEXTA", 'SÁBADO', 'DOMINGO'],
    },
    horaInicio: {
        type: String,
        default: '08:00'
    },
    horaFim: {
        type: String,
        default: '18:00'
    },
    habilitado: {
        type: Boolean,
        default: true
    }
}, { _id: false });


const configuracaoSchema = mongoose.Schema({

    email: {
        type: emailSchema,
        default: {}
    },

    atendimentoConfig: {
        type: atendimentoSchema,
        default: {}
    },

    asterisk: {
        type: asteriskSchema,
        default: {}
    },

    chat: chatSchema,

    timeoutAtendimento: {
        type: timeoutAtendimentoSchema,
        default: {}
    },

    facebook: {
        type: facebookSchema,
        default: {}
    },

    telegram: {
        type: telegramSchema,
        default: {}
    },

    whatsapp: {
        type: whatsappSchema,
        default: {}
    },

    watson: {
        type: watsonSchema,
        default: {}
    },

    mensagens: {
        type: mensagensSchema,
        default: {}
    },

    logos: {
        type: logosSchema,
        default: {}
    },

    configuracao_horario_atendimento: [horarioSchema],

    alerta: {
        type: alertaSchema,
        default: {}
    }
});

const configuracao = mongoose.model('configuracao', configuracaoSchema);

module.exports = configuracao;