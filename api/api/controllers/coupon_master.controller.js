var mongoose = require("mongoose");
var table = mongoose.model("coupon_masters");
var product = mongoose.model("products");
var bookingDataBase = mongoose.model("bookings");
const Subscription = mongoose.model("subscriptions");

var multer = require("multer");
var fileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/upload/");
  },
  filename: function (req, file, cb) {
    var ext = file.mimetype.split("/");
    cb(null, uniqueId(10) + "" + Date.now() + "." + ext[1]);
  },
});
var upload = multer({
  storage: fileStorage,
}).any();

function uniqueId(length) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

module.exports.AddOne = function (req, res) {
  upload(req, res, function (err) {
    var nameFilter = { coupon_code: req.body.coupon_code };
    var error = {};
    table
      .aggregate([{ $match: { coupon_code: req.body.coupon_code.toUpperCase() } }])
      .exec()
      .then((GetFilter) => {
        // return res.status(400).json({
        //     message: "error",
        //     data: GetFilter,
        //     code: 0,
        // });
        if (GetFilter.length > 0) {
          error["coupon_code"] = "coupon_code already exist";
        }
        var errorArray = Object.keys(error).length;
        if (errorArray > 0) {
          return res.status(400).json({
            message: "error",
            data: [error],
            code: 0,
          });
        } else {
          if (req.body.discountType == "ProductCategory") {
            if (req.body.ProductCategoryType == "product") {
              var Data = req.body.product_id;
              var Data = JSON.parse(Data);
              var productDataArray = [];
              for (var i = 0; i < Data.length; i++) {
                productDataArray.push({
                  product_id: Data[i],
                });
              }
            } else if (req.body.ProductCategoryType == "category") {
              var Data = req.body.category_id;
              var Data = JSON.parse(Data);
              var categoryDataArray = [];
              for (var i = 0; i < Data.length; i++) {
                categoryDataArray.push({
                  category_id: Data[i],
                });
              }
            }
          } else {
            var productDataArray = [];
            var categoryDataArray = [];
          }

          if (
            req.body.discountProduct == "undefined" ||
            req.body.discountProduct == undefined ||
            req.body.discountProduct == "" ||
            req.body.discountProduct == "null" ||
            req.body.discountProduct == null
          ) {
            var discountProduct = null;
          } else {
            var discountProduct = req.body.discountProduct;
          }

          if (
            req.body.discountProductPackageId == "undefined" ||
            req.body.discountProductPackageId == undefined ||
            req.body.discountProductPackageId == "" ||
            req.body.discountProductPackageId == "null" ||
            req.body.discountProductPackageId == null
          ) {
            var discountProductPackageId = null;
          } else {
            var discountProductPackageId = req.body.discountProductPackageId;
          }

          if (
            req.body.discount_upto == "undefined" ||
            req.body.discount_upto == undefined ||
            req.body.discount_upto == "" ||
            req.body.discount_upto == "null" ||
            req.body.discount_upto == null
          ) {
            var discount_upto = null;
          } else {
            var discount_upto = req.body.discount_upto;
          }

          if (
            req.body.discountAmount == "undefined" ||
            req.body.discountAmount == undefined ||
            req.body.discountAmount == "" ||
            req.body.discountAmount == "null" ||
            req.body.discountAmount == null
          ) {
            var discountAmount = null;
          } else {
            var discountAmount = req.body.discountAmount;
          }

          if (
            req.body.couponValue == "undefined" ||
            req.body.couponValue == undefined ||
            req.body.couponValue == "" ||
            req.body.couponValue == "null" ||
            req.body.couponValue == null
          ) {
            var couponValue = null;
          } else {
            var couponValue = req.body.couponValue;
          }

          if (
            req.body.discountLocation == "undefined" ||
            req.body.discountLocation == undefined ||
            req.body.discountLocation == "" ||
            req.body.discountLocation == "null" ||
            req.body.discountLocation == null
          ) {
            var discountLocation = null;
          } else {
            var discountLocation = req.body.discountLocation;
          }

          if (
            req.body.region == "undefined" ||
            req.body.region == undefined ||
            req.body.region == "" ||
            req.body.region == "null" ||
            req.body.region == null
          ) {
            var region = null;
          } else {
            var region = req.body.region;
          }

          let usageLimit = req.body.usageLimit && +req.body.usageLimit ? +req.body.usageLimit : null;
          console.log("@@@@@@@@@@@@@@@@@@@@@@@@@ usageLimit", usageLimit);
          // return;

          table.create(
            {
              couponValue: couponValue,
              name: req.body.name,
              description: req.body.description,
              image: req.files.filter((i) => i.fieldname === "image").map((i) => i.filename)[0],
              start_date: req.body.start_date,
              end_date: req.body.end_date,
              tc: req.body.tc,
              coupon_code: req.body.coupon_code,
              usageLimit: usageLimit,
              UserType: req.body.UserType,
              discountType: req.body.discountType,
              discountAmount: discountAmount,
              discountLocation: discountLocation,
              discountPercentage: req.body.discountPercentage,
              discount_upto: discount_upto,
              discountProduct: discountProduct,
              discountProductPackageId: discountProductPackageId,
              region: region,
              ProductCategoryType: req.body.ProductCategoryType,
              productDetail: productDataArray,
              categoryDetail: categoryDataArray,
              status: req.body.status || false,
              catelogviewstatus: req.body.catelogviewstatus || false,
            },
            function (err, data) {
              if (err) {
                res.status(400).json({
                  message: "error",
                  data: err,
                  code: 1,
                });
              } else {
                res.status(201).json({
                  message: "ok",
                  data: data,
                  code: 1,
                });
              }
            }
          );
        }
      })
      .catch(function (err) {
        res.status(400).json(err);
      });
  });
};

