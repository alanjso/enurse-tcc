const dateUtil = require('./date-util');

module.exports = {
    // Recebe Um Nome de label para operador e um array de conversas e calcula Tempos
    getPerformanceOperador(atendente, arrayConversas) {
        let totalSatisfacao = 0;
        let countSatisfacao = 0;
        let tta = 0;
        let tte = 0;
        let ttd = 0;
        let countTime = 0;
        let countTMD = 0;
        let qtdeConversas = arrayConversas.length;

        let performance = [
            atendente,
            countSatisfacao,
            totalSatisfacao,
            qtdeConversas,
            countTime,
            tta,
            tte,
            tta,
            // tte
        ];
        if (arrayConversas.length > 0) {

            for (const conversa of arrayConversas) {
                if (conversa.hora_criacao && conversa.hora_do_atendimento && conversa.hora_fim_conversa) {
                    // TME
                    tte = tte + dateUtil.calcDifferenceInSeconds(conversa.hora_criacao, conversa.hora_do_atendimento);
                    // TMA
                    tta = tta + dateUtil.calcDifferenceInSeconds(conversa.hora_do_atendimento, conversa.hora_fim_conversa);
                    // Total de atendimentos
                    countTime++;
                } else if (conversa.hora_criacao && !conversa.hora_do_atendimento && conversa.hora_fim_conversa) {
                    // TMD
                    ttd = ttd + dateUtil.calcDifferenceInSeconds(conversa.hora_criacao, conversa.hora_fim_conversa);
                    // Total de desistencias
                    countTMD++;
                }

                if (conversa.satisfacao_do_cliente) {
                    totalSatisfacao = totalSatisfacao + conversa.satisfacao_do_cliente;
                    countSatisfacao++;
                }
            }
            // TODO: formatar array de retorno para o relatório
            //  0 "Atendente",
            //  1 "Quantidade de Conversas Satisfação",
            //  2 "Satisfação Média",
            //  3 "Quantidade de Conversas Total",
            //  4 "Quantidade de Conversas TMA/TME/TTA",
            //  5 "TMA",
            //  6 "TME",
            //  7 "TTA",
            //  8 "TTE",  
            performance[1] = countSatisfacao;
            performance[2] = (totalSatisfacao / countSatisfacao);
            performance[3] = arrayConversas.length;
            performance[4] = countTime;
            performance[5] = dateUtil.calcTempoMedio(tta, countTime);
            performance[6] = dateUtil.calcTempoMedio(tte, countTime);
            performance[7] = dateUtil.calcTempoMedio(tta, 1);
            // performance[8] = dateUtil.calcTempoMedio(tte, 1);
            return performance;
        } else {
            return performance;
        }
    }
};