var mongoose = require('mongoose');
var table = mongoose.model('color_masters');

module.exports.AddOne = function(req, res) {
	var nameFilter =  {  'name':req.body.name };
    var error        = {};               
    table.find(nameFilter).exec().then(GetFilter =>{
        if(GetFilter.length > 0) {
            error['name'] = 'name already exist';
        } 
        var errorArray = Object.keys(error).length;
        if(errorArray > 0){
            return res.status(400).json({
	                "message": "error",
	                "data": [error],
	                "code": 0
	            });                         
        }else{
			table
			.create({
				name : req.body.name,
				status : req.body.status,
			}, function(err, data) {
				if (err) {
					console.log("Error creating");
					res
						.status(400)
						.json(err);
				} else {
					console.log("created!", data);
					res
						.status(201)
						.json({"message":'ok',"data":data,"code":1});
				}
			});
		}
	}).catch(function(err) {
        res
		.status(400)
		.json(err);
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
		.sort({'created_at': 'desc'})
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
				console.log("Found data", data.length);
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
	table.find(nameFilter).exec().then(GetFilter =>{
        if(GetFilter.length > 0) {
            if (GetFilter[0]._id != Id) {
              error['name'] = 'name alreday exist';
            } 
        } 
        var errorArray = Object.keys(error).length;
        if(errorArray > 0){
            return res.status(400).json({
	                "message": "error",
	                "data": [error],
	                "code": 0
	            });                         
        }else{
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
				});
			});
		}
	}).catch(function(err) {
        res
		.status(400)
		.json(err);
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




