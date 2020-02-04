const app = require('../app');
const express = require('express');
const router = express.Router();
const debug = require('debug')('asn1-playground:compile');
const fs = require('fs');
const { spawn } = require('child_process');
const rimraf = require("rimraf");

router.post('/', function(req, res, next) {
	
	debug('session: ' + req.session.id);	
	if(req.session.id in app.get('webSocketConnections') === false) {
		debug('No webSocket for this session');
		return;
	}

	// create session data in WORKING_DIR
	const sessionPath = process.env.WORKING_DIR + '/' + req.session.id;
	debug(sessionPath);
	
	rimraf.sync(sessionPath);
    fs.mkdirSync(sessionPath);
	
	fs.writeFile(sessionPath  + '.asn', req.body.specification, function (err) {
		  if(err) debug(err);
		});
	

	// send result to client via websocket
	wsConnection = app.get('webSocketConnections')[req.session.id];

	function compileJavaClasses() {
		var packageName = fs.readdirSync(sessionPath)[0];
		
		// spawn process
		compileCmd = spawn(process.env.JAVA_HOME + '/bin/javac', ['-cp', process.env.JAVA_TOOLS_DIR + '/asn1-runtime.jar', sessionPath + '/' + packageName + '/*.java']);
		
		compileCmd.stdout.on('data', function(data) {
			lines = data.toString().match(/[^\r\n]+/g);
			var consoleData = new Object();
			consoleData.type = 'stdout';
			consoleData.lines = lines;
			debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
			wsConnection.send(JSON.stringify(consoleData));
		});

		compileCmd.stderr.on('data', function(data) {
			lines = data.toString().match(/[^\r\n]+/g);
			var consoleData = new Object();
			consoleData.type = 'stderr';
			consoleData.lines = lines;
			debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
			wsConnection.send(JSON.stringify(consoleData));
		});

		compileCmd.on('exit', function(code) {
			var consoleData = new Object();

			consoleData.type = 'stdout';
			consoleData.lines = [ "Java classes compiled ..." ];
			debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
			wsConnection.send(JSON.stringify(consoleData));

			consoleData.type = 'exit';
			consoleData.command = 'compile';
			consoleData.code = code.toString();
			debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
			wsConnection.send(JSON.stringify(consoleData));
		});
	}
	
	// spawn process
	generateCmd = spawn(process.env.JAVA_HOME + '/bin/java', ['-jar', process.env.JAVA_TOOLS_DIR + '/asn1-compiler-with-google-java-format.jar', '-f', sessionPath + '.asn', '-jo', sessionPath]);
	
	generateCmd.stdout.on('data', function(data) {
		lines = data.toString().match(/[^\r\n]+/g);
		var consoleData = new Object();
		consoleData.type = 'stdout';
		consoleData.lines = lines;
		debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
		wsConnection.send(JSON.stringify(consoleData));
	});

	generateCmd.stderr.on('data', function(data) {
		lines = data.toString().match(/[^\r\n]+/g);
		var consoleData = new Object();
		consoleData.type = 'stderr';
		consoleData.lines = lines;
		debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
		wsConnection.send(JSON.stringify(consoleData));
	});

	generateCmd.on('exit', function(code) {
		var consoleData = new Object();
		
		consoleData.type = 'stdout';
		consoleData.lines = [ "Java source generated ..." ];
		debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
		wsConnection.send(JSON.stringify(consoleData));
		
		compileJavaClasses();
	});
		
	res.send(); // send a response to avoid the 2 minutes retry from the browser
});

module.exports = router;
