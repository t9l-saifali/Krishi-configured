var mongoose = require('mongoose');
var table = mongoose.model('taxs');

module.exports.AddOne = function (req, res) {
	
	var name = req.body.name;
	var taxData = req.body.taxData ? JSON.parse(req.body.taxData) : [];
	var totalTax = req.body.totalTax;
	var status = req.body.status;
	var error        = {}; 	
	var nameFilter = { 'name':req.body.name  };             
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
        	if (taxData) {
		        var taxArr = [];
		        for (var i = 0; i < taxData.length; i++) {
		            taxArr.push({
		                "tax_name": taxData[i].tax_name,
		                "tax_percent" : taxData[i].tax_percent
		            });
		        }
		    }else {
		        var taxArr = [];
		    }
		table
		.create({
			name     : name,
			taxData  : taxArr,
			totalTax :totalTax,
			status   : status
		}, function (err, data) {
			if (err) {
				res
					.status(400)
					.json(err);
			} else {
				res
					.status(200)
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
	var skip = req.body.skip ;
	var limit = req.body.limit;

	table
	.count()
	.exec(function (err, count) {
		table
		.find()
		.skip(skip)
		.limit(limit)
		.sort({'created_at': -1})
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
					.json({ "message": 'error', "data": 'Somthing went wrong', "code": 1 });
			} else {
				res
					.status(200)
					.json({ "message": 'ok', "data": data, "code": 1 });
			}
		});

};

module.exports.GetOne = function (req, res) {
	var id = req.params.Id;
	table
		.findById(id)
		.exec(function (err, data) {
			var response = {
				status: 200,
				message: { "message": 'ok', "data": data, "code": 1 }
			};
			if (err) {
				response.status = 500;
				response.message = { "message": "ID not found " + id, "data": '', "code": 0 };
			} else if (!data) {
				response.status = 404;
				response.message = { "message": "ID not found " + id, "data": '', "code": 0 };

			}
			res
				.status(response.status)
				.json(response.message);
		});

};

module.exports.Update = function (req, res) {
	var Id = req.body._id;
	var name = req.body.name;
	var taxData = req.body.taxData ? JSON.parse(req.body.taxData) : [];
	var totalTax = req.body.totalTax;
	var status = req.body.status;
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
        	if (taxData) {
		        var taxArr = [];
		        for (var i = 0; i < taxData.length; i++) {
		            taxArr.push({
		                "tax_name"    : taxData[i].tax_name,
		                "tax_percent" : taxData[i].tax_percent
		            });
		        }
		    }else {
		        var taxArr = [];
		    }
			table
		.findById(Id)
		// .findOne({"email":emailId,"password":password})
		// .select('username email')
		.exec(function (err, data) {
			if (err) {
				res
					.status(404)
					.json({ "message": 'error', "data": err, "code": 0 });
				return;
			} else if (!data) {
				res
					.status(404)
					.json({ "message": 'error', "data": 'id not found in the database', "code": 0 })
				return;
			}
			var updateData = {
				name     : name,
				taxData  : taxArr,
				totalTax :totalTax,
				status   : status
			}
			table.update({ _id: Id }, { $set: updateData }, function (err, data) {
				if (err) {
					res
						.status(400)
						.json({ "message": 'error', "data": err, "code": 0 });
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



