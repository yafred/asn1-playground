const app = require('../app');
const express = require('express');
const router = express.Router();
const debug = require('debug')('asn1-playground:validate');
const fs = require('fs');
const { spawn } = require('child_process');
// https://tc39.es/ecma262/#sec-destructuring-assignment
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment#Object_destructuring

router.post('/', function(req, res, next) {
	
	debug('session: ' + req.session.id);	
	if(req.session.id in app.get('webSocketConnections') === false) {
		debug('No webSocket for this session');
		return;
	}

	// create the input file is WORKING_DIR
	const specificationPath = process.env.WORKING_DIR + '/' + req.session.id + '.asn';
	debug(specificationPath);
	fs.writeFile(specificationPath, req.body.specification, function (err) {
		  if(err) debug(err);
		});

	// spawn process
	validateCmd = spawn(process.env.JAVA_HOME + '/bin/java', ['-jar', process.env.JAVA_TOOLS_DIR + '/asn1-compiler-with-google-java-format.jar', '-f', specificationPath, '-p']);
	
	// send result to client via websocket
	wsConnection = app.get('webSocketConnections')[req.session.id];
	
	validateCmd.stdout.on('data', function(data) {
		var consoleData = new Object();
		consoleData.type = 'stdout';
		dataString = data.toString();
		lastChar = dataString.charAt(dataString.length-1);
		if(lastChar == '\n' || lastChar == '\r') {
			consoleData.eol = true;
		}
		consoleData.lines = dataString.match(/[^\r\n]+/g);
		debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
		wsConnection.send(JSON.stringify(consoleData));
	});

	validateCmd.stderr.on('data', function(data) {
		var consoleData = new Object();
		consoleData.type = 'stderr';
		dataString = data.toString();
		lastChar = dataString.charAt(dataString.length-1);
		if(lastChar == '\n' || lastChar == '\r') {
			consoleData.eol = true;
		}
		consoleData.lines = dataString.match(/[^\r\n]+/g);
		debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
		wsConnection.send(JSON.stringify(consoleData));
	});

	validateCmd.on('exit', function(code) {
		var consoleData = new Object();
		consoleData.type = 'exit';
		consoleData.command = 'validate';
		consoleData.code = code.toString();
		debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
		wsConnection.send(JSON.stringify(consoleData));
	});
	
	res.send(); // send a response to avoid the 2 minutes retry from the browser
});

module.exports = router;
