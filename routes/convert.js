var app = require('../app');
var express = require('express');
var router = express.Router();
var debug = require('debug')('asn1-playground:convert');

const { spawn } = require('child_process');

router.post('/', function(req, res, next) {
	debug('session: ' + req.session.id);
	debug(req.body.encodedData);

});

module.exports = router;
