const axios = require('axios');

async function buscaLogintudeLatitude(local) {
  //console.log(estado,cidade,bairro,rua);
  console.log('local: ', local);
  // const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${local}&key=AIzaSyCYWW-R_s7A0qaMkiFTLFt7VGgjEj6r7YE`);
  const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyCboWINz747t13aUmZQoPYY8vgIJL4N9CQ`, {
    params: {
      address: local
    }
  });

  // console.log(response.data.results[0].geometry.location);
  return response.data.results[0].geometry.location;
}

module.exports = buscaLogintudeLatitude;