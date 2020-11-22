const TrataAcoes = require("./TrataAcoes");
const ConversaAtendimento = require("../../api/conversa/conversa_atendimento.model");
const ConversaEncerrada = require("../../api/conversa/conversa.model");
const Contato = require('../../api/contato/contato.model');

class AcaoUnificaContato extends TrataAcoes {
    constructor() {
        super();
    }

    setSucessor(sucessor) {
        this.sucessor = sucessor;
    }

    async trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem) {
        //('Passou em AcaoUnificaContato');
        try {
            if (acao === 'unificaContato') {
                // console.log(`entrou em AcaoUnificaContato`);
                let cliente = {};
                let email = '';
                let celular = '';
                if (responseFlexIA.output.user_defined.actions[0].parameters.email) email = responseFlexIA.output.user_defined.actions[0].parameters.email;
                if (responseFlexIA.output.user_defined.actions[0].parameters.telefone) celular = responseFlexIA.output.user_defined.actions[0].parameters.telefone;

                let contato = await Contato.findOne({ 'email': email });
                if (contato) {
                    // Mescla && Atualiza o contato && Atualiza conversas antigas
                    // Mescla
                    cliente._id = contato._id;
                    cliente.nome = conversa.cliente.nome ? conversa.cliente.nome : contato.nome;
                    cliente.email = contato.email;
                    cliente.celular = conversa.cliente.celular ? conversa.cliente.celular : contato.celular;
                    cliente.id_telegram = conversa.cliente.id_telegram ? conversa.cliente.id_telegram : contato.id_telegram;
                    cliente.id_facebook = conversa.cliente.id_facebook ? conversa.cliente.id_facebook : contato.id_facebook;
                    // Atualiza contato
                    await Contato.findByIdAndUpdate(contato._id, {
                        $set:
                        {
                            nome: cliente.nome,
                            email: cliente.email,
                            celular: cliente.celular,
                            id_telegram: cliente.id_telegram,
                            id_facebook: cliente.id_facebook
                        }
                    });

                    // Atualiza conversas antigas
                    // await ConversaEncerrada.updateMany(
                    //     { 'cliente._id': conversa.cliente._id },
                    //     {
                    //         $set: {
                    //             cliente: cliente
                    //         }
                    //     });

                    const conversasAntigas = await ConversaEncerrada.find({ 'cliente._id': conversa.cliente._id });
                    if (conversasAntigas.length > 0) {
                        for (const conversaAntiga of conversasAntigas) {
                            await ConversaEncerrada.findByIdAndUpdate(conversaAntiga._id,
                                {
                                    $set:
                                    {
                                        cliente: cliente
                                    }
                                });
                        }
                    }

                    // Apaga contato novo
                    if (conversa.cliente._id != contato._id) {
                        await Contato.findByIdAndDelete(conversa.cliente._id);
                    }
                } else {
                    // Atualiza novo contato
                    cliente.nome = conversa.cliente.nome ? conversa.cliente.nome : '';
                    cliente.email = conversa.cliente.email ? conversa.cliente.email : email;
                    cliente.celular = conversa.cliente.celular ? conversa.cliente.celular : celular;
                    cliente.id_telegram = conversa.cliente.id_telegram ? conversa.cliente.id_telegram : '';
                    cliente.id_facebook = conversa.cliente.id_facebook ? conversa.cliente.id_facebook : '';
                    await Contato.findByIdAndUpdate(conversa.cliente._id, {
                        $set:
                        {
                            nome: cliente.nome,
                            email: cliente.email,
                            celular: cliente.celular,
                            id_telegram: cliente.id_telegram,
                            id_facebook: cliente.id_facebook
                        }
                    });
                }

                // Atualiza conversa em atendimento
                conversa = await ConversaAtendimento.findByIdAndUpdate(conversa._id,
                    {
                        $set:
                        {
                            cliente: cliente,
                        }
                    });

                return true;
            } else {
                return await this.sucessor.trataAcao(acao, conversa, responseFlexIA, flexIA_Assistente, origem);
            }
        } catch (err) {
            log.error('** Erro na Action Unifica Contato **');
            log.error(`** Erro: ${err} **`);
        }
    }
}

module.exports = new AcaoUnificaContato();