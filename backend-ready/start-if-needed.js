const http = require('http');

const PORT = process.env.PORT || 4000;

function backendIsRunning() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${PORT}/`, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve(res.statusCode === 200 && body.includes('E-Attend backend running'));
      });
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

(async () => {
  if (await backendIsRunning()) {
    console.log(`Backend already running on port ${PORT}`);
    process.exit(0);
  }
  require('./server.js');
})();
