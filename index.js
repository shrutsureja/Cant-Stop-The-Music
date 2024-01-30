const axios = require('axios');
const express = require('express');
const color = require('colors');
require('dotenv').config();

const PORT = 3000;
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = 'http://localhost:3000/callback'

async function getAccessToken(code){
  const {data} = await axios.post('https://accounts.spotify.com/api/token', {
    code : code,
    redirect_uri : redirect_uri,
    grant_type : 'authorization_code'
  }, {
    headers : {
      'Content-Type' : 'application/x-www-form-urlencoded',
      'Authorization' : 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
    }
  });
  console.log(data.access_token);
  return data.access_token;
}

async function getPlaylists(token){
  const {data} = await axios.get('https://api.spotify.com/v1/me/playlists', {
    headers : {
      'Authorization' : `Bearer ${token}`
    }
  });
  // only taking the data that is necessary for us 
  // destructuring the playlists 
  const destructuredPlaylists = data.items.map(({ href, id, name, tracks }) => ({
    href,
    id,
    name,
    tracks
  }));

  return {
    playlists: destructuredPlaylists,
    total : data.total
  };
}

// link wise send the request to get the playlist
async function getAllTracks(playlists, accessToken){
  return playlists.playlists.map(async (list) => {
    const tracks = await getTracks(list.tracks, accessToken)
    return {
      href: list.href,
      id: list.id,
      playlistName : list.name,
      tracks : tracks
    }
  });
}

async function getTracks(trackDetails, accessToken) {
  const allTracks = [];
  let offset = 0;
  while(true){
    const response = await axios.get(trackDetails.href + `?limit=50&offset=${offset}`, {
      headers : accessToken
    });
    //destructure the response later overhere

    const tracks = data.items;
    allTracks.push(...tracks);
    if(tracks.length < 50)break;
    offset = offset + 50;
  }
  return allTracks;
}


async function main() {
  console.log('Click here to give the code access to fetch your details from spotify:');
  console.log(`https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=code&redirect_uri=${redirect_uri}&scope=user-read-private%20user-read-email%20playlist-read-private&state=34fFs29kd09`);

  // creating a temp server 
  const app = express();
  app.get('/callback', async (req,res)=>{
    const code = req.query.code;
    try{
      const accessToken = await getAccessToken(code);
      const playlists = await getPlaylists(accessToken);
      console.log(color.blue(`User playlists extracted`));
      const playlistWiseTracks = await getAllTracks(playlists, accessToken);
      // const refObj = {
      //     href: "https://api.spotify.com/v1/playlists/20gm536nbISgua7IW0mXjb",
      //     id: "20gm536nbISgua7IW0mXjb",
      //     name: "whatever",
      //     tracks: {
      //         href: "https://api.spotify.com/v1/playlists/20gm536nbISgua7IW0mXjb/tracks",
      //         total: 30
      //     }
      // }

      res.json(playlistWiseTracks);
      process.exit(0);
    }
    catch(e) {
      console.error('error in access token or the playlists', e);
      res.sendStatus(500);
    }
  });
  app.listen(PORT, console.log(`listting on ${PORT}`));
}
main();