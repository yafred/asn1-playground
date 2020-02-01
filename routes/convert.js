var express = require('express');
var router = express.Router();
var debug = require('debug')('asn1-playground:convert');

router.post('/', function(req, res, next) {
	debug('session: ' + req.session.id);
	debug(req.body.encodedData);
	// nothing to send, this will be done on websocket
});

module.exports = router;
