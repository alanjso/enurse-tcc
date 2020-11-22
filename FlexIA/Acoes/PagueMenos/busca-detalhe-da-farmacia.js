const axios = require('axios');

async function buscaDetalheDaFarmacia(idFarmacia) {
  const key = 'AIzaSyCboWINz747t13aUmZQoPYY8vgIJL4N9CQ'

  let url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${idFarmacia}&fields=formatted_address,name,formatted_phone_number,opening_hours&key=${key}`;
  let response = await axios.get(url);
  // console.log('Response busca detalhes: ', response);
  //console.log('response: ', response.data.result.opening_hours.weekday_text);

  console.log("Response: ", response.data.result);
  console.log('Openin_hours: ',response.data.result.opening_hours)
  console.log('Openin_hours: ',response.data.result.opening_hours.periods)
  return response.data.result;
}

module.exports = buscaDetalheDaFarmacia;