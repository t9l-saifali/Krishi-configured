var mongoose = require('mongoose');
var table = mongoose.model('banner');
var multer = require('multer');
var fileStorage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, './public/upload/')
	},
	filename: function (req, file, cb) {

		var ext = file.mimetype.split("/");
		cb(null, uniqueId(10) + '' + Date.now() + '.' + ext[1]);
	}
});
var upload = multer({
	storage: fileStorage,
}).any();

function uniqueId(length) {
	var result = '';
	var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

module.exports.AddOne = function (req, res) {
	console.log("POST new data --==>>");

	upload(req, res, function (err) {
		console.log("api hitted --===>>")
		table
			.create({
				icon: req.files.filter(i => i.fieldname === 'icon').map(i => i.filename),
				image: req.files.filter(i => i.fieldname === 'image').map(i => i.filename),
				banner: req.files.filter(i => i.fieldname === 'banner').map(i => i.filename),
				link: req.body.link,
				status: req.body.status,
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
		.find()
		.skip(skip)
		.limit(limit)
		.sort({'created_at': 'desc'})
		.exec(function (err, data) {
			if (err) {
				res
					.status(500)
					.json(err);
			} else {
				console.log("Found data", data.length);
				res
					.status(200)
					.json({ "message": 'ok', "data": data, "code": 1 });
			}
		});

};

module.exports.GetAllActive = function (req, res) {
	table
		.find({ status: true })
		.sort({'created_at': 'desc'})
		.exec(function (err, data) {
			if (err) {
				res
					.status(500)
					.json(err);
			} else {
				console.log("Found data", data.length);
				res
					.status(200)
					.json({ "message": 'ok', "data": data, "code": 1 });
			}
		});

};

module.exports.Update = function (req, res) {
	var Id = req.body.id;
	upload(req, res, function (err) {
		var image = ''
		for (var j = 0; j < req.files.length; j++) {
			if (req.files[j].fieldname === 'image') {
				image = req.files[j].filename;
			}
		}

		table
			.findById(Id)
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
				if (image) {
					image = image
				} else {
					image = data.image
				}

				var updateData = {
					image: image,
					link: req.body.link,
					status: req.body.status,
				}
				table.update({ _id: Id }, { $set: updateData }, function (err, data) {
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
	})
}

module.exports.DeleteOne = function (req, res) {
	var Id = req.body._id;
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