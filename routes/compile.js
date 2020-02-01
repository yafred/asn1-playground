var express = require('express');
var router = express.Router();
var debug = require('debug')('asn1-playground:compile');

router.post('/', function(req, res, next) {
	debug(req.body.specification);
	res.send('respond with a resource');
});

module.exports = router;
