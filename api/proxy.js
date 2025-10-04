// api/proxy.js
// CORS Anywhere gaya asli via Vercel Functions (tanpa Express)

const corsAnywhere = require('cors-anywhere');

// Ambil whitelist dari ENV (pisahkan koma), contoh:
// CORSANYWHERE_WHITELIST="http://localhost:3000,https://domainmu.com"
const originWhitelist = (process.env.CORSANYWHERE_WHITELIST || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Ikuti perilaku default cors-anywhere:
// - wajib header Origin atau X-Requested-With
// - buang header cookie/cookie2
const server = corsAnywhere.createServer({
  originWhitelist,                               // [] = izinkan semua (tidak disarankan untuk publik)
  //requireHeader: ['origin', 'x-requested-with'],
  requireHeader: [],
  removeHeaders: ['cookie', 'cookie2'],
  // corsMaxAge: 600,                            // aktifkan jika mau cache preflight
});

// Halaman demo sederhana
function demoPage(res) {
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.end(`<!doctype html>
<title>CORS Anywhere Demo</title>
<h1>CORS Anywhere Demo</h1>
<p>Pakai format: <code>https://HOST/https://httpbin.org/get</code></p>
<pre>fetch(location.origin + '/https://httpbin.org/get', {headers:{'X-Requested-With':'fetch'}})
  .then(r=>r.json()).then(console.log)</pre>`);
}

module.exports = (req, res) => {
  // Demo
  if (req.url === '' || req.url === '/' || req.url === '/proxy' || req.url === '/api/proxy') {
    return demoPage(res);
  }
  if (req.url === '/corsdemo' || req.url === '/api/corsdemo') {
    return demoPage(res);
  }

  // Dukung beberapa gaya input:
  // 1) Query style: .../api/proxy?url=https://target
  // 2) Query style: .../api?url=https://target  (kalau ada rewrite lain)
  // 3) Path  style: .../api/proxy/https://target (fallback)
  // 4) Path  style: .../https://target           (direwrite dari vercel.json)
  const qIndex = req.url.indexOf('?url=');
  if (qIndex !== -1) {
    const target = decodeURIComponent(req.url.slice(qIndex + 5));
    req.url = '/' + target;
  } else if (/^\/api\/proxy\//.test(req.url)) {
    req.url = '/' + req.url.replace(/^\/api\/proxy\//, '');
  } else if (/^\/proxy\//.test(req.url)) {
    req.url = '/' + req.url.replace(/^\/proxy\//, '');
  }
  // Jika datang sebagai /https://target atau /http://target, biarkan apa adanya.

  // Teruskan ke cors-anywhere
  server.emit('request', req, res);
};
