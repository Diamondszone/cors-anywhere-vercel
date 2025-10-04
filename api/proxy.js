// /api/[...proxy].js
// CORS Anywhere gaya asli untuk Vercel (mendukung:
//   - path style:   https://host/https://example.com/endpoint
//   - query style:  https://host/api?url=https://example.com/endpoint (fallback)
//   - halaman demo: https://host/corsdemo )

const corsAnywhere = require('cors-anywhere');

const originWhitelist = (process.env.CORSANYWHERE_WHITELIST || '')
  .split(',').map(s => s.trim()).filter(Boolean);

// Ikuti default cors-anywhere asli: paksa header Origin/X-Requested-With
const server = corsAnywhere.createServer({
  originWhitelist,                            // [] = izinkan semua (tidak disarankan)
  requireHeader: ['origin', 'x-requested-with'],
  removeHeaders: ['cookie', 'cookie2'],
  // CORS cache optional:
  // corsMaxAge: 600,
  // Rate limit/blacklist bawaan lewat ENV:
  // CORSANYWHERE_RATELIMIT, CORSANYWHERE_BLACKLIST
});

// Halaman demo sederhana ala /corsdemo
function demoPage(res) {
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.end(`<!doctype html>
<title>CORS Anywhere Demo</title>
<h1>CORS Anywhere Demo</h1>
<p>Contoh pemakaian (buka di Console karena header Origin dibutuhkan):</p>
<pre>fetch(location.origin + '/https://httpbin.org/get', {headers:{'X-Requested-With':'fetch'}})
  .then(r=>r.json()).then(console.log)</pre>
<p>Gunakan format URL: <code>https://HOST/https://target.tld/path</code></p>
`);
}

module.exports = (req, res) => {
  // 1) /corsdemo → tampilkan halaman demo
  if (req.url === '/corsdemo' || req.url.startsWith('/api/corsdemo')) {
    return demoPage(res);
  }

  // 2) Fallback query style: /api?url=https://target
  if (req.url.startsWith('/api?url=')) {
    const target = decodeURIComponent(req.url.slice('/api?url='.length));
    req.url = '/' + target;
  }

  // 3) Jika datang via /api/<something>, hilangkan prefix /api/
  //    (agar path jadi /https://target atau /http://target)
  if (req.url.startsWith('/api/')) {
    req.url = req.url.replace(/^\/api\//, '/');
  }

  // Pada titik ini, untuk gaya asli, req.url harus berupa:
  //   /https://example.com/endpoint
  //   /http://example.com/endpoint
  server.emit('request', req, res);
};
