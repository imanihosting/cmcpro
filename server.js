const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Make sure we're in production mode
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Next.js instance without conflicting configurations
const app = next({ 
  dev, 
  hostname, 
  port
  // Removed the conf overrides that were causing conflicts
});

const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    console.log('> Server is initializing...');
    
    createServer(async (req, res) => {
      try {
        // Parse the URL
        const parsedUrl = parse(req.url, true);
        
        // Add CORS headers to avoid issues with router state
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,x-nextjs-data');
        
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }
        
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