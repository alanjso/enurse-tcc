const mongoose = require("mongoose");

const horarioSchema = mongoose.Schema({
    horarioInicio: {
        type: Date
    },
    horarioFim: {
        type: Date
    }
});

const horario = mongoose.model("Horario", horarioSchema);

module.exports = horario;