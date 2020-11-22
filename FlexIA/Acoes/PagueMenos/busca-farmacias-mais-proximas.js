const axios = require('axios');

async function buscaFarmaciaMaisProxima({ lat, lng }){
  const key = 'AIzaSyCboWINz747t13aUmZQoPYY8vgIJL4N9CQ'
    let urlEnderecos = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&rankby=distance&opennow&name=Farmacias+Pague+Menos&key=${key}`;
    //console.log(urlEnderecos);
    const response = await axios.get(urlEnderecos);

    const idsFarmacias = [];

    const quantidade = 2;

    for (let i = 0; i < quantidade; i++) {
      idsFarmacias.push(response.data.results[i].place_id);
    }

    console.log(response.data.results);
    console.log('ids farmacias:' + idsFarmacias);

    // if(response.data.results[0].length>1){
    //   idsFarmacias.push(response.data.results[0].place_id);
    //   idsFarmacias.push(response.data.results[1].place_id);
    // } else {
    //   idsFarmacias.push(response.data.results[0].place_id);
    // }
    

    return idsFarmacias;
}

module.exports = buscaFarmaciaMaisProxima;