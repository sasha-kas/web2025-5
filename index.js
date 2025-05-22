const { Command } = require('commander');
const http = require('http');
const fs = require('fs').promises;
const fssync = require('fs');
const path = require('path');
const superagent = require('superagent');

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
    console.error(`Кеш директорія "${o.cache}" не існує`);
    process.exit(1);
  }
}

checkCacheDirectory();

const server = http.createServer(async (req, res) => {
  const parts = req.url.split('/');
  const code = parts[1];
  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad Request: missing code');
    return;
  }

  const filePath = path.join(o.cache, `${code}.jpg`);

  if (req.method === 'GET') {
    try {
      const data = await fs.readFile(filePath);
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      res.end(data);
    } catch (err) {
      try {
        const response = await superagent
          .get(`https://http.cat/${code}`)
          .buffer(true)
          .parse(superagent.parse.image); // Обробляє як зображення

        const buffer = response.body;
        await fs.writeFile(filePath, buffer);
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(buffer);
      } catch (error) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    }

  } else if (req.method === 'PUT') {
    // Отримуємо і зберігаємо картинку з компа
    const writeStream = fssync.createWriteStream(filePath);

    req.pipe(writeStream);

    writeStream.on('finish', () => {
      res.writeHead(201, { 'Content-Type': 'text/plain' });
      res.end('Created');
    });

    writeStream.on('error', (err) => {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server Error');
    });

  } else if (req.method === 'DELETE') {
    try {
      await fs.unlink(filePath);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Deleted');
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  } else {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
  }
});

server.listen(o.port, o.host, () => {
  console.log(`Server running at http://${o.host}:${o.port}`);
});

