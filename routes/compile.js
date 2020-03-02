const app = require('../app');
const express = require('express');
const router = express.Router();
const debug = require('debug')('asn1-playground:compile');
const fs = require('fs');
const archiver = require('archiver');
const { spawn } = require('child_process');
const rimraf = require("rimraf");

router.post('/', function (req, res, next) {

	debug('session: ' + req.session.id);
	if (req.session.id in app.get('webSocketConnections') === false) {
		debug('No webSocket for this session');
		return;
	}

	// create session data in WORKING_DIR
	const sessionPath = process.env.WORKING_DIR + '/' + req.session.id;
	debug(sessionPath);

	rimraf.sync(sessionPath);
	fs.mkdirSync(sessionPath);

	fs.writeFile(sessionPath + '.asn', req.body.specification, function (err) {
		if (err) debug(err);
	});


	// spawn process
	generateCmd = spawn(process.env.JAVA_HOME + '/bin/java', ['-jar', process.env.ASN1_COMPILER_JAR, '-f', sessionPath + '.asn', '-jb', '-jo', sessionPath]);

	// send a response to avoid the 2 minutes retry from the browser
	res.send();

	// send result to client via websocket
	wsConnection = app.get('webSocketConnections')[req.session.id];

	generateCmd.stdout.on('data', function (data) {
		lines = data.toString().match(/[^\r\n]+/g);
		var consoleData = new Object();
		consoleData.type = 'stdout';
		consoleData.lines = lines;
		debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
		wsConnection.send(JSON.stringify(consoleData));
	});

	generateCmd.stderr.on('data', function (data) {
		lines = data.toString().match(/[^\r\n]+/g);
		var consoleData = new Object();
		consoleData.type = 'stderr';
		consoleData.lines = lines;
		debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
		wsConnection.send(JSON.stringify(consoleData));
	});

	generateCmd.on('exit', function (code) {
		var consoleData = new Object();

		consoleData.type = 'stdout';
		consoleData.lines = ["Java source generated ..."];
		debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
		wsConnection.send(JSON.stringify(consoleData));

		compileJavaClasses();
	});

	function compileJavaClasses() {
		var args = ['-cp', process.env.ASN1_RUNTIME_JAR];

		var dirEntries = fs.readdirSync(sessionPath, { withFileTypes: true });
		var packageName = '';
		for (i = 0; i < dirEntries.length; i++) {
			if (dirEntries[i].isDirectory()) {
				packageName = dirEntries[i].name;
			}
		}

		// build an array of files 
		var srcFiles = fs.readdirSync(sessionPath + '/' + packageName);
		for (var i = 0; i < srcFiles.length; i++) {
			args.push(sessionPath + '/' + packageName + '/' + srcFiles[i]);
		}

		// spawn process
		compileCmd = spawn(process.env.JAVA_HOME + '/bin/javac', args);

		compileCmd.stdout.on('data', function (data) {
			lines = data.toString().match(/[^\r\n]+/g);
			var consoleData = new Object();
			consoleData.type = 'stdout';
			consoleData.lines = lines;
			debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
			wsConnection.send(JSON.stringify(consoleData));
		});

		compileCmd.stderr.on('data', function (data) {
			lines = data.toString().match(/[^\r\n]+/g);
			var consoleData = new Object();
			consoleData.type = 'stderr';
			consoleData.lines = lines;
			debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
			wsConnection.send(JSON.stringify(consoleData));
		});

		compileCmd.on('exit', function (code) {
			var consoleData = new Object();
			consoleData.type = 'stdout';
			consoleData.lines = ["Java classes compiled ..."];
			debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
			wsConnection.send(JSON.stringify(consoleData));

			consoleData = new Object();
			consoleData.type = 'map';
			consoleData.content = fs.readFileSync(sessionPath + '/asn1-java.map', 'utf8');
			debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
			wsConnection.send(JSON.stringify(consoleData));

			consoleData = new Object();
			consoleData.type = 'exit';
			consoleData.command = 'compile';
			consoleData.code = code.toString();
			debug('Sending ' + JSON.stringify(consoleData).length + ' chars');
			wsConnection.send(JSON.stringify(consoleData));

			zipJavaClasses();
		});
	}

	function zipJavaClasses() {
		// create a file to stream archive data to.
		var output = fs.createWriteStream(sessionPath + '.zip');
		var archive = archiver('zip');

		// listen for all archive data to be written
		// 'close' event is fired only when a file descriptor is involved
		output.on('close', function () {
			debug(archive.pointer() + ' total bytes');
			debug('archiver has been finalized and the output file descriptor has closed.');
		});

		// This event is fired when the data source is drained no matter what was the data source.
		// It is not part of this library but rather from the NodeJS Stream API.
		// @see: https://nodejs.org/api/stream.html#stream_event_end
		output.on('end', function () {
			debug('data source drained');
		});

		// good practice to catch warnings (ie stat failures and other non-blocking errors)
		archive.on('warning', function (err) {
			if (err.code === 'ENOENT') {
				// log warning
			} else {
				// log  error
			}
		});

		// good practice to catch this error explicitly
		archive.on('error', function (err) {
			// log error
		});

		// pipe archive data to the file
		archive.pipe(output);

		// append files from a glob pattern
		archive.directory(sessionPath + '/', 'java');

		// finalize the archive (ie we are done appending files but streams have to finish yet)
		// 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
		archive.finalize();
	}
});

module.exports = router;
