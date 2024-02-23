import express from 'express';
import open from 'open';
import dotenv from 'dotenv';
dotenv.config();

import { PORT, client_id, redirect_uri } from './config.js';
import { fetchUserTracks } from './spotifyFunctions.js';

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
      console.log('alltracks = ' + allTracks);
      res.json(allTracks);
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