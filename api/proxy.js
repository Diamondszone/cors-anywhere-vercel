// api/proxy.js - COMPLETELY NEW VERSION
console.log('=== NEW PROXY VERSION LOADED ===');

const https = require('https');
const http = require('http');

module.exports = async (req, res) => {
  console.log('=== NEW PROXY CALLED ===', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }
  
  // Extract target URL
  let targetUrl = '';
  
  if (req.url.startsWith('/https://')) {
    targetUrl = req.url.substring(1);
    console.log('Extracted from path:', targetUrl);
  } else if (req.url.startsWith('/api/proxy')) {
    const queryString = req.url.split('?')[1] || '';
    const params = new URLSearchParams(queryString);
    targetUrl = params.get('url') || '';
    console.log('Extracted from query:', targetUrl);
  }
  
  if (!targetUrl) {
    console.log('No target URL, serving info');
    res.setHeader('content-type', 'text/plain');
    return res.end(`NEW CORS PROXY - WORKING! 🎉
    
Requested: ${req.url}
Time: ${new Date().toISOString()}

Usage:
/https://example.com
/api/proxy?url=https://example.com
`);
  }
  
  console.log('Proxying to:', targetUrl);
  
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
        'Accept': 'image/*',
      }
    };
    
    console.log('Request options:', options);
    
    const proxyReq = lib.request(options, (proxyRes) => {
      console.log('Got proxy response:', proxyRes.statusCode);
      console.log('Response headers:', proxyRes.headers);
      
      // Copy headers
      Object.keys(proxyRes.headers).forEach(key => {
        if (!['connection', 'transfer-encoding'].includes(key.toLowerCase())) {
          res.setHeader(key, proxyRes.headers[key]);
        }
      });
      
      res.statusCode = proxyRes.statusCode;
      
      let responseData = Buffer.from('');
      
      proxyRes.on('data', (chunk) => {
        responseData = Buffer.concat([responseData, chunk]);
      });
      
      proxyRes.on('end', () => {
        console.log('Proxy completed, total size:', responseData.length, 'bytes');
        res.end(responseData);
      });
    });
    
    proxyReq.on('error', (err) => {
      console.error('Proxy request error:', err);
      res.statusCode = 500;
      res.end('Proxy error: ' + err.message);
    });
    
    proxyReq.end();
    
  } catch (error) {
    console.error('Error:', error);
    res.statusCode = 400;
    res.end('Error: ' + error.message);
  }
};
