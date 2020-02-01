var express = require('express');
var router = express.Router();
var debug = require('debug')('asn1-playground:index');

/* GET home page. */
router.get('/', function(req, res, next) {
	debug('session: ' + req.session.id);
	res.render('index', { title: 'Express' });
});

module.exports = router;