module.exports.GetAll = function (req, res) {
  // console.log("hrerrrrer");
  var skip = req.body.skip;
  var limit = req.body.limit;

  if (req.body.name) {
    var name = req.body.name;
  }
  if (req.body.coupon_code) {
    var coupon_code = req.body.coupon_code;
  }
  if (req.body.discountType) {
    var discountType = req.body.discountType;
  }
  if (req.body.couponValue) {
    var couponValue = parseInt(req.body.couponValue);
  }
  if (req.body.status) {
    var status = req.body.status;
  }

  var DataFilter = {};
  if (name != null) {
    DataFilter["name"] = { $regex: name, $options: "i" };
  }
  if (coupon_code != null) {
    DataFilter["coupon_code"] = { $regex: coupon_code, $options: "i" };
  }
  if (discountType != null) {
    DataFilter["discountType"] = { $regex: discountType };
  }
  if (couponValue != null) {
    DataFilter["couponValue"] = couponValue;
  }
  if (req.body.status != null || req.body.status === false || req.body.status === true) {
    DataFilter["status"] = req.body.status;
  }

  table
    .find(DataFilter)
    .count()
    .exec(function (err, count) {
      table
        .find(DataFilter)
        .populate("discountProduct")
        .populate("categoryDetail.category_id")
        .populate("productDetail.product_id")
        .skip(skip)
        .limit(limit)
        .sort({ created_at: "desc" })
        .exec(function (err, data) {
          if (err) {
            res.status(500).json(err);
          } else {
            res.status(200).json({
              message: "ok",
              data: data,
              count: count,
              code: 1,
            });
          }
        });
    });
};

module.exports.getAllCatelogTrue = function (req, res) {
  table
    .find({ status: true, catelogviewstatus: true })
    .sort({ created_at: "desc" })
    // .skip(offset)
    // .limit(count)
    .exec(function (err, data) {
      if (err) {
        res.status(500).json(err);
      } else {
        res.status(200).json({ message: "ok", data: data, code: 1 });
      }
    });
};

module.exports.GetAllActive = function (req, res) {
  table
    .find({ status: true })
    .sort({ created_at: "desc" })
    // .skip(offset)
    // .limit(count)
    .exec(function (err, data) {
      if (err) {
        res.status(500).json(err);
      } else {
        res.status(200).json({ message: "ok", data: data, code: 1 });
      }
    });
};

module.exports.GetOne = function (req, res) {
  var id = req.params.Id;
  table.findById(id).exec(function (err, data) {
    var response = {
      status: 200,
      message: { message: "ok", data: data, code: 1 },
    };
    if (err) {
      response.status = 500;
      response.message = {
        message: "ID not found " + id,
        data: "",
        code: 0,
      };
    } else if (!data) {
      response.status = 404;
      response.message = {
        message: "ID not found " + id,
        data: "",
        code: 0,
      };
    }
    res.status(response.status).json(response.message);
  });
};

