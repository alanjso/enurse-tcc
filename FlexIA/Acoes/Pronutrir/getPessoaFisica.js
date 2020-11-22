const rp = require('request-promise-native');
const config = require('config');

module.exports = {
    getPessoaFisica: async (parametros) => {
        try {
            console.log(`Pessoa fisica parametros: ${JSON.stringify(parametros)}`);
            const respostaPessoaFisica = await rp({
                method: 'GET',
                uri: `${config.get('baseUrlPronutrir')}/api/v1/PessoaFisica/filtroNomeTelefoneNascimento?dataNascimento=${parametros.dt_nascimento}T00:00:00`,
                qs: { nomePaciente: parametros.nm_paciente },
                encoding: "utf-8",
                json: true,
                headers: {
                    Authorization: `Bearer ${parametros.token}`,
                    // Connection: 'keep-alive',
                }
            });

            console.log(`Pessoa Fisica encontrada: `, respostaPessoaFisica);
            // let lastAgenda = null;
            let pessoaFisica = null;

            if (respostaPessoaFisica.statusCode == 200 && respostaPessoaFisica.result) {
                pessoaFisica = respostaPessoaFisica.result;

                // let { result } = await rp({
                //     method: 'GET',
                //     uri: `${config.get('baseUrlPronutrir')}/api/v1/AgendaConsultas/filtroValidaDadosPaciente?dataNascimento=${respostaPessoaFisica.result.dT_NASCIMENTO}`,
                //     qs: { nomePaciente: respostaPessoaFisica.result.nM_PESSOA_FISICA },
                //     encoding: "utf-8",
                //     json: true,
                //     headers: {
                //         Authorization: `Bearer ${parametros.token}`,
                //         Connection: 'keep-alive',
                //     }
                // });
                // lastAgenda = result;
                // lastAgenda.cD_PESSOA_FISICA = respostaPessoaFisica.result.cD_PESSOA_FISICA;

                if (pessoaFisica.nR_TELEFONE_CELULAR) {
                    let nr_oculto = pessoaFisica.nR_TELEFONE_CELULAR;
                    let tamanho = nr_oculto.length - 4;
                    pessoaFisica.nR_TELEFONE_CELULAR_OCULTO = `(**)****-${nr_oculto.substring(tamanho, nr_oculto.length)}`;
                    // pessoaFisica.nR_TELEFONE_CELULAR_OCULTO = lastAgenda.nR_TELEFONE_CELULAR_OCULTO;
                }

                console.log('Pessoa Fisica: ', pessoaFisica);
            }

            return pessoaFisica;
        } catch (error) {
            console.log('Error in getPessoaFisica');
            console.log(error);
            return error;
        }
    },
}