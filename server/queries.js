var fire = require('firebase');
var Fireproof = require('fireproof');
var Promise = require('bluebird');
var ref = new fire('https://rooftopapp.firebaseio.com/');
var fireproof = new Fireproof(ref);
Fireproof.bless(Promise);

exports.getList = function(req, res, next) {
  res.bars = [];
  console.log(req.body.zipCode);

	if (req.body.city) {
		// console.log('got a city search for ' + req.body.city);
		queryDB(req, res, next, 'location/city', req.body.city);
	} else if (req.body.zipCode) {
		// console.log('got a zip search for ' + req.body.zipCode);
		queryDB(req, res, next, 'location/postal_code', req.body.zipCode);
	}
};

function queryDB(req, res, next, searchParam, queryParam) {
		fireproof.orderByChild(searchParam)
		.equalTo(queryParam)
		.on('child_added', function(snapshot) {
			res.bars.push(snapshot.val());
  	})
  	.then(function() {

  		next();
  	})
}