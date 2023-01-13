

var mongoose = require("mongoose");
var bookingDataBase = mongoose.model("bookings");
var inventoryDataBase = mongoose.model("inventory");
const Subscription = mongoose.model("subscriptions");
var addToCartDataBase = mongoose.model("addtocarts");
var express = require("express");
var couponDataBase = mongoose.model("coupon_masters");
var User = mongoose.model("Users");
var driverDataBase = mongoose.model("drivers");
var products = mongoose.model("products");
var ProductData = mongoose.model("products");
var settingsModel = mongoose.model("settings");
var LoyalityProgramHistory = mongoose.model("loyality_program_histories");
var LoyalityPrograms = mongoose.model("loyality_programs");
var WalletHistories = mongoose.model("wallet_histories");
var Admin = mongoose.model("admin");
var Roles = mongoose.model("role");
var Company = mongoose.model("companies");
var OnOffDataBase = mongoose.model("email_sms_on_off");
const Razorpay = require("razorpay");
var cron = require("node-cron");

// var instance = new Razorpay({
//   //development
//   key_id: "rzp_test_4KhMmv9a1Nd5KY",
//   key_secret: "u9eVCd7gStED9HmmJgJpbtlW",

//   //live
//   // key_id: "rzp_live_7o7Eupde1Thvpq",
//   // key_secret: "lwY29CLzr7HsmjMi5Tq0or0f",
// });
//let notifs = await OnOffDataBase.findOne({}).lean();
var payment_table = mongoose.model("payment_options");
var common = require("../../common");
var nodemailer = require("nodemailer");
var moment = require("moment-timezone");
const Paytm = require("paytmchecksum");
const PaytmChecksum = require("paytmchecksum");
var async = require("async");
const https = require("https");
const config = require("../../Paytm/config");
// const TWILIO_TOKEN = "297abb30892fd3c8e4daf7f9892c805b"
// const TWILIO_ACCOUNT_SID = "AC271d19427c256950abe14f1a3309dc13"
// const client = require('twilio')(TWILIO_ACCOUNT_SID,TWILIO_TOKEN);

const { orderStatusLogs, errorLogger } = common;

const checksum_lib = require("../../Paytm/checksum");
const parseUrl = express.urlencoded({ extended: false });
const parseJson = express.json({ extended: false });
/*
 * import checksum generation utility
 * You can get this utility from https://developer.paytm.com/docs/checksum/
 */

