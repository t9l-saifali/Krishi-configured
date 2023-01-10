var mongoose = require('mongoose');
var table = mongoose.model('voucher_head_masters');

module.exports.AddOne = function(req, res) {
	table
	.create({
		name   : req.body.name,
		type   : req.body.type,
		status : req.body.status,
	}, function(err, data) {
		if (err) {
			res
				.status(400)
				.json(err);
		} else {
			res
				.status(201)
				.json({"message":'ok',"data":data,"code":1});
		}
	});

};

module.exports.GetAll = function(req, res) {
	var offset = 0;
	var count = 5;
	var maxCount = 50;

	if (req.query && req.query.offset) {
		offset = parseInt(req.query.offset, 10);
	}

	if (req.query && req.query.count) {
		count = parseInt(req.query.count, 10);
	}

	if (isNaN(offset) || isNaN(count)) {
		res
			.status(400)
			.json({
				"message" : "If supplied in querystring, count and offset must both be numbers"
			});
		return;
	}

	if (count > maxCount) {
		res
			.status(400)
			.json({
				"message" : "Count limit of " + maxCount + " exceeded"
			});
		return;
	}

	table
		.find()
		// .skip(offset)
		// .limit(count)
		.sort({'created_at': -1})
		.exec(function(err, data) {
			if (err) {
				res
					.status(500)
					.json(err);
			} else {
				res
					.status(200)
					.json({"message":'ok',"data":data,"code":1});
			}
		});

};

module.exports.GetAllActive = function(req, res) {	
	table
		.find({status:true})
		.sort({'created_at': 'desc'})
		// .skip(offset)
		// .limit(count)
		.exec(function(err, data) {
			if (err) {
				res
					.status(500)
					.json(err);
			} else {
				res
					.status(200)
					.json({"message":'ok',"data":data,"code":1});
			}
		});

};

module.exports.GetOne = function(req, res) {
	var id = req.params.Id;
	table
	.findById(id)
	.exec(function(err, data) {
		var response = {
			status : 200,
			message : {"message":'ok',"data":data,"code":1}
		};
		if (err) {
			// console.log("Error finding user");
			response.status = 500;
			response.message = {"message":"ID not found " + id,"data":'',"code":0};
		} else if(!data) {
			// console.log("userId not found in database", id);
			response.status = 404;
			response.message = {"message":"ID not found " + id,"data":'',"code":0};
			
		}
		res
			.status(response.status)
			.json(response.message);
	});
};

module.exports.Update = function(req,res) {
	var Id = req.body.id;
	// var emailId =  req.body.email;
	// var password = req.body.password;
	// console.log(userId);
	table
			.findById(Id)
		// .findOne({"email":emailId,"password":password})
		// .select('username email')
		.exec(function(err,data) {
			if(err) {
				res
					.status(404)
					.json({"message":'id not found in the database',"data":err,"code":0});
					return;
			} else if(!data) {
				res
					.status(404)
					.json({"message":'id not found in the database',"data":'',"code":0})
					return;
			}
			var updateData = {
				name:req.body.name,
				type:req.body.type,
				status:req.body.status
			}
			table.update({_id:Id}, { $set: updateData},function(err,data){
				if(err) {
					res
						.status(500)
						.json({"message":'',"data":err,"code":0});
				} else {
					res
						.status(200)
						.json({"message":'ok',"data":'',"code":1});
						return;
				}
			})
		});
}

module.exports.DeleteOne = function(req,res) {
	var Id = req.params.Id;
	table
	.findByIdAndRemove(Id)
	.exec(function(err,data) {
		if(err) {
			res
				.status(404)
				.json({"message":'',"data":err,"code":0});
		} else {
			res
				.status(200)
				.json({"message":'ok',"data":'',"code":1})
				return;
		}
	})
};