module.exports.GetCouponByCode = function (req, res) {
  var coupon_code = req.body.coupon_code;
  table
    .findOne({ coupon_code: coupon_code.toUpperCase() })
    .populate("discountProduct")
    .exec()
    .then(async (data) => {
      console.log("data get");
      if (!data) {
        console.log("data not get");
        res.status(500).json({
          message: "error",
          data: "Invalid Coupon Code",
          code: 0,
        });
      } else {
        var start = data.start_date;
        var end = data.end_date;
        var todayDate = new Date();
        if (todayDate >= start && todayDate <= end) {
          if (data.usageLimit !== null) {
            // console.log("here --------------------->>>>>> 1");
            var usageLimit = +data.usageLimit;
          } else {
            // console.log("here --------------------->>>>>> 2");
            var usageLimit = Infinity;
          }
          // console.log(usageLimit);
          let couponUseInOrders = await bookingDataBase
            .find({
              couponId: mongoose.Types.ObjectId(data._id),
            })
            .count();
          let couponUseInSubscriptions = await Subscription.find({
            couponId: mongoose.Types.ObjectId(data._id),
          }).count();
          let totalUsage = couponUseInOrders + couponUseInSubscriptions;
          // console.log("usage counts ::::::::::::::", couponUseInOrders, couponUseInSubscriptions);
          if (totalUsage + 1 <= usageLimit) {
            if (data.discountProductPackageId != null) {
              if (!data) {
                res.status(400).json({
                  message: "error",
                  data: "product not found",
                  code: 0,
                });
              } else {
                var packageDataPush = {};
                var discountProductPackage = data.discountProduct.simpleData;
                for (var i = 0; i < discountProductPackage.length; i++) {
                  var DataI = discountProductPackage[i].package;
                  if (data.discountProduct.productQuantity > data.discountProduct.BookingQuantity) {
                    if (data.discountProduct.TypeOfProduct == "simple") {
                      for (var j = 0; j < DataI.length; j++) {
                        var packageArray = DataI[j]._doc;
                        if (JSON.stringify(packageArray._id) === JSON.stringify(data.discountProductPackageId)) {
                          packageDataPush = {
                            packet_size: packageArray.packet_size,
                            packetLabel: packageArray.packetLabel,
                            selling_price: packageArray.selling_price,
                            _id: packageArray._id,
                          };
                        }
                      }
                    }
                  }
                }

                var FinalData = {
                  _id: data._id,
                  couponValue: data.couponValue,
                  name: data.name,
                  description: data.description,
                  image: data.image,
                  tc: data.tc,
                  coupon_code: data.coupon_code,
                  usageLimit: data.usageLimit,
                  UserType: data.UserType,
                  discountType: data.discountType,
                  discountAmount: data.discountAmount,
                  discountLocation: data.discountLocation,
                  discountPercentage: data.discountPercentage,
                  discount_upto: data.discount_upto,
                  region: data.region,
                  ProductCategoryType: data.ProductCategoryType,
                  __v: data.__v,
                  created_at: data.created_at,
                  status: data.status,
                  categoryDetail: data.categoryDetail,
                  productDetail: data.productDetail,
                  couponNoOfUsed: data.couponNoOfUsed,
                  couponUsed: data.couponUsed,
                  discountProductPackageId: data.discountProductPackageId,
                  discountProductPackagedata: packageDataPush,
                  discountProduct: data.discountProduct,
                  end_date: data.end_date,
                  start_date: data.start_date,
                };
                res.status(200).json({
                  message: "ok",
                  data: FinalData,
                  code: 1,
                });
              }
            } else {
              var FinalData = {
                _id: data._id,
                couponValue: data.couponValue,
                name: data.name,
                description: data.description,
                image: data.image,
                tc: data.tc,
                coupon_code: data.coupon_code,
                usageLimit: data.usageLimit,
                UserType: data.UserType,
                discountType: data.discountType,
                discountAmount: data.discountAmount,
                discountLocation: data.discountLocation,
                discountPercentage: data.discountPercentage,
                discount_upto: data.discount_upto,
                region: data.region,
                ProductCategoryType: data.ProductCategoryType,
                __v: data.__v,
                created_at: data.created_at,
                status: data.status,
                categoryDetail: data.categoryDetail,
                productDetail: data.productDetail,
                couponNoOfUsed: data.couponNoOfUsed,
                couponUsed: data.couponUsed,
                discountProductPackageId: null,
                discountProductPackagedata: null,
                discountProduct: data.discountProduct,
                end_date: data.end_date,
                start_date: data.start_date,
              };
              res.status(200).json({
                message: "ok",
                data: FinalData,
                code: 1,
              });
            }
          } else {
            return res.status(200).json({
              message: "error",
              data: "Coupon usage limit reached",
              code: 1,
            });
          }
        } else {
          return res.status(200).json({
            message: "error",
            data: "Coupon expired",
            code: 1,
          });
        }
      }
    });
};

