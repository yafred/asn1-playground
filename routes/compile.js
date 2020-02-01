var app = require('../app');
var express = require('express');
var router = express.Router();
var debug = require('debug')('asn1-playground:compile');

router.post('/', function(req, res, next) {
	debug('session: ' + req.session.id);
	debug(req.body.specification);
	// test websocket
	app.get('webSocketConnections')[req.session.id].send('Hello from server: ' + req.body.specification);
});

module.exports = router;
