const app = require('../app');
const express = require('express');
const router = express.Router();
const debug = require('debug')('asn1-playground:info');
const { spawn } = require('child_process');
// https://tc39.es/ecma262/#sec-destructuring-assignment
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment#Object_destructuring

router.post('/', function(req, res, next) {
	
	debug('session: ' + req.session.id);	
	if(req.session.id in app.get('webSocketConnections') === false) {
		debug('No webSocket for this session');
		return;
	}

	// spawn process
	versionCmd = spawn(process.env.JAVA_HOME + '/bin/java', ['-jar', process.env.ASN1_COMPILER_JAR, '-v']);
	
	// send a response to avoid the 2 minutes retry from the browser
	res.send();

	// send result to client via websocket
	wsConnection = app.get('webSocketConnections')[req.session.id];
	
	versionCmd.stdout.on('data', function(data) {
		var consoleData = new Object();
		consoleData.type = 'stdout';
		data = 'Compiler: ' + data;
		consoleData.lines = data.toString().match(/[^\r\n]+/g);
		debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
		wsConnection.send(JSON.stringify(consoleData));
	});

	versionCmd.stderr.on('data', function(data) {
		var consoleData = new Object();
		consoleData.type = 'stderr';
		consoleData.lines = data.toString().match(/[^\r\n]+/g);
		debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
		wsConnection.send(JSON.stringify(consoleData));
	});

	versionCmd.on('exit', function (code) {
		showConverterVersion();
	});

	function showConverterVersion() {
		// spawn process
		versionCmd2 = spawn(process.env.JAVA_HOME + '/bin/java', ['-jar', process.env.ASN1_CONVERTER_JAR, '-v']);
	
		versionCmd2.stdout.on('data', function(data) {
			var consoleData = new Object();
			consoleData.type = 'stdout';
			data = 'Converter: ' + data;
			consoleData.lines = data.toString().match(/[^\r\n]+/g);
			debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
			wsConnection.send(JSON.stringify(consoleData));
		});
	
		versionCmd2.stderr.on('data', function(data) {
			var consoleData = new Object();
			consoleData.type = 'stderr';
			consoleData.lines = data.toString().match(/[^\r\n]+/g);
			debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
			wsConnection.send(JSON.stringify(consoleData));
		});	
	}
});

module.exports = router;
