var mongoose = require('mongoose');
var table = mongoose.model('role');

module.exports.AddOne = function (req, res) {

	var nameFilter = { 'role_name':req.body.role_name  };
    var error        = {};               
    table.find(nameFilter).exec().then(GetFilter =>{
        if(GetFilter.length > 0) {
            error['role_name'] = 'name already exist';
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
				role_name: req.body.role_name,
				modules: req.body.modules ? JSON.parse(req.body.modules) : [],
				status: req.body.status
			}, function (err, data) {
				if (err) {
					
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

module.exports.Update = function (req, res) {
	var Id = req.body._id;
	var nameFilter = { 'role_name':req.body.role_name  };
    var error        = {};     
	table.find(nameFilter).exec().then(GetFilter =>{
        if(GetFilter.length > 0) {
            if (GetFilter[0]._id != Id) {
              error['role_name'] = 'name alreday exist';
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
				role_name: req.body.role_name,
				modules: req.body.modules ? JSON.parse(req.body.modules) : [],
				status: req.body.status,
			}
			table
				.update({ _id: req.body._id }, { $set: updateData }, function (err, data) {
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