const Conversa = require("../conversa/conversa.model");
const Contato = require('../contato/contato.model');
const Horario = require('../horario/horario-model');
const Predefinidas = require('../msgs-predefinidas/msgs-predefinidas.model');
const Usuario = require('../user/user-model');
const MensagemFila = require('../mensagemFila/mensagemFila-model');
const enviaEmail = require('../util/emailSender');
const rp = require("request-promise-native");
const config = require("config");
const Fila = require("./fila-model");
const sendToSalesforce = require("../services/sendToSalesforce");
const moment = require("moment");
const yup = require('yup');
const log = require('../util/logs');
const quantidadeDeConversaPorPagina = 10;
const mensagemInicial = {
  escrita_por: "Unifor",
  texto: Predefinidas.findOne({ tipo: "saudacao" }),
  cliente_ou_atendente: "atendente",
  response_type: "text"
}
var ObjectId = require('mongodb').ObjectID;

const emitter = require('events').EventEmitter;
const eventEmit = new emitter();

eventEmit.on('atualizaConversaFila', async (nome, nomeNovo) => {
  try {
    await Conversa.updateMany({ fila: nome }, { $set: { fila: nomeNovo } });
  } catch (error) {
    log.error('** Erro no evento atualizaConversaFila **');
    log.error(`** Erro: ${error} **`);
  }
});

const makeSFCreateCase = obj =>

  new Promise((resolve, reject) => {
    try {
      const obj_sf = {};
      obj_sf.cpf = obj.cliente.cpf;
      obj_sf.email = obj.cliente.email;
      obj_sf.celular = obj.cliente.celular;
      obj_sf.nome = obj.cliente.nome;
      obj_sf.fila = obj.fila;
      //obj_sf.codigo_agente = obj.atendente.codigoDoAgente;
      resolve(obj_sf);
    } catch (err) {
      log.error('** Erro no makeSFCreateCase **');
      log.error(`** Erro: ${err} **`);
    }
  });

