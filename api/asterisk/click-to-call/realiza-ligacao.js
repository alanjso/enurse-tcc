const ami = require('../connections');

async function realizaLigacao(origem, destino, otherVariable) {
  ami.action({
    Action: 'Originate',
    ActionID: 1,
    Channel: `LOCAL/${origem}@INTERNO`,
    Exten: destino,
    Priority: 1,
    Timeout: 30000,
    Context: 'DDD_CEL_EXT',
    CallerID: `${otherVariable} <${destino}>`,

    async: true,
  }, (err) => {
    console.log(err);
  });
}

module.exports = realizaLigacao;