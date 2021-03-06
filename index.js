/*
* Primary file for the API
*
*
*/

// Dependencies
const http = require('http');
// import * as http from 'http';
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs')

// Instantiate the HTTP Server
const httpServer = http.createServer((req, res) => {
  unifiedServer(req,res);
})


// start the HTTP server
httpServer.listen(config.httpPort, () => {
  console.log('The server is listening on port '+config.httpPort+' '+config.envName+' now');
})

// Instantiate the HTTPS Server
const httpsServerOptions = {
  'key' : fs.readFileSync('./https/key.pem'),
  'cert' : fs.readFileSync('./https/cert.pem')
}
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  unifiedServer(req,res);
})

// start the HTTPS server
httpsServer.listen(config.httpsPort, () => {
  console.log('The server is listening on port '+config.httpsPort+' '+config.envName+' now');
})

// All the server logic for both the http and https server
const unifiedServer = (req,res) => {
  // Get the URL and parse it
  const parsedUrl = url.parse(req.url, true);

  // Get the path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g,'');

  // Get the query string as an object
  const queryStringObject = JSON.stringify(parsedUrl.query);
  // const queryStringObject = parsedUrl.query;


  // Get the HTTP Method
  const method = req.method.toLowerCase();

  // Get the headers as an object
  const headers = JSON.stringify(req.headers);
  // const headers = req.headers;

  // Get the payload, if any
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', (data) => buffer += decoder.write(data));
  req.on('end', () => {
    buffer += decoder.end();

    // Choose the handler this request should go to. If one is not found, use the notFound handler
    const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    // Construct the date object to send to the handlers
    const data = {
      'trimmedPath' : trimmedPath,
      'queryStringObject' : queryStringObject,
      'method' : method,
      'headers' : headers,
      'payload' : buffer
    }

    // Route the request to the handler specified in the router
    chosenHandler(data, (statusCode, payload) => {

      // Use the status code called back by the handler, or default to 200
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

      // Use the payload called back by the handler, or default to an empty object
      payload = typeof(payload) == 'object' ? payload : {};

      // Convert to payload to a String
      const payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader('Content-Type', 'application/json')
      res.writeHead(statusCode);
      res.end(payloadString);

      // Log the request path
      console.log('Request received on path: '+trimmedPath
      +' with this method: '+method+' and with these query string parameters: '
      +queryStringObject+' with these headers: '+headers+'. Returning this response: '
      +statusCode,payloadString);

    })

  })
}

// Define the handlers
const handlers = {};

// Ping handlers
handlers.hello = (data, callback) => {
  // Callback a http status code, and a payload object
  callback(406,{'name':'hello handler'});
}

// Not found handler
handlers.notFound = (data, callback) => {
  callback(404);
}

// Define a request router
const router = {
  'hello' : handlers.hello,
}
