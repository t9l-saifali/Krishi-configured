var mongoose = require('mongoose');
var table = mongoose.model('stock_masters');
var reportSummary = mongoose.model('report_summary');
var ledgers = mongoose.model('ledgers');

module.exports.AddOne = function(req, res) {
	table
		.create({
			user_id           :req.body.user_id,
			time              :req.body.time,
			voucher_no        :req.body.voucher_no,
			voucher_date      :req.body.voucher_date,
			account           :req.body.account,
			invoice_slip_no   :req.body.invoice_slip_no,
			invoice_date      :req.body.invoice_date,
			total_qty         :req.body.total_qty,
			available_qty     :req.body.total_qty,
			invoice_amount    :req.body.invoice_amount,
			payment_due_date  :req.body.payment_due_date,
			party_name        :req.body.party_name,
			shipping_courier  :req.body.shipping_courier,
			cash_amount       :req.body.cash_amount,			
			card_amount       :req.body.card_amount,
			card_approval_no  :req.body.card_approval_no,
			card_type         :req.body.card_type,
			card_holder_name  :req.body.card_holder_name,
			gift_amount       :req.body.gift_amount,
			gift_voucher_no   :req.body.gift_voucher_no,
			cheque_amount     :req.body.cheque_amount,
			cheque_no         :req.body.cheque_no,
			cheque_date       :req.body.cheque_date,
			cheque_bank       :req.body.cheque_bank,
			status            :req.body.status,
		}, function(err, data) {
			if (err) {
				console.log("Error creating");
				res
					.status(400)
					.json(err);
			} else {
					var reportSummaryData = {
	                        user_id     :req.body.user_id,
	                        stock_id    :data._id,
	                        report_type :'stock_created'
	                    };
	                reportSummary
	                	.create(reportSummaryData,function(err,reportData) {
	                		if(err) {
	                			console.log(err);
	                		} else {
	                			console.log(reportData);
	                		}
	                	})
	            // End Code
                // code for save the data in the ledgers table
                if(req.body.cash_amount) {
					var cashLedgers = {
			            user_id     : req.body.user_id,
			            stock_id    : data._id,
			            ledger_type : 'cash_ledgers',
			            transaction_type : 'stock purchase',
			            cash_paid        : req.body.cash_amount,
			        };
			        ledgers
				    	.create(cashLedgers,function(err,ledgerData) {
				    		if(err) {
				    			console.log(err);
				    		} else {
				    			
				    			console.log(ledgerData);
				    		}
				    	})
				}
				if(req.body.card_amount) {
					var cardLedgers = {
			            user_id     : req.body.user_id,
			            stock_id    : data._id,
			            ledger_type :'card_ledgers',
			            transaction_type :'stock purchase',
			            cash_paid        :req.body.card_amount,
			        };
			        ledgers
				    	.create(cardLedgers,function(err,ledgerData) {
				    		if(err) {
				    			console.log(err);
				    		} else {
				    			
				    			console.log(ledgerData);
				    		}
				    	})
				}
				if(req.body.cheque_amount) {
					var chequeLedgers = {
			            user_id           : req.body.user_id,
			            stock_id          : data._id,
			            ledger_type       : 'cheque_ledgers',
			            transaction_type  : 'stock purchase',
			            cash_paid         : req.body.cheque_amount,
			        };
			        ledgers
				    	.create(chequeLedgers,function(err,ledgerData) {
				    		if(err) {
				    			console.log(err);
				    		} else {
				    			
				    			console.log(ledgerData);
				    		}
				    	})
				}
				// End code
				res
					.status(201)
					.json({"message":'ok',"data":data,"code":1});
			}
		});

};

module.exports.GetAll = function(req, res) {

	// console.log('GET the users');
	console.log(req.query);

	var offset   = 0;
	var count    = 5;
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
		.sort({ created_at: -1 })
		// .skip(offset)
		// .limit(count)
		.exec(function(err, data) {
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
					.json({"message":'ok',"data":data,"code":1});
			}
		});

};

module.exports.GetAllNoqty = function(req, res) {

	// console.log('GET the users');
	console.log(req.query);

	var offset   = 0;
	var count    = 5;
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
		.find({available_qty:{$gt: 0},$or:[ {'stock_approval_status':'yes'},{'stock_approval_status':'pending'}]})
		.sort({ created_at: -1 })
		// .skip(offset)
		// .limit(count)
		.exec(function(err, data) {
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
					.json({"message":'ok',"data":data,"code":1});
			}
		});

};

module.exports.GetAllNoqtyCount = function(req, res) {	
	table
		.find({available_qty:{$gt: 0},$or:[ {'stock_approval_status':'yes'},{'stock_approval_status':'pending'}]})
		.count()
		// .skip(offset)
		// .limit(count)
		.exec(function(err, data) {
			console.log(err);
			// console.log(users);
			if (err) {
				// console.log("Error finding users");
				res
					.status(500)
					.json(err);
			} else {
				console.log("Found data", data);
				res
					.status(200)
					.json({"message":'ok',"data":data,"code":1});
			}
		});

};


