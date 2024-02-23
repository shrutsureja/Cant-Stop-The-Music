import axios from 'axios';
import express from 'express';
import color from 'colors';
import open from 'open';
import dotenv from 'dotenv';
dotenv.config();

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

async function getPlaylists(accessToken){
  const {data} = await axios.get('https://api.spotify.com/v1/me/playlists', {
    headers : {
      'Authorization' : `Bearer ${accessToken}`
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

async function getTracksFromAllPlaylist(playlistPayload, accessToken){
  const tracksFromAllPlaylist = await Promise.all(playlistPayload.playlists.map(async (list) => {
    const tracksFromSinglePlaylist = await getTracksFromSinglePlaylist(list.tracks, accessToken);
    return {
      ...list,
      trackDetails : tracksFromSinglePlaylist,
      trackLength : tracksFromSinglePlaylist.length
    };
  }));
  return tracksFromAllPlaylist;
}

async function getTracksFromSinglePlaylist(list, accessToken) {
  const allTracks = [];
  let offset = 0;
  while (true) {
    const {data} = await axios.get(list.href, {
      headers : {
        Authorization : `Bearer ${accessToken}`
      },
      params : {
        limit : 20,
        offset: offset
      }
    });
    const tracks = data.items.map(({ track }) => ({
      album: track.album.name,
      artist: track.artists[0].name,
      name: track.name,
      url: track.external_urls.spotify,
    }));  
    allTracks.push(...tracks);
    if(tracks.length < 20) break;
    offset += 20;
  }
  return allTracks;
}

async function main() {
  console.log('Click here to give the code access to fetch your details from spotify:');
  console.log(`https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=code&redirect_uri=${redirect_uri}&scope=user-read-private%20user-read-email%20playlist-read-private&state=34fFs29kd09`);
  open(`https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=code&redirect_uri=${redirect_uri}&scope=user-read-private%20user-read-email%20playlist-read-private&state=34fFs29kd09`, {app : { name : 'firefox'}});
  // creating a temp server 
  const app = express();
  app.get('/callback', async (req,res)=>{
    const code = req.query.code;
    try{
      const accessToken = await getAccessToken(code);
      const playlists = await getPlaylists(accessToken);
      const playlistWiseTracks = await getTracksFromAllPlaylist(playlists, accessToken);
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