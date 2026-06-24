// PM2 entrypoint — lives in public_html root so it survives `next build` (which wipes .next/standalone).
// Loads real secrets from .env on the server (never committed to git), then boots the standalone server.
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

process.env.PORT = process.env.PORT || '3002';
process.env.HOSTNAME = process.env.HOSTNAME || '192.250.227.159';
process.env.NODE_ENV = 'production';

require('./.next/standalone/server.js');
