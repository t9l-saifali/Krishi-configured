var mongoose = require('mongoose');
var table = mongoose.model('variant_categories');


module.exports.AddOne = function (req, res) {
	var nameFilter = { 'name':req.body.name  };
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
			name: req.body.name,
			status: req.body.status
		}, function (err, data) {
			if (err) {
				console.log(err)
				if(err.code == 11000){					
			        error['name'] = 'name already exist';			       
			        var errorArray = Object.keys(error).length;
			        if(errorArray > 0){
			            return res.status(200).json({
                            "status": "error",
                            "result": [error]
                        });    
			        }
				}
				res
					.status(400)
					.json(err);
			} else {
				res
					.status(201)
					.json({ "message": 'ok', "data": data, "code": 1 });
			}
		});
		}
	}).catch(function(err) {
        res
		.status(400)
		.json(err);
    }); 
};

module.exports.GetAll = function (req, res) {
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
			if (err) {
				res
					.status(500)
					.json(err);
			} else {
				res
					.status(200)
					.json({ "message": 'ok', "data": data, 'count': count, "code": 1 });
			}
		});
	})
};


module.exports.GetAllCatItem = function (req, res) {

	table
		.aggregate([
			{
				$lookup: {
					"from": "variants",
					"localField": "_id",
					"foreignField": "parentCat_id",
					"as": "Data"
				}
			}
		])
		.exec(function (err, data) {
			console.log(err);
			if (err) {
				res
					.status(500)
					.json(err);
			} else {
				res
					.status(200)
					.json({ "message": 'ok', "data": data, "code": 1 });
			}
		});
};
module.exports.Update = function (req, res) {
	var Id = req.body._id;
	var nameFilter = { 'name':req.body.name  };
    var error        = {};     
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
	}).catch(function(err) {
        res
		.status(400)
		.json(err);
    }); 
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