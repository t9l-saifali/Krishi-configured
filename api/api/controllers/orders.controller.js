var mongoose = require('mongoose');
var table = mongoose.model('orders');
var products = mongoose.model('products');
var couponMaster = mongoose.model('coupon_masters');
var reportSummary = mongoose.model('report_summary');
// var table = mongoose.model('stock_masters');
var ledgers = mongoose.model('ledgers');

function uniqueId(length) {
	var result = '';
	var characters = '0123456789abcdefghijklmnopqruvwxyz';
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

function updateData(productId, product_variant_id, product_variant_qty) {
	products
		.findOne({ _id: productId },
			{ _id: 0, product_variant: { $elemMatch: { _id: product_variant_id } } })
		.exec(function (err, pdata) {
			var updateData = {

				'product_variant.$.available_qty': parseInt(pdata.product_variant[0].available_qty) - parseInt(product_variant_qty)
			}
			products.findOneAndUpdate({ _id: productId, 'product_variant._id': product_variant_id }, { $set: updateData }, function (err, data) {
			})
		})
}

module.exports.AddOne = function (req, res) {
	table
		.create({
			order_id: uniqueId(8),
			user_id: req.body.user_id,
			customer_name: req.body.customer_name,
			mobile_no: req.body.mobile_no,
			email: req.body.email,

			cash_amount: req.body.cash_amount,
			card_amount: req.body.card_amount,
			card_approval_no: req.body.card_approval_no,
			card_type: req.body.card_type,
			card_holder_name: req.body.card_holder_name,
			gift_amount: req.body.gift_amount,
			gift_voucher_no: req.body.gift_voucher_no,

			total_amount: req.body.total_amount,
			tax: req.body.tax,
			payment_amount: req.body.payment_amount,
			products: req.body.products,
			status: req.body.status,
		}, function (err, data) {
			if (err) {
				var reportSummaryData = {
					user_id: req.body.user_id,
					order_id: data._id,
					report_type: 'order_created'
				};
				reportSummary
					.create(reportSummaryData, function (err, reportData) {

					})
				// End Code

				// code for save the data in the ledgers table
				if (req.body.cash_amount) {
					var cashLedgers = {
						user_id: req.body.user_id,
						order_id: data._id,
						ledger_type: 'cash_ledgers',
						transaction_type: 'order genrated',
						cash_recd: req.body.cash_amount,
					};
					ledgers
						.create(cashLedgers, function (err, ledgerData) {
							if (err) {
								
							} else {
								
							}
						})
				}
				if (req.body.card_amount) {
					var cardLedgers = {
						user_id: req.body.user_id,
						order_id: data._id,
						ledger_type: 'card_ledgers',
						transaction_type: 'order genrated',
						cash_recd: req.body.card_amount,
					};
					ledgers
						.create(cardLedgers, function (err, ledgerData) {
							if (err) {
								console.log(err);
							} else {
								console.log('cardLedgers created');
								console.log(ledgerData);
							}
						})
				}

				if (req.body.gift_amount) {
					var couponLedgers = {
						user_id: req.body.user_id,
						order_id: data._id,
						ledger_type: 'coupon_ledgers',
						transaction_type: 'order genrated',
						cash_recd: req.body.gift_amount,
					};
					ledgers
						.create(couponLedgers, function (err, ledgerData) {
							if (err) {
								console.log(err);
							} else {
								console.log('couponLedgers created');
								console.log(ledgerData);
							}
						})
				}
				// End code

				res
					.status(400)
					.json(err);
			} else {
				console.log("created!", data);
				if (req.body.gift_voucher_no && req.body.gift_amount) {
					couponMaster
						.findOne({ 'coupon_code': req.body.gift_voucher_no })
						.exec(function (err, couponData) {
							if (couponData.type === 'Single') {
								var updateData = {
									coupon_used: 'yes'
								}
								couponMaster.update({ _id: couponData._id }, { $set: updateData }, function (err, data) { })
							}
						})
				}
				var orderProducts = req.body.products;
				if (orderProducts.length > 0) {
					for (var i = 0; i < orderProducts.length; i++) {
						var productId = orderProducts[i].product_id;
						var product_variant_id = orderProducts[i].product_variant_id;
						var product_variant_qty = orderProducts[i].qty;
						updateData(productId, product_variant_id, product_variant_qty);
						// 	products
						// 		.findOne({_id:productId},
						//         {_id: 0, product_variant: {$elemMatch: {_id: product_variant_id}}})
						// 		.exec(function(err,pdata){
						// 			var updateData = {

						// 		        'product_variant.$.available_qty' : parseInt(pdata.product_variant[0].available_qty)-parseInt(product_variant_qty)
						// 			}
						// 			products.findOneAndUpdate({_id:productId,'product_variant._id': product_variant_id}, { $set: updateData},function(err,data) {
						// 			})
						// 		})
					}
				}
				res
					.status(201)
					.json({ "message": 'ok', "data": req.body, "code": 1 });
			}
		});

};

module.exports.GetAll = function (req, res) {

	// console.log('GET the users');
	console.log(req.query);

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
				"message": "If supplied in querystring, count and offset must both be numbers"
			});
		return;
	}

	if (count > maxCount) {
		res
			.status(400)
			.json({
				"message": "Count limit of " + maxCount + " exceeded"
			});
		return;
	}

	table
		.find()
		// .skip(offset)
		// .limit(count)
		.sort({ created_at: 'desc' })
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
					.json({ "message": 'ok', "data": data, "code": 1 });
			}
		});

};

