const app = require('../app');
const express = require('express');
const router = express.Router();
const debug = require('debug')('asn1-playground:convert');
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
	const encodedDataPath = process.env.WORKING_DIR + '/' + req.session.id + '.data';
	debug(encodedDataPath);
	fs.writeFile(encodedDataPath, req.body.encodedData, function (err) {
		  if(err) debug(err);
		});

	// spawn process
	cpSeparator = ':';
	if(process.platform == 'win32') cpSeparator = ';';
	convertCmd = spawn(process.env.JAVA_HOME + '/bin/java', ['-cp', process.env.JAVA_TOOLS_DIR + '/asn1-converter.jar' + cpSeparator + process.env.WORKING_DIR + '/' + req.session.id, 'com.yafred.asn1.tool.Converter']);
	
	// send result to client via websocket
	wsConnection = app.get('webSocketConnections')[req.session.id];
	
	convertCmd.stdout.on('data', function(data) {
		lines = data.toString().match(/[^\r\n]+/g);
		var consoleData = new Object();
		consoleData.type = 'stdout';
		consoleData.lines = lines;
		debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
		wsConnection.send(JSON.stringify(consoleData));
	});

	convertCmd.stderr.on('data', function(data) {
		lines = data.toString().match(/[^\r\n]+/g);
		var consoleData = new Object();
		consoleData.type = 'stderr';
		consoleData.lines = lines;
		debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
		wsConnection.send(JSON.stringify(consoleData));
	});

	convertCmd.on('exit', function(code) {
		var consoleData = new Object();
		consoleData.type = 'exit';
		consoleData.command = 'convert';
		consoleData.code = code.toString();
		debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
		wsConnection.send(JSON.stringify(consoleData));
	});
	
	res.send(); // send a response to avoid the 2 minutes retry from the browser
});

module.exports = router;
