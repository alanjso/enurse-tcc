let Conversa = require('./conversa.model');

module.exports = async function (idConvera, nota) {

    let conversa = await Conversa.find({ _id: idConvera });

    conversa.satisfacao_do_cliente = nota;

    return conversa;
}