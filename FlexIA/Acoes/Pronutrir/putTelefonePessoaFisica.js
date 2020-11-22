const rp = require('request-promise-native');
const config = require('config');

module.exports = {
    putTelefonePessoaFisica: async (parametros) => {
        try {
            console.log(`Todos os parametros da consulta: \n${JSON.stringify(parametros)}`);

            let body = {
                "cD_PESSOA_FISICA": parametros.pacienteEscolhido.cD_PESSOA_FISICA,
                "iE_TIPO_PESSOA": parametros.pacienteEscolhido.iE_TIPO_PESSOA,
                "iE_FUNCIONARIO": parametros.pacienteEscolhido.iE_FUNCIONARIO,
                "nM_PESSOA_FISICA": parametros.pacienteEscolhido.nM_PESSOA_FISICA,
                "nR_CPF": parametros.pacienteEscolhido.nR_CPF,
                "dT_ATUALIZACAO": new Date(),
                "nR_TELEFONE_CELULAR": parametros.novo_celular,
                "dT_NASCIMENTO": parametros.pacienteEscolhido.dT_NASCIMENTO,
                "nM_USUARIO": "flexia", //parametros.pacienteEscolhido.nM_USUARIO,
            }

            const putTelefonePessoaFisica = await rp({
                method: 'PUT',
                uri: `${config.get('baseUrlPronutrir')}/api/v1/PessoaFisica/${body.cD_PESSOA_FISICA}`,
                encoding: "utf-8",
                json: true,
                headers: {
                    Authorization: `Bearer ${parametros.token}`,
                    // Connection: 'keep-alive',
                },
                body
            });

            console.log(`Resposta put Telefone Pessoa Fisica\n `, putTelefonePessoaFisica);
            if (putTelefonePessoaFisica.statusCode == 200) {
                let nr_oculto = putTelefonePessoaFisica.result.nR_TELEFONE_CELULAR;
                let tamanho = nr_oculto.length - 4;
                let updatePaciente = putTelefonePessoaFisica.result;
                updatePaciente.nR_TELEFONE_CELULAR_OCULTO = `(**)****-${nr_oculto.substring(tamanho, nr_oculto.length)}`;

                return updatePaciente;
            } else {
                return null
            }
        } catch (error) {
            console.log('Error in putTelefonePessoaFisica');
            console.log(error);
            return error;
        }
    },
}