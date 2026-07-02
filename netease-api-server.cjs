const { serveNcmApi } = require('NeteaseCloudMusicApi/server');

async function start() {
  await serveNcmApi({
    port: 3001,
    host: '127.0.0.1',
    checkVersion: false
  });
}

start();
