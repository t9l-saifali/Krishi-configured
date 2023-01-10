var mongoose = require('mongoose');
var Payment = mongoose.model('Payment');
var User = mongoose.model('Users');
var products = mongoose.model('products');

var Razorpay = require('razorpay');
var common = require('../../common')

var instance = new Razorpay({
    // key_id: 'rzp_test_UWn64me6CqQI2L',
    // key_secret: 'dd9kniIqXaeJQwbMpJdCc8qV'
    key_id: 'rzp_test_EndPjdxoCPaqCY',
    key_secret: 'HP3XfdsnP9g7XfrzrrVzWk0R'
});

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
                'product_variant.available_qty': 
                parseInt(pdata.product_variant[0].available_qty) - parseInt(product_variant_qty)
            }
            products
            .findOneAndUpdate({ _id: productId, 'product_variant._id': product_variant_id },
             { $set: updateData }, function (err, data) {})
        })
}

module.exports.completePayment = function (req, res) {
    console.log(req.body);
    var total_payment = req.body.amount
    var payment_id = req.body.payment_id
    var amount = (total_payment * 100);
    var entry_id = req.body.entry_id
    var payment_status = ''
    instance.payments.capture(payment_id, amount).then((response) => {
        if (response.status == 'captured') {
            payment_status = 'complete'
        } else {
            payment_status = response.status
        }

        var data = {
            payment_status: payment_status
        }
        console.log('payment_status -=>', payment_status)

        Payment
            .update({ _id: entry_id }, { $set: data }, function (err, getData) {
                if (err) {

                    return res
                        .status(500)
                        .json({
                            "status": "error",
                            "result": err
                        });
                } else {
                    Payment
                        .findById(entry_id)
                        .exec(function (err, paymentData) {
                            if (err) {
                                res
                                    .status(404)
                                    .json({ "message": 'id not found in the database', "data": err, "code": 0 });
                                return;
                            } else {
                                return res
                                    .status(200)
                                    .json({
                                        "status": "ok",
                                        "result": "Payment successfully",
                                        'data': paymentData
                                    })
                            }
                        })
                }
            });;
    })
        .catch((error) => {
            return res
                .status(400)
                .json({ "status": error, "result": "Payment Failed" });
        })// instance.payments.capture function close
}

module.exports.addPaymentDetail = function (req, res) {
    console.log('payment body --===>>>>>', req.body);
    // console.log(res);

    var orderType = req.body.orderType;
    
    var email = req.body.email;
    var user_id = req.body.user_id;

    var houseNo = req.body.houseNo
    var street = req.body.street
    var city = req.body.city
    var district = req.body.district
    var state = req.body.state
    var country = req.body.country
    var pincode = req.body.pincode

    var contactNumber = req.body.contactNumber;
    var amount = req.body.amount;
    var payment_type = req.body.payment_type
    var delivery_date = req.body.delivery_date
    var delivery_time = req.body.delivery_time
    var payment_items = req.body.payment_items
    //    var payment_items = req.body.payment_items;
    // var order_id = req.body.order_id
    var payment_status = 'pending'

    User
        .findOne({ contactNumber: contactNumber })
        .exec(function (err, data) {
            console.log('user data -==>>>', data)
            if (err) {
                res
                    .status(404)
                    .json({ "message": 'err', "data": err, "code": 0 });
                return;
            } else if (data) {
                Payment
                    .create({
                        // name: name,
                        email: email,
                        order_id: uniqueId(8),
                        user_id: data._id,
                        houseNo: houseNo,
                        street: street,
                        city: city,
                        pincode: pincode,
                        district: district,
                        state: state,
                        country: country,

                        //address: address,
                        pincode: pincode,
                        amount: amount,
                        payment_status: payment_status,
                        payment_type: payment_type,
                        delivery_date: delivery_date,
                        delivery_time: delivery_time,
                        payment_items: Array.isArray(payment_items) ? payment_items : JSON.parse(payment_items),

                        orderType: orderType
                    }, function (err, Payment) {
                        if (err) {
                            console.log("Error creating Payment");
                            res
                                .status(400)
                                .json(err);
                        } else {
                            var orderProducts = payment_items ? JSON.parse(payment_items) : [];
                            if (orderProducts.length > 0) {
                                for (var i = 0; i < orderProducts.length; i++) {
                                    var productId = orderProducts[i].data._id;
                                    var product_variant_id = orderProducts[i].variant._id;
                                    var product_variant_qty = orderProducts[i].quantity;
                                    updateData(productId, product_variant_id, product_variant_qty);
                                }
                            }
                            console.log("user details saved!", Payment);
                            var payment_id = Payment._id
                            if (orderType == 'offline') {
                                var checkoutLink = `http://18.190.24.89/#/checkout/${payment_id}`
                                common.transporter(Payment.email, 'Manmohey Payment Link', `Hi \n \n Please complete your Payment. ${checkoutLink}`, Payment, res)

                            } else {
                                res
                                    .status(200)
                                    .json({ "message": "ok", 'data': Payment, 'code': 1 });
                            }
                        }
                    })
            } else {
                res
                .status(500)
                .json({ "message": "Invalid User!", 'data': [], 'code': 1 });
            }
        })
}

