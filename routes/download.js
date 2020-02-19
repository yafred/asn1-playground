const express = require('express');
const router = express.Router();
const debug = require('debug')('asn1-playground:download');

/* GET home page. */
router.get('/', function(req, res, next) {
	debug('session: ' + req.session.id);
	const sessionPath = process.env.WORKING_DIR + '/' + req.session.id;
	res.download(sessionPath + '.zip');
});

module.exports = router;
