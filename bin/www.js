#!/usr/bin/env node
/**
 * Module dependencies.
 */

const app = require('../app');
const debug = require('debug')('asn1-playground:server');
const http = require('http');
const webSocketServer = require('websocket').server;
const fs = require("fs");
const dotenv = require('dotenv');


/**
 * Check environment 
 */
dotenv.config();

if('JAVA_HOME' in process.env) {
	if (fs.existsSync(process.env.JAVA_HOME) === false) {
		console.error(process.env.JAVA_HOME + ' does not exist');
		process.exit(1);
	}
}
else {
	console.error('JAVA_HOME must be set');
	process.exit(1);
}

if('ASN1_COMPILER_JAR' in process.env) {
	if (fs.existsSync(process.env.ASN1_COMPILER_JAR) === false) {
		console.error(process.env.ASN1_COMPILER_JAR + ' does not exist');
		process.exit(1);
	}
}
else {
	console.error('ASN1_COMPILER_JAR must be set');
	process.exit(1);
}

if('ASN1_CONVERTER_JAR' in process.env) {
	if (fs.existsSync(process.env.ASN1_CONVERTER_JAR) === false) {
		console.error(process.env.ASN1_CONVERTER_JAR + ' does not exist');
		process.exit(1);
	}
}
else {
	console.error('ASN1_CONVERTER_JAR must be set');
	process.exit(1);
}

if('ASN1_RUNTIME_JAR' in process.env) {
	if (fs.existsSync(process.env.ASN1_RUNTIME_JAR) === false) {
		console.error(process.env.ASN1_RUNTIME_JAR + ' does not exist');
		process.exit(1);
	}
}
else {
	console.error('ASN1_RUNTIME_JAR must be set');
	process.exit(1);
}

if('WORKING_DIR' in process.env) {
	if (fs.existsSync(process.env.WORKING_DIR) === false) {
		console.warn(process.env.WORKING_DIR + ' does not exist');
	}
}
else {
	console.error('WORKING_DIR must be set');
	process.exit(1);
}

debug('Platform is ' + process.platform);
debug('JAVA_HOME is ' + process.env.JAVA_HOME);
debug('WORKING_DIR is ' + process.env.WORKING_DIR);
debug('ASN1_COMPILER_JAR is ' + process.env.ASN1_COMPILER_JAR);
debug('ASN1_CONVERTER_JAR is ' + process.env.ASN1_CONVERTER_JAR);
debug('ASN1_RUNTIME_JAR is ' + process.env.ASN1_RUNTIME_JAR);
debug('VERSION is ' + process.env.VERSION);

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * WebSocket server
 */

app.set('webSocketConnections', new Object());

var wsServer = new webSocketServer({
	// WebSocket server is tied to a HTTP server. WebSocket
	// request is just an enhanced HTTP request. For more info 
	// http://tools.ietf.org/html/rfc6455#page-6
	httpServer : server
});

// WebSocket server
wsServer.on('request', function(request) {
	var connection = request.accept(null, request.origin);
	debug('WebSocket connection accepted');

	// The only message we receive from client is the session ID the client got loading first pages index.js 
	connection.on('message', function(message) {
		debug('Client is ' + message.utf8Data);
		// store connection
		app.get('webSocketConnections')[message.utf8Data] = connection;
	});

	connection.on('close', function(connection) {
		debug('Client closed a socket connection');
	});
});

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
	var port = parseInt(val, 10);

	if (isNaN(port)) {
		// named pipe
		return val;
	}

	if (port >= 0) {
		// port number
		return port;
	}

	return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
	if (error.syscall !== 'listen') {
		throw error;
	}

	var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

	// handle specific listen errors with friendly messages
	switch (error.code) {
	case 'EACCES':
		console.error(bind + ' requires elevated privileges');
		process.exit(1);
		break;
	case 'EADDRINUSE':
		console.error(bind + ' is already in use');
		process.exit(1);
		break;
	default:
		throw error;
	}
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
	var addr = server.address();
	var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
	debug('Listening on ' + bind);
}