module.exports.getAllPayments = function (req, res) {
    Payment
        .find()
        .populate(
            {
                path: 'user_id',
                // match: { category_name: 'shirt12'},
            }
        )
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

module.exports.getOnePayment = function (req, res) {
    var user_id = req.body.user_id;

    console.log('GET user_id', user_id);

    Payment
        .find({ user_id: user_id })
        .sort({'created_at': -1})
        .populate(
            {
                path: 'user_id',
                // match: { category_name: 'shirt12'},
            }
        )
        .exec(function (err, doc) {
            var response = {
                status: 200,
                message: doc
            };
            if (err) {
                console.log("Error finding hotel");
                response.status = 500;
                response.message = err;
            } else if (!doc) {
                console.log("user_id not found in database", user_id);
                response.status = 404;
                response.message = {
                    "message": "user_id ID not found " + user_id
                };
            }
            res
                .status(200)
                .json({ "message": 'ok', "data": doc, "code": 1 });
        });

};

module.exports.UpdateStatus = function (req, res) {
    var Id = req.body.id;

    console.log(req.body);
    Payment
        .findOne({ _id: Id })
        .exec(function (err, data) {
                console.log('payment data -===>>>', data);
            if (err) {
                res
                    .status(404)
                    .json({ "message": 'err', "data": err, "code": 0 });
                return;
            } else if (!data) {
                console.log('payment data -===>>>', data);

                res
                    .status(404)
                    .json({ "message": 'id not found in the database', "data": '', "code": 0 })
                return;
            }
            var ab = JSON.stringify(data)
            var data = JSON.parse(ab)

            console.log('data -=>>', data.user_id);

            var updateData = {
                payment_status: req.body.status
            }
            Payment
                .update({ _id: Id }, { $set: updateData }, function (err, PaymentData) {
                    if (err) {
                        res
                            .status(500)
                            .json({ "message": 'error', "data": err, "code": 0 });
                    } else {
                        User
                            .findOne({ _id: data.user_id })
                            .lean()
                            .exec(function (err, userData) {
            console.log('userData -=>>', userData);

                                if (err) {
                                    res
                                        .status(404)
                                        .json({ "message": 'err', "data": err, "code": 0 });
                                    return;
                                } else {
                                    Payment
                                        .findOne({ _id: Id })
                                        .lean()
                                        .exec(function (err, PaymentData) {
                                            common.transporter(userData.email, 'Status Updated', 'your status is updated to ' + req.body.status, PaymentData, res)
                                        })
                                }
                            })
                        // res
                        //     .status(200)
                        //     .json({ "message": 'ok', "data": '', "code": 1 });
                        // return;
                    }
                })
        });
}

module.exports.getUserOrders = function (req, res) {

    var user_id = req.body.user_id
    if (user_id) {
        Payment
            .find({ user_id: user_id })
            .exec(function (err, data) {
                console.log(err);
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
    } else {
        res
            .status(404)
            .json({ "message": 'user_id required1', "data": [], "code": 0 });
    }
};

module.exports.filterPayment = function (req, res) {
    var payment_status = req.body.payment_status;
    var payment_type = req.body.payment_type;
    var pincode = req.body.pincode;
    var skip = req.body.skip;
    var limit = req.body.limit;
    var order_id = null;
    if(req.body.order_id){
        var order_id = req.body.order_id;
    }
    

    var DataFilter = {};
    if(payment_status){
        // DataFilter['payment_status'] = { '$regex': new RegExp("" + payment_status, "i") }
        DataFilter['payment_status'] = payment_status
    }
    if(payment_type){
        DataFilter['payment_type'] = payment_type
    }
    if(pincode){
        DataFilter['pincode'] = pincode
    }
    if(order_id != null){
        DataFilter['order_id'] = order_id        
    }
     Payment
        .find(DataFilter)
        .count()
        .exec(function (err, count) {
            if (err) {
                res
                    .status(404)
                    .json({ "message": 'err', "data": err, "code": 0 });
                return;
            } else {
    Payment
        .find(DataFilter)
        .populate('user_id')
        .sort({'created_at': -1})
        .skip(skip)
        .limit(limit)
        .exec(function (err, data) {
            if (err) {
                res
                    .status(404)
                    .json({ "message": 'err', "data": err, "code": 0 });
                return;
            } else {
                res
                    .status(200)
                    .json({ "message": 'Filtered by Status', "data": data, "count": count, "code": 1 })
                return;
            }
        });
    }
    })
}

module.exports.getUserTotalPayment = function (req, res) {

    var user_id = req.body.user_id
    if (user_id) {
        Payment
            .aggregate([
                {
                    $lookup: {
                        "from": "users",
                        "localField": "user_id",
                        "foreignField": "_id",
                        "as": "userData"
                    }
                },
                {
                    "$group": { _id: "$userData", amount: { "$sum": '$amount' } }
                }
            ])
            .exec(function (err, data) {
                console.log(err);
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
    } else {
        res
            .status(404)
            .json({ "message": 'user_id required1', "data": [], "code": 0 });
    }
};

// .aggregate([
//     {
//         $lookup: {
//             "from": "workstations",
//             "localField": "workStation_id",
//             "foreignField": "_id",
//             "as": "workstation"
//         }
//     },
//     {
//         "$group": { _id: "$workstation", bookingCount: { "$sum": 1 } }
//     },
//     //  {
//     // 	"$sort": { count: -1 }
//     // }
// ])