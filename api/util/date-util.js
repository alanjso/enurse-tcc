const { format, differenceInSeconds, isValid, getISODay } = require("date-fns");

module.exports = {

  getDateFormatted(date, pattern = "DD/MM/YYYY HH:mm:ss") {
    const dateFormatted = format(date, pattern);
    return dateFormatted == 'Invalid Date' ? '' : dateFormatted;
  },

  calcDifference(initialDate, finalDate) {
    try {
      if (initialDate && finalDate && isValid(initialDate) && isValid(finalDate)) {
        const diffInSeconds = differenceInSeconds(
          finalDate,
          initialDate,
          {
            unit: 's'
          }
        );
        let days = Math.floor(diffInSeconds / 86400);
        let hours = Math.floor(diffInSeconds / 3600) - days * 24;
        let minutes =
          Math.floor(diffInSeconds / 60) - hours * 60 - days * 1440;
        let seconds =
          diffInSeconds - hours * 3600 - minutes * 60 - days * 86400;
        hours += 24 * days;
        if (hours < 10) {
          hours = '0' + hours;
        }
        if (minutes < 10) {
          minutes = '0' + minutes;
        }
        if (seconds < 10) {
          seconds = '0' + seconds;
        }

        return `${hours}:${minutes}:${seconds}`;
      }
    } catch (error) {
      console.log('Erro ao calcular Tempo de espera ou atendimento', error);
    }
    return 'Sem tempo definido';
  },

  calcDifferenceInSeconds(initialDate, finalDate) {
    try {
      if (initialDate && finalDate && isValid(initialDate) && isValid(finalDate)) {
        const diffInSeconds = differenceInSeconds(
          finalDate,
          initialDate,
          { unit: 's' }
        );

        return diffInSeconds;
      }
    } catch (error) {
      console.log('Erro ao calcular diferença de tempo em segundos', error);
    }
    return 'Invalid Date';
  },

  calcTempoMedio(totalTime, count) {
    try {
      if (count > 0) {
        const averageTimeInSeconds = totalTime / count;

        let days = Math.floor(averageTimeInSeconds / 86400);
        let hours = Math.floor(averageTimeInSeconds / 3600) - days * 24;
        let minutes = Math.floor(averageTimeInSeconds / 60) - hours * 60 - days * 1440;
        let seconds = Math.floor(averageTimeInSeconds - hours * 3600 - minutes * 60 - days * 86400);
        hours += 24 * days;

        if (hours < 10) {
          hours = '0' + hours;
        }
        if (minutes < 10) {
          minutes = '0' + minutes;
        }
        if (seconds < 10) {
          seconds = '0' + seconds;
        }

        // Tempo Médio Formatado
        return `${hours}:${minutes}:${seconds}`;
      } else {
        return '00:00:00'
      }
    } catch (error) {
      console.log('Erro ao calcular Tempo de espera ou atendimento', error);
    }
    return '00:00:00';
  },

  getDiaSemana() {
    let diaSemana = getISODay(new Date())
    let today = '';

    if (diaSemana == 1) {
      today = 'SEGUNDA';
    } else if (diaSemana == 2) {
      today = 'TERÇA';
    } else if (diaSemana == 3) {
      today = 'QUARTA';
    } else if (diaSemana == 4) {
      today = 'QUINTA';
    } else if (diaSemana == 5) {
      today = 'SEXTA';
    } else if (diaSemana == 6) {
      today = 'SÁBADO';
    } else if (diaSemana == 7) {
      today = 'DOMINGO';
    }

    return today;
  }
};
