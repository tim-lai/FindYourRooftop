var fire = require('firebase');
var Fireproof = require('fireproof');
var Promise = require('bluebird');
var ref = new fire('https://crackling-heat-2550.firebaseio.com/');
var fireproof = new Fireproof(ref);
Fireproof.bless(Promise);
var usersRef = fireproof.child('users');
//note: use 'results' for now. expect to change to 'curated' in final db
var curatedRef = fireproof.child('results');
var suggestedRef = fireproof.child('suggestions')
var testingRef = fireproof.child('Testing');

// search queries
exports.getList = function(req, res, next) {
  res.bars = [];
  // console.log('getting a zipcode:');
  // console.log(req.body.zipCode);
  // console.log('getting a city');
  // console.log(req.body.city);
	if (req.body.city) {
		var camelCaseString = function(string) {
        return string.replace(/(\b[a-z])/g, function(char) { return char.toUpperCase() });
      };
    var city = camelCaseString(req.body.city);
		// console.log('got a city search for ' + city);
		queryDB(req, res, next, 'location/city', city);
	} else if (req.body.zipCode) {
		// console.log('got a zip search for ' + req.body.zipCode);
		queryDB(req, res, next, 'location/postal_code', req.body.zipCode);
		// queryDB(req, res, next, 'postal_code', req.body.zipCode);
	} else {
		console.log('PLEASE ENTER A CITY OR ZIP CODE');
	}
};

exports.deleteSuggestions = function(req, res, next) {
	suggestedRef.on('value', function(snapshot) {
		var suggestions = snapshot.val();

		for(var key in suggestions) {
			for(var i=0; i < req.body.length; i++) {
				if(req.body[i] === suggestions[key].name) {
					suggestedRef.child(key).remove();
				}
			}
		}
	})
	next();
}

exports.approveSuggestions = function(req, res, next) {
	// console.log('req.body is ' + req.body);
	var suggestions;
	var temp = [];
	suggestedRef.on('value', function(snapshot) {
	suggestions = snapshot.val();
	for(var key in suggestions) {
		for(var i=0; i < req.body.length; i++) {
			if(req.body[i] === suggestions[key].name) {
				// console.log('req.body[i] is ' + req.body[i] + ' suggestions is ' + suggestions[key].name)
				curatedRef.push(suggestions[key]);
				// suggestedRef.child(key).remove();
			}
		}
	}
	next();
	})
}



exports.getSuggestions = function(req, res, next) {
	res.sugg = [];
	suggestedRef.on('value', function(snapshot) {
		var suggestions = snapshot.val();
		for(var key in suggestions) {
			res.sugg.push({name: suggestions[key]['name'], rating: suggestions[key]['rating'], link: suggestions[key]['url']})
		}
	}).then(function() {
		next();
	})
	// console.log('what res.sugg has ' + res.sugg[0]['name'] + res.sugg[0]['rating'] + res.sugg[0]['link'])
}

exports.postToDB = function(req, res, next) {
	// console.log('req.body is ' + JSON.stringify(req.body))
	// console.log('response is: ' + req.body.name)
	suggestedRef.push(req.body)
	next();
}

// helper for getList^
function queryDB(req, res, next, searchParam, queryParam) {
	// console.log('going to look for bars in the db');
	// console.log('searchParam is: ' + searchParam);
	// console.log('queryParam is: ' + queryParam);
	fireproof.child('results').orderByChild(searchParam)
	.equalTo(queryParam)
	.on('child_added', function(snapshot) {
		// console.log('inside search');
		// console.log(snapshot);
		var testName = snapshot.key();
		var testData = snapshot.val();
		// console.log('testName is: ' + testName);
		// console.log('testData is: ' + testData);
		// console.log('something found in db');
		res.bars.push(snapshot.val());
	})
	.then(function() {
		console.log('NEXT');
		next();
	})
};

// user queries
exports.addUser = function(req, res, user, callback) {
			usersRef.push(user);
			callback(req, res, user);
};

exports.findUser = function(req, res, user, callback) {
	// console.log('going to look for user in db');
	var found;
	usersRef.orderByChild('email')
	.equalTo(req.body.email)
	.on('child_added', function(snapshot) {
		// console.log('User was found: ');
		found = snapshot.val();
	}, function() {
		// console.log('error in querying for user');
		res.send('db error');
	})
	.then(function() {
		// console.log('(finduser) queries.js running callback');
		if (found) {
			// console.log('(finduser) we found ' + found.email);
			callback(req, res, user, found);
		} else if (found === null) {
			// console.log('the user is null');
			res.send('user not found');
		}
	})
};

exports.findLocation = function(req, res, location, callback) {
	// console.log('going to look for curated location in db');
	var found;
	//note: 'name' is a placeholder pending final db setup
	curatedRef.orderByChild('name')
	.equalTo(req.body.name)
	.on('child_added', function(snapshot) {
		// console.log('Curated Location was found: ');
		found = snapshot.val();
	}, function() {
		// console.log('error in querying for curated location');
		res.send('db error');
	})
	.then(function() {
		if (found) {
			// console.log('(findLocation) we found ' );
			callback(req, res, location, found);
		} else if (found === null) {
			// console.log('the location is null');
			res.send('location not found');
		}
	})
};

exports.addLocation = function(req, res, location, callback) {
  curatedRef.push(location);
  callback(req, res, user);
}



