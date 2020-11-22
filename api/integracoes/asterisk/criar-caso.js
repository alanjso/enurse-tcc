module.exports = {
  async criar(req,res){
    console.log('integracao asterisk: ',req.body);
    res.status(200).json({msg:'Protocolo criado com sucesso'});
  }
}