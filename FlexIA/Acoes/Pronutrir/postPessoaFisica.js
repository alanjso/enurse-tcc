const rp = require('request-promise-native');
const config = require('config');

module.exports = {
    postPessoaFisica: async (parametros) => {
        try {
            console.log(`Todos os parametros do novo paciente: \n${JSON.stringify(parametros)}`);

            let body = {
                "iE_TIPO_PESSOA": 2,
                "iE_FUNCIONARIO": "N",
                "nM_PESSOA_FISICA": parametros.nome_paciente,
                "dT_ATUALIZACAO": new Date(),
                "nR_TELEFONE_CELULAR": parametros.celular,
                "dT_NASCIMENTO": parametros.data_nascimento,
                "nM_USUARIO": "flexia",
            }

            const pessoaFisicaCriada = await rp({
                method: 'POST',
                uri: `${config.get('baseUrlPronutrir')}/api/v1/PessoaFisica`,
                encoding: "utf-8",
                json: true,
                headers: {
                    Authorization: `Bearer ${parametros.token}`,
                    // Connection: 'keep-alive',
                },
                body
            });

            if (pessoaFisicaCriada.statusCode == 200) {

                const { result } = await rp({
                    method: 'GET',
                    uri: `${config.get('baseUrlPronutrir')}/api/v1/PessoaFisica/filtroNomeTelefoneNascimento?dataNascimento=${pessoaFisicaCriada.result.dT_NASCIMENTO}`,
                    qs: { nomePaciente: pessoaFisicaCriada.result.nM_PESSOA_FISICA },
                    encoding: "utf-8",
                    json: true,
                    headers: {
                        Authorization: `Bearer ${parametros.token}`,
                        // Connection: 'keep-alive',
                    }
                });

                let pacientePessoaFisica = result;
                let nr_oculto = result.nR_TELEFONE_CELULAR;
                let tamanho = nr_oculto.length - 4;
                pacientePessoaFisica.nR_TELEFONE_CELULAR_OCULTO = `(**)****-${nr_oculto.substring(tamanho, nr_oculto.length)}`;

                console.log(`Resposta Criar Pessoa Fisica\n `, pacientePessoaFisica);
                return pacientePessoaFisica;
            } else {
                return null
            }
        } catch (error) {
            console.log('Error in postPessoaFisica');
            console.log(error);
            return error;
        }
    },
}