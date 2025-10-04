const corsAnywhere = require('cors-anywhere');

const originWhitelist = (process.env.CORSANYWHERE_WHITELIST || '')
  .split(',').map(s => s.trim()).filter(Boolean);

const server = corsAnywhere.createServer({
  originWhitelist,
  requireHeader: ['origin', 'x-requested-with'],
  removeHeaders: ['cookie', 'cookie2'],
});

function demoPage(res) {
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.end(`<!doctype html>
<title>CORS Anywhere Demo</title>
<h1>CORS Anywhere Demo</h1>
<pre>fetch(location.origin + '/https://httpbin.org/get', {headers:{'X-Requested-With':'fetch'}})
  .then(r=>r.json()).then(console.log)</pre>`);
}

module.exports = (req, res) => {
  if (req.url === '/corsdemo' || req.url.startsWith('/api/corsdemo')) {
    return demoPage(res);
  }
  if (req.url.startsWith('/api?url=')) {
    const target = decodeURIComponent(req.url.slice('/api?url='.length));
    req.url = '/' + target;
  }
  if (req.url.startsWith('/api/')) {
    req.url = req.url.replace(/^\/api\//, '/');
  }
  server.emit('request', req, res);
};
