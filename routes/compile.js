var app = require('../app');
var express = require('express');
var router = express.Router();
var debug = require('debug')('asn1-playground:compile');
const fs = require('fs');
const { spawn } = require('child_process');

router.post('/', function(req, res, next) {
	debug('session: ' + req.session.id);
	
	if(req.session.id in app.get('webSocketConnections') === false) {
		debug('No webSocket for this session');
		return;
	}

	// create the input file is WORKING_DIR
	const filePath = process.env.WORKING_DIR + '/' + req.session.id + '.asn';
	debug(filePath);
	fs.writeFile(filePath, req.body.specification, function (err) {
		  if(err) debug(err);
		});
	
	wsConnection = app.get('webSocketConnections')[req.session.id];
	
	asn1Compile = spawn(process.env.JAVA_HOME + '/bin/java', ['-jar', process.env.JAVA_TOOLS_DIR + '/asn1-compiler-with-google-java-format.jar', '-f', filePath, '-p']);
	
	if(process.platform === 'win32') {
		asn1Compile = spawn('cmd', ['/c', process.env.JAVA_HOME + '\\bin\\java.exe', '-jar', process.env.JAVA_TOOLS_DIR + '\\asn1-compiler-with-google-java-format.jar', '-f', filePath, '-p']);
	}

	asn1Compile.stdout.on('data', function(data) {
		lines = data.toString().match(/[^\r\n]+/g);
		var consoleData = new Object();
		consoleData.type = 'stdout';
		consoleData.lines = lines;
		debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
		wsConnection.send(JSON.stringify(consoleData));
	});

	asn1Compile.stderr.on('data', function(data) {
		lines = data.toString().match(/[^\r\n]+/g);
		var consoleData = new Object();
		consoleData.type = 'stderr';
		consoleData.lines = lines;
		debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
		wsConnection.send(JSON.stringify(consoleData));
	});

	asn1Compile.on('exit', function(code) {
		var consoleData = new Object();
		consoleData.type = 'exit';
		consoleData.code = code.toString();
		debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
		wsConnection.send(JSON.stringify(consoleData));
	});
	
	res.send(); // send a response to avoid the 2 minutes retry from the browser
});

module.exports = router;