module.exports.GetAllActive = function(req, res) {	
	table
		.find({status:true})
		// .skip(offset)
		// .limit(count)
		.exec(function(err, data) {
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
					.json({"message":'ok',"data":data,"code":1});
			}
		});

};

module.exports.StockCount = function(req, res) {	
	table
		.find()
		.count()
		// .skip(offset)
		// .limit(count)
		.exec(function(err, data) {
			console.log(err);
			// console.log(users);
			if (err) {
				// console.log("Error finding users");
				res
					.status(500)
					.json(err);
			} else {
				console.log("Found data", data);
				res
					.status(200)
					.json({"message":'ok',"data":data,"code":1});
			}
		});

};

module.exports.GetVoucherNo = function(req, res) {	
	table
		.findOne()
		.select('voucher_no')
		// .count()
		// .skip(offset)
		// .limit(count)
		.sort({stock_date: 'desc'})
		.lean() 
		.exec(function(err, data) {
			console.log(err);
			// console.log(users);
			if (err) {
				// console.log("Error finding users");
				res
					.status(500)
					.json(err);
			} else {
				console.log("Found data", data);
				var voucherNo = 1;
				if(data) {
					if(data.voucher_no) {
						voucherNo = parseInt(data.voucher_no) + 1;
					}
				}
				res
					.status(200)
					.json({"message":'ok',"data":voucherNo,"code":1});
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
	// console.log('data is comming');
	// console.log(req.body);
	// res
	// 	.status(200)
	// 	.json({"message":'ok',"data":req.body,"code":1});
	// 	return;
	var Id = req.body.id;
	// var emailId =  req.body.email;
	// var password = req.body.password;
	// console.log(userId);
	table
			.findById(Id)
		// .findOne({"email":emailId,"password":password})
		// .select('username email')
		.exec(function(err,data) {
			// console.log('data by id');
			// console.log(data);
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
			// console.log('req.body.total_qty');
			// console.log(req.body.total_qty);
			var updateData = {
				user_id      : req.body.user_id,
				time         : req.body.time,
				voucher_no   : req.body.voucher_no,
				voucher_date : req.body.voucher_date,
				account      : req.body.account,
				invoice_slip_no : req.body.invoice_slip_no,
				invoice_date    : req.body.invoice_date,
				total_qty       : parseInt(req.body.total_qty),
				available_qty   : parseInt(req.body.total_qty),
				invoice_amount  : req.body.invoice_amount,
				payment_due_date : req.body.payment_due_date,
				party_name       : req.body.party_name,
				shipping_courier : req.body.shipping_courier,
				cash_amount      : req.body.cash_amount,			
				card_amount      : req.body.card_amount,
				card_approval_no : req.body.card_approval_no,
				card_type        : req.body.card_type,
				card_holder_name : req.body.card_holder_name,
				gift_amount      : req.body.gift_amount,
				gift_voucher_no  : req.body.gift_voucher_no,
				cheque_amount    : req.body.cheque_amount,
				cheque_no        : req.body.cheque_no,
				cheque_date      : req.body.cheque_date,
				cheque_bank      : req.body.cheque_bank,
				status           : req.body.status
			}
			table.update({_id:Id}, { $set: updateData},function(err,data){
				if(err) {
					console.log('error comes')
					console.log(err);
					res
						.status(500)
						.json({"message":'',"data":err,"code":0});
				} else {
					console.log('updated')
					console.log(data);
					res
						.status(200)
						.json({"message":'ok',"data":'',"code":1});
						return;
				}
			})

			// table.username = req.body.category_name;
			// table.email = req.body.tex_percent;
			// table.mobile = req.body.status;
			
			// table
			// 	.save(function(err,data) {
			// 		if(err) {
			// 			res
			// 				.status(500)
			// 				.json({"message":'',"data":err,"code":0});
			// 		} else {
			// 			res
			// 				.status(200)
			// 				.json({"message":'ok',"data":data,"code":1});
			// 				return;
			// 		}
			// 	});
		});
}

module.exports.DeleteOne = function(req,res) {
	var Id = req.params.Id;
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

module.exports.stockApproved = function(req,res) {
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
				stock_approval_status : req.body.stock_approval_status,
				stock_approval_date:new Date(),
			}
			table.update({_id:Id}, { $set: updateData},function(err,data){
				if(err) {
					res
						.status(500)
						.json({"message":'',"data":err,"code":0});
				} else {

					var report_type = '';
					if(req.body.stock_approval_status === 'yes') {
						report_type = 'stock_approved';
					} else if(req.body.stock_approval_status === 'no') {
						report_type = 'stock_rejected';
					}
					var reportSummaryData = {
                        user_id: req.body.admin_id,
                        stock_id:Id,
                        report_type:report_type
                    };
	                reportSummary
	                	.create(reportSummaryData,function(err,reportData) {
	                		if(err) {
                				console.log(err);
	                		} else {
	                			console.log('report created');
	                			console.log(reportData);
	                		}
	                	})
					res
						.status(200)
						.json({"message":'ok',"data":'',"code":1});
						return;
				}
			})
		});
}

