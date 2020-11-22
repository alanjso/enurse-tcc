const ConversaEncerrada = require('../conversa/conversa.model');
const Usuario = require('../user/user-model');
const Fila = require("../fila/fila-model");
const dateFns = require('date-fns');
const redis = require('../../config/database-redis-config');
const User = require('../user/user-model');
const pjson = require('../../package.json');
/*
    No modelo de conversa_atendimento ficam as conversas que estão em atendimento
    e as que estão esperando para serem atendidas
*/
const ConversaAtendimento = require('../conversa/conversa_atendimento.model');

function calcFormatDatas(tempoEmSegundo) {
    let tempoEmMinuto = 00;
    let tempoEmHora = 00;
    let temporFormatado = `${tempoEmHora}:${tempoEmMinuto}:${tempoEmSegundo}`;

    try {

        if (tempoEmSegundo >= 60) {
            tempoEmMinuto = (tempoEmSegundo / 60) | 0; // Valor inteiro de minutos
            tempoEmSegundo = (tempoEmSegundo % 60); // Valor restante dos segundos

            if (tempoEmMinuto >= 60) {
                tempoEmHora = (tempoEmMinuto / 60) | 0; // Valor inteiro de horas
                tempoEmMinuto = (tempoEmHora % 60); // Valor restante de minutos 
            }
        }

        tempoEmHora > 10 ? 0 : tempoEmHora = `0${tempoEmHora}`;
        tempoEmMinuto > 10 ? 0 : tempoEmMinuto = `0${tempoEmMinuto}`;
        tempoEmSegundo > 10 ? 0 : tempoEmSegundo = `0${tempoEmSegundo}`;
        /*
                tempoEmHora == 'NaN' ? '' : tempoEmHora = `00`;
                tempoEmMinuto == 'NaN' ? '' : tempoEmMinuto = `00`;
                tempoEmSegundo == 'NaN' ? '' : tempoEmSegundo = `00`;
        */
        temporFormatado = `${tempoEmHora}:${tempoEmMinuto}:${tempoEmSegundo}`;

        return temporFormatado;
    } catch (error) {
        console.log('Erro ao calcular Tempo de espera ou atendimento', error);
        return temporFormatado = 'Invalid Date'
    }
}

