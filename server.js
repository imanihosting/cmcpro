const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');
const next = require('next');

// Make sure we're in production mode
const dev = false;
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Next.js instance with dynamic rendering
const app = next({ 
  dev, 
  hostname, 
  port,
  conf: {
    // Force dynamic rendering for all pages
    staticPageGenerationTimeout: 10,
    // Completely disable static optimization
    experimental: {
      disableOptimizedLoading: true,
    }
  }
});

const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    console.log('> Server is initializing...');
    
    createServer(async (req, res) => {
      try {
        // Parse the URL
        const parsedUrl = parse(req.url, true);
        const { pathname, query } = parsedUrl;
        
        console.log(`> Request: ${pathname}`);
        
        // Let Next.js handle all requests
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }).listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://${hostname}:${port}`);
    });
  })
  .catch((ex) => {
    console.error('Error starting server:', ex);
    process.exit(1);
  }); 