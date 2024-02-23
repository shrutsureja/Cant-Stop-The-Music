import {client_id, client_secret, redirect_uri} from './config.js';
import axios from 'axios';

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
  let offset = 0;
  const allPaylist = [];
  while(true){
    const {data} = await axios.get('https://api.spotify.com/v1/me/playlists', {
      headers : {
        'Authorization' : `Bearer ${accessToken}`
      },
      params : { 
        limit : 20,
        offset : offset
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
    allPaylist.push(...destructuredPlaylists);
    if(destructuredPlaylists.length < 20)
      break
    offset += 20;
  }
  return {
    playlists: allPaylist,
    total : allPaylist.total
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

const fetchUserTracks = async (code) => {
  const accessToken = await getAccessToken(code);
  const playlists = await getPlaylists(accessToken);
  const playlistWiseTracks = await getTracksFromAllPlaylist(playlists, accessToken);
  return playlistWiseTracks;
}

export {
  fetchUserTracks
}