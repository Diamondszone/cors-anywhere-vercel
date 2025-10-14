// api/proxy.js - Enhanced debug version
const corsAnywhere = require('cors-anywhere');

// Parse environment variables
function parseEnvList(env) {
  if (!env) return [];
  return env.split(',').map(s => s.trim()).filter(Boolean);
}

const originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
const originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);

console.log('=== CORS ANYWHERE INIT ===');
console.log('Origin Blacklist:', originBlacklist);
console.log('Origin Whitelist:', originWhitelist);

// Create server
const server = corsAnywhere.createServer({
  originBlacklist: originBlacklist,
  originWhitelist: originWhitelist,
  requireHeader: [], // Disable for debugging
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

// Add event listeners to see what cors-anywhere is doing
server.on('request', (req, res) => {
  console.log('=== CORS-ANYWHERE REQUEST HANDLER ===');
  console.log('CORS Method:', req.method);
  console.log('CORS URL:', req.url);
});

server.on('error', (err) => {
  console.log('=== CORS-ANYWHERE ERROR ===');
  console.log('Error:', err);
});

module.exports = (req, res) => {
  console.log('=== VERCEL HANDLER CALLED ===');
  console.log('Vercel Method:', req.method);
  console.log('Vercel URL:', req.url);
  console.log('Vercel Headers:', JSON.stringify(req.headers, null, 2));
  
  // Handle specific paths
  if (req.url === '/' || req.url === '') {
    console.log('Handling root request');
    res.setHeader('content-type', 'text/plain');
    return res.end('CORS Anywhere - Root\nUse: /https://example.com');
  }

  if (req.url === '/iscorsneeded') {
    console.log('Handling iscorsneeded');
    res.setHeader('content-type', 'text/plain');
    return res.end();
  }

  console.log('Passing to CORS Anywhere...');
  
  // Pass to cors-anywhere
  server.emit('request', req, res);
};
