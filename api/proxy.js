// api/proxy.js - Simplified version for double slash only
const corsAnywhere = require('cors-anywhere');

// Create CORS Anywhere server
const server = corsAnywhere.createServer({
  originBlacklist: [],
  originWhitelist: [], 
  requireHeader: ['origin', 'x-requested-with'],
  removeHeaders: ['cookie', 'cookie2'],
  redirectSameOrigin: true,
  httpProxyOptions: { xfwd: false },
});

module.exports = (req, res) => {
  console.log('Incoming request:', req.method, req.url);
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Origin');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  // Handle root - show simple info
  if (req.url === '/' || req.url === '') {
    res.setHeader('content-type', 'text/plain');
    return res.end('CORS Anywhere Proxy - Usage: /https://example.com');
  }

  // Extract target URL from path
  let targetUrl = '';
  
  if (req.url.startsWith('/https://')) {
    targetUrl = req.url.substring(1); // Remove first slash -> https://...
  } else if (req.url.startsWith('/http://')) {
    targetUrl = req.url.substring(1); // Remove first slash -> http://...
  } else if (req.url.startsWith('/api/proxy')) {
    // Handle query parameter format
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    targetUrl = urlParams.get('url') || '';
  }

  console.log('Target URL:', targetUrl);

  if (targetUrl) {
    // Rewrite URL for cors-anywhere
    req.url = '/' + targetUrl;
  } else {
    // If no target URL found, return error
    res.statusCode = 400;
    return res.end('Bad Request: No target URL specified. Usage: /https://example.com');
  }

  // Proxy the request
  server.emit('request', req, res);
};
