var mongoose = require('mongoose');
var table = mongoose.model('variants');

module.exports.AddOne = function(req, res) {
	console.log("POST new data", req.body);
	var item_name        = req.body.item_name;
    var item_status      = req.body.item_status;
	var newItem = [];
	if(item_name){
	    for (var i = 0; i < item_name.length; i++) {	        
	        newItem.push({
	            "item_name"   : item_name[i],
	            "item_status" : item_status && item_status[i] ? item_status[i] : true
	        });  
	    }
	}
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
			parentCat_id : req.body.parentCat_id,
			name         : req.body.name,
			item         :  newItem,
			status       : req.body.status,
		}, function(err, data) {
			if (err) {
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
	var skip = req.body.skip ;
	var limit = req.body.limit;

	table
		.count()
		.exec(function(err, count) {
	table
		.find()
		.populate('variant_categories')
		.skip(skip)
		.limit(limit)
		.sort({'created_at': 'desc'})
		.exec(function(err, data) {
			if (err) {
				res
					.status(500)
					.json(err);
			} else {
				res
					.status(200)
					.json({"message":'ok',"data":data,"count":count,"code":1});
			}
		});
	})
};

module.exports.GetAllActive = function(req, res) {	
	table
		.find({status:true},{_id:1,name:1})
		.sort({'created_at': 'desc'})
		// .skip(offset)
		// .limit(count)
		.exec(function(err, data) {
			console.log(err);
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
	var item_name        = req.body.item_name;
    var item_status      = req.body.item_status;
	var newItem = [];
    if(item_name){
	    for (var i = 0; i < item_name.length; i++) {	        
	        newItem.push({
	            "item_name" :item_name[i],
	            "item_status" : item_status ? item_status[i] : true
	        });  
	    }
	}
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
			// .findOne({"email":emailId,"password":password})
			// .select('username email')
			.exec(function(err,data) {
				if(err) {
					// console.log('error finding the user');
					res
						.status(404)
						.json({"message":'id not found in the database',"data":err,"code":0});
						return;
				} else if(!data) {
					// console.log('user id not found in the database')
					res
						.status(404)
						.json({"message":'id not found in the database',"data":'',"code":0})
						return;
				}
				var updateData = {
					parentCat_id : req.body.parentCat_id,
					name         : req.body.name,
					item         : newItem,
					status       : req.body.status,
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
	}).catch(function(err) {
        res
		.status(400)
		.json(err);
    }); 
}

module.exports.DeleteOne = function(req,res) {
	var Id = req.body.Id;
	// console.log(userId);
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



