import fetch from 'node-fetch';

var client_id = '7f4fbec3e8b04e01bc4abafda3be80b0';
var client_secret = 'b3f4203755634a938fa9c8cb51f92a49';
//const auth_token = Buffer.from(`${client_id}:${client_secret}`, 'utf-8').toString('base64');
const auth_token = "N2Y0ZmJlYzNlOGIwNGUwMWJjNGFiYWZkYTNiZTgwYjA6YjNmNDIwMzc1NTYzNGE5MzhmYTljOGNiNTFmOTJhNDk=";
//console.log("Auth token: " + auth_token);
//console.log("Auth token 2: " + auth_token2);

async function getPlaylists(user_id) {
    const playlists = await fetch(
        'https://accounts.spotify.com/api/token',
        {
            method: "POST",
            headers: { 
              'Authorization': `Basic ${auth_token}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: "grant_type=client_credentials"
        })
      .then((response) => response.json())
      .then((data) => data.access_token)
      .then((token) => fetch(
        'https://api.spotify.com/v1/users/' + user_id + '/playlists',
        {
            method: "GET",
            headers: {
                'Authorization': 'Bearer ' + token
            }
        }
      ));
    const playlists_json = await playlists.json();
    let playlists_obj = {};
    for(let i = 0; i < playlists_json['items'].length; i++) {
        playlists_obj[playlists_json['items'][i]['name']] = playlists_json['items'][i]['id'];
    }
    console.log(playlists_obj['works of art']);
    return playlists_obj;
}


getPlaylists('totalnotjunk');