require('rootpath')();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('_helpers/jwt');
const errorHandler = require('_helpers/error-handler');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// use JWT auth to secure the api
app.use(jwt());

// api routes
app.use('/users', require('./users/users.controller'));

app.use(express.static('/public'));
app.use('/public', express.static(__dirname + '/public'));

/*app.use("/", function(req, res) {
    res.sendFile(process.cwd() + '/public/index.html');
});
/*app.use("/public/jwtvanilla.js", function(req, res) {
    res.sendFile(process.cwd() + '/public/jwtvanilla.js');
});
app.use("/jwtvanilla.js", function(req, res) {
    res.sendFile(process.cwd() + '/public/jwtvanilla.js');
});*/


// global error handler
app.use(errorHandler);


// start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
const server = app.listen(port, function () {
    console.log('Server listening on port ' + port);
});


//------------------------------------------------------------------------------------------------------------------------
var message_history = [ ];
var message_history_maxlength = 100;
var connected_clients = [ ];

var WebSocketServer = require('websocket').server;

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false,
    //closeTimeout = 30000 /* close conn after 30 sesconds */
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

/**
 * Helper function for escaping input strings
 */
function htmlEntities(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) { // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date().toLocaleString()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    //var connection = request.accept('echo-protocol', request.origin);
    var connection = request.accept(null, request.origin);

    console.log((new Date().toLocaleString()) + ' Connection accepted from: ' + request.origin);

    var client_index = connected_clients.push(connection) - 1;

    if (message_history.length > 0) {
        connection.sendUTF(JSON.stringify( { type: 'history', data: message_history} ));
    }

    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            /*console.log('Received Message: ' + message.utf8Data);
            connection.sendUTF(message.utf8Data);*/

            console.log((new Date()) + ' Received Message from ' + connection.remoteAddress + ': ' + message.utf8Data);
            // we want to keep history of all sent messages
            var obj = {
                time: (new Date()),
                text: htmlEntities(message.utf8Data),
                author: connection.remoteAddress
            };
            message_history.push(obj);
            message_history = message_history.slice(-message_history_maxlength);
            // broadcast message to all connected clients
            var json = JSON.stringify({ type: 'message', data: obj });
            for (var i=0; i<connected_clients.length; i++) {
                connected_clients[i].sendUTF(json);
            }
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date().toLocaleString()) + ' Peer ' + connection.remoteAddress + ' disconnected.' + '\n' + 'ReasonCode: "' + reasonCode + '"' + '\n' + 'Description: "' + description + '"');
        for(var i=0; i<connected_clients.length; i++) {
            if (connected_clients[i] == connection) {
                connected_clients.slice(i,1);
            }
        }
    });
});