const { Command } = require('commander');
const http = require('http');
const fs = require('fs');

const cmd = new Command();

cmd
  .requiredOption('-h, --host <h>', 'host')
  .requiredOption('-p, --port <p>', 'port')
  .requiredOption('-c, --cache <c>', 'cache dir');

cmd.parse(process.argv);
const o = cmd.opts();

if (!fs.existsSync(o.cache)) {
  console.error(`кеш директорія "${o.cache}" не існує`);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('сервер працює\n');
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

