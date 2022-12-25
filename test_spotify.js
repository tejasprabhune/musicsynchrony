const axios  = require('axios');
const qs = require('qs');

var client_id = '7f4fbec3e8b04e01bc4abafda3be80b0';
var client_secret = 'b3f4203755634a938fa9c8cb51f92a49';
const auth_token = Buffer.from(`${client_id}:${client_secret}`, 'utf-8').toString('base64');

const getAccessToken = async () => {

  const token_url = 'https://accounts.spotify.com/api/token';
  const data = qs.stringify({'grant_type':'client_credentials'});

  const response = await axios.post(token_url, data, {
    headers: { 
      'Authorization': `Basic ${auth_token}`,
      'Content-Type': 'application/x-www-form-urlencoded' 
    }
  })

  return response.data.access_token;
}

const getPlaylists = async () => {
  const access_token = await getAccessToken();
  console.log(access_token);

  const api_url = `https://api.spotify.com/v1/users/totalnotjunk/playlists`;

  try {

    const response = await axios.get(api_url, {
      headers: {
        'Authorization': 'Bearer ' + access_token,
      }
    });

    const request_body = response.data;
    return response.data;

  } catch(error) {
    console.log(error);
  }
}

getPlaylists().then(body => {
  console.log(body);
})
