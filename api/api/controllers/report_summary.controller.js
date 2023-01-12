var mongoose = require("mongoose");
const https = require("https");
var table = mongoose.model("report_generations");
//var ReportTable = mongoose.model('report_summaries');
var stockMaster = mongoose.model("stock_masters");
var reportSummary = mongoose.model("report_summary");
var inventoryDataBase = mongoose.model("inventory");
var addtocartDataBase = mongoose.model("addtocarts");
var Company = mongoose.model("companies");
var multer = require("multer");
var nodemailer = require("nodemailer");
var common = require("../../common.js");
var ledgers = mongoose.model("ledgers");
var createCsvWriter = require("csv-writer").createObjectCsvWriter;
var User = mongoose.model("Users");
var settingsModel = mongoose.model("settings");
var storeheySettingsModel = mongoose.model("storeheysettings");
var bookingDataBase = mongoose.model("bookings");
var subscriptionDataBase = mongoose.model("subscriptions");
var ProductDatabase = mongoose.model("products");
var CatDataBase = mongoose.model("product_categories");
var voucherInventory = mongoose.model("voucherInventory");
var LoyalityProgramHistory = mongoose.model("loyality_program_histories");
var Admin = mongoose.model("admin");
var Roles = mongoose.model("role");
var OnOffDataBase = mongoose.model("email_sms_on_off");
const moment = require("moment");
const today = moment().startOf("day");
const cron = require("node-cron");
const numWords = require("num-words");
const PaytmChecksum = require("../../Paytm/PaytmChecksum");
const config = require("../../Paytm/config");
var inventoryItemTable = mongoose.model("inventory_items");
var UserAddress = mongoose.model("UserAddress");

// pdf-creator-node
// const pdf = require("pdf-creator-node");
var pdf = require("html-pdf");
const fs = require("fs");
const Path = require("path");

const { PDFDocument, rgb } = require("pdf-lib");

const { ThresholdLogger, OutOfStockLogger, paytmStatusLogger, errorLogger } = common;

// const html = fs.readFileSync(Path.join(__dirname, "../../public/invoices/invoice-template.html"), "utf8");

//make cron to send email to admin when product availe qty less then product threshold
//at every 6 hour------------------    0 */6 * * *
//at every second ----------------     * * * * *
//at every hour ------------   0 */1 * * *   0 */1 * * *

var PaytmFetchingTheTransactionStatus = cron.schedule(
  "0 */1 * * *",
  async () => {
    try {
      // code here
      var PendingRecords = await bookingDataBase.find(
        {
          BookingStatusByAdmin: "Pending",
          payment: "Pending",
          paymentmethod: "Paytm",
        },
        { booking_code: 1 }
      );

      for (var i = 0; i <= PendingRecords.length; i++) {
        if (PendingRecords[i] && PendingRecords[i].booking_code) {
          var paytmParams = {};
          paytmParams.body = {
            mid: config.PaytmConfig.mid,
            orderId: PendingRecords[i].booking_code,
          };
          //console.log(paytmParams)
          paytmStatusLogger.debug("sending to paytm following params : ", paytmParams);
          await PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), config.PaytmConfig.key).then(async function (checksum) {
            paytmParams.head = {
              signature: checksum,
            };
            var post_data = JSON.stringify(paytmParams);
            //console.log(post_data);
            var options = {
              //hostname: 'securegw-stage.paytm.in'
              hostname: "securegw.paytm.in",
              port: 443,
              path: "/v3/order/status",
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Content-Length": post_data.length,
              },
            };
            // Set up the request
            var response1 = "";
            var post_req = https.request(options, function (post_res) {
              post_res.on("data", function (chunk) {
                response1 += chunk;
              });
              post_res.on("end", async function () {
                var response = response1 ? JSON.parse(response1) : "";
                paytmStatusLogger.debug("/PaytmResponseCallback :::::: ", "getting following from paytm : ", response);
                if (response) {
                  if (response.body.resultInfo.resultStatus === "TXN_SUCCESS") {
                    //console.log(response)

                    var updateData = {
                      payment: "Complete",
                      //BookingStatusByAdmin: "Pending",
                      MID: response.body.mid,
                      TXNID: response.body.txnId,
                      TXNAMOUNT: response.body.txnAmount,
                      PAYMENTMODE: response.body.paymentMode,
                      //CURRENCY: response.CURRENCY,
                      TXNDATE: response.body.txnDate,
                      STATUS: response.body.resultInfo.resultStatus,
                      RESPCODE: response.body.resultInfo.resultCode,
                      RESPMSG: response.body.resultInfo.resultMsg,
                      GATEWAYNAME: response.body.gatewayName,
                      BANKTXNID: response.body.bankTxnId,
                      //BANKNAME: post_data.BANKNAME,
                      CHECKSUMHASH: response.head.signature,
                    };
                    var ab = await bookingDataBase.updateMany({ booking_code: response.body.orderId }, { $set: updateData });
                    paytmStatusLogger.debug("/PaytmResponseCallback :::::: ", "update data");
                  } else {
                    var updateData = {
                      STATUS: response.body.resultInfo.resultStatus,
                      RESPCODE: response.body.resultInfo.resultCode,
                      RESPMSG: response.body.resultInfo.resultMsg,
                      CHECKSUMHASH: response.head.signature,
                    };
                    var ab = await bookingDataBase.updateMany({ booking_code: response.body.orderId }, { $set: updateData });
                  }
                }
              });
            });
            // post the data
            await post_req.write(post_data);
            post_req.end();
          });
        }
      }
    } catch (err) {
      errorLogger.error(err, "\n", "\n");
      console.log("catch error ::::: ", err);
    }
  },
  {
    scheduled: false,
    timezone: "Asia/Kolkata",
  }
);
PaytmFetchingTheTransactionStatus.start();

// var Thershold = cron.schedule(
//   "0 */1 * * *",
var Thershold = cron.schedule(
  "*/59 * * * *",

  async () => {
    try {
      console.log("Thershold mail");
      ThresholdLogger.info("######################################################################");
      ThresholdLogger.info("Cron run on ", new Date(), "mail start successfully");
      // code here
      //$expr: { $lte: ["$AvailableQuantity", "$productThreshold"] },
      var productData = await ProductDatabase.aggregate([
        {
          $match: {
            //product_name: "Potato",
            status: true,
            TypeOfProduct: "simple",
            productThreshold: { $gt: 0 },
          },
        },
        {
          $lookup: {
            from: "unit_measurements",
            localField: "unitMeasurement",
            foreignField: "_id",
            as: "unitMeasurement",
          },
        },
        {
          $unwind: {
            path: "$unitMeasurement",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "inventory_items",
            let: { product_id: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$product_id", "$$product_id"] } } },
              {
                $group: {
                  _id: null,
                  availableQuantity: { $sum: "$availableQuantity" },
                },
              },
              { $project: { _id: 0 } },
            ],
            as: "inventoryQty",
          },
        },
        {
          $unwind: { path: "$inventoryQty", preserveNullAndEmptyArrays: true },
        },
        {
          $addFields: {
            availableQuantity: {
              $ifNull: ["$inventoryQty.availableQuantity", 0],
            },
          },
        },
        { $project: { inventoryQty: 0 } },
        {
          $match: {
            $expr: { $lte: ["$availableQuantity", "$productThreshold"] },
          },
        },
      ]);
      var docs = productData;
      if (docs.length > 0) {
        ThresholdLogger.info("product found successfully");
        let notifs = await OnOffDataBase.findOne({}).lean();
        let threshold_notifs = notifs.threshold;

        var ProductDetail = "";
        ProductDetail +=
          "<tr><td style='text-transform: capitalize;padding:5px 10px;'><strong>Product Name</strong></td><td style='text-transform: capitalize;padding:5px 10px;'><strong>Threshold Level</strong></td><td style='text-transform: capitalize;padding:5px 10px;'><strong>Stock Available </strong></td></tr>";
        for (var i = 0; i < docs.length; i++) {
          if (+docs[i].productThreshold) {
            var productThreshold = +docs[i].productThreshold;
          } else {
            var productThreshold = 0;
          }

          var AvailableQuantity = +docs[i].availableQuantity + " " + docs[i].unitMeasurement.name;

          //console.log(+docs[i].inventoryQty.availableQuantity, AvailableQuantity)
          ProductDetail += "<tr>";
          ProductDetail += "<td style='text-transform: capitalize;padding:5px 10px;'>" + docs[i].product_name + "</td>";
          ProductDetail += "<td style='padding:5px 10px;'>" + productThreshold + "</td>";
          ProductDetail += "<td style='padding:5px 10px;'>" + AvailableQuantity + "</td>";
          ProductDetail += "</tr>";
        }

        let users = await Admin.find({ user_role: { $in: threshold_notifs.admin_roles } }, { username: 1, email: 1 }).lean();

        if (threshold_notifs.admin_email) {
          for (var i = 0; i < users.length; i++) {
            var keys = {
              ProductDetail: ProductDetail,
              type: "admin",
              template_name: "products threshold mail to admin",
              adminEmail: users[i].email,
              adminName: users[i].username,
            };
            ThresholdLogger.info("admin name, email ", users[i].username, users[i].email, " mail run successfully");

            await common.dynamicEmail(keys, ThresholdLogger);
          }
          ThresholdLogger.info("loop is working successfully");
        } else {
          ThresholdLogger.info("mail not sent to any user");
        }
      }
    } catch (err) {
      errorLogger.error(err, "\n", "\n");
      console.log("catch error ::::: ", err);
    }
  },
  {
    scheduled: false,
    timezone: "Asia/Kolkata",
  }
);
Thershold.start();

// var OutOfStock = cron.schedule(
//   "0 */1 * * *",
var OutOfStock = cron.schedule(
  "*/59 * * * *",

  async () => {
    try {
      OutOfStockLogger.info("######################################################################");
      OutOfStockLogger.info("Cron run on ", new Date(), "mail start successfully");
      // code here
      var productData = await ProductDatabase.aggregate([
        {
          $match: {
            //product_name: "Potato",
            status: true,
            TypeOfProduct: "simple",
            //TypeOfProduct: { $in: ["simple", "configurable"] },
          },
        },
        {
          $lookup: {
            from: "unit_measurements",
            localField: "unitMeasurement",
            foreignField: "_id",
            as: "unitMeasurement",
          },
        },
        {
          $unwind: {
            path: "$unitMeasurement",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "inventory_items",
            let: { product_id: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$product_id", "$$product_id"] } } },
              {
                $group: {
                  _id: null,
                  availableQuantity: { $sum: "$availableQuantity" },
                },
              },
              { $project: { _id: 0 } },
            ],
            as: "inventoryQty",
          },
        },
        {
          $unwind: { path: "$inventoryQty", preserveNullAndEmptyArrays: true },
        },
        {
          $addFields: {
            availableQuantity: {
              $ifNull: ["$inventoryQty.availableQuantity", 0],
            },
          },
        },
        { $project: { inventoryQty: 0 } },
        {
          $match: {
            availableQuantity: 0,
          },
        },
      ]);

      var docs = productData;
      if (docs.length > 0) {
        OutOfStockLogger.info(productData[0], "Product found successfully");
        let notifs = await OnOffDataBase.findOne({}).lean();
        let out_of_stock_notifs = notifs.out_of_stock;

        var ProductDetail = "";
        var groupProductArray = new Set();
        ProductDetail +=
          "<tr><td style='text-transform: capitalize;padding:5px 10px;'><strong>Product Name</strong></td><td style='text-transform: capitalize;padding:5px 10px;'><strong>Product Type</strong></td><td style='text-transform: capitalize;padding:5px 10px;'><strong>Stock Available </strong></td></tr>";
        for (var i = 0; i < docs.length; i++) {
          OutOfStockLogger.info(docs[i].product_name, "docs[i].product_name found successfully");
          let data1 = await ProductDatabase.find({
            TypeOfProduct: "group",
            "groupData.sets.product": docs[i]._id,
          });
          //console.log(data1.product_name, 'rrrrrrrrrrr')

          //group product start
          if (data1) {
            for (var i1 = 0; i1 < data1.length; i1++) {
              groupProductArray.add(data1[i1].product_name);
            }
          }
          //group product end

          ProductDetail += "<tr>";
          ProductDetail += "<td style='text-transform: capitalize;padding:5px 10px;'>" + docs[i].product_name + "</td>";
          ProductDetail += "<td style='padding:5px 10px;'>" + docs[i].TypeOfProduct + "</td>";
          ProductDetail += "<td style='padding:5px 10px;'>" + 0 + "</td>";
          ProductDetail += "</tr>";
        }

        groupProductArray = Array.from(groupProductArray);
        for (var i = 0; i < groupProductArray.length; i++) {
          ProductDetail += "<tr>";
          ProductDetail += "<td style='text-transform: capitalize;padding:5px 10px;'>" + groupProductArray[i] + "</td>";
          ProductDetail += "<td style='padding:5px 10px;'>group </td>";
          ProductDetail += "<td style='padding:5px 10px;'>" + 0 + "</td>";
          ProductDetail += "</tr>";
        }

        let users = await Admin.find({ user_role: { $in: out_of_stock_notifs.admin_roles } }, { username: 1, email: 1 }).lean();
        if (out_of_stock_notifs.admin_email) {
          for (var i = 0; i < users.length; i++) {
            var keys = {
              ProductDetail: ProductDetail,
              type: "admin",
              template_name: "products out of stock mail to admin",
              adminEmail: users[i].email,
              adminName: users[i].username,
            };
            OutOfStockLogger.info("admin name, email ", users[i].username, users[i].email, " mail run successfully");
            await common.dynamicEmail(keys, OutOfStockLogger);
          }
          OutOfStockLogger.info("for loop work successfully");
        } else {
          OutOfStockLogger.info("mail not sent to any user");
        }
      }
    } catch (err) {
      errorLogger.error(err, "\n", "\n");
      //console.log("catch error ::::: ", err);
    }
  },
  {
    scheduled: false,
    timezone: "Asia/Kolkata",
  }
);
OutOfStock.start();

//this cron is running for product expiry
// var ProductExpiry = cron.schedule(
//   "*/59 * * * *",
//   () => {
//     try {
//       // code here
//       ProductDatabase.find(
//         {
//           status: true,
//           TypeOfProduct: "simple",
//           productExpiryDay: { $nin: [0, null, ""] },
//         },
//         { _id: 1, productExpiryDay: 1, product_name: 1 }
//       )
//         .lean()
//         .sort({ product_name: 1 })
//         .exec()
//         .then(async (ProductData) => {
//           var productIDS = [];
//           for (var i = 0; i < ProductData.length; i++) {
//             productIDS.push(ProductData[i]._id);
//           }
//           let data = await inventoryDataBase
//             .find({
//               productData: {
//                 $elemMatch: {
//                   product_id: productIDS,
//                   "simpleData.ExpirationDate": { $gt: new Date() },
//                 },
//               },
//             })
//             .lean();
//           if (data.length > 0) {
//             var productDataArray;
//             for (var i1 = 0; i1 < data.length; i1++) {
//               var inProDataI = data[i1];
//               productDataArray = inProDataI.productData;
//             }
//             let finalArray = ProductData.map((item, i) => Object.assign({}, item, productDataArray[i]));

//             if (finalArray.length > 0) {
//               var ProductMail = [];
//               for (var k = 0; k < finalArray.length; k++) {
//                 var IFinalArray = finalArray[k];
//                 var simpleIFinalArray = IFinalArray.simpleData;
//                 if (simpleIFinalArray) {
//                   for (var k1 = 0; k1 < simpleIFinalArray.length; k1++) {
//                     var ExpirationDate = simpleIFinalArray[k1].ExpirationDate;
//                     if (ExpirationDate != null) {
//                       var expiryDate = moment.utc(ExpirationDate).tz("Asia/Kolkata");
//                       expiryDate = expiryDate.format("MM-DD-YYYY");

//                       var expiryDay = IFinalArray.productExpiryDay;
//                       var expirybeforeDate = new Date(expiryDate);
//                       expirybeforeDate.setDate(expirybeforeDate.getDate() - parseInt(expiryDay));

//                       var todayDate = moment.utc(new Date()).tz("Asia/Kolkata");
//                       todayDate = todayDate.format("MM-DD-YYYY");

//                       if (new Date(todayDate).toDateString() === expirybeforeDate.toDateString()) {
//                         ProductMail.push({
//                           product_name: IFinalArray.product_name,
//                           batchID: IFinalArray.batchID,
//                           availQuantity: simpleIFinalArray[k1].availQuantity,
//                           expiry_Date: expiryDate,
//                         });
//                       } else {
//                       }
//                     }
//                   }
//                 }
//               }

//               if (ProductMail.length > 0) {
//                 let notifs = await OnOffDataBase.findOne({}).lean();
//                 let product_expiration_notifs = notifs.product_expiration;

//                 var ProductDetail = "";
//                 ProductDetail +=
//                   "<tr><td style='text-transform: capitalize;padding:5px 10px;'><strong>Product Name</strong></td><td style='text-transform: capitalize;padding:5px 10px;'><strong>Batch ID</strong></td><td style='text-transform: capitalize;padding:5px 10px;'><strong>Available Quantity</strong></td><td style='text-transform: capitalize;padding:5px 10px;'><strong>Expiry Date</strong></td></tr>";
//                 for (var i = 0; i < ProductMail.length; i++) {
//                   if (ProductMail[i].batchID) {
//                     var batchID = ProductMail[i].batchID;
//                   } else {
//                     var batchID = null;
//                   }
//                   ProductDetail += "<tr>";
//                   ProductDetail += "<td style='text-transform: capitalize;padding:5px 10px;'>" + ProductMail[i].product_name + "</td>";
//                   ProductDetail += "<td style='text-transform: capitalize;padding:5px 10px;'>" + batchID + "</td>";
//                   ProductDetail += "<td style='text-transform: capitalize;padding:5px 10px;'>" + ProductMail[i].availQuantity + "</td>";
//                   ProductDetail += "<td style='padding:5px 10px;'>" + ProductMail[i].expiry_Date + "</td>";

//                   ProductDetail += "</tr>";
//                 }

//                 let users = await Admin.find({ user_role: { $in: product_expiration_notifs.admin_roles } }, { username: 1, email: 1 }).lean();
//                 if (product_expiration_notifs.admin_email) {
//                   users.forEach((user) => {
//                     var keys = {
//                       ProductDetail: ProductDetail,
//                       type: "admin",
//                       template_name: "products expiration mail to admin",
//                       adminEmail: user.email,
//                       adminName: user.username,
//                     };
//                     common.dynamicEmail(keys);
//                   });
//                 }
//               }
//             }
//           }
//         });
//     } catch (err) {
//       errorLogger.error(err, "\n", "\n");
//       console.log(err, "tttttttttttttttttttt");
//     }
//   },
//   {
//     scheduled: false,
//     timezone: "Asia/Kolkata",
//   }
// );
// ProductExpiry.start();

// delete recode from report collection
var DeleteReports = cron.schedule(
  "0 */6 * * *",
  async () => {
    // db.report_generations.createIndex( { "created_at": 1 }, { expireAfterSeconds: 60*60*24*7 } )
    // db.report_generations.createIndex( { "created_at": 1 }, { expireAfterSeconds: 60 } )
    try {
      // var data = await ProductDatabase.find({},{ "product_name": 1, _id:1 }).lean()
      // for (var i = 0; i < data.length; i++) {
      //   var product_name = data[i].product_name.trim();
      //   await ProductDatabase.update(
      //        { "_id": data[i]._id },
      //        { "$set": { "product_name": product_name } }
      //    );
      // }
      // code here
      var date = new Date();
      date.setDate(date.getDate() - 7);
      table.deleteMany({ created_at: { $lt: new Date(date) } }).exec(function (err, data) {
        var uploadsDir = Path.join(__dirname, "../../public/reports");
        fs.readdir(uploadsDir, function (err, files) {
          files.forEach(function (file, index) {
            fs.stat(Path.join(uploadsDir, file), function (err, stat) {
              var endTime, now;
              if (err) {
                return console.error(err);
              }
              now = new Date().getTime();
              endTime = new Date(stat.ctime).getTime() + 1000 * 60 * 60 * 24 * 7;
              if (now > endTime) {
                fs.rm(Path.join(uploadsDir, file), function (err) {
                  if (err) {
                    errorLogger.error(err, "\n", "\n");
                    return console.error(err);
                  }
                  //console.log('successfully deleted');
                });
              }
            });
          });
        });
      });
    } catch (err) {
      errorLogger.error(err, "\n", "\n");
      console.log("catch error ::::: ", err);
    }
  },
  {
    scheduled: false,
    timezone: "Asia/Kolkata",
  }
);
DeleteReports.start();

module.exports.GetAll = function (req, res) {
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
    res.status(400).json({
      message: "If supplied in querystring, count and offset must both be numbers",
    });
    return;
  }

  if (count > maxCount) {
    res.status(400).json({
      message: "Count limit of " + maxCount + " exceeded",
    });
    return;
  }

  reportSummary
    .find()
    .populate(["stock_id", "product_id", "user_id", "order_id"])
    .sort({ created_at: "desc" })
    .exec(function (err, data) {
      if (err) {
        res.status(500).json(err);
      } else {
        res.status(200).json({ message: "ok", data: data, code: 1 });
      }
    });
};

module.exports.searchGetAll = function (req, res) {
  var DataFilter = {};
  if (req.body.report_type != null) {
    DataFilter["report_type"] = req.body.report_type;
  }
  if (req.body.from_date && req.body.to_date) {
    var from_date1 = new Date(req.body.from_date);
    var to_date1 = new Date(req.body.to_date);
    to_date1.setDate(to_date1.getDate() + 1);
    DataFilter["created_at"] = { $gte: from_date1, $lte: to_date1 };
  }
  reportSummary
    .find(DataFilter)
    .sort({ created_at: "desc" })

    .populate(["stock_id", "product_id", "user_id", "order_id"])

    .exec(function (err, data) {
      if (err) {
        res.status(500).json(err);
      } else {
        res.status(200).json({ message: "ok", data: data, code: 1 });
      }
    });
};

module.exports.checkCsv = function (req, res) {
  var t = Math.random();
  const csvWriter = createCsvWriter({
    path: "./public/reports/file" + t + ".csv",
    header: [
      { id: "name", title: "NAME" },
      { id: "lang", title: "LANGUAGE" },
    ],
  });

  const records = [
    { name: "Bob", lang: "French, English" },
    { name: "Mary", lang: "English" },
  ];

  csvWriter
    .writeRecords(records) // returns a promise
    .then(() => {});
  var report = "http://172.16.10.8:3003/reports/file" + t + ".csv";
  res.status(200).json({ message: "ok", data: report, code: 0 });
  return;
};

module.exports.searchLedgers = function (req, res) {
  var DataFilter = {};
  if (req.body.ledger_type != null) {
    DataFilter["ledger_type"] = req.body.ledger_type;
  }
  if (req.body.from_date && req.body.to_date) {
    var from_date1 = new Date(req.body.from_date);
    var to_date1 = new Date(req.body.to_date);
    to_date1.setDate(to_date1.getDate() + 1);
    DataFilter["created_at"] = { $gte: from_date1, $lte: to_date1 };
  }
  ledgers
    .find(DataFilter)
    .sort({ created_at: "desc" })
    .populate(["stock_id", "product_id", "user_id", "order_id"])
    .exec(function (err, data) {
      if (err) {
        res.status(500).json(err);
      } else {
        res.status(200).json({ message: "ok", data: data, code: 1 });
      }
    });
};

//------------------------------------------added by chitra----------------------------

//top 10 customer
module.exports.TopTenCustomer = function (req, res) {
  User.find().exec(function (err, array1) {
    bookingDataBase
      .aggregate([
        {
          $match: { BookingStatusByAdmin: "Delivered" },
        },
        {
          $group: {
            _id: "$user_id",
            totalOrder: { $sum: 1 },
            totalAmount: { $sum: "$total_payment" },
          },
        },
        {
          $sort: { totalOrder: -1 },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $match: {
            user: { $ne: [] },
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            _id: 1,
            user: "$user",
            totalOrder: 1,
            totalAmount: 1,
            LOrderDate: "$user.LastOrderDate",
          },
        },
        { $limit: 10 },
      ])
      .exec(function (err, array2) {
        if (err) {
          res.status(500).json(err);
        } else if (!array2) {
          res.status(400).json({
            message: "error",
            data: "",
            code: 0,
          });
        }

        res.status(200).json({
          message: "ok",
          data: array2,
          code: 1,
        });
      });
  });
};

// latest 10 products of single user
// module.exports.TopTenProductsOfUser = function (req, res) {
//   var user_id = req.body.user_id;
//   var region_id = req.body.RegionId;

//   // if (region_id == "" || !region_id || region_id == undefined || region_id == null) {
//   //     common.formValidate("RegionId", res);
//   //     return false;
//   // }

//   bookingDataBase
//     .aggregate([
//       { $match: { user_id: new mongoose.Types.ObjectId(user_id) } },
//       { $sort: { createDate: -1 } },
//       { $limit: 50 },
//       {
//         $group: {
//           _id: "$user_id",
//           bookingdetail: { $addToSet: "$bookingdetail.product_id" },
//         },
//       },
//       {
//         $addFields: {
//           bookingdetail: {
//             $reduce: {
//               input: "$bookingdetail",
//               initialValue: [],
//               in: { $setUnion: ["$$value", "$$this"] },
//             },
//           },
//         },
//       },
//     ])
//     .exec(function (err, array2) {
//       console.log(array2[0].bookingdetail, 'olsddddddd')
//       if (array2[0] != null) {
//         if (array2[0].bookingdetail != null) {
//           if (region_id) {
//             ProductDatabase.find({
//               _id: array2[0].bookingdetail,
//               $or: [
//                 {
//                   "simpleData.region": region_id,
//                   simpleData: {
//                     $elemMatch: { region: { $in: [region_id] } },
//                   },
//                   //"simpleData._id":1,
//                 },
//                 {
//                   "configurableData.region": region_id,
//                   configurableData: {
//                     $elemMatch: { region: { $in: [region_id] } },
//                   },
//                   //"simpleData._id":1,
//                 },
//                 {
//                   TypeOfProduct: "group",
//                 },
//               ],
//             })
//               .populate("admin_id", "name")
//               .populate("product_categories")
//               .populate("relatedProduct.product_id")
//               .populate("relatedRecipes.blog_id")
//               .populate("ProductRegion.region_id", "name")
//               .populate("unitMeasurement", "name")
//               .populate("simpleData.region", "name")
//               .populate("simpleData.package")
//               .populate("groupData.sets.package")
//               .populate("configurableData.region", "name")
//               .populate("configurableData.attributes.attributeId", "name item")
//               .populate({
//                 path: "relatedProduct.product_id",
//                 populate: [
//                   { path: "unitMeasurement" },
//                   { path: "product_categories" },
//                 ],
//               })
//               .populate("salesTaxOutSide")
//               .populate("salesTaxWithIn")
//               .populate("purchaseTax")
//               .lean()
//               .exec()
//               .then(async (data) => {
//                 if (err) {
//                   res.status(500).json(err);
//                 } else if (!array2) {
//                   res.status(400).json({
//                     message: "error",
//                     data: "",
//                     code: 0,
//                   });
//                 } else {
//                   var overallAvailablity = false;
//                   var regionAvailablity = false;
//                   var DataJson = [];
//                   for (var i = 0; i < data.length; i++) {
//                     var DataI = data[i];
//                     if (DataI.AvailableQuantity > 0) {
//                       var overallAvailablity = true;
//                     } else {
//                       var overallAvailablity = false;
//                     }
//                     var configurableDataPush = [];
//                     var simpleDataPush = [];
//                     var groupDataPush = [];
//                     if (DataI.TypeOfProduct == "configurable") {
//                       var varItem = DataI.configurableData;

//                       for (var j = 0; j < varItem.length; j++) {
//                         var variantIdArray = varItem[j];
//                         if (
//                           JSON.stringify(req.body.RegionId) ==
//                           JSON.stringify(variantIdArray.region._id)
//                         ) {
//                           configurableDataPush.push({
//                             ...varItem[j],
//                           });
//                         }
//                       }
//                     } else if (DataI.TypeOfProduct == "simple") {
//                       var varItem = DataI.simpleData;
//                       for (var j = 0; j < varItem.length; j++) {
//                         var variantIdArray = varItem[j];
//                         if (
//                           JSON.stringify(req.body.RegionId) ==
//                           JSON.stringify(variantIdArray.region._id)
//                         ) {
//                           if (varItem[j].availQuantity > 0) {
//                             var regionAvailablity = true;
//                           } else {
//                             var regionAvailablity = false;
//                           }
//                           simpleDataPush.push({
//                             ...varItem[j],
//                           });
//                         }
//                       }
//                     } else if (DataI.TypeOfProduct == "group") {
//                       overallAvailablity = true;
//                       regionAvailablity = true;
//                       var varItem = [...DataI.groupData];

//                       try {
//                         for (let i = 0; i < varItem.length; i++) {
//                           let item = varItem[i];
//                           let setsArr = [];
//                           for (let j = 0; j < item.sets.length; j++) {
//                             let set = item.sets[j];
//                             let detailedProduct = await ProductDatabase.findById(
//                               mongoose.Types.ObjectId(set.product)
//                             )
//                               .populate("unitMeasurement", "name")
//                               .populate("salesTaxOutSide")
//                               .populate("salesTaxWithIn")
//                               .populate("purchaseTax")
//                               .lean();

//                             if (detailedProduct.TypeOfProduct == "simple") {
//                               detailedProduct.simpleData = detailedProduct.simpleData.filter(
//                                 (sd) => {
//                                   return req.body.RegionId == sd.region;
//                                 }
//                               );
//                               if (detailedProduct.simpleData[0]) {
//                                 detailedProduct.outOfStock =
//                                   detailedProduct.AvailableQuantity <= 0 ||
//                                   detailedProduct.simpleData[0].availQuantity <=
//                                     0;
//                                 detailedProduct.soldInRegion = true;
//                               } else {
//                                 detailedProduct.outOfStock = true;
//                                 detailedProduct.soldInRegion = false;
//                               }
//                             }

//                             let setItem = {
//                               product: detailedProduct,
//                               setmaxqty: set.setmaxqty,
//                               setminqty: set.setminqty,
//                               package: set.package,
//                             };
//                             setsArr.push(setItem);
//                           }
//                           let groupDataItem = {
//                             sets: setsArr,
//                             name: item.name,
//                             minqty: item.minqty,
//                             maxqty: item.maxqty,
//                           };
//                           groupDataPush.push(groupDataItem);
//                         }
//                       } catch (err) {
//                         errorLogger.error(err, "\n", "\n");
//                       }
//                     }
//                     if (overallAvailablity & regionAvailablity) {
//                       var outOfStock = false;
//                     } else {
//                       var outOfStock = true;
//                     }
//                     if (DataI.relatedRecipes) {
//                       var ForrelatedRecipes = DataI.relatedRecipes;
//                       var ArrayRelatedRecipes = [];
//                       for (var m = 0; m < ForrelatedRecipes.length; m++) {
//                         var MrelatedRecipes = ForrelatedRecipes[m];
//                         if (MrelatedRecipes.blog_id != null) {
//                           ArrayRelatedRecipes.push({
//                             _id: MrelatedRecipes._id,
//                             blog_id: MrelatedRecipes.blog_id,
//                           });
//                         }
//                       }
//                     } else {
//                       var ArrayRelatedRecipes = [];
//                     }

//                     DataJson.push({
//                       _id: DataI._id,
//                       admin_id: DataI.admin_id,
//                       product_name: DataI.product_name,
//                       slug: DataI.slug,
//                       outOfStock: outOfStock,
//                       longDesc: DataI.longDesc,
//                       shortDesc: DataI.shortDesc,
//                       attachment: DataI.attachment,
//                       productThreshold: DataI.productThreshold,
//                       productSubscription: DataI.productSubscription,
//                       salesTaxOutSide: DataI.salesTaxOutSide,
//                       salesTaxWithIn: DataI.salesTaxWithIn,
//                       purchaseTax: DataI.purchaseTax,
//                       hsnCode: DataI.hsnCode,
//                       unitMeasurement: DataI.unitMeasurement,
//                       unitQuantity: DataI.unitQuantity,
//                       TypeOfProduct: DataI.TypeOfProduct,
//                       SKUCode: DataI.SKUCode,
//                       __v: DataI.__v,
//                       created_at: DataI.created_at,
//                       status: DataI.status,
//                       configurableData: configurableDataPush,
//                       simpleData: simpleDataPush,
//                       groupData: groupDataPush,
//                       productQuantity: DataI.productQuantity,
//                       AvailableQuantity: DataI.AvailableQuantity,
//                       ProductRegion: DataI.ProductRegion,
//                       //"relatedRecipes": DataI.relatedRecipes,
//                       relatedRecipes: ArrayRelatedRecipes,
//                       relatedProduct: DataI.relatedProduct,
//                       images: DataI.images,
//                       product_categories: DataI.product_categories,
//                       preOrder: DataI.preOrder,
//                       preOrderQty: DataI.preOrderQty,
//                       preOrderBookQty: DataI.preOrderBookQty,
//                       preOrderRemainQty: DataI.preOrderRemainQty,
//                       preOrderStartDate: DataI.preOrderStartDate,
//                       preOrderEndDate: DataI.preOrderEndDate,
//                       // product_subCat1_id:
//                       //     DataI.product_subCat1_id,
//                       // product_cat_id: DataI.product_cat_id,
//                     });
//                   }
//                   res.status(200).json({
//                     message: "ok",
//                     data: DataJson,
//                     code: 1,
//                   });
//                 }
//               });
//           } else {
//             ProductDatabase.find({ _id: array2[0].bookingdetail })
//               .populate("unitMeasurement")
//               .populate("salesTaxWithIn")
//               .populate("salesTaxOutSide")
//               .exec()
//               .then((Data) => {
//                 if (err) {
//                   res.status(500).json(err);
//                 } else if (!array2) {
//                   res.status(400).json({
//                     message: "error",
//                     data: "",
//                     code: 0,
//                   });
//                 }
//                 res.status(200).json({
//                   message: "ok",
//                   data: Data,
//                   code: 1,
//                 });
//               });
//           }
//         }
//       } else {
//         res.status(200).json({ message: "ok", data: "", code: 1 });
//       }
//     });
// };

module.exports.TopTenProductsOfUser = async function (req, res) {
  var user_id = req.body.user_id;
  var region_id = req.body.RegionId;
  let array2 = await bookingDataBase.aggregate([
    { $match: { user_id: new mongoose.Types.ObjectId(user_id) } },
    { $sort: { createDate: -1 } },
    { $limit: 50 },
    {
      $group: {
        _id: "$user_id",
        bookingdetail: { $addToSet: "$bookingdetail.product_id._id" },
      },
    },
    {
      $addFields: {
        bookingdetail: {
          $reduce: {
            input: "$bookingdetail",
            initialValue: [],
            in: { $setUnion: ["$$value", "$$this"] },
          },
        },
      },
    },
  ]);
  if (array2[0] != null) {
    if (array2[0].bookingdetail != null) {
      if (region_id) {
        productids = array2[0].bookingdetail;
        var ids = [];
        for (j = 0; j < productids.length; j++) {
          ids.push(productids[j]._id);
        }
        let i = 0;
        let arrayLength = ids.length;
        var output = [];
        while (i < arrayLength) {
          var pids = ids[i];
          let data = await ProductDatabase.aggregate([
            {
              $match: {
                _id: mongoose.Types.ObjectId(pids),
                $or: [
                  {
                    "simpleData.region": mongoose.Types.ObjectId(region_id),
                    simpleData: {
                      $elemMatch: {
                        region: { $in: [mongoose.Types.ObjectId(region_id)] },
                      },
                    },
                    //"simpleData._id":1,
                  },
                  {
                    "configurableData.region": mongoose.Types.ObjectId(region_id),
                    configurableData: {
                      $elemMatch: {
                        region: { $in: [mongoose.Types.ObjectId(region_id)] },
                      },
                    },
                    //"simpleData._id":1,
                  },
                  {
                    TypeOfProduct: "group",
                  },
                ],
              },
            },
            {
              $facet: {
                count: [{ $count: "count" }],
                docs: [
                  // For addings category status based checks
                  ...[
                    {
                      $lookup: {
                        from: "categories",
                        foreignField: "_id",
                        localField: "product_categories",
                        as: "product_categories",
                      },
                    },
                    {
                      $addFields: {
                        allCategories: {
                          $function: {
                            body: function (cats) {
                              let x = [];
                              cats.forEach((cat) => {
                                x.push(cat._id);
                                cat.ancestors.forEach((ancestor) => {
                                  x.push(ancestor._id);
                                });
                              });
                              return x;
                            },
                            args: ["$product_categories"],
                            lang: "js",
                          },
                        },
                      },
                    },
                    {
                      $lookup: {
                        from: "categories",
                        foreignField: "_id",
                        localField: "allCategories",
                        as: "allCategories",
                      },
                    },
                    {
                      $addFields: {
                        allCategoryStatus: {
                          $function: {
                            body: function (cats) {
                              return cats.filter((cat) => !cat.status).length > 0 ? false : true;
                            },
                            args: ["$allCategories"],
                            lang: "js",
                          },
                        },
                      },
                    },
                    { $match: { allCategoryStatus: true } },
                  ],
                  {
                    $addFields: {
                      simpleData: {
                        $ifNull: ["$simpleData", []],
                      },
                      configurableData: {
                        $ifNull: ["$configurableData", []],
                      },
                      groupData: {
                        $ifNull: ["$groupData", []],
                      },
                    },
                  },

                  // For adding quantity keys
                  ...[
                    {
                      $lookup: {
                        from: "inventory_items",
                        let: { product_id: "$_id" },
                        pipeline: [
                          {
                            $match: {
                              $expr: {
                                $and: [
                                  { $eq: ["$product_id", "$$product_id"] },
                                  {
                                    $eq: ["$region", mongoose.Types.ObjectId(region_id)],
                                  },
                                ],
                              },
                            },
                          },
                          {
                            $group: {
                              _id: null,
                              productQuantity: { $sum: "$productQuantity" },
                              bookingQuantity: { $sum: "$bookingQuantity" },
                              availableQuantity: { $sum: "$availableQuantity" },
                              lostQuantity: { $sum: "$lostQuantity" },
                              returnQuantity: { $sum: "$returnQuantity" },
                              inhouseQuantity: { $sum: "$inhouseQuantity" },
                            },
                          },
                          { $project: { _id: 0 } },
                        ],
                        as: "inventories",
                      },
                    },
                    {
                      $unwind: {
                        path: "$inventories",
                        preserveNullAndEmptyArrays: true,
                      },
                    },
                    {
                      $addFields: {
                        productQuantity: {
                          $ifNull: [{ $toDouble: "$inventories.productQuantity" }, 0],
                        },
                        bookingQuantity: {
                          $ifNull: [{ $toDouble: "$inventories.bookingQuantity" }, 0],
                        },
                        availableQuantity: {
                          $ifNull: [{ $toDouble: "$inventories.availableQuantity" }, 0],
                        },
                        lostQuantity: {
                          $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0],
                        },
                        returnQuantity: {
                          $ifNull: [{ $toDouble: "$inventories.returnQuantity" }, 0],
                        },
                        inhouseQuantity: {
                          $ifNull: [{ $toDouble: "$inventories.inhouseQuantity" }, 0],
                        },
                      },
                    },
                    {
                      $addFields: {
                        outOfStock: {
                          $cond: [{ $eq: ["$TypeOfProduct", "simple"] }, { $lte: ["$availableQuantity", 0] }, false],
                        },
                      },
                    },
                  ],

                  // For adding ratings and reviews keys
                  ...[
                    {
                      $lookup: {
                        from: "ratingreviews",
                        let: { product_id: "$_id" },
                        pipeline: [
                          {
                            $match: {
                              $expr: { $eq: ["$product_id", "$$product_id"] },
                            },
                          },
                          {
                            $group: {
                              _id: null,
                              ratingsCount: { $sum: 1 },
                              ratingsSum: { $sum: "$rating" },
                              ratingsArray: { $push: "$rating" },
                              reviewArray: { $push: "$review" },
                            },
                          },
                        ],
                        as: "ratingreviews",
                      },
                    },
                    {
                      $unwind: {
                        path: "$ratingreviews",
                        preserveNullAndEmptyArrays: true,
                      },
                    },
                    {
                      $addFields: {
                        ratings: {
                          $round: [
                            {
                              $divide: ["$ratingreviews.ratingsSum", "$ratingreviews.ratingsCount"],
                            },
                            1,
                          ],
                        },
                        reviews: {
                          $filter: {
                            input: "$ratingreviews.reviewArray",
                            as: "review",
                            cond: { $ne: ["$$review", ""] },
                          },
                        },
                        ratingsCount: "$ratingreviews.ratingsCount",
                      },
                    },
                    {
                      $addFields: {
                        reviewsCount: {
                          $cond: {
                            if: { $isArray: "$reviews" },
                            then: { $size: "$reviews" },
                            else: 0,
                          },
                        },
                      },
                    },
                  ],

                  // For Populating nested keys inside nested array of objects
                  ...[
                    // inside simpleData array
                    ...[
                      {
                        $unwind: {
                          path: "$simpleData",
                          preserveNullAndEmptyArrays: true,
                        },
                      },
                      {
                        $lookup: {
                          from: "regions",
                          foreignField: "_id",
                          localField: "simpleData.region",
                          as: "simpleData.region",
                        },
                      },
                      {
                        $unwind: {
                          path: "$simpleData.region",
                          preserveNullAndEmptyArrays: true,
                        },
                      },
                      {
                        $unset: ["simpleData.region.stateData", "simpleData.region.__v", "simpleData.region.created_at"],
                      },
                      {
                        $lookup: {
                          from: "packages",
                          foreignField: "_id",
                          localField: "simpleData.package",
                          as: "simpleData.package",
                        },
                      },
                      {
                        $addFields: {
                          "simpleData.package": {
                            $filter: {
                              input: "$simpleData.package",
                              as: "item",
                              cond: { $eq: ["$$item.status", true] },
                            },
                          },
                          "simpleData.availableQuantity": "$availableQuantity",
                        },
                      },
                      {
                        $group: {
                          _id: "$_id",
                          product_name: { $first: "$product_name" },
                          images: { $first: "$images" },
                          simpleData: { $push: "$simpleData" },
                          configurableData: { $first: "$configurableData" },
                          groupData: { $first: "$groupData" },
                          base_price: { $first: "$base_price" },
                          slug: { $first: "$slug" },
                          TypeOfProduct: { $first: "$TypeOfProduct" },
                          outOfStock: { $first: "$outOfStock" },
                          availableQuantity: { $first: "$availableQuantity" },
                          productSubscription: {
                            $first: "$productSubscription",
                          },
                          preOrder: { $first: "$preOrder" },
                          preOrderQty: { $first: "$preOrderQty" },
                          preOrderBookQty: { $first: "$preOrderBookQty" },
                          preOrderRemainQty: { $first: "$preOrderRemainQty" },
                          preOrderStartDate: { $first: "$preOrderStartDate" },
                          preOrderEndDate: { $first: "$preOrderEndDate" },
                          sameDayDelivery: { $first: "$sameDayDelivery" },
                          farmPickup: { $first: "$farmPickup" },
                          priority: { $first: "$priority" },
                          status: { $first: "$status" },
                          showstatus: { $first: "$showstatus" },
                          ratings: { $first: "$ratings" },
                          ratingsCount: { $first: "$ratingsCount" },
                          reviews: { $first: "$reviews" },
                          reviewsCount: { $first: "$reviewsCount" },
                          unitMeasurement: { $first: "$unitMeasurement" },
                          salesTaxOutSide: { $first: "$salesTaxOutSide" },
                          salesTaxWithIn: { $first: "$salesTaxWithIn" },
                          purchaseTax: { $first: "$purchaseTax" },
                          product_categories: { $first: "$product_categories" },
                        },
                      },
                      {
                        $addFields: {
                          simpleData: {
                            $filter: {
                              input: "$simpleData",
                              as: "sd",
                              cond: {
                                $eq: ["$$sd.region._id", mongoose.Types.ObjectId(region_id)],
                              },
                            },
                          },
                        },
                      },
                    ],

                    // inside groupData array
                    ...[
                      {
                        $unwind: {
                          path: "$groupData",
                          preserveNullAndEmptyArrays: true,
                        },
                      },
                      {
                        $unwind: {
                          path: "$groupData.sets",
                          preserveNullAndEmptyArrays: true,
                        },
                      },
                      // { $sort: { "groupData.sets.priority": 1 } },
                      {
                        $lookup: {
                          from: "packages",
                          foreignField: "_id",
                          localField: "groupData.sets.package",
                          as: "groupData.sets.package",
                        },
                      },
                      {
                        $unwind: {
                          path: "$groupData.sets.package",
                          preserveNullAndEmptyArrays: true,
                        },
                      },

                      // *************************************************************************************************************
                      // Starting of code for populating Inner Product of Group Product
                      // *************************************************************************************************************
                      {
                        $lookup: {
                          from: "products",
                          let: { product_id: "$groupData.sets.product" },
                          pipeline: [
                            {
                              $match: {
                                $expr: { $eq: ["$$product_id", "$_id"] },
                              },
                            },
                            // For adding quantity keys
                            ...[
                              {
                                $lookup: {
                                  from: "inventory_items",
                                  let: { product_id: "$_id" },
                                  pipeline: [
                                    {
                                      $match: {
                                        $expr: {
                                          $and: [
                                            {
                                              $eq: ["$product_id", "$$product_id"],
                                            },
                                            {
                                              $eq: ["$region", mongoose.Types.ObjectId(region_id)],
                                            },
                                          ],
                                        },
                                      },
                                    },
                                    {
                                      $group: {
                                        _id: null,
                                        productQuantity: {
                                          $sum: "$productQuantity",
                                        },
                                        bookingQuantity: {
                                          $sum: "$bookingQuantity",
                                        },
                                        availableQuantity: {
                                          $sum: "$availableQuantity",
                                        },
                                        lostQuantity: { $sum: "$lostQuantity" },
                                        returnQuantity: {
                                          $sum: "$returnQuantity",
                                        },
                                        inhouseQuantity: {
                                          $sum: "$inhouseQuantity",
                                        },
                                      },
                                    },
                                    { $project: { _id: 0 } },
                                  ],
                                  as: "inventories",
                                },
                              },
                              {
                                $unwind: {
                                  path: "$inventories",
                                  preserveNullAndEmptyArrays: true,
                                },
                              },
                              {
                                $addFields: {
                                  productQuantity: {
                                    $ifNull: [
                                      {
                                        $toDouble: "$inventories.productQuantity",
                                      },
                                      0,
                                    ],
                                  },
                                  bookingQuantity: {
                                    $ifNull: [
                                      {
                                        $toDouble: "$inventories.bookingQuantity",
                                      },
                                      0,
                                    ],
                                  },
                                  availableQuantity: {
                                    $ifNull: [
                                      {
                                        $toDouble: "$inventories.availableQuantity",
                                      },
                                      0,
                                    ],
                                  },
                                  lostQuantity: {
                                    $ifNull: [
                                      {
                                        $toDouble: "$inventories.lostQuantity",
                                      },
                                      0,
                                    ],
                                  },
                                  returnQuantity: {
                                    $ifNull: [
                                      {
                                        $toDouble: "$inventories.returnQuantity",
                                      },
                                      0,
                                    ],
                                  },
                                  inhouseQuantity: {
                                    $ifNull: [
                                      {
                                        $toDouble: "$inventories.inhouseQuantity",
                                      },
                                      0,
                                    ],
                                  },
                                },
                              },
                              {
                                $addFields: {
                                  outOfStock: {
                                    $cond: [{ $eq: ["$TypeOfProduct", "simple"] }, { $lte: ["$availableQuantity", 0] }, false],
                                  },
                                },
                              },
                            ],

                            {
                              $addFields: {
                                simpleData: {
                                  $ifNull: ["$simpleData", []],
                                },
                                configurableData: {
                                  $ifNull: ["$configurableData", []],
                                },
                                groupData: {
                                  $ifNull: ["$groupData", []],
                                },
                              },
                            },

                            // inside simpleData array
                            ...[
                              {
                                $unwind: {
                                  path: "$simpleData",
                                  preserveNullAndEmptyArrays: true,
                                },
                              },
                              {
                                $lookup: {
                                  from: "packages",
                                  foreignField: "_id",
                                  localField: "simpleData.package",
                                  as: "simpleData.package",
                                },
                              },
                              {
                                $addFields: {
                                  "simpleData.availableQuantity": "$availableQuantity",
                                },
                              },
                              {
                                $group: {
                                  _id: "$_id",
                                  product_name: { $first: "$product_name" },
                                  images: { $first: "$images" },
                                  simpleData: { $push: "$simpleData" },
                                  configurableData: {
                                    $first: "$configurableData",
                                  },
                                  groupData: { $first: "$groupData" },
                                  base_price: { $first: "$base_price" },
                                  slug: { $first: "$slug" },
                                  TypeOfProduct: { $first: "$TypeOfProduct" },
                                  outOfStock: { $first: "$outOfStock" },
                                  availableQuantity: {
                                    $first: "$availableQuantity",
                                  },
                                  productSubscription: {
                                    $first: "$productSubscription",
                                  },
                                  preOrder: { $first: "$preOrder" },
                                  preOrderQty: { $first: "$preOrderQty" },
                                  preOrderBookQty: {
                                    $first: "$preOrderBookQty",
                                  },
                                  preOrderRemainQty: {
                                    $first: "$preOrderRemainQty",
                                  },
                                  preOrderStartDate: {
                                    $first: "$preOrderStartDate",
                                  },
                                  preOrderEndDate: {
                                    $first: "$preOrderEndDate",
                                  },
                                  sameDayDelivery: {
                                    $first: "$sameDayDelivery",
                                  },
                                  farmPickup: { $first: "$farmPickup" },
                                  priority: { $first: "$priority" },
                                  status: { $first: "$status" },
                                  showstatus: { $first: "$showstatus" },
                                  ratings: { $first: "$ratings" },
                                  ratingsCount: { $first: "$ratingsCount" },
                                  reviews: { $first: "$reviews" },
                                  reviewsCount: { $first: "$reviewsCount" },
                                  unitMeasurement: {
                                    $first: "$unitMeasurement",
                                  },
                                  salesTaxOutSide: {
                                    $first: "$salesTaxOutSide",
                                  },
                                  salesTaxWithIn: { $first: "$salesTaxWithIn" },
                                  purchaseTax: { $first: "$purchaseTax" },
                                  product_categories: {
                                    $first: "$product_categories",
                                  },
                                },
                              },
                              {
                                $addFields: {
                                  simpleData: {
                                    $filter: {
                                      input: "$simpleData",
                                      as: "sd",
                                      cond: {
                                        $eq: [{ $toString: "$$sd.region" }, { $toString: region_id }],
                                      },
                                    },
                                  },
                                },
                              },
                              {
                                $addFields: {
                                  soldInRegion: {
                                    $cond: [{ $gt: [{ $size: "$simpleData" }, 0] }, true, false],
                                    // $size: "$simpleData",
                                  },
                                },
                              },
                            ],

                            // For populating other small keys
                            ...[
                              {
                                $lookup: {
                                  from: "unit_measurements",
                                  localField: "unitMeasurement",
                                  foreignField: "_id",
                                  as: "unitMeasurement",
                                },
                              },
                              {
                                $unwind: {
                                  path: "$unitMeasurement",
                                  preserveNullAndEmptyArrays: true,
                                },
                              },

                              {
                                $lookup: {
                                  from: "taxs",
                                  localField: "salesTaxOutSide",
                                  foreignField: "_id",
                                  as: "salesTaxOutSide",
                                },
                              },
                              {
                                $unwind: {
                                  path: "$salesTaxOutSide",
                                  preserveNullAndEmptyArrays: true,
                                },
                              },

                              {
                                $lookup: {
                                  from: "taxs",
                                  localField: "salesTaxWithIn",
                                  foreignField: "_id",
                                  as: "salesTaxWithIn",
                                },
                              },
                              {
                                $unwind: {
                                  path: "$salesTaxWithIn",
                                  preserveNullAndEmptyArrays: true,
                                },
                              },

                              {
                                $lookup: {
                                  from: "taxs",
                                  localField: "purchaseTax",
                                  foreignField: "_id",
                                  as: "purchaseTax",
                                },
                              },
                              {
                                $unwind: {
                                  path: "$purchaseTax",
                                  preserveNullAndEmptyArrays: true,
                                },
                              },
                            ],
                          ],
                          as: "groupData.sets.product",
                        },
                      },
                      {
                        $unwind: {
                          path: "$groupData.sets.product",
                          preserveNullAndEmptyArrays: true,
                        },
                      },
                      // *************************************************************************************************************
                      // Ending of code for populating Inner Product of Group Product
                      // *************************************************************************************************************
                      // { $sort: { "groupData.sets.priority": 1, "groupData.sets.product.product_name": 1 } },
                      {
                        $group: {
                          _id: "$_id",
                          product_name: { $first: "$product_name" },
                          images: { $first: "$images" },
                          simpleData: { $first: "$simpleData" },
                          configurableData: { $first: "$configurableData" },
                          groupData: { $push: "$groupData" },
                          base_price: { $first: "$base_price" },
                          slug: { $first: "$slug" },
                          TypeOfProduct: { $first: "$TypeOfProduct" },
                          outOfStock: { $first: "$outOfStock" },
                          availableQuantity: { $first: "$availableQuantity" },
                          productSubscription: {
                            $first: "$productSubscription",
                          },
                          preOrder: { $first: "$preOrder" },
                          preOrderQty: { $first: "$preOrderQty" },
                          preOrderBookQty: { $first: "$preOrderBookQty" },
                          preOrderRemainQty: { $first: "$preOrderRemainQty" },
                          preOrderStartDate: { $first: "$preOrderStartDate" },
                          preOrderEndDate: { $first: "$preOrderEndDate" },
                          sameDayDelivery: { $first: "$sameDayDelivery" },
                          farmPickup: { $first: "$farmPickup" },
                          priority: { $first: "$priority" },
                          status: { $first: "$status" },
                          showstatus: { $first: "$showstatus" },
                          ratings: { $first: "$ratings" },
                          ratingsCount: { $first: "$ratingsCount" },
                          reviews: { $first: "$reviews" },
                          reviewsCount: { $first: "$reviewsCount" },
                          unitMeasurement: { $first: "$unitMeasurement" },
                          salesTaxOutSide: { $first: "$salesTaxOutSide" },
                          salesTaxWithIn: { $first: "$salesTaxWithIn" },
                          purchaseTax: { $first: "$purchaseTax" },
                          product_categories: { $first: "$product_categories" },
                        },
                      },

                      // For grouping groupData.sets and
                      // For sorting inner products inside group products based on priorities
                      {
                        $addFields: {
                          groupData: {
                            $function: {
                              body: function (groupData) {
                                let new_groupData = [];
                                for (let gd of groupData) {
                                  if (gd.name) {
                                    let found = false;
                                    for (let new_gd of new_groupData) {
                                      if (new_gd._id.toString() === gd._id.toString() && new_gd.name === gd.name) {
                                        found = new_gd;
                                      }
                                    }
                                    if (found) {
                                      found.sets.push(gd.sets);
                                    } else {
                                      gd.sets = [gd.sets];
                                      new_groupData.push(gd);
                                    }
                                  }
                                }

                                for (const gd of new_groupData) {
                                  for (const set of gd.sets) {
                                    if (set.priority === null) {
                                      set.priority = Infinity;
                                    }
                                  }
                                  gd.sets.sort((a, b) => a.priority - b.priority);
                                }

                                return new_groupData;
                              },
                              args: ["$groupData"],
                              lang: "js",
                            },
                          },
                        },
                      },
                    ],
                  ],

                  // For populating other small keys
                  ...[
                    {
                      $lookup: {
                        from: "unit_measurements",
                        localField: "unitMeasurement",
                        foreignField: "_id",
                        as: "unitMeasurement",
                      },
                    },
                    {
                      $unwind: {
                        path: "$unitMeasurement",
                        preserveNullAndEmptyArrays: true,
                      },
                    },

                    {
                      $lookup: {
                        from: "taxs",
                        localField: "salesTaxOutSide",
                        foreignField: "_id",
                        as: "salesTaxOutSide",
                      },
                    },
                    {
                      $unwind: {
                        path: "$salesTaxOutSide",
                        preserveNullAndEmptyArrays: true,
                      },
                    },

                    {
                      $lookup: {
                        from: "taxs",
                        localField: "salesTaxWithIn",
                        foreignField: "_id",
                        as: "salesTaxWithIn",
                      },
                    },
                    {
                      $unwind: {
                        path: "$salesTaxWithIn",
                        preserveNullAndEmptyArrays: true,
                      },
                    },

                    {
                      $lookup: {
                        from: "taxs",
                        localField: "purchaseTax",
                        foreignField: "_id",
                        as: "purchaseTax",
                      },
                    },
                    {
                      $unwind: {
                        path: "$purchaseTax",
                        preserveNullAndEmptyArrays: true,
                      },
                    },
                  ],

                  // sorting on priority
                  //{ $sort: { priority: 1, product_name: 1 } },
                ],
              },
            },
          ]).option({ serializeFunctions: true });

          if (data) {
            output.push(data[0].docs[0]);
          }
          i++;
        }

        console.log(output, "outputoutputoutput");
        var filtered = output.filter(function (el) {
          return el != null;
        });
        res.status(200).json({
          message: "ok",
          data: filtered,
          code: 1,
        });
      }
    } else {
      res.status(200).json({ message: "ok ttttttttttt", data: "", code: 1 });
    }
  }
};
module.exports.TopTenProductsOfUserForAdmin = function (req, res) {
  var user_id = req.body.user_id;
  var region_id = req.body.RegionId;

  // if (region_id == "" || !region_id || region_id == undefined || region_id == null) {
  //     common.formValidate("RegionId", res);
  //     return false;
  // }

  bookingDataBase
    .aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(user_id) } },
      { $sort: { createDate: -1 } },
      { $limit: 50 },
      { $unwind: { path: "$bookingdetail" } },
      {
        $group: {
          _id: "$bookingdetail.product_id._id",
          timesPurchased: { $sum: 1 },
          quantityPurchased: { $sum: "$bookingdetail.qty" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $match: {
          product: { $ne: [] },
        },
      },
      { $unwind: "$product" },
      { $sort: { timesPurchased: -1, quantityPurchased: -1 } },
    ])
    .exec(function (err, array2) {
      return res.json({
        code: 1,
        data: array2,
        message: "ok",
      });
    });
};

module.exports.TopTenBestSellerProducts = function (req, res) {
  bookingDataBase
    .aggregate([
      {
        $unwind: {
          path: "$bookingdetail",
        },
      },

      {
        $group: {
          _id: "$bookingdetail.product_id._id", // This is the selector for the grouping process (in our case it's the id)
          product_id: { $first: "$bookingdetail.product_id._id" },
          NoOfSaleofProduct: { $sum: 1 }, // this is me thinking you'll want access to the item in question for each total.
          // totalCount: { $sum: "$bookingdetail.product_id.count" }, // adds to totalCount EACH $products.count that we have
          //totalPrice: { $sum: { $multiply: ["$bookingdetail.price", '$products.count'] } }, // self explanatory
        },
      },
      {
        $sort: { NoOfSaleofProduct: -1 },
      },
      {
        $lookup: {
          from: "products",
          localField: "product_id",
          foreignField: "_id",
          as: "productDetail",
        },
      },
      {
        $match: {
          productDetail: { $ne: [] },
        },
      },
      { $unwind: "$productDetail" },
      {
        $lookup: {
          from: "unit_measurements",
          localField: "productDetail.unitMeasurement",
          foreignField: "_id",
          as: "productDetail.unitMeasurement",
        },
      },
      { $unwind: "$productDetail.unitMeasurement" },
      {
        $project: {
          _id: 1,
          productDetail: "$productDetail",
          NoOfSaleofProduct: 1,
        },
      },
      { $limit: 10 },
    ])
    .exec(function (err, array2) {
      if (array2 != null) {
        res.status(200).json({
          message: "ok",
          data: array2,
          code: 1,
        });
        // });
      } else {
        res.status(200).json({ message: "ok", data: "", code: 1 });
      }
    });
};
//top 5 best seller category
module.exports.TopFiveBestSellerCategory = function (req, res) {
  bookingDataBase
    .aggregate([
      {
        $unwind: {
          path: "$bookingdetail",
        },
      },
      {
        $unwind: {
          path: "$bookingdetail.product_categories",
        },
      },
      {
        $group: {
          _id: "$bookingdetail.product_categories._id",
          NoOfCat: { $sum: 1 },
          NoOfSale: { $sum: { $toDouble: "$bookingdetail.qty" } },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $match: {
          category: { $ne: [] },
        },
      },
      { $sort: { NoOfCat: -1 } },
      { $limit: 5 },
    ])
    .exec(function (err, array2) {
      if (array2 != null) {
        // console.log(":::::::::::::::::: array2", array2)

        // var numArray = array2;
        // numArray.sort(function (a, b) {
        //   return b.NoOfCat - a.NoOfCat;
        // });

        // const n = 5; //get the first 5 items

        // const newArray = numArray.slice(0, n);

        // var DataArray = [];
        // for (var i = 0; i < newArray.length; i++) {
        //   DataArray.push(newArray[i].product_cat_id);
        // }
        // CatDataBase.find({ _id: DataArray })
        //   .exec()
        //   .then((Data) => {
        //     if (err) {
        //       res.status(500).json(err);
        //     } else if (!array2) {
        //       res.status(400).json({
        //         message: "error",
        //         data: "",
        //         code: 0,
        //       });
        //     }

        //     const obj = {
        //       part1: array2,
        //       part2: Data,
        //     };
        //     const mergeObject = (obj = {}) => {
        //       let result = [];
        //       result = Object.keys(obj).reduce(
        //         (function (hash) {
        //           return function (r, k) {
        //             obj[k].forEach(function (o) {
        //               if (!hash[o._id]) {
        //                 hash[o._id] = {};
        //                 r.push(hash[o._id]);
        //               }
        //               Object.keys(o).forEach(function (l) {
        //                 hash[o._id][l] = o[l];
        //               });
        //             });
        //             return r;
        //           };
        //         })(Object.create(null)),
        //         []
        //       );
        //       return result;
        //     };

        //     var result = mergeObject(obj);

        //     var JsonData = [];
        //     for (var i = 0; i < result.length; i++) {
        //       JsonData.push({
        //         CatDetail: result[i]._doc,
        //         //"NoOfCat"   : result[i].NoOfCat,
        //       });
        //     }

        res.status(200).json({
          message: "ok",
          data: array2,
          code: 1,
        });
        // });
      } else {
        res.status(200).json({ message: "ok", data: "", code: 1 });
      }
    });
};

function genrateReport(res, name, reportType, fileName, startDate, endDate) {
  table.create(
    {
      name: name,
      reportType: reportType,
      fileName: fileName,
      startDate: startDate,
      endDate: endDate,
    },
    function (err, data) {
      if (err) {
        res.status(400).json(err);
      } else {
        res.status(201).json({ message: "ok", data: data, code: 1 });
      }
    }
  );
}

//all type csv genration


// module.exports.CSVReportGenrate = async function (req, res) {
//   try {
//     // console.log(req.body);
//     var startDateTime = req.body.startDateTime;
//     var endDateTime = req.body.endDateTime;
//     var reportType = req.body.reportType;
//     // var todayDate = new Date();

//     var start_date_time = new Date(`${startDateTime.split(" ")[0]}T${startDateTime.split(" ")[1]}:00.000Z`);
//     var end_date_time = new Date(`${endDateTime.split(" ")[0]}T${endDateTime.split(" ")[1]}:00.000Z`);
//     if (reportType != "RemainQuantityReport") {
//       if (startDateTime == "" || !startDateTime || startDateTime == undefined || startDateTime == null) {
//         common.formValidate("startDateTime", res);
//         return false;
//       }
//       if (endDateTime == "" || !endDateTime || endDateTime == undefined || endDateTime == null) {
//         common.formValidate("endDateTime", res);
//         return false;
//       }
//     }

//     if (reportType == "" || !reportType || reportType == undefined || reportType == null) {
//       common.formValidate("reportType", res);
//       return false;
//     }

//     if (reportType == "CustomerDataReport") {
//       var date = new Date(endDateTime);
//       date.setDate(date.getDate() + 1);
//       bookingDataBase
//         .aggregate(
//           [
//             {
//               $match: {
//                 createDate: {
//                   $gte: new Date(startDateTime),
//                   $lte: new Date(endDateTime),
//                 },
//                 BookingStatusByAdmin: { $ne: "Failed" },
//               },
//             },

//             {
//               $group: {
//                 //_id: "$user_id",
//                 _id: {
//                   user_id: "$user_id",
//                   userName: "$userName",
//                   userEmail: "$userEmail",
//                   userMobile: "$userMobile",
//                   userType: "$userType",
//                 },
//                 details: { $push: "$$ROOT" },
//                 TotalOrder: { $sum: 1 },
//                 TotalAmount: { $sum: "$total_payment" },
//               },
//             },
//             {
//               $lookup: {
//                 from: "users",
//                 localField: "_id",
//                 foreignField: "user_id",
//                 as: "userData",
//               },
//             },
//           ],
//           { allowDiskUse: true }
//         )
//         .exec(function (err, array2) {
//           if (err) {
//             res.status(500).json(err);
//           } else if (!array2) {
//             res.status(400).json({
//               message: "error",
//               data: "",
//               code: 0,
//             });
//           }
//           var t = Math.random();
//           var FileName = "Customer_Data";
//           var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
//           var report = file_Name + ".csv";

//           const csvWriter = createCsvWriter({
//             path: "./public/reports/" + file_Name + ".csv",
//             header: [
//               {
//                 id: "CustomerName",
//                 title: "Customer Name",
//               },
//               {
//                 id: "CustomerPhone",
//                 title: "Customer Phone",
//               },
//               // {
//               //   id: "creditLimit",
//               //   title: "Credit Limit",
//               // },
//               // {
//               //   id: "creditUsed",
//               //   title: "Credit Used",
//               // },
//               {
//                 id: "CustomerEmail",
//                 title: "Customer Email",
//               },
//               {
//                 id: "CustomerTpye",
//                 title: "Customer Type",
//               },
//               {
//                 id: "LastTransaction",
//                 title: "Last Transaction",
//               },
//               {
//                 id: "LastTransactionSource",
//                 title: "Last Transaction Source",
//               },
//               {
//                 id: "LastTransactionDays",
//                 title: "Last Transaction Days",
//               },
//               { id: "LastAddress", title: "Last Address" },
//               {
//                 id: "TotalOrders",
//                 title: "Total Orders",
//               },
//               { id: "Revenue", title: "Revenue" },
//               {
//                 id: "AverageBasketSize",
//                 title: "Average Basket Size",
//               },
//             ],
//           });
//           var result;
//           if (req.body?.customer_type) {
//             result = array2.filter((cur) => cur._id.userType == req.body?.customer_type);
//           } else {
//             result = array2;
//           }
//           //  console.log(result);
//           var jsonData = [];
//           for (var i = 0; i < result.length; i++) {
//             if (!result[i].details) {
//               var totalOrder = null;
//               var TotalAmount = null;
//               var LastTransactionDate = null;
//               var LastTransactionSource = null;
//               var LastTransactionDays = null;
//               var LastAddress = null;
//               var TotalOrders = null;
//               var Revenue = null;
//               var AverageBasketSize1 = null;
//               var LOrderAddress = null;
//             } else {
//               var LastOrderDate = result[i].details;
//               var lastOrderDate = LastOrderDate[LastOrderDate.length - 1];
//               var LastTransaction = lastOrderDate.createDate;
//               // var CustomerTpye = result[i].userType;

//               var LastDate1 = moment.utc(LastTransaction).tz("Asia/Kolkata");
//               var LastDate = LastDate1.format("MM/DD/YYYY");
//               var LastTransactionDate = LastDate1.format("MM/DD/YYYY HH:mm A");
//               var LastTransactionDateCol = LastDate1.format("DD-MM-YYYY");

//               var TodayDate = new Date();
//               var TodayDate = moment.utc(TodayDate).tz("Asia/Kolkata");
//               var TodayDate = TodayDate.format("MM/DD/YYYY");
//               var date_diff_indays = function (date1, date2) {
//                 dt1 = new Date(date1);
//                 dt2 = new Date(date2);
//                 return Math.floor(
//                   (Date.UTC(dt2.getFullYear(), dt2.getMonth(), dt2.getDate()) - Date.UTC(dt1.getFullYear(), dt1.getMonth(), dt1.getDate())) /
//                     (1000 * 60 * 60 * 24)
//                 );
//               };
//               var LastTransactionDays = date_diff_indays(LastDate, TodayDate);

//               var ab = result[i].TotalAmount / result[i].TotalOrder;
//               var bc = result[i].TotalAmount;
//               var LastTransactionSource = lastOrderDate.paymentmethod;
//               var TotalOrders = result[i].TotalOrder;
//               var TotalAmount = bc.toFixed(1);
//               var AverageBasketSize1 = ab.toFixed(1);
//               var LOrderAddress = lastOrderDate.booking_address.locality;
//             }
//             jsonData.push({
//               CustomerName: result[i]._id.userName,
//               CustomerPhone: result[i]._id.userMobile,
//               CustomerEmail: result[i]._id.userEmail,
//               CustomerTpye: result[i]._id.userType,
//               // creditLimit: result[i]._id.creditLimit,
//               // creditUsed: result[i]._id.creditUsed,
//               LastTransaction: LastTransactionDateCol,
//               LastTransactionSource: LastTransactionSource,
//               LastTransactionDays: LastTransactionDays,
//               LastAddress: LOrderAddress,
//               TotalOrders: TotalOrders,
//               Revenue: TotalAmount,
//               AverageBasketSize: AverageBasketSize1,
//             });
//           }

//           csvWriter
//             .writeRecords(jsonData) // returns a promise
//             .then(() => {
//               console.log("...Done");
//             });
//           var name = "Customer Data Report";
//           var reportType = "CustomerDataReport";
//           var fileName = report;
//           var startDate = startDateTime;
//           var endDate = endDateTime;
//           genrateReport(res, name, reportType, fileName, startDate, endDate);
//           // res
//           //     .status(200)
//           //     .json({"message":'ok',"data":report,"code":0});
//           //     return;
//         });
//     }
//     if (reportType == "ItemSalesDataWithRevenueReport") {
//       bookingDataBase
//         .aggregate([
//           {
//             $match: {
//               BookingStatusByAdmin: {
//                 $in: ["Accepted", "Out For Delivery", "Delivered"],
//               },
//               createDate: {
//                 $gte: new Date(startDateTime),
//                 $lte: new Date(endDateTime),
//               },
//             },
//           },
//           {
//             $unwind: {
//               path: "$bookingdetail",
//             },
//           },

//           {
//             $group: {
//               _id: "$bookingdetail.product_id._id", // This is the selector for the grouping process (in our case it's the id)
//               product_id: { $first: "$bookingdetail.product_id._id" },
//               NoOfSaleofProduct: {
//                 $sum: {
//                   $multiply: [
//                     { $toDouble: "$bookingdetail.qty" },
//                     {
//                       $cond: [
//                         { $eq: ["$bookingdetail.without_package", false] },
//                         { $toDouble: "$bookingdetail.packet_size" },
//                         { $toDouble: "$bookingdetail.unitQuantity" },
//                       ],
//                     },
//                   ],
//                 },
//               },

//               ValueSold: {
//                 $sum: {
//                   $cond: [
//                     {
//                       $gt: [
//                         {
//                           $toDouble: "$bookingdetail.itemDiscountAmountBeforeGST",
//                         },
//                         0,
//                       ],
//                     },
//                     { $toDouble: "$bookingdetail.itemDiscountAmountBeforeGST" },
//                     { $toDouble: "$bookingdetail.totalPriceBeforeGST" },
//                   ],
//                 },
//               }, // self explanatory
//             },
//           },
//           {
//             $sort: { NoOfSaleofProduct: -1 },
//           },
//           {
//             $lookup: {
//               from: "products",
//               localField: "product_id",
//               foreignField: "_id",
//               as: "productDetail",
//             },
//           },
//           {
//             $match: {
//               productDetail: { $ne: [] },
//             },
//           },
//           { $unwind: "$productDetail" },
//           {
//             $lookup: {
//               from: "unit_measurements",
//               localField: "productDetail.unitMeasurement",
//               foreignField: "_id",
//               as: "productDetail.unitMeasurement",
//             },
//           },
//           { $unwind: "$productDetail.unitMeasurement" },
//           {
//             $lookup: {
//               from: "categories",
//               localField: "productDetail.product_categories",
//               foreignField: "_id",
//               as: "productDetail.product_categories",
//             },
//           },
//           {
//             $project: {
//               _id: 1,
//               productDetail: "$productDetail",
//               NoOfSaleofProduct: 1,
//               ValueSold: 1,
//             },
//           },
//         ])
//         .exec(function (err, array2) {
//           if (err) {
//             res.status(500).json(err);
//           } else if (!array2) {
//             res.status(400).json({
//               message: "error",
//               data: "",
//               code: 0,
//             });
//           }
//           var t = Math.random();
//           var FileName = "Item Sales Data With Revenue";
//           var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
//           var report = file_Name + ".csv";

//           const csvWriter = createCsvWriter({
//             path: "./public/reports/" + file_Name + ".csv",
//             header: [
//               { id: "Category", title: "Category" },
//               {
//                 id: "ProductName",
//                 title: "Product Name",
//               },
//               {
//                 id: "ValueSold",
//                 title: "Value Sold",
//               },
//               {
//                 id: "QuantitySold",
//                 title: "Quantity Sold",
//               },
//               {
//                 id: "UnitMeasurement",
//                 title: "Unit Measurement",
//               },
//             ],
//           });
//           var result = array2;
//           var jsonData = [];
//           if (result) {
//             for (var i = 0; i < result.length; i++) {
//               if (result[i].productDetail.product_categories) {
//                 var product_categoriesArray = [];
//                 var product_categories = result[i].productDetail.product_categories;
//                 for (var i1 = 0; i1 < product_categories.length; i1++) {
//                   product_categoriesArray.push(product_categories[i1].category_name);
//                 }
//               }
//               jsonData.push({
//                 Category: product_categoriesArray || null,
//                 ProductName: result[i].productDetail.product_name,
//                 ValueSold: result[i].ValueSold.toFixed(3),
//                 QuantitySold: result[i].NoOfSaleofProduct,
//                 UnitMeasurement: result[i].productDetail.unitMeasurement ? result[i].productDetail.unitMeasurement.name : "",
//               });
//             }
//           } else {
//             jsonData.push({
//               Category: null,
//               ProductName: null,
//               ValueSold: null,
//               QuantitySold: null,
//             });
//           }

//           csvWriter
//             .writeRecords(jsonData) // returns a promise
//             .then(() => {
//               console.log("...Done");
//             });
//           var name = "Item Sales Data With Revenue Report";
//           var reportType = "ItemSalesDataWithRevenueReport";
//           var fileName = report;
//           var startDate = startDateTime;
//           var endDate = endDateTime;
//           genrateReport(res, name, reportType, fileName, startDate, endDate);
//           // res
//           //     .status(200)
//           //     .json({"message":'ok',"data":report,"code":0});
//           //     return;
//         });
//     }
//     if (reportType == "FirstTimeCustomerDataReport") {
//       var date = new Date(endDateTime);
//       date.setDate(date.getDate() + 1);
//       User.find({
//         //otp_verified: true,
//         NoOfOrder: 1,
//         created_at: {
//           $gte: new Date(startDateTime),
//           $lte: new Date(endDateTime),
//         },
//       })
//         .lean()
//         .exec(function (err, array1) {
//           var usersData = [];
//           for (var i = 0; i < array1.length; i++) {
//             usersData.push(array1[i]._id);
//           }
//           bookingDataBase
//             .aggregate([
//               { $match: { user_id: { $in: usersData } } },
//               {
//                 $group: {
//                   _id: "$user_id",
//                   details: { $push: "$$ROOT" },
//                   TotalOrder: { $sum: 1 },
//                   TotalAmount: { $sum: "$total_payment" },
//                 },
//               },
//             ])
//             .exec(function (err, array2) {
//               if (err) {
//                 res.status(500).json(err);
//               } else if (!array2) {
//                 res.status(400).json({
//                   message: "error",
//                   data: "",
//                   code: 0,
//                 });
//               }
//               var t = Math.random();
//               var FileName = "First_Time_Customer";
//               var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
//               var report = file_Name + ".csv";

//               const csvWriter = createCsvWriter({
//                 path: "./public/reports/" + file_Name + ".csv",
//                 header: [
//                   {
//                     id: "CustomerName",
//                     title: "Customer Name",
//                   },
//                   {
//                     id: "CustomerPhone",
//                     title: "Customer Phone",
//                   },
//                   {
//                     id: "CustomerEmail",
//                     title: "Customer Email",
//                   },
//                   {
//                     id: "LastTransaction",
//                     title: "Last Transaction Date",
//                   },
//                   {
//                     id: "LastTransactionSource",
//                     title: "Payment Method",
//                   },
//                   {
//                     id: "LastTransactionDays",
//                     title: "Last Transaction Days",
//                   },
//                   { id: "LastAddress", title: "Last Address" },
//                   {
//                     id: "TotalOrders",
//                     title: "Total Orders",
//                   },
//                   { id: "items", title: "items" },
//                   { id: "Revenue", title: "Revenue" },
//                   // {
//                   //     id: "AverageBasketSize",
//                   //     title: "Average Basket Size",
//                   // },
//                 ],
//               });
//               const obj = {
//                 part1: array1,
//                 part2: array2,
//               };
//               const mergeObject = (obj = {}) => {
//                 let result = [];
//                 result = Object.keys(obj).reduce(
//                   (function (hash) {
//                     return function (r, k) {
//                       obj[k].forEach(function (o) {
//                         if (!hash[o._id]) {
//                           hash[o._id] = {};
//                           r.push(hash[o._id]);
//                         }
//                         Object.keys(o).forEach(function (l) {
//                           hash[o._id][l] = o[l];
//                         });
//                       });
//                       return r;
//                     };
//                   })(Object.create(null)),
//                   []
//                 );
//                 return result;
//               };

//               var result = mergeObject(obj);

//               var jsonData = [];
//               for (var i = 0; i < result.length; i++) {
//                 if (!result[i].details) {
//                   var totalOrder = null;
//                   var TotalAmount = null;
//                   var LastTransactionDate = null;
//                   var LastTransactionSource = null;
//                   var LastTransactionDays = null;
//                   var LastAddress = null;
//                   var TotalOrders = null;
//                   var Revenue = null;
//                   var AverageBasketSize = null;
//                   var LOrderAddress = null;
//                   var items = null;
//                 } else {
//                   var LastOrderDate = result[i].details;
//                   var lastOrderDate = LastOrderDate[LastOrderDate.length - 1];
//                   var LastTransaction = lastOrderDate.createDate;

//                   var LastDate1 = moment.utc(LastTransaction).tz("Asia/Kolkata");
//                   var LastDate = LastDate1.format("MM/DD/YYYY");
//                   var LastTransactionDate = LastDate1.format("MM/DD/YYYY HH:mm A");
//                   var LastTransactionDateShow = LastDate1.format("DD-MM-YYYY");

//                   var TodayDate = new Date();
//                   var TodayDate = moment.utc(TodayDate).tz("Asia/Kolkata");
//                   var TodayDate = TodayDate.format("MM/DD/YYYY");
//                   var date_diff_indays = function (date1, date2) {
//                     dt1 = new Date(date1);
//                     dt2 = new Date(date2);
//                     return Math.floor(
//                       (Date.UTC(dt2.getFullYear(), dt2.getMonth(), dt2.getDate()) - Date.UTC(dt1.getFullYear(), dt1.getMonth(), dt1.getDate())) /
//                         (1000 * 60 * 60 * 24)
//                     );
//                   };
//                   var LastTransactionDays = date_diff_indays(LastDate, TodayDate);

//                   var LastTransactionSource = lastOrderDate.paymentmethod;
//                   var TotalOrders = result[i].TotalOrder;
//                   var TotalAmount = result[i].TotalAmount;
//                   var LOrderAddress = lastOrderDate.booking_address.address;

//                   var itemFor = result[i].details;
//                   for (var i2 = 0; i2 < itemFor.length; i2++) {
//                     var BookingDetail = itemFor[i2].bookingdetail;
//                     var itemsArray = [];
//                     // for (var i3 = 0; i3 < bookingDetail.length; i3++) {
//                     //     var ItemQuantity;
//                     //     if (bookingDetail[i3].without_package == false) {
//                     //         ItemQuantity = bookingDetail[i3].packetLabel + " - " + bookingDetail[i3].qty;
//                     //     } else {
//                     //         ItemQuantity = bookingDetail[i3].unitQuantity + "" + bookingDetail[i3].unitMeasurement + " - " + bookingDetail[i3].qty;
//                     //     }

//                     //     itemsArray.push(bookingDetail[i3].product_name + " " + ItemQuantity);
//                     // }
//                     for (var z = 0; z < BookingDetail.length; z++) {
//                       var BookingDetailZ = BookingDetail[z];
//                       if (BookingDetailZ.TypeOfProduct == "group") {
//                         for (let j = 0; j < BookingDetailZ.groupData.length; j++) {
//                           let set = BookingDetailZ.groupData[j];
//                           let setQty = 0;
//                           for (let k = 0; k < set.sets.length; k++) {
//                             let product_name = set.sets[k].product.product_name;
//                             var ItemQuantity =
//                               (set.sets[k].package
//                                 ? set.sets[k].package.packetLabel
//                                 : set.sets[k].unitQuantity + " " + BookingDetailZ.unitMeasurement) *
//                               (set.sets[k].qty * BookingDetailZ.qty);
//                             itemsArray.push(product_name + " " + ItemQuantity);
//                           }
//                         }
//                       } else {
//                         var product_name = BookingDetailZ.product_name;
//                         var ItemQuantity =
//                           (BookingDetailZ.without_package
//                             ? BookingDetailZ.unitQuantity + " " + BookingDetailZ.unitMeasurement
//                             : BookingDetailZ.packetLabel) +
//                           " - " +
//                           BookingDetailZ.qty;
//                         itemsArray.push(product_name + " " + ItemQuantity);
//                       }
//                     }
//                   }
//                 }
//                 jsonData.push({
//                   CustomerName: result[i].name,
//                   CustomerPhone: result[i].contactNumber,
//                   CustomerEmail: result[i].email,
//                   LastTransaction: LastTransactionDateShow,
//                   LastTransactionSource: LastTransactionSource,
//                   LastTransactionDays: LastTransactionDays,
//                   LastAddress: LOrderAddress,
//                   TotalOrders: TotalOrders,
//                   items: itemsArray,
//                   Revenue: TotalAmount,
//                   //AverageBasketSize: AverageBasketSize,
//                 });
//               }

//               csvWriter
//                 .writeRecords(jsonData) // returns a promise
//                 .then(() => {
//                   console.log("...Done");
//                 });
//               //var report = t + ".csv";

//               var name = "First Time Customer Data Report";
//               var reportType = "FirstTimeCustomerDataReport";
//               var fileName = report;
//               var startDate = startDateTime;
//               var endDate = endDateTime;
//               genrateReport(res, name, reportType, fileName, startDate, endDate);
//               // res
//               //     .status(200)
//               //     .json({"message":'ok',"data":report,"code":0});
//               //     return;
//             });
//         });
//     } else if (reportType == "Inventorylist") {
//       var date = new Date(endDateTime);
//       date.setDate(date.getDate() + 1);
//       var data = await inventoryItemTable.aggregate([
//         {
//           $match: {
//             created_at: {
//               $gte: new Date(startDateTime),
//               $lt: new Date(endDateTime),
//             },
//           },
//         },
//         {
//           $lookup: {
//             from: "products",
//             localField: "product_id",
//             foreignField: "_id",
//             as: "product_id",
//           },
//         },
//         { $unwind: "$product_id" },
//         {
//           $lookup: {
//             from: "categories",
//             localField: "product_id.product_categories",
//             foreignField: "_id",
//             as: "product_categories",
//           },
//         },
//         {
//           $group: {
//             _id: { product_name: "$product_name" },
//             product_measurment: { $first: "$product_measurment" },
//             product_categories: { $first: "$product_categories" },
//             product_name: { $first: "$product_name" },
//             productQuantity: { $sum: "$productQuantity" },
//             bookingQuantity: { $sum: "$bookingQuantity" },
//             availableQuantity: { $sum: "$availableQuantity" },
//             lostQuantity: { $sum: "$lostQuantity" },
//             returnQuantity: { $sum: "$returnQuantity" },
//             inhouseQuantity: { $sum: "$inhouseQuantity" },
//             averageCost: { $sum: "$product_costPrice" },
//             totalCost: { $sum: "$itemTotalPrice" },
//           },
//         },
//       ]);
//       if (data) {
//         var t = Math.random();
//         var FileName = "Inventory";
//         var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
//         var report = file_Name + ".csv";

//         const csvWriter = createCsvWriter({
//           path: "./public/reports/" + file_Name + ".csv",
//           header: [
//             { id: "category", title: "category" },
//             { id: "ProductName", title: "Product Name" },
//             { id: "unitMeasurement", title: "Product Measurement" },
//             { id: "productQuantity", title: "Purchased Quantity" },
//             { id: "AvailableQuantity", title: "Available Quantity" },
//             { id: "BookingQuantity", title: "Booked Quantity" },
//             { id: "inhouseQuantity", title: "Inhouse Quantity" },
//             { id: "lostQuantity", title: "Lost Quantity" },
//             { id: "returnQuantity", title: "Return Quantity" },
//             { id: "averageCost", title: "Average Cost Price" },
//             { id: "totalCost", title: "Total Cost Price" },
//           ],
//         });
//         var jsonData = [];
//         for (var i = 0; i < data.length; i++) {
//           var iData = data[i];
//           if (iData.product_categories) {
//             var product_categoriesArray = [];
//             var product_categories = iData.product_categories;
//             for (var i1 = 0; i1 < product_categories.length; i1++) {
//               product_categoriesArray.push(product_categories[i1].category_name);
//             }
//           }
//           var cost = iData.totalCost ? iData.totalCost.toFixed(2) / iData.productQuantity : 0;
//           jsonData.push({
//             category: product_categoriesArray,
//             ProductName: iData.product_name,
//             unitMeasurement: iData.product_measurment,
//             productQuantity: iData.productQuantity,
//             AvailableQuantity: iData.availableQuantity,
//             BookingQuantity: iData.bookingQuantity,
//             inhouseQuantity: iData.inhouseQuantity,
//             lostQuantity: iData.lostQuantity,
//             returnQuantity: iData.returnQuantity,
//             averageCost: cost.toFixed(2),
//             totalCost: iData.totalCost ? iData.totalCost.toFixed(2) : 0,
//           });
//         }
//         if (jsonData.length > 0) {
//           //sorting of json data
//           function dynamicSort(property) {
//             var sortOrder = 1;

//             if (property[0] === "-") {
//               sortOrder = -1;
//               property = property.substr(1);
//             }

//             return function (a, b) {
//               if (sortOrder == -1) {
//                 return b[property].localeCompare(a[property]);
//               } else {
//                 return a[property].localeCompare(b[property]);
//               }
//             };
//           }
//           var finalData = jsonData.sort(dynamicSort("ProductName"));
//           //end of sorting function
//         } else {
//           var finalData = [];
//         }

//         csvWriter
//           .writeRecords(finalData) // returns a promise
//           .then(() => {
//             console.log("...Done");
//           });
//         //var report = t + ".csv";
//         var name = "Inventory list";
//         var reportType = "Inventorylist";
//         var fileName = report;
//         var startDate = startDateTime;
//         var endDate = endDateTime;
//         genrateReport(res, name, reportType, fileName, startDate, endDate);
//       }
//     } else if (reportType == "RemainQuantityReport") {
//       var data = await inventoryItemTable.aggregate([
//         {
//           $lookup: {
//             from: "regions",
//             localField: "region",
//             foreignField: "_id",
//             as: "region",
//           },
//         },
//         { $unwind: "$region" },
//         {
//           $lookup: {
//             from: "products",
//             localField: "product_id",
//             foreignField: "_id",
//             as: "product_id",
//           },
//         },
//         { $unwind: "$product_id" },
//         {
//           $lookup: {
//             from: "categories",
//             localField: "product_id.product_categories",
//             foreignField: "_id",
//             as: "product_categories",
//           },
//         },
//         {
//           $group: {
//             _id: { product_id: "$product_id", region: "$region" },
//             product_measurment: { $first: "$product_measurment" },
//             product_categories: { $first: "$product_categories" },
//             product_name: { $first: "$product_name" },
//             region: { $first: "$region" },

//             productQuantity: { $sum: "$productQuantity" },
//             availableQuantity: { $sum: "$availableQuantity" },
//             bookingQuantity: { $sum: "$bookingQuantity" },
//             inhouseQuantity: { $sum: "$inhouseQuantity" },
//             returnQuantity: { $sum: "$returnQuantity" },
//             lostQuantity: { $sum: "$lostQuantity" },
//           },
//         },
//       ]);
//       if (data) {
//         var t = Math.random();
//         var FileName = "Available_Quantity_Report";
//         // var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
//         var file_Name = FileName + " (" + moment(new Date()).format("DD-MM-YYYY hh:mm a") + ")";
//         var report = file_Name + ".csv";

//         const csvWriter = createCsvWriter({
//           path: "./public/reports/" + file_Name + ".csv",
//           header: [
//             { id: "Category", title: "Category" },
//             { id: "ProductName", title: "Product Name" },
//             { id: "Region", title: "Region" },
//             { id: "TotalQuantity", title: "Total Quantity" },
//             { id: "ProductMeasurment", title: "Product Measurment" },
//             { id: "AvailableQuantity", title: "Available Quantity" },
//             { id: "bookingQuantity", title: "Sold Quantity" },
//             { id: "inhouseQuantity", title: "Inhouse Quantity" },
//             { id: "returnQuantity", title: "Return Quantity" },
//             { id: "lostQuantity", title: "Lost Quantity" },
//           ],
//         });
//         var jsonData = [];
//         for (var i = 0; i < data.length; i++) {
//           var iData = data[i];
//           if (iData.product_categories) {
//             var product_categoriesArray = [];
//             var product_categories = iData.product_categories;
//             for (var i1 = 0; i1 < product_categories.length; i1++) {
//               product_categoriesArray.push(product_categories[i1].category_name);
//             }
//           }

//           jsonData.push({
//             Category: product_categoriesArray,
//             ProductName: iData.product_name,
//             Region: iData.region.name,
//             TotalQuantity: iData.productQuantity,
//             ProductMeasurment: iData.product_measurment,
//             AvailableQuantity: iData.availableQuantity,
//             bookingQuantity: iData.bookingQuantity,
//             inhouseQuantity: iData.inhouseQuantity,
//             lostQuantity: iData.lostQuantity,
//             returnQuantity: iData.returnQuantity,
//           });
//         }
//         if (jsonData.length > 0) {
//           //sorting of json data
//           function dynamicSort(property) {
//             var sortOrder = 1;

//             if (property[0] === "-") {
//               sortOrder = -1;
//               property = property.substr(1);
//             }

//             return function (a, b) {
//               if (sortOrder == -1) {
//                 return b[property].localeCompare(a[property]);
//               } else {
//                 return a[property].localeCompare(b[property]);
//               }
//             };
//           }
//           var finalData = jsonData.sort(dynamicSort("ProductName"));
//           //end of sorting function
//           //sum values, and merge object values ​with the same id into a new array star
//         } else {
//           var finalData = [];
//         }

//         csvWriter
//           .writeRecords(finalData) // returns a promise
//           .then(() => {
//             console.log("...Done");
//           });
//         //var report = t + ".csv";
//         var name = "Available Quantity list";
//         var reportType = "AvailableQuantitylist";
//         var fileName = report;
//         var startDate = startDateTime;
//         var endDate = endDateTime;
//         genrateReport(res, name, reportType, fileName, startDate, endDate);
//       }
//     } else if (reportType == "BillSupplier") {
//       var DataFilter = {};
//       if (req.body.supplier_id) {
//         DataFilter["supplier_id"] = req.body.supplier_id;
//       }
//       if (startDateTime && endDateTime) {
//         var startDateTime = new Date(startDateTime);
//         var endDateTime = new Date(endDateTime);
//         //to_date1.setDate(to_date1.getDate() + 1);
//         DataFilter["created_at"] = { $gte: startDateTime, $lte: endDateTime };
//       }

//       inventoryDataBase
//         .find(DataFilter)
//         .populate("supplier_id")
//         .lean()
//         .exec(function (err, data) {
//           if (err) {
//             res.status(400).json(err);
//           } else {
//             var t = Math.random();
//             var FileName = "BillSupplier";
//             var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
//             var report = file_Name + ".csv";

//             const csvWriter = createCsvWriter({
//               path: "./public/reports/" + file_Name + ".csv",
//               header: [
//                 { id: "Date", title: "Date" },
//                 { id: "Time", title: "Time" },
//                 { id: "InvoiceNumber", title: "Bill No." },
//                 { id: "supplier_id", title: "Supplier" },
//                 { id: "InvoiceDate", title: "Bill Date" },
//                 { id: "InvoiceAmount", title: "Bill Amount" },
//                 { id: "InvoiceDueDate", title: "Bill DueDate" },
//                 { id: "paymentStatus", title: "Payment Status" },
//                 { id: "paymentMethod", title: "Payment Method" },
//                 { id: "admin_name", title: "Bill Added By" },
//                 { id: "paymentUpdateByAdminID", title: "Payment Update By" },
//               ],
//             });
//             var jsonData = [];
//             for (var i = 0; i < data.length; i++) {
//               var DataI = data[i];
//               if (DataI.paymentUpdateByAdminID) {
//                 var paymentUpdateByAdminID = DataI.paymentUpdateByAdminID.name;
//               } else {
//                 var paymentUpdateByAdminID = "";
//               }
//               if (DataI.supplier_id) {
//                 var supplier_id = DataI.supplier_id.name;
//               } else {
//                 var supplier_id = null;
//               }

//               var TodayDate1 = new Date();
//               var TodayDate = TodayDate1.toISOString().split("T")[0];
//               var InvoiceDueDate1 = new Date(DataI.InvoiceDueDate);
//               var InvoiceDueDate = InvoiceDueDate1.toISOString().split("T")[0];
//               var paymentStatus;
//               if (DataI.paymentStatus == "pending" || DataI.paymentStatus == null) {
//                 if (TodayDate < InvoiceDueDate) {
//                   paymentStatus = DataI.paymentStatus == "pending" ? "Pending" : DataI.paymentStatus;
//                 } else if (TodayDate > InvoiceDueDate) {
//                   paymentStatus = "Over Due";
//                 } else if (TodayDate == InvoiceDueDate) {
//                   paymentStatus = "Due";
//                 }
//               } else if (DataI.paymentStatus == "Complete") {
//                 paymentStatus = "Complete";
//               }

//               var InvoiceDateFor = moment.utc(DataI.InvoiceDate).tz("Asia/Kolkata");
//               var InvoiceDate = InvoiceDateFor.format("DD-MM-YYYY");

//               var BillDueDateFor = moment.utc(DataI.InvoiceDueDate).tz("Asia/Kolkata");
//               var BillDueDate = BillDueDateFor.format("DD-MM-YYYY");

//               var DateFor = moment.utc(DataI.Date).tz("Asia/Kolkata");
//               var DateShow = DateFor.format("DD-MM-YYYY");
//               //+ " - " + paymentUpdateByAdminID
//               jsonData.push({
//                 Date: DateShow,
//                 Time: DataI.Time,
//                 InvoiceNumber: DataI.InvoiceNumber,
//                 supplier_id: supplier_id,
//                 InvoiceDate: InvoiceDate,
//                 InvoiceAmount: DataI.InvoiceAmount,
//                 InvoiceDueDate: BillDueDate,
//                 paymentStatus: paymentStatus,
//                 paymentMethod: DataI.paymentMethod,
//                 admin_name: DataI.admin_name,
//                 paymentUpdateByAdminID: paymentUpdateByAdminID,
//               });
//             }
//             //end of sorting function
//             csvWriter
//               .writeRecords(jsonData) // returns a promise
//               .then(() => {
//                 console.log("...Done");
//               });
//             //var report = t + ".csv";
//             var name = "Bill/Supplier";
//             var reportType = "BillSupplier";
//             var fileName = report;
//             var startDate = startDateTime;
//             var endDate = endDateTime;
//             genrateReport(res, name, reportType, fileName, startDate, endDate);
//           }
//         });
//     } else if (reportType == "ItemSalesConsolidatedlist") {
//       if (startDateTime && endDateTime) {
//         var from_date1 = new Date(startDateTime);
//         var to_date1 = new Date(endDateTime);
//         //to_date1.setDate(to_date1.getDate() + 1);
//       }
//       bookingDataBase
//         .find({
//           // createDate: {
//           //   $gte: from_date1,
//           //   $lt: to_date1,
//           // },
//           $and: [
//             {
//               $or: [
//                 {
//                   BookingStatusByAdmin: "Accepted",
//                 },
//                 {
//                   BookingStatusByAdmin: "Out For Delivery",
//                 },
//                 {
//                   BookingStatusByAdmin: "Pending",
//                 },
//               ],
//             },
//             {
//               createDate: {
//                 $gte: from_date1,
//                 $lt: to_date1,
//               },
//             },
//           ],
//         })
//         .exec(function (err, data) {
//           var t = Math.random();
//           var FileName = "ItemSalesConsolidatedlist";
//           var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
//           var report = file_Name + ".csv";

//           const csvWriter = createCsvWriter({
//             path: "./public/reports/" + file_Name + ".csv",
//             header: [
//               { id: "category", title: "category" },
//               { id: "hsnCode", title: "HSN" },
//               { id: "ProductName", title: "Product Name" },
//               { id: "Packaging", title: "Packaging" },
//               { id: "ItemQuantity", title: "QTY" },
//             ],
//           });
//           var jsonData = [];
//           for (var i = 0; i < data.length; i++) {
//             var iData = data[i];

//             var BookingDetail = iData.bookingdetail;
//             for (var z = 0; z < BookingDetail.length; z++) {
//               var BookingDetailZ = BookingDetail[z];
//               if (BookingDetailZ.TypeOfProduct == "group") {
//                 for (let j = 0; j < BookingDetailZ.groupData.length; j++) {
//                   let set = BookingDetailZ.groupData[j];
//                   let setQty = 0;
//                   for (let k = 0; k < set.sets.length; k++) {
//                     var product_categoriesArray = [];
//                     if (BookingDetailZ.product_categories) {
//                       var product_categories = BookingDetailZ.product_categories;
//                       for (var i1 = 0; i1 < product_categories.length; i1++) {
//                         product_categoriesArray.push(product_categories[i1].category_name);
//                       }
//                     }
//                     let product_name = set.sets[k].product.product_name;
//                     var ItemQuantity = set.sets[k].package
//                       ? set.sets[k].package.packetLabel
//                       : set.sets[k].unitQuantity + " " + set.sets[k].unitMeasurement;
//                     var qty = set.sets[k].qty * BookingDetailZ.qty;
//                     if (qty > 0) {
//                       jsonData.push({
//                         category: product_categoriesArray,
//                         hsnCode: set.sets[k].product.hsnCode,
//                         ProductName: product_name,
//                         Packaging: ItemQuantity,
//                         ItemQuantity: set.sets[k].qty * BookingDetailZ.qty,
//                       });
//                     }
//                   }
//                 }
//               } else {
//                 var product_categoriesArray = [];
//                 if (BookingDetailZ.product_categories) {
//                   var product_categories = BookingDetailZ.product_categories;
//                   for (var i1 = 0; i1 < product_categories.length; i1++) {
//                     product_categoriesArray.push(product_categories[i1].category_name);
//                   }
//                 }
//                 var product_name = BookingDetailZ.product_name;
//                 var ItemQuantity = BookingDetailZ.without_package
//                   ? BookingDetailZ.unitQuantity + " " + BookingDetailZ.unitMeasurement
//                   : BookingDetailZ.packetLabel;

//                 jsonData.push({
//                   category: product_categoriesArray,
//                   hsnCode: BookingDetailZ.product_id.hsnCode,
//                   ProductName: product_name,
//                   Packaging: ItemQuantity,
//                   ItemQuantity: +BookingDetailZ.qty,
//                 });
//               }
//             }
//           }
//           //sorting of json data
//           function dynamicSort(property) {
//             var sortOrder = 1;

//             if (property[0] === "-") {
//               sortOrder = -1;
//               property = property.substr(1);
//             }

//             return function (a, b) {
//               if (sortOrder == -1) {
//                 return b[property].localeCompare(a[property]);
//               } else {
//                 return a[property].localeCompare(b[property]);
//               }
//             };
//           }
//           var sortedData = jsonData.sort(dynamicSort("ProductName"));
//           //end of sorting function
//           //sum values, and merge object values ​with the same id into a new array start
//           const result = sortedData
//             .map((item, i, array) => {
//               const defaultValue = {
//                 category: item.category,
//                 hsnCode: item.hsnCode,
//                 ProductName: item.ProductName,
//                 Packaging: item.Packaging,
//                 ItemQuantity: 0,
//               };
//               const finalValue = array
//                 .filter((other) => other.ProductName === item.ProductName && other.Packaging === item.Packaging) //we filter the same items
//                 .reduce((accum, currentVal) => {
//                   //we reduce them into a single entry
//                   accum.ItemQuantity += +currentVal.ItemQuantity;
//                   return accum;
//                 }, defaultValue);

//               return finalValue;
//             })
//             .filter((item, thisIndex, array) => {
//               //now our new array has duplicates, lets remove them
//               const index = array.findIndex(
//                 (otherItem, otherIndex) =>
//                   otherItem.ProductName === item.ProductName &&
//                   otherItem.Packaging === item.Packaging &&
//                   otherIndex !== thisIndex &&
//                   otherIndex > thisIndex
//               );

//               return index === -1;
//             });
//           //end

//           var finalData = [];
//           for (var z = 0; z < result.length; z++) {
//             finalData.push({
//               category: result[z].category,
//               hsnCode: result[z].hsnCode,
//               ProductName: result[z].ProductName,
//               Packaging: result[z].Packaging,
//               ItemQuantity: result[z].ItemQuantity,
//             });
//           }
//           //marge qty of product end
//           csvWriter
//             .writeRecords(finalData) // returns a promise
//             .then(() => {
//               console.log("...Done");
//             });
//           //var report = t + ".csv";
//           var name = "Item Sales Consolidated list";
//           var reportType = "ItemSalesConsolidatedlist";
//           var fileName = report;
//           var startDate = startDateTime;
//           var endDate = endDateTime;
//           genrateReport(res, name, reportType, fileName, startDate, endDate);

//           // res
//           //     .status(200)
//           //     .json({"message":'ok',"data":report,"code":0});
//           //     return;
//         });
//     } else if (reportType == "LostBusinessReport") {
//       if (startDateTime && endDateTime) {
//         var from_date1 = new Date(startDateTime);
//         var to_date1 = new Date(endDateTime);
//         //to_date1.setDate(to_date1.getDate() + 1);
//       }
//       addtocartDataBase
//         .find({
//           CartDetail: { $exists: true, $ne: [] },
//           createDate: {
//             $gte: from_date1,
//             $lt: to_date1,
//           },
//         })
//         .sort({ createDate: "desc" })
//         .lean()
//         .populate("user_id")
//         .populate({
//           path: "CartDetail.product_id",
//           populate: [
//             {
//               path: "unitMeasurement",
//               model: "unit_measurements",
//             },
//             // {
//             //  path: 'salesTaxWithIn',
//             //  model: 'taxs'
//             // },{
//             //   path: 'salesTaxOutSide',
//             //   model: 'taxs',
//             // },
//             // {
//             //   path: 'product_subCat1_id'
//             // },
//             // {
//             //   path: 'product_cat_id'
//             // },
//             // {
//             //   path: 'simpleData.region'
//             // },
//             {
//               path: "configurableData.attributes.attributeId",
//             },
//           ],
//         })
//         .exec(function (err, data) {
//           if (err) {
//             res.status(500).json(err);
//           } else {
//             var DataJson = [];
//             for (var n = 0; n < data.length; n++) {
//               if (data[n].CartDetail != null) {
//                 var CartDetailArray = [];
//                 var CartDetail = data[n].CartDetail;
//                 for (var i = 0; i < CartDetail.length; i++) {
//                   var DataI = CartDetail[i];
//                   var ConfigItemPush = {};
//                   var SimpleItemPush = {};
//                   if (DataI.product_id === null || DataI.product_id === "null") {
//                     return res.status(400).json({
//                       message: "error",
//                       data: "product not found in database",
//                       code: 1,
//                     });
//                     process.exit(1);
//                   }
//                   if (DataI.TypeOfProduct == "configurable") {
//                     var varItem = DataI.product_id.configurableData;
//                     //var varItem = DataI.configurableData;
//                     var ItemVarArray = {};
//                     //var ConfigItemPush = [];
//                     var variantIdArrayPush = [];
//                     for (var j = 0; j < varItem.length; j++) {
//                       if (JSON.stringify(DataI.productItemId) == JSON.stringify(varItem[j]._id)) {
//                         var variantIdArray = varItem[j].variant_id;
//                         for (var k = 0; k < variantIdArray.length; k++) {
//                           var item = variantIdArray[k].variantId.item;
//                           for (var l = 0; l < item.length; l++) {
//                             if (JSON.stringify(item[l]._id) == JSON.stringify(variantIdArray[j].variantItem)) {
//                               ItemVarArray = {
//                                 item: item[l].item_name,
//                                 _id: item[l]._id,
//                               };
//                             }
//                           }
//                           variantIdArrayPush.push({
//                             variantId: variantIdArray[k].variantId,
//                             variantItem: ItemVarArray,
//                             _id: variantIdArray._id,
//                           });
//                         }
//                         ConfigItemPush = {
//                           region: varItem[j].region,
//                           sellingPrice: varItem[j].sellingPrice,
//                           costPrice: varItem[j].costPrice,
//                           total_amount: varItem[j].total_amount,
//                           quantity: varItem[j].quantity,
//                           ExpirationDate: varItem[j].ExpirationDate,
//                           skuCode: varItem[j].skuCode,
//                           _id: varItem[j]._id,
//                           variant_id: variantIdArrayPush,
//                         };
//                       }
//                     }
//                   } else if (DataI.TypeOfProduct == "simple") {
//                     var SimpleData = DataI.product_id.simpleData;
//                     for (var j = 0; j < SimpleData.length; j++) {
//                       var SimpleDataIPackage = SimpleData[j].package;
//                       for (var k = 0; k < SimpleDataIPackage.length; k++) {
//                         var packageDataI = SimpleDataIPackage[k];
//                         if (JSON.stringify(DataI.productItemId) == JSON.stringify(packageDataI._id)) {
//                           SimpleItemPush = {
//                             packet_size: packageDataI.packet_size,
//                             packetLabel: packageDataI.packetLabel,
//                             selling_price: packageDataI.selling_price,
//                             packetmrp: packageDataI.packetmrp,
//                             _id: packageDataI._id,
//                           };
//                         }
//                       }
//                     }
//                   }

//                   CartDetailArray.push({
//                     _id: DataI._id,
//                     product_id: DataI.product_id,
//                     product_cat_id: DataI.product_cat_id,
//                     product_subCat1_id: DataI.product_subCat1_id,
//                     productItemId: DataI.productItemId,
//                     TypeOfProduct: DataI.TypeOfProduct,
//                     price: DataI.price,
//                     qty: DataI.qty,
//                     unitQuantity: DataI.unitQuantity,
//                     unitMeasurement: DataI.unitMeasurement,
//                     without_package: DataI.without_package,
//                     packetLabel: DataI.packetLabel,
//                     packet_size: DataI.packet_size,
//                     totalprice: DataI.totalprice,
//                     createDate: DataI.createDate,
//                     status: DataI.status,
//                     simpleItem: SimpleItemPush,
//                     ConfigItem: ConfigItemPush,
//                   });
//                 }

//                 var createDate_formatted = moment.utc(data[n].createDate).tz("Asia/Kolkata");
//                 var createDate = createDate_formatted.format("DD-MM-YYYY");
//                 if (data[n].user_id) {
//                   if (data[n].user_id.name) {
//                     var userName = data[n].user_id.name;
//                   } else {
//                     var userName = null;
//                   }
//                   if (data[n].user_id.email) {
//                     var userEmail = data[n].user_id.email;
//                   } else {
//                     var userEmail = null;
//                   }
//                   if (data[n].user_id.contactNumber) {
//                     var contactNumber = data[n].user_id.contactNumber;
//                   } else {
//                     var contactNumber = null;
//                   }
//                 }
//                 DataJson.push({
//                   AddToCartId: data[n]._id,
//                   user_name: userName,
//                   user_mobile: contactNumber,
//                   user_email: userEmail,
//                   totalCartPrice: data[n].totalCartPrice,
//                   redeem_point: data[n].redeem_point,
//                   totalcartprice: data[n].totalcartprice,
//                   cartDetail: CartDetailArray,
//                   createDate: createDate,
//                   __v: data[n].__v,
//                 });
//               }
//             }

//             //genrate csv
//             var t = Math.random();
//             var FileName = "LostBusinessReport";
//             var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
//             var report = file_Name + ".csv";

//             const csvWriter = createCsvWriter({
//               path: "./public/reports/" + file_Name + ".csv",
//               header: [
//                 { id: "createDate", title: "Date" },
//                 { id: "user_name", title: "Customer Name" },
//                 { id: "user_mobile", title: "Customer Mobile" },
//                 { id: "user_email", title: "Customer Email" },
//                 { id: "ItemData", title: "Product Name(Packaging - Quantity)" },
//                 { id: "subTotal", title: "Sub Total" },
//                 { id: "grandTotal", title: "Grand Total" },
//               ],
//             });
//             var jsonData = [];
//             for (var i = 0; i < DataJson.length; i++) {
//               var iData = DataJson[i];
//               var BookingDetail = iData.cartDetail;
//               var ItemData = [];
//               var subTotal = 0;
//               for (var z = 0; z < BookingDetail.length; z++) {
//                 var BookingDetailZ = BookingDetail[z];
//                 if (BookingDetailZ.TypeOfProduct == "group") {
//                   var abcGroup = BookingDetailZ.groupData ? BookingDetailZ.groupData : [];
//                   for (let j = 0; j < abcGroup.length; j++) {
//                     let set = BookingDetailZ.groupData[j];
//                     let setQty = 0;
//                     for (let k = 0; k < set.sets.length; k++) {
//                       let product_name = set.sets[k].product_id.product_name;
//                       var ItemQuantity =
//                         (set.sets[k].package ? set.sets[k].package.packetLabel : set.sets[k].unitQuantity + " " + BookingDetailZ.unitMeasurement) *
//                         (set.sets[k].qty * BookingDetailZ.qty);
//                       ItemData.push(product_name + " (" + ItemQuantity + ")");
//                     }
//                   }
//                   subTotal += BookingDetailZ.totalprice;
//                 } else {
//                   var product_name = BookingDetailZ.product_id.product_name;
//                   var ItemQuantity =
//                     (BookingDetailZ.without_package
//                       ? BookingDetailZ.unitQuantity + " " + BookingDetailZ.unitMeasurement
//                       : BookingDetailZ.packetLabel) +
//                     " - " +
//                     BookingDetailZ.qty;
//                   ItemData.push(product_name + " (" + ItemQuantity + ")");
//                   subTotal += BookingDetailZ.totalprice;
//                 }
//               }
//               jsonData.push({
//                 createDate: iData.createDate,
//                 user_name: iData.user_name,
//                 user_mobile: iData.user_mobile,
//                 user_email: iData.user_email,
//                 ItemData: ItemData,
//                 subTotal: subTotal,
//                 grandTotal: iData.totalCartPrice,
//               });
//             }

//             csvWriter
//               .writeRecords(jsonData) // returns a promise
//               .then(() => {});
//             //var report = t + ".csv";
//             var name = "Lost Business Report";
//             var reportType = "LostBusinessReport";
//             var fileName = report;
//             var startDate = startDateTime;
//             var endDate = endDateTime;
//             genrateReport(res, name, reportType, fileName, startDate, endDate);
//           }
//         });
//     } else if (reportType == "OrderWiseItemSalesData") {
//       if (startDateTime && endDateTime) {
//         var from_date1 = new Date(startDateTime);
//         var to_date1 = new Date(endDateTime);
//         // to_date1.setDate(to_date1.getDate() + 1);
//       }
//       bookingDataBase
//         .find({
//           createDate: {
//             $gte: from_date1,
//             $lte: to_date1,
//           },
//         })
//         .populate("user_id")
//         .populate("driver_id")
//         .populate("regionID")
//         // .populate('bookingdetail.product_id')
//         .exec(function (err, data) {
//           var t = Math.random();
//           var FileName = "OrderWiseItemSalesData";
//           var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
//           var report = file_Name + ".csv";

//           const csvWriter = createCsvWriter({
//             path: "./public/reports/" + file_Name + ".csv",
//             header: [
//               { id: "OrderDate", title: "Order Date" },
//               { id: "OrderTime", title: "Order Time" },
//               { id: "OrderStatus", title: "Order Status" },
//               { id: "PaymentMethod", title: "Payment Method" },
//               { id: "CustomerName", title: "Customer Name" },
//               { id: "CustomerMobileNo", title: "Customer Mobile No" },
//               { id: "CustomerType", title: "Customer Type" },
//               { id: "CustomerEmail", title: "Customer Email" },
//               { id: "DeliveryboyName", title: "Delivery Boy Name" },
//               { id: "deliverySlot", title: "Delivery Slot" },
//               {
//                 id: "OrderDeliveryDate",
//                 title: "Order Delivery Date",
//               },
//               {
//                 id: "ReferenceNumber",
//                 title: "Order ID",
//               },
//               { id: "OutletName", title: "Region" },
//               { id: "ItemName", title: "Item Name" },
//               { id: "packaging", title: "Packaging" },
//               { id: "ItemQuantity", title: "Item Quantity" },
//               { id: "category", title: "category" },
//               {
//                 id: "totalPriceBeforeGST",
//                 title: "Item Total Price Without GST",
//               },
//               { id: "ItemTaxes", title: "Item Taxes" },
//               { id: "ItemDiscount", title: "Item Discount" },
//               { id: "ItemTotal", title: "Item Total Price" },
//             ],
//           });
//           var jsonData = [];
//           for (var i = 0; i < data.length; i++) {
//             var iData = data[i];
//             var createDate_formatted = moment.utc(iData.createDate).tz("Asia/Kolkata");
//             var OrderDate = createDate_formatted.format("DD-MM-YYYY");
//             var OrderTime = createDate_formatted.format("HH:mm A");

//             if (iData.driver_id != null) {
//               if (iData.driver_id.name) {
//                 var driverName = iData.driver_id.name;
//               } else {
//                 var driverName = null;
//               }
//             } else {
//               var driverName = null;
//             }

//             if (iData.DeliveryDate) {
//               var DeliveryDate_formatted = moment.utc(iData.DeliveryDate).tz("Asia/Kolkata");
//               var DeliveryDate = DeliveryDate_formatted.format("DD-MM-YYYY");
//             } else {
//               var DeliveryDate = null;
//             }
//             var BookingDetail = iData.bookingdetail;

//             var ItemLength = BookingDetail.length;
//             for (var k = 0; k < BookingDetail.length; k++) {
//               var BookingDetailZ = BookingDetail[k];
//               if (BookingDetailZ.TypeOfProduct == "group") {
//                 var product_categoriesArray = [];
//                 var product_name = [];
//                 var packaging = null;
//                 var totalPrice = 0;
//                 var totalPriceBeforeGST = 0;
//                 var ItemDiscount = 0;
//                 var ItemTaxes = 0;
//                 var ItemDeliveryCharges = 0;
//                 var qty = 0;
//                 for (let j = 0; j < BookingDetailZ.groupData.length; j++) {
//                   let set = BookingDetailZ.groupData[j];
//                   let setQty = 0;
//                   let itemsArray = [];
//                   for (let k = 0; k < set.sets.length; k++) {
//                     var product_categoriesArray = [];
//                     if (BookingDetailZ.product_categories) {
//                       var product_categories = BookingDetailZ.product_categories;
//                       for (var i1 = 0; i1 < product_categories.length; i1++) {
//                         product_categoriesArray.push(product_categories[i1].category_name);
//                       }
//                     }
//                     let product_name = set.sets[k].product.product_name;
//                     var ItemQuantity =
//                       (set.sets[k].package ? set.sets[k].package.packetLabel : set.sets[k].unitQuantity + "" + BookingDetailZ.unitMeasurement) +
//                       " " +
//                       set.sets[k].qty;
//                     itemsArray.push(product_name + " " + ItemQuantity);
//                     // product_name = set.sets[k].product.product_name;
//                     // totalPrice = set.sets[k].qty*BookingDetailZ.qty*set.sets[k].price
//                     // qty = set.sets[k].qty*BookingDetailZ.qty
//                     // ItemQuantity = (set.sets[k].package ? set.sets[k].package.packetLabel : set.sets[k].unitQuantity+' '+BookingDetailZ.unitMeasurement)
//                   }
//                   product_categoriesArray.push(product_categoriesArray);
//                   product_name.push(BookingDetailZ.product_name + "(" + itemsArray + ")");
//                   totalPrice = BookingDetailZ.totalprice;
//                   totalPriceBeforeGST = BookingDetail[k].totalPriceBeforeGST;
//                   ItemDiscount = BookingDetail[k].itemDiscountAmount ? +BookingDetail[k].totalprice - +BookingDetail[k].itemDiscountAmount : 0;
//                   ItemTaxes = BookingDetail[k].itemWiseGst;
//                   ItemDeliveryCharges = BookingDetail[k].deliveryCharges;
//                   qty = BookingDetailZ.qty;
//                 }
//               }
//               if (BookingDetailZ.TypeOfProduct == "simple") {
//                 var product_categoriesArray = [];
//                 if (BookingDetailZ.product_categories) {
//                   var product_categories = BookingDetailZ.product_categories;
//                   for (var i1 = 0; i1 < product_categories.length; i1++) {
//                     product_categoriesArray.push(product_categories[i1].category_name);
//                   }
//                 }

//                 var product_name = BookingDetailZ.product_name;
//                 var packaging = BookingDetail[k].without_package
//                   ? BookingDetail[k].unitQuantity + " " + BookingDetail[k].unitMeasurement
//                   : BookingDetail[k].packetLabel;
//                 var qty = BookingDetail[k].qty;
//                 var totalPrice = BookingDetail[k].totalprice;
//                 var totalPriceBeforeGST = BookingDetail[k].totalPriceBeforeGST;
//                 var ItemDiscount = BookingDetail[k].itemDiscountAmount ? +BookingDetail[k].totalprice - +BookingDetail[k].itemDiscountAmount : 0;
//                 var ItemTaxes = BookingDetail[k].itemWiseGst;
//               }

//               if (iData.BookingStatusByAdmin == "Pending" && iData.payment == "Pending" && iData.paymentmethod == "Paytm") {
//                 var BookingStatusByAdmin = "Failed";
//               } else {
//                 var BookingStatusByAdmin = iData.BookingStatusByAdmin;
//               }
//               // var ItemQuantity;
//               // var ItemQuantity =  BookingDetail[k].without_package ? BookingDetail[k].unitQuantity+' '+BookingDetail[k].unitMeasurement : BookingDetail[k].packetLabel
//               jsonData.push({
//                 OrderDate: OrderDate,
//                 OrderTime: OrderTime,
//                 PaymentMethod: iData.paymentmethod,
//                 OrderStatus: BookingStatusByAdmin,
//                 CustomerName: iData.userName,
//                 CustomerMobileNo: iData.userMobile,
//                 CustomerType: iData.userType,
//                 CustomerEmail: iData.userEmail,
//                 DeliveryboyName: driverName,
//                 deliverySlot: iData.deliverySlot,
//                 OrderDeliveryDate: DeliveryDate,
//                 ReferenceNumber: iData.booking_code,
//                 OutletName: iData.regionName,
//                 ItemName: product_name,
//                 packaging: packaging,
//                 ItemQuantity: qty,
//                 category: product_categoriesArray,
//                 ItemTotal: totalPrice,
//                 totalPriceBeforeGST: totalPriceBeforeGST,
//                 ItemDiscount: ItemDiscount,
//                 ItemTaxes: ItemTaxes,
//               });
//             }
//             // jsonData.push({
//             //   OrderDate: null,
//             //   OrderTime: null,
//             //   OrderStatus: null,
//             //   CustomerName: null,
//             //   CustomerMobileNo: null,
//             //   CustomerType: null,
//             //   CustomerEmail: null,
//             //   DeliveryboyName: null,
//             //   deliverySlot: null,
//             //   OrderDeliveryDate: null,
//             //   ReferenceNumber: null,
//             //   OutletName: null,
//             //   ItemName: null,
//             //   ItemQuantity: null,
//             //   packaging: null,
//             //   ItemTotal: null,
//             //   // ItemDiscount: null,
//             //   // ItemTaxes: null,
//             //   // ItemCharges: null,
//             // });
//           }
//           csvWriter
//             .writeRecords(jsonData) // returns a promise
//             .then(() => {
//               console.log("...Done");
//             });
//           //var report = t + ".csv";
//           var name = "Order Wise Item Sales Data";
//           var reportType = "OrderWiseItemSalesData";
//           var fileName = report;
//           var startDate = startDateTime;
//           var endDate = endDateTime;
//           genrateReport(res, name, reportType, fileName, startDate, endDate);

//           // res
//           //     .status(200)
//           //     .json({"message":'ok',"data":report,"code":0});
//           //     return;
//         });
//     } else if (reportType == "OrderWiseSalesSummmary") {
//       if (startDateTime && endDateTime) {
//         var from_date1 = new Date(startDateTime);
//         var to_date1 = new Date(endDateTime);
//         //to_date1.setDate(to_date1.getDate() + 1);
//       }

//       bookingDataBase
//         .find({
//           createDate: {
//             $gte: from_date1,
//             $lte: to_date1,
//           },
//         })
//         .populate("user_id")
//         .populate("billingCompany")
//         .exec(function (err, data) {
//           var t = Math.random();
//           var FileName = "OrderWiseSalesSummmary";
//           var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
//           var report = file_Name + ".csv";

//           const csvWriter = createCsvWriter({
//             path: "./public/reports/" + file_Name + ".csv",
//             header: [
//               { id: "billType", title: "Bill Type" },
//               { id: "billingCompany", title: "Company Name" },
//               { id: "OrderDate", title: "Order Date" },
//               { id: "OrderTime", title: "Order Time" },
//               { id: "ReferenceNumber", title: "Order ID" },

//               { id: "OutletName", title: "Region" },
//               { id: "OrderStatus", title: "Order Status" },
//               //{ id: "OrderType", title: "Order Type" },
//               { id: "OrderSource", title: "Order Source" },
//               { id: "Preorder", title: "Preorder" },
//               { id: "PaymentMode", title: "Payment Mode" },
//               { id: "CustomerType", title: "Customer Type" },
//               { id: "CustomerMobileNo", title: "Customer Phone" },
//               { id: "CustomerName", title: "Customer Name" },
//               { id: "CustomerEmail", title: "Customer Email" },
//               { id: "CustomerAddress", title: "Customer Address" },
//               //{ id: "Locality", title: "Locality" },
//               { id: "City", title: "City" },
//               { id: "Subtotal", title: "Subtotal" },
//               { id: "GST", title: "GST" },
//               { id: "taxType", title: "Tax" },
//               { id: "DeliveryCharge", title: "Delivery Charge" },
//               { id: "codCharges", title: "COD Charge" },
//               { id: "Discount", title: "Discount" },
//               { id: "loyaltypoint", title: "Loyalty Point Discount" },
//               { id: "GrandTotal", title: "Grand Total" },
//             ],
//           });

//           var totalGrandTotal = 0;
//           var jsonData = [];
//           for (var i = 0; i < data.length; i++) {
//             var iData = data[i];
//             var createDate_formatted = moment.utc(iData.createDate).tz("Asia/Kolkata");
//             var OrderDate = createDate_formatted.format("DD-MM-YYYY");
//             var OrderTime = createDate_formatted.format("HH:mm A");

//             totalGrandTotal += iData.total_payment;
//             if (iData.billingCompany) {
//               var billingCompany = iData.billingCompany.name;
//             } else {
//               var billingCompany = null;
//             }
//             var Discount = iData.redeemDiscount + iData.totalCouponDiscountAmount + iData.referralDiscount;
//             if (iData.BookingStatusByAdmin == "Pending" && iData.payment == "Pending" && iData.paymentmethod == "Paytm") {
//               var BookingStatusByAdmin = "Failed";
//             } else {
//               var BookingStatusByAdmin = iData.BookingStatusByAdmin;
//             }
//             jsonData.push({
//               billType: iData.billType,
//               billingCompany: billingCompany,
//               OrderDate: OrderDate,
//               OrderTime: OrderTime,
//               ReferenceNumber: iData.booking_code,
//               OutletName: iData.regionName,
//               OrderStatus: BookingStatusByAdmin,
//               //OrderType: null,
//               OrderSource: iData.bookingMode,
//               Preorder: iData.preOrder === true ? "Yes" : "No",
//               PaymentMode: iData.paymentmethod,
//               CustomerType: iData.userType,
//               CustomerMobileNo: iData.userMobile,
//               CustomerName: iData.userName,
//               CustomerEmail: iData.userEmail,
//               CustomerAddress: iData.booking_address.locality,
//               // " " +
//               // iData.booking_address.city +
//               // " " +
//               // iData.booking_address.state +
//               // " " +
//               // iData.booking_address.pincode +
//               // " " +
//               // iData.booking_address.country,
//               // Locality: iData.booking_address.locality,
//               City: iData.booking_address.city,
//               Subtotal: iData.totalCartPrice,
//               GST: iData.gst,
//               taxType: iData.taxType,
//               DeliveryCharge: iData.deliveryCharges,
//               codCharges: iData.codCharges,
//               Discount: Discount,
//               loyaltypoint: iData.redeemDiscount,
//               GrandTotal: iData.total_payment,
//             });
//           }

//           var finalRow = [
//             {
//               billType: null,
//               billingCompany: null,
//               OrderDate: null,
//               OrderTime: null,
//               ReferenceNumber: null,
//               OutletName: null,
//               OrderStatus: null,
//               //OrderType: null,
//               OrderSource: null,
//               Preorder: null,
//               PaymentMode: null,
//               CustomerType: null,
//               CustomerMobileNo: null,
//               CustomerName: null,
//               CustomerEmail: null,
//               CustomerAddress: null,
//               Locality: null,
//               City: null,
//               Subtotal: null,
//               GST: null,
//               taxType: null,
//               DeliveryCharge: null,
//               codCharges: null,
//               Discount: null,
//               loyaltypoint: null,
//               GrandTotal: totalGrandTotal,
//             },
//           ];

//           var finalData = jsonData.concat(finalRow);
//           csvWriter
//             .writeRecords(finalData) // returns a promise
//             .then(() => {
//               console.log("...Done");
//             });
//           //var report = 'http://18.190.24.89:3003/public/reports/'+t+'.csv';
//           //var report = t + ".csv";
//           var name = "Order Wise Sales Summmary";
//           var reportType = "OrderWiseSalesSummmary";
//           var fileName = report;
//           var startDate = startDateTime;
//           var endDate = endDateTime;
//           genrateReport(res, name, reportType, fileName, startDate, endDate);

//           // res
//           //     .status(200)
//           //     .json({"message":'ok',"data":report,"code":0});
//           //     return;
//         });
//     } else if (
//       reportType == "cod" ||
//       reportType == "COD" ||
//       reportType == "Paytm" ||
//       reportType == "paytm" ||
//       reportType == "credit" ||
//       reportType == "Credit" ||
//       reportType == "wallet" ||
//       reportType == "Wallet"
//     ) {
//       var DataFilter = {};
//       if (req.body.reportType) {
//         DataFilter["paymentmethod"] = req.body.reportType;
//       }
//       if (req.body.user_id) {
//         DataFilter["user_id"] = req.body.user_id;
//       }
//       if (startDateTime && endDateTime) {
//         var from_date1 = new Date(startDateTime);
//         var to_date1 = new Date(endDateTime);
//         to_date1.setDate(to_date1.getDate() + 1);
//         DataFilter["createDate"] = { $gte: from_date1, $lt: to_date1 };
//       }
//       bookingDataBase
//         .find(DataFilter)
//         .populate("user_id")
//         //    .populate('driver_id')
//         // .populate('bookingdetail.product_id')
//         .exec(function (err, data) {
//           var t = Math.random();

//           if (req.body.reportType == "paytm" || req.body.reportType == "Paytm") {
//             var FileName = "Online_Payment";
//           } else {
//             var FileName = req.body.reportType;
//           }
//           var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
//           var report = file_Name + ".csv";

//           const csvWriter = createCsvWriter({
//             path: "./public/reports/" + file_Name + ".csv",
//             header: [
//               { id: "OrderDate", title: "Order Date" },
//               { id: "OrderTime", title: "Order Time" },
//               { id: "ReferenceNumber", title: "Order ID" },
//               { id: "City", title: "City" },
//               { id: "OutletName", title: "Region" },
//               { id: "OrderStatus", title: "Order Status" },
//               { id: "PaymentStatus", title: "Payment Status" },
//               { id: "PaymentDate", title: "Payment Date" },
//               //{ id: "OrderType", title: "Order Type" },
//               { id: "OrderSource", title: "Order Source" },
//               { id: "Preorder", title: "Preorder" },
//               { id: "PaymentMode", title: "Payment Mode" },
//               { id: "PaymentMethod", title: "Payment Method" },
//               { id: "CustomerType", title: "Customer Type" },
//               { id: "CustomerName", title: "Customer Name" },
//               { id: "CustomerMobileNo", title: "Customer Phone" },
//               { id: "CustomerEmail", title: "Customer Email" },
//               { id: "CustomerAddress", title: "Customer Address" },
//               { id: "Locality", title: "Locality" },
//               { id: "Subtotal", title: "Subtotal" },
//               { id: "GST", title: "GST" },
//               { id: "taxType", title: "Tax" },
//               { id: "DeliveryCharge", title: "Delivery Charge" },
//               { id: "codCharges", title: "COD Charges" },
//               { id: "Discount", title: "Discount" },
//               { id: "loyaltypoint", title: "Loyalty Point Discount" },
//               { id: "GrandTotal", title: "Grand Total" },
//             ],
//           });
//           var jsonData = [];
//           var TotalSubtotal = 0;
//           var TotalGST = 0;
//           var TotalDeliveryCharge = 0;
//           var TotalcodCharges = 0;
//           var TotalDiscount = 0;
//           var TotalLoyaltyPoint = 0;
//           var TotalGrandTotal = 0;

//           for (var i = 0; i < data.length; i++) {
//             var iData = data[i];
//             var createDate_formatted = moment.utc(iData.createDate).tz("Asia/Kolkata");
//             var OrderDate = createDate_formatted.format("DD-MM-YYYY");
//             var OrderTime = createDate_formatted.format("HH:mm A");
//             var Discount = iData.redeemDiscount + iData.totalCouponDiscountAmount + iData.referralDiscount;

//             TotalSubtotal += iData.totalCartPrice;
//             TotalGST += iData.gst;
//             TotalDeliveryCharge += iData.deliveryCharges;
//             TotalcodCharges += iData.codCharges;
//             TotalDiscount += Discount;
//             TotalLoyaltyPoint += iData.redeemDiscount;
//             TotalGrandTotal += iData.total_payment;

//             if (iData.paymentmethod == "Paytm" || iData.paymentmethod == "paytm") {
//               var paymentmethod = "Online Payment";
//             } else {
//               var paymentmethod = iData.paymentmethod;
//             }
//             if (iData.paymentDateByAdmin) {
//               var paymentDateByAdmin_formatted = moment.utc(iData.paymentDateByAdmin).tz("Asia/Kolkata");
//               var paymentDateByAdmin = paymentDateByAdmin_formatted.format("DD-MM-YYYY");
//             } else {
//               var paymentDateByAdmin = iData.payment == "Complete" ? OrderDate : null;
//             }

//             if (iData.BookingStatusByAdmin == "Pending" && iData.payment == "Pending" && iData.paymentmethod == "Paytm") {
//               var BookingStatusByAdmin = "Failed";
//             } else {
//               var BookingStatusByAdmin = iData.BookingStatusByAdmin;
//             }

//             jsonData.push({
//               OrderDate: OrderDate,
//               OrderTime: OrderTime,
//               ReferenceNumber: iData.booking_code,
//               City: iData.booking_address.city,
//               OutletName: iData.regionName,
//               OrderStatus: BookingStatusByAdmin,
//               PaymentStatus: iData.payment,
//               PaymentDate: paymentDateByAdmin,
//               // OrderType: null,
//               OrderSource: iData.bookingMode,
//               Preorder: iData.preOrder === true ? "Yes" : "No",
//               PaymentMode: iData.bookingMode,
//               PaymentMethod: paymentmethod,
//               CustomerType: iData.userType,
//               CustomerName: iData.userName,
//               CustomerMobileNo: iData.userMobile,
//               CustomerEmail: iData.userEmail,
//               CustomerAddress: iData.booking_address.locality,
//               Locality: iData.booking_address.locality,
//               Subtotal: iData.totalCartPrice,
//               GST: iData.gst,
//               taxType: iData.taxType,
//               DeliveryCharge: iData.deliveryCharges,
//               codCharges: iData.codCharges,
//               Discount: Discount,
//               loyaltypoint: iData.redeemDiscount,
//               GrandTotal: iData.total_payment,
//             });
//           }
//           var finalRow = [
//             {
//               OrderDate: null,
//               OrderTime: null,
//               ReferenceNumber: null,
//               City: null,
//               OutletName: null,
//               OrderStatus: null,
//               // OrderType: null,
//               OrderSource: null,
//               Preorder: null,
//               PaymentMode: null,
//               PaymentMethod: null,
//               CustomerType: null,
//               CustomerName: null,
//               CustomerMobileNo: null,
//               CustomerEmail: null,
//               CustomerAddress: null,
//               Locality: null,
//               Subtotal: TotalSubtotal,
//               GST: TotalGST,
//               taxType: null,
//               DeliveryCharge: TotalDeliveryCharge,
//               codCharges: TotalcodCharges,
//               Discount: TotalDiscount,
//               loyaltypoint: TotalLoyaltyPoint,
//               GrandTotal: TotalGrandTotal,
//             },
//           ];

//           var finalData = jsonData.concat(finalRow);

//           csvWriter
//             .writeRecords(finalData) // returns a promise
//             .then(() => {
//               //console.log('...Done',jsonData);
//             });
//           var name = FileName;
//           var reportType = report;
//           var fileName = report;
//           var startDate = startDateTime;
//           var endDate = endDateTime;
//           genrateReport(res, name, reportType, fileName, startDate, endDate);

//           // res
//           //     .status(200)
//           //     .json({"message":'ok',"data":report,"code":0});
//           //     return;
//         });
//     } else if (reportType == "SalesReportWithTaxation") {
//       var DataFilter = {};
//       if (startDateTime && endDateTime) {
//         var from_date1 = new Date(startDateTime);
//         var to_date1 = new Date(endDateTime);
//         //to_date1.setDate(to_date1.getDate() + 1);
//         DataFilter["createDate"] = { $gte: from_date1, $lte: to_date1 };
//         DataFilter["subscriptionID"] = null;
//         // DataFilter["BookingStatusByAdmin"] = {$ne:"Rejected"};
//         // DataFilter["$and"] = [{paymentmethod: "Paytm"},
//         //   {payment: {$nin:["Failed", "Pending", "failed" ]}}
//         //   // {
//         //   //   payment: {$ne:"Pending"},
//         //   //   paymentmethod: "Paytm",
//         //   // },
//         //   // {
//         //   //   payment: {$ne:"Failed"},
//         //   //   paymentmethod: "Paytm",
//         //   // },
//         //   // {
//         //   //   payment: {$ne:"failed"},
//         //   //   paymentmethod: "Paytm",
//         //   // }
//         // ] ;
//       }
//       var bookingJsonData = await bookingDataBase.find(DataFilter);
//       var subscribeJsonData = await subscriptionDataBase.find({
//         createDate: { $gte: from_date1, $lte: to_date1 },
//       });

//       var t = Math.random();
//       var FileName = "SalesReportWithTaxation";
//       var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
//       var report = file_Name + ".csv";

//       const csvWriter = createCsvWriter({
//         path: "./public/reports/" + file_Name + ".csv",
//         header: [
//           { id: "OrderDate", title: "Order Date" },
//           { id: "OrderTime", title: "Order Time" },
//           { id: "OrderID", title: "Order No" },
//           { id: "invoiceNumber", title: "Invoice Number" },
//           { id: "OrderStatus", title: "Order Status" },
//           { id: "paymentmethod", title: "Payment Method" },
//           { id: "payment", title: "Payment Status" },
//           { id: "CustomerName", title: "Customer Name" },
//           { id: "gstno", title: "GST Number" },
//           { id: "CustomerCity", title: "City" },
//           { id: "CustomerType", title: "Customer Type" },
//           { id: "Subtotal", title: "Bill Amount" },
//           { id: "totalCartPriceWithoutGST", title: "Sub-Total" },
//           { id: "exempt", title: "Sales Exempt" },
//           { id: "GST_final_Price5", title: "GST@5%" },
//           //{ id: "SGST_tax_percent25", title: "SGST 2.5%" },
//           { id: "SGST_totalPrice25", title: "OUT PUT SGST@2.5%" },
//           { id: "CGST_totalPrice25", title: "OUT PUT CGST@2.5%" },
//           //{ id: "SGST_tax_percent6", title: "SGST 6%" },
//           { id: "GST_final_Price12", title: "GST@12%" },
//           { id: "SGST_totalPrice6", title: "OUT PUT SGST@6%" },
//           { id: "CGST_totalPrice6", title: "OUT PUT CGST@6%" },
//           //{ id: "SGST_tax_percent9", title: "SGST 9%" },
//           { id: "GST_final_Price18", title: "GST@18%" },
//           { id: "SGST_totalPrice9", title: "OUT PUT SGST@9%" },
//           { id: "CGST_totalPrice9", title: "OUT PUT CGST@9%" },
//           { id: "GST_final_Price28", title: "GST@28%" },
//           { id: "SGST_totalPrice14", title: "OUT PUT SGST@14%" },
//           { id: "CGST_totalPrice14", title: "OUT PUT CGST@14%" },

//           { id: "IGST_tax_percent5", title: "IGST@5%" },
//           { id: "IGST_totalPrice5", title: "OUT PUT IGST@5%" },
//           { id: "IGST_tax_percent12", title: "IGST@12%" },
//           { id: "IGST_totalPrice12", title: "OUT PUT IGST@12%" },
//           { id: "IGST_tax_percent18", title: "IGST@18%" },
//           { id: "IGST_totalPrice18", title: "OUT PUT IGST@18%" },
//           { id: "IGST_tax_percent28", title: "IGST@28%" },
//           { id: "IGST_totalPrice28", title: "OUT PUT IGST@28%" },
//           { id: "deliveryCharges", title: "Delivery Charges" },
//           { id: "totalDiscount", title: "Discount" },
//           { id: "adjustment", title: "Adjustment" },
//         ],
//       });
//       var jsonData = [];
//       var SubscribeJsonDataArray = [];
//       //booking data start
//       if (bookingJsonData.length > 0) {
//         for (var i = 0; i < bookingJsonData.length; i++) {
//           var GST_final_Price5 = 0;
//           var GST_final_Price12 = 0;
//           var GST_final_Price18 = 0;
//           var GST_final_Price28 = 0;

//           var SGST_final_Price25 = 0;
//           var SGST_final_Price6 = 0;
//           var SGST_final_Price9 = 0;
//           var SGST_final_Price14 = 0;
//           var SGST_final_Price5 = 0;
//           var SGST_final_Price12 = 0;
//           var SGST_final_Price18 = 0;
//           var SGST_final_Price28 = 0;

//           var CGST_final_Price25 = 0;
//           var CGST_final_Price6 = 0;
//           var CGST_final_Price9 = 0;
//           var CGST_final_Price14 = 0;
//           var CGST_final_Price5 = 0;
//           var CGST_final_Price12 = 0;
//           var CGST_final_Price18 = 0;
//           var CGST_final_Price28 = 0;

//           var IGST_final_Price25 = 0;
//           var IGST_final_Price6 = 0;
//           var IGST_final_Price9 = 0;
//           var IGST_final_Price14 = 0;
//           var IGST_final_Price5 = 0;
//           var IGST_final_Price12 = 0;
//           var IGST_final_Price18 = 0;
//           var IGST_final_Price28 = 0;

//           var iData = bookingJsonData[i];
//           var createDate_formatted = moment.utc(iData.createDate).tz("Asia/Kolkata");
//           var OrderDate = createDate_formatted.format("DD-MM-YYYY");
//           var OrderRealDate1 = createDate_formatted.format("MM-DD-YYYY");
//           var OrderTime = createDate_formatted.format("HH:mm A");
//           var allGst = iData.allGstLists;

//           var GST_tax_percent5 = "";
//           var GST_totalPrice5 = "";
//           var GST_tax_percent12 = "";
//           var GST_totalPrice12 = "";
//           var GST_tax_percent18 = "";
//           var GST_totalPrice18 = "";
//           var GST_tax_percent28 = "";
//           var GST_totalPrice28 = "";

//           var SGST_tax_percent25 = "";
//           var SGST_totalPrice25 = "";
//           var SGST_tax_percent6 = "";
//           var SGST_totalPrice6 = "";
//           var SGST_tax_percent9 = "";
//           var SGST_totalPrice9 = "";
//           var SGST_tax_percent14 = "";
//           var SGST_totalPrice14 = "";
//           var SGST_tax_percent5 = "";
//           var SGST_totalPrice5 = "";
//           var SGST_tax_percent12 = "";
//           var SGST_totalPrice12 = "";
//           var SGST_tax_percent18 = "";
//           var SGST_totalPrice18 = "";
//           var SGST_tax_percent28 = "";
//           var SGST_totalPrice28 = "";

//           var CGST_tax_percent25 = "";
//           var CGST_totalPrice25 = "";
//           var CGST_tax_percent6 = "";
//           var CGST_totalPrice6 = "";
//           var CGST_tax_percent9 = "";
//           var CGST_totalPrice9 = "";
//           var CGST_tax_percent14 = "";
//           var CGST_totalPrice14 = "";
//           var CGST_tax_percent5 = "";
//           var CGST_totalPrice5 = "";
//           var CGST_tax_percent12 = "";
//           var CGST_totalPrice12 = "";
//           var CGST_tax_percent18 = "";
//           var CGST_totalPrice18 = "";
//           var CGST_tax_percent28 = "";
//           var CGST_totalPrice28 = "";

//           var IGST_tax_percent25 = "";
//           var IGST_totalPrice25 = "";
//           var IGST_tax_percent6 = "";
//           var IGST_totalPrice6 = "";
//           var IGST_tax_percent9 = "";
//           var IGST_totalPrice9 = "";
//           var IGST_tax_percent14 = "";
//           var IGST_totalPrice14 = "";
//           var IGST_tax_percent5 = "";
//           var IGST_totalPrice5 = "";
//           var IGST_tax_percent12 = "";
//           var IGST_totalPrice12 = "";
//           var IGST_tax_percent18 = "";
//           var IGST_totalPrice18 = "";
//           var IGST_tax_percent28 = "";
//           var IGST_totalPrice28 = "";

//           var exempt = "";
//           var totalGst = iData.gst;
//           var totalGrandTotal = iData.total_payment;
//           var totalCartPriceWithoutGST = iData.totalCartPriceWithoutGST;
//           var totaldeliveryCharges = (iData.deliveryCharges ? +iData.deliveryCharges : 0) + (iData.codCharges ? +iData.codCharges : 0);
//           var totalDiscount = iData.redeemDiscount + iData.totalCouponDiscountAmount + iData.referralDiscount;

//           for (var i1 = 0; i1 < allGst.length; i1++) {
//             var allGstI = allGst[i1];
//             if (allGstI.tax_percent == null || allGstI.tax_percent == 0) {
//               exempt = 0;
//             }

//             if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 2.5) {
//               SGST_tax_percent25 = iData.totalCartPrice;
//               SGST_totalPrice25 = allGstI.totalPrice;
//               SGST_final_Price25 += Number(allGstI.totalPrice);
//               GST_final_Price5 += Number((allGstI.totalPrice * 100) / 2.5 / 2);
//             }
//             if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 6) {
//               SGST_tax_percent6 = iData.totalCartPrice;
//               SGST_totalPrice6 = allGstI.totalPrice;
//               SGST_final_Price6 += Number(allGstI.totalPrice);
//               GST_final_Price12 += Number((allGstI.totalPrice * 100) / 6 / 2);
//             }
//             if (allGstI.tax_name == "CGST" && allGstI.tax_percent == 6) {
//               CGST_tax_percent6 = iData.totalCartPrice;
//               CGST_totalPrice6 = allGstI.totalPrice;
//               CGST_final_Price6 += Number(allGstI.totalPrice);
//               GST_final_Price12 += Number((allGstI.totalPrice * 100) / 6 / 2);
//             }
//             if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 9) {
//               SGST_tax_percent9 = iData.totalCartPrice;
//               SGST_totalPrice9 = allGstI.totalPrice;
//               SGST_final_Price9 += Number(allGstI.totalPrice);
//               GST_final_Price18 += Number((allGstI.totalPrice * 100) / 9 / 2);
//             }
//             if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 14) {
//               SGST_tax_percent14 = iData.totalCartPrice;
//               SGST_totalPrice14 = allGstI.totalPrice;
//               SGST_final_Price14 += Number(allGstI.totalPrice);
//               GST_final_Price28 += Number((allGstI.totalPrice * 100) / 14 / 2);
//             }
//             if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 5) {
//               SGST_tax_percent5 = iData.totalCartPrice;
//               SGST_totalPrice5 = allGstI.totalPrice;
//               SGST_final_Price5 += Number(allGstI.totalPrice);
//             }
//             if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 12) {
//               SGST_tax_percent12 = iData.totalCartPrice;
//               SGST_totalPrice12 = allGstI.totalPrice;
//               SGST_final_Price12 += Number(allGstI.totalPrice);
//             }
//             if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 18) {
//               SGST_tax_percent18 = iData.totalCartPrice;
//               SGST_totalPrice18 = allGstI.totalPrice;
//               SGST_final_Price18 += Number(allGstI.totalPrice);
//             }
//             if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 28) {
//               SGST_tax_percent28 = iData.totalCartPrice;
//               SGST_totalPrice28 = allGstI.totalPrice;
//               SGST_final_Price28 += Number(allGstI.totalPrice);
//             }

//             if (allGstI.tax_name == "CGST" && allGstI.tax_percent == 2.5) {
//               CGST_tax_percent25 = iData.totalCartPrice;
//               CGST_totalPrice25 = allGstI.totalPrice;
//               CGST_final_Price25 += Number(allGstI.totalPrice);
//               GST_final_Price5 += Number((allGstI.totalPrice * 100) / 2.5 / 2);
//             }

//             if (allGstI.tax_name == "CGST" && allGstI.tax_percent == 9) {
//               CGST_tax_percent9 = iData.totalCartPrice;
//               CGST_totalPrice9 = allGstI.totalPrice;
//               CGST_final_Price9 += Number(allGstI.totalPrice);
//               GST_final_Price18 += Number((allGstI.totalPrice * 100) / 9 / 2);
//             }
//             if (allGstI.tax_name == "CGST" && allGstI.tax_percent == 14) {
//               CGST_tax_percent14 = iData.totalCartPrice;
//               CGST_totalPrice14 = allGstI.totalPrice;
//               CGST_final_Price14 += Number(allGstI.totalPrice);
//               GST_final_Price28 += Number((allGstI.totalPrice * 100) / 14 / 2);
//             }

//             if (allGstI.tax_name == "IGST" && allGstI.tax_percent == 5) {
//               IGST_tax_percent5 = Number((allGstI.totalPrice * 100) / 5);
//               IGST_totalPrice5 = allGstI.totalPrice;
//               IGST_final_Price5 += Number(allGstI.totalPrice);
//             }
//             if (allGstI.tax_name == "IGST" && allGstI.tax_percent == 12) {
//               IGST_tax_percent12 = Number((allGstI.totalPrice * 100) / 12);
//               IGST_totalPrice12 = allGstI.totalPrice;
//               IGST_final_Price12 += Number(allGstI.totalPrice);
//             }
//             if (allGstI.tax_name == "IGST" && allGstI.tax_percent == 18) {
//               IGST_tax_percent18 = Number((allGstI.totalPrice * 100) / 18);
//               IGST_totalPrice18 = allGstI.totalPrice;
//               IGST_final_Price18 += Number(allGstI.totalPrice);
//             }
//             if (allGstI.tax_name == "IGST" && allGstI.tax_percent == 28) {
//               IGST_tax_percent28 = Number((allGstI.totalPrice * 100) / 28);
//               IGST_totalPrice28 = allGstI.totalPrice;
//               IGST_final_Price28 += Number(allGstI.totalPrice);
//             }
//           }
//           var total =
//             +GST_final_Price5 +
//             +GST_final_Price12 +
//             +GST_final_Price18 +
//             +GST_final_Price28 +
//             +SGST_totalPrice25 +
//             +SGST_totalPrice6 +
//             +SGST_totalPrice9 +
//             +SGST_totalPrice14 +
//             +SGST_totalPrice5 +
//             +SGST_totalPrice12 +
//             +SGST_totalPrice18 +
//             +SGST_totalPrice28 +
//             +CGST_totalPrice25 +
//             +CGST_totalPrice6 +
//             +CGST_totalPrice9 +
//             +CGST_totalPrice14 +
//             +CGST_totalPrice5 +
//             +CGST_totalPrice12 +
//             +CGST_totalPrice18 +
//             +CGST_totalPrice28 +
//             +IGST_tax_percent5 +
//             +IGST_final_Price5 +
//             +IGST_tax_percent12 +
//             +IGST_final_Price12 +
//             +IGST_tax_percent18 +
//             +IGST_final_Price18 +
//             +IGST_tax_percent28 +
//             +IGST_totalPrice28;
//           var expmptValue = +total ? (+total).toFixed(3) : 0;
//           var exmpValueRound =
//             +iData.total_payment - expmptValue - ((iData.deliveryCharges ? +iData.deliveryCharges : 0) + (iData.codCharges ? +iData.codCharges : 0));
//           var totalCartPriceWithoutGST1 =
//             iData.totalCartPriceWithoutGST - (+iData.redeemDiscount + +iData.totalCouponDiscountAmount + +iData.referralDiscount);

//           if (iData.BookingStatusByAdmin == "Pending" && iData.payment == "Pending" && iData.paymentmethod == "Paytm") {
//             var BookingStatusByAdmin = "Failed";
//           } else {
//             var BookingStatusByAdmin = iData.BookingStatusByAdmin;
//           }

//           jsonData.push({
//             OrderRealDate: OrderRealDate1,
//             OrderDate: OrderDate,
//             OrderTime: OrderTime,
//             OrderID: iData.booking_code,
//             invoiceNumber: iData.invoiceNO,
//             OrderStatus: BookingStatusByAdmin,
//             paymentmethod: iData.paymentmethod,
//             payment: iData.payment,
//             CustomerName: iData.userName,
//             gstno: iData.gst_no,
//             CustomerCity: iData.booking_address.city,
//             CustomerType: iData.userType,
//             Subtotal: (+iData.total_payment).toFixed(2),
//             totalCartPriceWithoutGST: totalCartPriceWithoutGST1.toFixed(2),
//             exempt: exmpValueRound >= 1 ? exmpValueRound.toFixed(3) : 0,
//             adjustment: exmpValueRound < 1 ? exmpValueRound.toFixed(3) : 0,
//             GST_final_Price5: GST_final_Price5 ? (+GST_final_Price5).toFixed(3) : "",
//             GST_final_Price12: GST_final_Price12 ? (+GST_final_Price12).toFixed(3) : "",
//             GST_final_Price18: GST_final_Price18 ? (+GST_final_Price18).toFixed(3) : "",
//             GST_final_Price28: GST_final_Price28 ? (+GST_final_Price28).toFixed(3) : "",
//             //SGST_tax_percent25: SGST_tax_percent25,
//             SGST_totalPrice25: SGST_totalPrice25 ? (+SGST_totalPrice25).toFixed(3) : "",
//             //SGST_tax_percent6: SGST_tax_percent6,
//             SGST_totalPrice6: SGST_totalPrice6 ? (+SGST_totalPrice6).toFixed(3) : "",
//             // SGST_tax_percent9: SGST_tax_percent9,
//             SGST_totalPrice9: SGST_totalPrice9 ? (+SGST_totalPrice9).toFixed(3) : "",
//             //SGST_tax_percent14: SGST_tax_percent14,
//             SGST_totalPrice14: SGST_totalPrice14 ? (+SGST_totalPrice14).toFixed(3) : "",
//             // SGST_tax_percent5: SGST_tax_percent5,
//             SGST_totalPrice5: SGST_totalPrice5 ? (+SGST_totalPrice5).toFixed(3) : "",
//             SGST_totalPrice12: SGST_totalPrice12 ? (+SGST_totalPrice12).toFixed(3) : "",
//             SGST_totalPrice18: SGST_totalPrice18 ? (+SGST_totalPrice18).toFixed(3) : "",
//             SGST_totalPrice28: SGST_totalPrice28 ? (+SGST_totalPrice28).toFixed(3) : "",
//             CGST_totalPrice25: CGST_totalPrice25 ? (+CGST_totalPrice25).toFixed(3) : "",
//             CGST_totalPrice6: CGST_totalPrice6 ? (+CGST_totalPrice6).toFixed(3) : "",
//             CGST_totalPrice9: CGST_totalPrice9 ? (+CGST_totalPrice9).toFixed(3) : "",
//             CGST_totalPrice14: CGST_totalPrice14 ? (+CGST_totalPrice14).toFixed(3) : "",
//             CGST_totalPrice5: CGST_totalPrice5 ? (+CGST_totalPrice5).toFixed(3) : "",
//             CGST_totalPrice12: CGST_totalPrice12 ? (+CGST_totalPrice12).toFixed(3) : "",
//             CGST_totalPrice18: CGST_totalPrice18 ? (+CGST_totalPrice18).toFixed(3) : "",
//             CGST_totalPrice28: CGST_totalPrice28 ? (+CGST_totalPrice28).toFixed(3) : "",
//             IGST_tax_percent5: IGST_tax_percent5 ? (+IGST_tax_percent5).toFixed(3) : "",
//             IGST_totalPrice5: IGST_final_Price5 ? (+IGST_final_Price5).toFixed(3) : "",
//             IGST_tax_percent12: IGST_tax_percent12 ? (+IGST_tax_percent12).toFixed(3) : "",
//             IGST_totalPrice12: IGST_final_Price12 ? (+IGST_final_Price12).toFixed(3) : "",
//             IGST_tax_percent18: IGST_tax_percent18 ? (+IGST_tax_percent18).toFixed(3) : "",
//             IGST_totalPrice18: IGST_final_Price18 ? (+IGST_final_Price18).toFixed(3) : "",
//             IGST_tax_percent28: IGST_tax_percent28 ? (+IGST_tax_percent28).toFixed(3) : "",
//             IGST_totalPrice28: IGST_totalPrice28 ? (+IGST_totalPrice28).toFixed(3) : "",

//             // GST: iData.gst,
//             deliveryCharges: (iData.deliveryCharges ? +iData.deliveryCharges : 0) + (iData.codCharges ? +iData.codCharges : 0),
//             totalDiscount: +iData.redeemDiscount + +iData.totalCouponDiscountAmount + +iData.referralDiscount,
//           });
//           //console.log(jsonData)
//         }
//       }
//       //booking data end

//       //Subscription data start
//       if (subscribeJsonData.length > 0) {
//         for (var i = 0; i < subscribeJsonData.length; i++) {
//           var GST_final_Price5 = 0;
//           var GST_final_Price12 = 0;
//           var GST_final_Price18 = 0;
//           var GST_final_Price28 = 0;

//           var SGST_final_Price25 = 0;
//           var SGST_final_Price6 = 0;
//           var SGST_final_Price9 = 0;
//           var SGST_final_Price14 = 0;
//           var SGST_final_Price5 = 0;
//           var SGST_final_Price12 = 0;
//           var SGST_final_Price18 = 0;
//           var SGST_final_Price28 = 0;

//           var CGST_final_Price25 = 0;
//           var CGST_final_Price6 = 0;
//           var CGST_final_Price9 = 0;
//           var CGST_final_Price14 = 0;
//           var CGST_final_Price5 = 0;
//           var CGST_final_Price12 = 0;
//           var CGST_final_Price18 = 0;
//           var CGST_final_Price28 = 0;

//           var IGST_final_Price25 = 0;
//           var IGST_final_Price6 = 0;
//           var IGST_final_Price9 = 0;
//           var IGST_final_Price14 = 0;
//           var IGST_final_Price5 = 0;
//           var IGST_final_Price12 = 0;
//           var IGST_final_Price18 = 0;
//           var IGST_final_Price28 = 0;

//           var subscribeIData = subscribeJsonData[i];
//           var days1 = subscribeIData.dates;
//           var days = days1.length;
//           var createDate_formatted1 = moment.utc(subscribeIData.createDate).tz("Asia/Kolkata");
//           var OrderDate1 = createDate_formatted1.format("DD-MM-YYYY");
//           var OrderRealDate1 = createDate_formatted1.format("MM-DD-YYYY");
//           var OrderTime1 = createDate_formatted1.format("HH:mm A");
//           var allGst = subscribeIData.allGstLists;

//           var GST_tax_percent5 = "";
//           var GST_totalPrice5 = "";
//           var GST_tax_percent12 = "";
//           var GST_totalPrice12 = "";
//           var GST_tax_percent18 = "";
//           var GST_totalPrice18 = "";
//           var GST_tax_percent28 = "";
//           var GST_totalPrice28 = "";

//           var SGST_tax_percent25 = "";
//           var SGST_totalPrice25 = "";
//           var SGST_tax_percent6 = "";
//           var SGST_totalPrice6 = "";
//           var SGST_tax_percent9 = "";
//           var SGST_totalPrice9 = "";
//           var SGST_tax_percent14 = "";
//           var SGST_totalPrice14 = "";
//           var SGST_tax_percent5 = "";
//           var SGST_totalPrice5 = "";
//           var SGST_tax_percent12 = "";
//           var SGST_totalPrice12 = "";
//           var SGST_tax_percent18 = "";
//           var SGST_totalPrice18 = "";
//           var SGST_tax_percent28 = "";
//           var SGST_totalPrice28 = "";

//           var CGST_tax_percent25 = "";
//           var CGST_totalPrice25 = "";
//           var CGST_tax_percent6 = "";
//           var CGST_totalPrice6 = "";
//           var CGST_tax_percent9 = "";
//           var CGST_totalPrice9 = "";
//           var CGST_tax_percent14 = "";
//           var CGST_totalPrice14 = "";
//           var CGST_tax_percent5 = "";
//           var CGST_totalPrice5 = "";
//           var CGST_tax_percent12 = "";
//           var CGST_totalPrice12 = "";
//           var CGST_tax_percent18 = "";
//           var CGST_totalPrice18 = "";
//           var CGST_tax_percent28 = "";
//           var CGST_totalPrice28 = "";

//           var IGST_tax_percent25 = "";
//           var IGST_totalPrice25 = "";
//           var IGST_tax_percent6 = "";
//           var IGST_totalPrice6 = "";
//           var IGST_tax_percent9 = "";
//           var IGST_totalPrice9 = "";
//           var IGST_tax_percent14 = "";
//           var IGST_totalPrice14 = "";
//           var IGST_tax_percent5 = "";
//           var IGST_totalPrice5 = "";
//           var IGST_tax_percent12 = "";
//           var IGST_totalPrice12 = "";
//           var IGST_tax_percent18 = "";
//           var IGST_totalPrice18 = "";
//           var IGST_tax_percent28 = "";
//           var IGST_totalPrice28 = "";

//           var exempt = "";
//           var totalGst = subscribeIData.gst;
//           var totalGrandTotal = subscribeIData.total_payment;
//           var totalCartPriceWithoutGST = subscribeIData.totalCartPriceWithoutGST;
//           var totaldeliveryCharges =
//             (subscribeIData.deliveryCharges ? +subscribeIData.deliveryCharges : 0) + (subscribeIData.codCharges ? +subscribeIData.codCharges : 0);
//           var totalDiscount = subscribeIData.redeemDiscount + subscribeIData.totalCouponDiscountAmount + subscribeIData.referralDiscount;

//           for (var i1 = 0; i1 < allGst.length; i1++) {
//             var allGstI = allGst[i1];
//             if (allGstI.tax_percent == null || allGstI.tax_percent == 0) {
//               exempt = 0;
//             }

//             if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 2.5) {
//               SGST_tax_percent25 = subscribeIData.totalCartPrice;
//               SGST_totalPrice25 = allGstI.totalPrice;
//               SGST_final_Price25 += Number(allGstI.totalPrice);
//               GST_final_Price5 += Number((allGstI.totalPrice * 100) / 2.5 / 2);
//             }
//             if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 6) {
//               SGST_tax_percent6 = subscribeIData.totalCartPrice;
//               SGST_totalPrice6 = allGstI.totalPrice;
//               SGST_final_Price6 += Number(allGstI.totalPrice);
//               GST_final_Price12 += Number((allGstI.totalPrice * 100) / 6 / 2);
//             }
//             if (allGstI.tax_name == "CGST" && allGstI.tax_percent == 6) {
//               CGST_tax_percent6 = subscribeIData.totalCartPrice;
//               CGST_totalPrice6 = allGstI.totalPrice;
//               CGST_final_Price6 += Number(allGstI.totalPrice);
//               GST_final_Price12 += Number((allGstI.totalPrice * 100) / 6 / 2);
//             }
//             if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 9) {
//               SGST_tax_percent9 = subscribeIData.totalCartPrice;
//               SGST_totalPrice9 = allGstI.totalPrice;
//               SGST_final_Price9 += Number(allGstI.totalPrice);
//               GST_final_Price18 += Number((allGstI.totalPrice * 100) / 9 / 2);
//             }
//             if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 14) {
//               SGST_tax_percent14 = subscribeIData.totalCartPrice;
//               SGST_totalPrice14 = allGstI.totalPrice;
//               SGST_final_Price14 += Number(allGstI.totalPrice);
//               GST_final_Price28 += Number((allGstI.totalPrice * 100) / 14 / 2);
//             }
//             if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 5) {
//               SGST_tax_percent5 = subscribeIData.totalCartPrice;
//               SGST_totalPrice5 = allGstI.totalPrice;
//               SGST_final_Price5 += Number(allGstI.totalPrice);
//             }
//             if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 12) {
//               SGST_tax_percent12 = subscribeIData.totalCartPrice;
//               SGST_totalPrice12 = allGstI.totalPrice;
//               SGST_final_Price12 += Number(allGstI.totalPrice);
//             }
//             if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 18) {
//               SGST_tax_percent18 = subscribeIData.totalCartPrice;
//               SGST_totalPrice18 = allGstI.totalPrice;
//               SGST_final_Price18 += Number(allGstI.totalPrice);
//             }
//             if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 28) {
//               SGST_tax_percent28 = subscribeIData.totalCartPrice;
//               SGST_totalPrice28 = allGstI.totalPrice;
//               SGST_final_Price28 += Number(allGstI.totalPrice);
//             }

//             if (allGstI.tax_name == "CGST" && allGstI.tax_percent == 2.5) {
//               CGST_tax_percent25 = subscribeIData.totalCartPrice;
//               CGST_totalPrice25 = allGstI.totalPrice;
//               CGST_final_Price25 += Number(allGstI.totalPrice);
//               GST_final_Price5 += Number((allGstI.totalPrice * 100) / 2.5 / 2);
//             }

//             if (allGstI.tax_name == "CGST" && allGstI.tax_percent == 9) {
//               CGST_tax_percent9 = subscribeIData.totalCartPrice;
//               CGST_totalPrice9 = allGstI.totalPrice;
//               CGST_final_Price9 += Number(allGstI.totalPrice);
//               GST_final_Price18 += Number((allGstI.totalPrice * 100) / 9 / 2);
//             }
//             if (allGstI.tax_name == "CGST" && allGstI.tax_percent == 14) {
//               CGST_tax_percent14 = subscribeIData.totalCartPrice;
//               CGST_totalPrice14 = allGstI.totalPrice;
//               CGST_final_Price14 += Number(allGstI.totalPrice);
//               GST_final_Price28 += Number((allGstI.totalPrice * 100) / 14 / 2);
//             }

//             if (allGstI.tax_name == "IGST" && allGstI.tax_percent == 5) {
//               IGST_tax_percent5 = Number((allGstI.totalPrice * 100) / 5);
//               IGST_totalPrice5 = allGstI.totalPrice;
//               IGST_final_Price5 += Number(allGstI.totalPrice);
//             }
//             if (allGstI.tax_name == "IGST" && allGstI.tax_percent == 12) {
//               IGST_tax_percent12 = Number((allGstI.totalPrice * 100) / 12);
//               IGST_totalPrice12 = allGstI.totalPrice;
//               IGST_final_Price12 += Number(allGstI.totalPrice);
//             }
//             if (allGstI.tax_name == "IGST" && allGstI.tax_percent == 18) {
//               IGST_tax_percent18 = Number((allGstI.totalPrice * 100) / 18);
//               IGST_totalPrice18 = allGstI.totalPrice;
//               IGST_final_Price18 += Number(allGstI.totalPrice);
//             }
//             if (allGstI.tax_name == "IGST" && allGstI.tax_percent == 28) {
//               IGST_tax_percent28 = Number((allGstI.totalPrice * 100) / 28);
//               IGST_totalPrice28 = allGstI.totalPrice;
//               IGST_final_Price28 += Number(allGstI.totalPrice);
//             }
//           }
//           var total =
//             +GST_final_Price5 +
//             +GST_final_Price12 +
//             +GST_final_Price18 +
//             +GST_final_Price28 +
//             +SGST_totalPrice25 +
//             +SGST_totalPrice6 +
//             +SGST_totalPrice9 +
//             +SGST_totalPrice14 +
//             +SGST_totalPrice5 +
//             +SGST_totalPrice12 +
//             +SGST_totalPrice18 +
//             +SGST_totalPrice28 +
//             +CGST_totalPrice25 +
//             +CGST_totalPrice6 +
//             +CGST_totalPrice9 +
//             +CGST_totalPrice14 +
//             +CGST_totalPrice5 +
//             +CGST_totalPrice12 +
//             +CGST_totalPrice18 +
//             +CGST_totalPrice28 +
//             +IGST_tax_percent5 +
//             +IGST_final_Price5 +
//             +IGST_tax_percent12 +
//             +IGST_final_Price12 +
//             +IGST_tax_percent18 +
//             +IGST_final_Price18 +
//             +IGST_tax_percent28 +
//             +IGST_totalPrice28;
//           var expmptValue = +total ? (+total).toFixed(3) : 0;
//           var exmpValueRound =
//             (+subscribeIData.total_payment -
//               expmptValue -
//               ((subscribeIData.deliveryCharges ? +subscribeIData.deliveryCharges : 0) +
//                 (subscribeIData.codCharges ? +subscribeIData.codCharges : 0))) *
//             days;
//           var totalCartPriceWithoutGSTSub =
//             subscribeIData.totalCartPriceWithoutGST * days -
//             (subscribeIData.redeemDiscount + subscribeIData.totalCouponDiscountAmount + +subscribeIData.referralDiscount) * days;
//           SubscribeJsonDataArray.push({
//             OrderRealDate: OrderRealDate1,
//             OrderDate: OrderDate1,
//             OrderTime: OrderTime1,
//             OrderID: subscribeIData.SubscriptionID,
//             invoiceNumber: subscribeIData.invoiceNO,
//             OrderStatus: subscribeIData.BookingStatusByAdmin,
//             paymentmethod: subscribeIData.paymentmethod,
//             payment: subscribeIData.payment,
//             CustomerName: subscribeIData.userName,
//             gstno: subscribeIData.gst_no,
//             CustomerCity: subscribeIData.booking_address.city,
//             CustomerType: subscribeIData.userType,
//             Subtotal: subscribeIData.total_payment * days,
//             totalCartPriceWithoutGST: totalCartPriceWithoutGSTSub.toFixed(2),
//             exempt: exmpValueRound >= 1 ? exmpValueRound.toFixed(3) : 0,
//             adjustment: exmpValueRound < 1 ? exmpValueRound.toFixed(3) : 0,
//             GST_final_Price5: GST_final_Price5 ? (+GST_final_Price5 * days).toFixed(3) : "",
//             GST_final_Price12: GST_final_Price12 ? (+GST_final_Price12 * days).toFixed(3) : "",
//             GST_final_Price18: GST_final_Price18 ? (+GST_final_Price18 * days).toFixed(3) : "",
//             GST_final_Price28: GST_final_Price28 ? (+GST_final_Price28 * days).toFixed(3) : "",
//             //SGST_tax_percent25: SGST_tax_percent25,
//             SGST_totalPrice25: SGST_totalPrice25 ? (+SGST_totalPrice25 * days).toFixed(3) : "",
//             //SGST_tax_percent6: SGST_tax_percent6,
//             SGST_totalPrice6: SGST_totalPrice6 ? (+SGST_totalPrice6 * days).toFixed(3) : "",
//             // SGST_tax_percent9: SGST_tax_percent9,
//             SGST_totalPrice9: SGST_totalPrice9 ? (+SGST_totalPrice9 * days).toFixed(3) : "",
//             //SGST_tax_percent14: SGST_tax_percent14,
//             SGST_totalPrice14: SGST_totalPrice14 ? (+SGST_totalPrice14 * days).toFixed(3) : "",
//             // SGST_tax_percent5: SGST_tax_percent5,
//             SGST_totalPrice5: SGST_totalPrice5 ? (+SGST_totalPrice5 * days).toFixed(3) : "",
//             SGST_totalPrice12: SGST_totalPrice12 ? (+SGST_totalPrice12 * days).toFixed(3) : "",
//             SGST_totalPrice18: SGST_totalPrice18 ? (+SGST_totalPrice18 * days).toFixed(3) : "",
//             SGST_totalPrice28: SGST_totalPrice28 ? (+SGST_totalPrice28 * days).toFixed(3) : "",
//             CGST_totalPrice25: CGST_totalPrice25 ? (+CGST_totalPrice25 * days).toFixed(3) : "",
//             CGST_totalPrice6: CGST_totalPrice6 ? (+CGST_totalPrice6 * days).toFixed(3) : "",
//             CGST_totalPrice9: CGST_totalPrice9 ? (+CGST_totalPrice9 * days).toFixed(3) : "",
//             CGST_totalPrice14: CGST_totalPrice14 ? (+CGST_totalPrice14 * days).toFixed(3) : "",
//             CGST_totalPrice5: CGST_totalPrice5 ? (+CGST_totalPrice5 * days).toFixed(3) : "",
//             CGST_totalPrice12: CGST_totalPrice12 ? (+CGST_totalPrice12 * days).toFixed(3) : "",
//             CGST_totalPrice18: CGST_totalPrice18 ? (+CGST_totalPrice18 * days).toFixed(3) : "",
//             CGST_totalPrice28: CGST_totalPrice28 ? (+CGST_totalPrice28 * days).toFixed(3) : "",
//             IGST_tax_percent5: IGST_tax_percent5 ? (+IGST_tax_percent5 * days).toFixed(3) : "",
//             IGST_totalPrice5: IGST_final_Price5 ? (+IGST_final_Price5 * days).toFixed(3) : "",
//             IGST_tax_percent12: IGST_tax_percent12 ? (+IGST_tax_percent12 * days).toFixed(3) : "",
//             IGST_totalPrice12: IGST_final_Price12 ? (+IGST_final_Price12 * days).toFixed(3) : "",
//             IGST_tax_percent18: IGST_tax_percent18 ? (+IGST_tax_percent18 * days).toFixed(3) : "",
//             IGST_totalPrice18: IGST_final_Price18 ? (+IGST_final_Price18 * days).toFixed(3) : "",
//             IGST_tax_percent28: IGST_tax_percent28 ? (+IGST_tax_percent28 * days).toFixed(3) : "",
//             IGST_totalPrice28: IGST_totalPrice28 ? (+IGST_totalPrice28 * days).toFixed(3) : "",

//             // GST: subscribeIData.gst,
//             deliveryCharges:
//               ((subscribeIData.deliveryCharges ? +subscribeIData.deliveryCharges : 0) +
//                 (subscribeIData.codCharges ? +subscribeIData.codCharges : 0)) *
//               days,
//             totalDiscount: (subscribeIData.redeemDiscount + subscribeIData.totalCouponDiscountAmount + +subscribeIData.referralDiscount) * days,
//           });
//         }
//       }
//       //Subscription data end
//       //var finalData = jsonData;

//       const finalData = jsonData.concat(SubscribeJsonDataArray);
//       finalData.sort((a, b) => {
//         return new Date(a.OrderRealDate) - new Date(b.OrderRealDate);
//       });

//       csvWriter
//         .writeRecords(finalData) // returns a promise
//         .then(() => {
//           console.log("...Done");
//         });
//       //var report = t + ".csv";
//       var name = "Sales Report With Taxation";
//       var reportType = "SalesReportWithTaxation";
//       var fileName = report;
//       var startDate = startDateTime;
//       var endDate = endDateTime;
//       genrateReport(res, name, reportType, fileName, startDate, endDate);
//     } else if (reportType == "inhouse" || reportType == "lost" || reportType == "return") {
//       var DataFilter = {};
//       if (req.body.reportType) {
//         DataFilter["voucherType"] = req.body.reportType;
//       }
//       if (startDateTime && endDateTime) {
//         var from_date1 = new Date(startDateTime);
//         var to_date1 = new Date(endDateTime);
//         //to_date1.setDate(to_date1.getDate() + 1);
//         DataFilter["created_at"] = { $gte: from_date1, $lt: to_date1 };
//       }
//       let data = await voucherInventory
//         .find(DataFilter)
//         .populate("admin_id")
//         .populate("regionID")
//         .populate("product_id")
//         .sort({ created_at: "desc" })
//         .lean();

//       {
//         var t = Math.random();
//         var FileName = req.body.reportType;
//         var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);

//         var report = file_Name + ".csv";
//         const csvWriter = createCsvWriter({
//           path: "./public/reports/" + file_Name + ".csv",
//           header: [
//             { id: "Date", title: "Date" },
//             { id: "voucherType", title: "Type" },
//             { id: "ProductName", title: "Product Name" },
//             { id: "Region", title: "Region" },
//             { id: "Quantity", title: "Quantity" },
//             { id: "unitMeasurement", title: "Product Measurement" },
//             { id: "Note", title: "Note" },
//             { id: "admin_name", title: "Added By" },
//           ],
//         });
//         var jsonData = [];
//         for (var i = 0; i < data.length; i++) {
//           var iData = data[i];
//           var createDate_formatted = moment.utc(iData.created_at).tz("Asia/Kolkata");
//           var Dated = createDate_formatted.format("DD-MM-YYYY hh:mm A");

//           if (iData.voucherType == "inhouse") {
//             var voucherType = "In-House Usage";
//           } else if (iData.voucherType == "lost") {
//             var voucherType = "Lost/Damage Inventory";
//           } else if (iData.voucherType == "return") {
//             var voucherType = "Return Inventory";
//           }

//           jsonData.push({
//             Date: Dated,
//             voucherType: voucherType,
//             ProductName: iData.product_id.product_name,
//             Region: iData.regionID.name,
//             Quantity: iData.TotalQuantity,
//             unitMeasurement: iData.unitMeasurement,
//             Note: iData.note,
//             admin_name: iData.admin_id.username,
//           });
//         }
//         //sorting of json data
//         function dynamicSort(property) {
//           var sortOrder = 1;
//           if (property[0] === "-") {
//             sortOrder = -1;
//             property = property.substr(1);
//           }
//           return function (a, b) {
//             if (sortOrder == -1) {
//               return b[property].localeCompare(a[property]);
//             } else {
//               return a[property].localeCompare(b[property]);
//             }
//           };
//         }
//         var sortedData = jsonData.sort(dynamicSort("ProductName"));
//         //end of sorting function
//         csvWriter
//           .writeRecords(sortedData) // returns a promise
//           .then(() => {});
//         var name = req.body.reportType;
//         var reportType = report;
//         var fileName = report;
//         var startDate = startDateTime;
//         var endDate = endDateTime;
//         genrateReport(res, name, reportType, fileName, startDate, endDate);
//       }
//     }
//   } catch (error) {
//     console.log(error);
//   }
// };

//Listing ov CSV files


module.exports.CSVReportGenrate = async function (req, res) {
  try {
    console.log(req.body);
    var startDateTime = req.body.startDateTime;
    var endDateTime = req.body.endDateTime;
    var reportType = req.body.reportType;
    // var todayDate = new Date();
    var start_date_time = new Date(`${startDateTime.split(" ")[0]}T${startDateTime.split(" ")[1]}:00.000Z`);
    var end_date_time = new Date(`${endDateTime.split(" ")[0]}T${endDateTime.split(" ")[1]}:00.000Z`);
    if (reportType != "RemainQuantityReport") {
      if (startDateTime == "" || !startDateTime || startDateTime == undefined || startDateTime == null) {
        common.formValidate("startDateTime", res);
        return false;
      }
      if (endDateTime == "" || !endDateTime || endDateTime == undefined || endDateTime == null) {
        common.formValidate("endDateTime", res);
        return false;
      }
    }

    if (reportType == "" || !reportType || reportType == undefined || reportType == null) {
      common.formValidate("reportType", res);
      return false;
    }

    if (reportType == "CustomerDataReport") {
      var date = new Date(endDateTime);
      date.setDate(date.getDate() + 1);
      bookingDataBase
        .aggregate(
          [
            {
              $match: {
                createDate: {
                  $gte: new Date(startDateTime),
                  $lte: new Date(endDateTime),
                },
                BookingStatusByAdmin: { $ne: "Failed" },
              },
            },

            {
              $group: {
                //_id: "$user_id",
                _id: {
                  user_id: "$user_id",
                  userName: "$userName",
                  userEmail: "$userEmail",
                  userMobile: "$userMobile",
                  userType: "$userType",
                },
                details: { $push: "$$ROOT" },
                TotalOrder: { $sum: 1 },
                TotalAmount: { $sum: "$total_payment" },
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "_id.user_id",
                foreignField: "_id",
                as: "userData",
              },
            },
            {
              $lookup: {
              from: "admins",
              localField: "userData.sales_person",
              foreignField: "_id",
              as: "salesPerson",
            },
            }
          ],
          { allowDiskUse: true }
        )
        .exec(function (err, array2) {
          if (err) {
            res.status(500).json(err);
          } else if (!array2) {
            res.status(400).json({
              message: "error",
              data: "",
              code: 0,
            });
          }
          var t = Math.random();
          var FileName = "Customer_Data";
          var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
          var report = file_Name + ".csv";

          const csvWriter = createCsvWriter({
            path: "./public/reports/" + file_Name + ".csv",
            header: [
              {
                id: "CustomerName",
                title: "Customer Name",
              },
              {
                id: "CustomerPhone",
                title: "Customer Phone",
              },
              // {
              //   id: "creditLimit",
              //   title: "Credit Limit",
              // },
              // {
              //   id: "creditUsed",
              //   title: "Credit Used",
              // },
              {
                id: "CustomerEmail",
                title: "Customer Email",
              },
              {
                id: "AsignedPerson",
                title: "Asigned Person",
              },
              {
                id: "CustomerTpye",
                title: "Customer Type",
              },
              {
                id: "LastTransaction",
                title: "Last Transaction",
              },
              {
                id: "LastTransactionSource",
                title: "Last Transaction Source",
              },
              {
                id: "LastTransactionDays",
                title: "Last Transaction Days",
              },
              { id: "LastAddress", title: "Last Address" },
              {
                id: "TotalOrders",
                title: "Total Orders",
              },
              { id: "Revenue", title: "Revenue" },
              {
                id: "AverageBasketSize",
                title: "Average Basket Size",
              },
            ],
          });
          var result;
          if (req.body?.customer_type) {
            result = array2.filter((cur) => cur._id.userType == req.body?.customer_type);
          } else {
            result = array2;
          }
          // console.log(result);
          var jsonData = [];
          for (var i = 0; i < result.length; i++) {
            if (!result[i].details) {
              var totalOrder = null;
              var TotalAmount = null;
              var LastTransactionDate = null;
              var LastTransactionSource = null;
              var LastTransactionDays = null;
              var LastAddress = null;
              var TotalOrders = null;
              var Revenue = null;
              var AverageBasketSize1 = null;
              var LOrderAddress = null;
            } else {
              var LastOrderDate = result[i].details;
              var lastOrderDate = LastOrderDate[LastOrderDate.length - 1];
              var LastTransaction = lastOrderDate.createDate;
              // var CustomerTpye = result[i].userType;

              var LastDate1 = moment.utc(LastTransaction).tz("Asia/Kolkata");
              var LastDate = LastDate1.format("MM/DD/YYYY");
              var LastTransactionDate = LastDate1.format("MM/DD/YYYY HH:mm A");
              var LastTransactionDateCol = LastDate1.format("DD-MM-YYYY");

              var TodayDate = new Date();
              var TodayDate = moment.utc(TodayDate).tz("Asia/Kolkata");
              var TodayDate = TodayDate.format("MM/DD/YYYY");
              var date_diff_indays = function (date1, date2) {
                dt1 = new Date(date1);
                dt2 = new Date(date2);
                return Math.floor(
                  (Date.UTC(dt2.getFullYear(), dt2.getMonth(), dt2.getDate()) - Date.UTC(dt1.getFullYear(), dt1.getMonth(), dt1.getDate())) /
                    (1000 * 60 * 60 * 24)
                );
              };
              var LastTransactionDays = date_diff_indays(LastDate, TodayDate);

              var ab = result[i].TotalAmount / result[i].TotalOrder;
              var bc = result[i].TotalAmount;
              var LastTransactionSource = lastOrderDate.paymentmethod;
              var TotalOrders = result[i].TotalOrder;
              var TotalAmount = bc.toFixed(1);
              var AverageBasketSize1 = ab.toFixed(1);
              var LOrderAddress = lastOrderDate.booking_address.locality;
            }
            jsonData.push({
              CustomerName: result[i]._id.userName,
              CustomerPhone: result[i]._id.userMobile,
              CustomerEmail: result[i]._id.userEmail,
              AsignedPerson: result[i].salesPerson.length > 0 ? result[i].salesPerson[0].username : "N/A",
              CustomerTpye: result[i]._id.userType,
              // creditLimit: result[i]._id.creditLimit,
              // creditUsed: result[i]._id.creditUsed,
              LastTransaction: LastTransactionDateCol,
              LastTransactionSource: LastTransactionSource,
              LastTransactionDays: LastTransactionDays,
              LastAddress: LOrderAddress,
              TotalOrders: TotalOrders,
              Revenue: TotalAmount,
              AverageBasketSize: AverageBasketSize1,
            });
          }

          csvWriter
            .writeRecords(jsonData) // returns a promise
            .then(() => {
              console.log("...Done");
            });
          var name = "Customer Data Report";
          var reportType = "CustomerDataReport";
          var fileName = report;
          var startDate = startDateTime;
          var endDate = endDateTime;
          genrateReport(res, name, reportType, fileName, startDate, endDate);
          // res
          //     .status(200)
          //     .json({"message":'ok',"data":report,"code":0});
          //     return;
        });
    }
    if (reportType == "ItemSalesDataWithRevenueReport") {
      bookingDataBase
        .aggregate([
          {
            $match: {
              BookingStatusByAdmin: {
                $in: ["Accepted", "Out For Delivery", "Delivered"],
              },
              createDate: {
                $gte: new Date(startDateTime),
                $lte: new Date(endDateTime),
              },
            },
          },
          {
            $unwind: {
              path: "$bookingdetail",
            },
          },

          {
            $group: {
              _id: "$bookingdetail.product_id._id", // This is the selector for the grouping process (in our case it's the id)
              product_id: { $first: "$bookingdetail.product_id._id" },
              NoOfSaleofProduct: {
                $sum: {
                  $multiply: [
                    { $toDouble: "$bookingdetail.qty" },
                    {
                      $cond: [
                        { $eq: ["$bookingdetail.without_package", false] },
                        { $toDouble: "$bookingdetail.packet_size" },
                        { $toDouble: "$bookingdetail.unitQuantity" },
                      ],
                    },
                  ],
                },
              },

              ValueSold: {
                $sum: {
                  $cond: [
                    {
                      $gt: [
                        {
                          $toDouble: "$bookingdetail.itemDiscountAmountBeforeGST",
                        },
                        0,
                      ],
                    },
                    { $toDouble: "$bookingdetail.itemDiscountAmountBeforeGST" },
                    { $toDouble: "$bookingdetail.totalPriceBeforeGST" },
                  ],
                },
              }, // self explanatory
            },
          },
          {
            $sort: { NoOfSaleofProduct: -1 },
          },
          {
            $lookup: {
              from: "products",
              localField: "product_id",
              foreignField: "_id",
              as: "productDetail",
            },
          },
          {
            $match: {
              productDetail: { $ne: [] },
            },
          },
          { $unwind: "$productDetail" },
          {
            $lookup: {
              from: "unit_measurements",
              localField: "productDetail.unitMeasurement",
              foreignField: "_id",
              as: "productDetail.unitMeasurement",
            },
          },
          { $unwind: "$productDetail.unitMeasurement" },
          {
            $lookup: {
              from: "categories",
              localField: "productDetail.product_categories",
              foreignField: "_id",
              as: "productDetail.product_categories",
            },
          },
          {
            $project: {
              _id: 1,
              productDetail: "$productDetail",
              NoOfSaleofProduct: 1,
              ValueSold: 1,
            },
          },
        ])
        .exec(function (err, array2) {
          if (err) {
            res.status(500).json(err);
          } else if (!array2) {
            res.status(400).json({
              message: "error",
              data: "",
              code: 0,
            });
          }
          var t = Math.random();
          var FileName = "Item Sales Data With Revenue";
          var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
          var report = file_Name + ".csv";

          const csvWriter = createCsvWriter({
            path: "./public/reports/" + file_Name + ".csv",
            header: [
              { id: "Category", title: "Category" },
              {
                id: "ProductName",
                title: "Product Name",
              },
              {
                id: "ValueSold",
                title: "Value Sold",
              },
              {
                id: "QuantitySold",
                title: "Quantity Sold",
              },
              {
                id: "UnitMeasurement",
                title: "Unit Measurement",
              },
            ],
          });
          var result = array2;
          var jsonData = [];
          if (result) {
            for (var i = 0; i < result.length; i++) {
              if (result[i].productDetail.product_categories) {
                var product_categoriesArray = [];
                var product_categories = result[i].productDetail.product_categories;
                for (var i1 = 0; i1 < product_categories.length; i1++) {
                  product_categoriesArray.push(product_categories[i1].category_name);
                }
              }
              jsonData.push({
                Category: product_categoriesArray || null,
                ProductName: result[i].productDetail.product_name,
                ValueSold: result[i].ValueSold.toFixed(3),
                QuantitySold: result[i].NoOfSaleofProduct,
                UnitMeasurement: result[i].productDetail.unitMeasurement ? result[i].productDetail.unitMeasurement.name : "",
              });
            }
          } else {
            jsonData.push({
              Category: null,
              ProductName: null,
              ValueSold: null,
              QuantitySold: null,
            });
          }

          csvWriter
            .writeRecords(jsonData) // returns a promise
            .then(() => {
              console.log("...Done");
            });
          var name = "Item Sales Data With Revenue Report";
          var reportType = "ItemSalesDataWithRevenueReport";
          var fileName = report;
          var startDate = startDateTime;
          var endDate = endDateTime;
          genrateReport(res, name, reportType, fileName, startDate, endDate);
          // res
          //     .status(200)
          //     .json({"message":'ok',"data":report,"code":0});
          //     return;
        });
    }
    if (reportType == "FirstTimeCustomerDataReport") {
      var date = new Date(endDateTime);
      date.setDate(date.getDate() + 1);
      User.aggregate(
        [
          { $match: {
        //otp_verified: true,
        NoOfOrder: 1,
        created_at: {
          $gte: new Date(startDateTime),
          $lte: new Date(endDateTime),
        },
      } },
          {
            $lookup: {
              from: "admins",
              localField: "sales_person",
              foreignField: "_id",
              as: "salesPerson",
            },
          },
        ],
        {
          allowDiskUse: true,
        }
      )
      // User.find({
      //   //otp_verified: true,
      //   NoOfOrder: 1,
      //   created_at: {
      //     $gte: new Date(startDateTime),
      //     $lte: new Date(endDateTime),
      //   },
      // })
      .exec(function (err, array1) {
          var usersData = [];
          for (var i = 0; i < array1.length; i++) {
            usersData.push(array1[i]._id);
          }
          bookingDataBase
            .aggregate([
              { $match: { user_id: { $in: usersData } } },
              {
                $group: {
                  _id: "$user_id",
                  details: { $push: "$$ROOT" },
                  TotalOrder: { $sum: 1 },
                  TotalAmount: { $sum: "$total_payment" },
                },
              },
             
            ], { allowDiskUse: true })
            .exec(function (err, array2) {
              if (err) {
                res.status(500).json(err);
              } else if (!array2) {
                res.status(400).json({
                  message: "error",
                  data: "",
                  code: 0,
                });
              }
              var t = Math.random();
              var FileName = "First_Time_Customer";
              var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
              var report = file_Name + ".csv";

              const csvWriter = createCsvWriter({
                path: "./public/reports/" + file_Name + ".csv",
                header: [
                  {
                    id: "CustomerName",
                    title: "Customer Name",
                  },
                  {
                    id: "CustomerPhone",
                    title: "Customer Phone",
                  },
                  {
                    id: "CustomerEmail",
                    title: "Customer Email",
                  },
                  {
                    id: "CustomerType",
                    title: "Customer Type",
                  },
                  {
                    id: "AsignedPerson",
                    title: "Asigned Person",
                  },
                  {
                    id: "LastTransaction",
                    title: "Last Transaction Date",
                  },
                  {
                    id: "LastTransactionSource",
                    title: "Payment Method",
                  },
                  {
                    id: "LastTransactionDays",
                    title: "Last Transaction Days",
                  },
                  { id: "LastAddress", title: "Last Address" },
                  {
                    id: "TotalOrders",
                    title: "Total Orders",
                  },
                  { id: "items", title: "items" },
                  { id: "Revenue", title: "Revenue" },
                  // {
                  //     id: "AverageBasketSize",
                  //     title: "Average Basket Size",
                  // },
                ],
              });
              const obj = {
                part1: array1,
                part2: array2,
              };
              const mergeObject = (obj = {}) => {
                let result = [];
                result = Object.keys(obj).reduce(
                  (function (hash) {
                    return function (r, k) {
                      obj[k].forEach(function (o) {
                        if (!hash[o._id]) {
                          hash[o._id] = {};
                          r.push(hash[o._id]);
                        }
                        Object.keys(o).forEach(function (l) {
                          hash[o._id][l] = o[l];
                        });
                      });
                      return r;
                    };
                  })(Object.create(null)),
                  []
                );
                return result;
              };

              var result = mergeObject(obj);

              var jsonData = [];
              for (var i = 0; i < result.length; i++) {
                console.log(result[i])
                if (!result[i].details) {
                  var totalOrder = null;
                  var TotalAmount = null;
                  var LastTransactionDate = null;
                  var LastTransactionSource = null;
                  var LastTransactionDays = null;
                  var LastAddress = null;
                  var TotalOrders = null;
                  var Revenue = null;
                  var AverageBasketSize = null;
                  var LOrderAddress = null;
                  var items = null;
                } else {
                  var LastOrderDate = result[i].details;
                  var lastOrderDate = LastOrderDate[LastOrderDate.length - 1];
                  var LastTransaction = lastOrderDate.createDate;

                  var LastDate1 = moment.utc(LastTransaction).tz("Asia/Kolkata");
                  var LastDate = LastDate1.format("MM/DD/YYYY");
                  var LastTransactionDate = LastDate1.format("MM/DD/YYYY HH:mm A");
                  var LastTransactionDateShow = LastDate1.format("DD-MM-YYYY");

                  var TodayDate = new Date();
                  var TodayDate = moment.utc(TodayDate).tz("Asia/Kolkata");
                  var TodayDate = TodayDate.format("MM/DD/YYYY");
                  var date_diff_indays = function (date1, date2) {
                    dt1 = new Date(date1);
                    dt2 = new Date(date2);
                    return Math.floor(
                      (Date.UTC(dt2.getFullYear(), dt2.getMonth(), dt2.getDate()) - Date.UTC(dt1.getFullYear(), dt1.getMonth(), dt1.getDate())) /
                        (1000 * 60 * 60 * 24)
                    );
                  };
                  var LastTransactionDays = date_diff_indays(LastDate, TodayDate);

                  var LastTransactionSource = lastOrderDate.paymentmethod;
                  var TotalOrders = result[i].TotalOrder;
                  var TotalAmount = result[i].TotalAmount;
                  var LOrderAddress = lastOrderDate.booking_address.address;

                  var itemFor = result[i].details;
                  for (var i2 = 0; i2 < itemFor.length; i2++) {
                    var BookingDetail = itemFor[i2].bookingdetail;
                    var itemsArray = [];
                    // for (var i3 = 0; i3 < bookingDetail.length; i3++) {
                    //     var ItemQuantity;
                    //     if (bookingDetail[i3].without_package == false) {
                    //         ItemQuantity = bookingDetail[i3].packetLabel + " - " + bookingDetail[i3].qty;
                    //     } else {
                    //         ItemQuantity = bookingDetail[i3].unitQuantity + "" + bookingDetail[i3].unitMeasurement + " - " + bookingDetail[i3].qty;
                    //     }

                    //     itemsArray.push(bookingDetail[i3].product_name + " " + ItemQuantity);
                    // }
                    for (var z = 0; z < BookingDetail.length; z++) {
                      var BookingDetailZ = BookingDetail[z];
                      if (BookingDetailZ.TypeOfProduct == "group") {
                        for (let j = 0; j < BookingDetailZ.groupData.length; j++) {
                          let set = BookingDetailZ.groupData[j];
                          let setQty = 0;
                          for (let k = 0; k < set.sets.length; k++) {
                            let product_name = set.sets[k].product.product_name;
                            var ItemQuantity =
                              (set.sets[k].package
                                ? set.sets[k].package.packetLabel
                                : set.sets[k].unitQuantity + " " + BookingDetailZ.unitMeasurement) *
                              (set.sets[k].qty * BookingDetailZ.qty);
                            itemsArray.push(product_name + " " + ItemQuantity);
                          }
                        }
                      } else {
                        var product_name = BookingDetailZ.product_name;
                        var ItemQuantity =
                          (BookingDetailZ.without_package
                            ? BookingDetailZ.unitQuantity + " " + BookingDetailZ.unitMeasurement
                            : BookingDetailZ.packetLabel) +
                          " - " +
                          BookingDetailZ.qty;
                        itemsArray.push(product_name + " " + ItemQuantity);
                      }
                    }
                  }
                }
                jsonData.push({
                  CustomerName: result[i].name,
                  AsignedPerson: result[i].salesPerson.length > 0 ? result[i].salesPerson[0].username : "N/A",
                  CustomerPhone: result[i].contactNumber,
                  CustomerEmail: result[i].email,
                  CustomerType: result[i]?.user_type,
                  LastTransaction: LastTransactionDateShow,
                  LastTransactionSource: LastTransactionSource,
                  LastTransactionDays: LastTransactionDays,
                  LastAddress: LOrderAddress,
                  TotalOrders: TotalOrders,
                  items: itemsArray,
                  Revenue: TotalAmount,
                  //AverageBasketSize: AverageBasketSize,
                });
              }

              csvWriter
                .writeRecords(jsonData) // returns a promise
                .then(() => {
                  console.log("...Done");
                });
              //var report = t + ".csv";

              var name = "First Time Customer Data Report";
              var reportType = "FirstTimeCustomerDataReport";
              var fileName = report;
              var startDate = startDateTime;
              var endDate = endDateTime;
              genrateReport(res, name, reportType, fileName, startDate, endDate);
              // res
              //     .status(200)
              //     .json({"message":'ok',"data":report,"code":0});
              //     return;
            });
        });
    } else if (reportType == "Inventorylist") {
      var date = new Date(endDateTime);
      date.setDate(date.getDate() + 1);
      var data = await inventoryItemTable.aggregate([
        {
          $match: {
            created_at: {
              $gte: new Date(startDateTime),
              $lt: new Date(endDateTime),
            },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "product_id",
            foreignField: "_id",
            as: "product_id",
          },
        },
        { $unwind: "$product_id" },
        {
          $lookup: {
            from: "categories",
            localField: "product_id.product_categories",
            foreignField: "_id",
            as: "product_categories",
          },
        },
        {
          $group: {
            _id: { product_name: "$product_name" },
            product_measurment: { $first: "$product_measurment" },
            product_categories: { $first: "$product_categories" },
            product_name: { $first: "$product_name" },
            productQuantity: { $sum: "$productQuantity" },
            bookingQuantity: { $sum: "$bookingQuantity" },
            availableQuantity: { $sum: "$availableQuantity" },
            lostQuantity: { $sum: "$lostQuantity" },
            returnQuantity: { $sum: "$returnQuantity" },
            inhouseQuantity: { $sum: "$inhouseQuantity" },
            averageCost: { $sum: "$product_costPrice" },
            totalCost: { $sum: "$itemTotalPrice" },
          },
        },
      ]);
      if (data) {
        var t = Math.random();
        var FileName = "Inventory";
        var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
        var report = file_Name + ".csv";

        const csvWriter = createCsvWriter({
          path: "./public/reports/" + file_Name + ".csv",
          header: [
            { id: "category", title: "category" },
            { id: "ProductName", title: "Product Name" },
            { id: "unitMeasurement", title: "Product Measurement" },
            { id: "productQuantity", title: "Purchased Quantity" },
            { id: "AvailableQuantity", title: "Available Quantity" },
            { id: "BookingQuantity", title: "Booked Quantity" },
            { id: "inhouseQuantity", title: "Inhouse Quantity" },
            { id: "lostQuantity", title: "Lost Quantity" },
            { id: "returnQuantity", title: "Return Quantity" },
            { id: "averageCost", title: "Average Cost Price" },
            { id: "totalCost", title: "Total Cost Price" },
          ],
        });
        var jsonData = [];
        for (var i = 0; i < data.length; i++) {
          var iData = data[i];
          if (iData.product_categories) {
            var product_categoriesArray = [];
            var product_categories = iData.product_categories;
            for (var i1 = 0; i1 < product_categories.length; i1++) {
              product_categoriesArray.push(product_categories[i1].category_name);
            }
          }
          var cost = iData.totalCost ? iData.totalCost.toFixed(2) / iData.productQuantity : 0;
          jsonData.push({
            category: product_categoriesArray,
            ProductName: iData.product_name,
            unitMeasurement: iData.product_measurment,
            productQuantity: iData.productQuantity,
            AvailableQuantity: iData.availableQuantity,
            BookingQuantity: iData.bookingQuantity,
            inhouseQuantity: iData.inhouseQuantity,
            lostQuantity: iData.lostQuantity,
            returnQuantity: iData.returnQuantity,
            averageCost: cost.toFixed(2),
            totalCost: iData.totalCost ? iData.totalCost.toFixed(2) : 0,
          });
        }
        if (jsonData.length > 0) {
          //sorting of json data
          function dynamicSort(property) {
            var sortOrder = 1;

            if (property[0] === "-") {
              sortOrder = -1;
              property = property.substr(1);
            }

            return function (a, b) {
              if (sortOrder == -1) {
                return b[property].localeCompare(a[property]);
              } else {
                return a[property].localeCompare(b[property]);
              }
            };
          }
          var finalData = jsonData.sort(dynamicSort("ProductName"));
          //end of sorting function
        } else {
          var finalData = [];
        }

        csvWriter
          .writeRecords(finalData) // returns a promise
          .then(() => {
            console.log("...Done");
          });
        //var report = t + ".csv";
        var name = "Inventory list";
        var reportType = "Inventorylist";
        var fileName = report;
        var startDate = startDateTime;
        var endDate = endDateTime;
        genrateReport(res, name, reportType, fileName, startDate, endDate);
      }
    } else if (reportType == "RemainQuantityReport") {
      var data = await inventoryItemTable.aggregate([
        {
          $lookup: {
            from: "regions",
            localField: "region",
            foreignField: "_id",
            as: "region",
          },
        },
        { $unwind: "$region" },
        {
          $lookup: {
            from: "products",
            localField: "product_id",
            foreignField: "_id",
            as: "product_id",
          },
        },
        { $unwind: "$product_id" },
        {
          $lookup: {
            from: "categories",
            localField: "product_id.product_categories",
            foreignField: "_id",
            as: "product_categories",
          },
        },
        {
          $group: {
            _id: { product_id: "$product_id", region: "$region" },
            variant_name:{ $first: "$variant_name" },
            product_measurment: { $first: "$product_measurment" },
            product_categories: { $first: "$product_categories" },
            product_name: { $first: "$product_name" },
            region: { $first: "$region" },

            productQuantity: { $sum: "$productQuantity" },
            availableQuantity: { $sum: "$availableQuantity" },
            bookingQuantity: { $sum: "$bookingQuantity" },
            inhouseQuantity: { $sum: "$inhouseQuantity" },
            returnQuantity: { $sum: "$returnQuantity" },
            lostQuantity: { $sum: "$lostQuantity" },
          },
        },
      ]);
      if (data) {
        var t = Math.random();
        var FileName = "Available_Quantity_Report";
        // var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
        var file_Name = FileName + " (" + moment(new Date()).format("DD-MM-YYYY hh:mm a") + ")";
        var report = file_Name + ".csv";

        const csvWriter = createCsvWriter({
          path: "./public/reports/" + file_Name + ".csv",
          header: [
            { id: "Category", title: "Category" },
            { id: "ProductName", title: "Product Name" },
            { id: "Region", title: "Region" },
            { id: "TotalQuantity", title: "Total Quantity" },
            { id: "ProductMeasurment", title: "Product Measurment" },
            { id: "AvailableQuantity", title: "Available Quantity" },
            { id: "bookingQuantity", title: "Sold Quantity" },
            { id: "inhouseQuantity", title: "Inhouse Quantity" },
            { id: "returnQuantity", title: "Return Quantity" },
            { id: "lostQuantity", title: "Lost Quantity" },
          ],
        });
        var jsonData = [];
        for (var i = 0; i < data.length; i++) {
          var iData = data[i];
          if (iData.product_categories) {
            var product_categoriesArray = [];
            var product_categories = iData.product_categories;
            for (var i1 = 0; i1 < product_categories.length; i1++) {
              product_categoriesArray.push(product_categories[i1].category_name);
            }
          }

          jsonData.push({
            Category: product_categoriesArray,
            ProductName: iData.product_name,
            Region: iData.region.name,
            TotalQuantity: iData.productQuantity,
            ProductMeasurment: iData.product_measurment,
            AvailableQuantity: iData.availableQuantity,
            bookingQuantity: iData.bookingQuantity,
            inhouseQuantity: iData.inhouseQuantity,
            lostQuantity: iData.lostQuantity,
            returnQuantity: iData.returnQuantity,
          });
        }
        if (jsonData.length > 0) {
          //sorting of json data
          function dynamicSort(property) {
            var sortOrder = 1;

            if (property[0] === "-") {
              sortOrder = -1;
              property = property.substr(1);
            }

            return function (a, b) {
              if (sortOrder == -1) {
                return b[property].localeCompare(a[property]);
              } else {
                return a[property].localeCompare(b[property]);
              }
            };
          }
          var finalData = jsonData.sort(dynamicSort("ProductName"));
          //end of sorting function
          //sum values, and merge object values ​with the same id into a new array star
        } else {
          var finalData = [];
        }

        csvWriter
          .writeRecords(finalData) // returns a promise
          .then(() => {
            console.log("...Done");
          });
        //var report = t + ".csv";
        var name = "Available Quantity list";
        var reportType = "AvailableQuantitylist";
        var fileName = report;
        var startDate = startDateTime;
        var endDate = endDateTime;
        genrateReport(res, name, reportType, fileName, startDate, endDate);
      }
    } else if (reportType == "BillSupplier") {
      var DataFilter = {};
      if (req.body.supplier_id) {
        DataFilter["supplier_id"] = req.body.supplier_id;
      }
      if (startDateTime && endDateTime) {
        var startDateTime = new Date(startDateTime);
        var endDateTime = new Date(endDateTime);
        //to_date1.setDate(to_date1.getDate() + 1);
        DataFilter["created_at"] = { $gte: startDateTime, $lte: endDateTime };
      }

      inventoryDataBase
        .find(DataFilter)
        .populate("supplier_id")
        .lean()
        .exec(function (err, data) {
          if (err) {
            res.status(400).json(err);
          } else {
            var t = Math.random();
            var FileName = "BillSupplier";
            var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
            var report = file_Name + ".csv";

            const csvWriter = createCsvWriter({
              path: "./public/reports/" + file_Name + ".csv",
              header: [
                { id: "Date", title: "Date" },
                { id: "Time", title: "Time" },
                { id: "InvoiceNumber", title: "Bill No." },
                { id: "supplier_id", title: "Supplier" },
                { id: "InvoiceDate", title: "Bill Date" },
                { id: "InvoiceAmount", title: "Bill Amount" },
                { id: "InvoiceDueDate", title: "Bill DueDate" },
                { id: "paymentStatus", title: "Payment Status" },
                { id: "paymentMethod", title: "Payment Method" },
                { id: "admin_name", title: "Bill Added By" },
                { id: "paymentUpdateByAdminID", title: "Payment Update By" },
              ],
            });
            var jsonData = [];
            for (var i = 0; i < data.length; i++) {
              var DataI = data[i];
              if (DataI.paymentUpdateByAdminID) {
                var paymentUpdateByAdminID = DataI.paymentUpdateByAdminID.name;
              } else {
                var paymentUpdateByAdminID = "";
              }
              if (DataI.supplier_id) {
                var supplier_id = DataI.supplier_id.name;
              } else {
                var supplier_id = null;
              }

              var TodayDate1 = new Date();
              var TodayDate = TodayDate1.toISOString().split("T")[0];
              var InvoiceDueDate1 = new Date(DataI.InvoiceDueDate);
              var InvoiceDueDate = InvoiceDueDate1.toISOString().split("T")[0];
              var paymentStatus;
              if (DataI.paymentStatus == "pending" || DataI.paymentStatus == null) {
                if (TodayDate < InvoiceDueDate) {
                  paymentStatus = DataI.paymentStatus == "pending" ? "Pending" : DataI.paymentStatus;
                } else if (TodayDate > InvoiceDueDate) {
                  paymentStatus = "Over Due";
                } else if (TodayDate == InvoiceDueDate) {
                  paymentStatus = "Due";
                }
              } else if (DataI.paymentStatus == "Complete") {
                paymentStatus = "Complete";
              }

              var InvoiceDateFor = moment.utc(DataI.InvoiceDate).tz("Asia/Kolkata");
              var InvoiceDate = InvoiceDateFor.format("DD-MM-YYYY");

              var BillDueDateFor = moment.utc(DataI.InvoiceDueDate).tz("Asia/Kolkata");
              var BillDueDate = BillDueDateFor.format("DD-MM-YYYY");

              var DateFor = moment.utc(DataI.Date).tz("Asia/Kolkata");
              var DateShow = DateFor.format("DD-MM-YYYY");
              //+ " - " + paymentUpdateByAdminID
              jsonData.push({
                Date: DateShow,
                Time: DataI.Time,
                InvoiceNumber: DataI.InvoiceNumber,
                supplier_id: supplier_id,
                InvoiceDate: InvoiceDate,
                InvoiceAmount: DataI.InvoiceAmount,
                InvoiceDueDate: BillDueDate,
                paymentStatus: paymentStatus,
                paymentMethod: DataI.paymentMethod,
                admin_name: DataI.admin_name,
                paymentUpdateByAdminID: paymentUpdateByAdminID,
              });
            }
            //end of sorting function
            csvWriter
              .writeRecords(jsonData) // returns a promise
              .then(() => {
                console.log("...Done");
              });
            //var report = t + ".csv";
            var name = "Bill/Supplier";
            var reportType = "BillSupplier";
            var fileName = report;
            var startDate = startDateTime;
            var endDate = endDateTime;
            genrateReport(res, name, reportType, fileName, startDate, endDate);
          }
        });
    } else if (reportType == "ItemSalesConsolidatedlist") {
      if (startDateTime && endDateTime) {
        var from_date1 = new Date(startDateTime);
        var to_date1 = new Date(endDateTime);
        //to_date1.setDate(to_date1.getDate() + 1);
      }
      bookingDataBase
        .find({
          // createDate: {
          //   $gte: from_date1,
          //   $lt: to_date1,
          // },
          $and: [
            {
              $or: [
                {
                  BookingStatusByAdmin: "Accepted",
                },
                {
                  BookingStatusByAdmin: "Out For Delivery",
                },
                {
                  BookingStatusByAdmin: "Pending",
                },
              ],
            },
            {
              createDate: {
                $gte: from_date1,
                $lt: to_date1,
              },
            },
          ],
        })
        .exec(function (err, data) {
          var t = Math.random();
          var FileName = "ItemSalesConsolidatedlist";
          var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
          var report = file_Name + ".csv";

          const csvWriter = createCsvWriter({
            path: "./public/reports/" + file_Name + ".csv",
            header: [
              { id: "category", title: "category" },
              { id: "hsnCode", title: "HSN" },
              { id: "ProductName", title: "Product Name" },
              { id: "Packaging", title: "Packaging" },
              { id: "ItemQuantity", title: "QTY" },
            ],
          });
          var jsonData = [];
          for (var i = 0; i < data.length; i++) {
            var iData = data[i];

            var BookingDetail = iData.bookingdetail;
            for (var z = 0; z < BookingDetail.length; z++) {
              var BookingDetailZ = BookingDetail[z];
              if (BookingDetailZ.TypeOfProduct == "group") {
                for (let j = 0; j < BookingDetailZ.groupData.length; j++) {
                  let set = BookingDetailZ.groupData[j];
                  let setQty = 0;
                  for (let k = 0; k < set.sets.length; k++) {
                    var product_categoriesArray = [];
                    if (BookingDetailZ.product_categories) {
                      var product_categories = BookingDetailZ.product_categories;
                      for (var i1 = 0; i1 < product_categories.length; i1++) {
                        product_categoriesArray.push(product_categories[i1].category_name);
                      }
                    }
                    let product_name = set.sets[k].product.product_name;
                    var ItemQuantity = set.sets[k].package
                      ? set.sets[k].package.packetLabel
                      : set.sets[k].unitQuantity + " " + set.sets[k].unitMeasurement;
                    var qty = set.sets[k].qty * BookingDetailZ.qty;
                    if (qty > 0) {
                      jsonData.push({
                        category: product_categoriesArray,
                        hsnCode: set.sets[k].product.hsnCode,
                        ProductName: product_name,
                        Packaging: ItemQuantity,
                        ItemQuantity: set.sets[k].qty * BookingDetailZ.qty,
                      });
                    }
                  }
                }
              } else {
                var product_categoriesArray = [];
                if (BookingDetailZ.product_categories) {
                  var product_categories = BookingDetailZ.product_categories;
                  for (var i1 = 0; i1 < product_categories.length; i1++) {
                    product_categoriesArray.push(product_categories[i1].category_name);
                  }
                }
                var product_name = BookingDetailZ.product_name;
                var ItemQuantity = BookingDetailZ.without_package
                  ? BookingDetailZ.unitQuantity + " " + BookingDetailZ.unitMeasurement
                  : BookingDetailZ.packetLabel;

                jsonData.push({
                  category: product_categoriesArray,
                  hsnCode: BookingDetailZ.product_id.hsnCode,
                  ProductName: product_name,
                  Packaging: ItemQuantity,
                  ItemQuantity: +BookingDetailZ.qty,
                });
              }
            }
          }
          //sorting of json data
          function dynamicSort(property) {
            var sortOrder = 1;

            if (property[0] === "-") {
              sortOrder = -1;
              property = property.substr(1);
            }

            return function (a, b) {
              if (sortOrder == -1) {
                return b[property].localeCompare(a[property]);
              } else {
                return a[property].localeCompare(b[property]);
              }
            };
          }
          var sortedData = jsonData.sort(dynamicSort("ProductName"));
          //end of sorting function
          //sum values, and merge object values ​with the same id into a new array start
          const result = sortedData
            .map((item, i, array) => {
              const defaultValue = {
                category: item.category,
                hsnCode: item.hsnCode,
                ProductName: item.ProductName,
                Packaging: item.Packaging,
                ItemQuantity: 0,
              };
              const finalValue = array
                .filter((other) => other.ProductName === item.ProductName && other.Packaging === item.Packaging) //we filter the same items
                .reduce((accum, currentVal) => {
                  //we reduce them into a single entry
                  accum.ItemQuantity += +currentVal.ItemQuantity;
                  return accum;
                }, defaultValue);

              return finalValue;
            })
            .filter((item, thisIndex, array) => {
              //now our new array has duplicates, lets remove them
              const index = array.findIndex(
                (otherItem, otherIndex) =>
                  otherItem.ProductName === item.ProductName &&
                  otherItem.Packaging === item.Packaging &&
                  otherIndex !== thisIndex &&
                  otherIndex > thisIndex
              );

              return index === -1;
            });
          //end

          var finalData = [];
          for (var z = 0; z < result.length; z++) {
            finalData.push({
              category: result[z].category,
              hsnCode: result[z].hsnCode,
              ProductName: result[z].ProductName,
              Packaging: result[z].Packaging,
              ItemQuantity: result[z].ItemQuantity,
            });
          }
          //marge qty of product end
          csvWriter
            .writeRecords(finalData) // returns a promise
            .then(() => {
              console.log("...Done");
            });
          //var report = t + ".csv";
          var name = "Item Sales Consolidated list";
          var reportType = "ItemSalesConsolidatedlist";
          var fileName = report;
          var startDate = startDateTime;
          var endDate = endDateTime;
          genrateReport(res, name, reportType, fileName, startDate, endDate);

          // res
          //     .status(200)
          //     .json({"message":'ok',"data":report,"code":0});
          //     return;
        });
    } else if (reportType == "LostBusinessReport") {
      if (startDateTime && endDateTime) {
        var from_date1 = new Date(startDateTime);
        var to_date1 = new Date(endDateTime);
        //to_date1.setDate(to_date1.getDate() + 1);
      }
      addtocartDataBase
        .find({
          CartDetail: { $exists: true, $ne: [] },
          createDate: {
            $gte: from_date1,
            $lt: to_date1,
          },
        })
        .sort({ createDate: "desc" })
        .lean()
        .populate("user_id")
        .populate({
          path: "CartDetail.product_id",
          populate: [
            {
              path: "unitMeasurement",
              model: "unit_measurements",
            },
            // {
            //  path: 'salesTaxWithIn',
            //  model: 'taxs'
            // },{
            //   path: 'salesTaxOutSide',
            //   model: 'taxs',
            // },
            // {
            //   path: 'product_subCat1_id'
            // },
            // {
            //   path: 'product_cat_id'
            // },
            // {
            //   path: 'simpleData.region'
            // },
            {
              path: "configurableData.attributes.attributeId",
            },
          ],
        })
        .exec(function (err, data) {
          if (err) {
            res.status(500).json(err);
          } else {
            var DataJson = [];
            for (var n = 0; n < data.length; n++) {
              if (data[n].CartDetail != null) {
                var CartDetailArray = [];
                var CartDetail = data[n].CartDetail;
                for (var i = 0; i < CartDetail.length; i++) {
                  var DataI = CartDetail[i];
                  var ConfigItemPush = {};
                  var SimpleItemPush = {};
                  if (DataI.product_id === null || DataI.product_id === "null") {
                    return res.status(400).json({
                      message: "error",
                      data: "product not found in database",
                      code: 1,
                    });
                    process.exit(1);
                  }
                  if (DataI.TypeOfProduct == "configurable") {
                    var varItem = DataI.product_id.configurableData;
                    //var varItem = DataI.configurableData;
                    var ItemVarArray = {};
                    //var ConfigItemPush = [];
                    var variantIdArrayPush = [];
                    for (var j = 0; j < varItem.length; j++) {
                      if (JSON.stringify(DataI.productItemId) == JSON.stringify(varItem[j]._id)) {
                        var variantIdArray = varItem[j].variant_id;
                        for (var k = 0; k < variantIdArray.length; k++) {
                          var item = variantIdArray[k].variantId.item;
                          for (var l = 0; l < item.length; l++) {
                            if (JSON.stringify(item[l]._id) == JSON.stringify(variantIdArray[j].variantItem)) {
                              ItemVarArray = {
                                item: item[l].item_name,
                                _id: item[l]._id,
                              };
                            }
                          }
                          variantIdArrayPush.push({
                            variantId: variantIdArray[k].variantId,
                            variantItem: ItemVarArray,
                            _id: variantIdArray._id,
                          });
                        }
                        ConfigItemPush = {
                          region: varItem[j].region,
                          sellingPrice: varItem[j].sellingPrice,
                          costPrice: varItem[j].costPrice,
                          total_amount: varItem[j].total_amount,
                          quantity: varItem[j].quantity,
                          ExpirationDate: varItem[j].ExpirationDate,
                          skuCode: varItem[j].skuCode,
                          _id: varItem[j]._id,
                          variant_id: variantIdArrayPush,
                        };
                      }
                    }
                  } else if (DataI.TypeOfProduct == "simple") {
                    var SimpleData = DataI.product_id.simpleData;
                    for (var j = 0; j < SimpleData.length; j++) {
                      var SimpleDataIPackage = SimpleData[j].package;
                      for (var k = 0; k < SimpleDataIPackage.length; k++) {
                        var packageDataI = SimpleDataIPackage[k];
                        if (JSON.stringify(DataI.productItemId) == JSON.stringify(packageDataI._id)) {
                          SimpleItemPush = {
                            packet_size: packageDataI.packet_size,
                            packetLabel: packageDataI.packetLabel,
                            selling_price: packageDataI.selling_price,
                            packetmrp: packageDataI.packetmrp,
                            _id: packageDataI._id,
                          };
                        }
                      }
                    }
                  }

                  CartDetailArray.push({
                    _id: DataI._id,
                    product_id: DataI.product_id,
                    product_cat_id: DataI.product_cat_id,
                    product_subCat1_id: DataI.product_subCat1_id,
                    productItemId: DataI.productItemId,
                    TypeOfProduct: DataI.TypeOfProduct,
                    price: DataI.price,
                    qty: DataI.qty,
                    unitQuantity: DataI.unitQuantity,
                    unitMeasurement: DataI.unitMeasurement,
                    without_package: DataI.without_package,
                    packetLabel: DataI.packetLabel,
                    packet_size: DataI.packet_size,
                    totalprice: DataI.totalprice,
                    createDate: DataI.createDate,
                    status: DataI.status,
                    simpleItem: SimpleItemPush,
                    ConfigItem: ConfigItemPush,
                  });
                }

                var createDate_formatted = moment.utc(data[n].createDate).tz("Asia/Kolkata");
                var createDate = createDate_formatted.format("DD-MM-YYYY");
                if (data[n].user_id) {
                  if (data[n].user_id.name) {
                    var userName = data[n].user_id.name;
                  } else {
                    var userName = null;
                  }
                  if (data[n].user_id.email) {
                    var userEmail = data[n].user_id.email;
                  } else {
                    var userEmail = null;
                  }
                  if (data[n].user_id.contactNumber) {
                    var contactNumber = data[n].user_id.contactNumber;
                  } else {
                    var contactNumber = null;
                  }
                }
                DataJson.push({
                  AddToCartId: data[n]._id,
                  user_name: userName,
                  user_mobile: contactNumber,
                  user_email: userEmail,
                  totalCartPrice: data[n].totalCartPrice,
                  redeem_point: data[n].redeem_point,
                  totalcartprice: data[n].totalcartprice,
                  cartDetail: CartDetailArray,
                  createDate: createDate,
                  __v: data[n].__v,
                });
              }
            }

            //genrate csv
            var t = Math.random();
            var FileName = "LostBusinessReport";
            var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
            var report = file_Name + ".csv";

            const csvWriter = createCsvWriter({
              path: "./public/reports/" + file_Name + ".csv",
              header: [
                { id: "createDate", title: "Date" },
                { id: "user_name", title: "Customer Name" },
                { id: "user_mobile", title: "Customer Mobile" },
                { id: "user_email", title: "Customer Email" },
                { id: "ItemData", title: "Product Name(Packaging - Quantity)" },
                { id: "subTotal", title: "Sub Total" },
                { id: "grandTotal", title: "Grand Total" },
              ],
            });
            var jsonData = [];
            for (var i = 0; i < DataJson.length; i++) {
              var iData = DataJson[i];
              var BookingDetail = iData.cartDetail;
              var ItemData = [];
              var subTotal = 0;
              for (var z = 0; z < BookingDetail.length; z++) {
                var BookingDetailZ = BookingDetail[z];
                if (BookingDetailZ.TypeOfProduct == "group") {
                  var abcGroup = BookingDetailZ.groupData ? BookingDetailZ.groupData : [];
                  for (let j = 0; j < abcGroup.length; j++) {
                    let set = BookingDetailZ.groupData[j];
                    let setQty = 0;
                    for (let k = 0; k < set.sets.length; k++) {
                      let product_name = set.sets[k].product_id.product_name;
                      var ItemQuantity =
                        (set.sets[k].package ? set.sets[k].package.packetLabel : set.sets[k].unitQuantity + " " + BookingDetailZ.unitMeasurement) *
                        (set.sets[k].qty * BookingDetailZ.qty);
                      ItemData.push(product_name + " (" + ItemQuantity + ")");
                    }
                  }
                  subTotal += BookingDetailZ.totalprice;
                } else {
                  var product_name = BookingDetailZ.product_id.product_name;
                  var ItemQuantity =
                    (BookingDetailZ.without_package
                      ? BookingDetailZ.unitQuantity + " " + BookingDetailZ.unitMeasurement
                      : BookingDetailZ.packetLabel) +
                    " - " +
                    BookingDetailZ.qty;
                  ItemData.push(product_name + " (" + ItemQuantity + ")");
                  subTotal += BookingDetailZ.totalprice;
                }
              }
              jsonData.push({
                createDate: iData.createDate,
                user_name: iData.user_name,
                user_mobile: iData.user_mobile,
                user_email: iData.user_email,
                ItemData: ItemData,
                subTotal: subTotal,
                grandTotal: iData.totalCartPrice,
              });
            }

            csvWriter
              .writeRecords(jsonData) // returns a promise
              .then(() => {});
            //var report = t + ".csv";
            var name = "Lost Business Report";
            var reportType = "LostBusinessReport";
            var fileName = report;
            var startDate = startDateTime;
            var endDate = endDateTime;
            genrateReport(res, name, reportType, fileName, startDate, endDate);
          }
        });
    } else if (reportType == "OrderWiseItemSalesData") {
      if (startDateTime && endDateTime) {
        var from_date1 = new Date(startDateTime);
        var to_date1 = new Date(endDateTime);
        // to_date1.setDate(to_date1.getDate() + 1);
      }
      bookingDataBase
        .find({
          createDate: {
            $gte: from_date1,
            $lte: to_date1,
          },
        })
        .populate("user_id")
        .populate("driver_id")
        .populate("regionID")
        .populate("user_id")
        .populate({
            path: 'user_id',
            populate: {
              path: 'sales_person',
              model: 'admin'
            } 
         })
        // .populate('bookingdetail.product_id')
        .exec(function (err, data) {
          var t = Math.random();
          var FileName = "OrderWiseItemSalesData";
          var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
          var report = file_Name + ".csv";

          const csvWriter = createCsvWriter({
            path: "./public/reports/" + file_Name + ".csv",
            header: [
              { id: "OrderDate", title: "Order Date" },
              { id: "BillingDate", title: "Billing Date" },
              { id: "OrderTime", title: "Order Time" },
              { id: "OrderStatus", title: "Order Status" },
              { id: "PaymentMethod", title: "Payment Method" },
              { id: "CustomerName", title: "Customer Name" },
              { id: "CustomerMobileNo", title: "Customer Mobile No" },
              { id: "CustomerType", title: "Customer Type" },
              {id: "AsignedPerson",title: "Asigned Person"},
              { id: "CustomerEmail", title: "Customer Email" },
              { id: "DeliveryboyName", title: "Delivery Boy Name" },
              { id: "deliverySlot", title: "Delivery Slot" },
              {
                id: "OrderDeliveryDate",
                title: "Order Delivery Date",
              },
              {
                id: "ReferenceNumber",
                title: "Order ID",
              },
              { id: "OutletName", title: "Region" },
              { id: "ItemName", title: "Item Name" },
              { id: "packaging", title: "Packaging" },
              { id: "ItemQuantity", title: "Item Quantity" },
              { id: "category", title: "category" },
              {
                id: "totalPriceBeforeGST",
                title: "Item Total Price Without GST",
              },
              { id: "ItemTaxes", title: "Item Taxes" },
              { id: "ItemDiscount", title: "Item Discount" },
              { id: "ItemTotal", title: "Item Total Price" },
            ],
          });
          var jsonData = [];
          for (var i = 0; i < data.length; i++) {
            var iData = data[i];
            if(iData?.backendOrderDate){
              var backendOrderDate = moment.utc(iData.backendOrderDate).tz("Asia/Kolkata");
            var backend_OrderDate = backendOrderDate.format("DD-MM-YYYY");
            }
            else{
              var backend_OrderDate = "N/A"
            }
            var createDate_formatted = moment.utc(iData.createDate).tz("Asia/Kolkata");
            var OrderDate = createDate_formatted.format("DD-MM-YYYY");
            var OrderTime = createDate_formatted.format("HH:mm A");

            if (iData.driver_id != null) {
              if (iData.driver_id.name) {
                var driverName = iData.driver_id.name;
              } else {
                var driverName = null;
              }
            } else {
              var driverName = null;
            }

            if (iData.DeliveryDate) {
              var DeliveryDate_formatted = moment.utc(iData.DeliveryDate).tz("Asia/Kolkata");
              var DeliveryDate = DeliveryDate_formatted.format("DD-MM-YYYY");
            } else {
              var DeliveryDate = null;
            }
            var BookingDetail = iData.bookingdetail;

            var ItemLength = BookingDetail.length;
            for (var k = 0; k < BookingDetail.length; k++) {
              var BookingDetailZ = BookingDetail[k];
              if (BookingDetailZ.TypeOfProduct == "group") {
                var product_categoriesArray = [];
                var product_name = [];
                var packaging = null;
                var totalPrice = 0;
                var totalPriceBeforeGST = 0;
                var ItemDiscount = 0;
                var ItemTaxes = 0;
                var ItemDeliveryCharges = 0;
                var qty = 0;
                for (let j = 0; j < BookingDetailZ.groupData.length; j++) {
                  let set = BookingDetailZ.groupData[j];
                  let setQty = 0;
                  let itemsArray = [];
                  for (let k = 0; k < set.sets.length; k++) {
                    var product_categoriesArray = [];
                    if (BookingDetailZ.product_categories) {
                      var product_categories = BookingDetailZ.product_categories;
                      for (var i1 = 0; i1 < product_categories.length; i1++) {
                        product_categoriesArray.push(product_categories[i1].category_name);
                      }
                    }
                    let product_name = set.sets[k].product.product_name;
                    var ItemQuantity =
                      (set.sets[k].package ? set.sets[k].package.packetLabel : set.sets[k].unitQuantity + "" + BookingDetailZ.unitMeasurement) +
                      " " +
                      set.sets[k].qty;
                    itemsArray.push(product_name + " " + ItemQuantity);
                    // product_name = set.sets[k].product.product_name;
                    // totalPrice = set.sets[k].qty*BookingDetailZ.qty*set.sets[k].price
                    // qty = set.sets[k].qty*BookingDetailZ.qty
                    // ItemQuantity = (set.sets[k].package ? set.sets[k].package.packetLabel : set.sets[k].unitQuantity+' '+BookingDetailZ.unitMeasurement)
                  }
                  product_categoriesArray.push(product_categoriesArray);
                  product_name.push(BookingDetailZ.product_name + "(" + itemsArray + ")");
                  totalPrice = BookingDetailZ.totalprice;
                  totalPriceBeforeGST = BookingDetail[k].totalPriceBeforeGST;
                  ItemDiscount = BookingDetail[k].itemDiscountAmount ? +BookingDetail[k].totalprice - +BookingDetail[k].itemDiscountAmount : 0;
                  ItemTaxes = BookingDetail[k].itemWiseGst;
                  ItemDeliveryCharges = BookingDetail[k].deliveryCharges;
                  qty = BookingDetailZ.qty;
                }
              }
              if (BookingDetailZ.TypeOfProduct == "simple") {
                var product_categoriesArray = [];
                if (BookingDetailZ.product_categories) {
                  var product_categories = BookingDetailZ.product_categories;
                  for (var i1 = 0; i1 < product_categories.length; i1++) {
                    product_categoriesArray.push(product_categories[i1].category_name);
                  }
                }

                var product_name = BookingDetailZ.product_name;
                var packaging = BookingDetail[k].without_package
                  ? BookingDetail[k].unitQuantity + " " + BookingDetail[k].unitMeasurement
                  : BookingDetail[k].packetLabel;
                var qty = BookingDetail[k].qty;
                var totalPrice = BookingDetail[k].totalprice;
                var totalPriceBeforeGST = BookingDetail[k].totalPriceBeforeGST;
                var ItemDiscount = BookingDetail[k].itemDiscountAmount ? +BookingDetail[k].totalprice - +BookingDetail[k].itemDiscountAmount : 0;
                var ItemTaxes = BookingDetail[k].itemWiseGst;
              }

              if (iData.BookingStatusByAdmin == "Pending" && iData.payment == "Pending" && iData.paymentmethod == "Paytm") {
                var BookingStatusByAdmin = "Failed";
              } else {
                var BookingStatusByAdmin = iData.BookingStatusByAdmin;
              }
              // var ItemQuantity;
              // var ItemQuantity =  BookingDetail[k].without_package ? BookingDetail[k].unitQuantity+' '+BookingDetail[k].unitMeasurement : BookingDetail[k].packetLabel
              jsonData.push({
                OrderDate: OrderDate,
                BillingDate:backend_OrderDate,
                OrderTime: OrderTime,
                PaymentMethod: iData.paymentmethod,
                OrderStatus: BookingStatusByAdmin,
                CustomerName: iData.userName,
                CustomerMobileNo: iData.userMobile,
                CustomerType: iData.userType,
                CustomerEmail: iData.userEmail,
                DeliveryboyName: driverName,
                deliverySlot: iData.deliverySlot,
                OrderDeliveryDate: DeliveryDate,
                ReferenceNumber: iData.booking_code,
                OutletName: iData.regionName,
                ItemName: product_name,
                packaging: packaging,
                ItemQuantity: qty,
                category: product_categoriesArray,
                ItemTotal: totalPrice,
                totalPriceBeforeGST: totalPriceBeforeGST,
                ItemDiscount: ItemDiscount,
                ItemTaxes: ItemTaxes,
                AsignedPerson: iData?.user_id?.sales_person?.username ? iData?.user_id?.sales_person.username : "N/A",

              });
            }
            // jsonData.push({
            //   OrderDate: null,
            //   OrderTime: null,
            //   OrderStatus: null,
            //   CustomerName: null,
            //   CustomerMobileNo: null,
            //   CustomerType: null,
            //   CustomerEmail: null,
            //   DeliveryboyName: null,
            //   deliverySlot: null,
            //   OrderDeliveryDate: null,
            //   ReferenceNumber: null,
            //   OutletName: null,
            //   ItemName: null,
            //   ItemQuantity: null,
            //   packaging: null,
            //   ItemTotal: null,
            //   // ItemDiscount: null,
            //   // ItemTaxes: null,
            //   // ItemCharges: null,
            // });
          }
          csvWriter
            .writeRecords(jsonData) // returns a promise
            .then(() => {
              console.log("...Done");
            });
          //var report = t + ".csv";
          var name = "Order Wise Item Sales Data";
          var reportType = "OrderWiseItemSalesData";
          var fileName = report;
          var startDate = startDateTime;
          var endDate = endDateTime;
          genrateReport(res, name, reportType, fileName, startDate, endDate);

          // res
          //     .status(200)
          //     .json({"message":'ok',"data":report,"code":0});
          //     return;
        });
    } else if (reportType == "OrderWiseSalesSummmary") {
      if (startDateTime && endDateTime) {
        var from_date1 = new Date(startDateTime);
        var to_date1 = new Date(endDateTime);
        //to_date1.setDate(to_date1.getDate() + 1);
      }

      bookingDataBase
        .find({
          createDate: {
            $gte: from_date1,
            $lte: to_date1,
          },
        })
        .populate("user_id")
        .populate("billingCompany")
        .populate("user_id")
        .populate({
            path: 'user_id',
            populate: {
              path: 'sales_person',
              model: 'admin'
            } 
         })
        .exec(function (err, data) {
          var t = Math.random();
          var FileName = "OrderWiseSalesSummmary";
          var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
          var report = file_Name + ".csv";

          const csvWriter = createCsvWriter({
            path: "./public/reports/" + file_Name + ".csv",
            header: [
              { id: "billType", title: "Bill Type" },
              { id: "billingCompany", title: "Company Name" },
              { id: "OrderDate", title: "Order Date" },
              { id: "OrderTime", title: "Order Time" },
              { id: "ReferenceNumber", title: "Order ID" },

              { id: "OutletName", title: "Region" },
              { id: "OrderStatus", title: "Order Status" },
              //{ id: "OrderType", title: "Order Type" },
              { id: "OrderSource", title: "Order Source" },
              { id: "Preorder", title: "Preorder" },
              { id: "PaymentMode", title: "Payment Mode" },
              { id: "CustomerType", title: "Customer Type" },
              { id: "CustomerMobileNo", title: "Customer Phone" },
              { id: "CustomerName", title: "Customer Name" },
              { id: "CustomerEmail", title: "Customer Email" },
              {id: "AsignedPerson",title: "Asigned Person"},
              { id: "CustomerAddress", title: "Customer Address" },
              //{ id: "Locality", title: "Locality" },
              { id: "City", title: "City" },
              { id: "Subtotal", title: "Subtotal" },
              { id: "GST", title: "GST" },
              { id: "taxType", title: "Tax" },
              { id: "DeliveryCharge", title: "Delivery Charge" },
              { id: "codCharges", title: "COD Charge" },
              { id: "Discount", title: "Discount" },
              { id: "loyaltypoint", title: "Loyalty Point Discount" },
              { id: "GrandTotal", title: "Grand Total" },
            ],
          });

          var totalGrandTotal = 0;
          var jsonData = [];
          for (var i = 0; i < data.length; i++) {
            var iData = data[i];
            var createDate_formatted = moment.utc(iData.createDate).tz("Asia/Kolkata");
            var OrderDate = createDate_formatted.format("DD-MM-YYYY");
            var OrderTime = createDate_formatted.format("HH:mm A");

            totalGrandTotal += iData.total_payment;
            if (iData.billingCompany) {
              var billingCompany = iData.billingCompany.name;
            } else {
              var billingCompany = null;
            }
            var Discount = iData.redeemDiscount + iData.totalCouponDiscountAmount + iData.referralDiscount;
            if (iData.BookingStatusByAdmin == "Pending" && iData.payment == "Pending" && iData.paymentmethod == "Paytm") {
              var BookingStatusByAdmin = "Failed";
            } else {
              var BookingStatusByAdmin = iData.BookingStatusByAdmin;
            }
            jsonData.push({
              billType: iData.billType,
              billingCompany: billingCompany,
              OrderDate: OrderDate,
              OrderTime: OrderTime,
              ReferenceNumber: iData.booking_code,
              OutletName: iData.regionName,
              OrderStatus: BookingStatusByAdmin,
              //OrderType: null,
              OrderSource: iData.bookingMode,
              Preorder: iData.preOrder === true ? "Yes" : "No",
              PaymentMode: iData.paymentmethod,
              CustomerType: iData.userType,
              CustomerMobileNo: iData.userMobile,
              CustomerName: iData.userName,
              CustomerEmail: iData.userEmail,
              CustomerAddress: iData.booking_address.locality,
              // " " +
              // iData.booking_address.city +
              // " " +
              // iData.booking_address.state +
              // " " +
              // iData.booking_address.pincode +
              // " " +
              // iData.booking_address.country,
              // Locality: iData.booking_address.locality,
              City: iData.booking_address.city,
              Subtotal: iData.totalCartPrice,
              GST: iData.gst,
              taxType: iData.taxType,
              DeliveryCharge: iData.deliveryCharges,
              codCharges: iData.codCharges,
              Discount: Discount,
              loyaltypoint: iData.redeemDiscount,
              GrandTotal: iData.total_payment,
              AsignedPerson: iData?.user_id?.sales_person?.username ? iData?.user_id?.sales_person.username : "N/A",
            });
          }

          var finalRow = [
            {
              billType: null,
              billingCompany: null,
              OrderDate: null,
              OrderTime: null,
              ReferenceNumber: null,
              OutletName: null,
              OrderStatus: null,
              //OrderType: null,
              OrderSource: null,
              Preorder: null,
              PaymentMode: null,
              CustomerType: null,
              CustomerMobileNo: null,
              CustomerName: null,
              CustomerEmail: null,
              CustomerAddress: null,
              Locality: null,
              City: null,
              Subtotal: null,
              GST: null,
              taxType: null,
              DeliveryCharge: null,
              codCharges: null,
              Discount: null,
              loyaltypoint: null,
              GrandTotal: totalGrandTotal,
            },
          ];

          var finalData = jsonData.concat(finalRow);
          csvWriter
            .writeRecords(finalData) // returns a promise
            .then(() => {
              console.log("...Done");
            });
          //var report = 'http://18.190.24.89:3003/public/reports/'+t+'.csv';
          //var report = t + ".csv";
          var name = "Order Wise Sales Summmary";
          var reportType = "OrderWiseSalesSummmary";
          var fileName = report;
          var startDate = startDateTime;
          var endDate = endDateTime;
          genrateReport(res, name, reportType, fileName, startDate, endDate);

          // res
          //     .status(200)
          //     .json({"message":'ok',"data":report,"code":0});
          //     return;
        });
    } else if (
      reportType == "cod" ||
      reportType == "COD" ||
      reportType == "Paytm" ||
      reportType == "paytm" ||
      reportType == "credit" ||
      reportType == "Credit" ||
      reportType == "wallet" ||
      reportType == "Wallet"
    ) {
      var DataFilter = {};
      if (req.body.reportType) {
        DataFilter["paymentmethod"] = req.body.reportType;
      }
      if (req.body.user_id) {
        DataFilter["user_id"] = req.body.user_id;
      }
      if (startDateTime && endDateTime) {
        var from_date1 = new Date(startDateTime);
        var to_date1 = new Date(endDateTime);
        to_date1.setDate(to_date1.getDate() + 1);
        DataFilter["createDate"] = { $gte: from_date1, $lt: to_date1 };
      }
      bookingDataBase
        .find(DataFilter)
        .populate("user_id")
        .populate({
            path: 'user_id',
            populate: {
              path: 'sales_person',
              model: 'admin'
            } 
         })
        //    .populate('driver_id')
        // .populate('bookingdetail.product_id')
        .exec(function (err, data) {
          var t = Math.random();

          if (req.body.reportType == "paytm" || req.body.reportType == "Paytm") {
            var FileName = "Online_Payment";
          } else {
            var FileName = req.body.reportType;
          }
          var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
          var report = file_Name + ".csv";

          const csvWriter = createCsvWriter({
            path: "./public/reports/" + file_Name + ".csv",
            header: [
              { id: "OrderDate", title: "Order Date" },
              { id: "OrderTime", title: "Order Time" },
              { id: "ReferenceNumber", title: "Order ID" },
              { id: "City", title: "City" },
              { id: "OutletName", title: "Region" },
              { id: "OrderStatus", title: "Order Status" },
              { id: "PaymentStatus", title: "Payment Status" },
              { id: "PaymentDate", title: "Payment Date" },
              //{ id: "OrderType", title: "Order Type" },
              { id: "OrderSource", title: "Order Source" },
              { id: "Preorder", title: "Preorder" },
              { id: "PaymentMode", title: "Payment Mode" },
              { id: "PaymentMethod", title: "Payment Method" },
              { id: "CustomerType", title: "Customer Type" },
              { id: "CustomerName", title: "Customer Name" },
              { id: "CustomerMobileNo", title: "Customer Phone" },
              { id: "CustomerEmail", title: "Customer Email" },
              {id: "AsignedPerson",title: "Asigned Person"},
              { id: "CustomerAddress", title: "Customer Address" },
              { id: "Locality", title: "Locality" },
              { id: "Subtotal", title: "Subtotal" },
              { id: "GST", title: "GST" },
              { id: "taxType", title: "Tax" },
              { id: "DeliveryCharge", title: "Delivery Charge" },
              { id: "codCharges", title: "COD Charges" },
              { id: "Discount", title: "Discount" },
              { id: "loyaltypoint", title: "Loyalty Point Discount" },
              { id: "GrandTotal", title: "Grand Total" },
            ],
          });
          var jsonData = [];
          var TotalSubtotal = 0;
          var TotalGST = 0;
          var TotalDeliveryCharge = 0;
          var TotalcodCharges = 0;
          var TotalDiscount = 0;
          var TotalLoyaltyPoint = 0;
          var TotalGrandTotal = 0;

          for (var i = 0; i < data.length; i++) {
            var iData = data[i];
            var createDate_formatted = moment.utc(iData.createDate).tz("Asia/Kolkata");
            var OrderDate = createDate_formatted.format("DD-MM-YYYY");
            var OrderTime = createDate_formatted.format("HH:mm A");
            var Discount = iData.redeemDiscount + iData.totalCouponDiscountAmount + iData.referralDiscount;

            TotalSubtotal += iData.totalCartPrice;
            TotalGST += iData.gst;
            TotalDeliveryCharge += iData.deliveryCharges;
            TotalcodCharges += iData.codCharges;
            TotalDiscount += Discount;
            TotalLoyaltyPoint += iData.redeemDiscount;
            TotalGrandTotal += iData.total_payment;

            if (iData.paymentmethod == "Paytm" || iData.paymentmethod == "paytm") {
              var paymentmethod = "Online Payment";
            } else {
              var paymentmethod = iData.paymentmethod;
            }
            if (iData.paymentDateByAdmin) {
              var paymentDateByAdmin_formatted = moment.utc(iData.paymentDateByAdmin).tz("Asia/Kolkata");
              var paymentDateByAdmin = paymentDateByAdmin_formatted.format("DD-MM-YYYY");
            } else {
              var paymentDateByAdmin = iData.payment == "Complete" ? OrderDate : null;
            }

            if (iData.BookingStatusByAdmin == "Pending" && iData.payment == "Pending" && iData.paymentmethod == "Paytm") {
              var BookingStatusByAdmin = "Failed";
            } else {
              var BookingStatusByAdmin = iData.BookingStatusByAdmin;
            }

            jsonData.push({
              OrderDate: OrderDate,
              OrderTime: OrderTime,
              ReferenceNumber: iData.booking_code,
              City: iData.booking_address.city,
              OutletName: iData.regionName,
              OrderStatus: BookingStatusByAdmin,
              PaymentStatus: iData.payment,
              PaymentDate: paymentDateByAdmin,
              // OrderType: null,
              OrderSource: iData.bookingMode,
              Preorder: iData.preOrder === true ? "Yes" : "No",
              PaymentMode: iData.bookingMode,
              PaymentMethod: paymentmethod,
              CustomerType: iData.userType,
              CustomerName: iData.userName,
              CustomerMobileNo: iData.userMobile,
              CustomerEmail: iData.userEmail,
              CustomerAddress: iData.booking_address.locality,
              Locality: iData.booking_address.locality,
              Subtotal: iData.totalCartPrice,
              GST: iData.gst,
              taxType: iData.taxType,
              DeliveryCharge: iData.deliveryCharges,
              codCharges: iData.codCharges,
              Discount: Discount,
              loyaltypoint: iData.redeemDiscount,
              GrandTotal: iData.total_payment,
              AsignedPerson: iData?.user_id?.sales_person?.username ? iData?.user_id?.sales_person.username : "N/A",

            });
          }
          var finalRow = [
            {
              OrderDate: null,
              OrderTime: null,
              ReferenceNumber: null,
              City: null,
              OutletName: null,
              OrderStatus: null,
              // OrderType: null,
              OrderSource: null,
              Preorder: null,
              PaymentMode: null,
              PaymentMethod: null,
              CustomerType: null,
              CustomerName: null,
              CustomerMobileNo: null,
              CustomerEmail: null,
              CustomerAddress: null,
              Locality: null,
              Subtotal: TotalSubtotal,
              GST: TotalGST,
              taxType: null,
              DeliveryCharge: TotalDeliveryCharge,
              codCharges: TotalcodCharges,
              Discount: TotalDiscount,
              loyaltypoint: TotalLoyaltyPoint,
              GrandTotal: TotalGrandTotal,
            },
          ];

          var finalData = jsonData.concat(finalRow);

          csvWriter
            .writeRecords(finalData) // returns a promise
            .then(() => {
              //console.log('...Done',jsonData);
            });
          var name = FileName;
          var reportType = report;
          var fileName = report;
          var startDate = startDateTime;
          var endDate = endDateTime;
          genrateReport(res, name, reportType, fileName, startDate, endDate);

          // res
          //     .status(200)
          //     .json({"message":'ok',"data":report,"code":0});
          //     return;
        });
    } else if (reportType == "SalesReportWithTaxation") {
      var DataFilter = {};
      if (startDateTime && endDateTime) {
        var from_date1 = new Date(startDateTime);
        var to_date1 = new Date(endDateTime);
        //to_date1.setDate(to_date1.getDate() + 1);
        DataFilter["createDate"] = { $gte: from_date1, $lte: to_date1 };
        DataFilter["subscriptionID"] = null;
        // DataFilter["BookingStatusByAdmin"] = {$ne:"Rejected"};
        // DataFilter["$and"] = [{paymentmethod: "Paytm"},
        //   {payment: {$nin:["Failed", "Pending", "failed" ]}}
        //   // {
        //   //   payment: {$ne:"Pending"},
        //   //   paymentmethod: "Paytm",
        //   // },
        //   // {
        //   //   payment: {$ne:"Failed"},
        //   //   paymentmethod: "Paytm",
        //   // },
        //   // {
        //   //   payment: {$ne:"failed"},
        //   //   paymentmethod: "Paytm",
        //   // }
        // ] ;
      }
      var bookingJsonData = await bookingDataBase.find(DataFilter)
      .populate("user_id")
       .populate({
            path: 'user_id',
            populate: {
              path: 'sales_person',
              model: 'admin'
            } 
         })
      var subscribeJsonData = await subscriptionDataBase.find({
        createDate: { $gte: from_date1, $lte: to_date1 },
      });

      var t = Math.random();
      var FileName = "SalesReportWithTaxation";
      var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
      var report = file_Name + ".csv";

      const csvWriter = createCsvWriter({
        path: "./public/reports/" + file_Name + ".csv",
        header: [
          { id: "OrderDate", title: "Order Date" },
          { id: "OrderTime", title: "Order Time" },
          { id: "OrderID", title: "Order No" },
          { id: "invoiceNumber", title: "Invoice Number" },
          { id: "OrderStatus", title: "Order Status" },
          { id: "paymentmethod", title: "Payment Method" },
          { id: "payment", title: "Payment Status" },
          { id: "CustomerName", title: "Customer Name" },
          {id: "AsignedPerson",title: "Asigned Person"},
          { id: "gstno", title: "GST Number" },
          { id: "CustomerCity", title: "City" },
          { id: "CustomerType", title: "Customer Type" },
          { id: "Subtotal", title: "Bill Amount" },
          { id: "totalCartPriceWithoutGST", title: "Sub-Total" },
          { id: "exempt", title: "Sales Exempt" },
          { id: "GST_final_Price5", title: "GST@5%" },
          //{ id: "SGST_tax_percent25", title: "SGST 2.5%" },
          { id: "SGST_totalPrice25", title: "OUT PUT SGST@2.5%" },
          { id: "CGST_totalPrice25", title: "OUT PUT CGST@2.5%" },
          //{ id: "SGST_tax_percent6", title: "SGST 6%" },
          { id: "GST_final_Price12", title: "GST@12%" },
          { id: "SGST_totalPrice6", title: "OUT PUT SGST@6%" },
          { id: "CGST_totalPrice6", title: "OUT PUT CGST@6%" },
          //{ id: "SGST_tax_percent9", title: "SGST 9%" },
          { id: "GST_final_Price18", title: "GST@18%" },
          { id: "SGST_totalPrice9", title: "OUT PUT SGST@9%" },
          { id: "CGST_totalPrice9", title: "OUT PUT CGST@9%" },
          { id: "GST_final_Price28", title: "GST@28%" },
          { id: "SGST_totalPrice14", title: "OUT PUT SGST@14%" },
          { id: "CGST_totalPrice14", title: "OUT PUT CGST@14%" },

          { id: "IGST_tax_percent5", title: "IGST@5%" },
          { id: "IGST_totalPrice5", title: "OUT PUT IGST@5%" },
          { id: "IGST_tax_percent12", title: "IGST@12%" },
          { id: "IGST_totalPrice12", title: "OUT PUT IGST@12%" },
          { id: "IGST_tax_percent18", title: "IGST@18%" },
          { id: "IGST_totalPrice18", title: "OUT PUT IGST@18%" },
          { id: "IGST_tax_percent28", title: "IGST@28%" },
          { id: "IGST_totalPrice28", title: "OUT PUT IGST@28%" },
          { id: "deliveryCharges", title: "Delivery Charges" },
          { id: "totalDiscount", title: "Discount" },
          { id: "adjustment", title: "Adjustment" },
        ],
      });
      var jsonData = [];
      var SubscribeJsonDataArray = [];
      //booking data start
      if (bookingJsonData.length > 0) {
        for (var i = 0; i < bookingJsonData.length; i++) {
          var GST_final_Price5 = 0;
          var GST_final_Price12 = 0;
          var GST_final_Price18 = 0;
          var GST_final_Price28 = 0;

          var SGST_final_Price25 = 0;
          var SGST_final_Price6 = 0;
          var SGST_final_Price9 = 0;
          var SGST_final_Price14 = 0;
          var SGST_final_Price5 = 0;
          var SGST_final_Price12 = 0;
          var SGST_final_Price18 = 0;
          var SGST_final_Price28 = 0;

          var CGST_final_Price25 = 0;
          var CGST_final_Price6 = 0;
          var CGST_final_Price9 = 0;
          var CGST_final_Price14 = 0;
          var CGST_final_Price5 = 0;
          var CGST_final_Price12 = 0;
          var CGST_final_Price18 = 0;
          var CGST_final_Price28 = 0;

          var IGST_final_Price25 = 0;
          var IGST_final_Price6 = 0;
          var IGST_final_Price9 = 0;
          var IGST_final_Price14 = 0;
          var IGST_final_Price5 = 0;
          var IGST_final_Price12 = 0;
          var IGST_final_Price18 = 0;
          var IGST_final_Price28 = 0;

          var iData = bookingJsonData[i];
          var createDate_formatted = moment.utc(iData.createDate).tz("Asia/Kolkata");
          var OrderDate = createDate_formatted.format("DD-MM-YYYY");
          var OrderRealDate1 = createDate_formatted.format("MM-DD-YYYY");
          var OrderTime = createDate_formatted.format("HH:mm A");
          var allGst = iData.allGstLists;

          var GST_tax_percent5 = "";
          var GST_totalPrice5 = "";
          var GST_tax_percent12 = "";
          var GST_totalPrice12 = "";
          var GST_tax_percent18 = "";
          var GST_totalPrice18 = "";
          var GST_tax_percent28 = "";
          var GST_totalPrice28 = "";

          var SGST_tax_percent25 = "";
          var SGST_totalPrice25 = "";
          var SGST_tax_percent6 = "";
          var SGST_totalPrice6 = "";
          var SGST_tax_percent9 = "";
          var SGST_totalPrice9 = "";
          var SGST_tax_percent14 = "";
          var SGST_totalPrice14 = "";
          var SGST_tax_percent5 = "";
          var SGST_totalPrice5 = "";
          var SGST_tax_percent12 = "";
          var SGST_totalPrice12 = "";
          var SGST_tax_percent18 = "";
          var SGST_totalPrice18 = "";
          var SGST_tax_percent28 = "";
          var SGST_totalPrice28 = "";

          var CGST_tax_percent25 = "";
          var CGST_totalPrice25 = "";
          var CGST_tax_percent6 = "";
          var CGST_totalPrice6 = "";
          var CGST_tax_percent9 = "";
          var CGST_totalPrice9 = "";
          var CGST_tax_percent14 = "";
          var CGST_totalPrice14 = "";
          var CGST_tax_percent5 = "";
          var CGST_totalPrice5 = "";
          var CGST_tax_percent12 = "";
          var CGST_totalPrice12 = "";
          var CGST_tax_percent18 = "";
          var CGST_totalPrice18 = "";
          var CGST_tax_percent28 = "";
          var CGST_totalPrice28 = "";

          var IGST_tax_percent25 = "";
          var IGST_totalPrice25 = "";
          var IGST_tax_percent6 = "";
          var IGST_totalPrice6 = "";
          var IGST_tax_percent9 = "";
          var IGST_totalPrice9 = "";
          var IGST_tax_percent14 = "";
          var IGST_totalPrice14 = "";
          var IGST_tax_percent5 = "";
          var IGST_totalPrice5 = "";
          var IGST_tax_percent12 = "";
          var IGST_totalPrice12 = "";
          var IGST_tax_percent18 = "";
          var IGST_totalPrice18 = "";
          var IGST_tax_percent28 = "";
          var IGST_totalPrice28 = "";

          var exempt = "";
          var totalGst = iData.gst;
          var totalGrandTotal = iData.total_payment;
          var totalCartPriceWithoutGST = iData.totalCartPriceWithoutGST;
          var totaldeliveryCharges = (iData.deliveryCharges ? +iData.deliveryCharges : 0) + (iData.codCharges ? +iData.codCharges : 0);
          var totalDiscount = iData.redeemDiscount + iData.totalCouponDiscountAmount + iData.referralDiscount;

          for (var i1 = 0; i1 < allGst.length; i1++) {
            var allGstI = allGst[i1];
            if (allGstI.tax_percent == null || allGstI.tax_percent == 0) {
              exempt = 0;
            }

            if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 2.5) {
              SGST_tax_percent25 = iData.totalCartPrice;
              SGST_totalPrice25 = allGstI.totalPrice;
              SGST_final_Price25 += Number(allGstI.totalPrice);
              GST_final_Price5 += Number((allGstI.totalPrice * 100) / 2.5 / 2);
            }
            if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 6) {
              SGST_tax_percent6 = iData.totalCartPrice;
              SGST_totalPrice6 = allGstI.totalPrice;
              SGST_final_Price6 += Number(allGstI.totalPrice);
              GST_final_Price12 += Number((allGstI.totalPrice * 100) / 6 / 2);
            }
            if (allGstI.tax_name == "CGST" && allGstI.tax_percent == 6) {
              CGST_tax_percent6 = iData.totalCartPrice;
              CGST_totalPrice6 = allGstI.totalPrice;
              CGST_final_Price6 += Number(allGstI.totalPrice);
              GST_final_Price12 += Number((allGstI.totalPrice * 100) / 6 / 2);
            }
            if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 9) {
              SGST_tax_percent9 = iData.totalCartPrice;
              SGST_totalPrice9 = allGstI.totalPrice;
              SGST_final_Price9 += Number(allGstI.totalPrice);
              GST_final_Price18 += Number((allGstI.totalPrice * 100) / 9 / 2);
            }
            if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 14) {
              SGST_tax_percent14 = iData.totalCartPrice;
              SGST_totalPrice14 = allGstI.totalPrice;
              SGST_final_Price14 += Number(allGstI.totalPrice);
              GST_final_Price28 += Number((allGstI.totalPrice * 100) / 14 / 2);
            }
            if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 5) {
              SGST_tax_percent5 = iData.totalCartPrice;
              SGST_totalPrice5 = allGstI.totalPrice;
              SGST_final_Price5 += Number(allGstI.totalPrice);
            }
            if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 12) {
              SGST_tax_percent12 = iData.totalCartPrice;
              SGST_totalPrice12 = allGstI.totalPrice;
              SGST_final_Price12 += Number(allGstI.totalPrice);
            }
            if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 18) {
              SGST_tax_percent18 = iData.totalCartPrice;
              SGST_totalPrice18 = allGstI.totalPrice;
              SGST_final_Price18 += Number(allGstI.totalPrice);
            }
            if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 28) {
              SGST_tax_percent28 = iData.totalCartPrice;
              SGST_totalPrice28 = allGstI.totalPrice;
              SGST_final_Price28 += Number(allGstI.totalPrice);
            }

            if (allGstI.tax_name == "CGST" && allGstI.tax_percent == 2.5) {
              CGST_tax_percent25 = iData.totalCartPrice;
              CGST_totalPrice25 = allGstI.totalPrice;
              CGST_final_Price25 += Number(allGstI.totalPrice);
              GST_final_Price5 += Number((allGstI.totalPrice * 100) / 2.5 / 2);
            }

            if (allGstI.tax_name == "CGST" && allGstI.tax_percent == 9) {
              CGST_tax_percent9 = iData.totalCartPrice;
              CGST_totalPrice9 = allGstI.totalPrice;
              CGST_final_Price9 += Number(allGstI.totalPrice);
              GST_final_Price18 += Number((allGstI.totalPrice * 100) / 9 / 2);
            }
            if (allGstI.tax_name == "CGST" && allGstI.tax_percent == 14) {
              CGST_tax_percent14 = iData.totalCartPrice;
              CGST_totalPrice14 = allGstI.totalPrice;
              CGST_final_Price14 += Number(allGstI.totalPrice);
              GST_final_Price28 += Number((allGstI.totalPrice * 100) / 14 / 2);
            }

            if (allGstI.tax_name == "IGST" && allGstI.tax_percent == 5) {
              IGST_tax_percent5 = Number((allGstI.totalPrice * 100) / 5);
              IGST_totalPrice5 = allGstI.totalPrice;
              IGST_final_Price5 += Number(allGstI.totalPrice);
            }
            if (allGstI.tax_name == "IGST" && allGstI.tax_percent == 12) {
              IGST_tax_percent12 = Number((allGstI.totalPrice * 100) / 12);
              IGST_totalPrice12 = allGstI.totalPrice;
              IGST_final_Price12 += Number(allGstI.totalPrice);
            }
            if (allGstI.tax_name == "IGST" && allGstI.tax_percent == 18) {
              IGST_tax_percent18 = Number((allGstI.totalPrice * 100) / 18);
              IGST_totalPrice18 = allGstI.totalPrice;
              IGST_final_Price18 += Number(allGstI.totalPrice);
            }
            if (allGstI.tax_name == "IGST" && allGstI.tax_percent == 28) {
              IGST_tax_percent28 = Number((allGstI.totalPrice * 100) / 28);
              IGST_totalPrice28 = allGstI.totalPrice;
              IGST_final_Price28 += Number(allGstI.totalPrice);
            }
          }
          var total =
            +GST_final_Price5 +
            +GST_final_Price12 +
            +GST_final_Price18 +
            +GST_final_Price28 +
            +SGST_totalPrice25 +
            +SGST_totalPrice6 +
            +SGST_totalPrice9 +
            +SGST_totalPrice14 +
            +SGST_totalPrice5 +
            +SGST_totalPrice12 +
            +SGST_totalPrice18 +
            +SGST_totalPrice28 +
            +CGST_totalPrice25 +
            +CGST_totalPrice6 +
            +CGST_totalPrice9 +
            +CGST_totalPrice14 +
            +CGST_totalPrice5 +
            +CGST_totalPrice12 +
            +CGST_totalPrice18 +
            +CGST_totalPrice28 +
            +IGST_tax_percent5 +
            +IGST_final_Price5 +
            +IGST_tax_percent12 +
            +IGST_final_Price12 +
            +IGST_tax_percent18 +
            +IGST_final_Price18 +
            +IGST_tax_percent28 +
            +IGST_totalPrice28;
          var expmptValue = +total ? (+total).toFixed(3) : 0;
          var exmpValueRound =
            +iData.total_payment - expmptValue - ((iData.deliveryCharges ? +iData.deliveryCharges : 0) + (iData.codCharges ? +iData.codCharges : 0));
          var totalCartPriceWithoutGST1 =
            iData.totalCartPriceWithoutGST - (+iData.redeemDiscount + +iData.totalCouponDiscountAmount + +iData.referralDiscount);

          if (iData.BookingStatusByAdmin == "Pending" && iData.payment == "Pending" && iData.paymentmethod == "Paytm") {
            var BookingStatusByAdmin = "Failed";
          } else {
            var BookingStatusByAdmin = iData.BookingStatusByAdmin;
          }

          jsonData.push({
            OrderRealDate: OrderRealDate1,
            OrderDate: OrderDate,
            OrderTime: OrderTime,
            OrderID: iData.booking_code,
            invoiceNumber: iData.invoiceNO,
            OrderStatus: BookingStatusByAdmin,
            paymentmethod: iData.paymentmethod,
            payment: iData.payment,
            CustomerName: iData.userName,
            gstno: iData.gst_no,
            CustomerCity: iData.booking_address.city,
            CustomerType: iData.userType,
            Subtotal: (+iData.total_payment).toFixed(2),
            totalCartPriceWithoutGST: totalCartPriceWithoutGST1.toFixed(2),
            exempt: exmpValueRound >= 1 ? exmpValueRound.toFixed(3) : 0,
            adjustment: exmpValueRound < 1 ? exmpValueRound.toFixed(3) : 0,
            GST_final_Price5: GST_final_Price5 ? (+GST_final_Price5).toFixed(3) : "",
            GST_final_Price12: GST_final_Price12 ? (+GST_final_Price12).toFixed(3) : "",
            GST_final_Price18: GST_final_Price18 ? (+GST_final_Price18).toFixed(3) : "",
            GST_final_Price28: GST_final_Price28 ? (+GST_final_Price28).toFixed(3) : "",
            //SGST_tax_percent25: SGST_tax_percent25,
            SGST_totalPrice25: SGST_totalPrice25 ? (+SGST_totalPrice25).toFixed(3) : "",
            //SGST_tax_percent6: SGST_tax_percent6,
            SGST_totalPrice6: SGST_totalPrice6 ? (+SGST_totalPrice6).toFixed(3) : "",
            // SGST_tax_percent9: SGST_tax_percent9,
            SGST_totalPrice9: SGST_totalPrice9 ? (+SGST_totalPrice9).toFixed(3) : "",
            //SGST_tax_percent14: SGST_tax_percent14,
            SGST_totalPrice14: SGST_totalPrice14 ? (+SGST_totalPrice14).toFixed(3) : "",
            // SGST_tax_percent5: SGST_tax_percent5,
            SGST_totalPrice5: SGST_totalPrice5 ? (+SGST_totalPrice5).toFixed(3) : "",
            SGST_totalPrice12: SGST_totalPrice12 ? (+SGST_totalPrice12).toFixed(3) : "",
            SGST_totalPrice18: SGST_totalPrice18 ? (+SGST_totalPrice18).toFixed(3) : "",
            SGST_totalPrice28: SGST_totalPrice28 ? (+SGST_totalPrice28).toFixed(3) : "",
            CGST_totalPrice25: CGST_totalPrice25 ? (+CGST_totalPrice25).toFixed(3) : "",
            CGST_totalPrice6: CGST_totalPrice6 ? (+CGST_totalPrice6).toFixed(3) : "",
            CGST_totalPrice9: CGST_totalPrice9 ? (+CGST_totalPrice9).toFixed(3) : "",
            CGST_totalPrice14: CGST_totalPrice14 ? (+CGST_totalPrice14).toFixed(3) : "",
            CGST_totalPrice5: CGST_totalPrice5 ? (+CGST_totalPrice5).toFixed(3) : "",
            CGST_totalPrice12: CGST_totalPrice12 ? (+CGST_totalPrice12).toFixed(3) : "",
            CGST_totalPrice18: CGST_totalPrice18 ? (+CGST_totalPrice18).toFixed(3) : "",
            CGST_totalPrice28: CGST_totalPrice28 ? (+CGST_totalPrice28).toFixed(3) : "",
            IGST_tax_percent5: IGST_tax_percent5 ? (+IGST_tax_percent5).toFixed(3) : "",
            IGST_totalPrice5: IGST_final_Price5 ? (+IGST_final_Price5).toFixed(3) : "",
            IGST_tax_percent12: IGST_tax_percent12 ? (+IGST_tax_percent12).toFixed(3) : "",
            IGST_totalPrice12: IGST_final_Price12 ? (+IGST_final_Price12).toFixed(3) : "",
            IGST_tax_percent18: IGST_tax_percent18 ? (+IGST_tax_percent18).toFixed(3) : "",
            IGST_totalPrice18: IGST_final_Price18 ? (+IGST_final_Price18).toFixed(3) : "",
            IGST_tax_percent28: IGST_tax_percent28 ? (+IGST_tax_percent28).toFixed(3) : "",
            IGST_totalPrice28: IGST_totalPrice28 ? (+IGST_totalPrice28).toFixed(3) : "",

            // GST: iData.gst,
            deliveryCharges: (iData.deliveryCharges ? +iData.deliveryCharges : 0) + (iData.codCharges ? +iData.codCharges : 0),
            totalDiscount: +iData.redeemDiscount + +iData.totalCouponDiscountAmount + +iData.referralDiscount,
            AsignedPerson: iData?.user_id?.sales_person?.username ? iData?.user_id?.sales_person.username : "N/A",
          });
          //console.log(jsonData)
        }
      }
      //booking data end

      //Subscription data start
      if (subscribeJsonData.length > 0) {
        for (var i = 0; i < subscribeJsonData.length; i++) {
          var GST_final_Price5 = 0;
          var GST_final_Price12 = 0;
          var GST_final_Price18 = 0;
          var GST_final_Price28 = 0;

          var SGST_final_Price25 = 0;
          var SGST_final_Price6 = 0;
          var SGST_final_Price9 = 0;
          var SGST_final_Price14 = 0;
          var SGST_final_Price5 = 0;
          var SGST_final_Price12 = 0;
          var SGST_final_Price18 = 0;
          var SGST_final_Price28 = 0;

          var CGST_final_Price25 = 0;
          var CGST_final_Price6 = 0;
          var CGST_final_Price9 = 0;
          var CGST_final_Price14 = 0;
          var CGST_final_Price5 = 0;
          var CGST_final_Price12 = 0;
          var CGST_final_Price18 = 0;
          var CGST_final_Price28 = 0;

          var IGST_final_Price25 = 0;
          var IGST_final_Price6 = 0;
          var IGST_final_Price9 = 0;
          var IGST_final_Price14 = 0;
          var IGST_final_Price5 = 0;
          var IGST_final_Price12 = 0;
          var IGST_final_Price18 = 0;
          var IGST_final_Price28 = 0;

          var subscribeIData = subscribeJsonData[i];
          var days1 = subscribeIData.dates;
          var days = days1.length;
          var createDate_formatted1 = moment.utc(subscribeIData.createDate).tz("Asia/Kolkata");
          var OrderDate1 = createDate_formatted1.format("DD-MM-YYYY");
          var OrderRealDate1 = createDate_formatted1.format("MM-DD-YYYY");
          var OrderTime1 = createDate_formatted1.format("HH:mm A");
          var allGst = subscribeIData.allGstLists;

          var GST_tax_percent5 = "";
          var GST_totalPrice5 = "";
          var GST_tax_percent12 = "";
          var GST_totalPrice12 = "";
          var GST_tax_percent18 = "";
          var GST_totalPrice18 = "";
          var GST_tax_percent28 = "";
          var GST_totalPrice28 = "";

          var SGST_tax_percent25 = "";
          var SGST_totalPrice25 = "";
          var SGST_tax_percent6 = "";
          var SGST_totalPrice6 = "";
          var SGST_tax_percent9 = "";
          var SGST_totalPrice9 = "";
          var SGST_tax_percent14 = "";
          var SGST_totalPrice14 = "";
          var SGST_tax_percent5 = "";
          var SGST_totalPrice5 = "";
          var SGST_tax_percent12 = "";
          var SGST_totalPrice12 = "";
          var SGST_tax_percent18 = "";
          var SGST_totalPrice18 = "";
          var SGST_tax_percent28 = "";
          var SGST_totalPrice28 = "";

          var CGST_tax_percent25 = "";
          var CGST_totalPrice25 = "";
          var CGST_tax_percent6 = "";
          var CGST_totalPrice6 = "";
          var CGST_tax_percent9 = "";
          var CGST_totalPrice9 = "";
          var CGST_tax_percent14 = "";
          var CGST_totalPrice14 = "";
          var CGST_tax_percent5 = "";
          var CGST_totalPrice5 = "";
          var CGST_tax_percent12 = "";
          var CGST_totalPrice12 = "";
          var CGST_tax_percent18 = "";
          var CGST_totalPrice18 = "";
          var CGST_tax_percent28 = "";
          var CGST_totalPrice28 = "";

          var IGST_tax_percent25 = "";
          var IGST_totalPrice25 = "";
          var IGST_tax_percent6 = "";
          var IGST_totalPrice6 = "";
          var IGST_tax_percent9 = "";
          var IGST_totalPrice9 = "";
          var IGST_tax_percent14 = "";
          var IGST_totalPrice14 = "";
          var IGST_tax_percent5 = "";
          var IGST_totalPrice5 = "";
          var IGST_tax_percent12 = "";
          var IGST_totalPrice12 = "";
          var IGST_tax_percent18 = "";
          var IGST_totalPrice18 = "";
          var IGST_tax_percent28 = "";
          var IGST_totalPrice28 = "";

          var exempt = "";
          var totalGst = subscribeIData.gst;
          var totalGrandTotal = subscribeIData.total_payment;
          var totalCartPriceWithoutGST = subscribeIData.totalCartPriceWithoutGST;
          var totaldeliveryCharges =
            (subscribeIData.deliveryCharges ? +subscribeIData.deliveryCharges : 0) + (subscribeIData.codCharges ? +subscribeIData.codCharges : 0);
          var totalDiscount = subscribeIData.redeemDiscount + subscribeIData.totalCouponDiscountAmount + subscribeIData.referralDiscount;

          for (var i1 = 0; i1 < allGst.length; i1++) {
            var allGstI = allGst[i1];
            if (allGstI.tax_percent == null || allGstI.tax_percent == 0) {
              exempt = 0;
            }

            if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 2.5) {
              SGST_tax_percent25 = subscribeIData.totalCartPrice;
              SGST_totalPrice25 = allGstI.totalPrice;
              SGST_final_Price25 += Number(allGstI.totalPrice);
              GST_final_Price5 += Number((allGstI.totalPrice * 100) / 2.5 / 2);
            }
            if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 6) {
              SGST_tax_percent6 = subscribeIData.totalCartPrice;
              SGST_totalPrice6 = allGstI.totalPrice;
              SGST_final_Price6 += Number(allGstI.totalPrice);
              GST_final_Price12 += Number((allGstI.totalPrice * 100) / 6 / 2);
            }
            if (allGstI.tax_name == "CGST" && allGstI.tax_percent == 6) {
              CGST_tax_percent6 = subscribeIData.totalCartPrice;
              CGST_totalPrice6 = allGstI.totalPrice;
              CGST_final_Price6 += Number(allGstI.totalPrice);
              GST_final_Price12 += Number((allGstI.totalPrice * 100) / 6 / 2);
            }
            if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 9) {
              SGST_tax_percent9 = subscribeIData.totalCartPrice;
              SGST_totalPrice9 = allGstI.totalPrice;
              SGST_final_Price9 += Number(allGstI.totalPrice);
              GST_final_Price18 += Number((allGstI.totalPrice * 100) / 9 / 2);
            }
            if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 14) {
              SGST_tax_percent14 = subscribeIData.totalCartPrice;
              SGST_totalPrice14 = allGstI.totalPrice;
              SGST_final_Price14 += Number(allGstI.totalPrice);
              GST_final_Price28 += Number((allGstI.totalPrice * 100) / 14 / 2);
            }
            if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 5) {
              SGST_tax_percent5 = subscribeIData.totalCartPrice;
              SGST_totalPrice5 = allGstI.totalPrice;
              SGST_final_Price5 += Number(allGstI.totalPrice);
            }
            if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 12) {
              SGST_tax_percent12 = subscribeIData.totalCartPrice;
              SGST_totalPrice12 = allGstI.totalPrice;
              SGST_final_Price12 += Number(allGstI.totalPrice);
            }
            if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 18) {
              SGST_tax_percent18 = subscribeIData.totalCartPrice;
              SGST_totalPrice18 = allGstI.totalPrice;
              SGST_final_Price18 += Number(allGstI.totalPrice);
            }
            if (allGstI.tax_name == "SGST" && allGstI.tax_percent == 28) {
              SGST_tax_percent28 = subscribeIData.totalCartPrice;
              SGST_totalPrice28 = allGstI.totalPrice;
              SGST_final_Price28 += Number(allGstI.totalPrice);
            }

            if (allGstI.tax_name == "CGST" && allGstI.tax_percent == 2.5) {
              CGST_tax_percent25 = subscribeIData.totalCartPrice;
              CGST_totalPrice25 = allGstI.totalPrice;
              CGST_final_Price25 += Number(allGstI.totalPrice);
              GST_final_Price5 += Number((allGstI.totalPrice * 100) / 2.5 / 2);
            }

            if (allGstI.tax_name == "CGST" && allGstI.tax_percent == 9) {
              CGST_tax_percent9 = subscribeIData.totalCartPrice;
              CGST_totalPrice9 = allGstI.totalPrice;
              CGST_final_Price9 += Number(allGstI.totalPrice);
              GST_final_Price18 += Number((allGstI.totalPrice * 100) / 9 / 2);
            }
            if (allGstI.tax_name == "CGST" && allGstI.tax_percent == 14) {
              CGST_tax_percent14 = subscribeIData.totalCartPrice;
              CGST_totalPrice14 = allGstI.totalPrice;
              CGST_final_Price14 += Number(allGstI.totalPrice);
              GST_final_Price28 += Number((allGstI.totalPrice * 100) / 14 / 2);
            }

            if (allGstI.tax_name == "IGST" && allGstI.tax_percent == 5) {
              IGST_tax_percent5 = Number((allGstI.totalPrice * 100) / 5);
              IGST_totalPrice5 = allGstI.totalPrice;
              IGST_final_Price5 += Number(allGstI.totalPrice);
            }
            if (allGstI.tax_name == "IGST" && allGstI.tax_percent == 12) {
              IGST_tax_percent12 = Number((allGstI.totalPrice * 100) / 12);
              IGST_totalPrice12 = allGstI.totalPrice;
              IGST_final_Price12 += Number(allGstI.totalPrice);
            }
            if (allGstI.tax_name == "IGST" && allGstI.tax_percent == 18) {
              IGST_tax_percent18 = Number((allGstI.totalPrice * 100) / 18);
              IGST_totalPrice18 = allGstI.totalPrice;
              IGST_final_Price18 += Number(allGstI.totalPrice);
            }
            if (allGstI.tax_name == "IGST" && allGstI.tax_percent == 28) {
              IGST_tax_percent28 = Number((allGstI.totalPrice * 100) / 28);
              IGST_totalPrice28 = allGstI.totalPrice;
              IGST_final_Price28 += Number(allGstI.totalPrice);
            }
          }
          var total =
            +GST_final_Price5 +
            +GST_final_Price12 +
            +GST_final_Price18 +
            +GST_final_Price28 +
            +SGST_totalPrice25 +
            +SGST_totalPrice6 +
            +SGST_totalPrice9 +
            +SGST_totalPrice14 +
            +SGST_totalPrice5 +
            +SGST_totalPrice12 +
            +SGST_totalPrice18 +
            +SGST_totalPrice28 +
            +CGST_totalPrice25 +
            +CGST_totalPrice6 +
            +CGST_totalPrice9 +
            +CGST_totalPrice14 +
            +CGST_totalPrice5 +
            +CGST_totalPrice12 +
            +CGST_totalPrice18 +
            +CGST_totalPrice28 +
            +IGST_tax_percent5 +
            +IGST_final_Price5 +
            +IGST_tax_percent12 +
            +IGST_final_Price12 +
            +IGST_tax_percent18 +
            +IGST_final_Price18 +
            +IGST_tax_percent28 +
            +IGST_totalPrice28;
          var expmptValue = +total ? (+total).toFixed(3) : 0;
          var exmpValueRound =
            (+subscribeIData.total_payment -
              expmptValue -
              ((subscribeIData.deliveryCharges ? +subscribeIData.deliveryCharges : 0) +
                (subscribeIData.codCharges ? +subscribeIData.codCharges : 0))) *
            days;
          var totalCartPriceWithoutGSTSub =
            subscribeIData.totalCartPriceWithoutGST * days -
            (subscribeIData.redeemDiscount + subscribeIData.totalCouponDiscountAmount + +subscribeIData.referralDiscount) * days;
          SubscribeJsonDataArray.push({
            OrderRealDate: OrderRealDate1,
            OrderDate: OrderDate1,
            OrderTime: OrderTime1,
            OrderID: subscribeIData.SubscriptionID,
            invoiceNumber: subscribeIData.invoiceNO,
            OrderStatus: subscribeIData.BookingStatusByAdmin,
            paymentmethod: subscribeIData.paymentmethod,
            payment: subscribeIData.payment,
            CustomerName: subscribeIData.userName,
            gstno: subscribeIData.gst_no,
            CustomerCity: subscribeIData.booking_address.city,
            CustomerType: subscribeIData.userType,
            Subtotal: subscribeIData.total_payment * days,
            totalCartPriceWithoutGST: totalCartPriceWithoutGSTSub.toFixed(2),
            exempt: exmpValueRound >= 1 ? exmpValueRound.toFixed(3) : 0,
            adjustment: exmpValueRound < 1 ? exmpValueRound.toFixed(3) : 0,
            GST_final_Price5: GST_final_Price5 ? (+GST_final_Price5 * days).toFixed(3) : "",
            GST_final_Price12: GST_final_Price12 ? (+GST_final_Price12 * days).toFixed(3) : "",
            GST_final_Price18: GST_final_Price18 ? (+GST_final_Price18 * days).toFixed(3) : "",
            GST_final_Price28: GST_final_Price28 ? (+GST_final_Price28 * days).toFixed(3) : "",
            //SGST_tax_percent25: SGST_tax_percent25,
            SGST_totalPrice25: SGST_totalPrice25 ? (+SGST_totalPrice25 * days).toFixed(3) : "",
            //SGST_tax_percent6: SGST_tax_percent6,
            SGST_totalPrice6: SGST_totalPrice6 ? (+SGST_totalPrice6 * days).toFixed(3) : "",
            // SGST_tax_percent9: SGST_tax_percent9,
            SGST_totalPrice9: SGST_totalPrice9 ? (+SGST_totalPrice9 * days).toFixed(3) : "",
            //SGST_tax_percent14: SGST_tax_percent14,
            SGST_totalPrice14: SGST_totalPrice14 ? (+SGST_totalPrice14 * days).toFixed(3) : "",
            // SGST_tax_percent5: SGST_tax_percent5,
            SGST_totalPrice5: SGST_totalPrice5 ? (+SGST_totalPrice5 * days).toFixed(3) : "",
            SGST_totalPrice12: SGST_totalPrice12 ? (+SGST_totalPrice12 * days).toFixed(3) : "",
            SGST_totalPrice18: SGST_totalPrice18 ? (+SGST_totalPrice18 * days).toFixed(3) : "",
            SGST_totalPrice28: SGST_totalPrice28 ? (+SGST_totalPrice28 * days).toFixed(3) : "",
            CGST_totalPrice25: CGST_totalPrice25 ? (+CGST_totalPrice25 * days).toFixed(3) : "",
            CGST_totalPrice6: CGST_totalPrice6 ? (+CGST_totalPrice6 * days).toFixed(3) : "",
            CGST_totalPrice9: CGST_totalPrice9 ? (+CGST_totalPrice9 * days).toFixed(3) : "",
            CGST_totalPrice14: CGST_totalPrice14 ? (+CGST_totalPrice14 * days).toFixed(3) : "",
            CGST_totalPrice5: CGST_totalPrice5 ? (+CGST_totalPrice5 * days).toFixed(3) : "",
            CGST_totalPrice12: CGST_totalPrice12 ? (+CGST_totalPrice12 * days).toFixed(3) : "",
            CGST_totalPrice18: CGST_totalPrice18 ? (+CGST_totalPrice18 * days).toFixed(3) : "",
            CGST_totalPrice28: CGST_totalPrice28 ? (+CGST_totalPrice28 * days).toFixed(3) : "",
            IGST_tax_percent5: IGST_tax_percent5 ? (+IGST_tax_percent5 * days).toFixed(3) : "",
            IGST_totalPrice5: IGST_final_Price5 ? (+IGST_final_Price5 * days).toFixed(3) : "",
            IGST_tax_percent12: IGST_tax_percent12 ? (+IGST_tax_percent12 * days).toFixed(3) : "",
            IGST_totalPrice12: IGST_final_Price12 ? (+IGST_final_Price12 * days).toFixed(3) : "",
            IGST_tax_percent18: IGST_tax_percent18 ? (+IGST_tax_percent18 * days).toFixed(3) : "",
            IGST_totalPrice18: IGST_final_Price18 ? (+IGST_final_Price18 * days).toFixed(3) : "",
            IGST_tax_percent28: IGST_tax_percent28 ? (+IGST_tax_percent28 * days).toFixed(3) : "",
            IGST_totalPrice28: IGST_totalPrice28 ? (+IGST_totalPrice28 * days).toFixed(3) : "",

            // GST: subscribeIData.gst,
            deliveryCharges:
              ((subscribeIData.deliveryCharges ? +subscribeIData.deliveryCharges : 0) +
                (subscribeIData.codCharges ? +subscribeIData.codCharges : 0)) *
              days,
            totalDiscount: (subscribeIData.redeemDiscount + subscribeIData.totalCouponDiscountAmount + +subscribeIData.referralDiscount) * days,
          });
        }
      }
      //Subscription data end
      //var finalData = jsonData;

      const finalData = jsonData.concat(SubscribeJsonDataArray);
      finalData.sort((a, b) => {
        return new Date(a.OrderRealDate) - new Date(b.OrderRealDate);
      });

      csvWriter
        .writeRecords(finalData) // returns a promise
        .then(() => {
          console.log("...Done");
        });
      //var report = t + ".csv";
      var name = "Sales Report With Taxation";
      var reportType = "SalesReportWithTaxation";
      var fileName = report;
      var startDate = startDateTime;
      var endDate = endDateTime;
      genrateReport(res, name, reportType, fileName, startDate, endDate);
    } else if (reportType == "inhouse" || reportType == "lost" || reportType == "return") {
      var DataFilter = {};
      if (req.body.reportType) {
        DataFilter["voucherType"] = req.body.reportType;
      }
      if (startDateTime && endDateTime) {
        var from_date1 = new Date(startDateTime);
        var to_date1 = new Date(endDateTime);
        //to_date1.setDate(to_date1.getDate() + 1);
        DataFilter["created_at"] = { $gte: from_date1, $lt: to_date1 };
      }
      let data = await voucherInventory
        .find(DataFilter)
        .populate("admin_id")
        .populate("regionID")
        .populate("product_id")
        .sort({ created_at: "desc" })
        .lean();

      {
        var t = Math.random();
        var FileName = req.body.reportType;
        var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);

        var report = file_Name + ".csv";
        const csvWriter = createCsvWriter({
          path: "./public/reports/" + file_Name + ".csv",
          header: [
            { id: "Date", title: "Date" },
            { id: "voucherType", title: "Type" },
            { id: "ProductName", title: "Product Name" },
            { id: "Region", title: "Region" },
            { id: "Quantity", title: "Quantity" },
            { id: "unitMeasurement", title: "Product Measurement" },
            { id: "Note", title: "Note" },
            { id: "admin_name", title: "Added By" },
          ],
        });
        var jsonData = [];
        for (var i = 0; i < data.length; i++) {
          var iData = data[i];
          var createDate_formatted = moment.utc(iData.created_at).tz("Asia/Kolkata");
          var Dated = createDate_formatted.format("DD-MM-YYYY hh:mm A");

          if (iData.voucherType == "inhouse") {
            var voucherType = "In-House Usage";
          } else if (iData.voucherType == "lost") {
            var voucherType = "Lost/Damage Inventory";
          } else if (iData.voucherType == "return") {
            var voucherType = "Return Inventory";
          }

          jsonData.push({
            Date: Dated,
            voucherType: voucherType,
            ProductName: iData.product_id.product_name,
            Region: iData.regionID.name,
            Quantity: iData.TotalQuantity,
            unitMeasurement: iData.unitMeasurement,
            Note: iData.note,
            admin_name: iData.admin_id.username,
          });
        }
        //sorting of json data
        function dynamicSort(property) {
          var sortOrder = 1;
          if (property[0] === "-") {
            sortOrder = -1;
            property = property.substr(1);
          }
          return function (a, b) {
            if (sortOrder == -1) {
              return b[property].localeCompare(a[property]);
            } else {
              return a[property].localeCompare(b[property]);
            }
          };
        }
        var sortedData = jsonData.sort(dynamicSort("ProductName"));
        //end of sorting function
        csvWriter
          .writeRecords(sortedData) // returns a promise
          .then(() => {});
        var name = req.body.reportType;
        var reportType = report;
        var fileName = report;
        var startDate = startDateTime;
        var endDate = endDateTime;
        genrateReport(res, name, reportType, fileName, startDate, endDate);
      }
    } else if (reportType == "SalesReportWithTaxation") {
      var date = new Date(endDateTime);
      date.setDate(date.getDate() + 1);
      bookingDataBase
        .aggregate(
          [
            {
              $match: {
                createDate: {
                  $gte: new Date(startDateTime),
                  $lte: new Date(endDateTime),
                },
                BookingStatusByAdmin: { $ne: "Failed" },
              },
            },

            {
              $group: {
                //_id: "$user_id",
                _id: {
                  user_id: "$user_id",
                  userName: "$userName",
                  userEmail: "$userEmail",
                  userMobile: "$userMobile",
                  userType: "$userType",
                },
                details: { $push: "$$ROOT" },
                TotalOrder: { $sum: 1 },
                TotalAmount: { $sum: "$total_payment" },
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "user_id",
                as: "userData",
              },
            },
          ],
          { allowDiskUse: true }
        )
        .exec(function (err, array2) {
          if (err) {
            res.status(500).json(err);
          } else if (!array2) {
            res.status(400).json({
              message: "error",
              data: "",
              code: 0,
            });
          }
          var t = Math.random();
          var FileName = "Customer_Data";
          var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
          var report = file_Name + ".csv";

          const csvWriter = createCsvWriter({
            path: "./public/reports/" + file_Name + ".csv",
            header: [
              {
                id: "CustomerName",
                title: "Customer Name",
              },
              {
                id: "CustomerPhone",
                title: "Customer Phone",
              },
              // {
              //   id: "creditLimit",
              //   title: "Credit Limit",
              // },
              // {
              //   id: "creditUsed",
              //   title: "Credit Used",
              // },
              {
                id: "CustomerEmail",
                title: "Customer Email",
              },
              {
                id: "CustomerTpye",
                title: "Customer Type",
              },
              {
                id: "LastTransaction",
                title: "Last Transaction",
              },
              {
                id: "LastTransactionSource",
                title: "Last Transaction Source",
              },
              {
                id: "LastTransactionDays",
                title: "Last Transaction Days",
              },
              { id: "LastAddress", title: "Last Address" },
              {
                id: "TotalOrders",
                title: "Total Orders",
              },
              { id: "Revenue", title: "Revenue" },
              {
                id: "AverageBasketSize",
                title: "Average Basket Size",
              },
            ],
          });
          var result;
          if (req.body?.customer_type) {
            result = array2.filter((cur) => cur._id.userType == req.body?.customer_type);
          } else {
            result = array2;
          }
          console.log(result);
          var jsonData = [];
          for (var i = 0; i < result.length; i++) {
            if (!result[i].details) {
              var totalOrder = null;
              var TotalAmount = null;
              var LastTransactionDate = null;
              var LastTransactionSource = null;
              var LastTransactionDays = null;
              var LastAddress = null;
              var TotalOrders = null;
              var Revenue = null;
              var AverageBasketSize1 = null;
              var LOrderAddress = null;
            } else {
              var LastOrderDate = result[i].details;
              var lastOrderDate = LastOrderDate[LastOrderDate.length - 1];
              var LastTransaction = lastOrderDate.createDate;
              // var CustomerTpye = result[i].userType;

              var LastDate1 = moment.utc(LastTransaction).tz("Asia/Kolkata");
              var LastDate = LastDate1.format("MM/DD/YYYY");
              var LastTransactionDate = LastDate1.format("MM/DD/YYYY HH:mm A");
              var LastTransactionDateCol = LastDate1.format("DD-MM-YYYY");

              var TodayDate = new Date();
              var TodayDate = moment.utc(TodayDate).tz("Asia/Kolkata");
              var TodayDate = TodayDate.format("MM/DD/YYYY");
              var date_diff_indays = function (date1, date2) {
                dt1 = new Date(date1);
                dt2 = new Date(date2);
                return Math.floor(
                  (Date.UTC(dt2.getFullYear(), dt2.getMonth(), dt2.getDate()) - Date.UTC(dt1.getFullYear(), dt1.getMonth(), dt1.getDate())) /
                    (1000 * 60 * 60 * 24)
                );
              };
              var LastTransactionDays = date_diff_indays(LastDate, TodayDate);

              var ab = result[i].TotalAmount / result[i].TotalOrder;
              var bc = result[i].TotalAmount;
              var LastTransactionSource = lastOrderDate.paymentmethod;
              var TotalOrders = result[i].TotalOrder;
              var TotalAmount = bc.toFixed(1);
              var AverageBasketSize1 = ab.toFixed(1);
              var LOrderAddress = lastOrderDate.booking_address.locality;
            }
            jsonData.push({
              CustomerName: result[i]._id.userName,
              CustomerPhone: result[i]._id.userMobile,
              CustomerEmail: result[i]._id.userEmail,
              CustomerTpye: result[i]._id.userType,
              // creditLimit: result[i]._id.creditLimit,
              // creditUsed: result[i]._id.creditUsed,
              LastTransaction: LastTransactionDateCol,
              LastTransactionSource: LastTransactionSource,
              LastTransactionDays: LastTransactionDays,
              LastAddress: LOrderAddress,
              TotalOrders: TotalOrders,
              Revenue: TotalAmount,
              AverageBasketSize: AverageBasketSize1,
            });
          }

          csvWriter
            .writeRecords(jsonData) // returns a promise
            .then(() => {
              console.log("...Done");
            });
          var name = "Customer Data Report";
          var reportType = "CustomerDataReport";
          var fileName = report;
          var startDate = startDateTime;
          var endDate = endDateTime;
          genrateReport(res, name, reportType, fileName, startDate, endDate);
          // res
          //     .status(200)
          //     .json({"message":'ok',"data":report,"code":0});
          //     return;
        });
    } else if (reportType == "Customerlastorderreport") {
      console.log(req.body);
      var Not_startDateTime = req.body.Not_startDateTime;
      var Not_endDateTime = req.body.Not_endDateTime;
      var date = new Date(endDateTime);
      date.setDate(date.getDate() + 1);
      bookingDataBase
        .aggregate(
          [
            {
              $match: {
                createDate: {
                  $gte: new Date(startDateTime),
                  $lte: new Date(endDateTime),
                },
                BookingStatusByAdmin: { $ne: "Failed" },
              },
            },

            {
              $group: {
                //_id: "$user_id",
                _id: {
                  user_id: "$user_id",
                  userName: "$userName",
                  userEmail: "$userEmail",
                  userMobile: "$userMobile",
                  userType: "$userType",
                },
                details: { $push: "$$ROOT" },
                TotalOrder: { $sum: 1 },
                TotalAmount: { $sum: "$total_payment" },
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "_id.user_id",
                foreignField: "_id",
                as: "userData",
              },
            },
            {
              $lookup: {
              from: "admins",
              localField: "userData.sales_person",
              foreignField: "_id",
              as: "salesPerson",
            },
            }
          ],
          { allowDiskUse: true }
        )
        .exec(async function (err, array2) {
          if (err) {
            res.status(500).json(err);
          } else if (!array2) {
            res.status(400).json({
              message: "error",
              data: "",
              code: 0,
            });
          }
          let array3 = await bookingDataBase.aggregate(
            [
              {
                $match: {
                  createDate: {
                    $gte: new Date(Not_startDateTime),
                    $lte: new Date(Not_endDateTime),
                  },
                  BookingStatusByAdmin: { $ne: "Failed" },
                },
              },

              {
                $group: {
                  //_id: "$user_id",
                  _id: {
                    user_id: "$user_id",
                    userName: "$userName",
                    userEmail: "$userEmail",
                    userMobile: "$userMobile",
                    userType: "$userType",
                  },
                  details: { $push: "$$ROOT" },
                  TotalOrder: { $sum: 1 },
                  TotalAmount: { $sum: "$total_payment" },
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "_id",
                  foreignField: "user_id",
                  as: "userData",
                },
              },
            ],
            { allowDiskUse: true }
          );

          let original_data = [];
          for (let i of array2) {
            var is_exists = "not_exists";
            for (let j of array3) {
              if (String(i._id.user_id) == String(j._id.user_id)) {
                is_exists = "exists";
              }
            }
            if (is_exists !== "exists") {
              original_data.push(i);
            }
          }
          // for (let i of array3) {
          //   original_data = array2.filter((j) => i._id.user_id !== j._id.user_id);
          // }
          var t = Math.random();
          var FileName = "Customer_Data";
          var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
          var report = file_Name + ".csv";

          const csvWriter = createCsvWriter({
            path: "./public/reports/" + file_Name + ".csv",
            header: [
              {
                id: "CustomerName",
                title: "Customer Name",
              },
              {
                id: "CustomerPhone",
                title: "Customer Phone",
              },
              // {
              //   id: "creditLimit",
              //   title: "Credit Limit",
              // },
              // {
              //   id: "creditUsed",
              //   title: "Credit Used",
              // },
              {
                id: "CustomerEmail",
                title: "Customer Email",
              },
              {
                id: "AsignedPerson",
                title: "Asigned Person"
              },
              {
                id: "CustomerTpye",
                title: "Customer Type",
              },
              {
                id: "LastTransaction",
                title: "Last Transaction",
              },
              {
                id: "LastTransactionSource",
                title: "Last Transaction Source",
              },
              {
                id: "LastTransactionDays",
                title: "Last Transaction Days",
              },
              { id: "LastAddress", title: "Last Address" },
              {
                id: "TotalOrders",
                title: "Total Orders",
              },
              { id: "Revenue", title: "Revenue" },
              {
                id: "AverageBasketSize",
                title: "Average Basket Size",
              },
            ],
          });
          var result;
          if (req.body?.customer_type) {
            result = original_data.filter((cur) => cur._id.userType == req.body?.customer_type);
          } else {
            result = original_data;
          }
          //  console.log(result);
          var jsonData = [];
          for (var i = 0; i < result.length; i++) {
            if (!result[i].details) {
              var totalOrder = null;
              var TotalAmount = null;
              var LastTransactionDate = null;
              var LastTransactionSource = null;
              var LastTransactionDays = null;
              var LastAddress = null;
              var TotalOrders = null;
              var Revenue = null;
              var AverageBasketSize1 = null;
              var LOrderAddress = null;
            } else {
              var LastOrderDate = result[i].details;
              var lastOrderDate = LastOrderDate[LastOrderDate.length - 1];
              var LastTransaction = lastOrderDate.createDate;
              // var CustomerTpye = result[i].userType;

              var LastDate1 = moment.utc(LastTransaction).tz("Asia/Kolkata");
              var LastDate = LastDate1.format("MM/DD/YYYY");
              var LastTransactionDate = LastDate1.format("MM/DD/YYYY HH:mm A");
              var LastTransactionDateCol = LastDate1.format("DD-MM-YYYY");

              var TodayDate = new Date();
              var TodayDate = moment.utc(TodayDate).tz("Asia/Kolkata");
              var TodayDate = TodayDate.format("MM/DD/YYYY");
              var date_diff_indays = function (date1, date2) {
                dt1 = new Date(date1);
                dt2 = new Date(date2);
                return Math.floor(
                  (Date.UTC(dt2.getFullYear(), dt2.getMonth(), dt2.getDate()) - Date.UTC(dt1.getFullYear(), dt1.getMonth(), dt1.getDate())) /
                    (1000 * 60 * 60 * 24)
                );
              };
              var LastTransactionDays = date_diff_indays(LastDate, TodayDate);

              var ab = result[i].TotalAmount / result[i].TotalOrder;
              var bc = result[i].TotalAmount;
              var LastTransactionSource = lastOrderDate.paymentmethod;
              var TotalOrders = result[i].TotalOrder;
              var TotalAmount = bc.toFixed(1);
              var AverageBasketSize1 = ab.toFixed(1);
              var LOrderAddress = lastOrderDate.booking_address.locality;
            }
            jsonData.push({
              CustomerName: result[i]._id.userName,
              CustomerPhone: result[i]._id.userMobile,
              CustomerEmail: result[i]._id.userEmail,
              CustomerTpye: result[i]._id.userType,
              // creditLimit: result[i]._id.creditLimit,
              // creditUsed: result[i]._id.creditUsed,
              LastTransaction: LastTransactionDateCol,
              LastTransactionSource: LastTransactionSource,
              LastTransactionDays: LastTransactionDays,
              LastAddress: LOrderAddress,
              TotalOrders: TotalOrders,
              Revenue: TotalAmount,
              AverageBasketSize: AverageBasketSize1,
              AsignedPerson: result[i].salesPerson.length > 0 ? result[i].salesPerson[0].username : "N/A",

            });
          }

          csvWriter
            .writeRecords(jsonData) // returns a promise
            .then(() => {
              console.log("...Done");
            });
          var name = "Customer last order Report";
          var reportType = "Customerlastorderreport";
          var fileName = report;
          var startDate = startDateTime;
          var endDate = endDateTime;
          genrateReport(res, name, reportType, fileName, startDate, endDate);
          // res
          //     .status(200)
          //     .json({"message":'ok',"data":report,"code":0});
          //     return;
        });
    } else if (reportType == "CustomerSignupData") {
      console.log("startted")
      let user_Data = await User.find();
      var t = Math.random();
          var FileName = "Customer_Data";
          var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
          var report = file_Name + ".csv";

          const csvWriter = createCsvWriter({
            path: "./public/reports/" + file_Name + ".csv",
            header: [
              {
                id: "CustomerName",
                title: "Customer Name",
              },
              {
                id: "CustomerPhone",
                title: "Customer Phone",
              },
              {
                id: "CustomerEmail",
                title: "Customer Email",
              },
              {
                id: "CustomerType",
                title: "Customer Type",
              },
              { id: "LastAddress", title: "Last Address" },
            ],
          });
          var jsonData = [];
            let all_address = await UserAddress.find()
          for (let i of user_Data){
            console.log("createing")
            let address = all_address.filter((a)=>a.user_id == i._id)
            jsonData.push({
              CustomerName:i.name ,
              CustomerPhone:i.contactNumber ,
              CustomerEmail:i.email ,
              LastAddress : address[1]?.houseNo ? address[1]?.houseNo : "" +   address[1]?.street ? address[1]?.street : "" +  address[1]?.city ? address[1]?.city : "" +  address[1]?.district ? address[1]?.district : "",
              CustomerType: i.user_type
            })
          }
          csvWriter
            .writeRecords(jsonData) // returns a promise
            .then(() => {
              console.log("...Done");
            });
          var name = "Customer Signup Data";
          var reportType = "CustomerSignupData";
          var fileName = report;
          var startDate = startDateTime;
          var endDate = endDateTime;
          genrateReport(res, name, reportType, fileName, startDate, endDate);
    } else if (reportType == "Productlist") {
     let array2 = await ProductDatabase.find().select('product_name SKUCode hsnCode unitMeasurement').populate('unitMeasurement')
           console.log(array2[0],"222222222222")
         var FileName = "Product List";
              var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
              var report = file_Name + ".csv";
          const csvWriter = createCsvWriter({
                path: "./public/reports/" + file_Name + ".csv",
                header: [
                  {
                    id: "itemname",
                    title: "item name",
                  },
                  {
                    id: "skucode",
                    title: "sku code",
                  },
                  {
                    id: "hsncode",
                    title: "hsncode",
                  },
                  {
                id: "unitmeasurements",
                title: "unit measurements",
              },
                ],
              });
                console.log("3333333333333")
          var jsonData = [];
          for (var i = 0; i < array2.length; i++) {
            jsonData.push({
              itemname: array2[i]?.product_name,
              skucode: array2[i]?.SKUCode,
              hsncode: array2[i]?.hsnCode,
              unitmeasurements: array2[i]?.unitMeasurement?.name,
            });
          }
                console.log("44444444444444444444")
          csvWriter
            .writeRecords(jsonData) // returns a promise
            .then(() => {
              console.log("...Done");
            });
          var name = "Product List";
          var reportType = "Productlist";
          var fileName = report;
          var startDate = startDateTime;
          var endDate = endDateTime;
          genrateReport(res, name, reportType, fileName, startDate, endDate);
  } else if (reportType == "SalesReportWithTaxationAccounts"){

      if (startDateTime && endDateTime) {
        var from_date1 = new Date(startDateTime);
        var to_date1 = new Date(endDateTime);
        // to_date1.setDate(to_date1.getDate() + 1);
      }
      bookingDataBase
        .find({
          $and: [
            { createDate: { $gte: from_date1, $lte: to_date1 } },
            {
              $or: [{ BookingStatusByAdmin: { $ne: "Rejected" }, BookingStatusByAdmin: { $ne: "Failed" } }],
            },
          ],
        })
        
        .populate("user_id")
        .populate("driver_id")
        .populate("regionID")
        .populate("user_id")
        .populate({
            path: 'user_id',
            populate: {
              path: 'sales_person',
              model: 'admin'
            } 
         })
        // .populate('bookingdetail.product_id')
        .exec(function (err, data) {
          var t = Math.random();
          var FileName = "SalesReportWithTaxationAccounts";
          var file_Name = common.fileNameDyanmic(startDateTime, endDateTime, FileName);
          var report = file_Name + ".csv";

          const csvWriter = createCsvWriter({
            path: "./public/reports/" + file_Name + ".csv",
            // header: [
            //   { id: "OrderDate", title: "Order Date" },
            //   { id: "BillingDate", title: "Billing Date" },
            //   { id: "OrderTime", title: "Order Time" },
            //   { id: "OrderStatus", title: "Order Status" },
            //   { id: "PaymentMethod", title: "Payment Method" },
            //   { id: "CustomerName", title: "Customer Name" },
            //   { id: "CustomerMobileNo", title: "Customer Mobile No" },
            //   { id: "CustomerType", title: "Customer Type" },
            //   {id: "AsignedPerson",title: "Asigned Person"},
            //   { id: "CustomerEmail", title: "Customer Email" },
            //   { id: "DeliveryboyName", title: "Delivery Boy Name" },
            //   { id: "deliverySlot", title: "Delivery Slot" },
            //   {
            //     id: "OrderDeliveryDate",
            //     title: "Order Delivery Date",
            //   },
            //   {
            //     id: "ReferenceNumber",
            //     title: "Order ID",
            //   },
            //   { id: "OutletName", title: "Region" },
            //   { id: "ItemName", title: "Item Name" },
            //   { id: "packaging", title: "Packaging" },
            //   { id: "ItemQuantity", title: "Item Quantity" },
            //   { id: "category", title: "category" },
            //   {
            //     id: "totalPriceBeforeGST",
            //     title: "Item Total Price Without GST",
            //   },
            //   { id: "ItemTaxes", title: "Item Taxes" },
            //   { id: "ItemDiscount", title: "Item Discount" },
            //   { id: "ItemTotal", title: "Item Total Price" },
            // ],
            header: [
              
              { id: "VchNo", title: "Vch No" },
              { id: "VchType", title: "Vch Type" },
              { id: "Date", title: "Date" },
              { id: "BillingDate", title: "Billing Date" },
              { id: "reffNo", title: "reffNo" },
              { id: "Item", title: "Item" },
              { id: "packaging", title: "Packaging" },
              { id: "description", title: "description" },
              { id: "Qty", title: "Qty" },
              { id: "Rate", title: "Rate" },
              { id: "ItemPrice", title: "Item Price" },
              { id: "PartyName",title: "PartyName"},
              { id: "CustomerCity", title: "Customer City" },
              { id: "CustomerPincode", title: "Customer Pincode" },
              { id: "CustomerState", title: "Customer State" },
              { id: "Gstno",title: "Gst no"},
              { id: "Cgstledger", title: "Cgst ledger"},
              { id: "Sgstledger", title: "Sgst ledger" },
              { id: "Igstledger", title: "Igst ledger" },
              { id: "SaleLedger", title: "Sale Ledger" },
              { id: "itemgroup", title: "item group" },
              { id: "unit", title: "unit" },
              { id: "GSTApplicable",title: "GST Applicable"},
              { id: "TypeofSupply", title: "Type of Supply" },
              { id: "GSTApplicableDate", title: "GST Applicable Date" },
              { id: "HSNCode", title: "HSN Code" },
              { id: "HSNDesc", title: "HSN Desc" },
              { id: "Taxablity", title: "Taxablity" },
              { id: "RateOfIGST", title: "Rate Of IGST" },
              { id: "RateofCGST", title: "Rate of CGST" },
              { id: "RateOfSGST", title: "Rate Of SGST" },
              { id: "RateOfCess", title: "Rate Of Cess" },


            ],
          });
          var jsonData = [];
          for (var i = 0; i < data.length; i++) {
          	console.log(data[i]?.allGstLists)
            var iData = data[i];
            if(iData?.backendOrderDate){
              var backendOrderDate = moment.utc(iData.backendOrderDate).tz("Asia/Kolkata");
            var backend_OrderDate = backendOrderDate.format("DD-MM-YYYY");
            }
            else{
              var backend_OrderDate = ""
            }
            var createDate_formatted = moment.utc(iData.createDate).tz("Asia/Kolkata");
            var OrderDate = createDate_formatted.format("DD-MM-YYYY");
            var OrderTime = createDate_formatted.format("HH:mm A");

            if (iData.driver_id != null) {
              if (iData.driver_id.name) {
                var driverName = iData.driver_id.name;
              } else {
                var driverName = null;
              }
            } else {
              var driverName = null;
            }

            if (iData.DeliveryDate) {
              var DeliveryDate_formatted = moment.utc(iData.DeliveryDate).tz("Asia/Kolkata");
              var DeliveryDate = DeliveryDate_formatted.format("DD-MM-YYYY");
            } else {
              var DeliveryDate = null;
            }
            var BookingDetail = iData.bookingdetail;

            var ItemLength = BookingDetail.length;
            for (var k = 0; k < BookingDetail.length; k++) {
              var BookingDetailZ = BookingDetail[k];
              if (BookingDetailZ.TypeOfProduct == "group") {
                var product_categoriesArray = [];
                var product_name = "";
                var packaging = null;
                var totalPrice = 0;
                var totalPriceBeforeGST = 0;
                var ItemDiscount = 0;
                var ItemTaxes = 0;
                var ItemDeliveryCharges = 0;
                var description = "";

                var hsnCode = BookingDetail[k]?.product_id?.hsnCode

                var qty = 0;
                for (let j = 0; j < BookingDetailZ.groupData.length; j++) {
                  let set = BookingDetailZ.groupData[j];
                  let setQty = 0;
                  let itemsArray = [];
                  for (let k = 0; k < set.sets.length; k++) {
                    var product_categoriesArray = [];
                    if (BookingDetailZ.product_categories) {
                      var product_categories = BookingDetailZ.product_categories;
                      for (var i1 = 0; i1 < product_categories.length; i1++) {
                        product_categoriesArray.push(product_categories[i1].category_name);
                      }
                    }
                    let product_name = set.sets[k].product.product_name;
                    var ItemQuantity =
                      (set.sets[k].package ? set.sets[k].package.packetLabel : set.sets[k].unitQuantity + "" + BookingDetailZ.unitMeasurement) +
                      " " +
                      set.sets[k].qty;
                      if(ItemQuantity){
                      	itemsArray.push(product_name + " " + ItemQuantity);
                      }
                    // itemsArray.push(product_name + " " + ItemQuantity);
                    // product_name = set.sets[k].product.product_name;
                    // totalPrice = set.sets[k].qty*BookingDetailZ.qty*set.sets[k].price
                    // qty = set.sets[k].qty*BookingDetailZ.qty
                    // ItemQuantity = (set.sets[k].package ? set.sets[k].package.packetLabel : set.sets[k].unitQuantity+' '+BookingDetailZ.unitMeasurement)
                  }
                  product_categoriesArray.push(product_categoriesArray);
                  // product_name.push(BookingDetailZ.product_name + "(" + itemsArray + ")");
                  product_name = BookingDetailZ.product_name;
                  description = "(" + itemsArray + ")";
                  totalPrice = BookingDetailZ.totalprice;
                  totalPriceBeforeGST = BookingDetail[k].totalPriceBeforeGST;
                  ItemDiscount = BookingDetail[k].itemDiscountAmount ? +BookingDetail[k].totalprice - +BookingDetail[k].itemDiscountAmount : 0;
                  ItemTaxes = BookingDetail[k].itemWiseGst;
                  ItemDeliveryCharges = BookingDetail[k].deliveryCharges;
                  qty = BookingDetailZ.qty;
                }
              }
              if (BookingDetailZ.TypeOfProduct == "simple") {
                var product_categoriesArray = [];
                if (BookingDetailZ.product_categories) {
                  var product_categories = BookingDetailZ.product_categories;
                  for (var i1 = 0; i1 < product_categories.length; i1++) {
                    product_categoriesArray.push(product_categories[i1].category_name);
                  }
                }

                var product_name = BookingDetailZ.product_name;
                var packaging = BookingDetail[k].without_package
                  ? BookingDetail[k].unitQuantity + " " + BookingDetail[k].unitMeasurement
                  : BookingDetail[k].packetLabel;
                var qty = BookingDetail[k].qty;
                var totalPrice = BookingDetail[k].totalprice;
                var totalPriceBeforeGST = BookingDetail[k].totalPriceBeforeGST;
                var ItemDiscount = BookingDetail[k].itemDiscountAmount ? +BookingDetail[k].totalprice - +BookingDetail[k].itemDiscountAmount : 0;
                var ItemTaxes = BookingDetail[k].itemWiseGst;
                var description = "";
                var hsnCode = BookingDetail[k]?.product_id?.hsnCode
              }
              if (iData.BookingStatusByAdmin == "Pending" && iData.payment == "Pending" && iData.paymentmethod == "Paytm") {
                var BookingStatusByAdmin = "Failed";
              } else {
                var BookingStatusByAdmin = iData.BookingStatusByAdmin;
              }
              // var ItemQuantity;
              // var ItemQuantity =  BookingDetail[k].without_package ? BookingDetail[k].unitQuantity+' '+BookingDetail[k].unitMeasurement : BookingDetail[k].packetLabel
              // jsonData.push({
              //   OrderDate: OrderDate,
              //   BillingDate:backend_OrderDate,
              //   OrderTime: OrderTime,
              //   PaymentMethod: iData.paymentmethod,
              //   OrderStatus: BookingStatusByAdmin,
              //   CustomerName: iData.userName,
              //   CustomerMobileNo: iData.userMobile,
              //   CustomerType: iData.userType,
              //   CustomerEmail: iData.userEmail,
              //   DeliveryboyName: driverName,
              //   deliverySlot: iData.deliverySlot,
              //   OrderDeliveryDate: DeliveryDate,
              //   ReferenceNumber: iData.booking_code,
              //   OutletName: iData.regionName,
              //   ItemName: product_name,
              //   packaging: packaging,
              //   ItemQuantity: qty,
              //   category: product_categoriesArray,
              //   ItemTotal: totalPrice,
              //   totalPriceBeforeGST: totalPriceBeforeGST,
              //   ItemDiscount: ItemDiscount,
              //   ItemTaxes: ItemTaxes,
              //   AsignedPerson: iData?.user_id?.sales_person?.username ? iData?.user_id?.sales_person.username : "N/A",

              // });
              var Cgstledger = totalPriceBeforeGST != totalPrice ? data[i]?.allGstLists.filter((cur)=>cur.tax_name == "CGST").length >0 ? "OUTPUT CGST @" + (data[i]?.allGstLists.filter((cur)=>cur.tax_name == "CGST")[0].tax_percent) + "%" : "" : ""
              var Sgstledger = totalPriceBeforeGST != totalPrice ? data[i]?.allGstLists.filter((cur)=>cur.tax_name == "SGST").length >0 ? "OUTPUT SGST @" + (data[i]?.allGstLists.filter((cur)=>cur.tax_name == "SGST")[0].tax_percent) + "%" : "": ""
              var Igstledger = totalPriceBeforeGST != totalPrice ? data[i]?.allGstLists.filter((cur)=>cur.tax_name == "IGST").length >0 ? "OUTPUT IGST @" + (data[i]?.allGstLists.filter((cur)=>cur.tax_name == "IGST")[0].tax_percent) + "%" : "": ""
              var SaleLedger = "";
              if(Cgstledger && Sgstledger){
              	SaleLedger = "SALES CGST & SGST" + " " + "@" + (parseInt(data[i]?.allGstLists.filter((cur)=>cur.tax_name == "CGST")[0].tax_percent) + parseInt(data[i]?.allGstLists.filter((cur)=>cur.tax_name == "SGST")[0].tax_percent)) + "%"
              } else if(Igstledger){
              	SaleLedger = "SALES IGST @" + (data[i]?.allGstLists.filter((cur)=>cur.tax_name == "IGST")[0].tax_percent) + "%"
              }
              jsonData.push({
              	reffNo:iData?.booking_code,
              	VchType:"Sales",
                Date: OrderDate,
                BillingDate:backend_OrderDate,
                VchNo:iData?.invoiceNO,
                Item: product_name,
                packaging: packaging,
                description:description,
                Qty: qty,
                Rate: totalPrice/qty,
                ItemPrice: totalPrice,
                PartyName: iData.userName,
                CustomerCity: iData?.booking_address?.city,
                CustomerPincode: iData?.booking_address?.pincode,
                CustomerState: iData?.booking_address?.state,
                Gstno: iData?.user_id?.gst_no,
                Cgstledger:Cgstledger,
                Sgstledger:Sgstledger,
                Igstledger: Igstledger,
                SaleLedger: SaleLedger,
                itemgroup: "",
                unit: "",
                GSTApplicable: totalPriceBeforeGST == totalPrice ? "No" : "yes",
                TypeofSupply: "Goods",
                GSTApplicableDate:"01/04/2022",
                HSNCode: hsnCode,
                HSNDesc: "",
                Taxablity: totalPriceBeforeGST == totalPrice ? "Exempt" : "Taxable",
                unit: BookingDetailZ.TypeOfProduct == "group" ? "Group" : BookingDetailZ.TypeOfProduct == "simple" && typeof(BookingDetail[k].unitMeasurement) == "object"
                ? BookingDetail[k].unitMeasurement?.name
                : BookingDetail[k].unitMeasurement ,
                RateOfIGST: Igstledger ? data[i]?.allGstLists.filter((cur)=>cur.tax_name == "IGST")[0].tax_percent : "",
                RateofCGST: Cgstledger ? data[i]?.allGstLists.filter((cur)=>cur.tax_name == "CGST")[0].tax_percent : "",
                RateOfSGST: Sgstledger ? data[i]?.allGstLists.filter((cur)=>cur.tax_name == "SGST")[0].tax_percent : "",
                RateOfCess: "",


              });
            }
          }
          csvWriter
            .writeRecords(jsonData) // returns a promise
            .then(() => {
              console.log("...Done");
            });
          //var report = t + ".csv";
          var name = "Sales Report With Taxation Accounts";
          var reportType = "SalesReportWithTaxationAccounts";
          var fileName = report;
          var startDate = startDateTime;
          var endDate = endDateTime;
          genrateReport(res, name, reportType, fileName, startDate, endDate);
        });
    
}
  } catch (error) {
    console.log(error);
  }
};
module.exports.CSVReportListing = function (req, res) {
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
    res.status(400).json({
      message: "Count limit of " + maxCount + " exceeded",
    });
    return;
  }
  table.count().exec(function (err, count) {
    table
      .find()
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

//last month sale summary for dashboard
module.exports.LastMonthsaleSummary = function (req, res) {
  // var startDateTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  // var endDateTime = new Date();
  var startDateTime = req.body.startDateTime;
  var endDateTime = req.body.endDateTime;

  bookingDataBase
    .aggregate([
      {
        $match: {
          createDate: {
            $gte: new Date(startDateTime),
            $lte: new Date(endDateTime),
          },
        },
      },
      {
        $group: {
          _id: {
            day: { $dayOfYear: "$createDate" },
            year: { $year: "$createDate" },
          },
          details: { $push: "$createDate" },
          totalAmount: { $sum: "$total_payment" },
          count: { $sum: 1 },
        },
      },
    ])
    .exec(function (err, Data) {
      if (err) {
        res.status(500).json(err);
      } else if (!Data) {
        res.status(400).json({
          message: "error",
          data: "",
          code: 0,
        });
      }
      var JsonData = [];
      for (var i = 0; i < Data.length; i++) {
        var num = Data[i].totalAmount;
        JsonData.push({
          date: Data[i].details[0],
          totalAmount: num.toFixed(2),
          count: Data[i].count,
        });
      }
      res.status(201).json({ message: "ok", data: JsonData, code: 1 });
    });
};

//total and daily sale dashboard count
module.exports.DailySaleReport = function (req, res) {
  var startDateTime = new Date(req.body.startDateTime);
  const endDateTime = new Date(req.body.startDateTime);
  endDateTime.setDate(endDateTime.getDate() + 1);
  bookingDataBase
    .aggregate([
      {
        $match: {
          createDate: {
            $gte: new Date(startDateTime),
            $lt: new Date(endDateTime),
          },
        },
      },

      {
        $group: {
          _id: null,
          total_payment: {
            $sum: "$total_payment",
          },
        },
      },
    ])
    .exec(function (err, Data) {
      if (err) {
        res.status(500).json(err);
      } else if (!Data) {
        res.status(400).json({
          message: "error",
          data: "",
          code: 0,
        });
      }

      res.status(201).json({ message: "ok", data: Data, code: 1 });
    });
};

module.exports.TotalSaleReport = function (req, res) {
  var startDateTime = req.body.startDateTime;
  var endDateTime = req.body.endDateTime;
  bookingDataBase
    .aggregate([
      {
        $match: {
          createDate: {
            $gte: new Date(startDateTime),
            $lte: new Date(endDateTime),
          },
        },
      },
      {
        $group: {
          _id: null,
          total_payment: {
            $sum: "$total_payment",
          },
        },
      },
    ])
    .exec(function (err, Data) {
      if (err) {
        res.status(500).json(err);
      } else if (!Data) {
        res.status(400).json({
          message: "error",
          data: "",
          code: 0,
        });
      }

      res.status(201).json({ message: "ok", data: Data, code: 1 });
    });
};

// ************************ Created By Abhishek **************************************

module.exports.generateInvoice = async (req, res) => {
  try {
    const { booking_code, subscription_code } = req.body;

    if (!booking_code && !subscription_code) {
      common.formValidate("booking_code", res);
      return false;
    }

    // get booking details
    let booking;
    if (booking_code) {
      booking = await bookingDataBase.findOne({ booking_code }).populate("user_id").lean();
    } else {
      booking = await subscriptionDataBase.findOne({ SubscriptionID: subscription_code }).populate("user_id").lean();
    }
    // console.log("@@@@@@@@@@@@@@@@@@@@ booking ## ", booking.dates);
    if (!booking) {
      res.status(500).json({
        message: "No booking found with the given ID",
      });
    }

    // get company details
    let company;
    if (booking.billingCompany) {
      company = await Company.findById(booking.billingCompany).lean();
    } else {
      company = await Company.findOne({ isDefault: true }).lean();
    }

    // get settings (for getting logo)
    var settings = await settingsModel.findOne({}).lean();
    var storeheySettings = await storeheySettingsModel.findOne({}).lean();
    let logoBytes = fs.readFileSync(Path.join(__dirname, "../../public/upload/", settings.image));
    // let watermarkBytes = fs.readFileSync(Path.join(__dirname, "../../public/invoices/", "logo-krishi-watemark.png"));

    // numeric calculations
    var totalAmount = +booking.totalCartPrice + +booking.deliveryCharges + +booking.codCharges;
    var taxAmount = 0;
    booking.allGstLists = booking.allGstLists.filter((gst) => {
      return Number(gst.tax_percent) > 0;
    });
    booking.allGstLists.forEach((gst) => {
      taxAmount += +gst.totalPrice;
    });

    var subTotal = 0;
    var primaryDiscountTotal = 0;
    booking.bookingdetail.forEach((item) => {
      subTotal += item.itemDiscountAmount ? +item.itemDiscountAmountBeforeGST : +item.totalPriceBeforeGST;
      primaryDiscountTotal += item.itemDiscountAmount ? +item.totalprice - +item.itemDiscountAmount : 0;
    });
if(!primaryDiscountTotal && booking?.totalCouponDiscountAmount){
  primaryDiscountTotal =  booking?.totalCouponDiscountAmount
}
    let adminDiscount = 0;

    if (booking.adminDiscountType == "percentage") {
      // itemDiscountPercentage =  (discountPercentage/totalCartPrice)*100
      // itemDiscountPercentage = +req.body.adminDiscount;
      adminDiscount = +(+booking.adminDiscount * +booking.totalCartPrice) / 100;
    } else if (booking.adminDiscountType == "amount") {
      adminDiscount = +booking.adminDiscount;
    }

    let finalAmount = subscription_code ? (booking.total_payment * booking.dates.length).toFixed(2) : booking.total_payment.toFixed(2);

    // remove null values and TitleCase all address
    company.address = common.removeNullAndCapitalize(company.address);
    booking.booking_address = common.removeNullAndCapitalize(booking.booking_address);

    // var otherDiscountAmount = +booking.redeemDiscount + +booking.referralDiscount;

    var html = `<div>
        <style>
        * {
            font-size: 7px;
        }
        .abcde {
            color: blue;
        }
        html,
        body {
            padding: 0;
            margin: 0;
            width: 100%;
            height: 100%;
        }
        td {
            vertical-align: baseline;
            padding: 0mm 1mm;
            /* background: #fff; */
        }
        .table2 > thead td {
            vertical-align: middle;
        }
        .text-right {
            text-align: right;
        }
        .border-tb-0 {
            border-top: 0px !important;
            border-bottom: 0px !important;
        }
        .no-border{
            border: none;
        }
        .table1,
        .table2,
        .table3,
        .table4,
        .header-table-2 {
            border-collapse: collapse;
            border-color: black;
            width: 100%;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        .table1 {
            height: 58mm;
        }
        .table4 {
            height: ${subscription_code ? "45mm" : "40mm"};
        }
        .group-product *{
            font-size: 6px;
        }
    </style>

    <table class="table2 border-tb-0" border="1">
            <tbody>
                <tr class="border-tb-0" height="0mm"> 
                    <td width="4%" class="border-tb-0"></td>
                    <td width="40%" class="border-tb-0"></td>
                    <td width="11%" class="border-tb-0"></td>
                    <td width="8%" class="border-tb-0"></td>
                    <td width="8%" class="border-tb-0"></td>
                    <td width="8%" class="border-tb-0"></td>
                    <td width="8%" class="border-tb-0"></td>
                    <td width="13%" class="border-tb-0"></td>
                </tr>

                ${booking.bookingdetail
                  .map((bookingItem, index) => {
                    let subIndex = 0;
                    if (bookingItem.TypeOfProduct == "simple") {
                      return `

                      <tr class="no-border" style="height: 7.1mm">
                            <td class="no-border">${index + 1}</td>
                            <td class="no-border"><strong>${
                              common.toTitleCase(bookingItem.product_id.product_name) + (bookingItem.barcode ? " - " + bookingItem.barcode : "")
                            }
                              ${common.toTitleCase(bookingItem.booking_item_desc ? " - " + bookingItem.booking_item_desc : "")}</strong></td>
                              <td class="text-right no-border">${common.toTitleCase(
                                bookingItem.without_package
                                  ? bookingItem.unitQuantity + " " + (bookingItem.unitMeasurement.name || bookingItem.unitMeasurement)
                                  : bookingItem.packetLabel
                              )}</td>
                              <td class="text-right no-border">
                                          ${bookingItem.qty}
                              </td>
                            <td class="text-right no-border"> &#8377; ${(Number(bookingItem.totalPriceBeforeGST) / Number(bookingItem.qty)).toFixed(
                              2
                            )}</td>

                            <td class="no-border">${bookingItem.product_id.hsnCode || ""}</td>
                            
                            <td class="text-right no-border">
                                 &#8377; ${
                                   bookingItem.itemDiscountAmount ? (+bookingItem.totalprice - +bookingItem.itemDiscountAmount).toFixed(2) : 0
                                 }
                            </td>
                            <td class="text-right no-border">
                                 &#8377; ${
                                   bookingItem.itemDiscountAmount
                                     ? (+bookingItem.itemDiscountAmountBeforeGST).toFixed(2)
                                     : (+bookingItem.totalPriceBeforeGST).toFixed(2)
                                 }
                            </td>
                        </tr>
                    `;
                    } else if (bookingItem.TypeOfProduct == "configurable") {
                      return `

                      <tr class="no-border" style="height: 7.1mm">
                            <td class="no-border">${index + 1}</td>
                            <td class="no-border"><strong>${common.toTitleCase(bookingItem.product_id.product_name)} 
                              - ${((vn) => {
                                return vn.split("__").reduce((acc, x, i) => {
                                  if (i % 2 == 1) return acc + (acc ? ", " : "") + x;
                                  else return acc + "";
                                }, "");
                              })(bookingItem.variant_name)} 
                              ${common.toTitleCase(bookingItem.booking_item_desc ? " - " + bookingItem.booking_item_desc : "")}</strong></td>
                              <td class="text-right no-border">${common.toTitleCase(
                                bookingItem.unitQuantity + " " + (bookingItem.unitMeasurement.name || bookingItem.unitMeasurement)
                              )}</td>
                              <td class="text-right no-border">
                                          ${bookingItem.qty}
                              </td>
                            <td class="text-right no-border"> &#8377; ${(Number(bookingItem.totalPriceBeforeGST) / Number(bookingItem.qty)).toFixed(
                              2
                            )}</td>

                            <td class="no-border">${bookingItem.product_id.hsnCode || ""}</td>
                            
                            <td class="text-right no-border">
                                 &#8377; ${
                                   bookingItem.itemDiscountAmount ? (+bookingItem.totalprice - +bookingItem.itemDiscountAmount).toFixed(2) : 0
                                 }
                            </td>
                            <td class="text-right no-border">
                                 &#8377; ${
                                   bookingItem.itemDiscountAmount
                                     ? (+bookingItem.itemDiscountAmountBeforeGST).toFixed(2)
                                     : (+bookingItem.totalPriceBeforeGST).toFixed(2)
                                 }
                            </td>
                        </tr>
                    `;
                    } else if (bookingItem.TypeOfProduct == "group") {
                      return `
                      <tr class="no-border" style="height: 7.1mm">
                          <td class="no-border">${index + 1}</td>
                          <td class="no-border"><strong>${common.toTitleCase(bookingItem.product_id.product_name)}</strong></td>
                          <td class="text-right no-border"> ${common.toTitleCase("1 pkt")} </td>
                          <td class="text-right no-border">
                          ${bookingItem.qty}
                          </td>
                          <td class="text-right no-border"> &#8377; ${(Number(bookingItem.totalPriceBeforeGST) / Number(bookingItem.qty)).toFixed(
                            2
                          )}</td>
                          
                          <td class="no-border">${bookingItem.product_id.hsn || ""}</td>
                          <td class="text-right no-border">
                               &#8377; ${bookingItem.itemDiscountAmount ? (+bookingItem.totalprice - +bookingItem.itemDiscountAmount).toFixed(2) : 0}
                          </td>
                          <td class="text-right no-border">
                              &#8377; ${
                                bookingItem.itemDiscountAmount
                                  ? (+bookingItem.itemDiscountAmountBeforeGST).toFixed(2)
                                  : (+bookingItem.totalPriceBeforeGST).toFixed(2)
                              }
                          </td>
                      </tr>
                      ${bookingItem.groupData
                        .map((set) => {
                          return set.sets
                            .map((prod) => {
                              if (+prod.qty) {
                                subIndex++;
                                return `
                                          <tr class="no-border group-product" style="height: 5mm; vertical-align: top;">
                                              <td class="no-border text-right">${index + 1}.${subIndex}</td>
                                              <td class="no-border">${common.toTitleCase(prod.product.product_name)}</td>
                                              <td class="text-right no-border">${common.toTitleCase(
                                                prod.without_package
                                                  ? prod.unitQuantity + " " + (prod.unitMeasurement.name || prod.unitMeasurement)
                                                  : prod.package.packetLabel
                                              )}</td>
                                              <td class="text-right no-border">
                                                  ${prod.qty}
                                              </td>
                                              <td class="text-right no-border"></td>
                                              
                                              <td class="no-border">${prod.product.hsn || ""}</td>
                                              <td class="text-right no-border"></td>
                                              <td class="text-right no-border"></td>
                                          </tr>
                                      `;
                              } else {
                                return "";
                              }
                            })
                            .join("");
                        })
                        .join("")}
                      `;
                    }
                  })
                  .join("")}
            </tbody>
        </table>

    </div>`;

    let footerHTML = `<div>
    <table class="table3" border="1" style="border-top: 0px">
      <tr class="border-tb-0" style="height: 7mm">
        <td class="border-tb-0" width="4%"></td>
        <td class="border-tb-0" width="40%"></td>
        <td class="border-tb-0" width="11%"></td>
        <td class="border-tb-0" width="8%"></td>
        <td class="border-tb-0" width="8%"></td>
        <td class="border-tb-0" width="8%"></td>
        <td class="border-tb-0" width="8%"></td>
        <td class="text-right border-tb-0" width="13%" style="font-size: 10px"></td>
      </tr>
      <tr class="border-tb-0" style="height: 7mm">
        <td class="border-tb-0"></td>
        <td class="text-right border-tb-0" style="vertical-align: middle"></td>
        <td class="border-tb-0"></td>
        <td class="border-tb-0"></td>
        <td class="border-tb-0"></td>
        <td class="border-tb-0"></td>
        <td class="border-tb-0"></td>
        <td class="text-right border-tb-0">
          <strong></strong>
        </td>
      </tr>
      <tr style="height: 5mm; vertical-align: middle">
        <td style="vertical-align: middle" colspan="6">Discount (Loyalty/Coupon/Referral)</td>
        <td style="vertical-align: middle" class="text-right"> &#8377; ${+primaryDiscountTotal.toFixed(2)}</td>
        <td style="vertical-align: middle" class="text-right"> </td>
      </tr>
      <tr style="height: 5mm; vertical-align: middle">
        <td style="vertical-align: middle" colspan="6">Sub-total</td>
        <td style="vertical-align: middle" class="text-right"> </td>
        <td style="vertical-align: middle" class="text-right"> &#8377; ${+subTotal.toFixed(2)}</td>
      </tr>
    </table>
    <table class="table4" style="border-top: none" border="1">
  
      <tr style="border-top: none">
        <td colspan="2">
          Tax ${booking.allGstLists.length > 0 ? `(${booking.allGstLists.map((item) => `${item.tax_name} ${item.tax_percent}%`).join(" + ")})` : ""}
        </td>
        <td class="text-right" width="50%">
          ${booking.allGstLists.length > 0 ? `${booking.allGstLists.map((item) => (+item.totalPrice).toFixed(3)).join(" + ")} <br />` : ""}
          <strong style="font-size: 8px"> &#8377; ${(+taxAmount).toFixed(2)} </strong>
        </td>
      </tr>
  
      <tr>
        <td colspan="2">Delivery Charges  ${
          booking.deliverySlot ? `<br/> <span style="font-size: 9px; font-weight: bold; color: black;"> ${booking.deliverySlot} </span>` : ""
        }</td>
        <td class="text-right" width="50%"> + &#8377; ${(+booking.deliveryCharges + +booking.codCharges).toFixed(2)}</td>
      </tr>

      ${
        subscription_code
          ? `<tr>
                <td colspan="2">No. Of Days</td>
                <td class="text-right" width="50%"> &#215; ${booking.dates.length}</td>
            </tr>`
          : ""
      }
  
      <tr>
        <td colspan="2" style="font-size: 20px !important; padding: 1mm"><strong> Total </strong></td>
        <td width="50%" class="text-right"><strong style="font-size: 9px"> &#8377; ${finalAmount} </strong></td>
      </tr>
      <tr class="border-tb-0">
        <td class="border-tb-0" colspan="3">
          <div>
            <span style="float: right">E. & O.E</span>
            Amount Chargeable (in words) <br />
          </div>
          <strong style="text-transform: capitalize"
            >INR ${numWords(finalAmount.toString().split(".")[0])} ${Number(finalAmount.toString().split(".")[1]) ? " Point " : ""} ${numWords(
      finalAmount.toString().split(".")[1]
    )}
            Only</strong
          >
        </td>
      </tr>
      <tr class="border-tb-0">
        <td width="50%" class="border-tb-0" style="height: 15mm">
          <u>Declaration</u> <br />
          ${storeheySettings.invoiceDeclaration}
        </td>
        <td colspan="2" class="sign text-right border-tb-0" style="outline: 1px solid #000; height: 15mm">
          <strong>for ${company.name.toUpperCase()} (${new Date().getFullYear().toString() - 1}-${new Date()
      .getFullYear()
      .toString()
      .slice(2)})</strong>
          <br />
          <br />
          <br />
          <br />
          <span>Authorised Signatory</span>
        </td>
      </tr>
    </table>
  </div>`;

    var options = {
      format: "A4",
      orientation: "portrait",
      border: "5mm",
      header: {
        height: "97mm",
        // contents: "",
        contents: `<div class="header-wrapper" style="height: 87mm">
      <div style="text-align: center; height: 8mm">
        <strong style="color: #f8bb15; font-size: 7mm; font-family: sans-serif"
          >${booking.billType ? booking.billType.toUpperCase() : subscription_code ? "INVOICE" : "Bill of Supply"}</strong
        >
      </div>
      <table class="table1" border="1">
        <tr>
          <td rowspan="3" width="20%">
          </td>
          <td rowspan="3" width="40%" style="vertical-align: middle;">
            <strong>${company.name.toUpperCase()} (${new Date().getFullYear().toString() - 1}-${new Date()
          .getFullYear()
          .toString()
          .slice(2)})</strong>
            <br />
            ${company.address.address}, 
            ${company.address.locality ? `${company.address.locality} <br />` : ""} ${company.address.city} <br />
            FSSAI NO - ${company.FSSAI_NO ? company.FSSAI_NO : ""} <br />
            ${company.address.state} - ${company.address.pincode}, ${company.address.country} <br />
            GSTIN/UIN : ${company.GSTIN_UIN ? company.GSTIN_UIN : ""} <br />
            State Name : ${company.address.state}, Code : ${company.address.state_code} <br />
            E-Mail : ${company.email ? company.email : ""} <br/>
            ${company.consumer_number ? `Direct to consumer : ${company.consumer_number}` : ""}
            ${company.consumer_number && company.hospitality_number ? ", " : ""}
            ${company.hospitality_number ? `Hospitality (B2B) : ${company.hospitality_number}` : ""}
          </td>
          <td width="20%">
            <span style="font-size: 6px">${booking.billType ? booking.billType.toUpperCase() : "Invoice"} No.</span> <br />
            <strong>${
              booking.billType ? (booking.billType == "invoice" ? booking.invoiceNO || "" : booking.challanNO || "") : booking.invoiceNO || ""
            }</strong>
          </td>
          <td width="20%">
            <span style="font-size: 6px">Dated</span> <br />
            <strong>${moment(booking.backendOrderDate ? booking.backendOrderDate : booking.createDate).format("DD-MMM-YY")}</strong>
          </td>
        </tr>
        <tr>
          <td>
            <span style="font-size: 6px">PO Number</span> <br />
            <strong>${booking.po_number ? booking.po_number : ""}</strong>
          </td>
          <td>
            <span style="font-size: 6px"> Krishi Cress Order No.</span> <br />
            <strong>${subscription_code ? booking.SubscriptionID : booking.booking_code}</strong>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <span style="font-size: 6px">Payment Method</span> <br />
            <strong style="font-size: 12px">${booking.paymentmethod ? booking.paymentmethod : ""}</strong>
          </td>
        </tr>
    
        <tr>
          <td colspan="2">
            <span style="font-size: 6px">Consignee (Ship to)</span> <br />
            ${
              booking.giftingStatus
                ? ` <strong> ${common.toTitleCase(booking.giftingName)} - ${booking.giftingContact} </strong> <br/>
                    ${common.toTitleCase(booking.giftingAddress.address)} <br />
                    State Name: ${booking.giftingAddress.state ? common.toTitleCase(booking.giftingAddress.state) : ""} , Code: ${common.StateCode(
                    booking.giftingAddress.state
                  )}`
                : `<strong>${common.toTitleCase(booking.userName)} - ${booking.userMobile} </strong> <br />
                    ${booking.booking_address.address} <br />
                    State Name: ${booking.booking_address.state ? booking.booking_address.state : ""} , Code: ${common.StateCode(
                    booking.booking_address.state
                  )}`
            }
          </td>
          <td rowspan="2" colspan="2">
                <span style="font-size: 6px">Payment Details</span> <br />
                <p> ${storeheySettings.invoicePaymentDetail}
                </p>
          </td>
        </tr>

        <tr>
            <td colspan="2">
            <span style="font-size: 6px">Buyer (Bill to)</span> <br />
            <strong>${common.toTitleCase(booking.userName)} - ${booking.userMobile} </strong> <br/> 
            ${booking.booking_address.address}<br/>
            State Name: ${booking.booking_address.state ? booking.booking_address.state : ""} , Code: ${common.StateCode(
          booking.booking_address.state
        )}
        ${booking && booking.userData && booking.userData.gst_no ? `<br/> GST Number: ${booking.userData.gst_no}` : ""}
          </td>
        </tr>
    
        ${
          subscription_code || booking.giftingStatus || booking.delivery_instructions
            ? `<tr>
          ${
            subscription_code
              ? `<td colspan="2"> 
                  <span style="font-size: 6px">Subscription Dates</span> <br />
                  <strong>  
                  ${booking.dates
                    .map((item) => {
                      return moment(item.date).format("DD-MMM-YY");
                    })
                    .join(", ")}
                  </strong>
              </td>
              `
              : `<td colspan="2">
              ${
                booking.giftingStatus && booking.bookingMode === "online"
                  ? `<strong style="font-size: 10px">Gift Order</strong> <br />
                  ${booking.giftingNote}`
                  : ``
              }
            </td>`
          }
          <td colspan="2">
            ${
              booking.delivery_instructions && booking.delivery_instructions !== null && booking.delivery_instructions !== "null"
                ? `<strong style="font-size: 10px">Delivery Instructions</strong> <br /> 
                <span>${booking.delivery_instructions}</span>`
                : ""
            }
          </td>
        </tr>`
            : ``
        }
      </table>
      <table class="header-table-2" border="1" height="15mm">
            <thead>
                <tr style="text-align: center; height: 5mm">
                    <td width="4%">S. No.</td>
                    <td width="40%">Description of Goods</td>
                    <td width="11%">Weight</td>
                    <td width="8%">Quantity</td>
                    <td width="8%">Rate</td>
                    <td width="8%">HSN/SAC</td>
                    <td width="8%">Discount</td>
                    <td width="13%">Amount</td>
                </tr>
            </thead>
            <tbody>
                <tr class="border-tb-0" style="text-align: center; height: 10mm">
                    <td class="border-tb-0" width="4%"></td>
                    <td class="border-tb-0" width="40%" style="height: 10mm"></td>
                    <td class="border-tb-0" width="11%"></td>
                    <td class="border-tb-0" width="8%"></td>
                    <td class="border-tb-0" width="8%"></td>
                    <td class="border-tb-0" width="8%"></td>
                    <td class="border-tb-0" width="8%"></td>
                    <td class="border-tb-0" width="13%"></td>
                </tr>
            </tbody>
      </table>
    </div>
    `,
        align: "start",
      },
      footer: {
        height: subscription_code ? "90mm" : "83mm",
        contents: footerHTML,
        // contents: {
        //   default: defaultFooterHTML, // fallback value
        //   last: lastFooterHTML,
        // },
      },
    };
    // let currentTimeInMs = new Date().getTime();

    pdf
      .create(html, options)
      .toFile(Path.join(__dirname, `../../public/invoices/dump/bill_${booking_code || subscription_code}.pdf`), async function (err, document) {
        if (err) {
          errorLogger.error(err, "\n", "\n");
          return console.log(err);
        }

        // Load a PDFDocument from the existing PDF bytes
        const existingPdfBytes = fs.readFileSync(document.filename);
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        // Get pages of the document
        const pages = pdfDoc.getPages();
        const logoImage = await pdfDoc.embedJpg(logoBytes);
        // const watermarkImage = await pdfDoc.embedPng(watermarkBytes);

        // let watermarkWidth = 300;
        // let watermarkHeight = 300;

        pages.forEach((page) => {
          // draw header logo
          page.drawImage(logoImage, {
            x: 30,
            y: 723,
            width: 73,
            height: 73,
          });

          // draw water-mark image
          // page.drawImage(watermarkImage, {
          //     x: page.getWidth() / 2 - watermarkWidth / 2,
          //     y: page.getHeight() / 2 - watermarkHeight + 100,
          //     width: watermarkWidth,
          //     height: watermarkHeight,
          // });

          // draw lines to fill table void
          let svgPath = "M 14.3 290, V 610";
          page.moveTo(0, page.getHeight());
          page.drawSvgPath(svgPath, {
            borderColor: rgb(0, 0, 0),
            borderWidth: 1.1,
          });

          svgPath = "M 37.8 290, V 610";
          page.moveTo(0, page.getHeight());
          page.drawSvgPath(svgPath, {
            borderColor: rgb(0, 0, 0),
            borderWidth: 1.1,
          });

          svgPath = "M 265 290, V 610";
          page.moveTo(0, page.getHeight());
          page.drawSvgPath(svgPath, {
            borderColor: rgb(0, 0, 0),
            borderWidth: 1.1,
          });

          svgPath = "M 327.4 290, V 610";
          page.moveTo(0, page.getHeight());
          page.drawSvgPath(svgPath, {
            borderColor: rgb(0, 0, 0),
            borderWidth: 1.1,
          });

          svgPath = "M 372.5 290, V 610";
          page.moveTo(0, page.getHeight());
          page.drawSvgPath(svgPath, {
            borderColor: rgb(0, 0, 0),
            borderWidth: 1.1,
          });

          svgPath = "M 417.4 290, V 610";
          page.moveTo(0, page.getHeight());
          page.drawSvgPath(svgPath, {
            borderColor: rgb(0, 0, 0),
            borderWidth: 1.1,
          });

          svgPath = "M 462 290, V 610";
          page.moveTo(0, page.getHeight());
          page.drawSvgPath(svgPath, {
            borderColor: rgb(0, 0, 0),
            borderWidth: 1.1,
          });

          svgPath = "M 507 290, V 610";
          page.moveTo(0, page.getHeight());
          page.drawSvgPath(svgPath, {
            borderColor: rgb(0, 0, 0),
            borderWidth: 1.1,
          });

          svgPath = "M 580.5 290, V 610";
          page.moveTo(0, page.getHeight());
          page.drawSvgPath(svgPath, {
            borderColor: rgb(0, 0, 0),
            borderWidth: 1.1,
          });
        });

        // export new pdf
        const pdfBytes = await pdfDoc.save();
        fs.writeFile(Path.join(__dirname, `../../public/invoices/dump/bill_${booking_code || subscription_code}.pdf`), pdfBytes, (err) => {
          if (err) throw err;
          res.json({
            pdf: {
              filename: `invoices/dump/bill_${booking_code || subscription_code}.pdf`,
              // filename: `invoices/dump/invoice.pdf`,
            },
          });
        });
      });
  } catch (err) {
    errorLogger.error(err, "\n", "\n");
    console.log("@@@@@@@@@@@@@@@@@@@@@@@ $$$$ errrrrrr", err);
  }
};

module.exports.getDashboardCounts = async (req, res) => {
  try {
    let order_count = await bookingDataBase.count();
    let customer_count = await User.count();
    let product_count = await ProductDatabase.count();

    res.status(200).json({
      message: "ok",
      data: { order_count, customer_count, product_count },
      code: 1,
    });
  } catch (err) {
    errorLogger.error(err, "\n", "\n");
    console.log("::::::::: error :::::::: ", err);
    res.status(500).json({
      message: "Something went wrong",
      data: {},
      code: 0,
    });
  }
};

// module.exports.getAnalyticsDashboard = async (req, res) => {
//   try {
//     if (req.body.startDateTime === req.body.endDateTime) {
//       var abEnd = new Date(req.body.endDateTime);
//       new Date(abEnd.setDate(abEnd.getDate() + 1));
//     } else {
//       var abEnd = new Date(req.body.endDateTime);
//     }
//     var startDateTime = new Date(req.body.startDateTime);

//     var startDate = new Date(req.body.startDateTime);
//     var startEndTime = new Date(startDate.setDate(startDate.getDate()));
//     var endDate = new Date(abEnd);

//     var EndDateTime = new Date(abEnd);
//     var EndDateTime1 = new Date(EndDateTime.setDate(EndDateTime.getDate()));
//     console.log(startDateTime, EndDateTime, "Total_order Total_order");

//     //Total order code start
//     var OrderEndDateTime = new Date(EndDateTime.setDate(EndDateTime.getDate() + 1));
//     var OrderStartDateTime = new Date(startDateTime.setDate(startDateTime.getDate() + 1));

//     let Total_order = await bookingDataBase.find({ createDate: { $gte: OrderStartDateTime, $lt: OrderEndDateTime } }).count();
//     console.log(Total_order, "Total_order Total_order");
//     let Total_sale = await bookingDataBase.aggregate([
//       { $match: { createDate: { $gte: startDateTime, $lte: EndDateTime } } },
//       { $group: { _id: null, total_payment: { $sum: "$total_payment" } } },
//     ]);

//     var getDateArray = function (start, end) {
//       var arr = new Array();
//       var dt = new Date(start);
//       while (dt <= end) {
//         arr.push(new Date(dt));
//         dt.setDate(dt.getDate() + 1);
//       }
//       return arr;
//     };

//     var jsonData = [];
//     var dateArr = getDateArray(startDateTime, endDate);

//     for (var i = 0; i < dateArr.length; i++) {
//       var startDateTime1 = new Date(dateArr[i]);
//       var startDate1 = new Date(dateArr[i]);
//       var startEndTime1 = new Date(startDate1.setDate(startDate1.getDate() + 1));
//       let Total_sale = await bookingDataBase.aggregate([
//         {
//           $match: { createDate: { $gte: startDateTime1, $lte: startEndTime1 } },
//         },
//         { $group: { _id: null, total_payment: { $sum: "$total_payment" } } },
//       ]);

//       jsonData.push({
//         label: dateArr[i],
//         sales: Total_sale,
//       });
//     }
//     res.status(200).json({
//       message: "ok",
//       data: jsonData,
//       Total_order: Total_order,
//       Total_sale: Total_sale,
//       code: 1,
//     });
//   } catch (err) {
//     errorLogger.error(err, "\n", "\n");
//     console.log(err);
//     res.status(500).json({
//       message: "Somthing went wrong",
//       data: {},
//       code: 0,
//     });
//   }
// };
module.exports.getAnalyticsDashboard = async (req, res) => {
  try {
    if (req.body.startDateTime === req.body.endDateTime) {
      var abEnd = new Date(req.body.endDateTime);
      new Date(abEnd.setDate(abEnd.getDate()));
    } else {
      var abEnd = new Date(req.body.endDateTime);
    }
    var startDateTime = new Date(req.body.startDateTime);

    var startDate = new Date(req.body.startDateTime);
    var startEndTime = new Date(startDate.setDate(startDate.getDate()));
    var endDate = new Date(abEnd);

    var EndDateTime = new Date(abEnd);
    var EndDateTime1 = new Date(EndDateTime.setDate(EndDateTime.getDate()));
    console.log(startDateTime, EndDateTime, "Total_order Total_order");

    //Total order code start
    var OrderEndDateTime = new Date(EndDateTime.setDate(EndDateTime.getDate() + 1));
    var OrderStartDateTime = new Date(startDateTime.setDate(startDateTime.getDate()));

    //let Total_order = await bookingDataBase.find({ createDate: { $gte: OrderStartDateTime, $lt: OrderEndDateTime } }).count();
    let Total_order = await bookingDataBase
      .find({
        $and: [
          { createDate: { $gte: startDateTime, $lte: EndDateTime } },
          {
            $or: [{ BookingStatusByAdmin: { $ne: "Rejected" }, BookingStatusByAdmin: { $ne: "Failed" } }],
          },
        ],
      })
      .count();

    console.log(Total_order, "Total_order Total_order");
    let Total_sale = await bookingDataBase.aggregate([
      // { $match: { createDate: { $gte: startDateTime, $lte: EndDateTime } } },
      {
        $match: {
          $and: [
            { createDate: { $gte: startDateTime, $lte: EndDateTime } },
            {
              $or: [{ BookingStatusByAdmin: { $ne: "Rejected" }, BookingStatusByAdmin: { $ne: "Failed" } }],
            },
          ],
        },
      },

      { $group: { _id: null, total_payment: { $sum: "$total_payment" } } },
    ]);

    var getDateArray = function (start, end) {
      var arr = new Array();
      var dt = new Date(start);
      while (dt <= end) {
        arr.push(new Date(dt));
        dt.setDate(dt.getDate() + 1);
      }
      return arr;
    };

    var jsonData = [];
    var dateArr = getDateArray(startDateTime, endDate);

    for (var i = 0; i < dateArr.length; i++) {
      var startDateTime1 = new Date(dateArr[i]);
      var startDate1 = new Date(dateArr[i]);
      var startEndTime1 = new Date(startDate1.setDate(startDate1.getDate() + 1));
      let Total_sale = await bookingDataBase.aggregate([
        {
          $match: { createDate: { $gte: startDateTime1, $lte: startEndTime1 } },
        },
        { $group: { _id: null, total_payment: { $sum: "$total_payment" } } },
      ]);

      jsonData.push({
        label: dateArr[i],
        sales: Total_sale,
      });
    }
    res.status(200).json({
      message: "ok",
      data: jsonData,
      Total_order: Total_order,
      Total_sale: Total_sale,
      code: 1,
    });
  } catch (err) {
    errorLogger.error(err, "\n", "\n");
    console.log(err);
    res.status(500).json({
      message: "Somthing went wrong",
      data: {},
      code: 0,
    });
  }
};
function refferID(length) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// module.exports.userImport = async (req, res) => {
//   var JsonData = [];
//   var ab = parseInt(JsonData.length);
//   try {
//     for (var i = 0; i < ab; i++) {
//       var jsonIData = JsonData[i];
//       var point = +jsonIData.available_loyalty_points;

//       var userFound = await User.findOne({ contactNumber: jsonIData.phone }).lean();
//       if (userFound != null) {
//         var bc = await User.updateOne(
//           { _id: userFound._id },
//           {
//             $set: { TotalPoint: +jsonIData.available_loyalty_points },
//           }
//         );
//         var InsertData = {
//           user_id: userFound._id,
//           reason: "Loyalty point added by admin",
//           point: jsonIData.available_loyalty_points,
//           pointStatus: "Added",
//         };
//         if (point > 0) {
//           var ab11 = await LoyalityProgramHistory.create(InsertData);
//         }
//       }
//     }
//   } catch (err) {
//     console.log(err);
//   }
// };

module.exports.userImport = async (req, res) => {
  var JsonData = [];
  var ab = parseInt(JsonData.length);
  try {
    for (var i = 0; i < ab; i++) {
      var jsonIData = JsonData[i];
      var prevNoOfOrder = +jsonIData.prevNoOfOrder;

      var userFound = await User.findOne({
        contactNumber: jsonIData.phone,
      }).lean();
      if (userFound != null) {
        var bc = await User.updateOne(
          { _id: userFound._id },
          {
            $set: { prevNoOfOrder: +prevNoOfOrder },
          }
        );
      }
    }
  } catch (err) {
    errorLogger.error(err, "\n", "\n");
    console.log(err);
  }
};
