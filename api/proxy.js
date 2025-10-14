// api/proxy.js - Exact replica of cors-anywhere behavior
const corsAnywhere = require('cors-anywhere');

// Parse environment variables like original
function parseEnvList(env) {
  if (!env) return [];
  return env.split(',').map(s => s.trim()).filter(Boolean);
}

const originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
const originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);

// Rate limiting (optional)
let checkRateLimit = null;
try {
  checkRateLimit = require('cors-anywhere/lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);
} catch (_) {
  // Skip if not available
}

// Create server EXACTLY like original
const server = corsAnywhere.createServer({
  originBlacklist: originBlacklist,
  originWhitelist: originWhitelist,
  requireHeader: ['origin', 'x-requested-with'],
  checkRateLimit: checkRateLimit,
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

// Vercel handler - pass through everything
module.exports = (req, res) => {
  console.log('=== CORS-ANYWHERE VERCEL ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  
  // Handle root and specific paths like original
  if (req.url === '/' || req.url === '') {
    // Show help page exactly like original
    res.setHeader('content-type', 'text/plain');
    return res.end(`This API enables cross-origin requests to anywhere.

Usage:
/${' '}
/<url>${' '.repeat(27)}Create a request to <url>, and includes CORS headers in the response.

If the protocol is omitted, it defaults to http (https if port 443 is specified).

Cookies are disabled and stripped from requests.

Redirects are automatically followed. For debugging purposes, each followed redirect results
in the addition of a X-CORS-Redirect-n header, where n starts at 1. These headers are not
accessible by the XMLHttpRequest API.
After 5 redirects, redirects are not followed any more. The redirect response is sent back
to the browser, which can choose to follow the redirect (handled automatically by the browser).

The requested URL is available in the X-Request-URL response header.
The final URL, after following all redirects, is available in the X-Final-URL response header.

To prevent the use of the proxy for casual browsing, the API requires either the Origin
or the X-Requested-With header to be set. To avoid unnecessary preflight (OPTIONS) requests,
it's recommended to not manually set these headers in your code.

Demo    : https://robwu.nl/cors-anywhere.html
Source code : https://github.com/Rob--W/cors-anywhere/
Documentation : https://github.com/Rob--W/cors-anywhere/#documentation
`);
  }

  if (req.url === '/iscorsneeded') {
    // This is the only resource on this host which is served without CORS headers.
    res.setHeader('content-type', 'text/plain');
    return res.end();
  }

  // For all other requests, pass to cors-anywhere
  // CORS Anywhere will automatically handle:
  // - /http://example.com
  // - /https://example.com  
  // - //example.com (protocol relative)
  // - /example.com (default to http)
  server.emit('request', req, res);
};