module.exports.GetAllActive = function (req, res) {
	table
		.find({ status: true })
		.sort({'created_at': 'desc'})
		// .skip(offset)
		// .limit(count)
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
					.json({ "message": 'ok', "data": data, "code": 1 });
			}
		});

};

module.exports.orderCount = function (req, res) {
	table
		.find()
		.count()
		// .skip(offset)
		// .limit(count)
		.exec(function (err, data) {
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
					.json({ "message": 'ok', "data": data, "code": 1 });
			}
		});

};

module.exports.GetVoucherNo = function (req, res) {
	table
		.findOne()
		.select('voucher_no')
		// .count()
		// .skip(offset)
		// .limit(count)
		.sort({ stock_date: 'desc' })
		.lean()
		.exec(function (err, data) {
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
				if (data) {
					if (data.voucher_no) {
						voucherNo = parseInt(data.voucher_no) + 1;
					}
				}
				res
					.status(200)
					.json({ "message": 'ok', "data": voucherNo, "code": 1 });
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
				// console.log("Error finding user");
				response.status = 500;
				response.message = { "message": "ID not found " + id, "data": '', "code": 0 };
			} else if (!data) {
				// console.log("userId not found in database", id);
				response.status = 404;
				response.message = { "message": "ID not found " + id, "data": '', "code": 0 };

			}
			res
				.status(response.status)
				.json(response.message);
		});

};

module.exports.Update = function (req, res) {
	var Id = req.body.id;
	// var emailId =  req.body.email;
	// var password = req.body.password;
	// console.log(userId);
	table
		.findById(Id)
		// .findOne({"email":emailId,"password":password})
		// .select('username email')
		.exec(function (err, data) {
			if (err) {
				// console.log('error finding the user');
				res
					.status(404)
					.json({ "message": 'id not found in the database', "data": err, "code": 0 });
				return;
			} else if (!data) {
				// console.log('user id not found in the database')
				res
					.status(404)
					.json({ "message": 'id not found in the database', "data": '', "code": 0 })
				return;
			}
			var updateData = {
				time: req.body.time,
				voucher_no: req.body.voucher_no,
				voucher_date: req.body.voucher_date,
				account: req.body.account,
				invoice_slip_no: req.body.invoice_slip_no,
				invoice_date: req.body.invoice_date,
				total_qty: req.body.total_qty,
				available_qty: req.body.total_qty,
				invoice_amount: req.body.invoice_amount,
				payment_due_date: req.body.payment_due_date,
				party_name: req.body.party_name,
				shipping_courier: req.body.shipping_courier,
				payment_mode: req.body.payment_mode,
				cash_amount: req.body.cash_amount,
				cheque_no: req.body.cheque_no,
				dd_no: req.body.dd_no,
				p_date: req.body.p_date,
				bank: req.body.bank,
				branch: req.body.branch,
				image1: req.body.image1,
				image2: req.body.image2,
				card_no: req.body.card_no,
				approval_no: req.body.approval_no,
				type: req.body.type,
				holder_name: req.body.holder_name,
				exp_date: req.body.exp_date,
				gift_voucher_no: req.body.gift_voucher_no,
				gift_type: req.body.gift_type,
				gift_voucher_date: req.body.gift_voucher_date,
				status: req.body.status
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

module.exports.DeleteOne = function (req, res) {
	var Id = req.params.Id;
	// console.log(userId);
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


module.exports.UpdateStatus = function (req, res) {
	var Id = req.body.id;
	// var emailId =  req.body.email;
	// var password = req.body.password;
	console.log(req.body);
	table
		.findOne({ _id: Id })
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
			console.log('data -=>>', data);

			var updateData = {
				status: req.body.status
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
}