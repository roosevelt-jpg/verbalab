import https from 'https';
import http from 'http';
import fs from 'fs';

const TARGET_HOST = '127.0.0.1';
const TARGET_PORT = Number(process.env.TARGET_PORT || 43125);
const LISTEN_PORT = Number(process.env.LISTEN_PORT || 443);
const PUBLIC_HOST = process.env.PUBLIC_HOST || 'local.lugemi.com';

const options = {
  key: fs.readFileSync('/etc/lugemi-local-tls/key.pem'),
  cert: fs.readFileSync('/etc/lugemi-local-tls/cert.pem'),
};

function buildHeaders(req) {
  const headers = { ...req.headers };
  headers.host = PUBLIC_HOST;
  headers['x-forwarded-host'] = PUBLIC_HOST;
  headers['x-forwarded-proto'] = 'https';
  headers['x-forwarded-for'] = req.socket.remoteAddress || '127.0.0.1';
  // Drop hop-by-hop
  delete headers['connection'];
  delete headers['keep-alive'];
  delete headers['proxy-connection'];
  delete headers['transfer-encoding'];
  return headers;
}

function proxy(req, res) {
  const headers = buildHeaders(req);
  const p = http.request(
    {
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      path: req.url,
      method: req.method,
      headers,
    },
    (up) => {
      res.writeHead(up.statusCode || 502, up.headers);
      up.pipe(res);
    },
  );
  p.on('error', (err) => {
    res.writeHead(502, { 'content-type': 'text/plain' });
    res.end(`proxy error: ${err.message}`);
  });
  req.pipe(p);
}

const server = https.createServer(options, proxy);
server.on('upgrade', (req, socket, head) => {
  const headers = buildHeaders(req);
  const p = http.request({
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: req.url,
    method: 'GET',
    headers,
  });
  p.on('upgrade', (upRes, upSocket, upHead) => {
    const lines = [`HTTP/1.1 101 Switching Protocols`];
    for (const [k, v] of Object.entries(upRes.headers)) {
      if (Array.isArray(v)) v.forEach((vv) => lines.push(`${k}: ${vv}`));
      else lines.push(`${k}: ${v}`);
    }
    socket.write(lines.join('\r\n') + '\r\n\r\n');
    if (upHead?.length) socket.write(upHead);
    upSocket.pipe(socket);
    socket.pipe(upSocket);
  });
  p.on('error', () => socket.destroy());
  p.end();
});

server.listen(LISTEN_PORT, '0.0.0.0', () => {
  console.log(`https://${PUBLIC_HOST}:${LISTEN_PORT} -> http://127.0.0.1:${TARGET_PORT} (Host=${PUBLIC_HOST})`);
});
