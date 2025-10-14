// api/proxy.js - Fixed version
const corsAnywhere = require('cors-anywhere');

// Create CORS Anywhere server
const server = corsAnywhere.createServer({
  originBlacklist: [],
  originWhitelist: [], 
  requireHeader: [], // Disable for testing
  removeHeaders: ['cookie', 'cookie2'],
  redirectSameOrigin: true,
  httpProxyOptions: { xfwd: false },
});

module.exports = (req, res) => {
  console.log('=== INCOMING REQUEST ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  
  // Handle root - show simple info
  if (req.url === '/' || req.url === '') {
    res.setHeader('content-type', 'text/plain');
    return res.end('CORS Anywhere - Vercel\nUsage: /https://example.com');
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Origin');
    res.statusCode = 200;
    return res.end();
  }

  // Extract target URL from the path
  // Format: /https://example.com/path
  let targetUrl = req.url;
  
  console.log('Processing target URL:', targetUrl);
  
  // Pass to cors-anywhere
  server.emit('request', req, res);
};