// module.exports.Update = function(req,res) {
// 	upload(req, res, function (err) {
// 		console.log(req.body);
// 		var Id = req.body._id;
// 		var nameFilter = { 'name':req.body.name  };
// 	    var error      = {};
// 	    table.find(nameFilter).exec().then(GetFilter =>{
// 	        if(GetFilter.length > 0) {
// 	            if (GetFilter[0]._id != Id) {
// 	              error['name'] = 'name alreday exist';
// 	            }
// 	        }
// 	        var errorArray = Object.keys(error).length;
// 	        if(errorArray > 0){
// 	            return res.status(200).json({
// 	                "status": "error",
// 	                "result": [error]
// 	            });
// 	        }else{

// 	        	if(req.body.discountType == 'ProductCategory'){
// 	        		if(req.body.ProductCategoryType == 'product'){
// 	        			var Data = req.body.product_id
// 	        			var Data = JSON.parse(Data);
// 		        		var productDataArray = [];
// 		        		for (var i = 0; i < Data.length; i++) {
// 		        			productDataArray.push({
// 		        				"product_id" : Data[i]
// 		        			})
// 		        		}
// 	        		}
// 	        		else if(req.body.ProductCategoryType == 'category'){
// 	        			var Data = req.body.category_id
// 	        			var Data = JSON.parse(Data);
// 		        		var categoryDataArray = [];
// 		        		for (var i = 0; i < Data.length; i++) {
// 		        			categoryDataArray.push({
// 		        				"category_id" : Data[i]
// 		        			})
// 		        		}
// 	        		}
// 	        	}else{
// 	        		var productDataArray = []
// 	        		var categoryDataArray = []
// 	        	}

// 	        	if(req.body.discountProduct == 'undefined' || req.body.discountProduct == undefined || req.body.discountProduct == '' || req.body.discountProduct == 'null'  || req.body.discountProduct == null){
// 	        		var discountProduct = null
// 	        	}else{
// 	        		var discountProduct = req.body.discountProduct
// 	        	}

// 	        	if(req.body.discountProductPackageId == 'undefined' || req.body.discountProductPackageId == undefined || req.body.discountProductPackageId == '' || req.body.discountProductPackageId == 'null'  || req.body.discountProductPackageId == null){
// 	        		var discountProductPackageId = null
// 	        	}else{
// 	        		var discountProductPackageId = req.body.discountProductPackageId
// 	        	}

// 	        	if(req.body.discount_upto == 'undefined' || req.body.discount_upto == undefined || req.body.discount_upto == '' || req.body.discount_upto == 'null'  || req.body.discount_upto == null){
// 	        		var discount_upto = null
// 	        	}else{
// 	        		var discount_upto = req.body.discount_upto
// 	        	}

// 	        	if(req.body.discountAmount == 'undefined' || req.body.discountAmount == undefined || req.body.discountAmount == '' || req.body.discountAmount == 'null'  || req.body.discountAmount == null){
// 	        		var discountAmount = null
// 	        	}else{
// 	        		var discountAmount = req.body.discountAmount
// 	        	}

// 	        	if(req.body.couponValue == 'undefined' || req.body.couponValue == undefined || req.body.couponValue == '' || req.body.couponValue == 'null'  || req.body.couponValue == null){
// 	        		var couponValue = null
// 	        	}else{
// 	        		var couponValue = req.body.couponValue
// 	        	}

// 				var updateData = {
//  					couponValue   : couponValue,
// 					name          : req.body.name,
// 					description   : req.body.description,
// 					image         : req.files.filter(i => i.fieldname === 'image').map(i => i.filename),
// 					start_date    : req.body.start_date,
// 					end_date      : req.body.end_date,
// 					tc            : req.body.tc,
// 					coupon_code   : req.body.coupon_code,
// 					usageLimit    : req.body.usageLimit,
// 					UserType      : req.body.UserType,
// 					discountType  : req.body.discountType,
// 					discountAmount     : discountAmount,
// 					discountPercentage : req.body.discountPercentage,
// 					discount_upto      : discount_upto,
// 					discountProduct    : discountProduct,
// 					discountProductPackageId : discountProductPackageId,
// 					ProductCategoryType: req.body.ProductCategoryType,
// 					productDetail      : productDataArray,
// 					categoryDetail     : categoryDataArray,
// 					status             : req.body.status,
// 				}
// 				table.update({_id:Id}, { $set: updateData},function(err,data){
// 					if(err) {
// 						res
// 							.status(500)
// 							.json({"message":'',"data":err,"code":0});
// 					} else {
// 						res
// 							.status(200)
// 							.json({"message":'ok',"data":'',"code":1});
// 							return;
// 					}
// 				})
// 			}
// 		}).catch(function(err) {
// 	        res
// 			.status(400)
// 			.json(err);
// 	    });
// 	});
// };

