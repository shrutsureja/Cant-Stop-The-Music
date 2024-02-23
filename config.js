import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT;
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;

export {
  PORT,
  client_id,
  client_secret,
  redirect_uri
}