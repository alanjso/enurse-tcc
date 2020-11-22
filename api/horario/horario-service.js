const moment = require('moment');
const Horario = require('./horario-model');

async function criaHorarioDefault() {
    await Horario.count({}, (err, count) => {
        if (err) return console.error(`horario-service Error: ${err}`);

        if (count == 0) {
            Horario.create({
                horarioInicio: moment('07:00am', 'h:mma'),
                horarioFim: moment('09:00pm', 'h:mma')
            });
        }
    })
}


module.exports = {
    setHorarioAtendimento: async (req, res) => {
        await criaHorarioDefault();
        Horario.findOne({}, async (err, res) => {
            if (err) return console.error(`setHorarioAtendimento error: ${err}`)
            await Horario.findOneAndUpdate({ _id: res._id }, {
                horarioInicio: moment(req.body.horarioInicio, "h:mma"),
                horarioFim: moment(req.body.horarioFim, "h:mma")
            });
        });
        res.status(200).json("");
    },
    getHorarioAtendimento: async (req, response) => {
        await criaHorarioDefault();
        Horario.findOne({}, (err, res) => {
            if (err) return console.error(`getHorarioAtendimento error: ${err}`)
            return response.status(200).json(res);
        });
    }
}