const Configuracao = require('./configuracao.model');
// const ConfiguracaoHorarioAtendimento = require('./configuraca-horario-atendimento.model');
const eventEmit = require('../util/eventEmmiter');
const config = require('config');

module.exports = {

  lista: async (req, res) => {
    const config = await Configuracao.find();
    res.status(200).json(config);
  },

  adiciona: async (req, res) => {
    let config = await Configuracao.create(req.body);
    eventEmit.emit('iniciar_config_telegram');
    res.status(202).json(config);
  },

  edita: async (req, res) => {
    let validationTelegram = await Configuracao.findById(req.params.id);
    let config = await Configuracao.findByIdAndUpdate(req.params.id, req.body, { returnNewDocument: true });

    if (validationTelegram.telegram.tokenTelegram !== req.body.telegram.tokenTelegram) {
      eventEmit.emit('iniciar_config_telegram');
    }

    res.status(200).json('sucess');
  },

  buscaPorId: async (req, res) => {
    const config = await Configuracao.findById(req.params.id);
    res.status(200).json(config);
  },

  getLogoMini: async (req, res) => {
    try {
      const config = await Configuracao.findOne();
      res.status(200).json(config.logos.logoMini);
    } catch (error) {
      console.log(`Erro no get logo mini`);
      res.status(500).json(error);
    }
  },

  getLogoHome: async (req, res) => {
    try {
      const config = await Configuracao.findOne();
      res.status(200).json(config.logos.logoHome);
    } catch (error) {
      console.log(`Erro no get logo home`);
      res.status(500).json(error);
    }
  },

  deleta: async (req, res) => {
    await Configuracao.findByIdAndDelete(req.params.id);
    eventEmit.emit('iniciar_config_telegram');
    res.status(200).json('deleted');
  },

  uploadLogoMini: async (req, res) => {
    const files = req.files;
    let fullPath = `${config.get("url_midia")}${files[0].filename}`;
    try {
      let configuracao = await Configuracao.findOne();
      let update = configuracao
      update.logos.logoMini = fullPath;
      await Configuracao.findOneAndUpdate({ _id: configuracao._id }, { returnNewDocument: true })
      let updated = await Configuracao.findOne();
      res.status(200).json(updated.logos);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  uploadLogoHome: async (req, res) => {
    const files = req.files;
    let fullPath = `${config.get("url_midia")}${files[0].filename}`;
    try {
      let configuracao = await Configuracao.findOne();
      let update = configuracao
      update.logos.logoHome = fullPath;
      await Configuracao.findOneAndUpdate({ _id: configuracao._id }, update, { returnNewDocument: true })
      let updated = await Configuracao.findOne();
      res.status(200).json(updated.logos);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  getLogoChat: async (req, res) => {
    try {
      const config = await Configuracao.findOne();
      res.status(200).json(config.chat.logoChat);
    } catch (error) {
      //console.log(`Erro no get logo chat`);
      res.status(500).json(error);
    }
  },

  uploadLogoChat: async (req, res) => {
    console.log('##### function - uploadLogoChat #####');
    const files = req.files;
    let fullPath = `${config.get("url_midia")}${files[0].filename}`;
    try {
      let configuracao = await Configuracao.findOne();
      let update = configuracao
      update.chat.logoChat = fullPath;
      await Configuracao.findOneAndUpdate({ _id: configuracao._id }, update, { returnNewDocument: true })
      let updated = await Configuracao.findOne();
      res.status(200).json(updated.chat);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  getProfilePic: async (req, res) => {
    try {
      const config = await Configuracao.findOne();
      res.status(200).json(config.chat.profilePic);
    } catch (error) {
      console.log(`Erro no get logo chat`);
      res.status(500).json(error);
    }
  },

  uploadProfilePic: async (req, res) => {
    console.log('##### functioon - uploadProfilePic #####');
    const files = req.files;
    let fullPath = `${config.get("url_midia")}${files[0].filename}`;
    try {
      let configuracao = await Configuracao.findOne();
      let update = configuracao
      update.chat.profilePic = fullPath;
      await Configuracao.findOneAndUpdate({ _id: configuracao._id }, update, { returnNewDocument: true })
      let updated = await Configuracao.findOne();
      res.status(200).json(updated.chat);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  usaFlexia: async (req, res) => {
    try {
      let usaFlexia = false;
      const configuracao = await Configuracao.findOne();
      if (configuracao) {
        if (configuracao.watson) {
          if (configuracao.watson.ativado) {
            usaFlexia = true;
          }
        }
      }
      res.status(200).json({ flexia: usaFlexia });
    } catch (error) {
      res.status(500).json(error);
    }
  },

  buscaHorarioAtendimento: async (req, res) => {
    const config = await Configuracao.findOne();
    res.status(200).json({ configuracao_horario_atendimento: config.configuracao_horario_atendimento, status: 'OK' });
  },

  // configuraHorarioAtendimento: async (req, res) => {
  //   const { id } = req.params;
  //   let config = await ConfiguracaoHorarioAtendimento.findByIdAndUpdate(req.params.id, req.body, { returnNewDocument: true });
  //   res.status(200).json({ status: 'OK' });
  // }
}