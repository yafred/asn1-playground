var express = require('express');
var router = express.Router();
var debug = require('debug')('asn1-playground:index');

/* GET home page. */
router.get('/', function(req, res, next) {
	debug('session: ' + req.session.id);
	res.render('index', { sessionId: req.session.id, hostName: req.get('host'), platform: process.platform });
});

module.exports = router;
