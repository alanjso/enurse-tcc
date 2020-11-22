class RelatorioAnaliticoFormulario {

    constructor(req) {
        this.fila = req.query.fila;
        this.atendente = req.query.atendente;
        this.dataInicial = req.query.dataInicial;
        this.dataFinal = req.query.dataFinal;
        this.cpf = req.query.cpf;
    }

    toJson() {
        return {
            fila: this.fila,
            atendente: this.atendente,
            cpf: this.cpf,
            hora_criacao: {
                '$gte': new Date(this.dataInicial + 'T00:00:00Z'),
                '$lt': new Date(this.dataFinal + 'T23:59:59Z')
            }
        }
    }
}

module.exports = RelatorioAnaliticoFormulario;