module.exports = {
  removeClientFromQueue: (req, res) => {
    //console.log(req.body);
    Conversa.updateOne(
      {
        _id: req.body.numeroDaSala
      },
      {
        $set: {
          atendente: {
            _id: req.body.atendente._id,
            name: req.body.atendente.nome
          },
          id_socket_atendente: req.body.socketId,
          hora_do_atendimento: Date.now(),
          atendida: true,
          situacao: "em_atendimento"
        }
      }
    )
      .then(response => {
        res.status(200).json(response);
      })
      .catch(err => {
        res.json(err);
      });
  },

  addClientInQueue: async (req, res) => {
    let horario_de_atendimento = await Horario.findOne({});
    let time = moment(Date.now());

    if (time.isAfter(horario_de_atendimento.horarioInicio) && time.isBefore(horario_de_atendimento.horarioFim)) {
      try {

        let cont = await Contato.findOne({ "email": req.body.email });
        let cliente = cont ? cont : await Contato.create(req.body);
        // console.log('*********', req.body);
        //verificar se existe uma conversa sem ser encerrada para esse cliente
        let conversaNaoEncerrada = await Conversa.findOne({ 'cliente.email': req.body.email, 'encerrada': false });
        //(conversaNaoEncerrada)
        if (conversaNaoEncerrada) {
          res.status(200).json({ msg: 'conversa_iniciada' });
          return;
        }

        const conversa = await Conversa.create({
          cliente: cliente,
          fila: req.body.fila,
          canal: "chat",
          atendimentoBot: false,
          origem: req.body.origemChamada,
          situacao: "nao_atendida",
          id_socket_cliente: req.body.socketId,
          mensagens: [mensagemInicial]
        });

        if (config.get("usa_salesforce")) {
          const obj_sf = await makeSFCreateCase(conversa);
          sendToSalesforce(
            obj_sf,
            config.get("salesforce_url") + "/chat/criarcaso",
            "POST"
          )
            .then(async data => {
              await Conversa.updateOne(
                { _id: conversa.id },
                { $set: { idSF: data } }
              );
            })
            .catch(err => {
              console.log(err);
            });
        }
        res.status(200).json({ conversa: conversa.id });
      } catch (err) {
        log.error('** Erro ao adicionar cliente na fila **');
        log.error(`** Erro: ${err} **`);
      }
    } else {
      await enviaEmail(req.body.email, 'Titulo Teste', 'Oi testando', '');
      res.status(200).json({ msg: "fora_horario" });
    }
  },

  verifyIfClientInQueue: (req, res) => {
    Conversa.findOne({
      atendida: false
    })
      .where("_id")
      .equals(req.body.idDaConversa)
      .then(conversa => {
        if (conversa) {
          res.status(200).json("ok");
        } else {
          res.status(201).json("ok");
        }
      })
      .catch(err => {
        res.json(err);
      });
  },

  listaClientesEmFila: (req, res) => {
    //("Servico: listaClientesEmFila");
    const filaDoUsuario = req.params.fila;

    Conversa.find({ fila: filaDoUsuario, atendida: false })
      .then(conversas => {
        res.json(conversas);
      })
      .catch(err => {
        //log.error('** Erro em  listaClientesEmFila**')
        //log.error(`** Erro: ${err} **`)
        console.log(err, new Date());
        res.json(err);
      });
  },

  listaClientesEmTodasAsFilas: async (req, res) => {
    // console.log("Servico: listaClientesEmTodasAsFilas ", new Date());
    let clientesEmFila = await Conversa.find({ atendida: false });
    res.status(200).json({ clientesEmFila });
  },

  /*
        Quando um cliente for atendido ele vai continuar aparecendo no painel da fila, só vai aparecer dizendo que ele foi atendido
        com o atributo atendido vai ser possivel saber o que aconteceu com o cliente
    */
  V2listaClientesEmTodasAsFilas: async (req, res) => {
    //console.log("Service: V2listaClientesEmTodasAsFilas ", new Date());
    let clientesEmFila = await Conversa.find({ encerrada: false });
    res.status(200).json({ clientesEmFila });
  },

  save: async (req, res) => {

    let schema = yup.object().shape({
      nome: yup.string().required(),
      descricao: yup.string().required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json('');
    }

    const filaExists = await Fila.findOne({ nome: req.body.nome });

    if (filaExists) {
      return res.status(400).json({ error: 'Fila já existe' });
    }

    const fila = Fila.create(req.body);
    res.status(202).json("");
  },

  listaComFiltros: async (req, res) => {
    let pagina = req.query.pagina;
    let filtro = req.query.filtro;

    try {
      let quantidadeDeFilas = await Fila.find({
        "$or": [
          { "nome": { $regex: `${filtro}`, '$options': 'i' } },
          { "descricao": { $regex: `${filtro}`, '$options': 'i' } },
          { "cor": { $regex: `${filtro}`, '$options': 'i' } }
        ]
      })
        .countDocuments();

      const filas = await Fila.find({
        "$or": [
          { "nome": { $regex: `${filtro}`, '$options': 'i' } },
          { "descricao": { $regex: `${filtro}`, '$options': 'i' } },
          { "cor": { $regex: `${filtro}`, '$options': 'i' } }
        ]
      })
        .skip(quantidadeDeConversaPorPagina * (pagina - 1))
        .limit(quantidadeDeConversaPorPagina)
        .sort({ nome: 1 })

      res.status(200).json({ filas, quantidadeDeFilas });
    } catch (err) {
      console.log("Erro na lista com filtros:", err);
      res.status(500).json();
    }
  },

  list: async (req, res) => {
    const filas = await Fila.find().sort({ nome: 1 });
    res.status(200).json(filas);
  },

  remove: async (req, res) => {

    // Removing fila from users
    let users = await Usuario.find({ "filas._id": ObjectId(req.params.id) });
    for (let i = 0; i < users.length; i++) {
      for (let j = 0; j < users[i].filas.length; j++) {
        if (users[i].filas[j]._id == req.params.id) {
          users[i].filas.splice(j, 1)
          users[i].markModified('filas');
          await users[i].save()
        }
      }
    }

    // Removing fila from users - working
    let msgs = await MensagemFila.find({ "filas._id": req.params.id })
    for (let i = 0; i < msgs.length; i++) {
      for (let j = 0; j < msgs[i].filas.length; j++) {
        if (msgs[i].filas[j]._id == req.params.id) {
          msgs[i].filas.splice(j, 1)
          msgs[i].markModified('filas');
          await msgs[i].save()
        }
      }
    }

    // Deleting fila
    await Fila.findByIdAndDelete(req.params.id);
    res.status(200).json("");
  },

  update: async (req, res) => {
    try {
      const filaExists = await Fila.findOne({ _id: { $ne: req.params.id }, nome: req.body.nome });

      if (filaExists) {
        // console.log(filaExists)
        return res.status(400).json({ error: 'Fila já existe' });
      }

      let fila = await Fila.findById(req.params.id);
      await Fila.findByIdAndUpdate(req.params.id, req.body);
      if (fila.nome != req.body.nome) eventEmit.emit('atualizaConversaFila', fila.nome, req.body.nome);
      //await Conversa.updateMany({ fila: fila.nome }, { $set: { fila: req.body.nome}});

      //Updating fila from users
      let users = await Usuario.find({ "filas._id": ObjectId(req.params.id) });
      for (let i = 0; i < users.length; i++) {
        for (let j = 0; j < users[i].filas.length; j++) {
          if (users[i].filas[j]._id == req.params.id) {
            if (req.body.nome != null) users[i].filas[j].nome = req.body.nome
            if (req.body.descricao != null) users[i].filas[j].descricao = req.body.descricao
            users[i].markModified('filas');
            await users[i].save()
          }
        }
      }

      //Updating fila from mensagensFila
      let msgs = await MensagemFila.find({ 'filas._id': req.params.id });
      for (let i = 0; i < msgs.length; i++) {
        for (let j = 0; j < msgs[i].filas.length; j++) {
          if (msgs[i].filas[j]._id == req.params.id) {
            if (req.body.nome != null) msgs[i].filas[j].nome = req.body.nome
            if (req.body.descricao != null) msgs[i].filas[j].descricao = req.body.descricao
            msgs[i].markModified('filas');
            await msgs[i].save()
          }
        }
      }

      res.status(200).json("");
    } catch (error) {
      log.error('** Erro no update da fila **');
      log.error(`** Erro: ${error} **`);
      res.status(500).json();
    }
  },

  findById: async (req, res) => {
    const user = await Fila.findById(req.params.id);
    res.status(200).json(user);
  }
};
