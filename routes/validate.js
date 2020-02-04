const app = require('../app');
const express = require('express');
const router = express.Router();
const debug = require('debug')('asn1-playground:validate');
const fs = require('fs');
const { spawn } = require('child_process');

router.post('/', function(req, res, next) {
	
	debug('session: ' + req.session.id);	
	if(req.session.id in app.get('webSocketConnections') === false) {
		debug('No webSocket for this session');
		return;
	}

	// create the input file is WORKING_DIR
	const sessionPath = process.env.WORKING_DIR + '/' + req.session.id + '.asn';
	debug(sessionPath);
	fs.writeFile(sessionPath, req.body.specification, function (err) {
		  if(err) debug(err);
		});

	// spawn process
	validateCmd = spawn(process.env.JAVA_HOME + '/bin/java', ['-jar', process.env.JAVA_TOOLS_DIR + '/asn1-compiler-with-google-java-format.jar', '-f', sessionPath, '-p']);
	
	// send result to client via websocket
	wsConnection = app.get('webSocketConnections')[req.session.id];
	
	validateCmd.stdout.on('data', function(data) {
		lines = data.toString().match(/[^\r\n]+/g);
		var consoleData = new Object();
		consoleData.type = 'stdout';
		consoleData.lines = lines;
		debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
		wsConnection.send(JSON.stringify(consoleData));
	});

	validateCmd.stderr.on('data', function(data) {
		lines = data.toString().match(/[^\r\n]+/g);
		var consoleData = new Object();
		consoleData.type = 'stderr';
		consoleData.lines = lines;
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
