var mongoose = require('mongoose');
var table = mongoose.model('role_modules');

module.exports.AddOne = function (req, res) {
	console.log("POST new data --==>>");

		console.log("api hitted --===>>")
		table
			.create({
				name: req.body.name,
				status: req.body.status
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
};

module.exports.GetAll = function (req, res) {

	// console.log('GET the users');
	console.log(req.body);

	var skip = req.body.skip;
	var limit = req.body.limit;

	table
		.count()
		.exec(function (err, count) {

			table
				.find()
				.skip(skip)
				.limit(limit)
				.sort({ 'created_at': -1 })
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

module.exports.Update = function (req, res) {

	table
		.findById(req.body._id)
		.exec(function (err, data) {
			if (err) {
				res
					.status(404)
					.json({ "message": 'err', "data": err, "code": 0 });
				return;
			} else if (!data) {
				res
					.status(404)
					.json({ "message": 'id not found in the database', "data": '', "code": 0 })
				return;
			}

			var updateData = {
				name: req.body.name,
				status: req.body.status,
			}
			table
				.update({ _id: Id }, { $set: updateData }, function (err, data) {
					if (err) {
						res
							.status(500)
							.json({ "message": '', "data": err, "code": 0 });
					} else {
						res
							.status(200)
							.json({ "message": 'ok', "data": '', "code": 1 });
						return;
					}
				})
		});
}

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