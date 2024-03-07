import express from 'express';
import open from 'open';
import dotenv from 'dotenv';
import clr from 'colors'

dotenv.config();

import { PORT, client_id, redirect_uri } from './config/config.js';
import { fetchUserTracks } from './utils/spotifyFunctions.js';
import { spotifytoyoutube } from './utils/youtubeSearch.js';

async function main() {
  console.log('Click here to give the code access to fetch your details from spotify:');
  console.log(`https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=code&redirect_uri=${redirect_uri}&scope=user-read-private%20user-read-email%20playlist-read-private&state=34fFs29kd09`);
  open(`https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=code&redirect_uri=${redirect_uri}&scope=user-read-private%20user-read-email%20playlist-read-private&state=34fFs29kd09`, {app : { name : 'firefox'}});
  
  const allTracks = [];
  
  // creating a temp server 
  const app = express();
  
  app.get('/callback', async (req,res)=>{
    const code = req.query.code;
    try{
      const allTracks = await fetchUserTracks(code);
      console.log(clr.yellow("Fetching the youtube links for each track..."));
      const result = await spotifytoyoutube(allTracks);
      console.log(clr.green("Fetching successfully."));
      res.json(result);
      process.exit(0);
    }
    catch(e) {
      console.error('error in access token or the playlists', e);
      res.sendStatus(500);
      process.exit(0)
    }
  });
  app.listen(PORT, console.log(`listting on ${PORT}`));
}

main();