// api/proxy.js - Fixed for Vercel
const corsAnywhere = require('cors-anywhere');

// Parse environment variables
function parseEnvList(env) {
  if (!env) return [];
  return env.split(',').map(s => s.trim()).filter(Boolean);
}

const originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
const originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);

// Create CORS Anywhere as middleware, not server
const corsMiddleware = corsAnywhere.createServer({
  originBlacklist: originBlacklist,
  originWhitelist: originWhitelist,
  requireHeader: [], // Disable for now
  removeHeaders: [
    'cookie',
    'cookie2',
    'x-request-start',
    'x-request-id', 
    'via',
    'connect-time',
    'total-route-time',
  ],
  redirectSameOrigin: true,
  httpProxyOptions: {
    xfwd: false,
  },
});

// Vercel handler
module.exports = (req, res) => {
  console.log('=== VERCEL PROXY ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  
  // Handle specific endpoints
  if (req.url === '/' || req.url === '') {
    console.log('Serving root page');
    res.setHeader('content-type', 'text/plain');
    return res.end('CORS Anywhere on Vercel\nUsage: /https://example.com');
  }

  if (req.url === '/iscorsneeded') {
    console.log('Serving iscorsneeded');
    res.setHeader('content-type', 'text/plain');
    return res.end();
  }

  console.log('Proxying request to CORS Anywhere middleware');
  
  // Pass the request to cors-anywhere middleware
  // Note: We need to handle the async nature properly
  return new Promise((resolve, reject) => {
    corsMiddleware.emit('request', req, res);
    
    res.on('finish', resolve);
    res.on('error', reject);
  });
};
