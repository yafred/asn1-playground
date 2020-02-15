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
	convertCmd = spawn(process.env.JAVA_HOME + '/bin/java', 
	['-cp', process.env.ASN1_CONVERTER_JAR + cpSeparator + process.env.WORKING_DIR + '/' + req.session.id, 
	'com.yafred.asn1.tool.Converter',
	'-dec', req.body.decode,
	'-enc', req.body.encode,
	'-c', req.body.className,
	'-i', encodedDataPath
	]);

	// send a response to avoid the 2 minutes retry from the browser
	res.send();

	// send result to client via websocket
	wsConnection = app.get('webSocketConnections')[req.session.id];
	
	convertCmd.stdout.on('data', function(data) {
		var consoleData = new Object();
		consoleData.type = 'stdout';
		consoleData.lines = data.toString().match(/[^\r\n]+/g);
		debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
		wsConnection.send(JSON.stringify(consoleData));
	});

	convertCmd.stderr.on('data', function(data) {
		var consoleData = new Object();
		consoleData.type = 'stderr';
		consoleData.lines = data.toString().match(/[^\r\n]+/g);
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
	
});

module.exports = router;
