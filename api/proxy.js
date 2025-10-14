// api/proxy.js - Fixed URL parsing
console.log('=== PROXY WITH FIXED URL PARSING ===');

const https = require('https');
const http = require('http');

module.exports = async (req, res) => {
  console.log('=== PROXY CALLED ===', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }
  
  // Extract and FIX target URL
  let targetUrl = '';
  
  if (req.url.startsWith('/https:/')) {
    // Vercel mengubah https:// menjadi https:/ (satu slash)
    // Kita perlu memperbaikinya menjadi https://
    targetUrl = 'https://' + req.url.substring(8); // Ubah https:/ menjadi https://
    console.log('Fixed single slash URL:', targetUrl);
  } else if (req.url.startsWith('/https://')) {
    // Jika somehow double slash berhasil
    targetUrl = req.url.substring(1);
    console.log('Using double slash URL:', targetUrl);
  } else if (req.url.startsWith('/api/proxy')) {
    const queryString = req.url.split('?')[1] || '';
    const params = new URLSearchParams(queryString);
    targetUrl = params.get('url') || '';
    console.log('Using query param URL:', targetUrl);
  }
  
  if (!targetUrl) {
    console.log('No target URL, serving info');
    res.setHeader('content-type', 'text/plain');
    return res.end(`CORS PROXY - URL PARSING FIXED! 🎉
    
Requested: ${req.url}
Time: ${new Date().toISOString()}

Usage:
/https://example.com  (Vercel akan ubah menjadi /https:/example.com)
/api/proxy?url=https://example.com
`);
  }
  
  console.log('Final target URL:', targetUrl);
  
  try {
    const urlObj = new URL(targetUrl);
    const lib = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    };
    
    console.log('Making request to:', options.hostname + options.path);
    
    const proxyReq = lib.request(options, (proxyRes) => {
      console.log('Proxy response status:', proxyRes.statusCode);
      console.log('Content-Type:', proxyRes.headers['content-type']);
      
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Expose-Headers', '*');
      
      // Copy relevant headers
      const copyHeaders = ['content-type', 'content-length', 'cache-control'];
      copyHeaders.forEach(header => {
        if (proxyRes.headers[header]) {
          res.setHeader(header, proxyRes.headers[header]);
        }
      });
      
      res.statusCode = proxyRes.statusCode;
      
      let responseData = Buffer.from('');
      
      proxyRes.on('data', (chunk) => {
        responseData = Buffer.concat([responseData, chunk]);
      });
      
      proxyRes.on('end', () => {
        console.log('Request completed. Size:', responseData.length, 'bytes');
        
        // Check if it's an image
        const firstBytes = responseData.slice(0, 4).toString('hex');
        console.log('First bytes (hex):', firstBytes);
        
        if (firstBytes.startsWith('ffd8') || firstBytes.startsWith('8950')) {
          console.log('✅ Valid image received');
        } else {
          console.log('⚠️ Not an image, might be error page');
        }
        
        res.end(responseData);
      });
    });
    
    proxyReq.on('error', (err) => {
      console.error('Proxy request error:', err);
      res.statusCode = 500;
      res.end('Proxy error: ' + err.message);
    });
    
    proxyReq.setTimeout(25000, () => {
      console.error('Proxy request timeout');
      proxyReq.destroy();
      res.statusCode = 504;
      res.end('Proxy timeout');
    });
    
    proxyReq.end();
    
  } catch (error) {
    console.error('URL parsing error:', error);
    res.statusCode = 400;
    res.end('URL error: ' + error.message);
  }
};