module.exports = {

    totalConversas: async (req, res) => {
        try {
            let dataInicial = req.query.dataInicial;
            let dataFinal = req.query.dataFinal;

            let queryCanal = {
                hora_criacao: {
                    $gte: new Date(dataInicial + "T00:00:00Z"),
                    $lt: new Date(dataFinal + "T23:59:59Z")
                }
            };

            let querySituacao = {
                hora_criacao: {
                    $gte: new Date(dataInicial + "T00:00:00Z"),
                    $lt: new Date(dataFinal + "T23:59:59Z")
                }
            };

            // encerrada,em_atendimento,transferida, nao_atendida
            let db = {
                canal: {
                    whatsapp: {},
                    telegram: {},
                    chat: {},
                    flexia: {}
                },
                situacao: {},
                total: await ConversaEncerrada.find(querySituacao).countDocuments()
            };

            queryCanal["canal"] = 'whatsapp';
            db.canal.whatsapp.total = await ConversaEncerrada.find(queryCanal).countDocuments();
            queryCanal["canal"] = 'telegram';
            db.canal.telegram.total = await ConversaEncerrada.find(queryCanal).countDocuments();
            queryCanal["canal"] = 'chat';
            db.canal.chat.total = await ConversaEncerrada.find(queryCanal).countDocuments();
            queryCanal["canal"] = 'ChatFlexIA';
            db.canal.flexia.total = await ConversaEncerrada.find(queryCanal).countDocuments();

            queryCanal["canal"] = 'whatsapp';
            queryCanal["situacao"] = 'em_atendimento';
            db.canal.whatsapp.emAtendimento = await ConversaAtendimento.find(queryCanal).countDocuments();
            queryCanal["situacao"] = 'encerrada';
            db.canal.whatsapp.encerrada = await ConversaEncerrada.find(queryCanal).countDocuments();
            queryCanal["situacao"] = { $in: ['nao_atendida', 'transferida'] };
            db.canal.whatsapp.emEspera = await ConversaAtendimento.find(queryCanal).countDocuments();


            queryCanal["canal"] = 'telegram';
            queryCanal["situacao"] = 'em_atendimento';
            db.canal.telegram.emAtendimento = await ConversaAtendimento.find(queryCanal).countDocuments();
            queryCanal["situacao"] = 'encerrada';
            db.canal.telegram.encerrada = await ConversaEncerrada.find(queryCanal).countDocuments();
            queryCanal["situacao"] = { $in: ['nao_atendida', 'transferida'] };
            db.canal.telegram.emEspera = await ConversaAtendimento.find(queryCanal).countDocuments();


            queryCanal["canal"] = 'chat';
            queryCanal["situacao"] = 'em_atendimento';
            db.canal.chat.emAtendimento = await ConversaAtendimento.find(queryCanal).countDocuments();
            queryCanal["situacao"] = 'encerrada';
            db.canal.chat.encerrada = await ConversaEncerrada.find(queryCanal).countDocuments();
            queryCanal["situacao"] = { $in: ['nao_atendida', 'transferida'] };
            db.canal.chat.emEspera = await ConversaAtendimento.find(queryCanal).countDocuments();

            queryCanal["canal"] = 'ChatFlexIA';
            queryCanal["situacao"] = 'em_atendimento';
            db.canal.flexia.emAtendimento = await ConversaAtendimento.find(queryCanal).countDocuments();
            queryCanal["situacao"] = 'encerrada';
            db.canal.flexia.encerrada = await ConversaEncerrada.find(queryCanal).countDocuments();
            queryCanal["situacao"] = { $in: ['nao_atendida', 'transferida'] };
            db.canal.flexia.emEspera = await ConversaAtendimento.find(queryCanal).countDocuments();


            querySituacao["situacao"] = 'em_atendimento';
            db.situacao.emAtendimento = await ConversaAtendimento.find(querySituacao).countDocuments();
            querySituacao["situacao"] = { $in: ['nao_atendida', 'transferida'] };
            db.situacao.emEspera = (await ConversaAtendimento.find(querySituacao).countDocuments());

            querySituacao = '';
            querySituacao = {
                hora_fim_conversa: {
                    $gte: new Date(dataInicial + "T00:00:00Z"),
                    $lt: new Date(dataFinal + "T23:59:59Z")
                }
            };
            querySituacao["situacao"] = 'encerrada';
            db.situacao.encerrada = await ConversaEncerrada.find(querySituacao).countDocuments();
            res.json(db);
        } catch (err) {
            res.status(500).json(err);
        }
    },

    contaConversaPorCanalUnico: async (req, res) => {
        try {
            let dataInicial = req.query.dataInicial;
            let dataFinal = req.query.dataFinal;
            let query = {
                hora_criacao: {
                    $gte: new Date(dataInicial + "T00:00:00Z"),
                    $lt: new Date(dataFinal + "T23:59:59Z")
                }
            };

            query["canal"] = req.query.canal;

            let contagemCanalUnico = await ConversaEncerrada.find(query).countDocuments();
            res.json(contagemCanalUnico);
        } catch (err) {
            res.status(500).json(err);
        }
    },

    atendimentoPorAtendente: async (req, res) => {
        try {
            let dataInicial = req.query.dataInicial;
            let dataFinal = req.query.dataFinal;
            let query = {
                hora_criacao: {
                    $gte: new Date(dataInicial + "T00:00:00Z"),
                    $lt: new Date(dataFinal + "T23:59:59Z")
                }
            };

            query["situacao"] = 'em_atendimento';

            let resultado = [];
            let conversaAtendente = [];
            let atendentes = await Usuario.find();
            let mapConversas = atendentes.map(async (atendente, indice) => {
                query["atendente._id"] = atendente._id;
                conversaAtendente = {
                    atendente: atendentes[indice].nome,
                    quantidade: await ConversaAtendimento.find(query).countDocuments()
                }
                return conversaAtendente;
            });

            resultado = await Promise.all(mapConversas);

            res.json(resultado);
        } catch (err) {
            res.status(500).json(err);
        }
    },

    encerradaPorAtendente: async (req, res) => {
        try {
            let dataInicial = req.query.dataInicial;
            let dataFinal = req.query.dataFinal;
            let query = {
                hora_fim_conversa: {
                    $gte: new Date(dataInicial + "T00:00:00Z"),
                    $lt: new Date(dataFinal + "T23:59:59Z")
                }
            };

            query["situacao"] = 'encerrada';

            let resultado = [];
            let conversaAtendente = [];
            let atendentes = await Usuario.find({ 'userAtivo': true });
            let mapConversas = atendentes.map(async (atendente, indice) => {
                query["atendente._id"] = atendente._id;
                conversaAtendente = {
                    atendente: atendentes[indice].nome,
                    quantidade: await ConversaEncerrada.find(query).countDocuments()
                }
                return conversaAtendente;
            });

            resultado = await Promise.all(mapConversas);

            res.json(resultado);
        } catch (err) {
            res.status(500).json(err);
        }
    },

    naoAtendidaPorFila: async (req, res) => {
        try {
            let dataInicial = req.query.dataInicial;
            let dataFinal = req.query.dataFinal;
            let query = {
                hora_criacao: {
                    $gte: new Date(dataInicial + "T00:00:00Z"),
                    $lt: new Date(dataFinal + "T23:59:59Z")
                }
            };
            query["situacao"] = { $in: ['nao_atendida', 'transferida'] };

            let resultado = [];
            let naoAtendidasFilas = [];
            let filas = await Fila.find();
            let mapFilas = filas.map(async (fila, indice) => {
                query["fila"] = filas[indice].nome;
                naoAtendidasFilas = {
                    fila: filas[indice].nome,
                    quantidade: await ConversaAtendimento.find(query).countDocuments()
                }
                return naoAtendidasFilas;
            });

            resultado = await Promise.all(mapFilas);

            res.json(resultado);
        } catch (err) {
            res.status(500).json(err);
        }
    },

    tempoMedioAtendimentoEspera: async (req, res) => {
        try {
            let dataInicial = req.query.dataInicial;
            let dataFinal = req.query.dataFinal;
            let queryEncerradas = {
                hora_fim_conversa: {
                    $gte: new Date(dataInicial + "T00:00:00Z"),
                    $lt: new Date(dataFinal + "T23:59:59Z")
                },
                encerrada: true
            };

            let queryDesistencia = {
                hora_fim_conversa: {
                    $gte: new Date(dataInicial + "T00:00:00Z"),
                    $lt: new Date(dataFinal + "T23:59:59Z")
                },
                encerrada: true
            };

            let tempoMedio = {
                tma: 0,
                countA: 0,
                tme: 0,
                countE: 0,
                tmc: 0,
                countC: 0,
                tmd: 0,
                countD: 0,
                atendentesLogados: 0,
                atendentes: []
            };
            queryEncerradas["situacao"] = 'encerrada';
            queryDesistencia["situacao"] = 'abandonada';
            // 'hora_criacao' 'hora_do_atendimento' 'hora_fim_conversa'

            let tma = tme = tmc = 0;
            let conversasEncerradas = await ConversaEncerrada.find(queryEncerradas); // Todas as conversas encerradas
            let conversasAbandonadas = await ConversaEncerrada.find(queryDesistencia); // Todas as conversas abandonas
            let tta = 0; // Tempo Atendimento /Conversa
            let tte = 0; // Tempo Espera /Conversa
            let ttc = 0; // Tempo total do entrada na fila até a finalização
            let ttd = 0; // Tempo total da desistencia
            let tc = tempoMedio.countA = tempoMedio.countC = tempoMedio.countE = await ConversaEncerrada.find(queryEncerradas).countDocuments(); //qtde Total Conversas
            let td = tempoMedio.countD = await ConversaEncerrada.find(queryDesistencia).countDocuments(); //qtde Total Desistencias ( conversas Abandonadas)

            conversasEncerradas.forEach((conversa, indice) => {
                ttc = ttc + dateFns.differenceInSeconds(conversasEncerradas[indice].hora_fim_conversa, conversasEncerradas[indice].hora_criacao, { unit: 's' });
                tta = tta + dateFns.differenceInSeconds(conversasEncerradas[indice].hora_fim_conversa, conversasEncerradas[indice].hora_do_atendimento, { unit: 's' }); // (hora_fim_conversa - hora_do_atendimento)
                tte = tte + dateFns.differenceInSeconds(conversasEncerradas[indice].hora_do_atendimento, conversasEncerradas[indice].hora_criacao, { unit: 's' }); // (hora_do_atendimento - hora_criacao)
            });

            conversasAbandonadas.forEach((conversa, indice) => {
                ttd = ttd + dateFns.differenceInSeconds(conversasAbandonadas[indice].hora_fim_conversa, conversasAbandonadas[indice].hora_criacao, { unit: 's' });
            });

            // Em segundos
            tma = (tta / tc);
            tme = (tte / tc);
            tmc = (ttc / tc);
            tmd = (ttd / td);

            // Em HH:MM:SS
            tempoMedio.tma = calcFormatDatas(tma);
            tempoMedio.tme = calcFormatDatas(tme);
            tempoMedio.tmc = calcFormatDatas(tmc);
            tempoMedio.tmd = calcFormatDatas(tmd);
            redis.lrange('atendentes_logados', 0, -1, async (err, reply) => {
                let arrayAtendentes = [];
                if (err) {
                    //console.log('** Erro no tempoMedioAtendimentoEspera no redis lrange **');
                    //console.log(`** Erro: ${err} **`);
                    return;
                }
                // if(err) return console.error(err);

                for (const atendenteId of reply) {
                    //console.log(`Atendentes: ${atendenteId}`);
                    let usuario = await User.findById(atendenteId);
                    arrayAtendentes.push(
                        {
                            "id": atendenteId,
                            "nome": usuario.nome
                        }
                    );
                }

                tempoMedio.atendentesLogados = reply.length;
                tempoMedio.atendentes = arrayAtendentes;
                // console.log('tempo medio: ', tempoMedio);
                res.json(tempoMedio);
            });

        } catch (err) {
            res.status(500).json(err);
        }
    },

    conversasPorHoraCanal: async (req, res) => {
        try {
            let dataInicial = req.query.dataInicial;
            let dataFinal = req.query.dataFinal;
            let numDias = dateFns.differenceInDays(dataFinal, dataInicial, { unit: 'd' });
            let dataCalc = new Date(dataInicial);
            dataCalc = dateFns.addDays(dataCalc, 1);
            // console.log(dataCalc);
            const canais = ['chat', 'ChatFlexIA', 'telegram', 'whatsapp', 'facebook'];
            const horas = [
                { hora: '00', quantidade: 0 },
                { hora: '01', quantidade: 0 },
                { hora: '02', quantidade: 0 },
                { hora: '03', quantidade: 0 },
                { hora: '04', quantidade: 0 },
                { hora: '05', quantidade: 0 },
                { hora: '06', quantidade: 0 },
                { hora: '07', quantidade: 0 },
                { hora: '08', quantidade: 0 },
                { hora: '09', quantidade: 0 },
                { hora: '10', quantidade: 0 },
                { hora: '11', quantidade: 0 },
                { hora: '12', quantidade: 0 },
                { hora: '13', quantidade: 0 },
                { hora: '14', quantidade: 0 },
                { hora: '15', quantidade: 0 },
                { hora: '16', quantidade: 0 },
                { hora: '16', quantidade: 0 },
                { hora: '18', quantidade: 0 },
                { hora: '19', quantidade: 0 },
                { hora: '20', quantidade: 0 },
                { hora: '21', quantidade: 0 },
                { hora: '22', quantidade: 0 },
                { hora: '23', quantidade: 0 },
            ];
            let resultado = { chat: horas, ChatFlexIA: horas, telegram: horas, whatsapp: horas, facebook: horas };

            for (const canal of canais) {
                for (var dias = 0; dias <= numDias; dias++) {
                    // Hora 00:00
                    resultado[canal][0].quantidade = resultado[canal][0].quantidade + await ConversaEncerrada.countDocuments({
                        'hora_criacao': {
                            $gte: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T00:00:00.000Z'),
                            $lt: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T00:59:59.999Z')
                        },
                        'canal': canal
                    });
                    // Hora 01:00
                    resultado[canal][1].quantidade = resultado[canal][1].quantidade + await ConversaEncerrada.countDocuments({
                        'hora_criacao': {
                            $gte: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T01:00:00.000Z'),
                            $lt: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T01:59:59.999Z')
                        },
                        'canal': canal
                    });
                    // Hora 02:00
                    resultado[canal][2].quantidade = resultado[canal][2].quantidade + await ConversaEncerrada.countDocuments({
                        'hora_criacao': {
                            $gte: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T02:00:00.000Z'),
                            $lt: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T02:59:59.999Z')
                        },
                        'canal': canal
                    });
                    // Hora 03:00
                    resultado[canal][3].quantidade = resultado[canal][3].quantidade + await ConversaEncerrada.countDocuments({
                        'hora_criacao': {
                            $gte: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T03:00:00.000Z'),
                            $lt: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T03:59:59.999Z')
                        },
                        'canal': canal
                    });
                    // Hora 04:00
                    resultado[canal][4].quantidade = resultado[canal][4].quantidade + await ConversaEncerrada.countDocuments({
                        'hora_criacao': {
                            $gte: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T04:00:00.000Z'),
                            $lt: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T04:59:59.999Z')
                        },
                        'canal': canal
                    });
                    // Hora 05:00
                    resultado[canal][5].quantidade = resultado[canal][5].quantidade + await ConversaEncerrada.countDocuments({
                        'hora_criacao': {
                            $gte: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T05:00:00.000Z'),
                            $lt: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T05:59:59.999Z')
                        },
                        'canal': canal
                    });
                    // Hora 06:00
                    resultado[canal][6].quantidade = resultado[canal][6].quantidade + await ConversaEncerrada.countDocuments({
                        'hora_criacao': {
                            $gte: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T06:00:00.000Z'),
                            $lt: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T06:59:59.999Z')
                        },
                        'canal': canal
                    });
                    // Hora 07:00
                    resultado[canal][7].quantidade = resultado[canal][7].quantidade + await ConversaEncerrada.countDocuments({
                        'hora_criacao': {
                            $gte: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T07:00:00.000Z'),
                            $lt: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T07:59:59.999Z')
                        },
                        'canal': canal
                    });
                    // Hora 08:00
                    resultado[canal][8].quantidade = resultado[canal][8].quantidade + await ConversaEncerrada.countDocuments({
                        'hora_criacao': {
                            $gte: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T08:00:00.000Z'),
                            $lt: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T08:59:59.999Z')
                        },
                        'canal': canal
                    });
                    // Hora 09:00
                    resultado[canal][9].quantidade = resultado[canal][9].quantidade + await ConversaEncerrada.countDocuments({
                        'hora_criacao': {
                            $gte: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T09:00:00.000Z'),
                            $lt: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T09:59:59.999Z')
                        },
                        'canal': canal
                    });
                    // Hora 10:00
                    resultado[canal][10].quantidade = resultado[canal][10].quantidade + await ConversaEncerrada.countDocuments({
                        'hora_criacao': {
                            $gte: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T10:00:00.000Z'),
                            $lt: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T10:59:59.999Z')
                        },
                        'canal': canal
                    });
                    // Hora 11:00
                    resultado[canal][11].quantidade = resultado[canal][11].quantidade + await ConversaEncerrada.countDocuments({
                        'hora_criacao': {
                            $gte: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T11:00:00.000Z'),
                            $lt: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T11:59:59.999Z')
                        },
                        'canal': canal
                    });
                    // Hora 12:00
                    resultado[canal][12].quantidade = resultado[canal][12].quantidade + await ConversaEncerrada.countDocuments({
                        'hora_criacao': {
                            $gte: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T12:00:00.000Z'),
                            $lt: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T12:59:59.999Z')
                        },
                        'canal': canal
                    });
                    // Hora 13:00
                    resultado[canal][13].quantidade = resultado[canal][13].quantidade + await ConversaEncerrada.countDocuments({
                        'hora_criacao': {
                            $gte: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T13:00:00.000Z'),
                            $lt: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T13:59:59.999Z')
                        },
                        'canal': canal
                    });
                    // Hora 14:00
                    resultado[canal][14].quantidade = resultado[canal][14].quantidade + await ConversaEncerrada.countDocuments({
                        'hora_criacao': {
                            $gte: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T14:00:00.000Z'),
                            $lt: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T14:59:59.999Z')
                        },
                        'canal': canal
                    });
                    // Hora 15:00
                    resultado[canal][15].quantidade = resultado[canal][15].quantidade + await ConversaEncerrada.countDocuments({
                        'hora_criacao': {
                            $gte: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T15:00:00.000Z'),
                            $lt: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T15:59:59.999Z')
                        },
                        'canal': canal
                    });
                    // Hora 16:00
                    resultado[canal][16].quantidade = resultado[canal][16].quantidade + await ConversaEncerrada.countDocuments({
                        'hora_criacao': {
                            $gte: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T16:00:00.000Z'),
                            $lt: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T16:59:59.999Z')
                        },
                        'canal': canal
                    });
                    // Hora 17:00
                    resultado[canal][17].quantidade = resultado[canal][17].quantidade + await ConversaEncerrada.countDocuments({
                        'hora_criacao': {
                            $gte: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T17:00:00.000Z'),
                            $lt: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T17:59:59.999Z')
                        },
                        'canal': canal
                    });
                    // Hora 18:00
                    resultado[canal][18].quantidade = resultado[canal][18].quantidade + await ConversaEncerrada.countDocuments({
                        'hora_criacao': {
                            $gte: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T18:00:00.000Z'),
                            $lt: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T18:59:59.999Z')
                        },
                        'canal': canal
                    });
                    // Hora 19:00
                    resultado[canal][19].quantidade = resultado[canal][19].quantidade + await ConversaEncerrada.countDocuments({
                        'hora_criacao': {
                            $gte: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T19:00:00.000Z'),
                            $lt: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T19:59:59.999Z')
                        },
                        'canal': canal
                    });
                    // Hora 20:00
                    resultado[canal][20].quantidade = resultado[canal][20].quantidade + await ConversaEncerrada.countDocuments({
                        'hora_criacao': {
                            $gte: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T20:00:00.000Z'),
                            $lt: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T20:59:59.999Z')
                        },
                        'canal': canal
                    });
                    // Hora 21:00
                    resultado[canal][21].quantidade = resultado[canal][21].quantidade + await ConversaEncerrada.countDocuments({
                        'hora_criacao': {
                            $gte: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T21:00:00.000Z'),
                            $lt: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T21:59:59.999Z')
                        },
                        'canal': canal
                    });
                    // Hora 22:00
                    resultado[canal][22].quantidade = resultado[canal][22].quantidade + await ConversaEncerrada.countDocuments({
                        'hora_criacao': {
                            $gte: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T22:00:00.000Z'),
                            $lt: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T22:59:59.999Z')
                        },
                        'canal': canal
                    });
                    // Hora 23:00
                    resultado[canal][23].quantidade = resultado[canal][23].quantidade + await ConversaEncerrada.countDocuments({
                        'hora_criacao': {
                            $gte: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T23:00:00.000Z'),
                            $lt: new Date(dateFns.format(dataCalc, "YYYY-MM-DD") + 'T23:59:59.999Z')
                        },
                        'canal': canal
                    });

                    // console.log(`canal: ${canal}`);
                    // console.log(dateFns.format(dataCalc, "YYYY/MM/DD"));
                    dataCalc = dateFns.addDays(dataCalc, 1);
                }
                dataCalc = new Date(dataInicial);
                dataCalc = dateFns.addDays(dataCalc, 1);
                // console.log('---------------------------------------------------------------');
            }
            res.json(resultado);
        } catch (err) {
            console.log(err);
            res.status(500).json(err);
        }
    },

    getVersion: async (req, res) => {
        res.status(200).json({ version: pjson.version, stability: pjson.stability, date: pjson.date });
    }
}