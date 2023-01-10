var mongoose = require('mongoose');
var table = mongoose.model('newsletter');


module.exports.AddOne = function (req, res) {

	const email = (req.body.email).trim()
	table
	.findOne({ email: email })
	.exec(function (err, data) {
		if (err) {
			res
				.status(500)
				.json(err);
		} else if (data) {
			res
				.status(200)
				.json({ "message": 'Email Already Registered!', "data": data, "code": 1 });

		} else {
			table
			.create({
				email: email,
			}, function (err, data) {
				if (err) {
					console.log("Error creating");
					res
						.status(400)
						.json(err);
				} else {
					console.log("created!", data);
					res
						.status(201)
						.json({ "message": 'ok', "data": data, "code": 1 });
				}
			});
		}
	})
};

module.exports.GetAll = function (req, res) {

	// console.log('GET the users');
	console.log(req.body);

	var skip = 0;
	var limit = 5;
	var maxCount = 50;

	if (req.body && req.body.skip) {
		skip = parseInt(req.body.skip);
	}

	if (req.body && req.body.limit) {
		limit = parseInt(req.body.limit, 10);
	}

	if (limit > maxCount) {
		res
			.status(400)
			.json({
				"message": "Count limit of " + maxCount + " exceeded"
			});
		return;
	}

	table
		.count()
		.exec(function (err, count) {

			table
				.find()
				.skip(skip)
				.limit(limit)
				.sort({'created_at': 'desc'})
				.exec(function (err, data) {
					console.log(err);
					// console.log(users);
					if (err) {
						// console.log("Error finding users");
						res
							.status(500)
							.json(err);
					} else {
						console.log("Found data", data.length);
						res
							.status(200)
							.json({ "message": 'ok', "data": data, 'count': count, "code": 1 });
					}
				});
		})
};

module.exports.DeleteOne = function (req, res) {
	var Id = req.body._id;
	console.log("delete banner -==>>", Id);
	table
		.findByIdAndRemove(Id)
		.exec(function (err, data) {
			if (err) {
				res
					.status(404)
					.json({ "message": '', "data": err, "code": 0 });
			} else {
				res
					.status(200)
					.json({ "message": 'ok', "data": '', "code": 1 })
				return;
			}
		})
};