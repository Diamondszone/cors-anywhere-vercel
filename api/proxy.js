// api/proxy.js - Ultimate simple version
const corsAnywhere = require('cors-anywhere');

// Create server
const server = corsAnywhere.createServer({
  originBlacklist: [],
  originWhitelist: [], 
  requireHeader: [], // Disable header requirement for testing
  removeHeaders: ['cookie', 'cookie2'],
  redirectSameOrigin: true,
  httpProxyOptions: { xfwd: false },
});

module.exports = (req, res) => {
  // Handle root
  if (req.url === '/' || req.url === '') {
    res.setHeader('content-type', 'text/plain');
    return res.end('CORS Anywhere on Vercel\nUsage: /https://example.com');
  }
  
  // Pass everything to cors-anywhere
  server.emit('request', req, res);
};
