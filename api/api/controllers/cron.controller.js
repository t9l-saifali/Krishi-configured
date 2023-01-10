var mongoose = require('mongoose');
var table = mongoose.model('orders');
var products = mongoose.model('products');
var couponMaster = mongoose.model('coupon_masters');
// var table = mongoose.model('stock_masters');

function updateData(productId,product_variant_id,product_variant_qty) {
	products
		.findOne({_id:productId},
        {_id: 0, product_variant: {$elemMatch: {_id: product_variant_id}}})
		.exec(function(err,pdata){
			var updateData = {
				
		        'product_variant.$.available_qty' : parseInt(pdata.product_variant[0].available_qty)-parseInt(product_variant_qty)
			}
			products.findOneAndUpdate({_id:productId,'product_variant._id': product_variant_id}, { $set: updateData},function(err,data) {
			})
		})
}

module.exports.shootEmailForAvailableQty = function(req, res) {	
	products
		.find({product_approval_status:'yes'})
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