module.exports.Update = function (req, res) {
  upload(req, res, function (err) {
    var Id = req.body._id;

    let usageLimit = req.body.usageLimit && +req.body.usageLimit ? +req.body.usageLimit : null;

    var nameFilter = { name: req.body.name };
    var couponFilter = { coupon_code: req.body.coupon_code.toUpperCase() };
    var error = {};

    table
      .find(nameFilter)
      .exec()
      .then((GetFilter) => {
        table
          .find(couponFilter)
          .exec()
          .then((GetCouponFilter) => {
            if (GetFilter.length > 0) {
              if (GetFilter[0]._id != Id) {
                error["name"] = "name alreday exist";
              }
            }
            if (GetCouponFilter.length > 0) {
              if (GetCouponFilter[0]._id != Id) {
                error["coupon_code"] = "coupon_code alreday exist";
              }
            }
            var errorArray = Object.keys(error).length;
            if (errorArray > 0) {
              return res.status(200).json({
                status: "error",
                result: [error],
              });
            } else {
              var updateData = {
                name: req.body.name,
                description: req.body.description,
                image: req.files.length > 0 ? req.files.filter((i) => i.fieldname === "image").map((i) => i.filename)[0] : req.body.image,
                start_date: req.body.start_date,
                end_date: req.body.end_date,
                tc: req.body.tc,
                coupon_code: req.body.coupon_code,
                usageLimit: usageLimit,
                // couponValue   : couponValue,
                // UserType      : req.body.UserType,
                // discountType  : req.body.discountType,
                // discountAmount     : discountAmount,
                // discountPercentage : req.body.discountPercentage,
                // discount_upto      : discount_upto,
                // discountProduct    : discountProduct,
                // discountProductPackageId : discountProductPackageId,
                // ProductCategoryType: req.body.ProductCategoryType,
                // productDetail      : productDataArray,
                // categoryDetail     : categoryDataArray,
                status: req.body.status,
                catelogviewstatus: req.body.catelogviewstatus,
              };
              table.update({ _id: Id }, { $set: updateData }, function (err, data) {
                if (err) {
                  res.status(500).json({
                    message: "error",
                    data: err,
                    code: 0,
                  });
                } else {
                  res.status(200).json({
                    message: "ok",
                    data: "",
                    code: 1,
                  });
                  return;
                }
              });
            }
          });
      })
      .catch(function (err) {
        res.status(400).json(err);
      });
  });
};

module.exports.DeleteOne = function (req, res) {
  var Id = req.body._id;
  table.findByIdAndRemove(Id).exec(function (err, data) {
    if (err) {
      res.status(404).json({ message: "error", data: err, code: 0 });
    } else {
      res.status(200).json({ message: "ok", data: "", code: 1 });
      return;
    }
  });
};

module.exports.applyCoupon = function (req, res) {
  var coupon_code = req.body.coupon_code;

  table
    .findOne({ name: new RegExp(`^${coupon_code}$`, "i"), status: true })
    // .select('username email')
    .exec(function (err, data) {
      if (err) {
        res.status(404).json({
          message: "Coupon code is invaild",
          data: err,
          code: 0,
        });
        return;
      } else if (!data) {
        res.status(404).json({
          message: "Coupon code is invaild",
          data: "",
          code: 0,
        });
        return;
      }
      if (data) {
        var todaydate = new Date();
        var end_date = data.end_date;
        if (todaydate < end_date) {
          if (data.type === "Single") {
            if (data.coupon_used === "no") {
              res.status(200).json({
                message: "",
                data: data,
                code: 1,
              });
              return;
            } else {
              res.status(404).json({
                message: "Coupon code has already been reedmed.",
                data: "",
                code: 0,
              });
              return;
            }
          } else {
            res.status(200).json({
              message: "Coupon applied",
              data: data,
              code: 1,
            });
            return;
          }
        } else {
          res.status(404).json({
            message: "Coupon code has been expired",
            data: "",
            code: 0,
          });
          return;
        }
      }
    });
};
