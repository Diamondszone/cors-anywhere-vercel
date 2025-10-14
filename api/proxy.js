// api/proxy.js - Simple version
const corsAnywhere = require('cors-anywhere');

// Create CORS Anywhere server
const server = corsAnywhere.createServer({
  originBlacklist: [],
  originWhitelist: [], 
  requireHeader: [], // No headers required
  removeHeaders: ['cookie', 'cookie2'],
  redirectSameOrigin: true,
  httpProxyOptions: { xfwd: false },
});

module.exports = (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  // Handle root - show simple info
  if (req.url === '/' || req.url === '') {
    res.setHeader('content-type', 'text/plain');
    return res.end('CORS Anywhere Proxy - Use: /https://example.com or /api/proxy?url=https://example.com');
  }

  // Handle API proxy with query parameter
  if (req.url.startsWith('/api/proxy')) {
    const queryString = req.url.includes('?') ? req.url.split('?')[1] : '';
    const params = new URLSearchParams(queryString);
    const targetUrl = params.get('url');
    
    if (targetUrl) {
      req.url = `/${targetUrl}`;
    }
  }

  // Proxy the request
  server.emit('request', req, res);
};
