var formatData = require('date-fns/format')

const redis = require('../../config/database-redis-config');
const Conversa = require('../conversa/conversa_atendimento.model');
const Usuario = require('../user/user-model');

module.exports = function () {

  return new Promise((resolve, reject) => {

    redis.lrange('atendentes_logados', 0, -1, async function (err, atendentesId) {

      const conversasEmAtendimento = await Conversa.find();

      let usuarios = await Usuario.find({ _id: { $in: atendentesId } });

      let resultadoMap = usuarios.map(async (usuario) => {
        let quandidadeDeConversa = await Conversa.find({ 'atendente._id': usuario._id }).countDocuments();
        return {
          id: usuario._id,
          nome: usuario.nome,
          quantidade: quandidadeDeConversa
        }
      });

      let atendentesDTO = await Promise.all(resultadoMap);

      // console.log('atendentesDTO');

      resolve({
        conversas: conversasEmAtendimento,
        atendentes: atendentesDTO
      })
    });


  });
}