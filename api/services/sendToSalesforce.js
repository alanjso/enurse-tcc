const rp = require('request-promise-native');
const config = require('config');

let token = '';

const authBody = () => `grant_type=password
                                            &client_id=${config.get('salesforce.clientId')}
                                            &client_secret=${config.get('salesforce.clientSecret')}
                                            &username=${config.get('salesforce.username')}
                                            &password=${config.get('salesforce.password')}`;

const getAuthOptions = () => ({
  uri: config.get('salesforce.url'),
  headers: {
    'Content-type': 'application/x-www-form-urlencoded',
  },
  method: 'POST',
  body: authBody(),
});

const getToken = async () => {
  try {
    const response = await rp(getAuthOptions());
    token = JSON.parse(response).access_token;
  } catch (err) {
    console.error(`Não se autênticou no saleforce com erro: ${err}`);
  }
};

const getRequestOptions = (url, method) => ({
  method: method,
  uri: url,
  headers: {
    'Content-type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});

// getToken();

module.exports = async function sendToSalesforce(data, url, method) {
  await getToken();

  return new Promise((resolve, reject) => {

    rp({ ...getRequestOptions(url, method), body: JSON.stringify({ data: data }) })
      .then((response) => {
        resolve(response);
      })
      .catch(async (err) => {
        try {
          if (err.statusCode === 401) {
            token = await getToken();
            await sendToSalesforce(data, url, method);
          }
        } catch (err) {
          console.log(`Erro no SERVIÇO sendToSalesforce ${err}`);
        }
      });
  });

};
