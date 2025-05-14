const { Command } = require('commander');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');

const cmd = new Command();

cmd
  .requiredOption('-h, --host <h>', 'host')
  .requiredOption('-p, --port <p>', 'port')
  .requiredOption('-c, --cache <c>', 'cache dir');

cmd.parse(process.argv);
const o = cmd.opts();

async function checkCacheDirectory() {
  try {
    await fs.access(o.cache);
  } catch (err) {
    console.error(`кеш директорія "${o.cache}" не існує`);
    process.exit(1);
  }
}

checkCacheDirectory();

const server = http.createServer(async (req, res) => {
  const parts = req.url.split('/');
  const code = parts[1];

  if (req.method === 'GET' && code) {
    const filePath = path.join(o.cache, `${code}.jpg`);
    try {
      const data = await fs.readFile(filePath);
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      res.end(data);
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  } else {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method not allowed');
  }
});

server.listen(o.port, o.host, () => {
  console.log(`сервер запущено: http://${o.host}:${o.port}`);
});

server.on('error', (err) => {
  console.error(`помилка сервера: ${err.message}`);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n сервер зупинено вручну (Ctrl+C)');
  process.exit(0);
});

