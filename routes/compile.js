var app = require('../app');
var express = require('express');
var router = express.Router();
var debug = require('debug')('asn1-playground:compile');

const { spawn } = require('child_process');

router.post('/', function(req, res, next) {
	debug('session: ' + req.session.id);
	debug(req.body.specification);

	wsConnection = app.get('webSocketConnections')[req.session.id];

	asn1Compile = spawn(process.env.JAVA_HOME + '/bin/java', ['-jar', process.env.JAVA_TOOLS_DIR + '/asn1-compiler-with-google-java-format.jar']);
	
	if(process.platform === 'win32') {
		asn1Compile = spawn('cmd', ['/c', process.env.JAVA_HOME + '\\bin\\java.exe', '-jar', process.env.JAVA_TOOLS_DIR + '\\asn1-compiler-with-google-java-format.jar']);
	}

	asn1Compile.stdout.on('data', function(data) {
		consoleData = data.toString().match(/[^\r\n]+/g);
		debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
		wsConnection.send(JSON.stringify(consoleData));
	});

	asn1Compile.stderr.on('data', function(data) {
		consoleData = data.toString().match(/[^\r\n]+/g);
		debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
		wsConnection.send(JSON.stringify(consoleData));
	});

	asn1Compile.on('exit', function(code) {
		//wsConnection.send('END ' + code.toString());
	});
});

module.exports = router;