function uniqueId(length) {
  var result = "";
  var characters = "0123456789abcdefghijklmnopqruvwxyz";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function updateData(productId, product_variant_id, product_variant_qty) {
  products
    .findOne(
      { _id: productId },
      {
        _id: 0,
        product_variant: { $elemMatch: { _id: product_variant_id } },
      }
    )
    .exec(function (err, pdata) {
      var updateData = {
        "product_variant.available_qty": parseInt(pdata.product_variant[0].available_qty) - parseInt(product_variant_qty),
      };

      products.findOneAndUpdate({ _id: productId, "product_variant._id": product_variant_id }, { $set: updateData }, function (err, data) {});
    });
}

// module.exports.createBooking = function (req, res) {

//   var body = req.body;
//   var user_id = body.user_id;
//   var user_email = body.user_email;
//   var user_name = body.user_name;
//   var addToCartID = body.addToCartID;
//   var bookingMode = body.bookingMode;
//   var address = body.address;
//   var country = body.country;
//   var state = body.state;
//   var city = body.city;
//   var locality = body.locality;
//   var locationTag = body.locationTag;
//   var houseNo = body.houseNo;
//   var pincode = body.pincode;
//   var latitude = body.latitude;
//   var longitude = body.longitude;
//   var delivery_instructions = body.delivery_instructions;
//   var otheraddress = body.otheraddress;
//   var paymentmethod = body.paymentmethod;
//   var payment_id = body.payment_id;
//   var total_payment = body.total_payment;
//   var gst = body.gst;
//   var allGstLists = body.allGstLists;
//   var taxType = body.taxType;
//   var redeem = body.redeem ? body.redeem : 0;
//   var redeemDiscount = body.redeemDiscount ? body.redeemDiscount : 0;
//   var referralDiscount = body.referralDiscount ? body.referralDiscount : 0;
//   var cod = body.cod;
//   var regionName = body.regionName;
//   var regionID = body.regionID;
//   var couponId = body.couponId;
//   var deliveryCharges = body.deliveryCharges;
//   var codCharges = body.codCharges;
//   var giftingStatus = body.giftingStatus;
//   var giftingName = body.giftingName;
//   var giftingContact = body.giftingContact;
//   var giftingAddress = body.giftingAddress;
//   var giftingNote = body.giftingNote;
//   var giftingStatus = body.giftingStatus;
//   var device_name = req.body.device_name;
//   var totalCouponDiscountAmount = req.body.totalCouponDiscountAmount;
//   var totalCartPriceWithoutGST = req.body.totalCartPriceWithoutGST;
//   var itemWiseData = req.body.itemWiseData;
//   var preOrder = false;
//   var deliverySlot = req.body.deliverySlot;
//   var createDbDoc = req.body.createDbDoc;
//   var error = {};
//   if (user_id == "" || !user_id || user_id == undefined || user_id == null) {
//     common.formValidate("user_id", res);
//     return false;
//   }
//   if (
//     user_email == "" ||
//     !user_email ||
//     user_email == undefined ||
//     user_email == null
//   ) {
//     common.formValidate("user_email", res);
//     return false;
//   }
//   if (
//     user_name == "" ||
//     !user_name ||
//     user_name == undefined ||
//     user_name == null
//   ) {
//     common.formValidate("user_name", res);
//     return false;
//   }
//   if (
//     addToCartID == "" ||
//     !addToCartID ||
//     addToCartID == undefined ||
//     addToCartID == null
//   ) {
//     common.formValidate("addToCartID", res);
//     return false;
//   }

//   // if (address == '' || !address || address == undefined  || address == null) {
//   //     common.formValidate('address', res);
//   //     return false;
//   // }
//   // if (country == '' || !country || country == undefined  || country == null) {
//   //     common.formValidate('country', res);
//   //     return false;
//   // }
//   //  if (state == '' || !state || state == undefined  || state == null) {
//   //     common.formValidate('state', res);
//   //     return false;
//   // }
//   //  if (city == '' || !city || city == undefined  || city == null) {
//   //     common.formValidate('city', res);
//   //     return false;
//   // }

//   if (
//     bookingMode == "" ||
//     !bookingMode ||
//     bookingMode == undefined ||
//     bookingMode == null
//   ) {
//     common.formValidate("bookingMode", res);
//     return false;
//   }
//   // if (
//   //   deliverySlot == "" ||
//   //   !deliverySlot ||
//   //   deliverySlot == undefined ||
//   //   deliverySlot == null
//   // ) {
//   //   common.formValidate("deliverySlot", res);
//   //   return false;
//   // }
//   if (
//     total_payment == "" ||
//     !total_payment ||
//     total_payment == undefined ||
//     total_payment == null
//   ) {
//     common.formValidate("total_payment", res);
//     return false;
//   }
//   if (
//     regionName == "" ||
//     !regionName ||
//     regionName == undefined ||
//     regionName == null
//   ) {
//     common.formValidate("regionName", res);
//     return false;
//   }
//   if (
//     itemWiseData == "" ||
//     !itemWiseData ||
//     itemWiseData == undefined ||
//     itemWiseData == null
//   ) {
//     common.formValidate("itemWiseData", res);
//     return false;
//   }

//   if (couponId && couponId !== "undefined") {
//     var couponId = couponId;
//   } else {
//     var couponId = null;
//   }

//   // return;

//   User.findOne({ _id: user_id })
//     .exec()
//     .then((getUser) => {
//       if (
//         getUser.walletAmount < total_payment &&
//         paymentmethod.toLocaleLowerCase() == "wallet"
//       ) {
//         // console.log("1111");
//         return res.status(500).json({
//           allErrors: [],
//           status: "error",
//           msg:
//             "Wallet amount less than order amount. Choose some other payment method",
//         });
//       }
//       // credit limit check
//       // console.log("@@!!@@ ", total_payment, getUser.creditUsed, total_payment + getUser.creditUsed, getUser.creditLimit);
//       if (
//         paymentmethod === "Credit" &&
//         +total_payment + +getUser.creditUsed > +getUser.creditLimit
//       ) {
//         return res.status(400).json({
//           allErrors: [],
//           status: "error",
//           msg: `Credit Limit Exceeded`,
//           creditUsed: getUser.creditUsed,
//           creditLimit: getUser.creditLimit,
//         });
//       }
//       couponDataBase
//         .findOne({ _id: couponId })
//         .exec()
//         .then(async (getCoupon) => {
//           try {
//             if (getUser == null) {
//               return res.status(400).json({
//                 allErrors: [],
//                 status: "error",
//                 msg: `Your account is currently disabled. Please contact us for more information.`,
//               });
//             } else {
//               let notifs = await OnOffDataBase.findOne({}).lean();

//               // identify loyalty program
//               var getSettings = await settingsModel.find({}).lean();
//               getSettings = getSettings[0];
//               var program = await LoyalityPrograms.find({
//                 $and: [
//                   {
//                     startOrderNo: {
//                       $lte: getUser.NoOfOrder + getUser.prevNoOfOrder + 1,
//                     },
//                   },
//                   {
//                     endOrderNo: {
//                       $gte: getUser.NoOfOrder + getUser.prevNoOfOrder + 1,
//                     },
//                   },
//                 ],
//               }).lean();
//               program = program[0];

//               // loyalty checks
//               if (redeem > 0 && getSettings?.loyalityProgramOnOff == "off") {
//                 // console.log("22222");
//                 return res.status(500).json({
//                   allErrors: [],
//                   status: "error",
//                   msg: `loyalty program is off.... you can't redeem krishi seeds`,
//                 });
//               }

//               var maxRedeemAllowed =
//                 (getUser.TotalPoint ? +getUser.TotalPoint : 0) *
//                 getSettings?.seedValue;

//               if (redeemDiscount > maxRedeemAllowed) {
//                 // console.log("3333");
//                 return res.status(500).json({
//                   allErrors: [],
//                   status: "error",
//                   msg: `Maximum redeem discount exceeded - ${maxRedeemAllowed}`,
//                 });
//               }

//               // referral checks
//               if (
//                 referralDiscount > 0 &&
//                 getSettings?.refferalPointsOnOff == "off"
//               ) {
//                 // console.log("444");
//                 return res.status(500).json({
//                   allErrors: [],
//                   status: "error",
//                   msg: `referral program is off.... you can't have referral discount`,
//                 });
//               }
//               if (referralDiscount > 0 && !getUser.refferalCodeFrom) {
//                 // console.log("5555");
//                 return res.status(500).json({
//                   allErrors: [],
//                   status: "error",
//                   msg: `you didn't use any referral code while signing up... not eligible for referral discount`,
//                 });
//               }
//               if (
//                 referralDiscount > 0 &&
//                 getUser.NoOfOrder + getUser.prevNoOfOrder >= 3
//               ) {
//                 // console.log("6666");
//                 return res.status(500).json({
//                   allErrors: [],
//                   status: "error",
//                   msg: `referral discount can be used only for 1st 3 orders`,
//                 });
//               }
//               if (referralDiscount > 0 && couponId) {
//                 // console.log("77777");
//                 return res.status(500).json({
//                   allErrors: [],
//                   status: "error",
//                   msg: `Coupon and Referral discount can't be used together`,
//                 });
//               }

//               //make unique no for booking id

//               var booking_code = "";

//               var invoiceNO = null;
//               //var ORDER_ID = "OrderID" + new Date().getTime();
//               // var abbbb = bookingDataBase.find().count()
//               // console.log('abbbbabbbbabbbbabbbbabbbbabbbbabbbb ', err)
//               var ORDER_ID = "KC";
//               // var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

//               // for (var i = 0; i < 8; i++){
//               //     booking_code += possible.charAt(Math.floor(Math.random() * possible.length));
//               // }

//               addToCartDataBase.aggregate(
//                 [
//                   { $match: { user_id: mongoose.Types.ObjectId(user_id) } },
//                   {
//                     $unwind: {
//                       path: "$CartDetail",
//                       preserveNullAndEmptyArrays: true,
//                     },
//                   },
//                   {
//                     $lookup: {
//                       from: "products",
//                       let: {
//                         product_id: "$CartDetail.product_id",
//                         region_id: "$regionID",
//                         variant_name: "$CartDetail.variant_name",
//                       },
//                       pipeline: [
//                         {
//                           $match: { $expr: { $eq: ["$$product_id", "$_id"] } },
//                         },

//                         // populate product categories
//                         {
//                           $lookup: {
//                             from: "categories",
//                             foreignField: "_id",
//                             localField: "product_categories",
//                             as: "product_categories",
//                           },
//                         },

//                         // For adding quantity keys
//                         ...[
//                           {
//                             $lookup: {
//                               from: "inventory_items",
//                               let: { product_id: "$_id" },
//                               pipeline: [
//                                 {
//                                   $match: {
//                                     $expr: {
//                                       $and: [
//                                         {
//                                           $eq: ["$product_id", "$$product_id"],
//                                         },
//                                         {
//                                           $eq: ["$region", "$$region_id"],
//                                         },
//                                         {
//                                           $eq: [
//                                             "$variant_name",
//                                             "$$variant_name",
//                                           ],
//                                         },
//                                       ],
//                                     },
//                                   },
//                                 },
//                                 {
//                                   $group: {
//                                     _id: null,
//                                     productQuantity: {
//                                       $sum: "$productQuantity",
//                                     },
//                                     bookingQuantity: {
//                                       $sum: "$bookingQuantity",
//                                     },
//                                     availableQuantity: {
//                                       $sum: "$availableQuantity",
//                                     },
//                                     lostQuantity: { $sum: "$lostQuantity" },
//                                     returnQuantity: { $sum: "$returnQuantity" },
//                                     inhouseQuantity: {
//                                       $sum: "$inhouseQuantity",
//                                     },
//                                   },
//                                 },
//                                 { $project: { _id: 0 } },
//                               ],
//                               as: "inventories",
//                             },
//                           },
//                           {
//                             $unwind: {
//                               path: "$inventories",
//                               preserveNullAndEmptyArrays: true,
//                             },
//                           },
//                           {
//                             $addFields: {
//                               productQuantity: {
//                                 $ifNull: [
//                                   { $toDouble: "$inventories.productQuantity" },
//                                   0,
//                                 ],
//                               },
//                               bookingQuantity: {
//                                 $ifNull: [
//                                   { $toDouble: "$inventories.bookingQuantity" },
//                                   0,
//                                 ],
//                               },
//                               availableQuantity: {
//                                 $ifNull: [
//                                   {
//                                     $toDouble: "$inventories.availableQuantity",
//                                   },
//                                   0,
//                                 ],
//                               },
//                               lostQuantity: {
//                                 $ifNull: [
//                                   { $toDouble: "$inventories.lostQuantity" },
//                                   0,
//                                 ],
//                               },
//                               returnQuantity: {
//                                 $ifNull: [
//                                   { $toDouble: "$inventories.returnQuantity" },
//                                   0,
//                                 ],
//                               },
//                               inhouseQuantity: {
//                                 $ifNull: [
//                                   { $toDouble: "$inventories.inhouseQuantity" },
//                                   0,
//                                 ],
//                               },
//                             },
//                           },
//                         ],

//                         // inside simpleData array
//                         ...[
//                           {
//                             $unwind: {
//                               path: "$simpleData",
//                               preserveNullAndEmptyArrays: true,
//                             },
//                           },
//                           {
//                             $lookup: {
//                               from: "regions",
//                               foreignField: "_id",
//                               localField: "simpleData.region",
//                               as: "simpleData.region",
//                             },
//                           },
//                           {
//                             $unwind: {
//                               path: "$simpleData.region",
//                               preserveNullAndEmptyArrays: true,
//                             },
//                           },
//                           {
//                             $unset: [
//                               "simpleData.region.stateData",
//                               "simpleData.region.__v",
//                               "simpleData.region.created_at",
//                             ],
//                           },
//                           {
//                             $lookup: {
//                               from: "packages",
//                               foreignField: "_id",
//                               localField: "simpleData.package",
//                               as: "simpleData.package",
//                             },
//                           },
//                           {
//                             $addFields: {
//                               "simpleData.productQuantity": "$productQuantity",
//                               "simpleData.bookingQuantity": "$bookingQuantity",
//                               "simpleData.availableQuantity":
//                                 "$availableQuantity",
//                               "simpleData.lostQuantity": "$lostQuantity",
//                               "simpleData.returnQuantity": "$returnQuantity",
//                               "simpleData.inhouseQuantity": "$inhouseQuantity",
//                             },
//                           },
//                           {
//                             $group: {
//                               _id: "$_id",
//                               product_name: { $first: "$product_name" },
//                               images: { $first: "$images" },
//                               simpleData: { $push: "$simpleData" },
//                               configurableData: { $first: "$configurableData" },
//                               groupData: { $first: "$groupData" },
//                               base_price: { $first: "$base_price" },
//                               slug: { $first: "$slug" },
//                               TypeOfProduct: { $first: "$TypeOfProduct" },
//                               outOfStock: { $first: "$outOfStock" },
//                               productQuantity: { $first: "$productQuantity" },
//                               bookingQuantity: { $first: "$bookingQuantity" },
//                               availableQuantity: {
//                                 $first: "$availableQuantity",
//                               },
//                               lostQuantity: { $first: "$lostQuantity" },
//                               returnQuantity: { $first: "$returnQuantity" },
//                               inhouseQuantity: { $first: "$inhouseQuantity" },
//                               productSubscription: {
//                                 $first: "$productSubscription",
//                               },
//                               preOrder: { $first: "$preOrder" },
//                               preOrderQty: { $first: "$preOrderQty" },
//                               preOrderBookQty: { $first: "$preOrderBookQty" },
//                               preOrderRemainQty: {
//                                 $first: "$preOrderRemainQty",
//                               },
//                               preOrderStartDate: {
//                                 $first: "$preOrderStartDate",
//                               },
//                               preOrderEndDate: { $first: "$preOrderEndDate" },
//                               sameDayDelivery: { $first: "$sameDayDelivery" },
//                               farmPickup: { $first: "$farmPickup" },
//                               priority: { $first: "$priority" },
//                               status: { $first: "$status" },
//                               showstatus: { $first: "$showstatus" },
//                               ratings: { $first: "$ratings" },
//                               ratingsCount: { $first: "$ratingsCount" },
//                               reviews: { $first: "$reviews" },
//                               reviewsCount: { $first: "$reviewsCount" },
//                               unitMeasurement: { $first: "$unitMeasurement" },
//                               salesTaxOutSide: { $first: "$salesTaxOutSide" },
//                               salesTaxWithIn: { $first: "$salesTaxWithIn" },
//                               purchaseTax: { $first: "$purchaseTax" },
//                               product_categories: {
//                                 $first: "$product_categories",
//                               },
//                               // other keys
//                               barcode: { $first: "$barcode" },
//                               slug: { $first: "$slug" },
//                               longDesc: { $first: "$longDesc" },
//                               shortDesc: { $first: "$shortDesc" },
//                               attachment: { $first: "$attachment" },
//                               banner: { $first: "$banner" },
//                               productThreshold: { $first: "$productThreshold" },
//                               ProductRegion: { $first: "$ProductRegion" },
//                               hsnCode: { $first: "$hsnCode" },
//                               SKUCode: { $first: "$SKUCode" },
//                               unitQuantity: { $first: "$unitQuantity" },
//                               productExpiryDay: { $first: "$productExpiryDay" },
//                               attribute_group: { $first: "$attribute_group" },
//                               youtube_link: { $first: "$youtube_link" },
//                               created_at: { $first: "$created_at" },
//                             },
//                           },
//                         ],

//                         // For populating other small keys
//                         ...[
//                           {
//                             $lookup: {
//                               from: "unit_measurements",
//                               localField: "unitMeasurement",
//                               foreignField: "_id",
//                               as: "unitMeasurement",
//                             },
//                           },
//                           {
//                             $unwind: {
//                               path: "$unitMeasurement",
//                               preserveNullAndEmptyArrays: true,
//                             },
//                           },

//                           {
//                             $lookup: {
//                               from: "taxs",
//                               localField: "salesTaxOutSide",
//                               foreignField: "_id",
//                               as: "salesTaxOutSide",
//                             },
//                           },
//                           {
//                             $unwind: {
//                               path: "$salesTaxOutSide",
//                               preserveNullAndEmptyArrays: true,
//                             },
//                           },

//                           {
//                             $lookup: {
//                               from: "taxs",
//                               localField: "salesTaxWithIn",
//                               foreignField: "_id",
//                               as: "salesTaxWithIn",
//                             },
//                           },
//                           {
//                             $unwind: {
//                               path: "$salesTaxWithIn",
//                               preserveNullAndEmptyArrays: true,
//                             },
//                           },

//                           {
//                             $lookup: {
//                               from: "taxs",
//                               localField: "purchaseTax",
//                               foreignField: "_id",
//                               as: "purchaseTax",
//                             },
//                           },
//                           {
//                             $unwind: {
//                               path: "$purchaseTax",
//                               preserveNullAndEmptyArrays: true,
//                             },
//                           },
//                         ],
//                       ],
//                       as: "CartDetail.product_id",
//                     },
//                   },
//                   {
//                     $unwind: {
//                       path: "$CartDetail.product_id",
//                       preserveNullAndEmptyArrays: true,
//                     },
//                   },
//                   {
//                     $group: {
//                       _id: "$_id",
//                       user_id: { $first: "$user_id" },
//                       redeem_point: { $first: "$redeem_point" },
//                       totalCartPrice: { $first: "$totalCartPrice" },
//                       subscribe: { $first: "$subscribe" },
//                       regionID: { $first: "$regionID" },
//                       CartDetail: { $push: "$CartDetail" },
//                       SubscribeDetail: { $first: "$SubscribeDetail" },
//                       createDate: { $first: "$createDate" },
//                     },
//                   },
//                   {
//                     $addFields: {
//                       CartDetail: {
//                         $filter: {
//                           input: "$CartDetail",
//                           as: "cd",
//                           cond: {
//                             $gt: [{ $size: { $objectToArray: "$$cd" } }, 2],
//                           },
//                         },
//                       },
//                     },
//                   },
//                 ],
//                 async (err, cartData1) => {
//                   if (err) {
//                     errorLogger.error(err, "\n", "\n");
//                     return res.status(500).json({
//                       allErrors: [],
//                       status: "error",
//                       msg:
//                         "Something Went Wrong! Please try agian after sometime.",
//                     });
//                   }
//                   let getDetail = cartData1[0];
//                   if (
//                     !getDetail ||
//                     getDetail.CartDetail == null ||
//                     getDetail.CartDetail == ""
//                   ) {
//                     return res.status(200).json({
//                       status: "ok",
//                       result: "Add to Cart is empty",
//                     });
//                   } else {
//                     var TotalSimpleQty = 0;
//                     var TotalConfigQty = 0;
//                     var TotalSimpleQtyWithOutPackage = 0;
//                     var CartDetailArray = [];
//                     var CartDetail = getDetail.CartDetail;

//                     let simpleProductsQuantity = {};
//                     let configProductsQuantity = {};

//                     for (var m = 0; m < CartDetail.length; m++) {
//                       var DataI = CartDetail[m];

//                       var ConfigItemPush = {};
//                       var SimpleItemPush = {};

//                       if (
//                         deliverySlot == "Same Day Delivery" &&
//                         !DataI.product_id.sameDayDelivery
//                       ) {
//                         return res.status(500).json({
//                           allErrors: [],
//                           status: "error",
//                           msg: `Same Day Delivery is not available with ${DataI.product_id.product_name}`,
//                         });
//                       }
//                       if (
//                         deliverySlot == "Farm Pickup" &&
//                         !DataI.product_id.farmPickup
//                       ) {
//                         return res.status(500).json({
//                           allErrors: [],
//                           status: "error",
//                           msg: `Farm Pickup is not available with ${DataI.product_id.product_name}`,
//                         });
//                       }
//                       if (
//                         !DataI.product_id.status ||
//                         !DataI.product_id.showstatus
//                       ) {
//                         return res.status(500).json({
//                           allErrors: [],
//                           status: "error",
//                           msg: `${DataI.product_id.product_name} is no more available for sale`,
//                         });
//                       }
//                       for (const cat of DataI.product_id.product_categories) {
//                         if (!cat.status) {
//                           return res.status(500).json({
//                             allErrors: [],
//                             status: "error",
//                             msg: `${DataI.product_id.product_name} is no more available for sale`,
//                           });
//                         }
//                       }

//                       if (DataI.TypeOfProduct == "configurable") {
//                         let variants = DataI.product_id.configurableData;

//                         for (var j = 0; j < variants.length; j++) {
//                           if (
//                             JSON.stringify(regionID) ==
//                               JSON.stringify(variants[j].region._id) &&
//                             DataI.variant_name == variants[j].variant_name
//                           ) {
//                             ConfigItemPush = variants[j];
//                           }
//                         }

//                         var availQty = DataI.product_id.availableQuantity;
//                         var totalQty = DataI.unitQuantity * DataI.qty;
//                         console.log(
//                           "totalQty = ",
//                           totalQty,
//                           " and availQty = ",
//                           availQty
//                         );

//                         if (
//                           !configProductsQuantity[
//                             `${DataI.product_id._id}__${regionID}__${DataI.variant_name}`
//                           ]
//                         ) {
//                           configProductsQuantity[
//                             `${DataI.product_id._id}__${regionID}__${DataI.variant_name}`
//                           ] = [
//                             DataI.product_id.product_name,
//                             regionID,
//                             availQty,
//                             totalQty,
//                             DataI.product_id.unitMeasurement,
//                           ];
//                         } else {
//                           configProductsQuantity[
//                             `${DataI.product_id._id}__${regionID}__${DataI.variant_name}`
//                           ][2] = availQty;
//                           configProductsQuantity[
//                             `${DataI.product_id._id}__${regionID}__${DataI.variant_name}`
//                           ][3] += totalQty;
//                         }
//                       } else if (DataI.TypeOfProduct == "simple") {
//                         var availQty = DataI.product_id.availableQuantity;
//                         var totalQty =
//                           DataI.without_package === true &&
//                           DataI.preOrder == false
//                             ? DataI.unitQuantity * DataI.qty
//                             : DataI.packet_size * DataI.qty;
//                         console.log(
//                           "totalQty = ",
//                           totalQty,
//                           " and availQty = ",
//                           availQty
//                         );

//                         if (
//                           !simpleProductsQuantity[
//                             `${DataI.product_id._id}__${regionID}`
//                           ]
//                         ) {
//                           simpleProductsQuantity[
//                             `${DataI.product_id._id}__${regionID}`
//                           ] = [
//                             DataI.product_id.product_name,
//                             regionID,
//                             availQty,
//                             totalQty,
//                             DataI.product_id.unitMeasurement,
//                           ];
//                         } else {
//                           simpleProductsQuantity[
//                             `${DataI.product_id._id}__${regionID}`
//                           ][2] = availQty;
//                           simpleProductsQuantity[
//                             `${DataI.product_id._id}__${regionID}`
//                           ][3] += totalQty;
//                         }

//                         var SimpleData = DataI.product_id.simpleData;
//                         if (SimpleData.length > 0) {
//                           for (var j = 0; j < SimpleData.length; j++) {
//                             var SimpleDataIPackage = SimpleData[j].package;
//                             for (
//                               var k = 0;
//                               k < SimpleDataIPackage.length;
//                               k++
//                             ) {
//                               var packageDataI = SimpleDataIPackage[k];
//                               if (
//                                 JSON.stringify(DataI.productItemId) ==
//                                 JSON.stringify(packageDataI._id)
//                               ) {
//                                 SimpleItemPush = packageDataI;
//                               }
//                             }
//                           }
//                         }
//                       } else if (DataI.TypeOfProduct == "group") {
//                         // console.log("::::::::::::::::::::::::::::", DataI.groupData);
//                         try {
//                           for (let j = 0; j < DataI.groupData.length; j++) {
//                             let set = DataI.groupData[j];
//                             for (let k = 0; k < set.sets.length; k++) {
//                               let product = set.sets[k].product;

//                               let [productData1] = await ProductData.aggregate([
//                                 {
//                                   $match: {
//                                     _id: mongoose.Types.ObjectId(product._id),
//                                     "simpleData.region": mongoose.Types.ObjectId(
//                                       regionID
//                                     ),
//                                   },
//                                 },
//                                 {
//                                   $addFields: {
//                                     simpleData: {
//                                       $ifNull: ["$simpleData", []],
//                                     },
//                                     configurableData: {
//                                       $ifNull: ["$configurableData", []],
//                                     },
//                                     groupData: {
//                                       $ifNull: ["$groupData", []],
//                                     },
//                                   },
//                                 },
//                                 // For adding quantity keys
//                                 ...[
//                                   {
//                                     $lookup: {
//                                       from: "inventory_items",
//                                       let: { product_id: "$_id" },
//                                       pipeline: [
//                                         {
//                                           $match: {
//                                             $expr: {
//                                               $and: [
//                                                 {
//                                                   $eq: [
//                                                     "$product_id",
//                                                     "$$product_id",
//                                                   ],
//                                                 },
//                                                 {
//                                                   $eq: [
//                                                     "$region",
//                                                     mongoose.Types.ObjectId(
//                                                       regionID
//                                                     ),
//                                                   ],
//                                                 },
//                                               ],
//                                             },
//                                           },
//                                         },
//                                         {
//                                           $group: {
//                                             _id: null,
//                                             productQuantity: {
//                                               $sum: "$productQuantity",
//                                             },
//                                             bookingQuantity: {
//                                               $sum: "$bookingQuantity",
//                                             },
//                                             availableQuantity: {
//                                               $sum: "$availableQuantity",
//                                             },
//                                             lostQuantity: {
//                                               $sum: "$lostQuantity",
//                                             },
//                                             returnQuantity: {
//                                               $sum: "$returnQuantity",
//                                             },
//                                             inhouseQuantity: {
//                                               $sum: "$inhouseQuantity",
//                                             },
//                                           },
//                                         },
//                                         { $project: { _id: 0 } },
//                                       ],
//                                       as: "inventories",
//                                     },
//                                   },
//                                   {
//                                     $unwind: {
//                                       path: "$inventories",
//                                       preserveNullAndEmptyArrays: true,
//                                     },
//                                   },
//                                   {
//                                     $addFields: {
//                                       productQuantity: {
//                                         $ifNull: [
//                                           {
//                                             $toDouble:
//                                               "$inventories.productQuantity",
//                                           },
//                                           0,
//                                         ],
//                                       },
//                                       bookingQuantity: {
//                                         $ifNull: [
//                                           {
//                                             $toDouble:
//                                               "$inventories.bookingQuantity",
//                                           },
//                                           0,
//                                         ],
//                                       },
//                                       availableQuantity: {
//                                         $ifNull: [
//                                           {
//                                             $toDouble:
//                                               "$inventories.availableQuantity",
//                                           },
//                                           0,
//                                         ],
//                                       },
//                                       lostQuantity: {
//                                         $ifNull: [
//                                           {
//                                             $toDouble:
//                                               "$inventories.lostQuantity",
//                                           },
//                                           0,
//                                         ],
//                                       },
//                                       returnQuantity: {
//                                         $ifNull: [
//                                           {
//                                             $toDouble:
//                                               "$inventories.returnQuantity",
//                                           },
//                                           0,
//                                         ],
//                                       },
//                                       inhouseQuantity: {
//                                         $ifNull: [
//                                           {
//                                             $toDouble:
//                                               "$inventories.inhouseQuantity",
//                                           },
//                                           0,
//                                         ],
//                                       },
//                                     },
//                                   },
//                                 ],
//                                 // For Populating other keys
//                                 ...[
//                                   {
//                                     $lookup: {
//                                       from: "unit_measurements",
//                                       localField: "unitMeasurement",
//                                       foreignField: "_id",
//                                       as: "unitMeasurement",
//                                     },
//                                   },
//                                   {
//                                     $unwind: {
//                                       path: "$unitMeasurement",
//                                       preserveNullAndEmptyArrays: true,
//                                     },
//                                   },
//                                 ],
//                                 {
//                                   $project: {
//                                     product_name: 1,
//                                     unitMeasurement: 1,
//                                     preOrderRemainQty: 1,
//                                     preOrder: 1,
//                                     availableQuantity: 1,
//                                   },
//                                 },
//                               ]);

//                               var availQty = productData1.availableQuantity;
//                               var totalQty =
//                                 (set.sets[k].package
//                                   ? set.sets[k].package.packet_size
//                                   : set.sets[k].unitQuantity) *
//                                 set.sets[k].qty *
//                                 DataI.qty;
//                               console.log(
//                                 "totalQty = ",
//                                 totalQty,
//                                 " and availQty = ",
//                                 availQty
//                               );

//                               if (
//                                 !simpleProductsQuantity[
//                                   `${productData1._id}__${regionID}`
//                                 ]
//                               ) {
//                                 simpleProductsQuantity[
//                                   `${productData1._id}__${regionID}`
//                                 ] = [
//                                   productData1.product_name,
//                                   regionID,
//                                   availQty,
//                                   totalQty,
//                                   productData1.unitMeasurement,
//                                 ];
//                               } else {
//                                 simpleProductsQuantity[
//                                   `${productData1._id}__${regionID}`
//                                 ][2] = availQty;
//                                 simpleProductsQuantity[
//                                   `${productData1._id}__${regionID}`
//                                 ][3] += totalQty;
//                               }
//                             }
//                           }
//                           // console.log("========================= 2");
//                         } catch (err) {
//                           errorLogger.error(err, "\n", "\n");
//                           console.log("err::::::", err);
//                         }
//                       }

//                       var ProducImages = DataI.product_id.images;
//                       var ProducImagesArray = [];
//                       if (ProducImages != null) {
//                         for (var i1 = 0; i1 < ProducImages.length; i1++) {
//                           ProducImagesArray.push(ProducImages[i1].image);
//                         }
//                       }

//                       if (state.toLocaleLowerCase().includes("delhi")) {
//                         var salesTaxWithIn = DataI.product_id.salesTaxWithIn;
//                         var salesTaxOutSide = null;
//                       } else {
//                         var salesTaxWithIn = null;
//                         var salesTaxOutSide = DataI.product_id.salesTaxOutSide;
//                       }

//                       if (getCoupon) {
//                         var couponId = getCoupon._id;
//                         var couponApplied = true;
//                         var coupon_value = getCoupon.couponValue;
//                         var coupon_code = getCoupon.coupon_code;
//                         var discountType = getCoupon.discountType;
//                         var discountAmount = getCoupon.discountAmount;
//                         var discountLocation = getCoupon.discountLocation;
//                         var discountPercentage = getCoupon.discountPercentage;
//                         var discount_upto = getCoupon.discount_upto;
//                         var discountProduct = getCoupon.discountProduct;
//                         var discountProductPackageId =
//                           getCoupon.discountProductPackageId;

//                         var itemDiscountPercentage = 0;
//                         var itemDiscountAmount = 0;
//                         var totalCartPrice = getDetail.totalCartPrice;
//                         if (discountPercentage) {
//                           // itemDiscountPercentage =  (discountPercentage/totalCartPrice)*100
//                           itemDiscountPercentage = +discountPercentage;
//                           itemDiscountAmount =
//                             +(itemDiscountPercentage * DataI.totalprice) / 100;
//                         }
//                         if (discountAmount) {
//                           itemDiscountPercentage =
//                             +(discountAmount / totalCartPrice) * 100;
//                           itemDiscountAmount =
//                             +(itemDiscountPercentage * DataI.totalprice) / 100;
//                         }
//                       }

//                       CartDetailArray.push({
//                         _id: DataI._id,
//                         product_id: DataI.product_id,
//                         product_name: DataI.product_id.product_name,
//                         product_longDesc: DataI.product_id.longDesc,
//                         product_shortDesc: DataI.product_id.shortDesc,
//                         product_SKUCode: DataI.product_id.SKUCode,
//                         product_images: ProducImagesArray,
//                         // product_cat_name: category_name,
//                         // product_subCat1_name: product_subCat1_name,
//                         product_categories: DataI.product_id.product_categories,
//                         productItemId: DataI.productItemId,
//                         salesTaxWithIn: salesTaxWithIn,
//                         salesTaxOutSide: salesTaxOutSide,
//                         TypeOfProduct: DataI.TypeOfProduct,
//                         variant_name: DataI.variant_name || null,
//                         price: DataI.price,
//                         qty: DataI.qty,
//                         totalprice: DataI.totalprice,
//                         unitQuantity: DataI.unitQuantity,
//                         unitMeasurement: DataI.unitMeasurement,
//                         without_package: DataI.without_package,
//                         packet_size: DataI.packet_size,
//                         packetLabel: DataI.packetLabel,
//                         itemDiscountPercentage: DataI.itemDiscountPercentage,
//                         itemDiscountAmount: +DataI.itemDiscountAmount,
//                         createDate: DataI.createDate,
//                         status: DataI.status,
//                         simpleItem: SimpleItemPush,
//                         ConfigItem: ConfigItemPush,
//                         groupData: DataI.groupData,
//                       });
//                     }

//                     let allErrors = [];
//                     for (const key in simpleProductsQuantity) {
//                       if (
//                         Object.hasOwnProperty.call(simpleProductsQuantity, key)
//                       ) {
//                         const element = simpleProductsQuantity[key];
//                         if (element[2] < element[3]) {
//                           allErrors.push(
//                             ` ${element[0]} more than ${element[2]} ${element[4].name}`
//                           );
//                         }
//                       }
//                     }

//                     for (const key in configProductsQuantity) {
//                       if (
//                         Object.hasOwnProperty.call(configProductsQuantity, key)
//                       ) {
//                         const element = configProductsQuantity[key];
//                         if (element[2] < element[3]) {
//                           allErrors.push(
//                             ` ${element[0]} more than ${element[2]} ${element[4].name}`
//                           );
//                         }
//                       }
//                     }

//                     if (allErrors.length > 0) {
//                       return res.status(400).json({
//                         status: "error",
//                         allErrors,
//                         msg: "",
//                       });
//                     }

//                     var booking_address = {
//                       address: address,
//                       country: country,
//                       state: state,
//                       city: city,
//                       pincode: pincode,
//                       locality: locality,
//                       latitude: latitude,
//                       longitude: longitude,
//                       locationTag: locationTag,
//                       houseNo: houseNo,
//                     };
//                     var giftingAddress = req.body.giftingAddress;

//                     if (getCoupon) {
//                       var couponId = getCoupon._id;
//                       var couponApplied = true;
//                       var coupon_value = getCoupon.couponValue;
//                       var coupon_code = getCoupon.coupon_code;
//                       var discountType = getCoupon.discountType;
//                       var discountAmount = getCoupon.discountAmount;
//                       var discountPercentage = getCoupon.discountPercentage;
//                       var discount_upto = getCoupon.discount_upto;
//                       var discountProduct = getCoupon.discountProduct;
//                       var discountProductPackageId =
//                         getCoupon.discountProductPackageId;
//                     } else {
//                       var couponId = null;
//                       var coupon_value = null;
//                       var couponApplied = false;
//                       var coupon_code = null;
//                       var discountType = null;
//                       var discountAmount = null;
//                       var discountPercentage = null;
//                       var discount_upto = null;
//                       var discountProduct = null;
//                       var discountProductPackageId = null;
//                     }

//                     let billingCompany = await Company.findOne({
//                       isDefault: true,
//                     }).lean();

//                     // console.log("before 0000000000000000");
//                     // make sure that data coming from cart and data from checkout page is same (if same account on two devices)
//                     {
//                       let errorPresent = 0;
//                       let tp = 0;
//                       CartDetailArray.forEach((item1) => {
//                         //console.log("item1item1item1item1item1item1item1item1", item1);
//                         tp += item1.totalprice;

//                         let itemMatched = false;
//                         itemWiseData.forEach((item2) => {
//                           // console.log(item1.product_id._id.toString(), "==", item2._id, item1.product_id._id.toString() == item2._id);
//                           // console.log(item1.packet_size, "==hhh", item2.packet_size, item1.packet_size == item2.packet_size);
//                           if (
//                             item1.product_id._id.toString() == item2._id &&
//                             item1.packet_size == item2.packet_size
//                           ) {
//                             // console.log("..............inside if...............");
//                             itemMatched = true;
//                           }
//                         });
//                         // console.log(".............................", itemMatched);
//                         if (!itemMatched) {
//                           // console.log("hereeeeeeeeeee");
//                           errorPresent = 1;
//                         }
//                       });
//                       // console.log("inside 1", tp);
//                       if (req.body.totalCartPrice != tp) {
//                         // console.log("wahan");
//                         errorPresent = 2;
//                       }

//                       if (CartDetailArray.length != itemWiseData.length) {
//                         // console.log("yahan");
//                         errorPresent = 3;
//                       }

//                       if (errorPresent) {
//                         // console.log("8888888");
//                         return res.status(500).json({
//                           allErrors: [],
//                           status: "error",
//                           msg:
//                             "Your cart has been modified on another device you may have previously logged on to. Please check your cart once before you proceed.",
//                         });
//                       }

//                       // let pre_order1 = false;
//                       // itemWiseData.forEach((item2) => {
//                       //   if (item2.preOrder) {
//                       //     pre_order1 = true;
//                       //   }
//                       // });
//                       // console.log("inside 2");
//                       // if (pre_order1 != req.body.preOrder) {
//                       //   res.status(500).json({
//                       //     status: "error",
//                       //     error: "Cart Modified!",
//                       //     code: 3,
//                       //   });
//                       //
//                       // }
//                     }
//                     // console.log("after 0000000000000000");

//                     // add itemwisedata to bookingDetail

//                     CartDetailArray.forEach((item1) => {
//                       itemWiseData.forEach((item2) => {
//                         // console.log(
//                         //   "***********************************************************************88",
//                         //   JSON.stringify(item1),
//                         //   "***********************************************************************88",
//                         //   JSON.stringify(item2)
//                         // );

//                         if (
//                           item1.product_id._id.toString() == item2._id &&
//                           item1.packet_size == item2.packet_size
//                         ) {
//                           item1.preOrderStartDate = item2.preOrderStartDate;
//                           item1.preOrderEndDate = item2.preOrderEndDate;
//                           item1.itemDiscountAmount = item2.itemDiscountAmount;
//                           item1.totalPriceBeforeGST = item2.totalPriceBeforeGST;
//                           item1.totalPriceAfterGST = item2.totalPriceAfterGST
//                             ? item2.totalPriceAfterGST
//                             : +item2.totalPriceBeforeGST + +item2.itemWiseGst;
//                           item1.itemDiscountAmountBeforeGST =
//                             item2.itemDiscountAmountBeforeGST;
//                           item1.itemWiseGst = item2.itemWiseGst;
//                         }
//                       });
//                     });

//                     // console.log("CartDetailArray ::::::::::::::::::::", 000000000, CartDetailArray);
//                     // return;

//                     if (!createDbDoc && paymentmethod == "Razorpay") {
//                       var response = await instance.orders.create({
//                         amount: +total_payment * 100,
//                         currency: "INR",
//                         receipt: "receipt#1",
//                         // notes: {
//                         //   key1: "value3",
//                         //   key2: "value2",
//                         // },
//                       });
//                       return res.status(200).json({
//                         allErrors: [],
//                         status: "ok",
//                         response: response,
//                         msg: `All checks passed`,
//                       });
//                     }

//                     var jsonData = {
//                       //BookingStatusByAdmin:'Failed',
//                       user_id: user_id,
//                       userName: getUser.name,
//                       userEmail: getUser.email,
//                       userMobile: getUser.contactNumber,
//                       userType: getUser.user_type,
//                       userData: getUser,
//                       addToCartID: addToCartID,
//                       regionName: regionName,
//                       regionID: getDetail.regionID,
//                       razorpay_payment_id: payment_id,
//                       bookingMode: bookingMode,
//                       booking_code: ORDER_ID,
//                       // invoiceNO: invoiceNO,
//                       paymentmethod: paymentmethod,
//                       TXNID: req.body.TXNID || null,
//                       razorpay_orderid: req.body.razorpay_orderid || null,
//                       payment: req.body.payment || "Failed",
//                       cod: cod,
//                       total_payment: total_payment,
//                       redeem_point: redeem,
//                       redeemDiscount: redeemDiscount,
//                       referralDiscount: referralDiscount,
//                       booking_address: booking_address,
//                       otheraddress: otheraddress,
//                       bookingdetail: CartDetailArray,
//                       couponId: couponId,
//                       totalCouponDiscountAmount: totalCouponDiscountAmount,
//                       coupon_value: coupon_value,
//                       couponApplied: couponApplied,
//                       coupon_code: coupon_code,
//                       discountType: discountType,
//                       discountAmount: totalCouponDiscountAmount
//                         ? totalCouponDiscountAmount
//                         : discountAmount,
//                       discountLocation: discountLocation,
//                       discountPercentage: discountPercentage,
//                       discount_upto: discount_upto,
//                       discountProduct: discountProduct,
//                       discountProductPackageId: discountProductPackageId,
//                       allGstLists: allGstLists,
//                       billingCompany: billingCompany._id,
//                       gst: gst,
//                       taxType: taxType,
//                       totalCartPrice: getDetail.totalCartPrice,
//                       totalCartPriceWithoutGST: +totalCartPriceWithoutGST,
//                       codCharges: codCharges,
//                       deliveryCharges: deliveryCharges,
//                       giftingName: giftingName,
//                       giftingContact: giftingContact,
//                       giftingAddress: giftingAddress,
//                       giftingNote: giftingNote,
//                       giftingStatus: giftingStatus,
//                       device_name: device_name,
//                       delivery_instructions: delivery_instructions,
//                       preOrder: preOrder,
//                       deliverySlot: deliverySlot,
//                       loyaltyProgram: program,
//                     };
//                     bookingDataBase.create(jsonData, async function (
//                       err,
//                       insertedData
//                     ) {
//                       // console.log("insertedData", insertedData);
//                       if (err) {
//                         errorLogger.error(err, "\n", "\n");
//                         console.log(err, "88888888888899999999999999999");
//                         return res.status(500).json({
//                           allErrors: [],
//                           status: "error",
//                           msg:
//                             "Something Went Wrong! Please try agian after sometime.",
//                         });
//                       } else {
//                         // console.log("=======================================================================================", 111111111);
//                         // update orderID
//                         var booking_code =
//                           "KC" +
//                           (insertedData.counter < 10
//                             ? "0" + insertedData.counter
//                             : insertedData.counter);
//                         // console.log("3333333333333333%%%%%%%", booking_code);
//                         var d = new Date();
//                         var year = d.getFullYear();
//                         var date = d.getDate();
//                         // var invoiceNO =
//                         //   insertedData.counter +
//                         //   "/" +
//                         //   `${new Date().getFullYear().toString()}-${(new Date().getFullYear() + 1)
//                         //     .toString()
//                         //     .slice(2)}`;
//                         let updated = await bookingDataBase.update(
//                           {
//                             _id: insertedData._id,
//                           },
//                           {
//                             booking_code,
//                             // invoiceNO,
//                           }
//                         );

//                         var userName = getUser.name;
//                         var userEmail = getUser.email;
//                         var userMobile = getUser.contactNumber;

//                         //CartDetail:[]
//                         // await addToCartDataBase.updateMany(
//                         //   { _id: addToCartID },
//                         //   {
//                         //     redeem_point: 0,
//                         //     totalCartPrice: 0,
//                         //     CartDetail: [],
//                         //   }
//                         // );

//                         if (getCoupon) {
//                           if (getCoupon.discountProduct) {
//                             var discountProduct = getCoupon.discountProduct;
//                             var discountProductPackageId =
//                               getCoupon.discountProductPackageId;
//                             //-start----------------free product send in database if coupon applied from frontend
//                             products
//                               .findById(getCoupon.discountProduct)
//                               .exec(function (err, FreeProduct) {
//                                 if (err) {
//                                   errorLogger.error(err, "\n", "\n");
//                                   console.log("77777777777777", err);
//                                   return res.status(500).json({
//                                     allErrors: [],
//                                     status: "error",
//                                     msg:
//                                       "Something Went Wrong! Please try agian after sometime.",
//                                   });
//                                 } else if (FreeProduct) {
//                                   var ProducImages = FreeProduct.images;
//                                   var ProducImagesArray = [];
//                                   if (ProducImages != null) {
//                                     for (
//                                       var i = 0;
//                                       i < ProducImages.length;
//                                       i++
//                                     ) {
//                                       ProducImagesArray.push(
//                                         ProducImages[i].image
//                                       );
//                                     }
//                                   }
//                                   var SimpleItemPush = {};
//                                   if (FreeProduct.TypeOfProduct == "simple") {
//                                     if (FreeProduct.without_package == true) {
//                                       TotalSimpleQtyWithOutPackage +=
//                                         DataI.unitQuantity * DataI.qty;
//                                     } else {
//                                       var SimpleData = FreeProduct.simpleData;
//                                       for (
//                                         var j = 0;
//                                         j < SimpleData.length;
//                                         j++
//                                       ) {
//                                         var SimpleDataIPackage =
//                                           SimpleData[j].package;
//                                         for (
//                                           var k = 0;
//                                           k < SimpleDataIPackage.length;
//                                           k++
//                                         ) {
//                                           var packageDataI =
//                                             SimpleDataIPackage[k];

//                                           if (
//                                             JSON.stringify(
//                                               discountProductPackageId
//                                             ) ==
//                                             JSON.stringify(packageDataI._id)
//                                           ) {
//                                             SimpleItemPush = {
//                                               packet_size:
//                                                 packageDataI.packet_size,
//                                               packetLabel:
//                                                 packageDataI.packetLabel,
//                                               selling_price: 0,
//                                               packetmrp: 0,
//                                               free: true,
//                                               _id: packageDataI._id,
//                                             };

//                                             TotalSimpleQty +=
//                                               DataI.packet_size * DataI.qty;
//                                           }
//                                         }
//                                       }
//                                     }
//                                   }

//                                   var freeProduct = {
//                                     product_id: FreeProduct.product_id,
//                                     product_name: FreeProduct.product_name,
//                                     product_longDesc: FreeProduct.longDesc,
//                                     product_shortDesc: FreeProduct.shortDesc,
//                                     product_SKUCode: FreeProduct.SKUCode,
//                                     product_images: ProducImagesArray,
//                                     product_cat_id: FreeProduct.product_cat_id,
//                                     product_subCat1_id:
//                                       FreeProduct.product_subCat1_id,
//                                     productItemId: discountProductPackageId,
//                                     TypeOfProduct: FreeProduct.TypeOfProduct,
//                                     packet_size: FreeProduct.packet_size,
//                                     packetLabel: FreeProduct.packetLabel,
//                                     price: FreeProduct.price,
//                                     qty: FreeProduct.qty,
//                                     unitQuantity: FreeProduct.unitQuantity,
//                                     unitMeasurement:
//                                       FreeProduct.unitMeasurement,
//                                     without_package:
//                                       FreeProduct.without_package,
//                                     totalprice: 0,
//                                     createDate: FreeProduct.createDate,
//                                     status: FreeProduct.status,
//                                     simpleItem: SimpleItemPush,
//                                     free: true,
//                                   };

//                                   bookingDataBase.findOneAndUpdate(
//                                     {
//                                       _id: insertedData._id,
//                                     },
//                                     {
//                                       $push: {
//                                         bookingdetail: freeProduct,
//                                       },
//                                     },
//                                     async function (err, data) {
//                                       if (err) {
//                                         errorLogger.error(err, "\n", "\n");
//                                         console.log("68989999", err);
//                                         return res.status(500).json({
//                                           allErrors: [],
//                                           status: "error",
//                                           msg:
//                                             "Something Went Wrong! Please try agian after sometime.",
//                                         });
//                                       } else {
//                                         var TotalQtyN =
//                                           TotalConfigQty +
//                                           TotalSimpleQty +
//                                           TotalSimpleQtyWithOutPackage;
//                                         // var bookingID = insertedData._id;
//                                         // common.reduceQtyFormproductAndInventory(bookingID, res);

//                                         return res.status(200).json({
//                                           status: "ok",
//                                           result: insertedData.booking_code,
//                                         });
//                                       }
//                                     }
//                                   );
//                                 } else {
//                                   // var bookingID = insertedData._id;
//                                   // common.reduceQtyFormproductAndInventory(bookingID, res);

//                                   res.status(200).json({
//                                     message: "ok",
//                                     data: insertedData.booking_code,
//                                     code: 1,
//                                   });
//                                 }
//                               });
//                             //-end----------------free product send in database if coupon applied from frontend
//                           } else {
//                             // var bookingID = insertedData._id;
//                             // common.reduceQtyFormproductAndInventory(bookingID, res);
//                           }
//                         } else {
//                           // var bookingID = insertedData._id;
//                           // common.reduceQtyFormproductAndInventory(bookingID, res);
//                         }
//                         var orderDetails = {
//                           name: insertedData.userName,
//                           booking_code: booking_code,
//                           createDate: insertedData.createDate,
//                           BookingStatusByAdmin:
//                             insertedData.BookingStatusByAdmin,
//                           products: insertedData.bookingdetail,
//                           address: insertedData.booking_address.locality,
//                           paymentMethod: insertedData.paymentmethod,
//                           paymentStatus:
//                             paymentmethod.toLocaleLowerCase() == "wallet"
//                               ? "Complete"
//                               : insertedData.payment,
//                           gst: insertedData.gst ? insertedData.gst : 0,
//                           allGstLists: insertedData.allGstLists,
//                           taxType: insertedData.taxType,
//                           totalCartPrice: insertedData.totalCartPriceWithoutGST
//                             ? insertedData.totalCartPriceWithoutGST
//                             : 0,
//                           deliveryCharges: insertedData.deliveryCharges
//                             ? insertedData.deliveryCharges
//                             : 0,
//                           adminDiscount: insertedData.adminDiscount
//                             ? insertedData.adminDiscount
//                             : 0,
//                           discountAmount: insertedData.discountAmount
//                             ? insertedData.discountAmount
//                             : 0,
//                           redeemDiscount: insertedData.redeemDiscount
//                             ? insertedData.redeemDiscount
//                             : 0,
//                           referralDiscount: insertedData.referralDiscount
//                             ? insertedData.referralDiscount
//                             : 0,
//                           codCharges: insertedData.codCharges
//                             ? insertedData.codCharges
//                             : 0,
//                           total_payment: insertedData.total_payment
//                             ? insertedData.total_payment
//                             : 0,
//                           deliverySlot: insertedData.deliverySlot
//                             ? insertedData.deliverySlot
//                             : null,
//                         };

//                         var ProductDetail = await common.OrderDetails(
//                           orderDetails
//                         );
//                         if (paymentmethod == "Paytm") {
//                           if (req.body.device_name === "mobile") {
//                             var CHANNEL_ID = "WAP";
//                           } else {
//                             var CHANNEL_ID = "WEB";
//                           }
//                           var paymentDetails = {
//                             amount: String(total_payment),
//                             customerId: user_id,
//                             customerEmail: getUser.email,
//                             customerPhone: String(getUser.contactNumber),
//                             ORDER_ID: booking_code,
//                             CHANNEL_ID: CHANNEL_ID,
//                           };
//                           // var paymentDetails = {
//                           //   amount: '1000',
//                           //   customerId: user_id,
//                           //   customerEmail: getUser.email,
//                           //   customerPhone: '8802401227',
//                           //   ORDER_ID: booking_code,
//                           //   CHANNEL_ID: "WAP",
//                           // };
//                           // console.log(paymentDetails, "booking file");
//                           common.bookingPayNow(paymentDetails, res);
//                         } else if (
//                           paymentmethod.toLocaleLowerCase() == "wallet"
//                         ) {
//                           // console.log("-------------------------------------- 1");
//                           await User.findOneAndUpdate(
//                             {
//                               _id: user_id,
//                             },
//                             {
//                               $inc: {
//                                 walletAmount: -+total_payment,
//                               },
//                             }
//                           );
//                           // console.log("-------------------------------------- 2");
//                           var walletHistory = {
//                             user_id,
//                             amount: +total_payment,
//                             type: "debit",
//                             paymentStatus: "Complete",
//                             debitType: "order",
//                             orderID: insertedData._id,
//                             booking_code: booking_code,
//                           };
//                           // console.log("-------------------------------------- 2");
//                           WalletHistories.create(
//                             walletHistory,
//                             async (err, doc) => {
//                               if (err) {
//                                 errorLogger.error(err, "\n", "\n");
//                                 console.log("wwwwwwwwwwwwwwwww", err);
//                                 return res.status(500).json({
//                                   allErrors: [],
//                                   status: "error",
//                                   msg:
//                                     "Something Went Wrong! Please try agian after sometime.",
//                                 });
//                               } else {
//                                 // console.log("-------------------------------------- 3");

//                                 var bookingID = insertedData._id;
//                                 await bookingDataBase.update(
//                                   {
//                                     _id: insertedData._id,
//                                   },
//                                   {
//                                     payment: "Complete",
//                                   }
//                                 );

//                                 await common.reduceQtyFormproductAndInventory(
//                                   bookingID
//                                 );
//                                 await common.processLoyaltyAndRefferal(
//                                   booking_code,
//                                   getSettings?.loyalityProgramOnOff,
//                                   getSettings?.refferalPointsOnOff
//                                 );
//                                 await addToCartDataBase.findOneAndUpdate(
//                                   { user_id: user_id },
//                                   {
//                                     $set: {
//                                       user_id: user_id,
//                                       totalCartPrice: 0,
//                                       CartDetail: [],
//                                     },
//                                   }
//                                 );

//                                 orderDetails.paymentStatus = "Complete";
//                                 var email = userEmail;
//                                 var name = getUser.name;
//                                 var subject = "Order Placed Successfully!";
//                                 var message =
//                                   "Thank you for placing your order with Krishi Cress. Please find your order details below.";

//                                 var data = booking_code;
//                                 var mobile = getUser.contactNumber;
//                                 var mobileMsg = `Thank you for ordering at Krishi Cress. Your order ${data} has been placed. Questions? Get in touch with us +919667066462 or email us.`;

//                                 var mobile = getUser.contactNumber;

//                                 if (notifs?.order_placed.sms) {
//                                   common.sendOtp(mobile, mobileMsg);
//                                 }

//                                 if (notifs?.order_placed.user_email) {
//                                   var keys = {
//                                     userName: common.toTitleCase(name),
//                                     userMobile: mobile,
//                                     OrderDetail: ProductDetail,
//                                     type: "user",
//                                     template_name: "order place mail to user",
//                                     userEmail: email,
//                                   };
//                                   common.dynamicEmail(keys);
//                                   //common.sendMail(email, subject, name, message,data,orderDetails);
//                                 }

//                                 let users = await Admin.find(
//                                   {
//                                     user_role: {
//                                       $in: notifs?.order_placed.admin_roles,
//                                     },
//                                   },
//                                   { username: 1, email: 1 }
//                                 ).lean();

//                                 var message1 = `An order has been placed successfully. Please find order details below.
//                                       <p><strong>Name: </strong>${common.toTitleCase(
//                                         name
//                                       )}</p>
//                                       <p style="margin-top: -10px;"><strong>Mobile: </strong>${
//                                         getUser.contactNumber
//                                       }</p>
//                                       <p style="margin-top: -10px;"><strong>Email: </strong>${email}</p>`;

//                                 if (notifs?.order_placed.admin_email) {
//                                   users.forEach((user) => {
//                                     var keys = {
//                                       userName: common.toTitleCase(name),
//                                       userMobile: getUser.contactNumber,
//                                       userEmail: email,
//                                       OrderDetail: ProductDetail,
//                                       type: "admin",
//                                       template_name:
//                                         "order place mail to admin",
//                                       adminEmail: user.email,
//                                       adminName: user.username,
//                                     };
//                                     common.dynamicEmail(keys);
//                                   });
//                                 }

//                                 return res.status(200).json({
//                                   message: "ok",
//                                   data: booking_code,
//                                   code: 1,
//                                 });
//                               }
//                             }
//                           );
//                         } else {
//                           // console.log("---------------------------- 333333");
//                           if (paymentmethod === "Credit") {
//                             await User.updateOne(
//                               { _id: user_id },
//                               { $inc: { creditUsed: +total_payment } }
//                             );
//                           }

//                           var email = userEmail;
//                           var name = getUser.name;
//                           var subject = "Order Placed Successfully!";
//                           var message =
//                             "Thank You for placing your order with Krishi Cress. Please find your order details below.";

//                           var data = booking_code;
//                           var mobile = getUser.contactNumber;
//                           var mobileMsg = `Thank you for ordering at Krishi Cress. Your order ${data} has been placed. Questions? Get in touch with us +919667066462 or email us.`;

//                           var mobile = getUser.contactNumber;

//                           if (notifs?.order_placed.sms) {
//                             common.sendOtp(mobile, mobileMsg);
//                           }

//                           if (notifs?.order_placed.user_email) {
//                             var keys = {
//                               userName: common.toTitleCase(name),
//                               userMobile: mobile,
//                               OrderDetail: ProductDetail,
//                               type: "user",
//                               template_name: "order place mail to user",
//                               userEmail: email,
//                             };
//                             common.dynamicEmail(keys);
//                           }

//                           let users = await Admin.find(
//                             {
//                               user_role: {
//                                 $in: notifs?.order_placed.admin_roles,
//                               },
//                             },
//                             { username: 1, email: 1 }
//                           ).lean();

//                           var message1 = `An order has been placed successfully. Please find order details below.
//                             <p><strong>Name: </strong>${common.toTitleCase(
//                               name
//                             )}</p>
//                             <p style="margin-top: -10px;"><strong>Mobile: </strong>${
//                               getUser.contactNumber
//                             }</p>
//                             <p style="margin-top: -10px;"><strong>Email: </strong>${email}</p>`;

//                           if (notifs?.order_placed.admin_email) {
//                             users.forEach((user) => {
//                               var keys = {
//                                 userName: common.toTitleCase(name),
//                                 userMobile: getUser.contactNumber,
//                                 userEmail: email,
//                                 OrderDetail: ProductDetail,
//                                 type: "admin",
//                                 template_name: "order place mail to admin",
//                                 adminEmail: user.email,
//                                 adminName: user.username,
//                               };
//                               common.dynamicEmail(keys);
//                             });
//                           }

//                           var bookingID = insertedData._id;
//                           await common.reduceQtyFormproductAndInventory(
//                             bookingID
//                           );
//                           await common.processLoyaltyAndRefferal(
//                             booking_code,
//                             getSettings?.loyalityProgramOnOff,
//                             getSettings?.refferalPointsOnOff
//                           );
//                           await addToCartDataBase.findOneAndUpdate(
//                             { user_id: user_id },
//                             {
//                               $set: {
//                                 user_id: user_id,
//                                 totalCartPrice: 0,
//                                 CartDetail: [],
//                               },
//                             }
//                           );

//                           return res.status(200).json({
//                             message: "ok",
//                             data: booking_code,
//                             code: 1,
//                           });
//                         }
//                       } // else close of bookingDataBase
//                     });
//                   } // addToCartDataBase.findOne else close
//                 }
//               );
//             } //else close
//           } catch (err) {
//             errorLogger.error(err, "\n", "\n");
//             console.log(" see error here ==========>>>>>>>>>>>> ", err);
//           }
//         });
//     });
// };

module.exports.createBooking = function (req, res) {
  var body = req.body;
  var user_id = body.user_id;
  var user_email = body.user_email;
  var user_name = body.user_name;
  var addToCartID = body.addToCartID;
  var bookingMode = body.bookingMode;
  var address = body.address;
  var country = body.country;
  var state = body.state;
  var city = body.city;
  var locality = body.locality;
  var locationTag = body.locationTag;
  var houseNo = body.houseNo;
  var pincode = body.pincode;
  var latitude = body.latitude;
  var longitude = body.longitude;
  var delivery_instructions = body.delivery_instructions;
  var otheraddress = body.otheraddress;
  var paymentmethod = body.paymentmethod;
  var payment_id = body.payment_id;
  var total_payment = body.total_payment;
  var gst = body.gst;
  var allGstLists = body.allGstLists;
  var taxType = body.taxType;
  var redeem = body.redeem ? body.redeem : 0;
  var redeemDiscount = body.redeemDiscount ? body.redeemDiscount : 0;
  var referralDiscount = body.referralDiscount ? body.referralDiscount : 0;
  var cod = body.cod;
  var regionName = body.regionName;
  var regionID = body.regionID;
  var couponId = body.couponId;
  var deliveryCharges = body.deliveryCharges;
  var codCharges = body.codCharges;
  var giftingStatus = body.giftingStatus;
  var giftingName = body.giftingName;
  var giftingContact = body.giftingContact;
  var giftingAddress = body.giftingAddress;
  var giftingNote = body.giftingNote;
  var giftingStatus = body.giftingStatus;
  var device_name = req.body.device_name;
  var totalCouponDiscountAmount = req.body.totalCouponDiscountAmount;
  var totalCartPriceWithoutGST = req.body.totalCartPriceWithoutGST;
  var itemWiseData = req.body.itemWiseData;
  var preOrder = false;
  var deliverySlot = req.body.deliverySlot;
  var createDbDoc = req.body.createDbDoc;
  var error = {};
  if (user_id == "" || !user_id || user_id == undefined || user_id == null) {
    common.formValidate("user_id", res);
    return false;
  }
  if (user_email == "" || !user_email || user_email == undefined || user_email == null) {
    common.formValidate("user_email", res);
    return false;
  }
  if (user_name == "" || !user_name || user_name == undefined || user_name == null) {
    common.formValidate("user_name", res);
    return false;
  }
  if (addToCartID == "" || !addToCartID || addToCartID == undefined || addToCartID == null) {
    common.formValidate("addToCartID", res);
    return false;
  }

  // if (address == '' || !address || address == undefined  || address == null) {
  //     common.formValidate('address', res);
  //     return false;
  // }
  // if (country == '' || !country || country == undefined  || country == null) {
  //     common.formValidate('country', res);
  //     return false;
  // }
  //  if (state == '' || !state || state == undefined  || state == null) {
  //     common.formValidate('state', res);
  //     return false;
  // }
  //  if (city == '' || !city || city == undefined  || city == null) {
  //     common.formValidate('city', res);
  //     return false;
  // }

  if (bookingMode == "" || !bookingMode || bookingMode == undefined || bookingMode == null) {
    common.formValidate("bookingMode", res);
    return false;
  }
  // if (
  //   deliverySlot == "" ||
  //   !deliverySlot ||
  //   deliverySlot == undefined ||
  //   deliverySlot == null
  // ) {
  //   common.formValidate("deliverySlot", res);
  //   return false;
  // }
  if (total_payment == "" || !total_payment || total_payment == undefined || total_payment == null) {
    common.formValidate("total_payment", res);
    return false;
  }
  if (regionName == "" || !regionName || regionName == undefined || regionName == null) {
    common.formValidate("regionName", res);
    return false;
  }
  if (itemWiseData == "" || !itemWiseData || itemWiseData == undefined || itemWiseData == null) {
    common.formValidate("itemWiseData", res);
    return false;
  }

  if (couponId && couponId !== "undefined") {
    var couponId = couponId;
  } else {
    var couponId = null;
  }

  // return;

  User.findOne({ _id: user_id })
    .exec()
    .then((getUser) => {
      if (getUser.walletAmount < total_payment && paymentmethod.toLocaleLowerCase() == "wallet") {
        // console.log("1111");
        return res.status(500).json({
          allErrors: [],
          status: "error",
          msg: "Wallet amount less than order amount. Choose some other payment method",
        });
      }
      // credit limit check
      // console.log("@@!!@@ ", total_payment, getUser.creditUsed, total_payment + getUser.creditUsed, getUser.creditLimit);
      if (paymentmethod === "Credit" && +total_payment + +getUser.creditUsed > +getUser.creditLimit) {
        return res.status(400).json({
          allErrors: [],
          status: "error",
          msg: `Credit Limit Exceeded`,
          creditUsed: getUser.creditUsed,
          creditLimit: getUser.creditLimit,
        });
      }
      couponDataBase
        .findOne({ _id: couponId })
        .exec()
        .then(async (getCoupon) => {
          if (getCoupon) {
            let updates = {
              couponNoOfUsed: getCoupon.couponNoOfUsed + 1,
            };
            if (getCoupon.usageLimit - getCoupon.couponNoOfUsed == 1) {
              updates = { ...updates, status: false };
            }
            await couponDataBase.findOneAndUpdate({ _id: getCoupon._id }, updates);
            // console.log(getCoupon);
          }
          try {
            if (getUser == null) {
              return res.status(400).json({
                allErrors: [],
                status: "error",
                msg: `Your account is currently disabled. Please contact us for more information.`,
              });
            } else {
              let notifs = await OnOffDataBase.findOne({}).lean();

              // identify loyalty program
              var getSettings = await settingsModel.find({}).lean();
              getSettings = getSettings[0];
              var program = await LoyalityPrograms.find({
                $and: [
                  {
                    startOrderNo: {
                      $lte: getUser.NoOfOrder + getUser.prevNoOfOrder + 1,
                    },
                  },
                  {
                    endOrderNo: {
                      $gte: getUser.NoOfOrder + getUser.prevNoOfOrder + 1,
                    },
                  },
                ],
              }).lean();
              program = program[0];

              // loyalty checks
              if (redeem > 0 && getSettings?.loyalityProgramOnOff == "off") {
                // console.log("22222");
                return res.status(500).json({
                  allErrors: [],
                  status: "error",
                  msg: `loyalty program is off.... you can't redeem krishi seeds`,
                });
              }

              var maxRedeemAllowed = (getUser.TotalPoint ? +getUser.TotalPoint : 0) * getSettings?.seedValue;

              if (redeemDiscount > maxRedeemAllowed) {
                // console.log("3333");
                return res.status(500).json({
                  allErrors: [],
                  status: "error",
                  msg: `Maximum redeem discount exceeded - ${maxRedeemAllowed}`,
                });
              }

              // referral checks
              if (referralDiscount > 0 && getSettings?.refferalPointsOnOff == "off") {
                // console.log("444");
                return res.status(500).json({
                  allErrors: [],
                  status: "error",
                  msg: `referral program is off.... you can't have referral discount`,
                });
              }
              if (referralDiscount > 0 && !getUser.refferalCodeFrom) {
                // console.log("5555");
                return res.status(500).json({
                  allErrors: [],
                  status: "error",
                  msg: `you didn't use any referral code while signing up... not eligible for referral discount`,
                });
              }
              if (referralDiscount > 0 && getUser.NoOfOrder + getUser.prevNoOfOrder >= 3) {
                // console.log("6666");
                return res.status(500).json({
                  allErrors: [],
                  status: "error",
                  msg: `referral discount can be used only for 1st 3 orders`,
                });
              }
              if (referralDiscount > 0 && couponId) {
                // console.log("77777");
                return res.status(500).json({
                  allErrors: [],
                  status: "error",
                  msg: `Coupon and Referral discount can't be used together`,
                });
              }

              //make unique no for booking id

              var booking_code = "";

              var invoiceNO = null;
              //var ORDER_ID = "OrderID" + new Date().getTime();
              // var abbbb = bookingDataBase.find().count()
              // console.log('abbbbabbbbabbbbabbbbabbbbabbbbabbbb ', err)
              var ORDER_ID = "KC";
              // var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

              // for (var i = 0; i < 8; i++){
              //     booking_code += possible.charAt(Math.floor(Math.random() * possible.length));
              // }

              addToCartDataBase.aggregate(
                [
                  { $match: { user_id: mongoose.Types.ObjectId(user_id) } },
                  {
                    $unwind: {
                      path: "$CartDetail",
                      preserveNullAndEmptyArrays: true,
                    },
                  },
                  {
                    $lookup: {
                      from: "products",
                      let: {
                        product_id: "$CartDetail.product_id",
                        region_id: "$regionID",
                        variant_name: "$CartDetail.variant_name",
                      },
                      pipeline: [
                        {
                          $match: { $expr: { $eq: ["$$product_id", "$_id"] } },
                        },

                        // populate product categories
                        {
                          $lookup: {
                            from: "categories",
                            foreignField: "_id",
                            localField: "product_categories",
                            as: "product_categories",
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
                                          $eq: ["$region", "$$region_id"],
                                        },
                                        {
                                          $eq: ["$variant_name", "$$variant_name"],
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
                                    returnQuantity: { $sum: "$returnQuantity" },
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
                                $ifNull: [{ $toDouble: "$inventories.productQuantity" }, 0],
                              },
                              bookingQuantity: {
                                $ifNull: [{ $toDouble: "$inventories.bookingQuantity" }, 0],
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
                        ],

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
                              "simpleData.productQuantity": "$productQuantity",
                              "simpleData.bookingQuantity": "$bookingQuantity",
                              "simpleData.availableQuantity": "$availableQuantity",
                              "simpleData.lostQuantity": "$lostQuantity",
                              "simpleData.returnQuantity": "$returnQuantity",
                              "simpleData.inhouseQuantity": "$inhouseQuantity",
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
                              productQuantity: { $first: "$productQuantity" },
                              bookingQuantity: { $first: "$bookingQuantity" },
                              availableQuantity: {
                                $first: "$availableQuantity",
                              },
                              lostQuantity: { $first: "$lostQuantity" },
                              returnQuantity: { $first: "$returnQuantity" },
                              inhouseQuantity: { $first: "$inhouseQuantity" },
                              productSubscription: {
                                $first: "$productSubscription",
                              },
                              preOrder: { $first: "$preOrder" },
                              preOrderQty: { $first: "$preOrderQty" },
                              preOrderBookQty: { $first: "$preOrderBookQty" },
                              preOrderRemainQty: {
                                $first: "$preOrderRemainQty",
                              },
                              preOrderStartDate: {
                                $first: "$preOrderStartDate",
                              },
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
                              product_categories: {
                                $first: "$product_categories",
                              },
                              // other keys
                              barcode: { $first: "$barcode" },
                              slug: { $first: "$slug" },
                              longDesc: { $first: "$longDesc" },
                              shortDesc: { $first: "$shortDesc" },
                              attachment: { $first: "$attachment" },
                              banner: { $first: "$banner" },
                              productThreshold: { $first: "$productThreshold" },
                              ProductRegion: { $first: "$ProductRegion" },
                              hsnCode: { $first: "$hsnCode" },
                              SKUCode: { $first: "$SKUCode" },
                              unitQuantity: { $first: "$unitQuantity" },
                              productExpiryDay: { $first: "$productExpiryDay" },
                              attribute_group: { $first: "$attribute_group" },
                              youtube_link: { $first: "$youtube_link" },
                              created_at: { $first: "$created_at" },
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
                      as: "CartDetail.product_id",
                    },
                  },
                  {
                    $unwind: {
                      path: "$CartDetail.product_id",
                      preserveNullAndEmptyArrays: true,
                    },
                  },
                  {
                    $group: {
                      _id: "$_id",
                      user_id: { $first: "$user_id" },
                      redeem_point: { $first: "$redeem_point" },
                      totalCartPrice: { $first: "$totalCartPrice" },
                      subscribe: { $first: "$subscribe" },
                      regionID: { $first: "$regionID" },
                      CartDetail: { $push: "$CartDetail" },
                      SubscribeDetail: { $first: "$SubscribeDetail" },
                      createDate: { $first: "$createDate" },
                    },
                  },
                  {
                    $addFields: {
                      CartDetail: {
                        $filter: {
                          input: "$CartDetail",
                          as: "cd",
                          cond: {
                            $gt: [{ $size: { $objectToArray: "$$cd" } }, 2],
                          },
                        },
                      },
                    },
                  },
                ],
                async (err, cartData1) => {
                  if (err) {
                    errorLogger.error(err, "\n", "\n");
                    return res.status(500).json({
                      allErrors: [],
                      status: "error",
                      msg: "Something Went Wrong! Please try agian after sometime.",
                    });
                  }
                  let getDetail = cartData1[0];
                  if (!getDetail || getDetail.CartDetail == null || getDetail.CartDetail == "") {
                    return res.status(200).json({
                      status: "ok",
                      result: "Add to Cart is empty",
                    });
                  } else {
                    var TotalSimpleQty = 0;
                    var TotalConfigQty = 0;
                    var TotalSimpleQtyWithOutPackage = 0;
                    var CartDetailArray = [];
                    var CartDetail = getDetail.CartDetail;

                    let simpleProductsQuantity = {};
                    let configProductsQuantity = {};

                    for (var m = 0; m < CartDetail.length; m++) {
                      var DataI = CartDetail[m];

                      var ConfigItemPush = {};
                      var SimpleItemPush = {};

                      if (deliverySlot == "Same Day Delivery" && !DataI.product_id.sameDayDelivery) {
                        return res.status(500).json({
                          allErrors: [],
                          status: "error",
                          msg: `Same Day Delivery is not available with ${DataI.product_id.product_name}`,
                        });
                      }
                      if (deliverySlot == "Farm Pickup" && !DataI.product_id.farmPickup) {
                        return res.status(500).json({
                          allErrors: [],
                          status: "error",
                          msg: `Farm Pickup is not available with ${DataI.product_id.product_name}`,
                        });
                      }
                      if (!DataI.product_id.status || !DataI.product_id.showstatus) {
                        return res.status(500).json({
                          allErrors: [],
                          status: "error",
                          msg: `${DataI.product_id.product_name} is no more available for sale`,
                        });
                      }
                      for (const cat of DataI.product_id.product_categories) {
                        if (!cat.status) {
                          return res.status(500).json({
                            allErrors: [],
                            status: "error",
                            msg: `${DataI.product_id.product_name} is no more available for sale`,
                          });
                        }
                      }

                      if (DataI.TypeOfProduct == "configurable") {
                        let variants = DataI.product_id.configurableData;

                        for (var j = 0; j < variants.length; j++) {
                          if (JSON.stringify(regionID) == JSON.stringify(variants[j].region._id) && DataI.variant_name == variants[j].variant_name) {
                            ConfigItemPush = variants[j];
                          }
                        }

                        var availQty = DataI.product_id.availableQuantity;
                        var totalQty = DataI.unitQuantity * DataI.qty;
                        console.log("totalQty = ", totalQty, " and availQty = ", availQty);

                        if (!configProductsQuantity[`${DataI.product_id._id}__${regionID}__${DataI.variant_name}`]) {
                          configProductsQuantity[`${DataI.product_id._id}__${regionID}__${DataI.variant_name}`] = [
                            DataI.product_id.product_name,
                            regionID,
                            availQty,
                            totalQty,
                            DataI.product_id.unitMeasurement,
                          ];
                        } else {
                          configProductsQuantity[`${DataI.product_id._id}__${regionID}__${DataI.variant_name}`][2] = availQty;
                          configProductsQuantity[`${DataI.product_id._id}__${regionID}__${DataI.variant_name}`][3] += totalQty;
                        }
                      } else if (DataI.TypeOfProduct == "simple") {
                        var availQty = DataI.product_id.availableQuantity;
                        var totalQty =
                          DataI.without_package === true && DataI.preOrder == false ? DataI.unitQuantity * DataI.qty : DataI.packet_size * DataI.qty;
                        console.log("totalQty = ", totalQty, " and availQty = ", availQty);

                        if (!simpleProductsQuantity[`${DataI.product_id._id}__${regionID}`]) {
                          simpleProductsQuantity[`${DataI.product_id._id}__${regionID}`] = [
                            DataI.product_id.product_name,
                            regionID,
                            availQty,
                            totalQty,
                            DataI.product_id.unitMeasurement,
                          ];
                        } else {
                          simpleProductsQuantity[`${DataI.product_id._id}__${regionID}`][2] = availQty;
                          simpleProductsQuantity[`${DataI.product_id._id}__${regionID}`][3] += totalQty;
                        }

                        var SimpleData = DataI.product_id.simpleData;
                        if (SimpleData.length > 0) {
                          for (var j = 0; j < SimpleData.length; j++) {
                            var SimpleDataIPackage = SimpleData[j].package;
                            for (var k = 0; k < SimpleDataIPackage.length; k++) {
                              var packageDataI = SimpleDataIPackage[k];
                              if (JSON.stringify(DataI.productItemId) == JSON.stringify(packageDataI._id)) {
                                SimpleItemPush = packageDataI;
                              }
                            }
                          }
                        }
                      } else if (DataI.TypeOfProduct == "group") {
                        // console.log("::::::::::::::::::::::::::::", DataI.groupData);
                        try {
                          for (let j = 0; j < DataI.groupData.length; j++) {
                            let set = DataI.groupData[j];
                            for (let k = 0; k < set.sets.length; k++) {
                              let product = set.sets[k].product;

                              let [productData1] = await ProductData.aggregate([
                                {
                                  $match: {
                                    _id: mongoose.Types.ObjectId(product._id),
                                    "simpleData.region": mongoose.Types.ObjectId(regionID),
                                  },
                                },
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
                                                {
                                                  $eq: ["$product_id", "$$product_id"],
                                                },
                                                {
                                                  $eq: ["$region", mongoose.Types.ObjectId(regionID)],
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
                                            lostQuantity: {
                                              $sum: "$lostQuantity",
                                            },
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
                                ],
                                // For Populating other keys
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
                                ],
                                {
                                  $project: {
                                    product_name: 1,
                                    unitMeasurement: 1,
                                    preOrderRemainQty: 1,
                                    preOrder: 1,
                                    availableQuantity: 1,
                                  },
                                },
                              ]);

                              var availQty = productData1.availableQuantity;
                              var totalQty =
                                (set.sets[k].package ? set.sets[k].package.packet_size : set.sets[k].unitQuantity) * set.sets[k].qty * DataI.qty;
                              console.log("totalQty = ", totalQty, " and availQty = ", availQty);

                              if (!simpleProductsQuantity[`${productData1._id}__${regionID}`]) {
                                simpleProductsQuantity[`${productData1._id}__${regionID}`] = [
                                  productData1.product_name,
                                  regionID,
                                  availQty,
                                  totalQty,
                                  productData1.unitMeasurement,
                                ];
                              } else {
                                simpleProductsQuantity[`${productData1._id}__${regionID}`][2] = availQty;
                                simpleProductsQuantity[`${productData1._id}__${regionID}`][3] += totalQty;
                              }
                            }
                          }
                          // console.log("========================= 2");
                        } catch (err) {
                          errorLogger.error(err, "\n", "\n");
                          console.log("err::::::", err);
                        }
                      }

                      var ProducImages = DataI.product_id.images;
                      var ProducImagesArray = [];
                      if (ProducImages != null) {
                        for (var i1 = 0; i1 < ProducImages.length; i1++) {
                          ProducImagesArray.push(ProducImages[i1].image);
                        }
                      }

                      if (state.toLocaleLowerCase().includes("delhi")) {
                        var salesTaxWithIn = DataI.product_id.salesTaxWithIn;
                        var salesTaxOutSide = null;
                      } else {
                        var salesTaxWithIn = null;
                        var salesTaxOutSide = DataI.product_id.salesTaxOutSide;
                      }

                      if (getCoupon) {
                        var couponId = getCoupon._id;
                        var couponApplied = true;
                        var coupon_value = getCoupon.couponValue;
                        var coupon_code = getCoupon.coupon_code;
                        var discountType = getCoupon.discountType;
                        var discountAmount = getCoupon.discountAmount;
                        var discountLocation = getCoupon.discountLocation;
                        var discountPercentage = getCoupon.discountPercentage;
                        var discount_upto = getCoupon.discount_upto;
                        var discountProduct = getCoupon.discountProduct;
                        var discountProductPackageId = getCoupon.discountProductPackageId;

                        var itemDiscountPercentage = 0;
                        var itemDiscountAmount = 0;
                        var totalCartPrice = getDetail.totalCartPrice;
                        if (discountPercentage) {
                          // itemDiscountPercentage =  (discountPercentage/totalCartPrice)*100
                          itemDiscountPercentage = +discountPercentage;
                          itemDiscountAmount = +(itemDiscountPercentage * DataI.totalprice) / 100;
                        }
                        if (discountAmount) {
                          itemDiscountPercentage = +(discountAmount / totalCartPrice) * 100;
                          itemDiscountAmount = +(itemDiscountPercentage * DataI.totalprice) / 100;
                        }
                      }

                      CartDetailArray.push({
                        _id: DataI._id,
                        product_id: DataI.product_id,
                        product_name: DataI.product_id.product_name,
                        product_longDesc: DataI.product_id.longDesc,
                        product_shortDesc: DataI.product_id.shortDesc,
                        product_SKUCode: DataI.product_id.SKUCode,
                        product_images: ProducImagesArray,
                        // product_cat_name: category_name,
                        // product_subCat1_name: product_subCat1_name,
                        product_categories: DataI.product_id.product_categories,
                        productItemId: DataI.productItemId,
                        salesTaxWithIn: salesTaxWithIn,
                        salesTaxOutSide: salesTaxOutSide,
                        TypeOfProduct: DataI.TypeOfProduct,
                        variant_name: DataI.variant_name || null,
                        price: DataI.price,
                        qty: DataI.qty,
                        totalprice: DataI.totalprice,
                        unitQuantity: DataI.unitQuantity,
                        unitMeasurement: DataI.unitMeasurement,
                        without_package: DataI.without_package,
                        packet_size: DataI.packet_size,
                        packetLabel: DataI.packetLabel,
                        itemDiscountPercentage: DataI.itemDiscountPercentage,
                        itemDiscountAmount: +DataI.itemDiscountAmount,
                        createDate: DataI.createDate,
                        status: DataI.status,
                        simpleItem: SimpleItemPush,
                        ConfigItem: ConfigItemPush,
                        groupData: DataI.groupData,
                      });
                    }

                    let allErrors = [];
                    for (const key in simpleProductsQuantity) {
                      if (Object.hasOwnProperty.call(simpleProductsQuantity, key)) {
                        const element = simpleProductsQuantity[key];
                        if (element[2] < element[3]) {
                          allErrors.push(` ${element[0]} more than ${element[2]} ${element[4].name}`);
                        }
                      }
                    }

                    for (const key in configProductsQuantity) {
                      if (Object.hasOwnProperty.call(configProductsQuantity, key)) {
                        const element = configProductsQuantity[key];
                        if (element[2] < element[3]) {
                          allErrors.push(` ${element[0]} more than ${element[2]} ${element[4].name}`);
                        }
                      }
                    }

                    if (allErrors.length > 0) {
                      if (createDbDoc === true && paymentmethod != "Razorpay") {
                        return res.status(400).json({
                          status: "error",
                          allErrors,
                          msg: "",
                        });
                      }
                    }

                    var booking_address = {
                      address: address,
                      country: country,
                      state: state,
                      city: city,
                      pincode: pincode,
                      locality: locality,
                      latitude: latitude,
                      longitude: longitude,
                      locationTag: locationTag,
                      houseNo: houseNo,
                    };
                    var giftingAddress = req.body.giftingAddress;

                    if (getCoupon) {
                      var couponId = getCoupon._id;
                      var couponApplied = true;
                      var coupon_value = getCoupon.couponValue;
                      var coupon_code = getCoupon.coupon_code;
                      var discountType = getCoupon.discountType;
                      var discountAmount = getCoupon.discountAmount;
                      var discountPercentage = getCoupon.discountPercentage;
                      var discount_upto = getCoupon.discount_upto;
                      var discountProduct = getCoupon.discountProduct;
                      var discountProductPackageId = getCoupon.discountProductPackageId;
                    } else {
                      var couponId = null;
                      var coupon_value = null;
                      var couponApplied = false;
                      var coupon_code = null;
                      var discountType = null;
                      var discountAmount = null;
                      var discountPercentage = null;
                      var discount_upto = null;
                      var discountProduct = null;
                      var discountProductPackageId = null;
                    }

                    let billingCompany = await Company.findOne({
                      isDefault: true,
                    }).lean();

                    // console.log("before 0000000000000000");
                    // make sure that data coming from cart and data from checkout page is same (if same account on two devices)
                    {
                      let errorPresent = 0;
                      let tp = 0;
                      CartDetailArray.forEach((item1) => {
                        //console.log("item1item1item1item1item1item1item1item1", item1);
                        tp += item1.totalprice;

                        let itemMatched = false;
                        itemWiseData.forEach((item2) => {
                          // console.log(item1.product_id._id.toString(), "==", item2._id, item1.product_id._id.toString() == item2._id);
                          // console.log(item1.packet_size, "==hhh", item2.packet_size, item1.packet_size == item2.packet_size);
                          if (item1.product_id._id.toString() == item2._id && item1.packet_size == item2.packet_size) {
                            // console.log("..............inside if...............");
                            itemMatched = true;
                          }
                        });
                        // console.log(".............................", itemMatched);
                        if (!itemMatched) {
                          // console.log("hereeeeeeeeeee");
                          errorPresent = 1;
                        }
                      });
                      // console.log("inside 1", tp);
                      if (req.body.totalCartPrice != tp) {
                        // console.log("wahan");
                        errorPresent = 2;
                      }

                      if (CartDetailArray.length != itemWiseData.length) {
                        // console.log("yahan");
                        errorPresent = 3;
                      }

                      if (errorPresent) {
                        // console.log("8888888");
                        return res.status(500).json({
                          allErrors: [],
                          errorPresent:errorPresent,
                          status: "error",
                          msg: "Your cart has been modified on another device you may have previously logged on to. Please check your cart once before you proceed.",
                        });
                      }

                      // let pre_order1 = false;
                      // itemWiseData.forEach((item2) => {
                      //   if (item2.preOrder) {
                      //     pre_order1 = true;
                      //   }
                      // });
                      // console.log("inside 2");
                      // if (pre_order1 != req.body.preOrder) {
                      //   res.status(500).json({
                      //     status: "error",
                      //     error: "Cart Modified!",
                      //     code: 3,
                      //   });
                      //
                      // }
                    }
                    // console.log("after 0000000000000000");

                    // add itemwisedata to bookingDetail

                    CartDetailArray.forEach((item1) => {
                      itemWiseData.forEach((item2) => {
                        // console.log(
                        //   "***********************************************************************88",
                        //   JSON.stringify(item1),
                        //   "***********************************************************************88",
                        //   JSON.stringify(item2)
                        // );

                        if (item1.product_id._id.toString() == item2._id && item1.packet_size == item2.packet_size) {
                          item1.preOrderStartDate = item2.preOrderStartDate;
                          item1.preOrderEndDate = item2.preOrderEndDate;
                          item1.itemDiscountAmount = item2.itemDiscountAmount;
                          item1.totalPriceBeforeGST = item2.totalPriceBeforeGST;
                          item1.totalPriceAfterGST = item2.totalPriceAfterGST
                            ? item2.totalPriceAfterGST
                            : +item2.totalPriceBeforeGST + +item2.itemWiseGst;
                          item1.itemDiscountAmountBeforeGST = item2.itemDiscountAmountBeforeGST;
                          item1.itemWiseGst = item2.itemWiseGst;
                        }
                      });
                    });

                    // console.log("CartDetailArray ::::::::::::::::::::", 000000000, CartDetailArray);
                    // return;
                    var jsonData = {
                      //BookingStatusByAdmin:'Failed',
                      user_id: user_id,
                      userName: getUser.name,
                      userEmail: getUser.email,
                      userMobile: getUser.contactNumber,
                      userType: getUser.user_type,
                      userData: getUser,
                      addToCartID: addToCartID,
                      regionName: regionName,
                      regionID: getDetail.regionID,
                      razorpay_payment_id: payment_id,
                      bookingMode: bookingMode,
                      booking_code: ORDER_ID,
                      // invoiceNO: invoiceNO,
                      paymentmethod: paymentmethod,
                      TXNID: req.body.TXNID || null,
                      razorpay_orderid: req.body.razorpay_orderid || null,
                      payment: req.body.payment || "Failed",

                      cod: cod,
                      total_payment: total_payment,
                      redeem_point: redeem,
                      redeemDiscount: redeemDiscount,
                      referralDiscount: referralDiscount,
                      booking_address: booking_address,
                      otheraddress: otheraddress,
                      bookingdetail: CartDetailArray,
                      couponId: couponId,
                      totalCouponDiscountAmount: totalCouponDiscountAmount,
                      coupon_value: coupon_value,
                      couponApplied: couponApplied,
                      coupon_code: coupon_code,
                      discountType: discountType,
                      discountAmount: totalCouponDiscountAmount ? totalCouponDiscountAmount : discountAmount,
                      discountLocation: discountLocation,
                      discountPercentage: discountPercentage,
                      discount_upto: discount_upto,
                      discountProduct: discountProduct,
                      discountProductPackageId: discountProductPackageId,
                      allGstLists: allGstLists,
                      // billingCompany: billingCompany._id,
                      gst: gst,
                      taxType: taxType,
                      totalCartPrice: getDetail.totalCartPrice,
                      totalCartPriceWithoutGST: +totalCartPriceWithoutGST,
                      codCharges: codCharges,
                      deliveryCharges: deliveryCharges,
                      giftingName: giftingName,
                      giftingContact: giftingContact,
                      giftingAddress: giftingAddress,
                      giftingNote: giftingNote,
                      giftingStatus: giftingStatus,
                      device_name: device_name,
                      delivery_instructions: delivery_instructions,
                      preOrder: preOrder,
                      deliverySlot: deliverySlot,
                      loyaltyProgram: program,
                    };
                    if (!createDbDoc && paymentmethod == "Razorpay") {
                      // var response = await instance.orders.create({
                      //   amount: +total_payment * 100,
                      //   currency: "INR",
                      //   receipt: "receipt#1",
                      //   notes: {
                      //     key1: "website order",
                      //     key2: booking_code,

                      //   },
                      // });
                      jsonData = { ...jsonData, payment: "Failed", BookingStatusByAdmin: "Failed" };
                      bookingDataBase.create(jsonData, async function (err, insertedData) {
                        if (err) {
                          errorLogger.error(err, "\n", "\n");
                          console.log(err, "88888888888899999999999999999");
                          return res.status(500).json({
                            allErrors: [],
                            status: "error",
                            msg: "Something Went Wrong! Please try agian after sometime.",
                          });
                        } else {
                          var d = new Date();
                          var year = d.getFullYear();
                          var date = d.getDate();

                          let booking_code1 = "KC" + (insertedData.counter < 10 ? "0" + insertedData.counter : insertedData.counter);
                          const paymentdata = await payment_table.find();
                          const rozarpay_patment_rediantials = paymentdata.filter((curdata) => curdata.name == "Razorpay");
                          var instance = new Razorpay({
                            key_id: rozarpay_patment_rediantials[0].keys.keyid,
                            key_secret: rozarpay_patment_rediantials[0].keys.secretid,
                          });
                          var response = await instance.orders.create({
                            amount: +total_payment * 100,
                            currency: "INR",
                            receipt: "receipt#1",
                            notes: {
                              key1: "website order",
                              key2: booking_code1,
                            },
                          });
                          let updated = await bookingDataBase.updateOne(
                            {
                              _id: insertedData._id,
                            },
                            {
                              booking_code: booking_code1,
                              razorpay_orderid: response.id,
                            }
                          );

                          if (getCoupon) {
                            if (getCoupon.discountProduct) {
                              var discountProduct = getCoupon.discountProduct;
                              var discountProductPackageId = getCoupon.discountProductPackageId;
                              //-start----------------free product send in database if coupon applied from frontend
                              products.findById(getCoupon.discountProduct).exec(function (err, FreeProduct) {
                                if (err) {
                                  errorLogger.error(err, "\n", "\n");
                                  console.log("77777777777777", err);
                                  return res.status(500).json({
                                    allErrors: [],
                                    status: "error",
                                    msg: "Something Went Wrong! Please try agian after sometime.",
                                  });
                                } else if (FreeProduct) {
                                  var ProducImages = FreeProduct.images;
                                  var ProducImagesArray = [];
                                  if (ProducImages != null) {
                                    for (var i = 0; i < ProducImages.length; i++) {
                                      ProducImagesArray.push(ProducImages[i].image);
                                    }
                                  }
                                  var SimpleItemPush = {};
                                  if (FreeProduct.TypeOfProduct == "simple") {
                                    if (FreeProduct.without_package == true) {
                                      TotalSimpleQtyWithOutPackage += DataI.unitQuantity * DataI.qty;
                                    } else {
                                      var SimpleData = FreeProduct.simpleData;
                                      for (var j = 0; j < SimpleData.length; j++) {
                                        var SimpleDataIPackage = SimpleData[j].package;
                                        for (var k = 0; k < SimpleDataIPackage.length; k++) {
                                          var packageDataI = SimpleDataIPackage[k];

                                          if (JSON.stringify(discountProductPackageId) == JSON.stringify(packageDataI._id)) {
                                            SimpleItemPush = {
                                              packet_size: packageDataI.packet_size,
                                              packetLabel: packageDataI.packetLabel,
                                              selling_price: 0,
                                              packetmrp: 0,
                                              free: true,
                                              _id: packageDataI._id,
                                            };

                                            TotalSimpleQty += DataI.packet_size * DataI.qty;
                                          }
                                        }
                                      }
                                    }
                                  }

                                  var freeProduct = {
                                    product_id: FreeProduct.product_id,
                                    product_name: FreeProduct.product_name,
                                    product_longDesc: FreeProduct.longDesc,
                                    product_shortDesc: FreeProduct.shortDesc,
                                    product_SKUCode: FreeProduct.SKUCode,
                                    product_images: ProducImagesArray,
                                    product_cat_id: FreeProduct.product_cat_id,
                                    product_subCat1_id: FreeProduct.product_subCat1_id,
                                    productItemId: discountProductPackageId,
                                    TypeOfProduct: FreeProduct.TypeOfProduct,
                                    packet_size: FreeProduct.packet_size,
                                    packetLabel: FreeProduct.packetLabel,
                                    price: FreeProduct.price,
                                    qty: FreeProduct.qty,
                                    unitQuantity: FreeProduct.unitQuantity,
                                    unitMeasurement: FreeProduct.unitMeasurement,
                                    without_package: FreeProduct.without_package,
                                    totalprice: 0,
                                    createDate: FreeProduct.createDate,
                                    status: FreeProduct.status,
                                    simpleItem: SimpleItemPush,
                                    free: true,
                                  };

                                  bookingDataBase.findOneAndUpdate(
                                    {
                                      _id: insertedData._id,
                                    },
                                    {
                                      $push: {
                                        bookingdetail: freeProduct,
                                      },
                                    },
                                    async function (err, data) {
                                      if (err) {
                                        errorLogger.error(err, "\n", "\n");
                                        console.log("68989999", err);
                                        return res.status(500).json({
                                          allErrors: [],
                                          status: "error",
                                          msg: "Something Went Wrong! Please try agian after sometime.",
                                        });
                                      } else {
                                        var TotalQtyN = TotalConfigQty + TotalSimpleQty + TotalSimpleQtyWithOutPackage;
                                        // var bookingID = insertedData._id;
                                        // common.reduceQtyFormproductAndInventory(bookingID, res);

                                        return res.status(200).json({
                                          status: "ok",
                                          result: insertedData.booking_code,
                                        });
                                      }
                                    }
                                  );
                                } else {
                                  // var bookingID = insertedData._id;
                                  // common.reduceQtyFormproductAndInventory(bookingID, res);
                                }
                              });
                              //-end----------------free product send in database if coupon applied from frontend
                            }
                          } else {
                            // var bookingID = insertedData._id;
                            // common.reduceQtyFormproductAndInventory(bookingID, res);
                          }

                          return res.status(200).json({
                            message: "ok",
                            data: "booking cretaed",
                            code: 1,
                            allErrors: [],
                            status: "ok",
                            response: response,
                            msg: `All checks passed`,
                          });
                        } // else close of bookingDataBase
                      });
                    } else {
                      bookingDataBase.create(jsonData, async function (err, insertedData) {
                        // console.log("insertedData", insertedData);
                        if (err) {
                          errorLogger.error(err, "\n", "\n");
                          console.log(err, "88888888888899999999999999999");
                          return res.status(500).json({
                            allErrors: [],
                            status: "error",
                            msg: "Something Went Wrong! Please try agian after sometime.",
                          });
                        } else {
                          // console.log("=======================================================================================", 111111111);
                          // update orderID
                          var booking_code = "KC" + (insertedData.counter < 10 ? "0" + insertedData.counter : insertedData.counter);
                          // console.log("3333333333333333%%%%%%%", booking_code);
                          var d = new Date();
                          var year = d.getFullYear();
                          var date = d.getDate();
                          // var invoiceNO =
                          //   insertedData.counter +
                          //   "/" +
                          //   `${new Date().getFullYear().toString()}-${(new Date().getFullYear() + 1)
                          //     .toString()
                          //     .slice(2)}`;
                          let updated = await bookingDataBase.update(
                            {
                              _id: insertedData._id,
                            },
                            {
                              booking_code,
                              // invoiceNO,
                            }
                          );

                          var userName = getUser.name;
                          var userEmail = getUser.email;
                          var userMobile = getUser.contactNumber;

                          //CartDetail:[]
                          // await addToCartDataBase.updateMany(
                          //   { _id: addToCartID },
                          //   {
                          //     redeem_point: 0,
                          //     totalCartPrice: 0,
                          //     CartDetail: [],
                          //   }
                          // );

                          if (getCoupon) {
                            if (getCoupon.discountProduct) {
                              var discountProduct = getCoupon.discountProduct;
                              var discountProductPackageId = getCoupon.discountProductPackageId;
                              //-start----------------free product send in database if coupon applied from frontend
                              products.findById(getCoupon.discountProduct).exec(function (err, FreeProduct) {
                                if (err) {
                                  errorLogger.error(err, "\n", "\n");
                                  console.log("77777777777777", err);
                                  return res.status(500).json({
                                    allErrors: [],
                                    status: "error",
                                    msg: "Something Went Wrong! Please try agian after sometime.",
                                  });
                                } else if (FreeProduct) {
                                  var ProducImages = FreeProduct.images;
                                  var ProducImagesArray = [];
                                  if (ProducImages != null) {
                                    for (var i = 0; i < ProducImages.length; i++) {
                                      ProducImagesArray.push(ProducImages[i].image);
                                    }
                                  }
                                  var SimpleItemPush = {};
                                  if (FreeProduct.TypeOfProduct == "simple") {
                                    if (FreeProduct.without_package == true) {
                                      TotalSimpleQtyWithOutPackage += DataI.unitQuantity * DataI.qty;
                                    } else {
                                      var SimpleData = FreeProduct.simpleData;
                                      for (var j = 0; j < SimpleData.length; j++) {
                                        var SimpleDataIPackage = SimpleData[j].package;
                                        for (var k = 0; k < SimpleDataIPackage.length; k++) {
                                          var packageDataI = SimpleDataIPackage[k];

                                          if (JSON.stringify(discountProductPackageId) == JSON.stringify(packageDataI._id)) {
                                            SimpleItemPush = {
                                              packet_size: packageDataI.packet_size,
                                              packetLabel: packageDataI.packetLabel,
                                              selling_price: 0,
                                              packetmrp: 0,
                                              free: true,
                                              _id: packageDataI._id,
                                            };

                                            TotalSimpleQty += DataI.packet_size * DataI.qty;
                                          }
                                        }
                                      }
                                    }
                                  }

                                  var freeProduct = {
                                    product_id: FreeProduct.product_id,
                                    product_name: FreeProduct.product_name,
                                    product_longDesc: FreeProduct.longDesc,
                                    product_shortDesc: FreeProduct.shortDesc,
                                    product_SKUCode: FreeProduct.SKUCode,
                                    product_images: ProducImagesArray,
                                    product_cat_id: FreeProduct.product_cat_id,
                                    product_subCat1_id: FreeProduct.product_subCat1_id,
                                    productItemId: discountProductPackageId,
                                    TypeOfProduct: FreeProduct.TypeOfProduct,
                                    packet_size: FreeProduct.packet_size,
                                    packetLabel: FreeProduct.packetLabel,
                                    price: FreeProduct.price,
                                    qty: FreeProduct.qty,
                                    unitQuantity: FreeProduct.unitQuantity,
                                    unitMeasurement: FreeProduct.unitMeasurement,
                                    without_package: FreeProduct.without_package,
                                    totalprice: 0,
                                    createDate: FreeProduct.createDate,
                                    status: FreeProduct.status,
                                    simpleItem: SimpleItemPush,
                                    free: true,
                                  };

                                  bookingDataBase.findOneAndUpdate(
                                    {
                                      _id: insertedData._id,
                                    },
                                    {
                                      $push: {
                                        bookingdetail: freeProduct,
                                      },
                                    },
                                    async function (err, data) {
                                      if (err) {
                                        errorLogger.error(err, "\n", "\n");
                                        console.log("68989999", err);
                                        return res.status(500).json({
                                          allErrors: [],
                                          status: "error",
                                          msg: "Something Went Wrong! Please try agian after sometime.",
                                        });
                                      } else {
                                        var TotalQtyN = TotalConfigQty + TotalSimpleQty + TotalSimpleQtyWithOutPackage;
                                        // var bookingID = insertedData._id;
                                        // common.reduceQtyFormproductAndInventory(bookingID, res);

                                        return res.status(200).json({
                                          status: "ok",
                                          result: insertedData.booking_code,
                                        });
                                      }
                                    }
                                  );
                                } else {
                                  // var bookingID = insertedData._id;
                                  // common.reduceQtyFormproductAndInventory(bookingID, res);

                                  res.status(200).json({
                                    message: "ok",
                                    data: insertedData.booking_code,
                                    code: 1,
                                  });
                                }
                              });
                              //-end----------------free product send in database if coupon applied from frontend
                            } else {
                              // var bookingID = insertedData._id;
                              // common.reduceQtyFormproductAndInventory(bookingID, res);
                            }
                          } else {
                            // var bookingID = insertedData._id;
                            // common.reduceQtyFormproductAndInventory(bookingID, res);
                          }
                          var orderDetails = {
                            name: insertedData.userName,
                            booking_code: booking_code,
                            createDate: insertedData.createDate,
                            BookingStatusByAdmin: insertedData.BookingStatusByAdmin,
                            products: insertedData.bookingdetail,
                            address: insertedData.booking_address.locality,
                            paymentMethod: insertedData.paymentmethod,
                            paymentStatus: paymentmethod.toLocaleLowerCase() == "wallet" ? "Complete" : insertedData.payment,
                            gst: insertedData.gst ? insertedData.gst : 0,
                            allGstLists: insertedData.allGstLists,
                            taxType: insertedData.taxType,
                            totalCartPrice: insertedData.totalCartPriceWithoutGST ? insertedData.totalCartPriceWithoutGST : 0,
                            deliveryCharges: insertedData.deliveryCharges ? insertedData.deliveryCharges : 0,
                            adminDiscount: insertedData.adminDiscount ? insertedData.adminDiscount : 0,
                            discountAmount: insertedData.discountAmount ? insertedData.discountAmount : 0,
                            redeemDiscount: insertedData.redeemDiscount ? insertedData.redeemDiscount : 0,
                            referralDiscount: insertedData.referralDiscount ? insertedData.referralDiscount : 0,
                            codCharges: insertedData.codCharges ? insertedData.codCharges : 0,
                            total_payment: insertedData.total_payment ? insertedData.total_payment : 0,
                            deliverySlot: insertedData.deliverySlot ? insertedData.deliverySlot : null,
                          };

                          var ProductDetail = await common.OrderDetails(orderDetails);
                          if (paymentmethod == "Paytm") {
                            if (req.body.device_name === "mobile") {
                              var CHANNEL_ID = "WAP";
                            } else {
                              var CHANNEL_ID = "WEB";
                            }
                            var paymentDetails = {
                              amount: String(total_payment),
                              customerId: user_id,
                              customerEmail: getUser.email,
                              customerPhone: String(getUser.contactNumber),
                              ORDER_ID: booking_code,
                              CHANNEL_ID: CHANNEL_ID,
                            };
                            // var paymentDetails = {
                            //   amount: '1000',
                            //   customerId: user_id,
                            //   customerEmail: getUser.email,
                            //   customerPhone: '8802401227',
                            //   ORDER_ID: booking_code,
                            //   CHANNEL_ID: "WAP",
                            // };
                            // console.log(paymentDetails, "booking file");
                            common.bookingPayNow(paymentDetails, res);
                          } else if (paymentmethod.toLocaleLowerCase() == "wallet") {
                            // console.log("-------------------------------------- 1");
                            await User.findOneAndUpdate(
                              {
                                _id: user_id,
                              },
                              {
                                $inc: {
                                  walletAmount: -+total_payment,
                                },
                              }
                            );
                            // console.log("-------------------------------------- 2");
                            var walletHistory = {
                              user_id,
                              amount: +total_payment,
                              type: "debit",
                              paymentStatus: "Complete",
                              debitType: "order",
                              orderID: insertedData._id,
                              booking_code: booking_code,
                            };
                            // console.log("-------------------------------------- 2");
                            WalletHistories.create(walletHistory, async (err, doc) => {
                              if (err) {
                                errorLogger.error(err, "\n", "\n");
                                console.log("wwwwwwwwwwwwwwwww", err);
                                return res.status(500).json({
                                  allErrors: [],
                                  status: "error",
                                  msg: "Something Went Wrong! Please try agian after sometime.",
                                });
                              } else {
                                // console.log("-------------------------------------- 3");

                                var bookingID = insertedData._id;
                                await bookingDataBase.update(
                                  {
                                    _id: insertedData._id,
                                  },
                                  {
                                    payment: "Complete",
                                  }
                                );

                                await common.reduceQtyFormproductAndInventory(bookingID);
                                await common.processLoyaltyAndRefferal(
                                  booking_code,
                                  getSettings?.loyalityProgramOnOff,
                                  getSettings?.refferalPointsOnOff
                                );
                                await addToCartDataBase.findOneAndUpdate(
                                  { user_id: user_id },
                                  {
                                    $set: {
                                      user_id: user_id,
                                      totalCartPrice: 0,
                                      CartDetail: [],
                                    },
                                  }
                                );

                                orderDetails.paymentStatus = "Complete";
                                var email = userEmail;
                                var name = getUser.name;
                                var subject = "Order Placed Successfully!";
                                var message = "Thank you for placing your order with Krishi Cress. Please find your order details below.";

                                var data = booking_code;
                                var mobile = getUser.contactNumber;
                                var mobileMsg = `Thank you for ordering at Krishi Cress. Your order ${data} has been placed. Questions? Get in touch with us +919667066462 or email us.`;

                                var mobile = getUser.contactNumber;

                                if (notifs?.order_placed.sms) {
                                  common.sendOtp(mobile, mobileMsg);
                                }

                                if (notifs?.order_placed.user_email) {
                                  var keys = {
                                    userName: common.toTitleCase(name),
                                    userMobile: mobile,
                                    OrderDetail: ProductDetail,
                                    type: "user",
                                    template_name: "order place mail to user",
                                    userEmail: email,
                                  };
                                  common.dynamicEmail(keys);
                                  //common.sendMail(email, subject, name, message,data,orderDetails);
                                }

                                let users = await Admin.find(
                                  {
                                    user_role: {
                                      $in: notifs?.order_placed.admin_roles,
                                    },
                                  },
                                  { username: 1, email: 1 }
                                ).lean();

                                var message1 = `An order has been placed successfully. Please find order details below.
                                        <p><strong>Name: </strong>${common.toTitleCase(name)}</p>
                                        <p style="margin-top: -10px;"><strong>Mobile: </strong>${getUser.contactNumber}</p>
                                        <p style="margin-top: -10px;"><strong>Email: </strong>${email}</p>`;

                                if (notifs?.order_placed.admin_email) {
                                  users.forEach((user) => {
                                    var keys = {
                                      userName: common.toTitleCase(name),
                                      userMobile: getUser.contactNumber,
                                      userEmail: email,
                                      OrderDetail: ProductDetail,
                                      type: "admin",
                                      template_name: "order place mail to admin",
                                      adminEmail: user.email,
                                      adminName: user.username,
                                    };
                                    common.dynamicEmail(keys);
                                  });
                                }

                                return res.status(200).json({
                                  message: "ok",
                                  data: booking_code,
                                  code: 1,
                                });
                              }
                            });
                          } else {
                            // console.log("---------------------------- 333333");
                            if (paymentmethod === "Credit") {
                              await User.updateOne({ _id: user_id }, { $inc: { creditUsed: +total_payment } });
                            }

                            var email = userEmail;
                            var name = getUser.name;
                            var subject = "Order Placed Successfully!";
                            var message = "Thank You for placing your order with Krishi Cress. Please find your order details below.";

                            var data = booking_code;
                            var mobile = getUser.contactNumber;
                            var mobileMsg = `Thank you for ordering at Krishi Cress. Your order ${data} has been placed. Questions? Get in touch with us +919667066462 or email us.`;

                            var mobile = getUser.contactNumber;

                            if (notifs?.order_placed.sms) {
                              common.sendOtp(mobile, mobileMsg);
                            }

                            if (notifs?.order_placed.user_email) {
                              var keys = {
                                userName: common.toTitleCase(name),
                                userMobile: mobile,
                                OrderDetail: ProductDetail,
                                type: "user",
                                template_name: "order place mail to user",
                                userEmail: email,
                              };
                              common.dynamicEmail(keys);
                            }

                            let users = await Admin.find(
                              {
                                user_role: {
                                  $in: notifs?.order_placed.admin_roles,
                                },
                              },
                              { username: 1, email: 1 }
                            ).lean();

                            var message1 = `An order has been placed successfully. Please find order details below.
                              <p><strong>Name: </strong>${common.toTitleCase(name)}</p>
                              <p style="margin-top: -10px;"><strong>Mobile: </strong>${getUser.contactNumber}</p>
                              <p style="margin-top: -10px;"><strong>Email: </strong>${email}</p>`;

                            if (notifs?.order_placed.admin_email) {
                              users.forEach((user) => {
                                var keys = {
                                  userName: common.toTitleCase(name),
                                  userMobile: getUser.contactNumber,
                                  userEmail: email,
                                  OrderDetail: ProductDetail,
                                  type: "admin",
                                  template_name: "order place mail to admin",
                                  adminEmail: user.email,
                                  adminName: user.username,
                                };
                                common.dynamicEmail(keys);
                              });
                            }

                            var bookingID = insertedData._id;
                            await common.reduceQtyFormproductAndInventory(bookingID);
                            await common.processLoyaltyAndRefferal(booking_code, getSettings?.loyalityProgramOnOff, getSettings?.refferalPointsOnOff);
                            await addToCartDataBase.findOneAndUpdate(
                              { user_id: user_id },
                              {
                                $set: {
                                  user_id: user_id,
                                  totalCartPrice: 0,
                                  CartDetail: [],
                                },
                              }
                            );

                            return res.status(200).json({
                              message: "ok",
                              data: booking_code,
                              code: 1,
                            });
                          }
                        } // else close of bookingDataBase
                      });
                    }
                  } // addToCartDataBase.findOne else close
                }
              );
            } //else close
          } catch (err) {
            errorLogger.error(err, "\n", "\n");
            console.log(" see error here ==========>>>>>>>>>>>> ", err);
          }
        });
    });
};
var razorpay_payment_cron = cron.schedule("*/10 * * * *", () => {
  try {
    async function get_orders() {
      const paymentdata = await payment_table.find();
      const rozarpay_patment_rediantials = paymentdata.filter((curdata) => curdata.name == "Razorpay");
      var instance = new Razorpay({
        key_id: rozarpay_patment_rediantials[0].keys.keyid,
        key_secret: rozarpay_patment_rediantials[0].keys.secretid,
      });
      const is_subscription = await Subscription.find({ paymentmethod: "Razorpay", BookingStatusByAdmin: "Failed" }).lean();
      if (!is_subscription.length == 0) {
        for (let j of is_subscription) {
          try {
            var failed_subscription_responce = await instance.orders.fetchPayments(j.razorpay_orderid);

            if (failed_subscription_responce?.count > 0) {
              for (let n of failed_subscription_responce?.items) {
                if (n.status == "captured") {
                  await Subscription.findOneAndUpdate(
                    { razorpay_orderid: j.razorpay_orderid },
                    { $set: { payment: "Complete", BookingStatusByAdmin: "Pending" } }
                  );
                  var sub = await Subscription.findOne({ razorpay_orderid: j.razorpay_orderid }).lean();
                  const user_id = sub.user_id;
                  const userData = await User.findOne({ _id: user_id }).lean();
                  let notifs = await OnOffDataBase.findOne({}).lean();
                  if (sub.preOrder === true) {
                    var subPrimeryID = sub._id;
                    await common.reducePreOrderQtyFormproductAndInventory(subPrimeryID);
                  } else {
                    var abc = "to you on the following days";
                    var adminAbc = "on the following days";
                  }

                  var orderDetails = {
                    name: sub.userName,
                    SubscriptionID: sub?.SubscriptionID,
                    createDate: sub.createDate,
                    BookingStatusByAdmin: sub.BookingStatusByAdmin,
                    products: sub.bookingdetail,
                    address: sub.booking_address.address + ", " + sub.booking_address.locality + ", " + sub.booking_address.city,
                    paymentMethod: sub.paymentmethod,
                    paymentStatus: sub.payment,
                    gst: sub.gst ? sub.gst : 0,
                    allGstLists: sub.allGstLists,
                    totalCartPrice: sub.totalCartPriceWithoutGST ? sub.totalCartPriceWithoutGST : 0,
                    deliveryCharges: sub.deliveryCharges ? sub.deliveryCharges : 0,
                    adminDiscount: sub.adminDiscount ? sub.adminDiscount : 0,
                    discountAmount: sub.discountAmount ? sub.discountAmount : 0,
                    redeemDiscount: sub.redeemDiscount ? sub.redeemDiscount : 0,
                    referralDiscount: sub.referralDiscount ? sub.referralDiscount : 0,
                    codCharges: sub.codCharges ? sub.codCharges : 0,
                    total_payment: sub.total_payment ? sub.total_payment : 0,
                    dates: sub.dates,
                    preOrder: sub.preOrder,
                    deliverySlot: sub.deliverySlot,
                  };
                  var email = userData.email;
                  var name = userData.name;
                  var data = sub?.SubscriptionID;
                  var subscriptionDates = orderDetails.dates;
                  var subscriptionDatesarray = [];
                  for (var i = 0; i < subscriptionDates.length; i++) {
                    var date = subscriptionDates[i].date;
                    var date1 = date.toDateString();
                    subscriptionDatesarray.push(" " + date1);
                  }
                  var ProductDetail = await common.OrderDetails(orderDetails);
                  if (notifs?.subscription_placed.user_email) {
                    var keys = {
                      userName: common.toTitleCase(name),
                      userMobile: userData.contactNumber,
                      subscriptionDates: subscriptionDatesarray,
                      ProductDetail: ProductDetail,
                      type: "user",
                      template_name: "subscription place mail to user",
                      userEmail: email,
                    };
                    common.dynamicEmail(keys);
                  }

                  let users = await Admin.find({ user_role: { $in: notifs?.subscription_placed.admin_roles } }, { username: 1, email: 1 }).lean();

                  if (notifs?.subscription_placed.admin_email) {
                    users.forEach((user) => {
                      var keys = {
                        userName: common.toTitleCase(name),
                        userMobile: userData.contactNumber,
                        userEmail: email,
                        subscriptionDates: subscriptionDatesarray,
                        ProductDetail: ProductDetail,
                        type: "admin",
                        template_name: "subscription place mail to admin",
                        adminEmail: user.email,
                        adminName: user.username,
                      };
                      common.dynamicEmail(keys);
                    });
                  }
                } else if (n.status == "failed") {
                  await Subscription.findOneAndUpdate({ razorpay_orderid: j.razorpay_orderid }, { $set: { RESPMSG: n.error_description } });
                }
              }
            } else if (failed_subscription_responce?.count == 0) {
              await Subscription.findOneAndUpdate(
                { razorpay_orderid: j.razorpay_orderid },
                { $set: { RESPMSG: "User exit before proceed to payment." } }
              );
            }
          } catch (error) {}
        }
      }
      const failed_orders = await bookingDataBase.find({ paymentmethod: "Razorpay", BookingStatusByAdmin: "Failed" });
      if (!failed_orders.length == 0) {
        for (let i of failed_orders) {
          try {
            var failed_order_payment_responce = await instance.orders.fetchPayments(i.razorpay_orderid);
            // console.log(
            //   failed_order_payment_responce,
            //   "i.razorpay_orderidi.razorpay_orderidi.razorpay_orderidi.razorpay_orderid",
            //   i.razorpay_orderid
            // );
            if (failed_order_payment_responce?.count > 0) {
              for (let p of failed_order_payment_responce?.items) {
                if (p.status == "captured") {
                  await bookingDataBase.findOneAndUpdate(
                    { razorpay_orderid: i.razorpay_orderid },
                    { $set: { payment: "Complete", BookingStatusByAdmin: "Pending" } }
                  );
                  // console.log(req.body);
                  var insertedData = await bookingDataBase.findOne({ razorpay_orderid: i.razorpay_orderid }).lean();
                  let notifs = await OnOffDataBase.findOne({}).lean();
                  var getSettings = await settingsModel.findOne({}).lean();

                  var orderDetails = {
                    name: insertedData.userName,
                    booking_code: insertedData.booking_code,
                    createDate: insertedData.createDate,
                    BookingStatusByAdmin: insertedData.BookingStatusByAdmin,
                    products: insertedData.bookingdetail,
                    address: insertedData.booking_address.locality,
                    paymentMethod: insertedData.paymentmethod,
                    paymentStatus: "Complete",
                    gst: insertedData.gst ? insertedData.gst : 0,
                    allGstLists: insertedData.allGstLists,
                    taxType: insertedData.taxType,
                    totalCartPrice: insertedData.totalCartPriceWithoutGST ? insertedData.totalCartPriceWithoutGST : 0,
                    deliveryCharges: insertedData.deliveryCharges ? insertedData.deliveryCharges : 0,
                    adminDiscount: insertedData.adminDiscount ? insertedData.adminDiscount : 0,
                    discountAmount: insertedData.discountAmount ? insertedData.discountAmount : 0,
                    redeemDiscount: insertedData.redeemDiscount ? insertedData.redeemDiscount : 0,
                    referralDiscount: insertedData.referralDiscount ? insertedData.referralDiscount : 0,
                    codCharges: insertedData.codCharges ? insertedData.codCharges : 0,
                    total_payment: insertedData.total_payment ? insertedData.total_payment : 0,
                    deliverySlot: insertedData.deliverySlot ? insertedData.deliverySlot : null,
                  };

                  var ProductDetail = await common.OrderDetails(orderDetails);

                  const user_id = insertedData.user_id;
                  const getUser = await User.findOne({ _id: user_id }).lean();
                  var email = insertedData.userData.email;
                  var name = insertedData.userData.name;
                  var subject = "Order Placed Successfully!";
                  var message = "Thank You for placing your order with Krishi Cress. Please find your order details below.";

                  var data = insertedData.booking_code;
                  var mobile = getUser.contactNumber;
                  var mobileMsg = `Thank you for ordering at Krishi Cress. Your order ${data} has been placed. Questions? Get in touch with us +919667066462 or email us.`;

                  //var mobile = getUser.contactNumber;

                  if (notifs?.order_placed.sms) {
                    common.sendOtp(mobile, mobileMsg);
                  }

                  if (notifs?.order_placed.user_email) {
                    var keys = {
                      userName: common.toTitleCase(name),
                      userMobile: mobile,
                      OrderDetail: ProductDetail,
                      type: "user",
                      template_name: "order place mail to user",
                      userEmail: email,
                    };
                    common.dynamicEmail(keys);
                  }

                  let users = await Admin.find(
                    {
                      user_role: {
                        $in: notifs?.order_placed.admin_roles,
                      },
                    },
                    { username: 1, email: 1 }
                  ).lean();

                  var message1 = `An order has been placed successfully. Please find order details below.
      <p><strong>Name: </strong>${common.toTitleCase(name)}</p>
      <p style="margin-top: -10px;"><strong>Mobile: </strong>${getUser.contactNumber}</p>
      <p style="margin-top: -10px;"><strong>Email: </strong>${email}</p>`;

                  if (notifs?.order_placed.admin_email) {
                    users.forEach((user) => {
                      var keys = {
                        userName: common.toTitleCase(name),
                        userMobile: getUser.contactNumber,
                        userEmail: email,
                        OrderDetail: ProductDetail,
                        type: "admin",
                        template_name: "order place mail to admin",
                        adminEmail: user.email,
                        adminName: user.username,
                      };
                      common.dynamicEmail(keys);
                    });
                  }

                  var bookingID = insertedData._id;
                  await common.reduceQtyFormproductAndInventory(bookingID);
                  await common.processLoyaltyAndRefferal(
                    insertedData.booking_code,
                    getSettings?.loyalityProgramOnOff,
                    getSettings?.refferalPointsOnOff
                  );
                  await addToCartDataBase.findOneAndUpdate(
                    { user_id: user_id },
                    {
                      $set: {
                        user_id: user_id,
                        totalCartPrice: 0,
                        CartDetail: [],
                      },
                    }
                  );

                  return true;
                } else if (p.status == "failed") {
                  // console.log(p, "pppppppppppppppppppppppppppppppppppppppppppppppppp");
                  await bookingDataBase.findOneAndUpdate({ razorpay_orderid: i.razorpay_orderid }, { $set: { RESPMSG: p.error_description } });
                }
              }
            } else if (failed_order_payment_responce?.count == 0) {
              await bookingDataBase.findOneAndUpdate(
                { razorpay_orderid: i.razorpay_orderid },
                { $set: { RESPMSG: "User exit before proceed to payment." } }
              );
            }
          } catch (error) {
            // console.log(error, "errorerrorerrorerrorerrorerrorerrorerror");
          }
        }
      } else {
        return true;
      }
    }
    get_orders();
    console.log("Razorpay cron exected");
  } catch (error) {
    // console.log(error);
  }
});
razorpay_payment_cron.start();
module.exports.updateRazorpayPaymentStatus = async function (req, res) {
  var razorpay_orderid = req.body.razorpay_orderid;
  var payment = req.body.payment;
  const is_subscription = await Subscription.findOne({ razorpay_orderid: req.body.razorpay_orderid }).lean();
  if (is_subscription?.userName) {
    await Subscription.findOneAndUpdate({ razorpay_orderid: razorpay_orderid }, { $set: { payment: payment, BookingStatusByAdmin: "Pending" } });
    if (payment === "Complete") {
      var sub = await Subscription.findOne({ razorpay_orderid: req.body.razorpay_orderid }).lean();
      const user_id = req.decoded.ID;
      const userData = await User.findOne({ _id: user_id }).lean();
      let notifs = await OnOffDataBase.findOne({}).lean();
      if (sub.preOrder === true) {
        var subPrimeryID = sub._id;
        await common.reducePreOrderQtyFormproductAndInventory(subPrimeryID);
      } else {
        var abc = "to you on the following days";
        var adminAbc = "on the following days";
      }

      var orderDetails = {
        name: sub.userName,
        SubscriptionID: sub?.SubscriptionID,
        createDate: sub.createDate,
        BookingStatusByAdmin: sub.BookingStatusByAdmin,
        products: sub.bookingdetail,
        address: sub.booking_address.address + ", " + sub.booking_address.locality + ", " + sub.booking_address.city,
        paymentMethod: sub.paymentmethod,
        paymentStatus: sub.payment,
        gst: sub.gst ? sub.gst : 0,
        allGstLists: sub.allGstLists,
        totalCartPrice: sub.totalCartPriceWithoutGST ? sub.totalCartPriceWithoutGST : 0,
        deliveryCharges: sub.deliveryCharges ? sub.deliveryCharges : 0,
        adminDiscount: sub.adminDiscount ? sub.adminDiscount : 0,
        discountAmount: sub.discountAmount ? sub.discountAmount : 0,
        redeemDiscount: sub.redeemDiscount ? sub.redeemDiscount : 0,
        referralDiscount: sub.referralDiscount ? sub.referralDiscount : 0,
        codCharges: sub.codCharges ? sub.codCharges : 0,
        total_payment: sub.total_payment ? sub.total_payment : 0,
        dates: sub.dates,
        preOrder: sub.preOrder,
        deliverySlot: sub.deliverySlot,
      };
      var email = userData.email;
      var name = userData.name;
      var data = sub?.SubscriptionID;
      var subscriptionDates = orderDetails.dates;
      var subscriptionDatesarray = [];
      for (var i = 0; i < subscriptionDates.length; i++) {
        var date = subscriptionDates[i].date;
        var date1 = date.toDateString();
        subscriptionDatesarray.push(" " + date1);
      }
      var ProductDetail = await common.OrderDetails(orderDetails);
      if (notifs?.subscription_placed.user_email) {
        var keys = {
          userName: common.toTitleCase(name),
          userMobile: userData.contactNumber,
          subscriptionDates: subscriptionDatesarray,
          ProductDetail: ProductDetail,
          type: "user",
          template_name: "subscription place mail to user",
          userEmail: email,
        };
        common.dynamicEmail(keys);
      }

      let users = await Admin.find({ user_role: { $in: notifs?.subscription_placed.admin_roles } }, { username: 1, email: 1 }).lean();

      if (notifs?.subscription_placed.admin_email) {
        users.forEach((user) => {
          var keys = {
            userName: common.toTitleCase(name),
            userMobile: userData.contactNumber,
            userEmail: email,
            subscriptionDates: subscriptionDatesarray,
            ProductDetail: ProductDetail,
            type: "admin",
            template_name: "subscription place mail to admin",
            adminEmail: user.email,
            adminName: user.username,
          };
          common.dynamicEmail(keys);
        });
      }
    }
    return res.status(200).json({
      message: "ok",
      data: "subscription created",
      code: 1,
    });
  } else {
    var updatebooking = await bookingDataBase.findOneAndUpdate(
      { razorpay_orderid: razorpay_orderid },
      { $set: { payment: payment, BookingStatusByAdmin: "Pending" } }
    );
    // console.log(req.body);
    if (payment === "Complete") {
      var insertedData = await bookingDataBase.findOne({ razorpay_orderid: razorpay_orderid }).lean();
      let notifs = await OnOffDataBase.findOne({}).lean();
      var getSettings = await settingsModel.findOne({}).lean();

      var orderDetails = {
        name: insertedData.userName,
        booking_code: insertedData.booking_code,
        createDate: insertedData.createDate,
        BookingStatusByAdmin: insertedData.BookingStatusByAdmin,
        products: insertedData.bookingdetail,
        address: insertedData.booking_address.locality,
        paymentMethod: insertedData.paymentmethod,
        paymentStatus: "Complete",
        gst: insertedData.gst ? insertedData.gst : 0,
        allGstLists: insertedData.allGstLists,
        taxType: insertedData.taxType,
        totalCartPrice: insertedData.totalCartPriceWithoutGST ? insertedData.totalCartPriceWithoutGST : 0,
        deliveryCharges: insertedData.deliveryCharges ? insertedData.deliveryCharges : 0,
        adminDiscount: insertedData.adminDiscount ? insertedData.adminDiscount : 0,
        discountAmount: insertedData.discountAmount ? insertedData.discountAmount : 0,
        redeemDiscount: insertedData.redeemDiscount ? insertedData.redeemDiscount : 0,
        referralDiscount: insertedData.referralDiscount ? insertedData.referralDiscount : 0,
        codCharges: insertedData.codCharges ? insertedData.codCharges : 0,
        total_payment: insertedData.total_payment ? insertedData.total_payment : 0,
        deliverySlot: insertedData.deliverySlot ? insertedData.deliverySlot : null,
      };

      // var ProductDetail = await common.OrderDetails(orderDetails);

      const user_id = req.decoded.ID;
      const getUser = await User.findOne({ _id: user_id }).lean();
      var email = insertedData.userData.email;
      var name = insertedData.userData.name;
      var subject = "Order Placed Successfully!";
      var message = "Thank You for placing your order with Krishi Cress. Please find your order details below.";

      var data = insertedData.booking_code;
      var mobile = getUser.contactNumber;
      var mobileMsg = `Thank you for ordering at Krishi Cress. Your order ${data} has been placed. Questions? Get in touch with us +919667066462 or email us.`;

      //var mobile = getUser.contactNumber;

      if (notifs?.order_placed.sms) {
        common.sendOtp(mobile, mobileMsg);
      }

      // if (notifs?.order_placed.user_email) {
      //   var keys = {
      //     userName: common.toTitleCase(name),
      //     userMobile: mobile,
      //     OrderDetail: ProductDetail,
      //     type: "user",
      //     template_name: "order place mail to user",
      //     userEmail: email,
      //   };
      //   common.dynamicEmail(keys);
      // }

      let users = await Admin.find(
        {
          user_role: {
            $in: notifs?.order_placed.admin_roles,
          },
        },
        { username: 1, email: 1 }
      ).lean();

      var message1 = `An order has been placed successfully. Please find order details below.
      <p><strong>Name: </strong>${common.toTitleCase(name)}</p>
      <p style="margin-top: -10px;"><strong>Mobile: </strong>${getUser.contactNumber}</p>
      <p style="margin-top: -10px;"><strong>Email: </strong>${email}</p>`;

      // if (notifs?.order_placed.admin_email) {
      //   users.forEach((user) => {
      //     var keys = {
      //       userName: common.toTitleCase(name),
      //       userMobile: getUser.contactNumber,
      //       userEmail: email,
      //       OrderDetail: ProductDetail,
      //       type: "admin",
      //       template_name: "order place mail to admin",
      //       adminEmail: user.email,
      //       adminName: user.username,
      //     };
      //     common.dynamicEmail(keys);
      //   });
      // }

      var bookingID = insertedData._id;
      await common.reduceQtyFormproductAndInventory(bookingID);
      await common.processLoyaltyAndRefferal(insertedData.booking_code, getSettings?.loyalityProgramOnOff, getSettings?.refferalPointsOnOff);
      await addToCartDataBase.findOneAndUpdate(
        { user_id: user_id },
        {
          $set: {
            user_id: user_id,
            totalCartPrice: 0,
            CartDetail: [],
          },
        }
      );

      return res.status(200).json({
        message: "ok",
        data: "booking cretaed",
        code: 1,
      });
    } else {
      return res.status(200).json({
        message: "ok",
        data: "booking failed",
        code: 1,
      });
    }
  }
};

module.exports.updateBookingByAdmin = function (req, res) {
  let {
    booking_id,
    booking_code,
    user_id,
    total_payment,
    gst,
    allGstLists,
    taxType,
    bookingItems,
    deliverySlot,
    notifyUser,
    balance_payment,
    RegionId,
    regionName,
    totalCartPrice,
    totalCartPriceWithoutGST,
    po_number,
    billingCompany,
    billType,
    delivery_instructions,
    deliveryCharges,
    adminDiscountReason,
    adminDiscountType,
    discountType,
    discountPercentage,
    totalCouponDiscountAmount,
    invoiceNO,
    challanNO,
    DeliveryDate,
    paymentmethod,
  } = req.body;
  //console.log(req.body);
  var error = {};
  if (booking_id == "" || !booking_id || booking_id == undefined || booking_id == null) {
    common.formValidate("booking_id", res);
    return false;
  }
  if (RegionId == "" || !RegionId || RegionId == undefined || RegionId == null) {
    common.formValidate("RegionId", res);
    return false;
  }
  if (user_id == "" || !user_id || user_id == undefined || user_id == null) {
    common.formValidate("user_id", res);
    return false;
  }
  if (notifyUser == "" || !notifyUser || notifyUser == undefined || notifyUser == null) {
    common.formValidate("notifyUser", res);
    return false;
  }
  if (bookingItems == "" || bookingItems.length == 0 || !bookingItems || bookingItems == undefined || bookingItems == null) {
    common.formValidate("bookingItems", res);
    return false;
  }

  User.findOne({ _id: user_id })
    .exec()
    .then(async (getUser) => {
      if (getUser == null) {
        error["user_id"] = "user_id not found in database";
      }
      var errorArray = Object.keys(error).length;
      if (errorArray > 0) {
        return res.status(400).json({
          status: "error",
          result: [error],
        });
      } else {
        // console.log("before reverse");
        common.reverseQtyToInventory(booking_id).then(async () => {
          // console.log("after reverse |||");
          try {
            let simpleProductsQuantity = {};
            let configProductsQuantity = {};
            async.mapSeries(
              bookingItems,
              (item, callback) => {
                products
                  .aggregate(
                    [
                      { $match: { _id: mongoose.Types.ObjectId(item._id) } },
                      // populate product categories
                      {
                        $lookup: {
                          from: "categories",
                          foreignField: "_id",
                          localField: "product_categories",
                          as: "product_categories",
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
                                        $eq: ["$region", mongoose.Types.ObjectId(RegionId)],
                                      },
                                      {
                                        $eq: ["$variant_name", item.variant_name || null],
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
                                  availableQuantity: {
                                    $sum: "$availableQuantity",
                                  },
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
                              from: "packages",
                              foreignField: "_id",
                              localField: "simpleData.package",
                              as: "simpleData.package",
                            },
                          },
                          {
                            $addFields: {
                              "simpleData.productQuantity": "$productQuantity",
                              "simpleData.bookingQuantity": "$bookingQuantity",
                              "simpleData.availableQuantity": "$availableQuantity",
                              "simpleData.lostQuantity": "$lostQuantity",
                              "simpleData.returnQuantity": "$returnQuantity",
                              "simpleData.inhouseQuantity": "$inhouseQuantity",
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
                              productQuantity: { $first: "$productQuantity" },
                              bookingQuantity: { $first: "$bookingQuantity" },
                              availableQuantity: {
                                $first: "$availableQuantity",
                              },
                              lostQuantity: { $first: "$lostQuantity" },
                              returnQuantity: { $first: "$returnQuantity" },
                              inhouseQuantity: { $first: "$inhouseQuantity" },
                              productSubscription: {
                                $first: "$productSubscription",
                              },
                              preOrder: { $first: "$preOrder" },
                              preOrderQty: { $first: "$preOrderQty" },
                              preOrderBookQty: { $first: "$preOrderBookQty" },
                              preOrderRemainQty: {
                                $first: "$preOrderRemainQty",
                              },
                              preOrderStartDate: {
                                $first: "$preOrderStartDate",
                              },
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
                              product_categories: {
                                $first: "$product_categories",
                              },
                              // other keys
                              barcode: { $first: "$barcode" },
                              slug: { $first: "$slug" },
                              longDesc: { $first: "$longDesc" },
                              shortDesc: { $first: "$shortDesc" },
                              attachment: { $first: "$attachment" },
                              banner: { $first: "$banner" },
                              productThreshold: { $first: "$productThreshold" },
                              ProductRegion: { $first: "$ProductRegion" },
                              hsnCode: { $first: "$hsnCode" },
                              SKUCode: { $first: "$SKUCode" },
                              unitQuantity: { $first: "$unitQuantity" },
                              productExpiryDay: { $first: "$productExpiryDay" },
                              attribute_group: { $first: "$attribute_group" },
                              youtube_link: { $first: "$youtube_link" },
                              created_at: { $first: "$created_at" },
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
                              productQuantity: { $first: "$productQuantity" },
                              bookingQuantity: { $first: "$bookingQuantity" },
                              availableQuantity: {
                                $first: "$availableQuantity",
                              },
                              lostQuantity: { $first: "$lostQuantity" },
                              returnQuantity: { $first: "$returnQuantity" },
                              inhouseQuantity: { $first: "$inhouseQuantity" },
                              productSubscription: {
                                $first: "$productSubscription",
                              },
                              preOrderQty: { $first: "$preOrderQty" },
                              preOrderBookQty: { $first: "$preOrderBookQty" },
                              preOrderRemainQty: {
                                $first: "$preOrderRemainQty",
                              },
                              preOrder: { $first: "$preOrder" },
                              preOrderStartDate: {
                                $first: "$preOrderStartDate",
                              },
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
                              relatedProduct: { $first: "$relatedProduct" },
                              product_categories: {
                                $first: "$product_categories",
                              },
                              // other keys
                              barcode: { $first: "$barcode" },
                              slug: { $first: "$slug" },
                              longDesc: { $first: "$longDesc" },
                              shortDesc: { $first: "$shortDesc" },
                              attachment: { $first: "$attachment" },
                              banner: { $first: "$banner" },
                              productThreshold: { $first: "$productThreshold" },
                              ProductRegion: { $first: "$ProductRegion" },
                              hsnCode: { $first: "$hsnCode" },
                              SKUCode: { $first: "$SKUCode" },
                              unitQuantity: { $first: "$unitQuantity" },
                              productExpiryDay: { $first: "$productExpiryDay" },
                              attribute_group: { $first: "$attribute_group" },
                              youtube_link: { $first: "$youtube_link" },
                              created_at: { $first: "$created_at" },
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

                      // For Populating other keys
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
                      ],
                    ],
                    async (err, product) => {
                      try {
                        if (err) {
                          console.log("error in query ::::; ", err);
                        }
                        // console.log("$$$$$ 111 ", product);
                        if (product) {
                          // check if out of stock
                          var DataI = product[0];

                          if (!DataI) {
                            console.log(" PRODUCT NOT FOUND IN DB ");
                            return res.status(500).json({
                              msg: `product not found in database}`,
                              data: [],
                              code: 0,
                            });
                          }

                          if (deliverySlot == "Same Day Delivery" && !DataI.sameDayDelivery) {
                            return res.status(500).json({
                              msg: `Same Day Delivery is not available with ${product.product_name}`,
                              data: [],
                              code: 0,
                            });
                          }
                          if (deliverySlot == "Farm Pickup" && !DataI.farmPickup) {
                            return res.status(500).json({
                              msg: `Farm Pickup is not available with ${DataI.product_name}`,
                              data: [],
                              code: 0,
                            });
                          }

                          if (DataI.TypeOfProduct == "configurable") {
                            var availQty = DataI.availableQuantity;
                            var totalQty = DataI.unitQuantity * item.qty;
                            console.log("totalQty = ", totalQty, " and availQty = ", availQty);

                            if (!configProductsQuantity[`${DataI._id}__${RegionId}__${DataI.variant_name}`]) {
                              configProductsQuantity[`${DataI._id}__${RegionId}__${DataI.variant_name}`] = [
                                DataI.product_name,
                                RegionId,
                                availQty,
                                totalQty,
                                DataI.unitMeasurement,
                              ];
                            } else {
                              configProductsQuantity[`${DataI._id}__${RegionId}__${DataI.variant_name}`][2] = availQty;
                              configProductsQuantity[`${DataI._id}__${RegionId}__${DataI.variant_name}`][3] += totalQty;
                            }
                          } else if (DataI.TypeOfProduct == "simple") {
                            var availQty = DataI.availableQuantity;
                            var totalQty = (item.without_package ? item.unitQuantity : item.packet_size) * item.qty;

                            if (!simpleProductsQuantity[`${DataI._id}__${RegionId}`]) {
                              simpleProductsQuantity[`${DataI._id}__${RegionId}`] = [
                                DataI.product_name,
                                RegionId,
                                availQty,
                                totalQty,
                                DataI.unitMeasurement,
                              ];
                            } else {
                              simpleProductsQuantity[`${DataI._id}__${RegionId}`][2] = availQty;
                              simpleProductsQuantity[`${DataI._id}__${RegionId}`][3] += totalQty;
                            }
                          } else if (DataI.TypeOfProduct == "group") {
                            for (let j = 0; j < DataI.groupData.length; j++) {
                              let set = DataI.groupData[j];
                              for (let k = 0; k < set.sets.length; k++) {
                                let product = set.sets[k].product;

                                let [productData1] = await ProductData.aggregate([
                                  {
                                    $match: {
                                      _id: mongoose.Types.ObjectId(product._id),
                                      "simpleData.region": mongoose.Types.ObjectId(RegionId),
                                    },
                                  },
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
                                                  {
                                                    $eq: ["$product_id", "$$product_id"],
                                                  },
                                                  {
                                                    $eq: ["$region", mongoose.Types.ObjectId(RegionId)],
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
                                              lostQuantity: {
                                                $sum: "$lostQuantity",
                                              },
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
                                  ],
                                  // For Populating other keys
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
                                  ],
                                  {
                                    $project: {
                                      product_name: 1,
                                      unitMeasurement: 1,
                                      preOrderRemainQty: 1,
                                      preOrder: 1,
                                      availableQuantity: 1,
                                    },
                                  },
                                ]);

                                var availQty = productData1.availableQuantity;
                                var totalQty =
                                  (set.sets[k].package ? set.sets[k].package.packet_size : set.sets[k].unitQuantity) * set.sets[k].qty * item.qty;
                                console.log("totalQty = ", totalQty, " and availQty = ", availQty);

                                if (!simpleProductsQuantity[`${productData1._id}__${RegionId}`]) {
                                  simpleProductsQuantity[`${productData1._id}__${RegionId}`] = [
                                    productData1.product_name,
                                    RegionId,
                                    availQty,
                                    totalQty,
                                    productData1.unitMeasurement,
                                  ];
                                } else {
                                  simpleProductsQuantity[`${productData1._id}__${RegionId}`][2] = availQty;
                                  simpleProductsQuantity[`${productData1._id}__${RegionId}`][3] += totalQty;
                                }
                              }
                            }
                          }

                          callback(null, {
                            ...item,
                            product_id: DataI,
                            TypeOfProduct: DataI.TypeOfProduct,
                            product_SKUCode: DataI.SKUCode,
                            product_images: DataI.images,
                            product_longDesc: DataI.longDesc,
                            product_shortDesc: DataI.shortDesc,
                            product_name: DataI.product_name,
                            product_categories: DataI.product_categories,
                          });
                        }
                      } catch (err) {
                        console.log("new error", err);
                      }
                    }
                  )
                  .option({ serializeFunctions: true });
              },
              async (err, results) => {
                //console.log(results, ' resultsresultsresults')
                if (err) {
                  errorLogger.error(err, "\n", "\n");
                  console.log(err);
                } else {
                  let allErrors = [];
                  for (const key in simpleProductsQuantity) {
                    if (Object.hasOwnProperty.call(simpleProductsQuantity, key)) {
                      const element = simpleProductsQuantity[key];
                      if (element[2] < element[3]) {
                        allErrors.push(` ${element[0]} more than ${element[2]} ${element[4].name}`);
                      }
                    }
                  }

                  for (const key in configProductsQuantity) {
                    if (Object.hasOwnProperty.call(configProductsQuantity, key)) {
                      const element = configProductsQuantity[key];
                      if (element[2] < element[3]) {
                        allErrors.push(` ${element[0]} more than ${element[2]} ${element[4].name}`);
                      }
                    }
                  }

                  if (allErrors.length > 0) {
                    await common.reduceQtyFormproductAndInventory(booking_id);

                    return res.status(400).json({
                      message: "errror",
                      data: allErrors,
                      code: 0,
                    });
                  }

                  let getDetail = { CartDetail: results };
                  Promise.resolve(getDetail).then((getDetail) => {
                    if (getDetail.CartDetail == null || getDetail.CartDetail == "" || getDetail.CartDetail.length == 0) {
                      return res.status(200).json({
                        status: "ok",
                        result: "Please add atleast one Product to complete the booking",
                      });
                    } else {
                      var CartDetailArray = results;

                      var jsonData = {
                        user_id: user_id,
                        regionName: regionName,
                        regionID: RegionId,
                        totalCartPrice: totalCartPrice,
                        backendOrderDate: req.body.orderDate,
                        totalCartPriceWithoutGST: totalCartPriceWithoutGST,
                        total_payment: total_payment,
                        bookingdetail: CartDetailArray,
                        allGstLists,
                        taxType,
                        gst,
                        balance_payment,
                        po_number,
                        billingCompany,
                        billType,
                        delivery_instructions,
                        deliveryCharges,
                        adminDiscountReason,
                        adminDiscountType,
                        discountType,
                        discountPercentage,
                        totalCouponDiscountAmount,
                        invoiceNO,
                        challanNO,
                        DeliveryDate: DeliveryDate || null,
                        paymentmethod: paymentmethod || null,
                      };

                      // console.log("********************************************************");
                      // console.log(JSON.stringify(jsonData));
                      // console.log("********************************************************");

                      bookingDataBase.findOneAndUpdate({ _id: booking_id }, jsonData, { new: true }, async function (err, insertedData) {
                        if (err) {
                          errorLogger.error(err, "\n", "\n");
                          console.log(err);
                          return res.status(500).json({
                            status: "error",
                            result: "Server error",
                          });
                        } else {
                          var bookingID = booking_id;
                          await common.reduceQtyFormproductAndInventory(bookingID);
                          if (notifyUser === true) {
                            let notifs = await OnOffDataBase.findOne({}).lean();
                            var orderDetails = {
                              name: insertedData.userName,
                              booking_code: booking_code,
                              createDate: insertedData.createDate,
                              BookingStatusByAdmin: insertedData.BookingStatusByAdmin,
                              products: insertedData.bookingdetail,
                              address: insertedData.booking_address ? insertedData.booking_address.locality : null,
                              paymentMethod: insertedData.paymentmethod,
                              paymentStatus: insertedData.payment,
                              gst: insertedData.gst ? insertedData.gst : 0,
                              allGstLists: insertedData.allGstLists,
                              taxType: insertedData.taxType,
                              totalCartPrice: insertedData.totalCartPriceWithoutGST ? insertedData.totalCartPriceWithoutGST : 0,
                              deliveryCharges: insertedData.deliveryCharges ? insertedData.deliveryCharges : 0,
                              adminDiscount: insertedData.adminDiscount ? insertedData.adminDiscount : 0,
                              discountAmount: insertedData.discountAmount ? insertedData.discountAmount : 0,
                              redeemDiscount: insertedData.redeemDiscount ? insertedData.redeemDiscount : 0,
                              referralDiscount: insertedData.referralDiscount ? insertedData.referralDiscount : 0,
                              codCharges: insertedData.codCharges ? insertedData.codCharges : 0,
                              total_payment: insertedData.total_payment ? insertedData.total_payment : 0,
                              deliverySlot: insertedData.deliverySlot ? insertedData.deliverySlot : null,
                            };
                            var email = getUser.email;
                            var name = getUser.name;
                            var subject = "Order Updated Successfully!";
                            var message = `Your order (${booking_code})  has been updated.Please find your order details below.`;

                            var data = booking_code;
                            // var mobile = getUser.contactNumber;
                            // var mobileMsg = `Your order has been updated.. Your order ${data} has been placed. Questions? Get in touch with us +919667066462 or email us.`;

                            var mobile = getUser.contactNumber;

                            // if (notifs?.order_placed.sms) {
                            //   common.sendOtp(mobile, mobileMsg);
                            // }
                            //notifs?.order_placed.user_email
                            if (true) {
                              common.sendMail(email, subject, name, message, data, orderDetails);
                            }

                            let users = await Admin.find(
                              {
                                user_role: {
                                  $in: notifs?.order_placed.admin_roles,
                                },
                              },
                              { username: 1, email: 1 }
                            ).lean();

                            var message1 = `An order has been updated successfully. Please find order details below.
                                      <p><strong>Name: </strong>${common.toTitleCase(name)}</p>
                                      <p style="margin-top: -10px;"><strong>Mobile: </strong>${getUser.contactNumber}</p>
                                      <p style="margin-top: -10px;"><strong>Email: </strong>${email}</p>`;

                            if (notifs?.order_placed.admin_email) {
                              users.forEach((user) => {
                                common.sendMail(user.email, subject, user.username, message1, data, orderDetails);
                              });
                            }

                            var bookingID = insertedData._id;
                            return res.status(200).json({
                              message: "ok",
                              data: booking_code,
                              code: 1,
                            });
                          } else {
                            return res.status(200).json({
                              status: "ok",
                              result: booking_code,
                              id: booking_id,
                            });
                          }
                        } // else close of bookingDataBase
                      });
                    } // addToCartDataBase.findOne else close
                  });
                }
              }
            ); // async mapseries ends
          } catch (err) {
            errorLogger.error(err, "\n", "\n");
            console.log("err :::::::::::::::::::::: ", err);
          }
        });
      }
    });
};

module.exports.createBookingFromAdmin = function (req, res) {
  var body = req.body;
  var user_id = body.user_id;
  var user_email = body.user_email;
  var user_name = body.user_name;
  var bookingItems = body.bookingItems;
  var bookingMode = "offline";
  var address = body.address;
  var country = body.country;
  var state = body.state;
  var city = body.city;
  var locality = body.locality;
  var pincode = body.pincode;
  var latitude = body.latitude;
  var longitude = body.longitude;
  var delivery_instructions = body.delivery_instructions;
  var otheraddress = body.otheraddress;
  var paymentmethod = body.paymentmethod;
  var totalCartPrice = body.totalCartPrice;
  var totalCartPriceWithoutGST = body.totalCartPriceWithoutGST;
  var payment_id = body.payment_id;
  var total_payment = body.total_payment;
  var redeem = body.redeem ? body.redeem : 0;
  var redeemDiscount = body.redeemDiscount ? body.redeemDiscount : 0;
  var referralDiscount = body.referralDiscount ? body.referralDiscount : 0;
  var adminDiscountType = body.adminDiscountType ? body.adminDiscountType : "none";
  var adminDiscount = body.adminDiscount ? body.adminDiscount : 0;
  var adminDiscountReason = body.adminDiscountReason ? body.adminDiscountReason : "";
  var po_number = body.po_number;
  var totalCouponDiscountAmount = req.body.totalCouponDiscountAmount;
  var billingCompany = body.billingCompany ? body.billingCompany : null;
  var billType = body.billType ? body.billType : "invoice";
  var gst = body.gst;
  var allGstLists = body.allGstLists;
  var taxType = body.taxType;
  var cod = body.cod;
  var regionName = body.regionName;
  var regionID = body.RegionId;
  var deliveryCharges = body.deliveryCharges;
  var codCharges = body.codCharges;
  var orderDate = body.orderDate;
  var device_name = "web";
  var preOrder = false;
  var deliverySlot = body.deliverySlot;
  var invoiceNO = body.invoiceNO;
  var challanNO = body.challanNO;
  var giftingName = body.giftingName;
  var giftingContact = body.giftingContact;
  var giftingAddress = body.giftingAddress;
  var giftingNote = body.giftingNote;
  var error = {};

  {
    // var orderDate = moment.utc(orderDate);
    // var orderDate = orderDate.format("YYYY-MM-DD");

    if (user_id == "" || !user_id || user_id == undefined || user_id == null) {
      common.formValidate("user_id", res);
      return false;
    }
    if (user_email == "" || !user_email || user_email == undefined || user_email == null) {
      common.formValidate("user_email", res);
      return false;
    }
    if (user_name == "" || !user_name || user_name == undefined || user_name == null) {
      common.formValidate("user_name", res);
      return false;
    }

    if (bookingItems == "" || bookingItems.length == 0 || !bookingItems || bookingItems == undefined || bookingItems == null) {
      common.formValidate("bookingItems", res);
      return false;
    }

    if (bookingMode == "" || !bookingMode || bookingMode == undefined || bookingMode == null) {
      common.formValidate("bookingMode", res);
      return false;
    }
    if (paymentmethod == "" || !paymentmethod || paymentmethod == undefined || paymentmethod == null) {
      common.formValidate("paymentmethod", res);
      return false;
    }
    // if (deliverySlot == "" || !deliverySlot || deliverySlot == undefined || deliverySlot == null) {
    //     common.formValidate("deliverySlot", res);
    //     return false;
    // }
    if (orderDate == "" || !orderDate || orderDate == undefined || orderDate == null) {
      common.formValidate("orderDate", res);
      return false;
    }
    // if (total_payment == "" || !total_payment || total_payment == undefined || total_payment == null) {
    //     common.formValidate("total_payment", res);
    //     return false;
    // }
    if (state == "" || !state || state == undefined || state == null) {
      common.formValidate("state", res);
      return false;
    }
  }

  if (couponId) {
    var couponId = couponId;
  } else {
    var couponId = null;
  }
  User.findOne({ _id: user_id })
    .exec()
    .then(async (getUser) => {
      if (getUser == null) {
        error["user_id"] = "user_id not found in database";
      }
      var errorArray = Object.keys(error).length;
      if (errorArray > 0) {
        return res.status(400).json({
          status: "error",
          result: [error],
        });
      } else {
        // identify loyalty program

        var getSettings = await settingsModel.find({}).lean();
        getSettings = getSettings[0];
        var program = await LoyalityPrograms.find({
          $and: [
            {
              startOrderNo: {
                $lte: getUser.NoOfOrder + getUser.prevNoOfOrder + 1,
              },
            },
            {
              endOrderNo: {
                $gte: getUser.NoOfOrder + getUser.prevNoOfOrder + 1,
              },
            },
          ],
        }).lean();
        program = program[0];

        // // credit limit check
        // if (paymentmethod === "Credit" && +total_payment + +getUser.creditUsed > +getUser.creditLimit) {
        //   return res.status(500).json({
        //     status: "error",
        //     msg: `Credit Limit Exceeded`,
        //     creditUsed: getUser.creditUsed,
        //     creditLimit: getUser.creditLimit,
        //   });
        // }

        // loyalty checks
        if (redeemDiscount > 0) {
          return res.status(500).json({
            status: "error",
            msg: `No redeem discount in case of offline booking`,
          });
        }

        if (redeem > 0 && getSettings?.loyalityProgramOnOff == "off") {
          return res.status(500).json({
            status: "error",
            msg: `loyalty program is off.... you can't redeem krishi seeds`,
          });
        }

        // var maxRedeemAllowed = (getUser.TotalPoint ? +getUser.TotalPoint : 0) * getSettings?.seedValue;

        // let maxRedeemAllowed = (getUser.TotalPoint * program.redeem) / 100;

        // referral checks
        if (referralDiscount > 0) {
          return res.status(500).json({
            status: "error",
            msg: `No referral discount in case of offline booking`,
          });
        }

        var ORDER_ID = "KC";

        let simpleProductsQuantity = {};
        let configProductsQuantity = {};

        async.mapSeries(
          bookingItems,
          (item, callback) => {
            // console.log(item._id, "item._iditem._iditem._iditem._id ");
            // console.log(item.groupData[0].sets, "itemitemitemitemitemitem ");
            products
              .aggregate(
                [
                  { $match: { _id: mongoose.Types.ObjectId(item._id) } },
                  // populate product categories
                  {
                    $lookup: {
                      from: "categories",
                      foreignField: "_id",
                      localField: "product_categories",
                      as: "product_categories",
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
                                    $eq: ["$region", mongoose.Types.ObjectId(regionID)],
                                  },
                                  {
                                    $eq: ["$variant_name", item.variant_name || null],
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
                          from: "packages",
                          foreignField: "_id",
                          localField: "simpleData.package",
                          as: "simpleData.package",
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
                        $addFields: {
                          "simpleData.productQuantity": "$productQuantity",
                          "simpleData.bookingQuantity": "$bookingQuantity",
                          "simpleData.availableQuantity": "$availableQuantity",
                          "simpleData.lostQuantity": "$lostQuantity",
                          "simpleData.returnQuantity": "$returnQuantity",
                          "simpleData.inhouseQuantity": "$inhouseQuantity",
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
                          productQuantity: { $first: "$productQuantity" },
                          bookingQuantity: { $first: "$bookingQuantity" },
                          availableQuantity: { $first: "$availableQuantity" },
                          lostQuantity: { $first: "$lostQuantity" },
                          returnQuantity: { $first: "$returnQuantity" },
                          inhouseQuantity: { $first: "$inhouseQuantity" },
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
                          // other keys
                          barcode: { $first: "$barcode" },
                          slug: { $first: "$slug" },
                          longDesc: { $first: "$longDesc" },
                          shortDesc: { $first: "$shortDesc" },
                          attachment: { $first: "$attachment" },
                          banner: { $first: "$banner" },
                          productThreshold: { $first: "$productThreshold" },
                          ProductRegion: { $first: "$ProductRegion" },
                          hsnCode: { $first: "$hsnCode" },
                          SKUCode: { $first: "$SKUCode" },
                          unitQuantity: { $first: "$unitQuantity" },
                          productExpiryDay: { $first: "$productExpiryDay" },
                          attribute_group: { $first: "$attribute_group" },
                          youtube_link: { $first: "$youtube_link" },
                          created_at: { $first: "$created_at" },
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
                          productQuantity: { $first: "$productQuantity" },
                          bookingQuantity: { $first: "$bookingQuantity" },
                          availableQuantity: { $first: "$availableQuantity" },
                          lostQuantity: { $first: "$lostQuantity" },
                          returnQuantity: { $first: "$returnQuantity" },
                          inhouseQuantity: { $first: "$inhouseQuantity" },
                          productSubscription: {
                            $first: "$productSubscription",
                          },
                          preOrderQty: { $first: "$preOrderQty" },
                          preOrderBookQty: { $first: "$preOrderBookQty" },
                          preOrderRemainQty: { $first: "$preOrderRemainQty" },
                          preOrder: { $first: "$preOrder" },
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
                          relatedProduct: { $first: "$relatedProduct" },
                          product_categories: { $first: "$product_categories" },
                          // other keys
                          barcode: { $first: "$barcode" },
                          slug: { $first: "$slug" },
                          longDesc: { $first: "$longDesc" },
                          shortDesc: { $first: "$shortDesc" },
                          attachment: { $first: "$attachment" },
                          banner: { $first: "$banner" },
                          productThreshold: { $first: "$productThreshold" },
                          ProductRegion: { $first: "$ProductRegion" },
                          hsnCode: { $first: "$hsnCode" },
                          SKUCode: { $first: "$SKUCode" },
                          unitQuantity: { $first: "$unitQuantity" },
                          productExpiryDay: { $first: "$productExpiryDay" },
                          attribute_group: { $first: "$attribute_group" },
                          youtube_link: { $first: "$youtube_link" },
                          created_at: { $first: "$created_at" },
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
                ],
                async (err, product) => {
                  try {
                    if (err) {
                      console.log("error in query ::::; ", err);
                    }
                    // console.log("$$$$$ 111 ", product);
                    if (product) {
                      //console.log(product, 'product productproductproductproductproductproduct')
                      // check if out of stock
                      var DataI = product[0];

                      if (!DataI) {
                        console.log(" PRODUCT NOT FOUND IN DB ");
                        return res.status(500).json({
                          msg: `product not found in database}`,
                          data: [],
                          code: 0,
                        });
                      }

                      if (deliverySlot == "Same Day Delivery" && !DataI.sameDayDelivery) {
                        return res.status(500).json({
                          msg: `Same Day Delivery is not available with ${product.product_name}`,
                          data: [],
                          code: 0,
                        });
                      }
                      if (deliverySlot == "Farm Pickup" && !DataI.farmPickup) {
                        return res.status(500).json({
                          msg: `Farm Pickup is not available with ${DataI.product_name}`,
                          data: [],
                          code: 0,
                        });
                      }

                      if (DataI.TypeOfProduct == "configurable") {
                        var availQty = DataI.availableQuantity;
                        var totalQty = DataI.unitQuantity * item.qty;
                        console.log("totalQty = ", totalQty, " and availQty = ", availQty);

                        if (!configProductsQuantity[`${DataI._id}__${regionID}__${DataI.variant_name}`]) {
                          configProductsQuantity[`${DataI._id}__${regionID}__${DataI.variant_name}`] = [
                            DataI.product_name,
                            regionID,
                            availQty,
                            totalQty,
                            DataI.unitMeasurement,
                          ];
                        } else {
                          configProductsQuantity[`${DataI._id}__${regionID}__${DataI.variant_name}`][2] = availQty;
                          configProductsQuantity[`${DataI._id}__${regionID}__${DataI.variant_name}`][3] += totalQty;
                        }
                      } else if (DataI.TypeOfProduct == "simple") {
                        var availQty = DataI.availableQuantity;
                        var totalQty = (item.without_package ? item.unitQuantity : item.packet_size) * item.qty;

                        if (!simpleProductsQuantity[`${DataI._id}__${regionID}`]) {
                          simpleProductsQuantity[`${DataI._id}__${regionID}`] = [
                            DataI.product_name,
                            regionID,
                            availQty,
                            totalQty,
                            DataI.unitMeasurement,
                          ];
                        } else {
                          simpleProductsQuantity[`${DataI._id}__${regionID}`][2] = availQty;
                          simpleProductsQuantity[`${DataI._id}__${regionID}`][3] += totalQty;
                        }
                      } else if (DataI.TypeOfProduct == "group") {
                        //console.log(DataI.groupData)
                        for (let j = 0; j < DataI.groupData.length; j++) {
                          let set = DataI.groupData[j];
                          //console.log(set.sets)
                          for (let k = 0; k < set.sets.length; k++) {
                            let product = set.sets[k].product;

                            let [productData1] = await ProductData.aggregate([
                              {
                                $match: {
                                  _id: mongoose.Types.ObjectId(product._id),
                                  "simpleData.region": mongoose.Types.ObjectId(regionID),
                                },
                              },
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
                                              {
                                                $eq: ["$product_id", "$$product_id"],
                                              },
                                              {
                                                $eq: ["$region", mongoose.Types.ObjectId(regionID)],
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
                                          lostQuantity: {
                                            $sum: "$lostQuantity",
                                          },
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
                              ],
                              // For Populating other keys
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
                              ],
                              {
                                $project: {
                                  product_name: 1,
                                  unitMeasurement: 1,
                                  preOrderRemainQty: 1,
                                  preOrder: 1,
                                  availableQuantity: 1,
                                },
                              },
                            ]);
                            // console.log(
                            //   set.sets[k],
                            //   "  qty match"
                            // );
                            var availQty = productData1.availableQuantity;

                            var totalQty = 0;
                            for (z = 0; z < bookingItems.length; z++) {
                              var innerProduct = bookingItems[z].innerProducts;
                              for (z1 = 0; z1 < innerProduct?.length; z1++) {
                                var innerproductid = mongoose.Types.ObjectId(innerProduct[z1].package.product);
                                var realProductId = productData1._id;

                                // (mongoose.Types.ObjectId(
                                //   innerProduct[z1].package.region
                                // ) == mongoose.Types.ObjectId(regionID))
                                if (innerproductid.toString() == realProductId.toString()) {
                                  console.log(innerProduct[z1].qty, item.qty, "qqqqqqqqqqqqqqqqqqqqqqqq itssssssss matchhhhhhhh");
                                  totalQty +=
                                    (+innerProduct[z1].package.packet_size,
                                    innerProduct[z1].unitQuantity,
                                    innerProduct[z1].package.packet_size,
                                    innerProduct[z1].package,
                                    item.qty ? +innerProduct[z1].package.packet_size : +innerProduct[z1].unitQuantity) *
                                    +innerProduct[z1].qty *
                                    +item.qty;
                                }
                              }
                            }
                            // var totalQty =
                            //   (set.sets[k].package
                            //     ? +set.sets[k].package.packet_size
                            //     : +set.sets[k].unitQuantity) *
                            //   +set.sets[k].qty *
                            //   +item.qty;
                            console.log("totalQty = ", totalQty, " and availQty = ", availQty, "tttttttttttttttttttttttttt");

                            // if (!(totalQty > 0)) {
                            //   return res.status(400).json({
                            //     message: "error",
                            //     data: "somthing went wrong with qty",
                            //     code: 0,
                            //   });
                            // }

                            if (!simpleProductsQuantity[`${productData1._id}__${regionID}`]) {
                              simpleProductsQuantity[`${productData1._id}__${regionID}`] = [
                                productData1.product_name,
                                regionID,
                                availQty,
                                totalQty,
                                productData1.unitMeasurement,
                              ];
                            } else {
                              simpleProductsQuantity[`${productData1._id}__${regionID}`][2] = availQty;
                              simpleProductsQuantity[`${productData1._id}__${regionID}`][3] += totalQty;
                            }
                          }
                        }
                      }

                      callback(null, {
                        ...item,
                        product_id: DataI,
                        TypeOfProduct: DataI.TypeOfProduct,
                        product_SKUCode: DataI.SKUCode,
                        product_images: DataI.images,
                        product_longDesc: DataI.longDesc,
                        product_shortDesc: DataI.shortDesc,
                        product_name: DataI.product_name,
                        product_categories: DataI.product_categories,
                      });
                    }
                  } catch (err) {
                    console.log("new error", err);
                  }
                }
              )
              .option({ serializeFunctions: true });
          },
          (err, results) => {
            if (err) {
            } else {
              //console.log(simpleProductsQuantity,'uuuuuuuuuuuu');

              let allErrors = [];
              for (const key in simpleProductsQuantity) {
                if (Object.hasOwnProperty.call(simpleProductsQuantity, key)) {
                  const element = simpleProductsQuantity[key];
                  if (element[2] < element[3]) {
                    allErrors.push(` ${element[0]} more than ${element[2]} ${element[4].name}`);
                  }
                }
              }

              for (const key in configProductsQuantity) {
                if (Object.hasOwnProperty.call(configProductsQuantity, key)) {
                  const element = configProductsQuantity[key];
                  if (element[2] < element[3]) {
                    allErrors.push(` ${element[0]} more than ${element[2]} ${element[4].name}`);
                  }
                }
              }

              if (allErrors.length > 0) {
                return res.status(400).json({
                  message: "errror",
                  data: allErrors,
                  code: 0,
                });
              }

              let getDetail = { CartDetail: results };
              Promise.resolve(getDetail).then((getDetail) => {
                if (getDetail.CartDetail == null || getDetail.CartDetail == "" || getDetail.CartDetail.length == 0) {
                  return res.status(200).json({
                    status: "ok",
                    result: "Please add atleast one Product to complete the booking",
                  });
                } else {
                  var CartDetailArray = results;
                  // console.log(CartDetailArray)
                  // configure Payment Method
                  var paytm_link;
                  switch (paymentmethod) {
                    case "COD":
                      break;

                    case "Credit":
                      break;

                    case "Paytm_link": {
                      // var mobile = getUser.contactNumber;
                      // var mobileMsg = `Thank you for ordering at Krishi Cress. Your order ${booking_code} has been placed. Questions? Get in touch with us +919667066462 or email us.`;

                      // var mobile = getUser.contactNumber;

                      // common.sendOtp(mobile, mobileMsg);
                      break;
                    }

                    default:
                      return res.status(422).json({
                        status: "error",
                        msg: "Wrong Input: Payment method",
                      });
                      break;
                  }

                  var booking_address = {
                    address: address,
                    country: country,
                    state: state,
                    city: city,
                    pincode: pincode,
                    locality: locality,
                    latitude: latitude,
                    longitude: longitude,
                  };

                  if (adminDiscountType == "percentage") {
                    var adminDiscountPercentage = adminDiscount;
                    adminDiscount = 0;
                  }

                  // if (paymentmethod === "Credit") {
                  //   if (total_payment + getUser.creditUsed > getUser.creditLimit) {
                  //     return;
                  //   }
                  // }

                  var jsonData = {
                    user_id: user_id,
                    userName: getUser.name,
                    userEmail: getUser.email,
                    userMobile: getUser.contactNumber,
                    userType: getUser.user_type,
                    userData: getUser,
                    regionName: regionName,
                    regionID: regionID,
                    deliveryCharges: deliveryCharges,
                    razorpay_payment_id: payment_id,
                    bookingMode: bookingMode,
                    booking_code: ORDER_ID,
                    invoiceNO: invoiceNO,
                    challanNo: challanNO,
                    paymentmethod: paymentmethod,
                    totalCartPrice: totalCartPrice,
                    totalCartPriceWithoutGST: totalCartPriceWithoutGST,
                    total_payment: total_payment,
                    totalCouponDiscountAmount,
                    redeem_point: redeem,
                    redeemDiscount: redeemDiscount,
                    referralDiscount: referralDiscount,
                    device_name: device_name,
                    deliverySlot: deliverySlot,
                    po_number: po_number ? po_number : null,
                    adminDiscountType,
                    adminDiscountPercentage,
                    adminDiscount,
                    adminDiscountReason,
                    billingCompany,
                    billType,
                    booking_address: booking_address,
                    delivery_instructions: delivery_instructions,
                    otheraddress: otheraddress,
                    bookingdetail: CartDetailArray,
                    allGstLists,
                    taxType,
                    gst,
                    backendOrderDate: orderDate,
                    preOrder: preOrder,
                    giftingAddress: giftingAddress,
                    giftingStatus: true,
                    giftingName: giftingName,
                    giftingContact: giftingContact,
                    giftingNote: giftingNote,
                  };

                  bookingDataBase.create(jsonData, async function (err, insertedData) {
                    if (err) {
                      errorLogger.error(err, "\n", "\n");
                      console.log(err);
                      return res.status(500).json({
                        status: "error",
                        result: "Server error",
                      });
                    } else {
                      // update order id with counter start added by chitra
                      var booking_code = "KC" + (insertedData.counter < 10 ? "0" + insertedData.counter : insertedData.counter);

                      var d = new Date();
                      let year = d.getFullYear();
                      let date = d.getDate();

                      // let invoiceNO = null,
                      // challanNO = null;
                      // if (insertedData.billType == "invoice") {
                      //   invoiceNO =
                      //     insertedData.counter +
                      //     "/" +
                      //     `${new Date().getFullYear().toString()}-${(new Date().getFullYear() + 1)
                      //       .toString()
                      //       .slice(2)}`;
                      // } else {
                      //   challanNO =
                      //     insertedData.counter +
                      //     "/" +
                      //     `${new Date().getFullYear().toString()}-${(new Date().getFullYear() + 1)
                      //       .toString()
                      //       .slice(2)}`;
                      // }

                      await bookingDataBase.update(
                        {
                          _id: insertedData._id,
                        },
                        {
                          booking_code: booking_code,
                          invoiceNO,
                          challanNO,
                        }
                      );
                      //update order id with counter end

                      // if (paymentmethod === "Credit") {
                      //   await User.updateOne({ _id: user_id }, { $inc: { creditUsed: +total_payment } });
                      // }

                      let notifs = await OnOffDataBase.findOne({}).lean();

                      if (getSettings?.loyalityProgramOnOff == "on") {
                        // add loyalty points gained history
                        pointsGained = (Number(total_payment) * Number(program.accumulation)) / 100;
                        await LoyalityProgramHistory.create({
                          user_id: user_id,
                          orderID: insertedData._id,
                          booking_code: booking_code,
                          point: Math.round(Number(pointsGained)),
                          pointStatus: "Added",
                          loyalityName: program.name,
                          loyalityPercentage: program.accumulation,
                          TotalAmount: total_payment,
                        });

                        await User.findOneAndUpdate(
                          { _id: user_id },
                          {
                            $inc: {
                              TotalPoint: Math.round(+pointsGained),
                            },
                          }
                        );
                      }
                      var d = new Date();
                      d.setDate(d.getDate() + 90);
                      let expiryDate = new Date(d);

                      await User.findOneAndUpdate(
                        { _id: user_id },
                        {
                          $inc: {
                            NoOfOrder: 1,
                          },
                          LastOrderDate: new Date(),
                          expiryDate: expiryDate,
                        }
                      );

                      var bookingID = insertedData._id;
                      await common.reduceQtyFormproductAndInventory(bookingID);

                      //send order placement mails

                      var orderDetails = {
                        name: insertedData.userName,
                        booking_code: booking_code,
                        createDate: insertedData.createDate,
                        BookingStatusByAdmin: insertedData.BookingStatusByAdmin,
                        products: insertedData.bookingdetail,
                        address: insertedData.booking_address.locality,
                        paymentMethod: insertedData.paymentmethod,
                        paymentStatus: insertedData.payment,
                        gst: insertedData.gst ? insertedData.gst : 0,
                        allGstLists: insertedData.allGstLists,
                        taxType: insertedData.taxType,
                        totalCartPrice: insertedData.totalCartPriceWithoutGST ? insertedData.totalCartPriceWithoutGST : 0,
                        deliveryCharges: insertedData.deliveryCharges ? insertedData.deliveryCharges : 0,
                        adminDiscount: insertedData.adminDiscount ? insertedData.adminDiscount : 0,
                        discountAmount: insertedData.discountAmount ? insertedData.discountAmount : 0,
                        redeemDiscount: insertedData.redeemDiscount ? insertedData.redeemDiscount : 0,
                        referralDiscount: insertedData.referralDiscount ? insertedData.referralDiscount : 0,
                        codCharges: insertedData.codCharges ? insertedData.codCharges : 0,
                        total_payment: insertedData.total_payment ? insertedData.total_payment : 0,
                        deliverySlot: insertedData.deliverySlot ? insertedData.deliverySlot : null,
                      };

                      var email = getUser.email;
                      var name = getUser.name;
                      var subject = "Order Placed Successfully!";
                      var message = "Thank You for placing your order with Krishi Cress. Please find your order details below.";
                      var data = booking_code;
                      var ProductDetail = await common.OrderDetails(orderDetails);
                      // console.log(
                      //   "notifs?.order_placed.user_emailnotifs?.order_placed.user_email::::::",
                      //   notifs?.order_placed.user_email
                      // );
                      if (notifs?.order_placed.user_email) {
                        var keys = {
                          userName: common.toTitleCase(name),
                          userMobile: getUser.contactNumber,
                          OrderDetail: ProductDetail,
                          type: "user",
                          template_name: "order place mail to user",
                          userEmail: email,
                        };
                        common.dynamicEmail(keys);
                      }

                      var message1 = `An order has been placed successfully. Please find order details below.
                            <p><strong>Name: </strong>${common.toTitleCase(name)}</p>
                            <p style="margin-top: -10px;"><strong>Mobile: </strong>${getUser.contactNumber}</p>
                            <p style="margin-top: -10px;"><strong>Email: </strong>${email}</p>`;

                      let users = await Admin.find({ user_role: { $in: notifs?.order_placed.admin_roles } }, { username: 1, email: 1 }).lean();

                      if (notifs?.order_placed.admin_email) {
                        users.forEach((user) => {
                          var keys = {
                            userName: common.toTitleCase(name),
                            userMobile: getUser.contactNumber,
                            userEmail: email,
                            OrderDetail: ProductDetail,
                            type: "admin",
                            template_name: "order place mail to admin",
                            adminEmail: user.email,
                            adminName: user.username,
                          };
                          common.dynamicEmail(keys);
                        });
                      }

                      var mobileMsg = `Thank you for ordering at Krishi Cress. Your order ${booking_code} has been placed. Questions? Get in touch with us +919667066462 or email us.`;

                      var mobile = getUser.contactNumber;

                      if (notifs?.order_placed.sms) {
                        common.sendOtp(mobile, mobileMsg);
                      }

                      return res.status(200).json({
                        status: "ok",
                        result: booking_code,
                        id: insertedData._id,
                      });
                    } // else close of bookingDataBase
                  });
                } // addToCartDataBase.findOne else close
              });
            }
          }
        ); // async mapseries ends
      }
    });
};

module.exports.repeatOrder = (req, res) => {
  const { booking_code, regionId } = req.body;
  const user_id = req.decoded.ID;
  //console.log(req.body);
  if (!booking_code) {
    common.formValidate("booking_code", res);
    return false;
  }

  if (!regionId) {
    common.formValidate("regionId", res);
    return false;
  }

  User.findOne({ _id: user_id }, async (err, user) => {
    if (err) {
      errorLogger.error(err, "\n", "\n");
      return res.status(401).json({ msg: "User not found" });
    } else {
      // console.log(user);
      let booking = await bookingDataBase.findOne({ booking_code }).lean();
      // console.log(booking);

      if (!booking) {
        return res.status(500).json({
          message: "No booking found with the booking_code",
        });
      }

      let bookingdetail = booking.bookingdetail;
      let notAdded = [];
      let outOfStock = [];

      let simpleProductsQuantity = {};
      let configProductsQuantity = {};

      let CartDetail = [];

      for (const bookingItem of bookingdetail) {
        let [product] = await products
          .aggregate([
            {
              $match: {
                _id: mongoose.Types.ObjectId(bookingItem.product_id._id),
              },
            },
            // populate product categories
            {
              $lookup: {
                from: "categories",
                foreignField: "_id",
                localField: "product_categories",
                as: "product_categories",
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
                              $eq: ["$region", mongoose.Types.ObjectId(regionId)],
                            },
                            {
                              $eq: ["$variant_name", bookingItem.variant_name],
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
                    from: "packages",
                    foreignField: "_id",
                    localField: "simpleData.package",
                    as: "simpleData.package",
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
                    productQuantity: { $first: "$productQuantity" },
                    bookingQuantity: { $first: "$bookingQuantity" },
                    availableQuantity: { $first: "$availableQuantity" },
                    lostQuantity: { $first: "$lostQuantity" },
                    returnQuantity: { $first: "$returnQuantity" },
                    inhouseQuantity: { $first: "$inhouseQuantity" },
                    productSubscription: { $first: "$productSubscription" },
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
                    // other keys
                    barcode: { $first: "$barcode" },
                    slug: { $first: "$slug" },
                    longDesc: { $first: "$longDesc" },
                    shortDesc: { $first: "$shortDesc" },
                    attachment: { $first: "$attachment" },
                    banner: { $first: "$banner" },
                    productThreshold: { $first: "$productThreshold" },
                    ProductRegion: { $first: "$ProductRegion" },
                    hsnCode: { $first: "$hsnCode" },
                    SKUCode: { $first: "$SKUCode" },
                    unitQuantity: { $first: "$unitQuantity" },
                    productExpiryDay: { $first: "$productExpiryDay" },
                    attribute_group: { $first: "$attribute_group" },
                    youtube_link: { $first: "$youtube_link" },
                    created_at: { $first: "$created_at" },
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
                    productQuantity: { $first: "$productQuantity" },
                    bookingQuantity: { $first: "$bookingQuantity" },
                    availableQuantity: { $first: "$availableQuantity" },
                    lostQuantity: { $first: "$lostQuantity" },
                    returnQuantity: { $first: "$returnQuantity" },
                    inhouseQuantity: { $first: "$inhouseQuantity" },
                    productSubscription: { $first: "$productSubscription" },
                    preOrderQty: { $first: "$preOrderQty" },
                    preOrderBookQty: { $first: "$preOrderBookQty" },
                    preOrderRemainQty: { $first: "$preOrderRemainQty" },
                    preOrder: { $first: "$preOrder" },
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
                    relatedProduct: { $first: "$relatedProduct" },
                    product_categories: { $first: "$product_categories" },
                    // other keys
                    barcode: { $first: "$barcode" },
                    slug: { $first: "$slug" },
                    longDesc: { $first: "$longDesc" },
                    shortDesc: { $first: "$shortDesc" },
                    attachment: { $first: "$attachment" },
                    banner: { $first: "$banner" },
                    productThreshold: { $first: "$productThreshold" },
                    ProductRegion: { $first: "$ProductRegion" },
                    hsnCode: { $first: "$hsnCode" },
                    SKUCode: { $first: "$SKUCode" },
                    unitQuantity: { $first: "$unitQuantity" },
                    productExpiryDay: { $first: "$productExpiryDay" },
                    attribute_group: { $first: "$attribute_group" },
                    youtube_link: { $first: "$youtube_link" },
                    created_at: { $first: "$created_at" },
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
          ])
          .option({ serializeFunctions: true });

        if (!product) {
          notAdded.push(bookingItem.product_id.product_name || bookingItem.product_id);
          continue;
        }
        if (!product.status || !product.showstatus) {
          outOfStock.push(product.product_name);
          continue;
        }
        let productCatStatus = true;
        for (const cat of product.product_categories) {
          if (!cat.status) {
            productCatStatus = false;
          }
        }
        if (!productCatStatus) {
          outOfStock.push(product.product_name);
          continue;
        }

        if (bookingItem.TypeOfProduct == "simple") {
          // check if out of stock
          let simpleData = product.simpleData.filter((data) => data.region == regionId);
          if (simpleData.length == 0) {
            outOfStock.push(bookingItem.product_id.product_name);
            continue;
          }

          let availQty = product.availableQuantity;
          let totalQty = bookingItem.without_package ? bookingItem.qty * bookingItem.unitQuantity : bookingItem.qty * bookingItem.packet_size;
          console.log("totalQty = ", totalQty, " and availQty = ", availQty);

          if (!simpleProductsQuantity[`${product._id}__${regionId}`]) {
            simpleProductsQuantity[`${product._id}__${regionId}`] = [
              product.product_name,
              regionId,
              availQty - totalQty,
              totalQty,
              product.unitMeasurement,
            ];
          } else {
            simpleProductsQuantity[`${product._id}__${regionId}`][2] -= totalQty;
            simpleProductsQuantity[`${product._id}__${regionId}`][3] += totalQty;
          }

          if (simpleProductsQuantity[`${product._id}__${regionId}`][2] < 0) {
            outOfStock.push(bookingItem.product_id.product_name);
            continue;
          } else {
            // In stock

            let productItemId, unitMeasurement, itemPrice;

            console.log(`in here for ${product.product_name} with packetLabel ${bookingItem.packetLabel}`);
            productItemId = bookingItem.productItemId;
            unitMeasurement = bookingItem.unitMeasurement;

            let label =
              bookingItem.without_package === true || bookingItem.without_package === "true"
                ? `${booking.unitQuantity} ${booking.unitMeasurement.name}`
                : bookingItem.packetLabel;

            let package = simpleData[0].package.filter((pack) => pack.packetLabel == label && pack.status);

            if (package.length > 0) {
              productItemId = package[0]._id;
              if (user.user_type === "b2b") {
                itemPrice = package[0].B2B_price;
              } else if (user.user_type === "retail") {
                itemPrice = package[0].Retail_price;
              } else if (user.user_type === "user" || user.user_type === null) {
                itemPrice = package[0].selling_price;
              }
            } else {
              console.log("not adddiiiinnngggg this product ::::::: ", bookingItem.product_id.product_name, package);
              notAdded.push(bookingItem.product_id.product_name);
              continue;
            }

            let cartData = {
              product_id: bookingItem.product_id._id,
              // product_cat_id: bookingItem.product_id.product_cat_id._id,
              // product_subCat1_id: product_subCat1_id,
              productItemId: productItemId,
              TypeOfProduct: bookingItem.TypeOfProduct,
              packet_size: bookingItem.packet_size,
              packetLabel: bookingItem.packetLabel,
              qty: bookingItem.qty,
              price: itemPrice,
              product_categories: bookingItem.product_categories,
              preOrder: bookingItem.preOrder,
              preOrderEndDate: bookingItem.preOrderEndDate,
              unitQuantity: bookingItem.unitQuantity,
              unitMeasurement: unitMeasurement,
              without_package: bookingItem.without_package,
              totalprice: bookingItem.qty * itemPrice,
              status: true,
              createDate: Date(),
            };

            CartDetail.push(cartData);
          }
        } else if (bookingItem.TypeOfProduct == "group") {
          let allInStock = true;
          // check if any sub-product in group is out of stock
          try {
            for (let j = 0; j < bookingItem.groupData.length; j++) {
              let set = bookingItem.groupData[j];
              let setQty = 0;
              for (let k = 0; k < set.sets.length; k++) {
                let product = set.sets[k].product;

                let [productData] = await ProductData.aggregate([
                  {
                    $match: {
                      _id: mongoose.Types.ObjectId(product._id),
                      "simpleData.region": mongoose.Types.ObjectId(regionId),
                    },
                  },
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
                                    $eq: ["$region", mongoose.Types.ObjectId(regionId)],
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
                  ],
                  // For Populating other keys
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
                  ],
                  {
                    $project: {
                      product_name: 1,
                      unitMeasurement: 1,
                      preOrderRemainQty: 1,
                      preOrder: 1,
                      availableQuantity: 1,
                    },
                  },
                ]).option({ serializeFunctions: true });

                var availQty = productData.availableQuantity;
                var totalQty = (set.sets[k].package ? set.sets[k].package.packet_size : set.sets[k].unitQuantity) * set.sets[k].qty * bookingItem.qty;
                console.log("totalQty = ", totalQty, " and availQty = ", availQty);

                if (!simpleProductsQuantity[`${productData._id}__${regionId}`]) {
                  simpleProductsQuantity[`${productData._id}__${regionId}`] = [
                    productData.product_name,
                    regionId,
                    availQty - totalQty,
                    totalQty,
                    productData.unitMeasurement,
                  ];
                } else {
                  simpleProductsQuantity[`${productData._id}__${regionId}`][2] -= totalQty;
                  simpleProductsQuantity[`${productData._id}__${regionId}`][3] += totalQty;
                }

                if (simpleProductsQuantity[`${productData._id}__${regionId}`][2] < 0) {
                  allInStock = false;
                }
              }
            }
            // console.log("========================= 2");
          } catch (err) {
            errorLogger.error(err, "\n", "\n");
            console.log("err::::::", err);
            notAdded.push(bookingItem.product_id.product_name);
            allInStock = false;
          }
          // if in stock then add it to cart
          console.log("allInStock = ", allInStock);

          if (allInStock) {
            let cartData = {
              product_id: bookingItem.product_id._id,
              // product_cat_id: bookingItem.product_id.product_cat_id._id,
              // product_subCat1_id: product_subCat1_id,
              productItemId: bookingItem.productItemId || null,
              unique_id: +new Date(),
              TypeOfProduct: bookingItem.TypeOfProduct,
              groupData: bookingItem.groupData,
              packet_size: bookingItem.packet_size || null,
              packetLabel: bookingItem.packetLabel || null,
              qty: bookingItem.qty,
              price: bookingItem.price,
              product_categories: bookingItem.product_categories,
              preOrder: bookingItem.preOrder,
              preOrderEndDate: bookingItem.preOrderEndDate,
              unitQuantity: bookingItem.unitQuantity || null,
              unitMeasurement: bookingItem.unitMeasurement || null,
              without_package: bookingItem.without_package,
              totalprice: bookingItem.totalprice,
              status: true,
              createDate: Date(),
            };
            CartDetail.push(cartData);
          } else {
            outOfStock.push(bookingItem.product_id.product_name);
            continue;
          }
        }
      }

      let jsonData = {
        user_id: user_id,
        totalCartPrice: booking.totalCartPrice,
        regionID: regionId,
        CartDetail,
      };

      addToCartDataBase.findOneAndUpdate({ user_id: user_id }, { $set: jsonData }, { new: true }, function (err, data) {
        if (err) {
          errorLogger.error(err, "\n", "\n");
          console.log(err);
          return res.status(500).json(err);
        } else {
          // console.log("yyyyyyyy ", data);
          return res.status(200).json({
            message: "ok",
            data,
            notAdded,
            outOfStock,
            code: 1,
          });
        }
      });
    }
  }).lean();
};

module.exports.checkLoyaltyStatus = async (req, res) => {
  try {
    const user_id = req.decoded.ID;
    const getUser = await User.findOne({ _id: user_id }).lean();
    if (!getUser) {
      return res.status(500).json({ message: "error2", error: "No user found" });
    }
    //console.log("getUser::::::::::::::::::", getUser);

    var getSettings = await settingsModel.findOne({}).lean();
    if (!getSettings) {
      return res.status(500).json({ message: "error3", error: "No settings found" });
    }
    //console.log("getSettings::::::::::::::::::", getSettings);

    var program = await LoyalityPrograms.findOne({
      $and: [
        {
          startOrderNo: {
            $lte: getUser.NoOfOrder + getUser.prevNoOfOrder + 1,
          },
        },
        { endOrderNo: { $gte: getUser.NoOfOrder + getUser.prevNoOfOrder + 1 } },
      ],
    }).lean();
    //console.log("program::::::::::::::::::", program);
    if (!program) {
      return res.status(500).json({ message: "error4", error: "No program found" });
    }

    res.status(200).json({
      message: "ok",
      data: {
        loyaltyStatus: getSettings?.loyalityProgramOnOff,
        seedValue: getSettings?.seedValue,
        redeemPercent: program.redeem,
        maxRedeemDiscount: (getUser.TotalPoint ? +getUser.TotalPoint : 0) * getSettings?.seedValue,
        maxSeeds: getUser.TotalPoint ? +getUser.TotalPoint : 0,
      },
    });
  } catch (err) {
    if (err) {
      errorLogger.error(err, "\n", "\n");
      console.log("error1 :::::::::::", err);
      res.status(500).json({ message: "error1", error: err });
    }
  }
};

module.exports.checkRefferalStatus = async (req, res) => {
  try {
    const user_id = req.decoded.ID;
    const getUser = await User.findOne({ _id: user_id }).lean();

    var getSettings = await settingsModel.findOne({}).lean();
    var eligible = false;
    // typeof getUser.refferalCodeFrom != null && getUser.NoOfOrder + getUser.prevNoOfOrder < 3;
    if (getUser.refferalCodeFrom) {
      if (getUser.NoOfOrder + getUser.prevNoOfOrder < 3) {
        eligible = true;
      }
    }
    var refferalDiscountPercent =
      getUser.NoOfOrder + getUser.prevNoOfOrder == 0
        ? 5
        : getUser.NoOfOrder + getUser.prevNoOfOrder == 1
        ? 10
        : getUser.NoOfOrder + getUser.prevNoOfOrder == 2
        ? 15
        : 0;
    // console.log(
    //     getSettings?.refferalPointsOnOff,
    //     eligible,
    //     refferalDiscountPercent
    // );

    res.status(200).json({
      message: "ok",
      data: {
        refferalStatus: getSettings?.refferalPointsOnOff,
        eligible,
        refferalDiscountPercent,
      },
    });
  } catch (err) {
    if (err) {
      errorLogger.error(err, "\n", "\n");
      res.status(500).json({ message: "error", error: err });
    }
  }
};

module.exports.getTotalNumberOrder = function (req, res) {
  bookingDataBase
    .find()
    .count()
    .exec(function (err, All) {
      bookingDataBase
        .find({
          $or: [
            {
              BookingStatusByAdmin: "Pending",
              payment: "Pending",
              paymentmethod: "COD",
              qtyReduce: true,
            },
            {
              BookingStatusByAdmin: "Pending",
              payment: "Pending",
              paymentmethod: "cod",
              qtyReduce: true,
            },
            {
              BookingStatusByAdmin: "Pending",
              payment: "Complete",
              paymentmethod: "Paytm",
              qtyReduce: true,
            },
            {
              BookingStatusByAdmin: "Pending",
              payment: "Complete",
              paymentmethod: "paytm",
              qtyReduce: true,
            },
            {
              BookingStatusByAdmin: "Pending",
              payment: "Pending",
              paymentmethod: "credit",
              qtyReduce: true,
            },
            {
              BookingStatusByAdmin: "Pending",
              payment: "Pending",
              paymentmethod: "Credit",
              qtyReduce: true,
            },
            {
              BookingStatusByAdmin: "Pending",
              payment: "Pending",
              paymentmethod: "wallet",
              qtyReduce: true,
            },
            {
              BookingStatusByAdmin: "Pending",
              payment: "Pending",
              paymentmethod: "Wallet",
              qtyReduce: true,
            },
            {
              BookingStatusByAdmin: "Pending",
              payment: "Complete",
              paymentmethod: "Wallet",
              qtyReduce: true,
            },
            {
              BookingStatusByAdmin: "Pending",
              payment: "Complete",
              paymentmethod: "wallet",
              qtyReduce: true,
            },
            {
              BookingStatusByAdmin: "Pending",
              payment: "Complete",
              paymentmethod: "Razorpay",
              qtyReduce: true,
            },
          ],
        })
        .count()
        .exec(function (err, Pending) {
          bookingDataBase
            .find({ BookingStatusByAdmin: "Accepted" })
            .count()
            .exec(function (err, Accepted) {
              bookingDataBase
                .find({ BookingStatusByAdmin: "Rejected" })
                .count()
                .exec(function (err, Rejected) {
                  bookingDataBase
                    .find({
                      BookingStatusByAdmin: "Out For Delivery",
                    })
                    .count()
                    .exec(function (err, OutForDelivery) {
                      bookingDataBase
                        .find({
                          BookingStatusByAdmin: "Delivered",
                        })
                        .count()
                        .exec(function (err, Delivered) {
                          bookingDataBase
                            .find({
                              BookingStatusByAdmin: "Delivered",
                              payment: "Payment_Pending",
                            })
                            .count()
                            .exec(function (err, Payment_Pending) {
                              bookingDataBase
                                .find({
                                  BookingStatusByAdmin: "Delivered",
                                  payment: "Credit_Payment_Pending",
                                })
                                .count()
                                .exec(function (err, Credit_Payment_Pending) {
                                  bookingDataBase
                                    .find({
                                      $and: [
                                        {
                                          $or: [
                                            {
                                              BookingStatusByAdmin: "Failed",
                                              payment: "Failed",
                                              qtyReduce: false,
                                            },
                                            {
                                              BookingStatusByAdmin: "failed",
                                              payment: "Failed",
                                              qtyReduce: false,
                                            },
                                            {
                                              BookingStatusByAdmin: "Pending",
                                              payment: "Pending",
                                              qtyReduce: false,
                                            },
                                            {
                                              BookingStatusByAdmin: "Pending",
                                              payment: "Failed",
                                              qtyReduce: false,
                                            },
                                            {
                                              BookingStatusByAdmin: "Pending",
                                              payment: "Complete",
                                              qtyReduce: false,
                                            },
                                            {
                                              BookingStatusByAdmin: "Pending",
                                              payment: "Failed",
                                              qtyReduce: false,
                                              paymentmethod: "Razorpay",
                                            },
                                          ],
                                        },
                                        {
                                          paymentmethod: {
                                            $in: ["Paytm", "Razorpay"],
                                          },
                                          bookingMode: "online",
                                        },
                                      ],
                                    })
                                    .count()
                                    .exec(function (err, Payment_failed) {
                                      if (err) {
                                        res.status(500).json(err);
                                      } else {
                                        res.status(200).json({
                                          message: "ok",
                                          All: All,
                                          Pending: Pending,
                                          Accepted: Accepted,
                                          Rejected: Rejected,
                                          OutForDelivery: OutForDelivery,
                                          Payment_Pending: Payment_Pending,
                                          Credit_Payment_Pending: Credit_Payment_Pending,
                                          Delivered: Delivered,
                                          Payment_failed: Payment_failed,
                                          code: 1,
                                        });
                                      }
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};

// module.exports.getAllBooking = function (req, res) {
//   var skip = req.body.skip;
//   var limit = req.body.limit;
//   var listStatus = req.body.listStatus;

//   if (listStatus == "" || !listStatus || listStatus == undefined || listStatus == null) {
//     common.formValidate("listStatus", res);
//     return false;
//   }

//   if (req.body.userName) {
//     var userName = req.body.userName;
//   }
//   if (req.body.userEmail) {
//     var userEmail = req.body.userEmail;
//   }
//   if (req.body.userMobile) {
//     var userMobile = parseInt(req.body.userMobile);
//   }
//   if (req.body.bookingMode) {
//     var bookingMode = req.body.bookingMode;
//   }
//   if (req.body.booking_code) {
//     var booking_code = req.body.booking_code;
//   }
//   if (req.body.total_payment) {
//     // console.log("jjjjjjjjjjjjjjjjjjj", req.body.total_payment);
//     var total_payment = parseInt(req.body.total_payment);
//   }
//   if (req.body.paymentmethod) {
//     var paymentmethod = req.body.paymentmethod;
//   }
//   if (req.body.date) {
//     var date = req.body.date;
//     var to_date1 = new Date(date);
//     to_date1.setDate(to_date1.getDate() + 1);
//   }

//   var DataFilter = {};

//   if (listStatus == "Payment_failed") {
//     DataFilter["payment"] = {
//       $in: ["Failed", "Pending", "failed", "Complete"],
//     };
//     DataFilter["paymentmethod"] = {
//       $in: ["Paytm", "Razorpay"],
//     };
//     DataFilter["qtyReduce"] = { $eq: false };
//   } else if (listStatus == "All") {
//   } else if (listStatus == "Payment_Pending" || listStatus == "credit_payment") {
//     if (listStatus == "Payment_Pending") {
//       // console.log('Payment_Pending')
//       DataFilter["BookingStatusByAdmin"] = "Delivered";
//       DataFilter["payment"] = "Payment_Pending";
//     }
//     if (listStatus == "credit_payment") {
//       //console.log('credit_payment')
//       DataFilter["BookingStatusByAdmin"] = "Delivered";
//       DataFilter["payment"] = "Credit_Payment_Pending";
//     }
//   } else if (listStatus === "Pending") {
//     var DataFilterPending = {
//       $or: [
//         {
//           BookingStatusByAdmin: "Pending",
//           payment: "Pending",
//           paymentmethod: "COD",
//           qtyReduce: true,
//         },
//         {
//           BookingStatusByAdmin: "Pending",
//           payment: "Pending",
//           paymentmethod: "cod",
//           qtyReduce: true,
//         },
//         {
//           BookingStatusByAdmin: "Pending",
//           payment: "Complete",
//           paymentmethod: "Paytm",
//           qtyReduce: true,
//         },
//         {
//           BookingStatusByAdmin: "Pending",
//           payment: "Complete",
//           paymentmethod: "paytm",
//           qtyReduce: true,
//         },
//         {
//           BookingStatusByAdmin: "Pending",
//           payment: "Pending",
//           paymentmethod: "credit",
//           qtyReduce: true,
//         },
//         {
//           BookingStatusByAdmin: "Pending",
//           payment: "Pending",
//           paymentmethod: "Credit",
//           qtyReduce: true,
//         },
//         {
//           BookingStatusByAdmin: "Pending",
//           payment: "Pending",
//           paymentmethod: "wallet",
//           qtyReduce: true,
//         },
//         {
//           BookingStatusByAdmin: "Pending",
//           payment: "Pending",
//           paymentmethod: "Wallet",
//           qtyReduce: true,
//         },
//         {
//           BookingStatusByAdmin: "Pending",
//           payment: "Complete",
//           paymentmethod: "Wallet",
//           qtyReduce: true,
//         },
//         {
//           BookingStatusByAdmin: "Pending",
//           payment: "Complete",
//           paymentmethod: "Razorpay",
//           qtyReduce: true,
//         },
//       ],
//     };
//   } else {
//     DataFilter["BookingStatusByAdmin"] = listStatus;
//   }

//   if (userName) {
//     DataFilter["userName"] = { $regex: userName, $options: "i" };
//   }
//   if (userEmail) {
//     DataFilter["userEmail"] = { $regex: userEmail, $options: "i" };
//   }
//   if (req.body.userMobile) {
//     DataFilter["$where"] = `/^${req.body.userMobile}.*/.test(this.userMobile)`;
//   }
//   if (bookingMode) {
//     DataFilter["bookingMode"] = bookingMode;
//   }
//   if (req.body.billType) {
//     DataFilter["billType"] = req.body.billType;
//   }
//   if (req.body.billingCompany) {
//     DataFilter["billingCompany"] = req.body.billingCompany;
//   }
//   if (booking_code) {
//     DataFilter["booking_code"] = { $regex: booking_code, $options: "i" };
//   }
//   if (total_payment) {
//     DataFilter["$where"] = `/^${total_payment}.*/.test(this.total_payment)`;
//   }
//   if (paymentmethod) {
//     DataFilter["paymentmethod"] = { $regex: paymentmethod, $options: "i" };
//   }
//   if (req.body.driver_id) {
//     DataFilter["driver_id"] = req.body.driver_id;
//   }
//   if (req.body.razorpay_orderid) {
//     DataFilter["razorpay_orderid"] = {
//       $regex: req.body.razorpay_orderid,
//       $options: "i",
//     };
//   }
//   if (date) {
//     DataFilter["createDate"] = {
//       $gte: new Date(date),
//       $lte: new Date(to_date1),
//     };
//   }
//   // console.log(req.body);
//   // console.log('DataFilter ',DataFilter);
//   if (listStatus == "All") {
//     // console.log("%%%%%%%%%% 2 ", DataFilter);
//     bookingDataBase
//       .find(DataFilter)
//       .count()
//       .exec(function (err, count) {
//         bookingDataBase
//           .find(DataFilter)
//           .populate("user_id")
//           .populate("billingCompany")
//           .populate("driver_id")
//           .skip(skip)
//           .limit(limit)
//           .sort({ counter: "desc" })
//           .lean()
//           .exec(function (err, data) {
//             if (err) {
//               errorLogger.error(err, "\n", "\n");
//               // console.log(err)
//               res.status(500).json(err);
//             } else {
//               // console.log("%%%%%%%%%%%%%%%%%", count);
//               data.forEach((doc) => {
//                 if (doc.payment == "Pending" && doc.paymentmethod == "Paytm") {
//                   doc.BookingStatusByAdmin = "Failed";
//                 }
//               });
//               res.status(200).json({
//                 message: "ok",
//                 data: data,
//                 count: count,
//                 code: 1,
//               });
//             }
//           });
//       });
//   } else if (listStatus === "Pending") {
//     bookingDataBase
//       .find(DataFilterPending)
//       .count()
//       .exec(function (err, count) {
//         bookingDataBase
//           .find(DataFilterPending)
//           .populate("user_id")
//           .populate("driver_id")
//           .skip(skip)
//           .limit(limit)
//           .sort({ counter: "desc" })
//           .exec(function (err, data) {
//             if (err) {
//               errorLogger.error(err, "\n", "\n");
//               //console.log(err)
//               res.status(500).json(err);
//             } else {
//               res.status(200).json({
//                 message: "ok",
//                 data: data,
//                 count: count,
//                 code: 1,
//               });
//             }
//           });
//       });
//   } else {
//     bookingDataBase
//       .find(DataFilter)
//       .count()
//       .exec(function (err, count) {
//         bookingDataBase
//           .find(DataFilter)
//           .populate("user_id")
//           .populate("driver_id")
//           .skip(skip)
//           .limit(limit)
//           .sort({ counter: "desc" })
//           .exec(function (err, data) {
//             if (err) {
//               errorLogger.error(err, "\n", "\n");
//               //console.log(err)
//               res.status(500).json(err);
//             } else {
//               res.status(200).json({
//                 message: "ok",
//                 data: data,
//                 count: count,
//                 code: 1,
//               });
//             }
//           });
//       });
//   }
// };

module.exports.getAllBooking =async function (req, res) {
  var skip = req.body.skip;
  var limit = req.body.limit;
  var listStatus = req.body.listStatus;

  if (listStatus == "" || !listStatus || listStatus == undefined || listStatus == null) {
    common.formValidate("listStatus", res);
    return false;
  }

  if (req.body.userName) {
    var userName = req.body.userName;
  }
  if (req.body.userEmail) {
    var userEmail = req.body.userEmail;
  }
  if (req.body.userMobile) {
    var userMobile = parseInt(req.body.userMobile);
  }
  if (req.body.bookingMode) {
    var bookingMode = req.body.bookingMode;
  }
  if (req.body.booking_code) {
    var booking_code = req.body.booking_code;
  }
  if (req.body.total_payment) {
    // console.log("jjjjjjjjjjjjjjjjjjj", req.body.total_payment);
    var total_payment = parseInt(req.body.total_payment);
  }
  if (req.body.paymentmethod) {
    var paymentmethod = req.body.paymentmethod;
  }
  if (req.body.date) {
    var date = req.body.date;
    var to_date1 = new Date(date);
    to_date1.setDate(to_date1.getDate() + 1);
  }

  var DataFilter = {};
// DataFilter["user_id.sales_person?._id"] = "63356f19dfe26cb7d48c9fea"
if(req.body.sales_person){
let user_list = await User.find({sales_person:req.body.sales_person}).select("_id");
let ids_of_users = []
for (let s of user_list){
	ids_of_users.push(s._id)
}
DataFilter["user_id"] = {
	$in: ids_of_users
}
}
  if (listStatus == "Payment_failed") {
    DataFilter["payment"] = {
      $in: ["Failed", "Pending", "failed", "Complete"],
    };
    DataFilter["paymentmethod"] = {
      $in: ["Paytm", "Razorpay"],
    };
    DataFilter["qtyReduce"] = { $eq: false };
  } else if (listStatus == "All") {
  } else if (listStatus == "Payment_Pending" || listStatus == "credit_payment") {
    if (listStatus == "Payment_Pending") {
      // console.log('Payment_Pending')
      DataFilter["BookingStatusByAdmin"] = "Delivered";
      DataFilter["payment"] = "Payment_Pending";
    }
    if (listStatus == "credit_payment") {
      //console.log('credit_payment')
      DataFilter["BookingStatusByAdmin"] = "Delivered";
      DataFilter["payment"] = "Credit_Payment_Pending";
    }
  } else if (listStatus === "Pending") {
    var DataFilterPending = {
      $or: [
        {
          BookingStatusByAdmin: "Pending",
          payment: "Pending",
          paymentmethod: "COD",
          qtyReduce: true,
        },
        {
          BookingStatusByAdmin: "Pending",
          payment: "Pending",
          paymentmethod: "cod",
          qtyReduce: true,
        },
        {
          BookingStatusByAdmin: "Pending",
          payment: "Complete",
          paymentmethod: "Paytm",
          qtyReduce: true,
        },
        {
          BookingStatusByAdmin: "Pending",
          payment: "Complete",
          paymentmethod: "paytm",
          qtyReduce: true,
        },
        {
          BookingStatusByAdmin: "Pending",
          payment: "Pending",
          paymentmethod: "credit",
          qtyReduce: true,
        },
        {
          BookingStatusByAdmin: "Pending",
          payment: "Pending",
          paymentmethod: "Credit",
          qtyReduce: true,
        },
        {
          BookingStatusByAdmin: "Pending",
          payment: "Pending",
          paymentmethod: "wallet",
          qtyReduce: true,
        },
        {
          BookingStatusByAdmin: "Pending",
          payment: "Pending",
          paymentmethod: "Wallet",
          qtyReduce: true,
        },
        {
          BookingStatusByAdmin: "Pending",
          payment: "Complete",
          paymentmethod: "Wallet",
          qtyReduce: true,
        },
        {
          BookingStatusByAdmin: "Pending",
          payment: "Complete",
          paymentmethod: "Razorpay",
          qtyReduce: true,
        },
      ],
    };
  } else {
    DataFilter["BookingStatusByAdmin"] = listStatus;
  }

  if (userName) {
    DataFilter["userName"] = { $regex: userName, $options: "i" };
  }
  if (userEmail) {
    DataFilter["userEmail"] = { $regex: userEmail, $options: "i" };
  }
  if (req.body.userMobile) {
    DataFilter["$where"] = `/^${req.body.userMobile}.*/.test(this.userMobile)`;
  }
  if (bookingMode) {
    DataFilter["bookingMode"] = bookingMode;
  }
  if (req.body.billType) {
    DataFilter["billType"] = req.body.billType;
  }
  if (req.body.billingCompany) {
    DataFilter["billingCompany"] = req.body.billingCompany;
  }
  if (booking_code) {
    DataFilter["booking_code"] = { $regex: booking_code, $options: "i" };
  }
  if (total_payment) {
    DataFilter["$where"] = `/^${total_payment}.*/.test(this.total_payment)`;
  }
  if (paymentmethod) {
    DataFilter["paymentmethod"] = { $regex: paymentmethod, $options: "i" };
  }
  if (req.body.driver_id) {
    DataFilter["driver_id"] = req.body.driver_id;
  }
  if (req.body.razorpay_orderid) {
    DataFilter["razorpay_orderid"] = {
      $regex: req.body.razorpay_orderid,
      $options: "i",
    };
  }
  if (date) {
    DataFilter["createDate"] = {
      $gte: new Date(date),
      $lte: new Date(to_date1),
    };
  }
  // console.log(req.body);
  // console.log('DataFilter ',DataFilter);
  if (listStatus == "All") {
    // console.log("%%%%%%%%%% 2 ", DataFilter);
    bookingDataBase
      .find(DataFilter)
      .count()
      .exec(function (err, count) {
        bookingDataBase
          .find(DataFilter)
          .populate("user_id")
          .populate("billingCompany")
          .populate("driver_id")
          .populate({
            path: 'user_id',
            populate: {
              path: 'sales_person',
              model: 'admin'
            } 
         })
          .skip(skip)
          .limit(limit)
          .sort({ counter: "desc" })
          .lean()
          .exec(function (err, data) {
            if (err) {
              errorLogger.error(err, "\n", "\n");
               console.log(err)
              res.status(500).json(err);
            } else {
              // console.log("%%%%%%%%%%%%%%%%%", count);
              data.forEach((doc) => {
                if (doc.payment == "Pending" && doc.paymentmethod == "Paytm") {
                  doc.BookingStatusByAdmin = "Failed";
                }
              });
              res.status(200).json({
                message: "ok",
                data: data,
                count: count,
                code: 1,
              });
            }
          });
      });
  } else if (listStatus === "Pending") {
    bookingDataBase
      .find(DataFilterPending)
      .count()
      .exec(function (err, count) {
        bookingDataBase
          .find(DataFilterPending)
          .populate("user_id")
          .populate("driver_id")
          .populate({
            path: 'user_id',
            populate: {
              path: 'sales_person',
              model: 'admin'
            } 
         })
          .skip(skip)
          .limit(limit)
          .sort({ counter: "desc" })
          .exec(function (err, data) {
            if (err) {
              errorLogger.error(err, "\n", "\n");
              //console.log(err)
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
  } else {
    bookingDataBase
      .find(DataFilter)
      .count()
      .exec(function (err, count) {
        bookingDataBase
          .find(DataFilter)
          .populate("user_id")
          .populate("driver_id")
          .populate({
            path: 'user_id',
            populate: {
              path: 'sales_person',
              model: 'admin'
            } 
         })
          .skip(skip)
          .limit(limit)
          .sort({ counter: "desc" })
          .exec(function (err, data) {
            if (err) {
              errorLogger.error(err, "\n", "\n");
              //console.log(err)
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
  }
};
module.exports.getOneBooking = function (req, res) {
  var booking_id = req.body.booking_id;
  if (booking_id == "" || !booking_id || booking_id == undefined || booking_id == null) {
    common.formValidate("booking_id", res);
    return false;
  }

  bookingDataBase
    .find({ _id: booking_id })
    .populate("user_id")
    .exec(function (err, data) {
      if (err) {
        res.status(500).json(err);
      } else if (!data) {
        res.status(400).json({
          message: "error",
          data: user_id,
          code: 0,
        });
      }
      res.status(200).json({ message: "ok", data: data, code: 1 });
    });
};

module.exports.getUserBooking = function (req, res) {
  var user_id = req.decoded.ID;

  var skip = 0;
  var limit = 0;
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

  // if (user_id == "" || !user_id || user_id == undefined || user_id == null) {
  //   common.formValidate("user_id", res);
  //   return false;
  // }

  bookingDataBase
    .find({ user_id: user_id })
    .count()
    .exec(function (err, count) {
      console.log("nnnnn count = ", count);
      if (count == 0) {
        return res.status(400).json({
          message: "error",
          data: [],
          count: 0,
          code: 0,
        });
      }
      bookingDataBase
        .find({ user_id: user_id })
        .populate("user_id")
        // .populate('bookingdetail.product_cat_id')
        .populate("driver_id")
        .skip(skip)
        .limit(limit)
        .sort({ counter: "desc" })
        .lean()
        .exec(function (err, data) {
          if (err) {
            res.status(500).json(err);
          } else if (!data) {
            return res.status(400).json({
              message: "error",
              data: user_id,
              code: 0,
            });
          } else {
            data.forEach((doc) => {
              if (doc.payment == "Pending" && doc.paymentmethod == "Paytm") {
                doc.BookingStatusByAdmin = "Failed";
              }
            });
            return res.status(200).json({
              message: "ok",
              data: data,
              count: count,
              code: 1,
            });
          }
        });
    });
};

module.exports.UpdateBookingStatus = async function (req, res) {
  var booking_id = req.body.booking_id;
  var user_id = req.body.user_id;
  var BookingStatusByAdmin = req.body.BookingStatusByAdmin;
  var DeliveryDate = req.body.DeliveryDate;
  var adminID = req.body.adminID;
  if (user_id == "" || !user_id || user_id == undefined || user_id == null) {
    common.formValidate("user_id", res);
    return false;
  }
  if (booking_id == "" || !booking_id || booking_id == undefined || booking_id == null) {
    common.formValidate("booking_id", res);
    return false;
  }
  if (BookingStatusByAdmin == "" || !BookingStatusByAdmin || BookingStatusByAdmin == undefined || BookingStatusByAdmin == null) {
    common.formValidate("BookingStatusByAdmin", res);
    return false;
  }
  if (adminID == "" || !adminID || adminID == undefined || adminID == null) {
    common.formValidate("adminID", res);
    return false;
  }
  if (BookingStatusByAdmin == "Accepted") {
    var dlvrDate = moment.utc(req.body.DeliveryDate);
    var dlvrDate = dlvrDate.format("YYYY-MM-DD");
    var DeliveryDate = dlvrDate;
  } else {
    var DeliveryDate = null;
  }

  let adminData = await Admin.findOne({
    _id: mongoose.Types.ObjectId(adminID),
  }).lean();

  bookingDataBase.findOne({ _id: booking_id }).exec(function (err, BookingData) {
    if (err) {
      errorLogger.error(err, "\n", "\n");
      res.status(404).json({ message: "err", data: err, code: 0 });
      return;
    } else if (!BookingData) {
      res.status(404).json({
        message: "id not found in the database",
        data: "",
        code: 0,
      });
      return;
    }
    // console.log("@@@@@@@@@@@@@@@@@@@@ @@@ BookingData", new Date(BookingData.createDate).getTime(), new Date(DeliveryDate).getTime());
    // return;

    var createDate = new Date(BookingData.createDate);
    createDate.setHours(0, 0, 0, 0);
    var createDate1 = new Date(createDate);

    var DeliveryDate11 = new Date(DeliveryDate);
    DeliveryDate11.setHours(0, 0, 0, 0);
    var DeliveryDate1 = new Date(DeliveryDate11);

    if (BookingStatusByAdmin == "Accepted" && +DeliveryDate1 < +createDate1) {
      return res.status(404).json({
        message: "Delivery Date should be greater than Order Date",
        data: "",
        code: 0,
      });
    }

    var updateData = {
      BookingStatusByAdmin: BookingStatusByAdmin,
      //BookingStatusByAdmin: "Pending",
      BookingStatusByAdminID: adminID,
      DeliveryDate: DeliveryDate,
    };
    User.findOne({ _id: user_id }).exec(function (err, userData) {
      bookingDataBase.update({ _id: booking_id }, { $set: updateData }, async function (err, UpdatedData) {
        if (err) {
          res.status(500).json({
            message: "",
            data: err,
            code: 0,
          });
        } else {
          var LoyalityProgramHistoryPoint = await LoyalityProgramHistory.findOne({
            user_id: user_id,
            orderID: booking_id,
            pointStatus: "Added",
          }).lean();
          bookingDataBase.findOne({ _id: booking_id }).exec(async function (err, BookingData) {
            //
            // change date status in subscription dates array
            if (BookingData.subscriptionID) {
              let date = BookingData.DeliveryDate;

              let SubscriptionData = await Subscription.findOne({
                _id: BookingData.subscriptionID,
              }).lean();

              SubscriptionData.dates.forEach((subDate) => {
                if (new Date(subDate.date).toDateString() == new Date(date).toDateString()) {
                  subDate.status = BookingStatusByAdmin;
                }
              });

              await Subscription.updateOne({ _id: BookingData.subscriptionID }, { $set: { dates: SubscriptionData.dates } }, { new: true });
            }

            var dlvrDate = moment.utc(DeliveryDate);
            var dlvrDate = dlvrDate.format("DD-MM-YYYY");
            var bookingID = BookingData.booking_code;
            var point = Math.round(Number(LoyalityProgramHistoryPoint ? LoyalityProgramHistoryPoint.point : 0));

            if (BookingStatusByAdmin == "Accepted") {
              orderStatusLogs.info(
                `${bookingID} has been moved from "Pending" to "Accepted" by ${adminData.username} (${adminData.mobile})--(UpdateBookingStatus API)`
              );
              var mobileMsg =
                "Thank you for ordering at Krishi Cress. Your order " +
                bookingID +
                " has been accepted. It will be delivered to you on " +
                dlvrDate +
                ". Questions? Get in touch with us at +919667066462 or email us.";
            } else {
              orderStatusLogs.info(
                `${bookingID} has been moved from "Pending" to "Rejected" by ${adminData.username} (${adminData.mobile})--(UpdateBookingStatus API)`
              );
              //var bookingID = BookingData._id;
              await common.reverseQtyToInventory(booking_id);
              await User.updateOne({ _id: user_id }, { $inc: { creditUsed: -BookingData.total_payment } });

              var mobileMsg =
                "Thank you for ordering at Krishi Cress. Your order " +
                bookingID +
                " has been rejected. Questions? Get in touch with us at +919667066462 or email us.";
            }

            let notifs = await OnOffDataBase.findOne({}).lean();
            let selectednotifs = BookingStatusByAdmin == "Accepted" ? notifs?.order_accepted : notifs?.order_rejected;

            var contactNumber = userData.contactNumber;
            if (BookingStatusByAdmin == "Accepted" && selectednotifs?.sms) {
              common.sendOtp(contactNumber, mobileMsg);
            }
            if (selectednotifs?.user_email) {
              let template_name = BookingStatusByAdmin == "Accepted" ? "order accepted mail to user" : "order rejected mail to user";
              var keys = {
                userName: common.toTitleCase(userData.name),
                bookingId: bookingID,
                dlvrDate: dlvrDate,
                Loyalty_Points: point ? point : 0,
                type: "user",
                template_name: template_name,
                userEmail: userData.email,
              };
              common.dynamicEmail(keys);
            }

            let users = await Admin.find({ user_role: { $in: selectednotifs?.admin_roles } }, { username: 1, email: 1 }).lean();

            if (selectednotifs?.admin_email) {
              users.forEach((user) => {
                let template_name = BookingStatusByAdmin == "Accepted" ? "order accepted mail to admin" : "order rejected mail to admin";
                var keys = {
                  userName: common.toTitleCase(userData.name),
                  bookingId: bookingID,
                  dlvrDate: dlvrDate,
                  type: "admin",
                  template_name: template_name,
                  userEmail: userData.email,
                  adminEmail: user.email,
                  adminName: user.username,
                };
                common.dynamicEmail(keys);
              });
            }

            return res.status(200).json({
              message: "ok",
              data: "order updated",
              code: 1,
            });
          });
        }
      });
    });
  });
};

module.exports.BulkUpdateBookingStatus = async function (req, res) {
  var arrayData = req.body.arrayData;
  var BookingStatusByAdmin = req.body.BookingStatusByAdmin;
  var DeliveryDate = req.body.DeliveryDate;
  var adminID = req.body.adminID;

  if (arrayData == "" || !arrayData || arrayData == undefined || arrayData == null) {
    common.formValidate("arrayData", res);
    return false;
  }
  if (BookingStatusByAdmin == "" || !BookingStatusByAdmin || BookingStatusByAdmin == undefined || BookingStatusByAdmin == null) {
    common.formValidate("BookingStatusByAdmin", res);
    return false;
  }
  if (adminID == "" || !adminID || adminID == undefined || adminID == null) {
    common.formValidate("adminID", res);
    return false;
  }

  if (BookingStatusByAdmin == "Accepted") {
    var dlvrDate = moment.utc(req.body.DeliveryDate);
    var dlvrDate = dlvrDate.format("YYYY-MM-DD");
    var DeliveryDate = dlvrDate;
  } else {
    var DeliveryDate = null;
  }

  let adminData = await Admin.findOne({
    _id: mongoose.Types.ObjectId(adminID),
  }).lean();

  for (var i = 0; i < arrayData.length; i++) {
    var element = arrayData[i];
    var BookingData = await bookingDataBase.findOne({ _id: element.booking_id }).lean();
    var userData = await User.findOne({ _id: element.user_id }).lean();
    var updateData = {
      BookingStatusByAdmin: BookingStatusByAdmin,
      //BookingStatusByAdmin: "Pending",
      BookingStatusByAdminID: adminID,
      DeliveryDate: DeliveryDate,
    };

    var UpdatedData = await bookingDataBase.update({ _id: element.booking_id }, { $set: updateData });
    {
      var LoyalityProgramHistoryPoint = await LoyalityProgramHistory.findOne({
        user_id: element.user_id,
        orderID: element.booking_id,
        pointStatus: "Added",
      }).lean();

      var dlvrDate = moment.utc(DeliveryDate);
      var dlvrDate = dlvrDate.format("DD-MM-YYYY");
      var bookingID = BookingData.booking_code;
      var point = Math.round(Number(LoyalityProgramHistoryPoint ? LoyalityProgramHistoryPoint.point : 0));

      if (BookingStatusByAdmin == "Accepted") {
        orderStatusLogs.info(
          `${bookingID} has been moved from "Pending" to "Accepted" by ${adminData.username} (${adminData.mobile})--(BulkUpdateBookingStatus API)`
        );
        var mobileMsg =
          "Thank you for ordering at Krishi Cress. Your order " +
          bookingID +
          " has been accepted. It will be delivered to you on " +
          dlvrDate +
          ". Questions? Get in touch with us at +919667066462 or email us.";
      } else {
        orderStatusLogs.info(
          `${bookingID} has been moved from "Pending" to "Rejected" by ${adminData.username} (${adminData.mobile})--(BulkUpdateBookingStatus reject case API)`
        );
        await common.reverseQtyToInventory(element.booking_id);
        var mobileMsg =
          "Thank you for ordering at Krishi Cress. Your order " +
          bookingID +
          " has been rejected. Questions? Get in touch with us at +919667066462 or email us.";
      }

      let notifs = await OnOffDataBase.findOne({}).lean();
      let selectednotifs = BookingStatusByAdmin == "Accepted" ? notifs?.order_accepted : notifs?.order_rejected;

      var contactNumber = userData.contactNumber;
      if (BookingStatusByAdmin == "Accepted" && selectednotifs?.sms) {
        common.sendOtp(contactNumber, mobileMsg);
      }
      if (selectednotifs?.user_email) {
        let template_name = BookingStatusByAdmin == "Accepted" ? "order accepted mail to user" : "order rejected mail to user";
        var keys = {
          userName: common.toTitleCase(userData.name),
          bookingId: bookingID,
          dlvrDate: dlvrDate,
          Loyalty_Points: point ? point : 0,
          type: "user",
          template_name: template_name,
          userEmail: userData.email,
        };
        common.dynamicEmail(keys);
      }

      let users = await Admin.find({ user_role: { $in: selectednotifs?.admin_roles } }, { username: 1, email: 1 }).lean();

      if (selectednotifs?.admin_email) {
        users.forEach((user) => {
          let template_name = BookingStatusByAdmin == "Accepted" ? "order accepted mail to admin" : "order rejected mail to admin";
          var keys = {
            userName: common.toTitleCase(userData.name),
            bookingId: bookingID,
            dlvrDate: dlvrDate,
            type: "admin",
            template_name: template_name,
            userEmail: userData.email,
            adminEmail: user.email,
            adminName: user.username,
          };
          common.dynamicEmail(keys);
        });
      }
    }
  }
  return res.status(200).json({
    message: "ok",
    data: "order updated",
    code: 1,
  });
};

module.exports.UpdateDriverDetail = async function (req, res) {
  var booking_id = req.body.booking_id;
  var user_id = req.body.user_id;
  var driver_id = req.body.driver_id;
  var adminID = req.body.adminID;

  if (user_id == "" || !user_id || user_id == undefined || user_id == null) {
    common.formValidate("user_id", res);
    return false;
  }
  if (booking_id == "" || !booking_id || booking_id == undefined || booking_id == null) {
    common.formValidate("booking_id", res);
    return false;
  }
  if (driver_id == "" || !driver_id || driver_id == undefined || driver_id == null) {
    common.formValidate("driver_id", res);
    return false;
  }
  if (adminID == "" || !adminID || adminID == undefined || adminID == null) {
    common.formValidate("adminID", res);
    return false;
  }

  let  driverNumber1 = await settingsModel.findOne({}, { driverNumber: 1 }).lean();
let driverNumber = driverNumber1?.driverNumber
  let adminData = await Admin.findOne({
    _id: mongoose.Types.ObjectId(adminID),
  }).lean();
  bookingDataBase.findOne({ _id: booking_id }).exec(function (err, bookingData) {
    if (err) {
      res.status(404).json({ message: "err", data: err, code: 0 });
      return;
    } else if (!bookingData) {
      res.status(404).json({
        message: "id not found in the database",
        data: "",
        code: 0,
      });
      return;
    }
    //console.log('bookingData ', bookingData)
    User.findOne({ _id: user_id }).exec(function (err, userData) {
      driverDataBase.findOne({ _id: driver_id }).exec(function (err, driverData) {
        var updateData = {
          driver_id: driver_id,
          driverName: driverData.name,
          driverMobile: driverData.mobile,
          driverAddress: driverData.address,
          BookingStatusByAdmin: "Out For Delivery",
          //BookingStatusByAdmin: "Accepted",
          BookingStatusByAdminID: adminID,
        };

        bookingDataBase.update({ _id: booking_id }, { $set: updateData }, async function (err, data) {
          if (err) {
            res.status(500).json({
              message: "",
              data: err,
              code: 0,
            });
          } else {
            orderStatusLogs.info(
              `${bookingData.booking_code} has been moved from "Accepted" to "Out For Delivery" by ${adminData.username} (${adminData.mobile})--(UpdateDriverDetail API)`
            );

            let notifs = await OnOffDataBase.findOne({}).lean();

            var subscription_id = bookingData.subscriptionID;
            if (bookingData.subscriptionID) {
              // console.log("got hereeeeeeeeeeeeee");
              var date = bookingData.DeliveryDate;
              var driverDetails = {
                driver_id: driver_id,
                driver_name: driverData.name,
                driver_email: driverData.email,
                driver_mobile: driverData.mobile,
              };

              var SubscriptionData = await Subscription.findOne({
                _id: subscription_id,
              }).lean();

              var updateData = {
                BookingStatusByAdmin: "Out For Delivery",
                BookingStatusByAdminID: adminID,
              };

              SubscriptionData.dates.forEach((subDate) => {
                if (new Date(subDate.date).toDateString() == new Date(date).toDateString()) {
                  subDate.status = "Out For Delivery";
                  subDate.driverData = driverDetails;
                }
              });

              updateData.dates = SubscriptionData.dates;

              Subscription.updateOne({ _id: subscription_id }, { $set: updateData }, { new: true }, function (err, UpdatedData) {
                if (err) {
                  errorLogger.error(err, "\n", "\n");
                  console.log("got error::::::::::::::: ", err);
                }

                // Your order has been dispatched. It will be delivered by {#var#} {#var#} Questions[specialchar] Contact us at [specialchar]919667066462 or {#var#}. Thank you - Team Krishi Cress

                var message = `Your order has been dispatched. It will be delivered by <span  style='text-transform:capitalize'>##DriverName##</span>(${driverNumber})</p><p>In case of any queries please contact us at +919667066462 or <a href='https://api.whatsapp.com/message/HG67IZESTU7PE1'>WhatsApp Us</a></P>`;

                var mobileMsg =
                  "Your order has been dispatched. It will be delivered by " +
                  driverData.name +
                  " " +
                  driverNumber +
                  " Questions? Contact us at +919667066462 or email us. Thank you - Team Krishi Cress";

                var mobile = userData.contactNumber;
                var email = userData.email;
                var DriverName = driverData.name;
                var DriverMobile = driverData.mobile;
                var bookingId = bookingData.booking_code;
                // var email = "chitra@mailinator.com";
                var name = userData.name;
                var message = message;
                var data = "Order Updated";
                if (notifs?.order_out_for_delivery.sms) {
                  common.sendOtp(mobile, mobileMsg);
                }
                if (notifs?.order_out_for_delivery.user_email) {
                  var keys = {
                    userName: name,
                    DriverName: DriverName,
                    DriverMobile: driverNumber,
                    bookingId: bookingId,
                    type: "user",
                    template_name: "order out for delivery mail to user",
                    userEmail: email,
                  };
                  common.dynamicEmail(keys);
                }

                // notifs?.driver_mail
                if (true) {
                  // driver sms and mail
                  if (bookingData.booking_address.latitude && bookingData.booking_address.longitude) {
                    var Location =
                      "http://www.google.com/maps/place/" + bookingData.booking_address.latitude + "," + bookingData.booking_address.longitude;
                    var LocationUrl = "http://www.google.com/maps/place/";
                    var LocationLat = bookingData.booking_address.latitude;
                    var LocationLong = bookingData.booking_address.longitude;
                  }
                  var FullAddress = common.toTitleCase(
                    bookingData.booking_address.houseNo + " " + bookingData.booking_address.locality + " " + bookingData.booking_address.locationTag
                  );
                  var CityAddress = common.toTitleCase(bookingData.booking_address.city);
                  var countryAddress = common.toTitleCase(bookingData.booking_address.country);
                  //var mobileMsg ='Hello Driver, You have been allotted Krishi Cress Order Number: OrderID45, Customer Name: 8802401227, Delivery Address: locailty city Contact Number: 8802401227, Location : http://www.google.com/maps/place/28.383897,77.279306, Thank you Team Krishi Cress'
                  var mobileMsg =
                    "Hello " +
                    common.toTitleCase(driverData.name) +
                    ", You have been allotted Krishi Cress Order Number: " +
                    bookingData.booking_code +
                    ", Customer Name: " +
                    common.toTitleCase(bookingData.userName.split(" ")[0]) +
                    ", Delivery Address: " +
                    FullAddress +
                    ", Contact Number: " +
                    bookingData.userMobile +
                    ", Location : " +
                    LocationUrl +
                    LocationLat +
                    "," +
                    LocationLong +
                    ", Thank you Team Krishi Cress";
                  var message =
                    "<p style='margin:0px;font-size:14px;color:#323232; font-weight:400;'>You have been allotted Krishi Cress order. Please find below the details.</p><p style='margin:0px;font-size:14px;color:#323232; font-weight:400;padding-top:10px;'><strong>Order Number: </strong> " +
                    bookingData.booking_code +
                    "</p><p style='margin:0px;font-size:14px;color:#323232; font-weight:400;'> <strong>Customer Name: </strong>" +
                    common.toTitleCase(bookingData.userName) +
                    "</p><p style='margin:0px;font-size:14px;color:#323232; font-weight:400;'>  <strong>Contact Number: </strong> " +
                    bookingData.userMobile +
                    "</p><p style='margin:0px;font-size:14px;color:#323232; font-weight:400;'> <strong>Delivery Address: </strong> " +
                    common.toTitleCase(
                      bookingData.booking_address.houseNo + " " + bookingData.booking_address.locality + " " + bookingData.booking_address.locationTag
                    ) +
                    "</p>" +
                    `${
                      bookingData.booking_address.latitude && bookingData.booking_address.longitude
                        ? ` <p><strong> <a href="${Location}"> Click here for Google location.  </a> </strong></p>`
                        : ``
                    }`;

                  var name = driverData.name;
                  var email = driverData.email;
                  var mobile = driverNumber;
                  var subject = "New Delivery Job Assigned";
                  var message = message;
                  var data = "New Delivery Job Assigned";
                  if (notifs?.order_out_for_delivery_sms_to_driver) {
                    common.sendOtp(mobile, mobileMsg);
                  }
                  if (notifs?.order_out_for_delivery_email_to_driver) {
                    common
                      .sendMail(email, subject, name, message, data)
                      .then((info) => {})
                      .catch((err) => {
                        // errorLogger.error(err, "\n", "\n");
                        console.log(err);
                      });
                  }
                  // driver sms and mail ends
                }

                return res.status(200).json({
                  message: "ok",
                  data: "order updated",
                  code: 1,
                });
              });
            } else {
              var mobileMsg =
                "Your order has been dispatched. It will be delivered by " +
                driverData.name +
                " " +
                driverNumber +
                " Questions? Contact us at +919667066462 or email us. Thank you - Team Krishi Cress";

              var mobile = userData.contactNumber;
              var email = userData.email;
              // var email = "chitra@mailinator.com";
              var name = userData.name;
              var DriverName = driverData.name;
              var DriverMobile = driverData.mobile;
              var bookingId = bookingData.booking_code;
              var message = message;
              var data = "Order updated";
              if (notifs?.order_out_for_delivery.sms) {
                common.sendOtp(mobile, mobileMsg);
              }
              if (notifs?.order_out_for_delivery.user_email) {
                var keys = {
                  userName: name,
                  DriverName: DriverName,
                  DriverMobile: driverNumber,
                  bookingId: bookingId,
                  type: "user",
                  template_name: "order out for delivery mail to user",
                  userEmail: email,
                };
                common.dynamicEmail(keys);
              }
              // driver sms and mail
              // notifs?.driver_mail
              if (true) {
                let selectedAddress = bookingData.giftingStatus ? bookingData.giftingAddress : bookingData.booking_address;
                let selectedName = bookingData.giftingStatus ? bookingData.giftingName : bookingData.userName;
                let selectedMobile = bookingData.giftingStatus ? bookingData.giftingContact : bookingData.userMobile;
                if (selectedAddress.latitude && selectedAddress.longitude) {
                  var Location = "http://www.google.com/maps/place/" + selectedAddress.latitude + "," + selectedAddress.longitude;
                  var LocationUrl = "http://www.google.com/maps/place/";
                  var LocationLat = selectedAddress.latitude;
                  var LocationLong = selectedAddress.longitude;
                }
                var FullAddress = common.toTitleCase(selectedAddress.houseNo + " " + selectedAddress.locality + " " + selectedAddress.locationTag);
                var CityAddress = common.toTitleCase(selectedAddress.city);
                var countryAddress = common.toTitleCase(selectedAddress.country);
                //var mobileMsg ='Hello Driver, You have been allotted Krishi Cress Order Number: OrderID45, Customer Name: 8802401227, Delivery Address: locailty city Contact Number: 8802401227, Location : http://www.google.com/maps/place/28.383897,77.279306, Thank you Team Krishi Cress'
                var mobileMsg =
                  "Hello " +
                  common.toTitleCase(driverData.name) +
                  ", You have been allotted Krishi Cress Order Number: " +
                  bookingData.booking_code +
                  ", Customer Name: " +
                  common.toTitleCase(selectedName.split(" ")[0]) +
                  ", Delivery Address: " +
                  FullAddress +
                  ", Contact Number: " +
                  selectedMobile +
                  ", Location : " +
                  LocationUrl +
                  LocationLat +
                  "," +
                  LocationLong +
                  ", Thank you Team Krishi Cress";
                var message =
                  "<p style='margin:0px;font-size:14px;color:#323232; font-weight:400;'>You have been allotted Krishi Cress order. Please find detail below.</p><p style='margin:0px;font-size:14px;color:#323232; font-weight:400;padding-top:10px;'><strong>Order Number: </strong> " +
                  bookingData.booking_code +
                  "</p><p style='margin:0px;font-size:14px;color:#323232; font-weight:400;'> <strong>Customer Name: </strong>" +
                  common.toTitleCase(selectedName) +
                  "</p><p style='margin:0px;font-size:14px;color:#323232; font-weight:400;'>  <strong>Contact Number: </strong> " +
                  selectedMobile +
                  "</p><p style='margin:0px;font-size:14px;color:#323232; font-weight:400;'> <strong>Delivery Address: </strong> " +
                  common.toTitleCase(selectedAddress.houseNo + " " + selectedAddress.locality + " " + selectedAddress.locationTag) +
                  "</p>" +
                  `${
                    selectedAddress.latitude && selectedAddress.longitude
                      ? `<p><strong> <a href="${Location}"> Click here for Google location.  </a> </strong></p>`
                      : ``
                  }`;

                var email = driverData.email;
                var name = driverData.name;
                var mobile = driverNumber;
                var subject = "New Delivery Job Assigned";
                var message = message;
                var data = "New Delivery Job Assigned";
                if (notifs?.order_out_for_delivery_sms_to_driver) {
                  common.sendOtp(mobile, mobileMsg);
                }
                if (notifs?.order_out_for_delivery_email_to_driver) {
                  common.sendMail(email, subject, name, message, data);
                }
              }

              return res.status(200).json({
                message: "ok",
                data: "order updated",
                code: 1,
              });
            }
          }
        });
      });
    });
  });
};

module.exports.BulkUpdateDriverDetail = async function (req, res) {
  var ofdData = req.body.ofdData;
  var driver_id = req.body.driver_id;
  var adminID = req.body.adminID;

  if (driver_id == "" || !driver_id || driver_id == undefined || driver_id == null) {
    common.formValidate("driver_id", res);
    return false;
  }
  if (adminID == "" || !adminID || adminID == undefined || adminID == null) {
    common.formValidate("adminID", res);
    return false;
  }

  let { driverNumber } = await settingsModel.findOne({}, { driverNumber: 1 }).lean();

  let adminData = await Admin.findOne({
    _id: mongoose.Types.ObjectId(adminID),
  }).lean();

  //var ofdData = JSON.parse(req.body.ofdData1)
  for (let i = 0; i < ofdData.length; i++) {
    const element = ofdData[i];
    var bookingData = await bookingDataBase.findOne({ _id: element.booking_id }).lean();
    var userData = await User.findOne({ _id: element.user_id }).lean();
    var driverData = await driverDataBase.findOne({ _id: driver_id }).lean();
    var updateData = {
      driver_id: driver_id,
      driverName: driverData.name,
      driverMobile: driverData.mobile,
      driverAddress: driverData.address,
      BookingStatusByAdmin: "Out For Delivery",
      BookingStatusByAdminID: adminID,
    };
    var data = await bookingDataBase.update({ _id: element.booking_id }, { $set: updateData });
    let notifs = await OnOffDataBase.findOne({}).lean();

    orderStatusLogs.info(
      `${bookingData.booking_code} has been moved from "Accepted" to "Out For Delivery" by ${adminData.username} (${adminData.mobile})--(BulkUpdateDriverDetail API)`
    );

    var subscription_id = bookingData.subscriptionID;
    if (bookingData.subscriptionID) {
      var date = bookingData.DeliveryDate;
      var driverDetails = {
        driver_id: driver_id,
        driver_name: driverData.name,
        driver_email: driverData.email,
        driver_mobile: driverData.mobile,
      };

      var SubscriptionData = await Subscription.findOne({
        _id: subscription_id,
      }).lean();

      var updateData = {
        BookingStatusByAdmin: "Out For Delivery",
        BookingStatusByAdminID: adminID,
      };

      SubscriptionData.dates.forEach((subDate) => {
        if (new Date(subDate.date).toDateString() == new Date(date).toDateString()) {
          subDate.status = "Out For Delivery";
          subDate.driverData = driverDetails;
        }
      });

      updateData.dates = SubscriptionData.dates;

      var UpdatedData = await Subscription.updateOne({ _id: subscription_id }, { $set: updateData }, { new: true });
      var message = `Your order has been dispatched. It will be delivered by <span  style='text-transform:capitalize'>##DriverName##</span>(${driverNumber})</p><p>In case of any queries please contact us at +919667066462 or <a href='https://api.whatsapp.com/message/HG67IZESTU7PE1'>WhatsApp Us</a></P>`;

      var mobileMsg =
        "Your order has been dispatched. It will be delivered by " +
        driverData.name +
        " " +
        driverNumber +
        " Questions? Contact us at +919667066462 or email us. Thank you - Team Krishi Cress";

      var mobile = userData.contactNumber;
      var email = userData.email;
      var DriverName = driverData.name;
      var DriverMobile = driverData.mobile;
      var bookingId = bookingData.booking_code;
      // var email = "chitra@mailinator.com";
      var name = userData.name;
      var message = message;
      var data = "Order Updated";
      if (notifs?.order_out_for_delivery.sms) {
        common.sendOtp(mobile, mobileMsg);
      }
      if (notifs?.order_out_for_delivery.user_email) {
        var keys = {
          userName: name,
          DriverName: DriverName,
          DriverMobile: driverNumber,
          bookingId: bookingId,
          type: "user",
          template_name: "order out for delivery mail to user",
          userEmail: email,
        };
        common.dynamicEmail(keys);
      }

      // notifs?.driver_mail
      if (true) {
        // driver sms and mail
        if (bookingData.booking_address.latitude && bookingData.booking_address.longitude) {
          var Location = "http://www.google.com/maps/place/" + bookingData.booking_address.latitude + "," + bookingData.booking_address.longitude;
          var LocationUrl = "http://www.google.com/maps/place/";
          var LocationLat = bookingData.booking_address.latitude;
          var LocationLong = bookingData.booking_address.longitude;
        }
        var FullAddress = common.toTitleCase(
          bookingData.booking_address.houseNo + " " + bookingData.booking_address.locality + " " + bookingData.booking_address.locationTag
        );
        var CityAddress = common.toTitleCase(bookingData.booking_address.city);
        var countryAddress = common.toTitleCase(bookingData.booking_address.country);
        var mobileMsg =
          "Hello " +
          common.toTitleCase(driverData.name) +
          ", You have been allotted Krishi Cress Order Number: " +
          bookingData.booking_code +
          ", Customer Name: " +
          common.toTitleCase(bookingData.userName.split(" ")[0]) +
          ", Delivery Address: " +
          FullAddress +
          ", Contact Number: " +
          bookingData.userMobile +
          ", Location : " +
          LocationUrl +
          LocationLat +
          "," +
          LocationLong +
          ", Thank you Team Krishi Cress";
        var message =
          "<p style='margin:0px;font-size:14px;color:#323232; font-weight:400;'>You have been allotted Krishi Cress order. Please find below the details.</p><p style='margin:0px;font-size:14px;color:#323232; font-weight:400;padding-top:10px;'><strong>Order Number: </strong> " +
          bookingData.booking_code +
          "</p><p style='margin:0px;font-size:14px;color:#323232; font-weight:400;'> <strong>Customer Name: </strong>" +
          common.toTitleCase(bookingData.userName) +
          "</p><p style='margin:0px;font-size:14px;color:#323232; font-weight:400;'>  <strong>Contact Number: </strong> " +
          bookingData.userMobile +
          "</p><p style='margin:0px;font-size:14px;color:#323232; font-weight:400;'> <strong>Delivery Address: </strong> " +
          common.toTitleCase(
            bookingData.booking_address.houseNo + " " + bookingData.booking_address.locality + " " + bookingData.booking_address.locationTag
          ) +
          "</p>" +
          `${
            bookingData.booking_address.latitude && bookingData.booking_address.longitude
              ? ` <p><strong> <a href="${Location}"> Click here for Google location.  </a> </strong></p>`
              : ``
          }`;

        var name = driverData.name;
        var email = driverData.email;
        var mobile = driverNumber;
        var subject = "New Delivery Job Assigned";
        var message = message;
        var data = "New Delivery Job Assigned";

        // if(notifs?.order_out_for_delivery_sms_to_driver){
        //   common.sendOtp(mobile, mobileMsg);
        // }
        if (notifs?.order_out_for_delivery_email_to_driver) {
          await common.sendMail(email, subject, name, message, data);
        }
        // driver sms and mail ends
      }
    } else {
      var mobileMsg =
        "Your order has been dispatched. It will be delivered by " +
        driverData.name +
        " " +
        driverNumber +
        " Questions? Contact us at +919667066462 or email us. Thank you - Team Krishi Cress";

      var mobile = userData.contactNumber;
      var email = userData.email;
      // var email = "chitra@mailinator.com";
      var name = userData.name;
      var DriverName = driverData.name;
      var DriverMobile = driverData.mobile;
      var bookingId = bookingData.booking_code;
      var message = message;
      var data = "Order updated";
      if (notifs?.order_out_for_delivery.sms) {
        common.sendOtp(mobile, mobileMsg);
      }
      if (notifs?.order_out_for_delivery.user_email) {
        var keys = {
          userName: name,
          DriverName: DriverName,
          DriverMobile: driverNumber,
          bookingId: bookingId,
          type: "user",
          template_name: "order out for delivery mail to user",
          userEmail: email,
        };
        common.dynamicEmail(keys);
      }
      // driver sms and mail
      // notifs?.driver_mail
      if (true) {
        let selectedAddress = bookingData.giftingStatus ? bookingData.giftingAddress : bookingData.booking_address;
        let selectedName = bookingData.giftingStatus ? bookingData.giftingName : bookingData.userName;
        let selectedMobile = bookingData.giftingStatus ? bookingData.giftingContact : bookingData.userMobile;
        if (selectedAddress.latitude && selectedAddress.longitude) {
          var Location = "http://www.google.com/maps/place/" + selectedAddress.latitude + "," + selectedAddress.longitude;
          var LocationUrl = "http://www.google.com/maps/place/";
          var LocationLat = selectedAddress.latitude;
          var LocationLong = selectedAddress.longitude;
        }
        var FullAddress = common.toTitleCase(selectedAddress.houseNo + " " + selectedAddress.locality + " " + selectedAddress.locationTag);
        var CityAddress = common.toTitleCase(selectedAddress.city);
        var countryAddress = common.toTitleCase(selectedAddress.country);
        var mobileMsg =
          "Hello " +
          common.toTitleCase(driverData.name) +
          ", You have been allotted Krishi Cress Order Number: " +
          bookingData.booking_code +
          ", Customer Name: " +
          common.toTitleCase(selectedName.split(" ")[0]) +
          ", Delivery Address: " +
          FullAddress +
          ", Contact Number: " +
          selectedMobile +
          ", Location : " +
          LocationUrl +
          LocationLat +
          "," +
          LocationLong +
          ", Thank you Team Krishi Cress";
        var message =
          "<p style='margin:0px;font-size:14px;color:#323232; font-weight:400;'>You have been allotted Krishi Cress order. Please find detail below.</p><p style='margin:0px;font-size:14px;color:#323232; font-weight:400;padding-top:10px;'><strong>Order Number: </strong> " +
          bookingData.booking_code +
          "</p><p style='margin:0px;font-size:14px;color:#323232; font-weight:400;'> <strong>Customer Name: </strong>" +
          common.toTitleCase(selectedName) +
          "</p><p style='margin:0px;font-size:14px;color:#323232; font-weight:400;'>  <strong>Contact Number: </strong> " +
          selectedMobile +
          "</p><p style='margin:0px;font-size:14px;color:#323232; font-weight:400;'> <strong>Delivery Address: </strong> " +
          common.toTitleCase(selectedAddress.houseNo + " " + selectedAddress.locality + " " + selectedAddress.locationTag) +
          "</p>" +
          `${
            selectedAddress.latitude && selectedAddress.longitude
              ? `<p><strong> <a href="${Location}"> Click here for Google location.  </a> </strong></p>`
              : ``
          }`;
        var email = driverData.email;
        var name = driverData.name;
        var mobile = driverNumber;
        var subject = "New Delivery Job Assigned";
        var message = message;
        var data = "New Delivery Job Assigned";
        if (notifs?.order_out_for_delivery_sms_to_driver) {
          common.sendOtp(mobile, mobileMsg);
        }
        if (notifs?.order_out_for_delivery_email_to_driver) {
          await common.sendMail(email, subject, name, message, data);
        }
      }
    }
  }
  res.status(200).json({
    message: "ok",
    data: "updated",
    code: 0,
  });
  return;
};

module.exports.UpdatePaymentStatus = async function (req, res) {
  //console.log('UpdatePaymentStatus', req.body)
  var booking_id = req.body.booking_id;
  var user_id = req.body.user_id;
  var adminID = req.body.adminID;
  var paymentDateByAdmin = req.body.paymentDateByAdmin;

  if (user_id == "" || !user_id || user_id == undefined || user_id == null) {
    common.formValidate("user_id", res);
    return false;
  }
  if (booking_id == "" || !booking_id || booking_id == undefined || booking_id == null) {
    common.formValidate("booking_id", res);
    return false;
  }
  if (adminID == "" || !adminID || adminID == undefined || adminID == null) {
    common.formValidate("adminID", res);
    return false;
  }
  let adminData = await Admin.findOne({
    _id: mongoose.Types.ObjectId(adminID),
  }).lean();

  bookingDataBase.findOne({ _id: booking_id }).exec(function (err, data) {
    if (err) {
      res.status(404).json({ message: "err", data: err, code: 0 });
      return;
    } else if (!data) {
      res.status(404).json({
        message: "id not found in the database",
        data: "",
        code: 0,
      });
      return;
    }

    var updateData = {
      payment: "Complete",
      //BookingStatusByAdmin: "Out For Delivery",
      BookingStatusByAdmin: "Delivered",
      BookingStatusByAdminID: adminID,
      paymentDateByAdmin,
    };
    User.findOne({ _id: user_id }).exec(function (err, userData) {
      bookingDataBase.update({ _id: booking_id }, { $set: updateData }, function (err, data1) {
        if (err) {
          res.status(500).json({
            message: "",
            data: err,
            code: 0,
          });
        } else {
          orderStatusLogs.info(
            `${data.booking_code} has been moved from "${data.paymentmethod == "Credit" ? "Credit Pending" : "COD Pending"}" to "Completed" by ${
              adminData.username
            } (${adminData.mobile})--(UpdatePaymentStatus API)`
          );
          res.status(200).json({
            message: "ok",
            data: "order updated",
            code: 1,
          });
          return;
        }
      });
    });
  });
};

module.exports.UpdateBalancePaymentStatus = function (req, res) {
  //console.log('UpdatePaymentStatus', req.body)
  var booking_id = req.body.booking_id;
  var user_id = req.body.user_id;
  var adminID = req.body.adminID;

  if (user_id == "" || !user_id || user_id == undefined || user_id == null) {
    common.formValidate("user_id", res);
    return false;
  }
  if (booking_id == "" || !booking_id || booking_id == undefined || booking_id == null) {
    common.formValidate("booking_id", res);
    return false;
  }
  if (adminID == "" || !adminID || adminID == undefined || adminID == null) {
    common.formValidate("adminID", res);
    return false;
  }

  bookingDataBase.findOne({ _id: booking_id }).exec(function (err, data) {
    if (err) {
      res.status(404).json({ message: "err", data: err, code: 0 });
      return;
    } else if (!data) {
      res.status(404).json({
        message: "id not found in the database",
        data: "",
        code: 0,
      });
      return;
    }

    var updateData = {
      balance_paymentStatus: "Complete",
      balance_paymentStatusByAdminID: adminID,
    };
    User.findOne({ _id: user_id }).exec(function (err, userData) {
      bookingDataBase.update({ _id: booking_id }, { $set: updateData }, function (err, data) {
        if (err) {
          res.status(500).json({
            message: "",
            data: err,
            code: 0,
          });
        } else {
          res.status(200).json({
            message: "ok",
            data: "order updated",
            code: 1,
          });
          return;
        }
      });
    });
  });
};

module.exports.UpdateDeliveryStatus = async function (req, res) {
  var booking_id = req.body.booking_id;
  var user_id = req.body.user_id;
  var adminID = req.body.adminID;
  var payment_method = req.body.payment_method;
  var payment_status = req.body.payment_status;
  var paymentDateByAdmin = req.body.paymentDateByAdmin;

  if (user_id == "" || !user_id || user_id == undefined || user_id == null) {
    common.formValidate("user_id", res);
    return false;
  }
  if (booking_id == "" || !booking_id || booking_id == undefined || booking_id == null) {
    common.formValidate("booking_id", res);
    return false;
  }
  if (adminID == "" || !adminID || adminID == undefined || adminID == null) {
    common.formValidate("adminID", res);
    return false;
  }
  let adminData = await Admin.findOne({
    _id: mongoose.Types.ObjectId(adminID),
  }).lean();
  bookingDataBase.findOne({ _id: booking_id }).exec(function (err, bookingData) {
    if (err) {
      res.status(404).json({ message: "err", data: err, code: 0 });
      return;
    } else if (!bookingData) {
      res.status(404).json({
        message: "id not found in the database",
        data: "",
        code: 0,
      });
      return;
    }
    var payment = "Complete";

    if (payment_method == "cod" || payment_method == "COD") {
      if (payment_status == "Pending") {
        var payment = "Payment_Pending";
        paymentDateByAdmin = null;

        orderStatusLogs.info(
          `${bookingData.booking_code} has been moved from "Out For Delivery" to "COD Pending" by ${adminData.username} (${adminData.mobile})--(UpdateDeliveryStatus API)`
        );
      } else {
        var payment = "Complete";
        // paymentDateByAdmin = paymentDateByAdmin;
      }
    }
    if (payment_method == "Credit" || payment_method == "credit") {
      if (payment_status == "Pending") {
        var payment = "Credit_Payment_Pending";
        paymentDateByAdmin = null;

        orderStatusLogs.info(
          `${bookingData.booking_code} has been moved from "Out For Delivery" to "Credit Pending" by ${adminData.username} (${adminData.mobile})--(UpdateDeliveryStatus API)`
        );
      } else {
        var payment = "Complete";
        // paymentDateByAdmin = paymentDateByAdmin;
      }
    }

    if (payment == "Complete") {
      orderStatusLogs.info(
        `${bookingData.booking_code} has been moved from "Out For Delivery" to "Completed" by ${adminData.username} (${adminData.mobile})--(UpdateDeliveryStatus API)`
      );
    }

    var updateData = {
      payment: payment,
      BookingStatusByAdmin: "Delivered",
      //BookingStatusByAdmin: "Out For Delivery",
      BookingStatusByAdminID: adminID,
      paymentDateByAdmin,
    };
    User.findOne({ _id: user_id }).exec(function (err, userData) {
      bookingDataBase.update({ _id: booking_id }, { $set: updateData }, async function (err, data) {
        //console.log(err)
        if (err) {
          errorLogger.error(err, "\n", "\n");
          res.status(500).json({
            message: "",
            data: err,
            code: 0,
          });
        } else {
          // console.log(
          //     "subscriptionID::::::::::::::::::",
          //     bookingData.subscriptionID
          // );

          if (bookingData.paymentmethod == "Credit" && updateData.payment == "Complete") {
            await User.updateOne({ _id: user_id }, { $inc: { creditUsed: -bookingData.total_payment } });
          }

          let notifs = await OnOffDataBase.findOne({}).lean();

          var subscription_id = bookingData.subscriptionID;
          if (bookingData.subscriptionID) {
            var date = bookingData.DeliveryDate;

            var SubscriptionData = await Subscription.findOne({
              _id: subscription_id,
            }).lean();
            // console.log(
            //     "SubscriptionData::::::::::::::::::",
            //     SubscriptionData
            // );

            SubscriptionData.dates.forEach((subDate) => {
              if (new Date(subDate.date).toDateString() == new Date(date).toDateString()) {
                subDate.status = "Delivered";
              } else if (subDate.status == "Out For Delivery") {
                updateData.BookingStatusByAdmin = "Out For Delivery";
              }
            });

            if (updateData.BookingStatusByAdmin !== "Out For Delivery") {
              SubscriptionData.dates.forEach((subDate) => {
                if (subDate.status == "Pending") {
                  updateData.BookingStatusByAdmin = "Accepted";
                }
              });
            }

            updateData.dates = SubscriptionData.dates;
            //console.log('update stattus 444')

            Subscription.updateOne({ _id: subscription_id }, { $set: updateData }, { new: true }, function (err, UpdatedData) {
              //console.log('errssssssssss', err)
              var bookingID = bookingData.booking_code;
              var mobileMsg =
                "Once again thank you for ordering at Krishi Cress. Your order has been delivered. Happy cooking! If you have any feedback or questions, please contact us at +919667066462 or email us";

              var mobile = parseInt(userData.contactNumber);
              var email = userData.email;
              var name = userData.name;
              var message = message;
              var data = "Order updated";
              if (notifs?.order_delivered.sms) {
                common.sendOtp(mobile, mobileMsg);
              }

              if (notifs?.order_delivered.user_email) {
                var keys = {
                  userName: name,
                  type: "user",
                  template_name: "user_Order_Delivered",
                  userEmail: email,
                };
                common.dynamicEmail(keys);
              }
              res.status(200).json({
                message: "ok",
                data: "order updated",
                code: 1,
              });
              return;
            });
          } else {
            var bookingID = bookingData.booking_code;
            var mobileMsg =
              "Once again thank you for ordering at Krishi Cress. Your order has been delivered. Happy cooking! If you have any feedback or questions, please contact us at +919667066462 or email us";

            var mobile = parseInt(userData.contactNumber);
            var email = userData.email;
            var name = userData.name;
            var message = message;
            var data = "Order Updated";
            if (notifs?.order_delivered.sms) {
              common.sendOtp(mobile, mobileMsg);
            }

            if (notifs?.order_delivered.user_email) {
              var keys = {
                userName: name,
                type: "user",
                template_name: "user_Order_Delivered",
                userEmail: email,
              };
              common.dynamicEmail(keys);
            }

            res.status(200).json({
              message: "ok",
              data: "Order Updated",
              code: 1,
            });
            return;
          }
        }
      });
    });
  });
};

module.exports.BulkUpdateDeliveryStatus = async function (req, res) {
  var DeliveryData = req.body.DeliveryData;
  var adminID = req.body.adminID;
  var payment_status = req.body.payment_status;
  var paymentDateByAdmin = req.body.paymentDateByAdmin;

  if (adminID == "" || !adminID || adminID == undefined || adminID == null) {
    common.formValidate("adminID", res);
    return false;
  }
  let adminData = await Admin.findOne({
    _id: mongoose.Types.ObjectId(adminID),
  }).lean();
  for (var i = 0; i < DeliveryData.length; i++) {
    var element = DeliveryData[i];
    var bookingData = await bookingDataBase.findOne({ _id: element.booking_id }).lean();
    var userData = await User.findOne({ _id: element.user_id }).lean();
    var payment = "Complete";
    if (element.payment_method == "cod" || element.payment_method == "COD") {
      if (payment_status == "Pending") {
        payment = "Payment_Pending";
        paymentDateByAdmin = null;

        orderStatusLogs.info(
          `${bookingData.booking_code} has been moved from "Out For Delivery" to "COD Pending" by ${adminData.username} (${adminData.mobile})--(BulkUpdateDeliveryStatus API)`
        );
      } else {
        var payment = "Complete";
      }
    }
    if (element.payment_method == "Credit" || element.payment_method == "credit") {
      if (payment_status == "Pending") {
        payment = "Credit_Payment_Pending";
        paymentDateByAdmin = null;

        orderStatusLogs.info(
          `${bookingData.booking_code} has been moved from "Out For Delivery" to "COD Pending" by ${adminData.username} (${adminData.mobile})--(BulkUpdateDeliveryStatus API)`
        );
      } else {
        payment = "Complete";
      }
    }

    if (payment == "Complete") {
      orderStatusLogs.info(
        `${bookingData.booking_code} has been moved from "Out For Delivery" to "Completed" by ${adminData.username} (${adminData.mobile})--(BulkUpdateDeliveryStatus API)`
      );
    }

    var updateData = {
      payment: payment,
      BookingStatusByAdmin: "Delivered",
      BookingStatusByAdminID: adminID,
      paymentDateByAdmin,
    };

    var data = await bookingDataBase.update({ _id: element.booking_id }, { $set: updateData });
    {
      let notifs = await OnOffDataBase.findOne({}).lean();
      var subscription_id = bookingData.subscriptionID;
      if (bookingData.subscriptionID) {
        var date = bookingData.DeliveryDate;
        var SubscriptionData = await Subscription.findOne({
          _id: subscription_id,
        }).lean();

        SubscriptionData.dates.forEach((subDate) => {
          if (new Date(subDate.date).toDateString() == new Date(date).toDateString()) {
            subDate.status = "Delivered";
          } else if (subDate.status == "Out For Delivery") {
            updateData.BookingStatusByAdmin = "Out For Delivery";
          }
        });

        if (updateData.BookingStatusByAdmin !== "Out For Delivery") {
          SubscriptionData.dates.forEach((subDate) => {
            if (subDate.status == "Pending") {
              updateData.BookingStatusByAdmin = "Accepted";
            }
          });
        }

        updateData.dates = SubscriptionData.dates;

        var UpdatedData = await Subscription.updateOne({ _id: subscription_id }, { $set: updateData }, { new: true });

        var bookingID = bookingData.booking_code;
        var mobileMsg =
          "Once again thank you for ordering at Krishi Cress. Your order has been delivered. Happy cooking! If you have any feedback or questions, please contact us at +919667066462 or email us";
        var mobile = parseInt(userData.contactNumber);
        var email = userData.email;
        var name = userData.name;
        var message = message;
        var data = "Order updated";
        if (notifs?.order_delivered.sms) {
          common.sendOtp(mobile, mobileMsg);
        }
        if (notifs?.order_delivered.user_email) {
          var keys = {
            userName: name,
            type: "user",
            template_name: "user_Order_Delivered",
            userEmail: email,
          };
          common.dynamicEmail(keys);
        }
      } else {
        var bookingID = bookingData.booking_code;
        var mobileMsg =
          "Once again thank you for ordering at Krishi Cress. Your order has been delivered. Happy cooking! If you have any feedback or questions, please contact us at +919667066462 or email us";

        var mobile = parseInt(userData.contactNumber);
        var email = userData.email;
        var name = userData.name;
        var message = message;
        var data = "Order Updated";
        if (notifs?.order_delivered.sms) {
          common.sendOtp(mobile, mobileMsg);
        }

        if (notifs?.order_delivered.user_email) {
          var keys = {
            userName: name,
            type: "user",
            template_name: "user_Order_Delivered",
            userEmail: email,
          };
          common.dynamicEmail(keys);
        }
      }
    }
  }
  res.status(200).json({
    message: "ok",
    data: "order updated",
    code: 1,
  });
  return;
};

module.exports.AcceptFailedOrder = async function (req, res) {
  var booking_id = req.body.booking_id;
  var adminID = req.body.adminID;

  if (booking_id == "" || !booking_id || booking_id == undefined || booking_id == null) {
    common.formValidate("booking_id", res);
    return false;
  }
  if (adminID == "" || !adminID || adminID == undefined || adminID == null) {
    common.formValidate("adminID", res);
    return false;
  }
  let adminData = await Admin.findOne({
    _id: mongoose.Types.ObjectId(adminID),
  }).lean();
  let BookingData = await bookingDataBase.findOne({ _id: booking_id }).populate("regionID").lean();
  if (!BookingData) {
    res.status(404).json({
      message: "error",
      data: "id not found in the database",
      code: 0,
    });
    return;
  } else {
    //check available qty of product before accept this order start
    {
      let bookingdetail = BookingData.bookingdetail;
      let regionId = BookingData.regionID._id;
      let region_name = BookingData.regionID.name;

      let simpleProductsQuantity = {};
      let configProductsQuantity = {};

      for (const bookingItem of bookingdetail) {
        let [product] = await products
          .aggregate([
            {
              $match: {
                _id: mongoose.Types.ObjectId(bookingItem.product_id._id),
              },
            },
            // populate product categories
            {
              $lookup: {
                from: "categories",
                foreignField: "_id",
                localField: "product_categories",
                as: "product_categories",
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
                              $eq: ["$region", mongoose.Types.ObjectId(regionId)],
                            },
                            {
                              $eq: ["$variant_name", bookingItem.variant_name],
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
                    from: "packages",
                    foreignField: "_id",
                    localField: "simpleData.package",
                    as: "simpleData.package",
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
                    productQuantity: { $first: "$productQuantity" },
                    bookingQuantity: { $first: "$bookingQuantity" },
                    availableQuantity: { $first: "$availableQuantity" },
                    lostQuantity: { $first: "$lostQuantity" },
                    returnQuantity: { $first: "$returnQuantity" },
                    inhouseQuantity: { $first: "$inhouseQuantity" },
                    productSubscription: { $first: "$productSubscription" },
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
                    // other keys
                    barcode: { $first: "$barcode" },
                    slug: { $first: "$slug" },
                    longDesc: { $first: "$longDesc" },
                    shortDesc: { $first: "$shortDesc" },
                    attachment: { $first: "$attachment" },
                    banner: { $first: "$banner" },
                    productThreshold: { $first: "$productThreshold" },
                    ProductRegion: { $first: "$ProductRegion" },
                    hsnCode: { $first: "$hsnCode" },
                    SKUCode: { $first: "$SKUCode" },
                    unitQuantity: { $first: "$unitQuantity" },
                    productExpiryDay: { $first: "$productExpiryDay" },
                    attribute_group: { $first: "$attribute_group" },
                    youtube_link: { $first: "$youtube_link" },
                    created_at: { $first: "$created_at" },
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
                    productQuantity: { $first: "$productQuantity" },
                    bookingQuantity: { $first: "$bookingQuantity" },
                    availableQuantity: { $first: "$availableQuantity" },
                    lostQuantity: { $first: "$lostQuantity" },
                    returnQuantity: { $first: "$returnQuantity" },
                    inhouseQuantity: { $first: "$inhouseQuantity" },
                    productSubscription: { $first: "$productSubscription" },
                    preOrderQty: { $first: "$preOrderQty" },
                    preOrderBookQty: { $first: "$preOrderBookQty" },
                    preOrderRemainQty: { $first: "$preOrderRemainQty" },
                    preOrder: { $first: "$preOrder" },
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
                    relatedProduct: { $first: "$relatedProduct" },
                    product_categories: { $first: "$product_categories" },
                    // other keys
                    barcode: { $first: "$barcode" },
                    slug: { $first: "$slug" },
                    longDesc: { $first: "$longDesc" },
                    shortDesc: { $first: "$shortDesc" },
                    attachment: { $first: "$attachment" },
                    banner: { $first: "$banner" },
                    productThreshold: { $first: "$productThreshold" },
                    ProductRegion: { $first: "$ProductRegion" },
                    hsnCode: { $first: "$hsnCode" },
                    SKUCode: { $first: "$SKUCode" },
                    unitQuantity: { $first: "$unitQuantity" },
                    productExpiryDay: { $first: "$productExpiryDay" },
                    attribute_group: { $first: "$attribute_group" },
                    youtube_link: { $first: "$youtube_link" },
                    created_at: { $first: "$created_at" },
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
          ])
          .option({ serializeFunctions: true });

        if (bookingItem.TypeOfProduct == "simple") {
          let availQty = product.availableQuantity;
          let totalQty = bookingItem.without_package ? bookingItem.qty * bookingItem.unitQuantity : bookingItem.qty * bookingItem.packet_size;
          console.log("totalQty = ", totalQty, " and availQty = ", availQty);

          if (!simpleProductsQuantity[`${product._id}__${regionId}`]) {
            simpleProductsQuantity[`${product._id}__${regionId}`] = [product.product_name, region_name, availQty, totalQty, product.unitMeasurement];
          } else {
            simpleProductsQuantity[`${product._id}__${regionId}`][2] = availQty;
            simpleProductsQuantity[`${product._id}__${regionId}`][3] += totalQty;
          }
        } else if (bookingItem.TypeOfProduct == "group") {
          // check if any sub-product in group is out of stock
          try {
            for (let j = 0; j < bookingItem.groupData.length; j++) {
              let set = bookingItem.groupData[j];
              let setQty = 0;
              for (let k = 0; k < set.sets.length; k++) {
                let product = set.sets[k].product;

                let [productData] = await ProductData.aggregate([
                  {
                    $match: {
                      _id: mongoose.Types.ObjectId(product._id),
                      "simpleData.region": mongoose.Types.ObjectId(regionId),
                    },
                  },
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
                                    $eq: ["$region", mongoose.Types.ObjectId(regionId)],
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
                  ],
                  // For Populating other keys
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
                  ],
                  {
                    $project: {
                      product_name: 1,
                      unitMeasurement: 1,
                      preOrderRemainQty: 1,
                      preOrder: 1,
                      availableQuantity: 1,
                    },
                  },
                ]).option({ serializeFunctions: true });

                var availQty = productData.availableQuantity;
                var totalQty = (set.sets[k].package ? set.sets[k].package.packet_size : set.sets[k].unitQuantity) * set.sets[k].qty * bookingItem.qty;
                console.log("totalQty = ", totalQty, " and availQty = ", availQty);

                if (!simpleProductsQuantity[`${productData._id}__${regionId}`]) {
                  simpleProductsQuantity[`${productData._id}__${regionId}`] = [
                    productData.product_name,
                    region_name,
                    availQty,
                    totalQty,
                    productData.unitMeasurement,
                  ];
                } else {
                  simpleProductsQuantity[`${productData._id}__${regionId}`][2] = availQty;
                  simpleProductsQuantity[`${productData._id}__${regionId}`][3] += totalQty;
                }
              }
            }
            // console.log("========================= 2");
          } catch (err) {
            errorLogger.error(err, "\n", "\n");
            console.log("err::::::", err);
          }
        }
      }

      let allErrors = [];
      for (const key in simpleProductsQuantity) {
        if (Object.hasOwnProperty.call(simpleProductsQuantity, key)) {
          const element = simpleProductsQuantity[key];
          if (element[2] < element[3]) {
            allErrors.push(` ${element[0]} doesn't have sufficient inventory in stock for region ${element[1]}`);
          }
        }
      }

      for (const key in configProductsQuantity) {
        if (Object.hasOwnProperty.call(configProductsQuantity, key)) {
          const element = configProductsQuantity[key];
          if (element[2] < element[3]) {
            allErrors.push(` ${element[0]} doesn't have sufficient inventory in stock for region ${element[1]}`);
          }
        }
      }

      if (allErrors.length > 0) {
        return res.status(400).json({ message: "error", data: allErrors, code: 0 });
      }
    }
    //check available qty of product before accept this order end

    var updateData = {
      BookingStatusByAdmin: "Pending",
      payment: "Complete",
      BookingStatusByAdminID: adminID,
    };
    bookingDataBase.update({ _id: booking_id }, { $set: updateData }, async function (err, UpdatedData) {
      if (err) {
        res.status(500).json({
          message: "error",
          data: err,
          code: 0,
        });
      } else {
        var bookingID = booking_id;
        await common.reduceQtyFormproductAndInventory(bookingID);
        return res.status(200).json({
          message: "ok",
          data: "Order Updated",
          code: 1,
        });
      }
    });
  }
};
//--------------------------------------------------------------------------------
//--------------------------------------------------------------------------------
module.exports.getCustomerManagement = function (req, res) {
  var skip = 0;
  var limit = 50;
  var maxCount = 100;
  var name = null;
  var email = null;
  var contactNumber = null;

  if (req.body && req.body.skip) {
    skip = parseInt(req.body.skip, 10);
  }

  if (req.body && req.body.limit) {
    limit = parseInt(req.body.limit, 10);
  }

  if (isNaN(skip) || isNaN(limit)) {
    res.status(400).json({
      message: "If supplied in querystring, limit and skip must both be numbers",
    });
    return;
  }

  if (limit > maxCount) {
    res.status(400).json({
      message: "Count skip of " + maxCount + " exceeded",
    });
    return;
  }

  if (req.body.name) {
    name = req.body.name;
  }
  if (req.body.email) {
    email = req.body.email;
  }
  if (req.body.contactNumber) {
    contactNumber = parseInt(req.body.contactNumber);
  }

  var DataFilter = {};
  if (name != null) {
    DataFilter["name"] = { $regex: name, $options: "i" };
  }
  if (email != null) {
    DataFilter["email"] = { $regex: email, $options: "i" };
  }
  if (contactNumber != null) {
    DataFilter["contactNumber"] = contactNumber;
  }

  User.find(DataFilter)
    .count()
    .exec(function (err, count) {
      User.find(DataFilter)
        .skip(skip)
        .limit(limit)
        .sort({ created_at: -1 })
        .exec(function (err, array1) {
          bookingDataBase
            .aggregate([
              {
                $group: {
                  _id: "$user_id",
                  details: { $push: "$$ROOT" },
                  totalOrder: { $sum: 1 },
                  totalAmount: { $sum: "$totalCartPrice" },
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

              var JsonData = [];
              for (var i = 0; i < result.length; i++) {
                result[i];
                if (!result[i].details) {
                  var details = [];
                  var totalOrder = null;
                  var totalAmount = null;
                } else {
                  var details = result[i].details;
                  var totalOrder = result[i].totalOrder;
                  var totalAmount = result[i].totalAmount;
                }
                JsonData.push({
                  user: result[i]._doc,
                  details: details,
                  totalOrder: totalOrder,
                  totalAmount: totalAmount,
                });
              }

              res.status(200).json({
                message: "ok",
                data: JsonData,
                code: 1,
              });
            });
        });
    });

  // bookingDataBase
  //     .count()
  //     .exec(function (err, count) {
  //     bookingDataBase.aggregate([

  //         {$group:{ _id: '$user_id', details: { $push: "$$ROOT"},totalOrder: { $sum: 1 }, totalAmount: {$sum: '$totalCartPrice' }}},
  //         ])
  //     .exec(function (err, data) {
  //         if (err) {
  //             res
  //                 .status(500)
  //                 .json(err);
  //         }else if (!data) {
  //             res
  //                 .status(400)
  //                 .json({ "message": 'error', "data": '', "code": 0 });
  //         }
  //         res
  //             .status(200)
  //             .json({ "message": 'ok', "data": data, "code": 1 });
  //     });
  // });
};
