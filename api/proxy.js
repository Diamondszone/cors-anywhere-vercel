// api/proxy.js
// CORS Anywhere gaya asli, disesuaikan untuk Vercel Functions (tanpa Express)

const corsAnywhere = require('cors-anywhere');

// === Env & helper (sesuai server asli) ===
function parseEnvList(env) {
  if (!env) return [];
  return env.split(',').map(s => s.trim()).filter(Boolean);
}
const originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
const originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);

// Rate-limit bawaan cors-anywhere (pakai ENV CORSANYWHERE_RATELIMIT, format "50 3 example.com")
let checkRateLimit = null;
try {
  // require internal helper dari paket cors-anywhere
  checkRateLimit = require('cors-anywhere/lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);
} catch (_) {
  // bila versi paket berubah dan path internal tidak ada, biarkan null (tanpa rate limit)
}

// === Server cors-anywhere ===
const server = corsAnywhere.createServer({
  originBlacklist,
  originWhitelist,
  requireHeader: ['origin', 'x-requested-with'],   // → sama seperti default asli
  checkRateLimit,                                   // aktif jika modul tersedia & ENV diset
  removeHeaders: [
    'cookie',
    'cookie2',
    // strip header debug (paritas dgn contoh di server.js asli)
    'x-request-start',
    'x-request-id',
    'via',
    'connect-time',
    'total-route-time',
    // bisa tambahkan 'x-forwarded-for', 'x-forwarded-proto', 'x-forwarded-port' bila mau
  ],
  redirectSameOrigin: true,
  httpProxyOptions: {
    // di platform (Heroku) aslinya mereka set false; kita ikuti
    xfwd: false,
  },
  // corsMaxAge: 600,
});

// === Halaman demo sangat sederhana ===
function demoPage(res) {
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.end(`<!doctype html>
<title>CORS Anywhere Demo</title>
<h1>CORS Anywhere Demo</h1>
<p>Format: <code>https://HOST/https://httpbin.org/get</code></p>
<pre>fetch(location.origin + '/https://httpbin.org/get', {headers:{'X-Requested-With':'fetch'}})
  .then(r=>r.json()).then(console.log)</pre>`);
}

// === Vercel handler ===
module.exports = (req, res) => {
  // Halaman demo / health
  if (req.url === '' || req.url === '/' || req.url === '/proxy' || req.url === '/api/proxy') {
    return demoPage(res);
  }
  if (req.url === '/corsdemo' || req.url === '/api/corsdemo') {
    return demoPage(res);
  }

  // Dukungan multi-gaya:
  // 1) /api/proxy?url=https://target
  // 2) /api/proxy/https://target
  // 3) /https://target  (direwrite via vercel.json)
  const qIndex = req.url.indexOf('?url=');
  if (qIndex !== -1) {
    const target = decodeURIComponent(req.url.slice(qIndex + 5));
    req.url = '/' + target;
  } else if (/^\/api\/proxy\//.test(req.url)) {
    req.url = '/' + req.url.replace(/^\/api\/proxy\//, '');
  } else if (/^\/proxy\//.test(req.url)) {
    req.url = '/' + req.url.replace(/^\/proxy\//, '');
  }
  // Jika sudah berbentuk /https://... atau /http://..., biarkan.

  server.emit('request', req, res);
};
