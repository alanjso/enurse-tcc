const Caso = require('./case-model');
const yup = require('yup');

const quantidadeDeCasesPorPagina = 10;

module.exports = {

  lista: async (req, res) => {
    //console.log('lista');

    
    const casos = await Caso.find()
      .populate('status')
      .populate('motivo')
      .populate('responsavel.usuario')
      .populate('comentarios.usuario')
      .populate('aberto_por')
      .populate('produto')
      .populate('contato')
      .populate('conversa')
      .lean();

    // const casos = await Caso.find();

    res.status(200).json(casos);
  },

  adiciona: async (req, res) => {

    //('Body request: ', req.body);

    let schema = yup.object().shape({
      titulo: yup.string().required(),
      descricao: yup.string().required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    let valoresDaData = req.body.data_prevista_encerramento.split('-');

    let dataPrevistaEncerramento = `${valoresDaData[2]}-${valoresDaData[1]}-${valoresDaData[0]}T00:00:00`;

    //console.log('Data prevista encerramento: ', dataPrevistaEncerramento);

    req.body.data_prevista_encerramento = new Date(dataPrevistaEncerramento);

    req.body.situacao_do_caso = {
      encerrado: false,
      data: new Date()
    }

    //console.log('Caso antes de criar: ', req.body);

    await Caso.create(req.body);

    res.status(202).json({ msg: 'Caso criado com sucesso' });
  },

  //Vai realmente ser usado?
  edita: async (req, res) => {
    await Caso.findByIdAndUpdate(req.params.id, req.body);
    res.status(200).json({ msg: 'Case atualizado com sucesso' });
  },

  buscaPorId: async (req, res) => {
    const caso = await Caso.findById(req.params.id)
      .populate('status')
      .populate('motivo')
      .populate('responsavel.usuario')
      .populate('comentarios.usuario')
      .populate('aberto_por')
      .populate('produto')
      .populate('conversa')
      .populate('contato')
      .lean();

    res.status(200).json(caso);
  },

  //Um caso poderá ser deletado?
  deleta: async (req, res) => {

    // const { id } = req.params;

    // const casoExiste = await Caso.findById(id);

    // if (!casoExiste) {
    //   return res.status(404).json({ err: 'Setor não existe' });
    // }

    // await Caso.findByIdAndDelete(id);
    res.status(200).json({ msg: 'Caso removido com sucesso' });
  },

  encerra: async (req, res) => {

    const { id } = req.params;

    let caso = await Caso.findById(id);

    if (!caso) {
      res.status(404).json({ err: 'Caso nao existe' });
    }

    let situacao_do_caso = {
      encerrado: true,
      data: new Date()
    }

    caso.situacao_do_caso.push(situacao_do_caso);

    await Caso.findByIdAndUpdate(id, caso);

    res.status(200).json({ msg: 'Caso encerrado com sucesso' });
  },

  adicionaComentario: async (req, res) => {

    const { id } = req.params;

    let caso = await Caso.findById(id);

    if (!caso) {
      res.status(404).json({ err: 'Caso nao existe' });
    }

    caso.comentarios.push(req.body);

    await Caso.findByIdAndUpdate(id, caso);

    res.status(200).json({ msg: 'Comentário adicionado com sucesso' })
  },

  adicionaTarefa: async (req, res) => {

    const { id } = req.params;

    let caso = await Caso.findById(id);

    if (!caso) {
      res.status(404).json({ err: 'Caso nao existe' });
    }

    caso.tarefas.push(req.body);

    await Caso.findByIdAndUpdate(id, caso);

    res.status(200).json({ msg: 'Comentário adicionado com sucesso' });
  },

  reabrirCaso: async (req, res) => {

    const { id } = req.params;

    let caso = await Caso.findById(id);

    if (!caso) {
      res.status(404).json({ err: 'Caso nao existe' });
    }

    let situacao_do_caso = {
      encerrado: false,
      data: new Date()
    }

    caso.situacao_do_caso.push(situacao_do_caso);

    await Caso.findByIdAndUpdate(id, caso);

    res.status(200).json({ msg: 'Caso reaberto' });
  },

  mudarResponsavel: async (req, res) => {

    const { id } = req.params;

    let caso = await Caso.findById(id);

    if (!caso) {
      res.status(404).json({ err: 'Caso nao existe' });
    }

    let dataAtual = new Date();

    let responsaveis = caso.responsavel;

    responsaveis[responsaveis.length - 1].data_fim = dataAtual;

    let responsavel = {
      usuario: req.body.usuario
    }

    responsaveis.push(responsavel);

    caso.responsavel = responsaveis;

    await Caso.findByIdAndUpdate(id, caso);

    res.status(200).json({ msg: 'Responsável do caso modificado com sucesso' });
  },

  modificarMotivo: async (req, res) => {

    const { id } = req.params;

    let caso = await Caso.findById(id);

    if (!caso) {
      res.status(404).json({ err: 'Caso nao existe' });
    }

    caso.motivo.push(req.body.motivo);

    caso.motivo.reverse();

    await Caso.findByIdAndUpdate(id, caso);

    res.status(200).json({ msg: 'Motivo modificado com sucesso' });
  },

  modificarStatus: async (req, res) => {

    const { id } = req.params;

    let caso = await Caso.findById(id);

    if (!caso) {
      res.status(404).json({ err: 'Caso nao existe' });
    }

    caso.status.push(req.body.status);

    caso.status.reverse();

    await Caso.findByIdAndUpdate(id, caso);

    res.status(200).json({ msg: 'Status modificado com sucesso' });

  }

}