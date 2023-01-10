// const mongoose = require("mongoose");
// const cron = require("node-cron");
// const Subscription = mongoose.model("subscriptions");
// var inventoryDataBase = mongoose.model("inventory");
// var addToCartDataBase = mongoose.model("addtocarts");
// var WalletHistories = mongoose.model("wallet_histories");
// var User = mongoose.model("Users");
// const products = mongoose.model("products");
// const bookingDataBase = mongoose.model("bookings");
// const couponDataBase = mongoose.model("coupon_masters");
// var Company = mongoose.model("companies");
// var Admin = mongoose.model("admin");
// var Roles = mongoose.model("role");
// var OnOffDataBase = mongoose.model("email_sms_on_off");

// var settingsModel = mongoose.model("settings");
// var LoyalityProgramHistory = mongoose.model("loyality_program_histories");
// var LoyalityPrograms = mongoose.model("loyality_programs");

// const common = require("../../common");
// var errorLogger = common.errorLogger;
// const async = require("async");

// const moment = require("moment-timezone");

// module.exports.addOne = async (req, res) => {
//   var {
//     cartDetail,
//     user_id,
//     user_name,
//     user_email,
//     userMobile,
//     userType,
//     dates,
//     paymentmethod,
//     regionName,
//     regionID,
//     address,
//     country,
//     state,
//     city,
//     pincode,
//     locality,
//     locationTag,
//     houseNo,
//     latitude,
//     longitude,
//     delivery_instructions,
//     couponId,
//     total_payment,
//     gst,
//     allGstLists,
//     cod,
//     deliveryCharges,
//     codCharges,
//     totalCartPrice,
//     totalCouponDiscountAmount,
//     totalCartPriceWithoutGST,
//     device_name,
//     preOrder,
//     itemWiseData,
//     redeem,
//     redeemDiscount,
//     referralDiscount,
//     deliverySlot,
//     createDbDoc,
//   } = req.body;
//   {
//     // console.log(dates);
//     // var datesArray = Array.isArray(dates);

//     // if (datesArray == true) {
//     //   var dates = dates;
//     // } else {
//     //   var dates = [{ date: dates }];
//     // }
//     if (!cartDetail) {
//       common.formValidate("cartDetail", res);
//       return false;
//     }

//     if (cartDetail.length === 0) {
//       return res.status(400).json({
//         allErrors: [],
//         status: "error",
//         msg: "Cart needs to have atleast one product added.",
//       });
//     }

//     if (!dates) {
//       common.formValidate("dates", res);
//       return false;
//     }

//     if (dates.length === 0) {
//       return res.status(400).json({
//         allErrors: [],
//         status: "error",
//         msg: "Please choose at least one date for subsciption.",
//       });
//     }

//     if (!user_id) {
//       common.formValidate("user_id", res);
//       return false;
//     } else {
//       var userData = await User.findOne({ _id: user_id }).lean();
//       // console.log(user_id, "user_id user_id user_id");
//       // console.log(userData, "userrrrrrrrrrrr");
//       if (!userData) {
//         return res.status(401).json({
//           allErrors: [],
//           status: "error",
//           msg: "Your account is currently disabled. Please contact us for more information.",
//         });
//       }
//     }

//     if (!user_name) {
//       common.formValidate("user_name", res);
//       return false;
//     }

//     if (!user_email) {
//       common.formValidate("user_email", res);
//       return false;
//     }

//     if (!userMobile) {
//       common.formValidate("userMobile", res);
//       return false;
//     }

//     // if (!userType) {
//     //   common.formValidate("userType", res);
//     //   return false;
//     // }

//     if (!paymentmethod) {
//       common.formValidate("paymentmethod", res);
//       return false;
//     }

//     if (!regionName) {
//       common.formValidate("regionName", res);
//       return false;
//     }

//     if (!regionID) {
//       common.formValidate("regionID", res);
//       return false;
//     }

//     if (!address) {
//       common.formValidate("address", res);
//       return false;
//     }
//     if (!country) {
//       common.formValidate("country", res);
//       return false;
//     }
//     if (!state) {
//       common.formValidate("state", res);
//       return false;
//     }
//     if (!city) {
//       common.formValidate("city", res);
//       return false;
//     }
//     // if (!deliverySlot) {
//     //     common.formValidate("deliverySlot", res);
//     //     return false;
//     // }
//     // if (paymentmethod !userData= "Paytm") {
//     //     return res.status(500).json({
//     //         msg: "Only 'Paytm' allowed in paymentmethod for now",
//     //         code: 0,
//     //     });
//     // }
//     // if (!locality) {
//     //   common.formValidate("Locality", res);
//     //   return false;
//     // }
//     if (!total_payment) {
//       common.formValidate("total_payment", res);
//       return false;
//     }
//     if (!itemWiseData) {
//       common.formValidate("itemWiseData", res);
//       return false;
//     }
//   }
//   console.log(req.body, "subsrcibe");
//   if (userData.walletAmount < +total_payment * dates.length && paymentmethod.toLocaleLowerCase() == "wallet") {
//     return res.status(500).json({
//       allErrors: [],
//       status: "error",
//       msg: "Wallet amount less than order amount. Choose some other payment method.",
//     });
//   }
//   if (userData.walletAmount < total_payment && paymentmethod.toLocaleLowerCase() == "wallet") {
//     return res.status(500).paymentmethodjson({
//       allErrors: [],
//       status: "error",
//       msg: "Wallet amount less than order amount. Choose some other payment method.",
//     });
//   }

//   // credit limit check
//   if (paymentmethod === "Credit" && +total_payment + +userData.creditUsed > +userData.creditLimit) {
//     return res.status(400).json({
//       allErrors: [],
//       status: "error",
//       msg: "Credit Limit Exceeded.",
//       creditUsed: userData.creditUsed,
//       creditLimit: userData.creditLimit,
//     });
//   }

//   // Referral and Loyalty Checks **********************************************************

//   // identify loyalty program
//   var getSettings = await settingsModel.find({}).lean();
//   getSettings = getSettings[0];
//   var program = await LoyalityPrograms.find({
//     $and: [
//       {
//         startOrderNo: {
//           $lte: userData.NoOfOrder + userData.prevNoOfOrder + 1,
//         },
//       },
//       { endOrderNo: { $gte: userData.NoOfOrder + userData.prevNoOfOrder + 1 } },
//     ],
//   }).lean();
//   program = program[0];

//   // loyalty checks
//   if (+redeem * dates.length > 0 && getSettings.loyalityProgramOnOff == "off") {
//     return res.status(500).json({
//       allErrors: [],
//       status: "error",
//       msg: "loyalty program is off.... you can't redeem krishi seeds.",
//     });
//   }

//   var maxRedeemAllowed = (userData.TotalPoint ? +userData.TotalPoint : 0) * getSettings.seedValue;

//   if (+redeemDiscount * dates.length > maxRedeemAllowed) {
//     return res.status(500).json({
//       allErrors: [],
//       status: "error",
//       msg: `Maximum redeem discount exceeded - ${maxRedeemAllowed}`,
//     });
//   }

//   // referral checks
//   if (+referralDiscount * dates.length > 0 && getSettings.refferalPointsOnOff == "off") {
//     return res.status(500).json({
//       allErrors: [],
//       status: "error",
//       msg: `referral program is off.... you can't have referral discount`,
//     });
//   }
//   if (+referralDiscount * dates.length > 0 && !userData.refferalCodeFrom) {
//     return res.status(500).json({
//       allErrors: [],
//       status: "error",
//       msg: "you didn't use any referral code while signing up... not eligible for referral discount.",
//     });
//   }
//   if (+referralDiscount * dates.length > 0 && userData.NoOfOrder + userData.prevNoOfOrder >= 3) {
//     return res.status(500).json({
//       allErrors: [],
//       status: "error",
//       msg: "referral discount can be used only for 1st 3 orders.",
//     });
//   }
//   if (+referralDiscount > 0 && couponId) {
//     return res.status(500).json({
//       allErrors: [],
//       status: "error",
//       msg: "Coupon and Referral discount can't be used together.",
//     });
//   }

//   // Referral and Loyalty Checks ends **********************************************************

//   if (cartDetail) {
//     cartDetail = cartDetail.map((cartItem) => {
//       return {
//         ...cartItem,
//         product_SKUCode: cartItem.product_id.SKUCode,
//         product_categories: cartItem.product_categories,
//         product_images: cartItem.product_id.images,
//         product_longDesc: cartItem.product_id.longDesc,
//         product_shortDesc: cartItem.product_id.shortDesc,
//         product_name: cartItem.product_id ? cartItem.product_id.product_name : null,
//         product_subCat1_name: cartItem.product_id.product_subCat1_id ? cartItem.product_id.product_subCat1_id.category_name : null,
//       };
//     });
//   }

//   let booking_address = {
//     address: address,
//     country: country,
//     state: state,
//     city: city,
//     pincode: pincode,
//     locality: locality,
//     latitude: latitude,
//     longitude: longitude,
//     locationTag: locationTag,
//     houseNo: houseNo,
//   };

//   couponId = couponId ? couponId : null;

//   couponDataBase
//     .findOne({ _id: couponId })
//     .exec()
//     .then(async (getCoupon) => {
//       if (getCoupon) {
//         couponId = getCoupon._id;
//         var couponApplied = true;
//         var coupon_code = getCoupon.coupon_code;
//         var discountType = getCoupon.discountType;
//         var discountAmount = getCoupon.discountAmount;
//         var discountLocation = getCoupon.discountLocation;
//         var discountPercentage = getCoupon.discountPercentage;
//         var discount_upto = getCoupon.discount_upto;
//         var discountProduct = getCoupon.discountProduct;
//         var discountProductPackageId = getCoupon.discountProductPackageId;
//       } else {
//         couponId = null;
//         var couponApplied = false;
//         var coupon_code = null;
//         var discountType = null;
//         var discountAmount = null;
//         var discountLocation = null;
//         var discountPercentage = null;
//         var discount_upto = null;
//         var discountProduct = null;
//         var discountProductPackageId = null;
//       }

//       // console.log("before 0000000000000000", caallErrorsrtDetail, itemWiseData);
//       // make sure that data coming from cart and data from checkout page is same (if same account on two devices)
//       {
//         let tp = 0;
//         for (const item1 of cartDetail) {
//           //console.log("item1item1item1item1item1item1item1item1", item1);
//           tp += item1.totalprice;

//           let itemMatched = false;
//           itemWiseData.forEach((item2) => {
//             //console.log("item2item2item2item2item2item2item2item2item2", item2);
//             if (item1.product_id._id.toString() == item2._id && item1.packet_size == item2.packet_size) {
//               itemMatched = true;
//             }
//           });
//           //console.log("inside 0");
//           if (!itemMatched) {
//             return res.status(500).json({
//               allErrors: [],
//               status: "error",
//               msg: "Your cart has been modified on another device you may have previously logged on to. Please check your cart once before you proceed.",
//               code: 0,
//             });
//           }
//         }
//         console.log("inside 1");
//         if (req.body.totalCartPrice != tp) {
//           return res.status(500).json({
//             allErrors: [],
//             status: "error",
//             msg: "Your cart has been modified on another device you may have previously logged on to. Please check your cart once before you proceed.",
//             code: 1,
//           });
//         }

//         if (cartDetail.length != itemWiseData.length) {
//           return res.status(500).json({
//             allErrors: [],
//             status: "error",
//             msg: "Your cart has been modified on another device you may have previously logged on to. Please check your cart once before you proceed.",
//             code: 2,
//           });
//         }

//         let pre_order1 = false;
//         itemWiseData.forEach((item2) => {
//           if (item2.preOrder) {
//             pre_order1 = true;
//           }
//         });
//         console.log("inside 2");
//         if (pre_order1 != req.body.preOrder) {
//           return res.status(500).json({
//             allErrors: [],
//             status: "error",
//             msg: "Your cart has been modified on another device you may have previously logged on to. Please check your cart once before you proceed.",
//             code: 3,
//           });
//         }
//       }
//       console.log("after 0000000000000000");

//       cartDetail.forEach((item1) => {
//         itemWiseData.forEach((item2) => {
//           if (item1.product_id._id.toString() == item2._id && item1.packet_size == item2.packet_size) {
//             item1.preOrderStartDate = item2.preOrderStartDate;
//             item1.preOrderEndDate = item2.preOrderEndDate;
//             item1.totalPriceBeforeGST = item2.totalPriceBeforeGST;
//             item1.totalPriceAfterGST = item2.totalPriceAfterGST ? item2.totalPriceAfterGST : +item2.totalPriceBeforeGST + +item2.itemWiseGst;
//             item1.itemDiscountAmountBeforeGST = item2.itemDiscountAmountBeforeGST;
//             item1.itemDiscountAmount = item2.itemDiscountAmount;
//             item1.itemWiseGst = item2.itemWiseGst;
//           }
//         });
//       });

//       var invoiceNO = null;

//       if (preOrder) {
//         // checking if all products are in stock
//         let bookingdetail = cartDetail;
//         let regionId = regionID;

//         let simpleProductsQuantity = {};
//         let configProductsQuantity = {};

//         for (const bookingItem of bookingdetail) {
//           let [product] = await products
//             .aggregate([
//               { $match: { _id: mongoose.Types.ObjectId(bookingItem.product_id._id) } },
//               // populate product categories
//               {
//                 $lookup: {
//                   from: "categories",
//                   foreignField: "_id",
//                   localField: "product_categories",
//                   as: "product_categories",
//                 },
//               },

//               // For adding quantity keys
//               ...[
//                 {
//                   $lookup: {
//                     from: "inventory_items",
//                     let: { product_id: "$_id" },
//                     pipeline: [
//                       {
//                         $match: {
//                           $expr: {
//                             $and: [
//                               { $eq: ["$product_id", "$$product_id"] },
//                               {
//                                 $eq: ["$region", mongoose.Types.ObjectId(regionId)],
//                               },
//                               { $eq: ["$variant_name", bookingItem.variant_name] },
//                             ],
//                           },
//                         },
//                       },
//                       {
//                         $group: {
//                           _id: null,
//                           productQuantity: { $sum: "$productQuantity" },
//                           bookingQuantity: { $sum: "$bookingQuantity" },
//                           availableQuantity: { $sum: "$availableQuantity" },
//                           lostQuantity: { $sum: "$lostQuantity" },
//                           returnQuantity: { $sum: "$returnQuantity" },
//                           inhouseQuantity: { $sum: "$inhouseQuantity" },
//                         },
//                       },
//                       { $project: { _id: 0 } },
//                     ],
//                     as: "inventories",
//                   },
//                 },
//                 {
//                   $unwind: {
//                     path: "$inventories",
//                     preserveNullAndEmptyArrays: true,
//                   },
//                 },
//                 {
//                   $addFields: {
//                     productQuantity: {
//                       $ifNull: [{ $toDouble: "$inventories.productQuantity" }, 0],
//                     },
//                     bookingQuantity: {
//                       $ifNull: [{ $toDouble: "$inventories.bookingQuantity" }, 0],
//                     },
//                     availableQuantity: {
//                       $ifNull: [{ $toDouble: "$inventories.availableQuantity" }, 0],
//                     },
//                     lostQuantity: {
//                       $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0],
//                     },
//                     returnQuantity: {
//                       $ifNull: [{ $toDouble: "$inventories.returnQuantity" }, 0],
//                     },
//                     inhouseQuantity: {
//                       $ifNull: [{ $toDouble: "$inventories.inhouseQuantity" }, 0],
//                     },
//                   },
//                 },
//               ],

//               // For Populating nested keys inside nested array of objects
//               ...[
//                 // inside simpleData array
//                 ...[
//                   {
//                     $unwind: {
//                       path: "$simpleData",
//                       preserveNullAndEmptyArrays: true,
//                     },
//                   },
//                   {
//                     $lookup: {
//                       from: "packages",
//                       foreignField: "_id",
//                       localField: "simpleData.package",
//                       as: "simpleData.package",
//                     },
//                   },
//                   {
//                     $group: {
//                       _id: "$_id",
//                       product_name: { $first: "$product_name" },
//                       images: { $first: "$images" },
//                       simpleData: { $push: "$simpleData" },
//                       configurableData: { $first: "$configurableData" },
//                       groupData: { $first: "$groupData" },
//                       base_price: { $first: "$base_price" },
//                       slug: { $first: "$slug" },
//                       TypeOfProduct: { $first: "$TypeOfProduct" },
//                       outOfStock: { $first: "$outOfStock" },
//                       productQuantity: { $first: "$productQuantity" },
//                       bookingQuantity: { $first: "$bookingQuantity" },
//                       availableQuantity: { $first: "$availableQuantity" },
//                       lostQuantity: { $first: "$lostQuantity" },
//                       returnQuantity: { $first: "$returnQuantity" },
//                       inhouseQuantity: { $first: "$inhouseQuantity" },
//                       productSubscription: { $first: "$productSubscription" },
//                       preOrder: { $first: "$preOrder" },
//                       preOrderQty: { $first: "$preOrderQty" },
//                       preOrderBookQty: { $first: "$preOrderBookQty" },
//                       preOrderRemainQty: { $first: "$preOrderRemainQty" },
//                       preOrderStartDate: { $first: "$preOrderStartDate" },
//                       preOrderEndDate: { $first: "$preOrderEndDate" },
//                       sameDayDelivery: { $first: "$sameDayDelivery" },
//                       farmPickup: { $first: "$farmPickup" },
//                       priority: { $first: "$priority" },
//                       status: { $first: "$status" },
//                       showstatus: { $first: "$showstatus" },
//                       ratings: { $first: "$ratings" },
//                       ratingsCount: { $first: "$ratingsCount" },
//                       reviews: { $first: "$reviews" },
//                       reviewsCount: { $first: "$reviewsCount" },
//                       unitMeasurement: { $first: "$unitMeasurement" },
//                       salesTaxOutSide: { $first: "$salesTaxOutSide" },
//                       salesTaxWithIn: { $first: "$salesTaxWithIn" },
//                       purchaseTax: { $first: "$purchaseTax" },
//                       product_categories: { $first: "$product_categories" },
//                       // other keys
//                       barcode: { $first: "$barcode" },
//                       slug: { $first: "$slug" },
//                       longDesc: { $first: "$longDesc" },
//                       shortDesc: { $first: "$shortDesc" },
//                       attachment: { $first: "$attachment" },
//                       banner: { $first: "$banner" },
//                       productThreshold: { $first: "$productThreshold" },
//                       ProductRegion: { $first: "$ProductRegion" },
//                       hsnCode: { $first: "$hsnCode" },
//                       SKUCode: { $first: "$SKUCode" },
//                       unitQuantity: { $first: "$unitQuantity" },
//                       productExpiryDay: { $first: "$productExpiryDay" },
//                       attribute_group: { $first: "$attribute_group" },
//                       youtube_link: { $first: "$youtube_link" },
//                       created_at: { $first: "$created_at" },
//                     },
//                   },
//                 ],

//                 // inside groupData array
//                 ...[
//                   { $unwind: { path: "$groupData", preserveNullAndEmptyArrays: true } },
//                   { $unwind: { path: "$groupData.sets", preserveNullAndEmptyArrays: true } },
//                   // { $sort: { "groupData.sets.priority": 1 } },
//                   {
//                     $lookup: {
//                       from: "packages",
//                       foreignField: "_id",
//                       localField: "groupData.sets.package",
//                       as: "groupData.sets.package",
//                     },
//                   },
//                   {
//                     $unwind: {
//                       path: "$groupData.sets.package",
//                       preserveNullAndEmptyArrays: true,
//                     },
//                   },
//                   {
//                     $group: {
//                       _id: "$_id",
//                       product_name: { $first: "$product_name" },
//                       images: { $first: "$images" },
//                       simpleData: { $first: "$simpleData" },
//                       configurableData: { $first: "$configurableData" },
//                       groupData: { $push: "$groupData" },
//                       base_price: { $first: "$base_price" },
//                       slug: { $first: "$slug" },
//                       TypeOfProduct: { $first: "$TypeOfProduct" },
//                       outOfStock: { $first: "$outOfStock" },
//                       productQuantity: { $first: "$productQuantity" },
//                       bookingQuantity: { $first: "$bookingQuantity" },
//                       availableQuantity: { $first: "$availableQuantity" },
//                       lostQuantity: { $first: "$lostQuantity" },
//                       returnQuantity: { $first: "$returnQuantity" },
//                       inhouseQuantity: { $first: "$inhouseQuantity" },
//                       productSubscription: { $first: "$productSubscription" },
//                       preOrderQty: { $first: "$preOrderQty" },
//                       preOrderBookQty: { $first: "$preOrderBookQty" },
//                       preOrderRemainQty: { $first: "$preOrderRemainQty" },
//                       preOrder: { $first: "$preOrder" },
//                       preOrderStartDate: { $first: "$preOrderStartDate" },
//                       preOrderEndDate: { $first: "$preOrderEndDate" },
//                       sameDayDelivery: { $first: "$sameDayDelivery" },
//                       farmPickup: { $first: "$farmPickup" },
//                       priority: { $first: "$priority" },
//                       status: { $first: "$status" },
//                       showstatus: { $first: "$showstatus" },
//                       ratings: { $first: "$ratings" },
//                       ratingsCount: { $first: "$ratingsCount" },
//                       reviews: { $first: "$reviews" },
//                       reviewsCount: { $first: "$reviewsCount" },
//                       unitMeasurement: { $first: "$unitMeasurement" },
//                       salesTaxOutSide: { $first: "$salesTaxOutSide" },
//                       salesTaxWithIn: { $first: "$salesTaxWithIn" },
//                       purchaseTax: { $first: "$purchaseTax" },
//                       relatedProduct: { $first: "$relatedProduct" },
//                       product_categories: { $first: "$product_categories" },
//                       // other keys
//                       barcode: { $first: "$barcode" },
//                       slug: { $first: "$slug" },
//                       longDesc: { $first: "$longDesc" },
//                       shortDesc: { $first: "$shortDesc" },
//                       attachment: { $first: "$attachment" },
//                       banner: { $first: "$banner" },
//                       productThreshold: { $first: "$productThreshold" },
//                       ProductRegion: { $first: "$ProductRegion" },
//                       hsnCode: { $first: "$hsnCode" },
//                       SKUCode: { $first: "$SKUCode" },
//                       unitQuantity: { $first: "$unitQuantity" },
//                       productExpiryDay: { $first: "$productExpiryDay" },
//                       attribute_group: { $first: "$attribute_group" },
//                       youtube_link: { $first: "$youtube_link" },
//                       created_at: { $first: "$created_at" },
//                     },
//                   },

//                   // For grouping groupData.sets and
//                   // For sorting inner products inside group products based on priorities
//                   {
//                     $addFields: {
//                       groupData: {
//                         $function: {
//                           body: function (groupData) {
//                             let new_groupData = [];
//                             for (let gd of groupData) {
//                               if (gd.name) {
//                                 let found = false;
//                                 for (let new_gd of new_groupData) {
//                                   if (new_gd._id.toString() === gd._id.toString() && new_gd.name === gd.name) {
//                                     found = new_gd;
//                                   }
//                                 }
//                                 if (found) {
//                                   found.sets.push(gd.sets);
//                                 } else {
//                                   gd.sets = [gd.sets];
//                                   new_groupData.push(gd);
//                                 }
//                               }
//                             }

//                             for (const gd of new_groupData) {
//                               for (const set of gd.sets) {
//                                 if (set.priority === null) {
//                                   set.priority = Infinity;
//                                 }
//                               }
//                               gd.sets.sort((a, b) => a.priority - b.priority);
//                             }

//                             return new_groupData;
//                           },
//                           args: ["$groupData"],
//                           lang: "js",
//                         },
//                       },
//                     },
//                   },
//                 ],
//               ],
//             ])
//             .option({ serializeFunctions: true });

//           // if (!product) {
//           //   notAdded.push(bookingItem.product_id.product_name || bookingItem.product_id);
//           //   continue;
//           // }
//           // if (!product.status || !product.showstatus) {
//           //   outOfStock.push(product.product_name);
//           //   continue;
//           // }
//           // let productCatStatus = true;
//           // for (const cat of product.product_categories) {
//           //   if (!cat.status) {
//           //     productCatStatus = false;
//           //   }
//           // }
//           // if (!productCatStatus) {
//           //   outOfStock.push(product.product_name);
//           //   continue;
//           // }

//           if (bookingItem.TypeOfProduct == "simple") {
//             // check if out of stock
//             // let simpleData = product.simpleData.filter((data) => data.region == regionId);
//             // if (simpleData.length == 0) {
//             //   outOfStock.push(bookingItem.product_id.product_name);
//             //   continue;
//             // }

//             let availQty = product.availableQuantity;
//             let totalQty = bookingItem.without_package ? bookingItem.qty * bookingItem.unitQuantity : bookingItem.qty * bookingItem.packet_size;
//             console.log("totalQty = ", totalQty, " and availQty = ", availQty);

//             if (!simpleProductsQuantity[`${product._id}__${regionId}`]) {
//               simpleProductsQuantity[`${product._id}__${regionId}`] = [product.product_name, regionId, availQty, totalQty, product.unitMeasurement];
//             } else {
//               simpleProductsQuantity[`${product._id}__${regionId}`][2] = availQty;
//               simpleProductsQuantity[`${product._id}__${regionId}`][3] += totalQty;
//             }
//           } else if (bookingItem.TypeOfProduct == "group") {
//             // check if any sub-product in group is out of stock
//             try {
//               for (let j = 0; j < bookingItem.groupData.length; j++) {
//                 let set = bookingItem.groupData[j];
//                 let setQty = 0;
//                 for (let k = 0; k < set.sets.length; k++) {
//                   let product = set.sets[k].product;

//                   let [productData] = await ProductData.aggregate([
//                     {
//                       $match: {
//                         _id: mongoose.Types.ObjectId(product._id),
//                         "simpleData.region": mongoose.Types.ObjectId(regionId),
//                       },
//                     },
//                     {
//                       $addFields: {
//                         simpleData: {
//                           $ifNull: ["$simpleData", []],
//                         },
//                         configurableData: {
//                           $ifNull: ["$configurableData", []],
//                         },
//                         groupData: {
//                           $ifNull: ["$groupData", []],
//                         },
//                       },
//                     },
//                     // For adding quantity keys
//                     ...[
//                       {
//                         $lookup: {
//                           from: "inventory_items",
//                           let: { product_id: "$_id" },
//                           pipeline: [
//                             {
//                               $match: {
//                                 $expr: {
//                                   $and: [
//                                     { $eq: ["$product_id", "$$product_id"] },
//                                     {
//                                       $eq: ["$region", mongoose.Types.ObjectId(regionId)],
//                                     },
//                                   ],
//                                 },
//                               },
//                             },
//                             {
//                               $group: {
//                                 _id: null,
//                                 productQuantity: { $sum: "$productQuantity" },
//                                 bookingQuantity: { $sum: "$bookingQuantity" },
//                                 availableQuantity: { $sum: "$availableQuantity" },
//                                 lostQuantity: { $sum: "$lostQuantity" },
//                                 returnQuantity: { $sum: "$returnQuantity" },
//                                 inhouseQuantity: { $sum: "$inhouseQuantity" },
//                               },
//                             },
//                             { $project: { _id: 0 } },
//                           ],
//                           as: "inventories",
//                         },
//                       },
//                       {
//                         $unwind: {
//                           path: "$inventories",
//                           preserveNullAndEmptyArrays: true,
//                         },
//                       },
//                       {
//                         $addFields: {
//                           productQuantity: {
//                             $ifNull: [{ $toDouble: "$inventories.productQuantity" }, 0],
//                           },
//                           bookingQuantity: {
//                             $ifNull: [{ $toDouble: "$inventories.bookingQuantity" }, 0],
//                           },
//                           availableQuantity: {
//                             $ifNull: [{ $toDouble: "$inventories.availableQuantity" }, 0],
//                           },
//                           lostQuantity: {
//                             $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0],
//                           },
//                           returnQuantity: {
//                             $ifNull: [{ $toDouble: "$inventories.returnQuantity" }, 0],
//                           },
//                           inhouseQuantity: {
//                             $ifNull: [{ $toDouble: "$inventories.inhouseQuantity" }, 0],
//                           },
//                         },
//                       },
//                     ],
//                     // For Populating other keys
//                     ...[
//                       {
//                         $lookup: {
//                           from: "unit_measurements",
//                           localField: "unitMeasurement",
//                           foreignField: "_id",
//                           as: "unitMeasurement",
//                         },
//                       },
//                       {
//                         $unwind: {
//                           path: "$unitMeasurement",
//                           preserveNullAndEmptyArrays: true,
//                         },
//                       },
//                     ],
//                     {
//                       $project: {
//                         product_name: 1,
//                         unitMeasurement: 1,
//                         preOrderRemainQty: 1,
//                         preOrder: 1,
//                         availableQuantity: 1,
//                       },
//                     },
//                   ]).option({ serializeFunctions: true });

//                   var availQty = productData.availableQuantity;
//                   var totalQty =
//                     (set.sets[k].package ? set.sets[k].package.packet_size : set.sets[k].unitQuantity) * set.sets[k].qty * bookingItem.qty;
//                   console.log("totalQty = ", totalQty, " and availQty = ", availQty);

//                   if (!simpleProductsQuantity[`${productData._id}__${regionId}`]) {
//                     simpleProductsQuantity[`${productData._id}__${regionId}`] = [
//                       productData.product_name,
//                       regionId,
//                       availQty,
//                       totalQty,
//                       productData.unitMeasurement,
//                     ];
//                   } else {
//                     simpleProductsQuantity[`${productData._id}__${regionId}`][2] = availQty;
//                     simpleProductsQuantity[`${productData._id}__${regionId}`][3] += totalQty;
//                   }
//                 }
//               }
//               // console.log("========================= 2");
//             } catch (err) {
//               errorLogger.error(err, "\n", "\n");
//               console.log("err::::::", err);
//             }
//           }
//         }

//         let allErrors = [];
//         for (const key in simpleProductsQuantity) {
//           if (Object.hasOwnProperty.call(simpleProductsQuantity, key)) {
//             const element = simpleProductsQuantity[key];
//             if (element[2] < element[3]) {
//               allErrors.push(` ${element[0]} more than ${element[2]} ${element[4].name}`);
//             }
//           }
//         }

//         for (const key in configProductsQuantity) {
//           if (Object.hasOwnProperty.call(configProductsQuantity, key)) {
//             const element = configProductsQuantity[key];
//             if (element[2] < element[3]) {
//               allErrors.push(` ${element[0]} more than ${element[2]} ${element[4].name}`);
//             }
//           }
//         }

//         if (allErrors.length > 0) {
//           return res.status(400).json({
//             allErrors,
//             status: "error",
//             msg: "",
//           });
//         }
//       }

//       console.log("outside the preorder qty check block");

//       if (!createDbDoc && paymentmethod == "Razorpay") {
//         return res.status(200).json({
//           allErrors: [],
//           status: "ok",
//           msg: `All checks passed`,
//         });
//       }

//       var SubscriptionID = "SubscriptionID";
//       let sub = new Subscription({
//         user_id,
//         userData,
//         userName: user_name,
//         userEmail: user_email,
//         userType,
//         userMobile,
//         SubscriptionID,
//         invoiceNO,
//         bookingdetail: cartDetail,
//         dates,
//         bookingMode: "online",
//         paymentmethod,
//         TXNID: req.body.TXNID || null,
//         payment: req.body.payment || "Failed",
//         regionName,
//         regionID,
//         booking_address,
//         delivery_instructions,
//         total_payment,
//         OrderTotal: total_payment * dates.length,
//         cod,
//         deliveryCharges,
//         codCharges,
//         gst,
//         allGstLists,
//         totalCouponDiscountAmount: totalCouponDiscountAmount ? totalCouponDiscountAmount : 0,
//         couponId,
//         couponApplied,
//         discountLocation,
//         coupon_code,
//         discountType,
//         discountAmount: totalCouponDiscountAmount ? totalCouponDiscountAmount : discountAmount,
//         discountPercentage,
//         discount_upto,
//         discountProduct,
//         discountProductPackageId,
//         totalCartPrice,
//         totalCartPriceWithoutGST,
//         device_name,
//         preOrder,
//         redeem_point: redeem,
//         redeemDiscount,
//         referralDiscount,
//         deliverySlot,
//         loyaltyProgram: program,
//       });
//       sub.save(async (err, sub) => {
//         if (err) {
//           console.error("err :::: ", err);
//         } else {
//           // update SubscriptionId
//           var SubscriptionID = "SubscriptionID" + sub.counter;

//           var d = new Date();
//           var year = d.getFullYear();
//           var date = d.getDate();

//           var invoiceNO = "S" + sub.counter + "/" + `${new Date().getFullYear().toString()}-${(new Date().getFullYear() + 1).toString().slice(2)}`;

//           await Subscription.update({ _id: sub._id }, { SubscriptionID, invoiceNO });

//           let notifs = await OnOffDataBase.findOne({}).lean();

//           var orderDetails = {
//             name: sub.userName,
//             SubscriptionID: SubscriptionID,
//             createDate: sub.createDate,
//             BookingStatusByAdmin: sub.BookingStatusByAdmin,
//             products: sub.bookingdetail,
//             address: sub.booking_address.address + ", " + sub.booking_address.locality + ", " + sub.booking_address.city,
//             paymentMethod: sub.paymentmethod,
//             paymentStatus: sub.payment,
//             gst: sub.gst ? sub.gst : 0,
//             allGstLists: sub.allGstLists,
//             totalCartPrice: sub.totalCartPriceWithoutGST ? sub.totalCartPriceWithoutGST : 0,
//             deliveryCharges: sub.deliveryCharges ? sub.deliveryCharges : 0,
//             adminDiscount: sub.adminDiscount ? sub.adminDiscount : 0,
//             discountAmount: sub.discountAmount ? sub.discountAmount : 0,
//             redeemDiscount: sub.redeemDiscount ? sub.redeemDiscount : 0,
//             referralDiscount: sub.referralDiscount ? sub.referralDiscount : 0,
//             codCharges: sub.codCharges ? sub.codCharges : 0,
//             total_payment: sub.total_payment ? sub.total_payment : 0,
//             dates: sub.dates,
//             preOrder: sub.preOrder,
//             deliverySlot: sub.deliverySlot,
//           };
//           //console.log(orderDetails)
//           if (paymentmethod.toLocaleLowerCase() == "paytm") {
//             var num = +total_payment * dates.length;
//             var totalAmount = num.toFixed(2);
//             if (device_name === "mobile") {
//               var CHANNEL_ID = "WAP";
//             } else {
//               var CHANNEL_ID = "WEB";
//             }
//             var paymentDetails = {
//               amount: String(totalAmount),
//               customerId: user_id,
//               customerEmail: user_email,
//               customerPhone: String(userMobile),
//               ORDER_ID: SubscriptionID,
//               CHANNEL_ID: CHANNEL_ID,
//             };

//             common.SubscriptionPayNow(paymentDetails, res);
//           } else if (paymentmethod.toLocaleLowerCase() == "wallet") {
//             await User.findOneAndUpdate(
//               { _id: user_id },
//               {
//                 $inc: {
//                   walletAmount: -(+total_payment * dates.length),
//                 },
//               }
//             );
//             var walletHistory = {
//               user_id,
//               amount: +total_payment * dates.length,
//               type: "debit",
//               paymentStatus: "Complete",
//               debitType: "subscription",
//               subscription_id: sub._id,
//               SubscriptionID: SubscriptionID,
//             };
//             WalletHistories.create(walletHistory, async (err, doc) => {
//               if (err) {
//                 res.status(500).json({
//                   allErrors: [],
//                   status: "error",
//                   msg: "Something went wrong. Please try again after sometime.",
//                 });
//               } else {
//                 let jsonData = {
//                   user_id: user_id,
//                   totalCartPrice: 0,
//                   CartDetail: [],
//                 };
//                 await addToCartDataBase.findOneAndUpdate(
//                   {
//                     user_id: user_id,
//                   },
//                   {
//                     $set: jsonData,
//                   }
//                 );

//                 await Subscription.updateOne({ _id: sub._id }, { payment: "Complete" });
//                 orderDetails.paymentStatus = "Complete";

//                 await common.processLoyaltyAndRefferal(SubscriptionID, getSettings.loyalityProgramOnOff, getSettings.refferalPointsOnOff);

//                 if (preOrder === true) {
//                   //console.log("preOrderpreOrderpreOrder", preOrder, ":::", sub._id);
//                   var abc = "on the pre-order date";
//                   var adminAbc = "on the pre-order date";
//                   var subPrimeryID = sub._id;
//                   console.log("reducePreOrderQtyFormproductAndInventory before");
//                   await common.reducePreOrderQtyFormproductAndInventory(subPrimeryID);
//                   console.log("reducePreOrderQtyFormproductAndInventory after");
//                 } else {
//                   var abc = "to you on the following days";
//                   var adminAbc = "on the following days";
//                 }

//                 var email = userData.email;
//                 var name = userData.name;
//                 var userMobile = userData.contactNumber;
//                 var OrderDates = orderDetails.dates.map((item) => item.date.toDateString()).join(`, </br>`);

//                 var data = SubscriptionID;
//                 var subscriptionDates = orderDetails.dates;
//                 var subscriptionDatesarray = [];
//                 for (var i = 0; i < subscriptionDates.length; i++) {
//                   var date = subscriptionDates[i].date;
//                   var date1 = date.toDateString();
//                   subscriptionDatesarray.push(" " + date1);
//                 }
//                 var ProductDetail = await common.OrderDetails(orderDetails);
//                 if (notifs.subscription_placed.user_email) {
//                   var keys = {
//                     userName: common.toTitleCase(name),
//                     userMobile: userData.contactNumber,
//                     subscriptionDates: subscriptionDatesarray,
//                     ProductDetail: ProductDetail,
//                     type: "user",
//                     template_name: "subscription place mail to user",
//                     userEmail: email,
//                   };
//                   common.dynamicEmail(keys);
//                   //common.sendMail(email, subject, name, message, data, orderDetails);
//                 }

//                 let users = await Admin.find(
//                   {
//                     user_role: { $in: notifs.subscription_placed.admin_roles },
//                   },
//                   { username: 1, email: 1 }
//                 ).lean();

//                 if (notifs.subscription_placed.admin_email) {
//                   users.forEach((user) => {
//                     var keys = {
//                       userName: common.toTitleCase(name),
//                       userMobile: userData.contactNumber,
//                       userEmail: email,
//                       subscriptionDates: subscriptionDatesarray,
//                       ProductDetail: ProductDetail,
//                       type: "admin",
//                       template_name: "subscription place mail to admin",
//                       adminEmail: user.email,
//                       adminName: user.username,
//                     };
//                     common.dynamicEmail(keys);
//                     // common.sendMail(
//                     //   user.email,
//                     //   subject,
//                     //   user.username,
//                     //   adminMessage,
//                     //   data,
//                     //   orderDetails
//                     // );
//                   });
//                 }

//                 return res.status(200).json({
//                   message: "ok",
//                   data: SubscriptionID,
//                   code: 1,
//                 });
//               }
//             });
//           } else {
//             if (paymentmethod === "Credit") {
//               await User.updateOne({ _id: user_id }, { $inc: { creditUsed: +total_payment } });
//             }

//             await common.processLoyaltyAndRefferal(SubscriptionID, getSettings.loyalityProgramOnOff, getSettings.refferalPointsOnOff);

//             if (preOrder === true) {
//               //console.log("preOrderpreOrderpreOrder", preOrder, ":::", sub._id);
//               var abc = "on the pre-order date";
//               var adminAbc = "on the pre-order date";
//               var subPrimeryID = sub._id;
//               console.log("reducePreOrderQtyFormproductAndInventory before");
//               await common.reducePreOrderQtyFormproductAndInventory(subPrimeryID);
//               console.log("reducePreOrderQtyFormproductAndInventory after");
//             } else {
//               var abc = "to you on the following days";
//               var adminAbc = "on the following days";
//             }

//             var email = userData.email;
//             var name = userData.name;
//             var userMobile = userData.contactNumber;
//             var OrderDates = orderDetails.dates.map((item) => item.date.toDateString()).join(`, </br>`);

//             var data = SubscriptionID;
//             var subscriptionDates = orderDetails.dates;
//             var subscriptionDatesarray = [];
//             for (var i = 0; i < subscriptionDates.length; i++) {
//               var date = subscriptionDates[i].date;
//               var date1 = date.toDateString();
//               subscriptionDatesarray.push(" " + date1);
//             }
//             var ProductDetail = await common.OrderDetails(orderDetails);
//             if (notifs.subscription_placed.user_email) {
//               var keys = {
//                 userName: common.toTitleCase(name),
//                 userMobile: userData.contactNumber,
//                 subscriptionDates: subscriptionDatesarray,
//                 ProductDetail: ProductDetail,
//                 type: "user",
//                 template_name: "subscription place mail to user",
//                 userEmail: email,
//               };
//               common.dynamicEmail(keys);
//               //common.sendMail(email, subject, name, message, data, orderDetails);
//             }

//             let users = await Admin.find({ user_role: { $in: notifs.subscription_placed.admin_roles } }, { username: 1, email: 1 }).lean();

//             if (notifs.subscription_placed.admin_email) {
//               users.forEach((user) => {
//                 var keys = {
//                   userName: common.toTitleCase(name),
//                   userMobile: userData.contactNumber,
//                   userEmail: email,
//                   subscriptionDates: subscriptionDatesarray,
//                   ProductDetail: ProductDetail,
//                   type: "admin",
//                   template_name: "subscription place mail to admin",
//                   adminEmail: user.email,
//                   adminName: user.username,
//                 };
//                 common.dynamicEmail(keys);
//                 // common.sendMail(
//                 //   user.email,
//                 //   subject,
//                 //   user.username,
//                 //   adminMessage,
//                 //   data,
//                 //   orderDetails
//                 // );
//               });
//             }

//             return res.status(200).json({
//               message: "ok",
//               data: SubscriptionID,
//               code: 1,
//             });
//           }
//         }
//       });
//     })
//     .catch((err) => {
//       errorLogger.error(err, "\n", "\n");
//     });
// };

// // All Subscriptions of a single user
// module.exports.getAll = (req, res) => {
//   const user_id = req.decoded.ID;

//   try {
//     if (!user_id) {
//       common.formValidate("user_id", res);
//       return false;
//     }
//     Subscription.find({ user_id, payment: "Complete" })
//       .count()
//       .exec(function (err, count) {
//         Subscription.find({ user_id, payment: "Complete" })
//           .populate("user_id")
//           .sort({ createDate: "desc" })
//           .exec(function (err, docs) {
//             if (err) {
//               res.status(400).json(err);
//             } else {
//               res.status(200).json({
//                 message: "ok",
//                 data: docs,
//                 count: count,
//                 code: 1,
//               });
//             }
//           });
//       });
//   } catch (err) {
//     errorLogger.error(err, "\n", "\n");
//     res.status(400).json(err);
//   }
// };

// // All Subscriptions (For admin)
// module.exports.adminGetAll = (req, res) => {
//   const { skip, limit, listStatus, userName, userEmail, userMobile, SubscriptionID, OrderTotal, date, paymentmethod } = req.body;

//   try {
//     if (!listStatus) {
//       common.formValidate("listStatus", res);
//       return false;
//     }

//     var DataFilter = {};

//     if (listStatus == "Accepted") {
//       DataFilter.BookingStatusByAdmin = {
//         $in: ["Accepted", "Out For Delivery"],
//       };
//       DataFilter.dates = { $elemMatch: { status: "Pending" } };
//       DataFilter.payment = "Complete";
//       DataFilter["unsubscribed"] = false;
//     } else if (listStatus == "unsubscribed") {
//       DataFilter["unsubscribed"] = true;
//     } else if (listStatus == "Payment_failed") {
//       DataFilter["payment"] = { $in: ["Failed", "Pending", "failed"] };
//       DataFilter["paymentmethod"] = { $eq: "Paytm" };
//     } else if (listStatus == "All") {
//       //DataFilter["payment"] =
//     } else if (listStatus == "Pending") {
//       DataFilter["BookingStatusByAdmin"] = "Pending";
//       DataFilter["payment"] = "Complete";
//       DataFilter["unsubscribed"] = false;
//     } else if (listStatus == "Rejected") {
//       DataFilter["BookingStatusByAdmin"] = "Rejected";
//       DataFilter["payment"] = "Complete";
//     } else {
//       DataFilter["BookingStatusByAdmin"] = listStatus;
//     }

//     if (userName != null) {
//       DataFilter["userName"] = { $regex: userName, $options: "i" };
//     }
//     if (userEmail != null) {
//       DataFilter["userEmail"] = { $regex: userEmail, $options: "i" };
//     }
//     if (userMobile != null) {
//       DataFilter["$where"] = `/^${userMobile}.*/.test(this.userMobile)`;
//     }

//     if (SubscriptionID != null) {
//       DataFilter["SubscriptionID"] = {
//         $regex: SubscriptionID,
//         $options: "i",
//       };
//     }
//     if (paymentmethod != null) {
//       DataFilter["paymentmethod"] = {
//         $regex: paymentmethod,
//         $options: "i",
//       };
//     }
//     if (OrderTotal != null) {
//       DataFilter["$where"] = `/^${OrderTotal}.*/.test(this.OrderTotal)`;
//     }
//     if (date != null) {
//       var to_date1 = new Date(date);
//       to_date1.setDate(to_date1.getDate() + 1);
//       DataFilter["createDate"] = {
//         $gte: new Date(date),
//         $lte: new Date(to_date1),
//       };
//     }

//     console.log("DataFilterDataFilterDataFilterDataFilterDataFilter :::", DataFilter);
//     Subscription.find(DataFilter)
//       .count()
//       .exec(function (err, count) {
//         Subscription.find(DataFilter)
//           .populate("user_id")
//           .skip(skip)
//           .limit(limit)
//           .sort({ createDate: "desc" })
//           .exec(function (err, data) {
//             if (err) {
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
//   } catch (err) {
//     errorLogger.error(err, "\n", "\n");
//     res.status(400).json(err);
//   }
// };

// // New APIs
// module.exports.getTotalNumberSubscriptions = function (req, res) {
//   Subscription.find({})
//     .count()
//     .exec(function (err, All) {
//       Subscription.find({
//         BookingStatusByAdmin: "Pending",
//         unsubscribed: false,
//         payment: "Complete",
//       })
//         .count()
//         .exec(function (err, Pending) {
//           Subscription.find({
//             BookingStatusByAdmin: {
//               $in: ["Accepted", "Out For Delivery"],
//             },
//             unsubscribed: false,
//             dates: { $elemMatch: { status: "Pending" } },
//             payment: "Complete",
//           })
//             .count()
//             .exec(function (err, Accepted) {
//               Subscription.find({
//                 BookingStatusByAdmin: "Rejected",
//                 unsubscribed: false,
//                 payment: "Complete",
//               })
//                 .count()
//                 .exec(function (err, Rejected) {
//                   Subscription.find({
//                     BookingStatusByAdmin: "Out For Delivery",
//                     unsubscribed: false,
//                     payment: "Complete",
//                   })
//                     .count()
//                     .exec(function (err, OutForDelivery) {
//                       Subscription.find({
//                         BookingStatusByAdmin: "Delivered",
//                         unsubscribed: false,
//                         payment: "Complete",
//                       })
//                         .count()
//                         .exec(function (err, Delivered) {
//                           Subscription.find({
//                             BookingStatusByAdmin: "Payment_Pending",
//                             unsubscribed: false,
//                             payment: "Complete",
//                           })
//                             .count()
//                             .exec(function (err, Payment_Pending) {
//                               Subscription.find({
//                                 $and: [
//                                   {
//                                     $or: [
//                                       {
//                                         BookingStatusByAdmin: "Failed",
//                                         payment: "Failed",
//                                       },
//                                       {
//                                         BookingStatusByAdmin: "failed",
//                                         payment: "Failed",
//                                       },
//                                       {
//                                         BookingStatusByAdmin: "Pending",
//                                         payment: "Pending",
//                                       },
//                                     ],
//                                   },
//                                   {
//                                     paymentmethod: "Paytm",
//                                     bookingMode: "online",
//                                     unsubscribed: false,
//                                   },
//                                 ],
//                               })
//                                 .count()
//                                 .exec(function (err, Payment_failed) {
//                                   Subscription.find({
//                                     unsubscribed: true,
//                                   })
//                                     .count()
//                                     .exec(function (err, cancelled) {
//                                       if (err) {
//                                         res.status(500).json(err);
//                                       } else {
//                                         res.status(200).json({
//                                           message: "ok",
//                                           All: All,
//                                           Pending: Pending,
//                                           Accepted: Accepted,
//                                           Rejected: Rejected,
//                                           OutForDelivery: OutForDelivery,
//                                           Payment_Pending: Payment_Pending,
//                                           Delivered: Delivered,
//                                           Payment_failed: Payment_failed,
//                                           cancelled,
//                                           code: 1,
//                                         });
//                                       }
//                                     });
//                                 });
//                             });
//                         });
//                     });
//                 });
//             });
//         });
//     });
// };

// module.exports.UpdateBookingStatusForSubscriptions = function (req, res) {
//   let { subscription_id, user_id, BookingStatusByAdmin, adminID, date, driverData } = req.body;

//   if (!user_id) {
//     common.formValidate("user_id", res);
//     return false;
//   }
//   if (!subscription_id) {
//     common.formValidate("subscription_id", res);
//     return false;
//   }
//   if (!BookingStatusByAdmin) {
//     common.formValidate("BookingStatusByAdmin", res);
//     return false;
//   }
//   if (!adminID) {
//     common.formValidate("adminID", res);
//     return false;
//   }

//   Subscription.findOne({ _id: subscription_id })
//     .lean()
//     .exec(function (err, SubscriptionData) {
//       if (err) {
//         res.status(404).json({ message: "err", data: err, code: 0 });
//         return;
//       } else if (!SubscriptionData) {
//         res.status(404).json({
//           message: "id not found in the database",
//           data: "",
//           code: 0,
//         });
//         return;
//       } else {
//         var updateData = {
//           BookingStatusByAdmin: BookingStatusByAdmin,
//           BookingStatusByAdminID: adminID,
//         };

//         if (BookingStatusByAdmin == "Out For Delivery") {
//           date = req.body.date;
//           driverData = req.body.driverData;

//           SubscriptionData.dates.forEach((subDate) => {
//             if (new Date(subDate.date).toDateString() == new Date(date).toDateString()) {
//               subDate.status = "Out For Delivery";
//               subDate.driverData = driverData;
//             }
//           });

//           updateData.dates = SubscriptionData.dates;
//         }

//         if (BookingStatusByAdmin == "Delivered") {
//           date = req.body.date;

//           SubscriptionData.dates.forEach((subDate) => {
//             if (new Date(subDate.date).toDateString() == new Date(date).toDateString()) {
//               subDate.status = "Delivered";
//             } else if (subDate.status == "Out For Delivery") {
//               updateData.BookingStatusByAdmin = "Out For Delivery";
//             }
//           });

//           if (updateData.BookingStatusByAdmin !== "Out For Delivery") {
//             SubscriptionData.dates.forEach((subDate) => {
//               if (subDate.status == "Pending") {
//                 updateData.BookingStatusByAdmin = "Accepted";
//               }
//             });
//           }

//           updateData.dates = SubscriptionData.dates;
//         }
//         if (BookingStatusByAdmin == "Rejected") {
//           SubscriptionData.dates.forEach((subDate) => {
//             subDate.status = "Rejected";
//           });

//           updateData.dates = SubscriptionData.dates;
//         }

//         Subscription.updateOne({ _id: subscription_id }, { $set: updateData }, { new: true }, async function (err, UpdatedData) {
//           if (err) {
//             return res.status(500).json({ status: "error", error: err, code: 0 });
//           } else {
//             let notifs = await OnOffDataBase.findOne({}).lean();

//             var userData = await User.findOne({
//               _id: user_id,
//             }).lean();
//             if (BookingStatusByAdmin == "Rejected" && SubscriptionData.preOrder) {
//               await common.reversePreOrderQtyToInventory(subscription_id);
//             }
//             if (BookingStatusByAdmin == "Accepted" || BookingStatusByAdmin == "Rejected") {
//               let selectedNotif = BookingStatusByAdmin == "Accepted" ? notifs.subscription_accepted : notifs.subscription_rejected;
//               let bookingID = SubscriptionData.SubscriptionID;
//               let subject;
//               var subscriptionDates = SubscriptionData.dates;
//               var subscriptionDatesarray = [];
//               for (var i = 0; i < subscriptionDates.length; i++) {
//                 var date = subscriptionDates[i].date;
//                 var date1 = date.toDateString();
//                 subscriptionDatesarray.push(" " + date1);
//               }
//               let name = userData.name;
//               let contactNumber = userData.contactNumber;
//               let email = userData.email;
//               let data = "Order updated";
//               // common.sendOtp(contactNumber, message);
//               if (email && selectedNotif.user_email) {
//                 let template_name = BookingStatusByAdmin == "Accepted" ? "subscription accepted mail to user" : "subscription rejected mail to user";
//                 var keys = {
//                   userName: common.toTitleCase(name),
//                   bookingId: bookingID,
//                   subscriptionDates: subscriptionDatesarray,
//                   type: "user",
//                   template_name: template_name,
//                   userEmail: email,
//                 };
//                 common.dynamicEmail(keys);
//               } else {
//                 res.status(200).json({
//                   message: "ok",
//                   data: update,
//                   code: 1,
//                 });
//                 return;
//               }
//               res.status(200).json({
//                 status: "ok",
//                 data: UpdatedData,
//                 code: 1,
//               });
//             }
//             // else if (
//             //   BookingStatusByAdmin == "Out For Delivery" ||
//             //   BookingStatusByAdmin == "Delivered"
//             // ) {
//             //   let selectedNotif =
//             //     BookingStatusByAdmin == "Delivered"
//             //       ? notifs.subscription_accepted
//             //       : notifs.subscription_rejected;

//             //   let bookingID = SubscriptionData.SubscriptionID;
//             //   let message;
//             //   let subject;
//             //   if (BookingStatusByAdmin == "Out For Delivery") {
//             //     //console.log(date, "  :datedatedatedatedate");
//             //     message =
//             //       "Your subscription with ID " +
//             //       bookingID +
//             //       " for " +
//             //       date.toDateString() +
//             //       " has been dispatched. It will be delivered by " +
//             //       common.toTitleCase(driverData.driver_name) +
//             //       " " +
//             //       driverData.driver_mobile +
//             //       ". Contact us at 919667066462.";

//             //     subject = "Order Out For Delivery";
//             //   } else if (BookingStatusByAdmin == "Delivered") {
//             //     message =
//             //       "Your subscription with ID " +
//             //       bookingID +
//             //       " for " +
//             //       new Date(date).toDateString() +
//             //       " has been successfully delivered. Get in touch with us at 919667066462.";
//             //     subject = "Order Delivered";
//             //   }
//             //   let name = userData.name;
//             //   let contactNumber = userData.contactNumber;
//             //   let email = userData.email;
//             //   let data = "Order updated";
//             //   // common.sendOtp(contactNumber, message);
//             //   if (email && subject != "Order Delivered") {
//             //     common.sendMail(email, subject, name, message, data);
//             //   } else {
//             //     res.status(200).json({
//             //       message: "ok",
//             //       data: update,
//             //       code: 1,
//             //     });
//             //     return;
//             //   }
//             //   res.status(200).json({
//             //     status: "ok",
//             //     data: UpdatedData,
//             //     code: 1,
//             //   });
//             // }
//             else {
//               res.status(200).json({
//                 status: "ok",
//                 data: UpdatedData,
//                 code: 1,
//               });
//             }
//           }
//         });
//       }
//     });
// };

// // cancel a subscription
// module.exports.cancelOne = async (req, res) => {
//   const { subscriptionID } = req.body;

//   try {
//     if (!subscriptionID) {
//       common.formValidate("subscriptionID", res);
//       return false;
//     }

//     Subscription.findOneAndUpdate({ _id: subscriptionID }, { unsubscribed: true }, { new: true }, (err, docs) => {
//       if (err) {
//         res.status(400).json(err);
//       } else {
//         Subscription.findOne({ _id: subscriptionID })
//           .lean()
//           .exec(async function (err, SubscriptionData) {
//             if (SubscriptionData.preOrder) {
//               await common.reversePreOrderQtyToInventory(subscriptionID);
//             }

//             let notifs = await OnOffDataBase.findOne({}).lean();

//             var email = SubscriptionData.userEmail;
//             var name = SubscriptionData.userName;
//             var mobile = SubscriptionData.userMobile;
//             var bookingId = SubscriptionData.SubscriptionID;
//             var data = "Subscription cancelled successfully";

//             if (notifs.subscription_cancelled.user_email) {
//               var keys = {
//                 userName: common.toTitleCase(name),
//                 userMobile: mobile,
//                 bookingId: bookingId,
//                 type: "user",
//                 template_name: "subscription cancelled mail to user",
//                 userEmail: email,
//               };
//               common.dynamicEmail(keys);
//             }

//             let users = await Admin.find(
//               {
//                 user_role: { $in: notifs.subscription_cancelled.admin_roles },
//               },
//               { username: 1, email: 1 }
//             ).lean();

//             if (notifs.subscription_cancelled.admin_email) {
//               users.forEach((user) => {
//                 var keys = {
//                   userName: common.toTitleCase(name),
//                   userMobile: mobile,
//                   bookingId: bookingId,
//                   type: "admin",
//                   template_name: "subscription cancelled mail to admin",
//                   userEmail: email,
//                   adminEmail: user.email,
//                   adminName: user.username,
//                 };
//                 common.dynamicEmail(keys);
//               });
//             }

//             return res.status(200).json({
//               message: "ok",
//               data: "Subscription cancelled successfully",
//               code: 1,
//             });
//           });
//       }
//     });
//   } catch (err) {
//     errorLogger.error(err, "\n", "\n");
//     res.status(400).json(err);
//   }
// };

// // Move today's subscriptions to booking
// // Cron job every day at midnight   0 0 * * *
// cron.schedule("* * * * *", () => {
//   console.log("subscription cron executed !!!");
//   try {
//     let tomorrow = new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(0, 0, 0, 0));
//     //let tomorrow = new Date(new Date(new Date().setDate(new Date().getDate() - 15)).setHours(0, 0, 0, 0))
//     let dayAfterTomorrow = new Date(new Date(new Date().setDate(new Date().getDate() + 2)).setHours(0, 0, 0, 0));
//     console.log(tomorrow);
//     Subscription.find({
//       active: true,
//       BookingStatusByAdmin: "Accepted",
//       payment: "Complete",
//       unsubscribed: false,
//       dates: {
//         $elemMatch: {
//           date: {
//             $gte: tomorrow,
//             $lt: dayAfterTomorrow,
//           },
//           orderCreated: false,
//         },
//       },
//     })
//       .populate("user_id")
//       .lean()
//       .exec((err, docs) => {
//         // console.log(docs);
//         if (err) {
//           errorLogger.error(err, "\n", "\n");
//         } else {
//           async.parallel(
//             docs.map((doc) => {
//               return (callback) => {
//                 let regionId = doc.regionID;

//                 couponDataBase
//                   .findOne({ _id: doc.couponId })
//                   .exec()
//                   .then(async (getCoupon) => {
//                     if (getCoupon) {
//                       var couponId = getCoupon._id;
//                       var couponApplied = true;
//                       var coupon_code = getCoupon.coupon_code;
//                       var discountType = getCoupon.discountType;
//                       var discountAmount = getCoupon.discountAmount;
//                       var discountLocation = getCoupon.discountLocation;
//                       var discountPercentage = getCoupon.discountPercentage;
//                       var discount_upto = getCoupon.discount_upto;
//                       var discountProduct = getCoupon.discountProduct;
//                       var discountProductPackageId = getCoupon.discountProductPackageId;
//                     } else {
//                       var couponId = null;
//                       var couponApplied = false;
//                       var coupon_code = null;
//                       var discountType = null;
//                       var discountAmount = null;
//                       var discountLocation = null;
//                       var discountPercentage = null;
//                       var discount_upto = null;
//                       var discountProduct = null;
//                       var discountProductPackageId = null;
//                     }

//                     var invoiceNO = null;

//                     let billingCompany = await Company.findOne({
//                       isDefault: true,
//                     }).lean();

//                     // console.log(tomorrow);
//                     // console.log(new Date(moment(tomorrow).tz("Asia/kolkata").format("MM/DD/yyyy")));

//                     // checking if all products are in stock
//                     let bookingdetail = doc.bookingdetail;

//                     let simpleProductsQuantity = {};
//                     let configProductsQuantity = {};
//                     let productNotFoundInDB = false;

//                     for (const bookingItem of bookingdetail) {
//                       let [product] = await products
//                         .aggregate([
//                           { $match: { _id: mongoose.Types.ObjectId(bookingItem.product_id._id) } },
//                           // populate product categories
//                           {
//                             $lookup: {
//                               from: "categories",
//                               foreignField: "_id",
//                               localField: "product_categories",
//                               as: "product_categories",
//                             },
//                           },

//                           // For adding quantity keys
//                           ...[
//                             {
//                               $lookup: {
//                                 from: "inventory_items",
//                                 let: { product_id: "$_id" },
//                                 pipeline: [
//                                   {
//                                     $match: {
//                                       $expr: {
//                                         $and: [
//                                           { $eq: ["$product_id", "$$product_id"] },
//                                           {
//                                             $eq: ["$region", mongoose.Types.ObjectId(regionId)],
//                                           },
//                                           { $eq: ["$variant_name", bookingItem.variant_name] },
//                                         ],
//                                       },
//                                     },
//                                   },
//                                   {
//                                     $group: {
//                                       _id: null,
//                                       productQuantity: { $sum: "$productQuantity" },
//                                       bookingQuantity: { $sum: "$bookingQuantity" },
//                                       availableQuantity: { $sum: "$availableQuantity" },
//                                       lostQuantity: { $sum: "$lostQuantity" },
//                                       returnQuantity: { $sum: "$returnQuantity" },
//                                       inhouseQuantity: { $sum: "$inhouseQuantity" },
//                                     },
//                                   },
//                                   { $project: { _id: 0 } },
//                                 ],
//                                 as: "inventories",
//                               },
//                             },
//                             {
//                               $unwind: {
//                                 path: "$inventories",
//                                 preserveNullAndEmptyArrays: true,
//                               },
//                             },
//                             {
//                               $addFields: {
//                                 productQuantity: {
//                                   $ifNull: [{ $toDouble: "$inventories.productQuantity" }, 0],
//                                 },
//                                 bookingQuantity: {
//                                   $ifNull: [{ $toDouble: "$inventories.bookingQuantity" }, 0],
//                                 },
//                                 availableQuantity: {
//                                   $ifNull: [{ $toDouble: "$inventories.availableQuantity" }, 0],
//                                 },
//                                 lostQuantity: {
//                                   $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0],
//                                 },
//                                 returnQuantity: {
//                                   $ifNull: [{ $toDouble: "$inventories.returnQuantity" }, 0],
//                                 },
//                                 inhouseQuantity: {
//                                   $ifNull: [{ $toDouble: "$inventories.inhouseQuantity" }, 0],
//                                 },
//                               },
//                             },
//                           ],

//                           // For Populating nested keys inside nested array of objects
//                           ...[
//                             // inside simpleData array
//                             ...[
//                               {
//                                 $unwind: {
//                                   path: "$simpleData",
//                                   preserveNullAndEmptyArrays: true,
//                                 },
//                               },
//                               {
//                                 $lookup: {
//                                   from: "packages",
//                                   foreignField: "_id",
//                                   localField: "simpleData.package",
//                                   as: "simpleData.package",
//                                 },
//                               },
//                               {
//                                 $group: {
//                                   _id: "$_id",
//                                   product_name: { $first: "$product_name" },
//                                   images: { $first: "$images" },
//                                   simpleData: { $push: "$simpleData" },
//                                   configurableData: { $first: "$configurableData" },
//                                   groupData: { $first: "$groupData" },
//                                   base_price: { $first: "$base_price" },
//                                   slug: { $first: "$slug" },
//                                   TypeOfProduct: { $first: "$TypeOfProduct" },
//                                   outOfStock: { $first: "$outOfStock" },
//                                   productQuantity: { $first: "$productQuantity" },
//                                   bookingQuantity: { $first: "$bookingQuantity" },
//                                   availableQuantity: { $first: "$availableQuantity" },
//                                   lostQuantity: { $first: "$lostQuantity" },
//                                   returnQuantity: { $first: "$returnQuantity" },
//                                   inhouseQuantity: { $first: "$inhouseQuantity" },
//                                   productSubscription: { $first: "$productSubscription" },
//                                   preOrder: { $first: "$preOrder" },
//                                   preOrderQty: { $first: "$preOrderQty" },
//                                   preOrderBookQty: { $first: "$preOrderBookQty" },
//                                   preOrderRemainQty: { $first: "$preOrderRemainQty" },
//                                   preOrderStartDate: { $first: "$preOrderStartDate" },
//                                   preOrderEndDate: { $first: "$preOrderEndDate" },
//                                   sameDayDelivery: { $first: "$sameDayDelivery" },
//                                   farmPickup: { $first: "$farmPickup" },
//                                   priority: { $first: "$priority" },
//                                   status: { $first: "$status" },
//                                   showstatus: { $first: "$showstatus" },
//                                   ratings: { $first: "$ratings" },
//                                   ratingsCount: { $first: "$ratingsCount" },
//                                   reviews: { $first: "$reviews" },
//                                   reviewsCount: { $first: "$reviewsCount" },
//                                   unitMeasurement: { $first: "$unitMeasurement" },
//                                   salesTaxOutSide: { $first: "$salesTaxOutSide" },
//                                   salesTaxWithIn: { $first: "$salesTaxWithIn" },
//                                   purchaseTax: { $first: "$purchaseTax" },
//                                   product_categories: { $first: "$product_categories" },
//                                   // other keys
//                                   barcode: { $first: "$barcode" },
//                                   slug: { $first: "$slug" },
//                                   longDesc: { $first: "$longDesc" },
//                                   shortDesc: { $first: "$shortDesc" },
//                                   attachment: { $first: "$attachment" },
//                                   banner: { $first: "$banner" },
//                                   productThreshold: { $first: "$productThreshold" },
//                                   ProductRegion: { $first: "$ProductRegion" },
//                                   hsnCode: { $first: "$hsnCode" },
//                                   SKUCode: { $first: "$SKUCode" },
//                                   unitQuantity: { $first: "$unitQuantity" },
//                                   productExpiryDay: { $first: "$productExpiryDay" },
//                                   attribute_group: { $first: "$attribute_group" },
//                                   youtube_link: { $first: "$youtube_link" },
//                                   created_at: { $first: "$created_at" },
//                                 },
//                               },
//                             ],

//                             // inside groupData array
//                             ...[
//                               { $unwind: { path: "$groupData", preserveNullAndEmptyArrays: true } },
//                               { $unwind: { path: "$groupData.sets", preserveNullAndEmptyArrays: true } },
//                               // { $sort: { "groupData.sets.priority": 1 } },
//                               {
//                                 $lookup: {
//                                   from: "packages",
//                                   foreignField: "_id",
//                                   localField: "groupData.sets.package",
//                                   as: "groupData.sets.package",
//                                 },
//                               },
//                               {
//                                 $unwind: {
//                                   path: "$groupData.sets.package",
//                                   preserveNullAndEmptyArrays: true,
//                                 },
//                               },
//                               {
//                                 $group: {
//                                   _id: "$_id",
//                                   product_name: { $first: "$product_name" },
//                                   images: { $first: "$images" },
//                                   simpleData: { $first: "$simpleData" },
//                                   configurableData: { $first: "$configurableData" },
//                                   groupData: { $push: "$groupData" },
//                                   base_price: { $first: "$base_price" },
//                                   slug: { $first: "$slug" },
//                                   TypeOfProduct: { $first: "$TypeOfProduct" },
//                                   outOfStock: { $first: "$outOfStock" },
//                                   productQuantity: { $first: "$productQuantity" },
//                                   bookingQuantity: { $first: "$bookingQuantity" },
//                                   availableQuantity: { $first: "$availableQuantity" },
//                                   lostQuantity: { $first: "$lostQuantity" },
//                                   returnQuantity: { $first: "$returnQuantity" },
//                                   inhouseQuantity: { $first: "$inhouseQuantity" },
//                                   productSubscription: { $first: "$productSubscription" },
//                                   preOrderQty: { $first: "$preOrderQty" },
//                                   preOrderBookQty: { $first: "$preOrderBookQty" },
//                                   preOrderRemainQty: { $first: "$preOrderRemainQty" },
//                                   preOrder: { $first: "$preOrder" },
//                                   preOrderStartDate: { $first: "$preOrderStartDate" },
//                                   preOrderEndDate: { $first: "$preOrderEndDate" },
//                                   sameDayDelivery: { $first: "$sameDayDelivery" },
//                                   farmPickup: { $first: "$farmPickup" },
//                                   priority: { $first: "$priority" },
//                                   status: { $first: "$status" },
//                                   showstatus: { $first: "$showstatus" },
//                                   ratings: { $first: "$ratings" },
//                                   ratingsCount: { $first: "$ratingsCount" },
//                                   reviews: { $first: "$reviews" },
//                                   reviewsCount: { $first: "$reviewsCount" },
//                                   unitMeasurement: { $first: "$unitMeasurement" },
//                                   salesTaxOutSide: { $first: "$salesTaxOutSide" },
//                                   salesTaxWithIn: { $first: "$salesTaxWithIn" },
//                                   purchaseTax: { $first: "$purchaseTax" },
//                                   relatedProduct: { $first: "$relatedProduct" },
//                                   product_categories: { $first: "$product_categories" },
//                                   // other keys
//                                   barcode: { $first: "$barcode" },
//                                   slug: { $first: "$slug" },
//                                   longDesc: { $first: "$longDesc" },
//                                   shortDesc: { $first: "$shortDesc" },
//                                   attachment: { $first: "$attachment" },
//                                   banner: { $first: "$banner" },
//                                   productThreshold: { $first: "$productThreshold" },
//                                   ProductRegion: { $first: "$ProductRegion" },
//                                   hsnCode: { $first: "$hsnCode" },
//                                   SKUCode: { $first: "$SKUCode" },
//                                   unitQuantity: { $first: "$unitQuantity" },
//                                   productExpiryDay: { $first: "$productExpiryDay" },
//                                   attribute_group: { $first: "$attribute_group" },
//                                   youtube_link: { $first: "$youtube_link" },
//                                   created_at: { $first: "$created_at" },
//                                 },
//                               },

//                               // For grouping groupData.sets and
//                               // For sorting inner products inside group products based on priorities
//                               {
//                                 $addFields: {
//                                   groupData: {
//                                     $function: {
//                                       body: function (groupData) {
//                                         let new_groupData = [];
//                                         for (let gd of groupData) {
//                                           if (gd.name) {
//                                             let found = false;
//                                             for (let new_gd of new_groupData) {
//                                               if (new_gd._id.toString() === gd._id.toString() && new_gd.name === gd.name) {
//                                                 found = new_gd;
//                                               }
//                                             }
//                                             if (found) {
//                                               found.sets.push(gd.sets);
//                                             } else {
//                                               gd.sets = [gd.sets];
//                                               new_groupData.push(gd);
//                                             }
//                                           }
//                                         }

//                                         for (const gd of new_groupData) {
//                                           for (const set of gd.sets) {
//                                             if (set.priority === null) {
//                                               set.priority = Infinity;
//                                             }
//                                           }
//                                           gd.sets.sort((a, b) => a.priority - b.priority);
//                                         }

//                                         return new_groupData;
//                                       },
//                                       args: ["$groupData"],
//                                       lang: "js",
//                                     },
//                                   },
//                                 },
//                               },
//                             ],
//                           ],
//                         ])
//                         .option({ serializeFunctions: true });

//                       if (!product) {
//                         productNotFoundInDB = true;
//                         continue;
//                       }

//                       if (bookingItem.TypeOfProduct == "simple") {
//                         // check if out of stock
//                         // let simpleData = product.simpleData.filter((data) => data.region == regionId);
//                         // if (simpleData.length == 0) {
//                         //   outOfStock.push(bookingItem.product_id.product_name);
//                         //   continue;
//                         // }

//                         let availQty = product.availableQuantity;
//                         let totalQty = bookingItem.without_package
//                           ? bookingItem.qty * bookingItem.unitQuantity
//                           : bookingItem.qty * bookingItem.packet_size;
//                         console.log("totalQty = ", totalQty, " and availQty = ", availQty);

//                         if (!simpleProductsQuantity[`${product._id}__${regionId}`]) {
//                           simpleProductsQuantity[`${product._id}__${regionId}`] = [
//                             product.product_name,
//                             regionId,
//                             availQty,
//                             totalQty,
//                             product.unitMeasurement,
//                           ];
//                         } else {
//                           simpleProductsQuantity[`${product._id}__${regionId}`][2] = availQty;
//                           simpleProductsQuantity[`${product._id}__${regionId}`][3] += totalQty;
//                         }
//                       } else if (bookingItem.TypeOfProduct == "group") {
//                         // check if any sub-product in group is out of stock
//                         try {
//                           for (let j = 0; j < bookingItem.groupData.length; j++) {
//                             let set = bookingItem.groupData[j];
//                             let setQty = 0;
//                             for (let k = 0; k < set.sets.length; k++) {
//                               let product = set.sets[k].product;

//                               let [productData] = await ProductData.aggregate([
//                                 {
//                                   $match: {
//                                     _id: mongoose.Types.ObjectId(product._id),
//                                     "simpleData.region": mongoose.Types.ObjectId(regionId),
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
//                                                 { $eq: ["$product_id", "$$product_id"] },
//                                                 {
//                                                   $eq: ["$region", mongoose.Types.ObjectId(regionId)],
//                                                 },
//                                               ],
//                                             },
//                                           },
//                                         },
//                                         {
//                                           $group: {
//                                             _id: null,
//                                             productQuantity: { $sum: "$productQuantity" },
//                                             bookingQuantity: { $sum: "$bookingQuantity" },
//                                             availableQuantity: { $sum: "$availableQuantity" },
//                                             lostQuantity: { $sum: "$lostQuantity" },
//                                             returnQuantity: { $sum: "$returnQuantity" },
//                                             inhouseQuantity: { $sum: "$inhouseQuantity" },
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
//                                         $ifNull: [{ $toDouble: "$inventories.productQuantity" }, 0],
//                                       },
//                                       bookingQuantity: {
//                                         $ifNull: [{ $toDouble: "$inventories.bookingQuantity" }, 0],
//                                       },
//                                       availableQuantity: {
//                                         $ifNull: [{ $toDouble: "$inventories.availableQuantity" }, 0],
//                                       },
//                                       lostQuantity: {
//                                         $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0],
//                                       },
//                                       returnQuantity: {
//                                         $ifNull: [{ $toDouble: "$inventories.returnQuantity" }, 0],
//                                       },
//                                       inhouseQuantity: {
//                                         $ifNull: [{ $toDouble: "$inventories.inhouseQuantity" }, 0],
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
//                               ]).option({ serializeFunctions: true });

//                               if (!productData) {
//                                 productNotFoundInDB = true;
//                                 continue;
//                               }

//                               var availQty = productData.availableQuantity;
//                               var totalQty =
//                                 (set.sets[k].package ? set.sets[k].package.packet_size : set.sets[k].unitQuantity) *
//                                 set.sets[k].qty *
//                                 bookingItem.qty;
//                               console.log("totalQty = ", totalQty, " and availQty = ", availQty);

//                               if (!simpleProductsQuantity[`${productData._id}__${regionId}`]) {
//                                 simpleProductsQuantity[`${productData._id}__${regionId}`] = [
//                                   productData.product_name,
//                                   regionId,
//                                   availQty,
//                                   totalQty,
//                                   productData.unitMeasurement,
//                                 ];
//                               } else {
//                                 simpleProductsQuantity[`${productData._id}__${regionId}`][2] = availQty;
//                                 simpleProductsQuantity[`${productData._id}__${regionId}`][3] += totalQty;
//                               }
//                             }
//                           }
//                           // console.log("========================= 2");
//                         } catch (err) {
//                           errorLogger.error(err, "\n", "\n");
//                           console.log("err::::::", err);
//                         }
//                       }
//                     }

//                     let allErrors = [];
//                     for (const key in simpleProductsQuantity) {
//                       if (Object.hasOwnProperty.call(simpleProductsQuantity, key)) {
//                         const element = simpleProductsQuantity[key];
//                         if (element[2] < element[3]) {
//                           allErrors.push(` ${element[0]}`);
//                         }
//                       }
//                     }

//                     for (const key in configProductsQuantity) {
//                       if (Object.hasOwnProperty.call(configProductsQuantity, key)) {
//                         const element = configProductsQuantity[key];
//                         if (element[2] < element[3]) {
//                           allErrors.push(` ${element[0]}`);
//                         }
//                       }
//                     }

//                     if (allErrors.length > 0 || productNotFoundInDB) {
//                       callback(true, "Failed");

//                       // find if mail is already sent
//                       let mailSent = doc.dates.filter((date) => +date.date >= +tomorrow && +date.date < +dayAfterTomorrow)[0].mailSent;
//                       console.log("mailSentmailSentmailSentmailSent ", mailSent);

//                       // send mail if not already sent
//                       if (!mailSent) {
//                         let users = await Admin.find(
//                           {
//                             user_role: {
//                               $in: ["60e2cdf2a68f4170e70a8d61", "600a85c1759e8aa636d870fe", "60e2cd8ea68f4170e70a8d5e"],
//                             },
//                           },
//                           { username: 1, email: 1 }
//                         ).lean();

//                         let subject = `Order Failed for ${doc.SubscriptionID}`;
//                         let message = `An order cannot be placed from ${doc.SubscriptionID} due to insufficient inventory of ${allErrors}. `;

//                         users.forEach((user) => {
//                           common.sendMail(user.email, subject, user.username, message);
//                         });

//                         // update mailSent status after sending mail

//                         let docDates = doc.dates.map((date) => {
//                           if (+date.date >= +tomorrow && +date.date < +dayAfterTomorrow) {
//                             date.mailSent = true;
//                           }
//                           return date;
//                         });

//                         let subUpdated = await Subscription.updateOne({ _id: doc._id }, { $set: { dates: docDates } });

//                         console.log("mail sent to users");
//                       }

//                       return;
//                     }

//                     // creating new order

//                     let jsonData = {
//                       user_id: doc.user_id._id,
//                       userName: doc.user_id.name,
//                       userEmail: doc.user_id.email,
//                       userMobile: doc.user_id.contactNumber,
//                       userType: doc.user_id.user_type,
//                       userData: doc.user_id,
//                       subscriptionID: doc._id,
//                       subscriptionCode: doc.SubscriptionID,
//                       regionName: doc.regionName,
//                       regionID: doc.regionID,
//                       device_name: doc.device_name,
//                       preOrder: doc.preOrder,
//                       bookingMode: "online",
//                       booking_code: "KC",
//                       DeliveryDate: new Date(+new Date(tomorrow) + 19800000),
//                       invoiceNO: invoiceNO,
//                       paymentmethod: doc.paymentmethod,
//                       payment: doc.payment,
//                       totalCouponDiscountAmount: doc.totalCouponDiscountAmount,
//                       total_payment: doc.total_payment,
//                       totalCartPriceWithoutGST: doc.totalCartPriceWithoutGST,
//                       booking_address: doc.booking_address,
//                       delivery_instructions: doc.delivery_instructions,
//                       deliveryCharges: doc.deliveryCharges,
//                       otheraddress: null,
//                       bookingdetail: doc.bookingdetail,
//                       billingCompany: billingCompany._id,
//                       couponId: couponId,
//                       couponApplied: couponApplied,
//                       coupon_code: coupon_code,
//                       discountType: discountType,
//                       discountAmount: discountAmount,
//                       discountLocation: discountLocation,
//                       discountPercentage: discountPercentage,
//                       discount_upto: discount_upto,
//                       discountProduct: discountProduct,
//                       discountProductPackageId: discountProductPackageId,
//                       redeem_point: doc.redeem_point,
//                       redeemDiscount: doc.redeemDiscount,
//                       referralDiscount: doc.referralDiscount,
//                       allGstLists: doc.allGstLists,
//                       gst: doc.gst,
//                       totalCartPrice: doc.totalCartPrice,
//                       BookingStatusByAdmin: "Pending",
//                       //BookingStatusByAdmin: "Accepted",
//                       deliverySlot: doc.deliverySlot,
//                       inventory_ids: doc.inventory_ids,
//                     };
//                     //console.log(jsonData,'jsonDatajsonDatajsonData')
//                     bookingDataBase.create(jsonData, async function (err, insertedData) {
//                       if (err) {
//                         errorLogger.error(err, "\n", "\n");
//                         //console.log(err, 'errrrrrrrrrrrrrrrrrrrrrrrrrrrr')
//                         callback(true, "failed");
//                       } else {
//                         // update order id with counter start added by chitra
//                         var booking_code = "KC" + (insertedData.counter < 10 ? "0" + insertedData.counter : insertedData.counter);

//                         var d = new Date();
//                         var year = d.getFullYear();
//                         var date = d.getDate();
//                         // var invoiceNO =
//                         //   insertedData.counter +
//                         //   "/" +
//                         //   `${new Date().getFullYear().toString()}-${(
//                         //     new Date().getFullYear() + 1
//                         //   )
//                         //     .toString()
//                         //     .slice(2)}`;

//                         let updated = await bookingDataBase.update(
//                           {
//                             _id: insertedData._id,
//                           },
//                           {
//                             booking_code: booking_code,
//                             //invoiceNO: invoiceNO,
//                           }
//                         );
//                         //update order id with counter end
//                         var bookingID = insertedData._id;
//                         if (doc.preOrder === false) {
//                           await common.reduceQtyFormproductAndInventory(bookingID);
//                         }

//                         let docActive = doc.dates.filter((date) => +date.date >= +dayAfterTomorrow).length > 0;
//                         let docDates = doc.dates.map((date) => {
//                           if (+date.date >= +tomorrow && +date.date < +dayAfterTomorrow) {
//                             date.orderCreated = true;
//                           }
//                           return date;
//                         });

//                         let subUpdated = await Subscription.updateOne({ _id: doc._id }, { $set: { active: docActive, dates: docDates } });
//                         callback(false, "success");
//                       }
//                     });
//                   });
//               };
//             }),

//             (err, results) => {
//               // main task results
//               if (err) {
//                 errorLogger.error(err, "\n", "\n");
//                 console.log("somethings went wrong on daily subscription cron");
//               } else {
//                 console.log("daily subscription cron Complete without errors");
//               }
//               //console.log(results);
//             }
//           );
//         }
//       });
//   } catch (err) {
//     errorLogger.error(err, "\n", "\n");
//     console.log("catch error ::::: ", err);
//   }
// });

const mongoose = require("mongoose");
const cron = require("node-cron");
const Subscription = mongoose.model("subscriptions");
var inventoryDataBase = mongoose.model("inventory");
var addToCartDataBase = mongoose.model("addtocarts");
var WalletHistories = mongoose.model("wallet_histories");
var User = mongoose.model("Users");
const products = mongoose.model("products");
const bookingDataBase = mongoose.model("bookings");
const couponDataBase = mongoose.model("coupon_masters");
var Company = mongoose.model("companies");
var Admin = mongoose.model("admin");
var Roles = mongoose.model("role");
var OnOffDataBase = mongoose.model("email_sms_on_off");
const Razorpay = require("razorpay");
var payment_table = mongoose.model("payment_options");

var settingsModel = mongoose.model("settings");
var LoyalityProgramHistory = mongoose.model("loyality_program_histories");
var LoyalityPrograms = mongoose.model("loyality_programs");

const common = require("../../common");
var errorLogger = common.errorLogger;
const async = require("async");

const moment = require("moment-timezone");

module.exports.addOne = async (req, res) => {
  var {
    cartDetail,
    user_id,
    user_name,
    user_email,
    userMobile,
    userType,
    dates,
    paymentmethod,
    regionName,
    regionID,
    address,
    country,
    state,
    city,
    pincode,
    locality,
    locationTag,
    houseNo,
    latitude,
    longitude,
    delivery_instructions,
    couponId,
    total_payment,
    gst,
    allGstLists,
    cod,
    deliveryCharges,
    codCharges,
    totalCartPrice,
    totalCouponDiscountAmount,
    totalCartPriceWithoutGST,
    device_name,
    preOrder,
    itemWiseData,
    redeem,
    redeemDiscount,
    referralDiscount,
    deliverySlot,
    createDbDoc,
  } = req.body;
  {
    // console.log(dates);
    // var datesArray = Array.isArray(dates);

    // if (datesArray == true) {
    //   var dates = dates;
    // } else {
    //   var dates = [{ date: dates }];
    // }
    if (!cartDetail) {
      common.formValidate("cartDetail", res);
      return false;
    }

    if (cartDetail.length === 0) {
      return res.status(400).json({
        allErrors: [],
        status: "error",
        msg: "Cart needs to have atleast one product added.",
      });
    }

    if (!dates) {
      common.formValidate("dates", res);
      return false;
    }

    if (dates.length === 0) {
      return res.status(400).json({
        allErrors: [],
        status: "error",
        msg: "Please choose at least one date for subsciption.",
      });
    }

    if (!user_id) {
      common.formValidate("user_id", res);
      return false;
    } else {
      var userData = await User.findOne({ _id: user_id }).lean();
      // console.log(user_id, "user_id user_id user_id");
      // console.log(userData, "userrrrrrrrrrrr");
      if (!userData) {
        return res.status(401).json({
          allErrors: [],
          status: "error",
          msg: "Your account is currently disabled. Please contact us for more information.",
        });
      }
    }

    if (!user_name) {
      common.formValidate("user_name", res);
      return false;
    }

    if (!user_email) {
      common.formValidate("user_email", res);
      return false;
    }

    if (!userMobile) {
      common.formValidate("userMobile", res);
      return false;
    }

    // if (!userType) {
    //   common.formValidate("userType", res);
    //   return false;
    // }

    if (!paymentmethod) {
      common.formValidate("paymentmethod", res);
      return false;
    }

    if (!regionName) {
      common.formValidate("regionName", res);
      return false;
    }

    if (!regionID) {
      common.formValidate("regionID", res);
      return false;
    }

    if (!address) {
      common.formValidate("address", res);
      return false;
    }
    if (!country) {
      common.formValidate("country", res);
      return false;
    }
    if (!state) {
      common.formValidate("state", res);
      return false;
    }
    if (!city) {
      common.formValidate("city", res);
      return false;
    }
    // if (!deliverySlot) {
    //     common.formValidate("deliverySlot", res);
    //     return false;
    // }
    // if (paymentmethod !userData= "Paytm") {
    //     return res.status(500).json({
    //         msg: "Only 'Paytm' allowed in paymentmethod for now",
    //         code: 0,
    //     });
    // }
    // if (!locality) {
    //   common.formValidate("Locality", res);
    //   return false;
    // }
    if (!total_payment) {
      common.formValidate("total_payment", res);
      return false;
    }
    if (!itemWiseData) {
      common.formValidate("itemWiseData", res);
      return false;
    }
  }
  console.log(req.body, "subsrcibe");
  if (userData.walletAmount < +total_payment * dates.length && paymentmethod.toLocaleLowerCase() == "wallet") {
    return res.status(500).json({
      allErrors: [],
      status: "error",
      msg: "Wallet amount less than order amount. Choose some other payment method.",
    });
  }
  if (userData.walletAmount < total_payment && paymentmethod.toLocaleLowerCase() == "wallet") {
    return res.status(500).paymentmethodjson({
      allErrors: [],
      status: "error",
      msg: "Wallet amount less than order amount. Choose some other payment method.",
    });
  }

  // credit limit check
  if (paymentmethod === "Credit" && +total_payment + +userData.creditUsed > +userData.creditLimit) {
    return res.status(400).json({
      allErrors: [],
      status: "error",
      msg: "Credit Limit Exceeded.",
      creditUsed: userData.creditUsed,
      creditLimit: userData.creditLimit,
    });
  }

  // Referral and Loyalty Checks **********************************************************

  // identify loyalty program
  var getSettings = await settingsModel.find({}).lean();
  getSettings = getSettings[0];
  var program = await LoyalityPrograms.find({
    $and: [
      {
        startOrderNo: {
          $lte: userData.NoOfOrder + userData.prevNoOfOrder + 1,
        },
      },
      { endOrderNo: { $gte: userData.NoOfOrder + userData.prevNoOfOrder + 1 } },
    ],
  }).lean();
  program = program[0];

  // loyalty checks
  if (+redeem * dates.length > 0 && getSettings.loyalityProgramOnOff == "off") {
    return res.status(500).json({
      allErrors: [],
      status: "error",
      msg: "loyalty program is off.... you can't redeem krishi seeds.",
    });
  }

  var maxRedeemAllowed = (userData.TotalPoint ? +userData.TotalPoint : 0) * getSettings.seedValue;

  if (+redeemDiscount * dates.length > maxRedeemAllowed) {
    return res.status(500).json({
      allErrors: [],
      status: "error",
      msg: `Maximum redeem discount exceeded - ${maxRedeemAllowed}`,
    });
  }

  // referral checks
  if (+referralDiscount * dates.length > 0 && getSettings.refferalPointsOnOff == "off") {
    return res.status(500).json({
      allErrors: [],
      status: "error",
      msg: `referral program is off.... you can't have referral discount`,
    });
  }
  if (+referralDiscount * dates.length > 0 && !userData.refferalCodeFrom) {
    return res.status(500).json({
      allErrors: [],
      status: "error",
      msg: "you didn't use any referral code while signing up... not eligible for referral discount.",
    });
  }
  if (+referralDiscount * dates.length > 0 && userData.NoOfOrder + userData.prevNoOfOrder >= 3) {
    return res.status(500).json({
      allErrors: [],
      status: "error",
      msg: "referral discount can be used only for 1st 3 orders.",
    });
  }
  if (+referralDiscount > 0 && couponId) {
    return res.status(500).json({
      allErrors: [],
      status: "error",
      msg: "Coupon and Referral discount can't be used together.",
    });
  }

  // Referral and Loyalty Checks ends **********************************************************

  if (cartDetail) {
    cartDetail = cartDetail.map((cartItem) => {
      return {
        ...cartItem,
        product_SKUCode: cartItem.product_id.SKUCode,
        product_categories: cartItem.product_categories,
        product_images: cartItem.product_id.images,
        product_longDesc: cartItem.product_id.longDesc,
        product_shortDesc: cartItem.product_id.shortDesc,
        product_name: cartItem.product_id ? cartItem.product_id.product_name : null,
        product_subCat1_name: cartItem.product_id.product_subCat1_id ? cartItem.product_id.product_subCat1_id.category_name : null,
      };
    });
  }

  let booking_address = {
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

  couponId = couponId ? couponId : null;

  couponDataBase
    .findOne({ _id: couponId })
    .exec()
    .then(async (getCoupon) => {
      if (getCoupon) {
        couponId = getCoupon._id;
        var couponApplied = true;
        var coupon_code = getCoupon.coupon_code;
        var discountType = getCoupon.discountType;
        var discountAmount = getCoupon.discountAmount;
        var discountLocation = getCoupon.discountLocation;
        var discountPercentage = getCoupon.discountPercentage;
        var discount_upto = getCoupon.discount_upto;
        var discountProduct = getCoupon.discountProduct;
        var discountProductPackageId = getCoupon.discountProductPackageId;
      } else {
        couponId = null;
        var couponApplied = false;
        var coupon_code = null;
        var discountType = null;
        var discountAmount = null;
        var discountLocation = null;
        var discountPercentage = null;
        var discount_upto = null;
        var discountProduct = null;
        var discountProductPackageId = null;
      }

      // console.log("before 0000000000000000", caallErrorsrtDetail, itemWiseData);
      // make sure that data coming from cart and data from checkout page is same (if same account on two devices)
      {
        let tp = 0;
        for (const item1 of cartDetail) {
          //console.log("item1item1item1item1item1item1item1item1", item1);
          tp += item1.totalprice;

          let itemMatched = false;
          itemWiseData.forEach((item2) => {
            //console.log("item2item2item2item2item2item2item2item2item2", item2);
            if (item1.product_id._id.toString() == item2._id && item1.packet_size == item2.packet_size) {
              itemMatched = true;
            }
          });
          //console.log("inside 0");
          if (!itemMatched) {
            return res.status(500).json({
              allErrors: [],
              status: "error",
              msg: "Your cart has been modified on another device you may have previously logged on to. Please check your cart once before you proceed.",
              code: 0,
            });
          }
        }
        console.log("inside 1");
        if (req.body.totalCartPrice != tp) {
          return res.status(500).json({
            allErrors: [],
            status: "error",
            msg: "Your cart has been modified on another device you may have previously logged on to. Please check your cart once before you proceed.",
            code: 1,
          });
        }

        if (cartDetail.length != itemWiseData.length) {
          return res.status(500).json({
            allErrors: [],
            status: "error",
            msg: "Your cart has been modified on another device you may have previously logged on to. Please check your cart once before you proceed.",
            code: 2,
          });
        }

        let pre_order1 = false;
        itemWiseData.forEach((item2) => {
          if (item2.preOrder) {
            pre_order1 = true;
          }
        });
        console.log("inside 2");
        if (pre_order1 != req.body.preOrder) {
          return res.status(500).json({
            allErrors: [],
            status: "error",
            msg: "Your cart has been modified on another device you may have previously logged on to. Please check your cart once before you proceed.",
            code: 3,
          });
        }
      }
      console.log("after 0000000000000000");

      cartDetail.forEach((item1) => {
        itemWiseData.forEach((item2) => {
          if (item1.product_id._id.toString() == item2._id && item1.packet_size == item2.packet_size) {
            item1.preOrderStartDate = item2.preOrderStartDate;
            item1.preOrderEndDate = item2.preOrderEndDate;
            item1.totalPriceBeforeGST = item2.totalPriceBeforeGST;
            item1.totalPriceAfterGST = item2.totalPriceAfterGST ? item2.totalPriceAfterGST : +item2.totalPriceBeforeGST + +item2.itemWiseGst;
            item1.itemDiscountAmountBeforeGST = item2.itemDiscountAmountBeforeGST;
            item1.itemDiscountAmount = item2.itemDiscountAmount;
            item1.itemWiseGst = item2.itemWiseGst;
          }
        });
      });

      var invoiceNO = null;

      if (preOrder) {
        // checking if all products are in stock
        let bookingdetail = cartDetail;
        let regionId = regionID;

        let simpleProductsQuantity = {};
        let configProductsQuantity = {};

        for (const bookingItem of bookingdetail) {
          let [product] = await products
            .aggregate([
              { $match: { _id: mongoose.Types.ObjectId(bookingItem.product_id._id) } },
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
                              { $eq: ["$variant_name", bookingItem.variant_name] },
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
                  { $unwind: { path: "$groupData", preserveNullAndEmptyArrays: true } },
                  { $unwind: { path: "$groupData.sets", preserveNullAndEmptyArrays: true } },
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

          // if (!product) {
          //   notAdded.push(bookingItem.product_id.product_name || bookingItem.product_id);
          //   continue;
          // }
          // if (!product.status || !product.showstatus) {
          //   outOfStock.push(product.product_name);
          //   continue;
          // }
          // let productCatStatus = true;
          // for (const cat of product.product_categories) {
          //   if (!cat.status) {
          //     productCatStatus = false;
          //   }
          // }
          // if (!productCatStatus) {
          //   outOfStock.push(product.product_name);
          //   continue;
          // }

          if (bookingItem.TypeOfProduct == "simple") {
            // check if out of stock
            // let simpleData = product.simpleData.filter((data) => data.region == regionId);
            // if (simpleData.length == 0) {
            //   outOfStock.push(bookingItem.product_id.product_name);
            //   continue;
            // }

            let availQty = product.availableQuantity;
            let totalQty = bookingItem.without_package ? bookingItem.qty * bookingItem.unitQuantity : bookingItem.qty * bookingItem.packet_size;
            console.log("totalQty = ", totalQty, " and availQty = ", availQty);

            if (!simpleProductsQuantity[`${product._id}__${regionId}`]) {
              simpleProductsQuantity[`${product._id}__${regionId}`] = [product.product_name, regionId, availQty, totalQty, product.unitMeasurement];
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
                  var totalQty =
                    (set.sets[k].package ? set.sets[k].package.packet_size : set.sets[k].unitQuantity) * set.sets[k].qty * bookingItem.qty;
                  console.log("totalQty = ", totalQty, " and availQty = ", availQty);

                  if (!simpleProductsQuantity[`${productData._id}__${regionId}`]) {
                    simpleProductsQuantity[`${productData._id}__${regionId}`] = [
                      productData.product_name,
                      regionId,
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
            allErrors,
            status: "error",
            msg: "",
          });
        }
      }

      console.log("outside the preorder qty check block");

      if (!createDbDoc && paymentmethod == "Razorpay") {
        let SubscriptionID = "SubscriptionID";
        let sub = new Subscription({
          user_id,
          userData,
          userName: user_name,
          userEmail: user_email,
          userType,
          userMobile,
          SubscriptionID,
          invoiceNO,
          bookingdetail: cartDetail,
          dates,
          bookingMode: "online",
          paymentmethod,
          TXNID: req.body.TXNID || null,
          payment: "Failed",
          regionName,
          regionID,
          booking_address,
          delivery_instructions,
          total_payment,
          OrderTotal: total_payment * dates.length,
          cod,
          deliveryCharges,
          codCharges,
          gst,
          allGstLists,
          totalCouponDiscountAmount: totalCouponDiscountAmount ? totalCouponDiscountAmount : 0,
          couponId,
          couponApplied,
          discountLocation,
          coupon_code,
          discountType,
          discountAmount: totalCouponDiscountAmount ? totalCouponDiscountAmount : discountAmount,
          discountPercentage,
          discount_upto,
          discountProduct,
          discountProductPackageId,
          totalCartPrice,
          totalCartPriceWithoutGST,
          device_name,
          preOrder,
          redeem_point: redeem,
          redeemDiscount,
          referralDiscount,
          deliverySlot,
          loyaltyProgram: program,
        });
        sub.save(async (err, sub) => {
          if (err) {
            console.error("err :::: ", err);
          } else {
            var SubscriptionID = "SubscriptionID" + sub.counter;

            var d = new Date();
            var year = d.getFullYear();
            var date = d.getDate();

            var invoiceNO = "S" + sub.counter + "/" + `${new Date().getFullYear().toString()}-${(new Date().getFullYear() + 1).toString().slice(2)}`;

            // let notifs = await OnOffDataBase.findOne({}).lean();

            const paymentdata = await payment_table.find();
            const rozarpay_patment_rediantials = paymentdata.filter((curdata) => curdata.name == "Razorpay");
            var instance = new Razorpay({
              key_id: rozarpay_patment_rediantials[0].keys.keyid,
              key_secret: rozarpay_patment_rediantials[0].keys.secretid,
            });
            var response = await instance.orders.create({
              amount: +(total_payment * dates.length) * 100,
              currency: "INR",
              receipt: "receipt#1",
              notes: {
                key1: "website order-subscription",
                key2: SubscriptionID,
              },
            });
            console.log(response, "responseresponseresponseresponseresponse");
            await Subscription.updateOne(
              { _id: sub._id },
              { SubscriptionID, invoiceNO, BookingStatusByAdmin: "Failed", razorpay_orderid: response.id }
            );
            return res.status(200).json({
              message: "ok",
              data: "subscription cretaed",
              code: 1,
              allErrors: [],
              status: "ok",
              response: response,
              msg: `All checks passed`,
            });
          }
        });
        return;
      }
      var SubscriptionID = "SubscriptionID";
      let sub = new Subscription({
        user_id,
        userData,
        userName: user_name,
        userEmail: user_email,
        userType,
        userMobile,
        SubscriptionID,
        invoiceNO,
        bookingdetail: cartDetail,
        dates,
        bookingMode: "online",
        paymentmethod,
        TXNID: req.body.TXNID || null,
        payment: req.body.payment || "Failed",
        regionName,
        regionID,
        booking_address,
        delivery_instructions,
        total_payment,
        OrderTotal: total_payment * dates.length,
        cod,
        deliveryCharges,
        codCharges,
        gst,
        allGstLists,
        totalCouponDiscountAmount: totalCouponDiscountAmount ? totalCouponDiscountAmount : 0,
        couponId,
        couponApplied,
        discountLocation,
        coupon_code,
        discountType,
        discountAmount: totalCouponDiscountAmount ? totalCouponDiscountAmount : discountAmount,
        discountPercentage,
        discount_upto,
        discountProduct,
        discountProductPackageId,
        totalCartPrice,
        totalCartPriceWithoutGST,
        device_name,
        preOrder,
        redeem_point: redeem,
        redeemDiscount,
        referralDiscount,
        deliverySlot,
        loyaltyProgram: program,
      });
      sub.save(async (err, sub) => {
        if (err) {
          console.error("err :::: ", err);
        } else {
          // update SubscriptionId
          var SubscriptionID = "SubscriptionID" + sub.counter;

          var d = new Date();
          var year = d.getFullYear();
          var date = d.getDate();

          var invoiceNO = "S" + sub.counter + "/" + `${new Date().getFullYear().toString()}-${(new Date().getFullYear() + 1).toString().slice(2)}`;

          await Subscription.update({ _id: sub._id }, { SubscriptionID, invoiceNO });

          let notifs = await OnOffDataBase.findOne({}).lean();

          var orderDetails = {
            name: sub.userName,
            SubscriptionID: SubscriptionID,
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
          //console.log(orderDetails)
          if (paymentmethod.toLocaleLowerCase() == "paytm") {
            var num = +total_payment * dates.length;
            var totalAmount = num.toFixed(2);
            if (device_name === "mobile") {
              var CHANNEL_ID = "WAP";
            } else {
              var CHANNEL_ID = "WEB";
            }
            var paymentDetails = {
              amount: String(totalAmount),
              customerId: user_id,
              customerEmail: user_email,
              customerPhone: String(userMobile),
              ORDER_ID: SubscriptionID,
              CHANNEL_ID: CHANNEL_ID,
            };

            common.SubscriptionPayNow(paymentDetails, res);
          } else if (paymentmethod.toLocaleLowerCase() == "wallet") {
            await User.findOneAndUpdate(
              { _id: user_id },
              {
                $inc: {
                  walletAmount: -(+total_payment * dates.length),
                },
              }
            );
            var walletHistory = {
              user_id,
              amount: +total_payment * dates.length,
              type: "debit",
              paymentStatus: "Complete",
              debitType: "subscription",
              subscription_id: sub._id,
              SubscriptionID: SubscriptionID,
            };
            WalletHistories.create(walletHistory, async (err, doc) => {
              if (err) {
                res.status(500).json({
                  allErrors: [],
                  status: "error",
                  msg: "Something went wrong. Please try again after sometime.",
                });
              } else {
                let jsonData = {
                  user_id: user_id,
                  totalCartPrice: 0,
                  CartDetail: [],
                };
                await addToCartDataBase.findOneAndUpdate(
                  {
                    user_id: user_id,
                  },
                  {
                    $set: jsonData,
                  }
                );

                await Subscription.updateOne({ _id: sub._id }, { payment: "Complete" });
                orderDetails.paymentStatus = "Complete";

                await common.processLoyaltyAndRefferal(SubscriptionID, getSettings.loyalityProgramOnOff, getSettings.refferalPointsOnOff);

                if (preOrder === true) {
                  //console.log("preOrderpreOrderpreOrder", preOrder, ":::", sub._id);
                  var abc = "on the pre-order date";
                  var adminAbc = "on the pre-order date";
                  var subPrimeryID = sub._id;
                  console.log("reducePreOrderQtyFormproductAndInventory before");
                  await common.reducePreOrderQtyFormproductAndInventory(subPrimeryID);
                  console.log("reducePreOrderQtyFormproductAndInventory after");
                } else {
                  var abc = "to you on the following days";
                  var adminAbc = "on the following days";
                }

                var email = userData.email;
                var name = userData.name;
                var userMobile = userData.contactNumber;
                var OrderDates = orderDetails.dates.map((item) => item.date.toDateString()).join(`, </br>`);

                var data = SubscriptionID;
                var subscriptionDates = orderDetails.dates;
                var subscriptionDatesarray = [];
                for (var i = 0; i < subscriptionDates.length; i++) {
                  var date = subscriptionDates[i].date;
                  var date1 = date.toDateString();
                  subscriptionDatesarray.push(" " + date1);
                }
                var ProductDetail = await common.OrderDetails(orderDetails);
                if (notifs.subscription_placed.user_email) {
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
                  //common.sendMail(email, subject, name, message, data, orderDetails);
                }

                let users = await Admin.find(
                  {
                    user_role: { $in: notifs.subscription_placed.admin_roles },
                  },
                  { username: 1, email: 1 }
                ).lean();

                if (notifs.subscription_placed.admin_email) {
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
                    // common.sendMail(
                    //   user.email,
                    //   subject,
                    //   user.username,
                    //   adminMessage,
                    //   data,
                    //   orderDetails
                    // );
                  });
                }

                return res.status(200).json({
                  message: "ok",
                  data: SubscriptionID,
                  code: 1,
                });
              }
            });
          } else {
            if (paymentmethod === "Credit") {
              await User.updateOne({ _id: user_id }, { $inc: { creditUsed: +total_payment } });
            }

            await common.processLoyaltyAndRefferal(SubscriptionID, getSettings.loyalityProgramOnOff, getSettings.refferalPointsOnOff);

            if (preOrder === true) {
              //console.log("preOrderpreOrderpreOrder", preOrder, ":::", sub._id);
              var abc = "on the pre-order date";
              var adminAbc = "on the pre-order date";
              var subPrimeryID = sub._id;
              console.log("reducePreOrderQtyFormproductAndInventory before");
              await common.reducePreOrderQtyFormproductAndInventory(subPrimeryID);
              console.log("reducePreOrderQtyFormproductAndInventory after");
            } else {
              var abc = "to you on the following days";
              var adminAbc = "on the following days";
            }

            var email = userData.email;
            var name = userData.name;
            var userMobile = userData.contactNumber;
            var OrderDates = orderDetails.dates.map((item) => item.date.toDateString()).join(`, </br>`);

            var data = SubscriptionID;
            var subscriptionDates = orderDetails.dates;
            var subscriptionDatesarray = [];
            for (var i = 0; i < subscriptionDates.length; i++) {
              var date = subscriptionDates[i].date;
              var date1 = date.toDateString();
              subscriptionDatesarray.push(" " + date1);
            }
            var ProductDetail = await common.OrderDetails(orderDetails);
            if (notifs.subscription_placed.user_email) {
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
              //common.sendMail(email, subject, name, message, data, orderDetails);
            }

            let users = await Admin.find({ user_role: { $in: notifs.subscription_placed.admin_roles } }, { username: 1, email: 1 }).lean();

            if (notifs.subscription_placed.admin_email) {
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
                // common.sendMail(
                //   user.email,
                //   subject,
                //   user.username,
                //   adminMessage,
                //   data,
                //   orderDetails
                // );
              });
            }

            return res.status(200).json({
              message: "ok",
              data: SubscriptionID,
              code: 1,
            });
          }
        }
      });
    })
    .catch((err) => {
      errorLogger.error(err, "\n", "\n");
    });
};

// All Subscriptions of a single user
module.exports.getAll = (req, res) => {
  const user_id = req.decoded.ID;

  try {
    if (!user_id) {
      common.formValidate("user_id", res);
      return false;
    }
    Subscription.find({ user_id, payment: "Complete" })
      .count()
      .exec(function (err, count) {
        Subscription.find({ user_id, payment: "Complete" })
          .populate("user_id")
          .sort({ createDate: "desc" })
          .exec(function (err, docs) {
            if (err) {
              res.status(400).json(err);
            } else {
              res.status(200).json({
                message: "ok",
                data: docs,
                count: count,
                code: 1,
              });
            }
          });
      });
  } catch (err) {
    errorLogger.error(err, "\n", "\n");
    res.status(400).json(err);
  }
};

// All Subscriptions (For admin)
module.exports.adminGetAll = (req, res) => {
  const { skip, limit, listStatus, userName, userEmail, userMobile, SubscriptionID, OrderTotal, date, paymentmethod } = req.body;

  try {
    if (!listStatus) {
      common.formValidate("listStatus", res);
      return false;
    }

    var DataFilter = {};

    if (listStatus == "Accepted") {
      DataFilter.BookingStatusByAdmin = {
        $in: ["Accepted", "Out For Delivery"],
      };
      DataFilter.dates = { $elemMatch: { status: "Pending" } };
      DataFilter.payment = "Complete";
      DataFilter["unsubscribed"] = false;
    } else if (listStatus == "unsubscribed") {
      DataFilter["unsubscribed"] = true;
    } else if (listStatus == "Payment_failed") {
      DataFilter["payment"] = { $in: ["Failed", "Pending", "failed"] };
      DataFilter["paymentmethod"] = { $eq: "Paytm" };
    } else if (listStatus == "All") {
      //DataFilter["payment"] =
    } else if (listStatus == "Pending") {
      DataFilter["BookingStatusByAdmin"] = "Pending";
      DataFilter["payment"] = "Complete";
      DataFilter["unsubscribed"] = false;
    } else if (listStatus == "Rejected") {
      DataFilter["BookingStatusByAdmin"] = "Rejected";
      DataFilter["payment"] = "Complete";
    } else {
      DataFilter["BookingStatusByAdmin"] = listStatus;
    }

    if (userName != null) {
      DataFilter["userName"] = { $regex: userName, $options: "i" };
    }
    if (userEmail != null) {
      DataFilter["userEmail"] = { $regex: userEmail, $options: "i" };
    }
    if (userMobile != null) {
      DataFilter["$where"] = `/^${userMobile}.*/.test(this.userMobile)`;
    }

    if (SubscriptionID != null) {
      DataFilter["SubscriptionID"] = {
        $regex: SubscriptionID,
        $options: "i",
      };
    }
    if (paymentmethod != null) {
      DataFilter["paymentmethod"] = {
        $regex: paymentmethod,
        $options: "i",
      };
    }
    if (OrderTotal != null) {
      DataFilter["$where"] = `/^${OrderTotal}.*/.test(this.OrderTotal)`;
    }
    if (date != null) {
      var to_date1 = new Date(date);
      to_date1.setDate(to_date1.getDate() + 1);
      DataFilter["createDate"] = {
        $gte: new Date(date),
        $lte: new Date(to_date1),
      };
    }

    console.log("DataFilterDataFilterDataFilterDataFilterDataFilter :::", DataFilter);
    Subscription.find(DataFilter)
      .count()
      .exec(function (err, count) {
        Subscription.find(DataFilter)
          .populate("user_id")
          .skip(skip)
          .limit(limit)
          .sort({ createDate: "desc" })
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
  } catch (err) {
    errorLogger.error(err, "\n", "\n");
    res.status(400).json(err);
  }
};

// New APIs
module.exports.getTotalNumberSubscriptions = function (req, res) {
  Subscription.find({})
    .count()
    .exec(function (err, All) {
      Subscription.find({
        BookingStatusByAdmin: "Pending",
        unsubscribed: false,
        payment: "Complete",
      })
        .count()
        .exec(function (err, Pending) {
          Subscription.find({
            BookingStatusByAdmin: {
              $in: ["Accepted", "Out For Delivery"],
            },
            unsubscribed: false,
            dates: { $elemMatch: { status: "Pending" } },
            payment: "Complete",
          })
            .count()
            .exec(function (err, Accepted) {
              Subscription.find({
                BookingStatusByAdmin: "Rejected",
                unsubscribed: false,
                payment: "Complete",
              })
                .count()
                .exec(function (err, Rejected) {
                  Subscription.find({
                    BookingStatusByAdmin: "Out For Delivery",
                    unsubscribed: false,
                    payment: "Complete",
                  })
                    .count()
                    .exec(function (err, OutForDelivery) {
                      Subscription.find({
                        BookingStatusByAdmin: "Delivered",
                        unsubscribed: false,
                        payment: "Complete",
                      })
                        .count()
                        .exec(function (err, Delivered) {
                          Subscription.find({
                            BookingStatusByAdmin: "Payment_Pending",
                            unsubscribed: false,
                            payment: "Complete",
                          })
                            .count()
                            .exec(function (err, Payment_Pending) {
                              Subscription.find({
                                $and: [
                                  {
                                    $or: [
                                      {
                                        BookingStatusByAdmin: "Failed",
                                        payment: "Failed",
                                      },
                                      {
                                        BookingStatusByAdmin: "failed",
                                        payment: "Failed",
                                      },
                                      {
                                        BookingStatusByAdmin: "Pending",
                                        payment: "Pending",
                                      },
                                    ],
                                  },
                                  {
                                    paymentmethod: "Paytm",
                                    bookingMode: "online",
                                    unsubscribed: false,
                                  },
                                ],
                              })
                                .count()
                                .exec(function (err, Payment_failed) {
                                  Subscription.find({
                                    unsubscribed: true,
                                  })
                                    .count()
                                    .exec(function (err, cancelled) {
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
                                          Delivered: Delivered,
                                          Payment_failed: Payment_failed,
                                          cancelled,
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

module.exports.UpdateBookingStatusForSubscriptions = function (req, res) {
  let { subscription_id, user_id, BookingStatusByAdmin, adminID, date, driverData } = req.body;

  if (!user_id) {
    common.formValidate("user_id", res);
    return false;
  }
  if (!subscription_id) {
    common.formValidate("subscription_id", res);
    return false;
  }
  if (!BookingStatusByAdmin) {
    common.formValidate("BookingStatusByAdmin", res);
    return false;
  }
  if (!adminID) {
    common.formValidate("adminID", res);
    return false;
  }

  Subscription.findOne({ _id: subscription_id })
    .lean()
    .exec(function (err, SubscriptionData) {
      if (err) {
        res.status(404).json({ message: "err", data: err, code: 0 });
        return;
      } else if (!SubscriptionData) {
        res.status(404).json({
          message: "id not found in the database",
          data: "",
          code: 0,
        });
        return;
      } else {
        var updateData = {
          BookingStatusByAdmin: BookingStatusByAdmin,
          BookingStatusByAdminID: adminID,
        };

        if (BookingStatusByAdmin == "Out For Delivery") {
          date = req.body.date;
          driverData = req.body.driverData;

          SubscriptionData.dates.forEach((subDate) => {
            if (new Date(subDate.date).toDateString() == new Date(date).toDateString()) {
              subDate.status = "Out For Delivery";
              subDate.driverData = driverData;
            }
          });

          updateData.dates = SubscriptionData.dates;
        }

        if (BookingStatusByAdmin == "Delivered") {
          date = req.body.date;

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
        }
        if (BookingStatusByAdmin == "Rejected") {
          SubscriptionData.dates.forEach((subDate) => {
            subDate.status = "Rejected";
          });

          updateData.dates = SubscriptionData.dates;
        }

        Subscription.updateOne({ _id: subscription_id }, { $set: updateData }, { new: true }, async function (err, UpdatedData) {
          if (err) {
            return res.status(500).json({ status: "error", error: err, code: 0 });
          } else {
            let notifs = await OnOffDataBase.findOne({}).lean();

            var userData = await User.findOne({
              _id: user_id,
            }).lean();
            if (BookingStatusByAdmin == "Rejected" && SubscriptionData.preOrder) {
              await common.reversePreOrderQtyToInventory(subscription_id);
            }
            if (BookingStatusByAdmin == "Accepted" || BookingStatusByAdmin == "Rejected") {
              let selectedNotif = BookingStatusByAdmin == "Accepted" ? notifs.subscription_accepted : notifs.subscription_rejected;
              let bookingID = SubscriptionData.SubscriptionID;
              let subject;
              var subscriptionDates = SubscriptionData.dates;
              var subscriptionDatesarray = [];
              for (var i = 0; i < subscriptionDates.length; i++) {
                var date = subscriptionDates[i].date;
                var date1 = date.toDateString();
                subscriptionDatesarray.push(" " + date1);
              }
              let name = userData.name;
              let contactNumber = userData.contactNumber;
              let email = userData.email;
              let data = "Order updated";
              // common.sendOtp(contactNumber, message);
              if (email && selectedNotif.user_email) {
                let template_name = BookingStatusByAdmin == "Accepted" ? "subscription accepted mail to user" : "subscription rejected mail to user";
                var keys = {
                  userName: common.toTitleCase(name),
                  bookingId: bookingID,
                  subscriptionDates: subscriptionDatesarray,
                  type: "user",
                  template_name: template_name,
                  userEmail: email,
                };
                common.dynamicEmail(keys);
              } else {
                res.status(200).json({
                  message: "ok",
                  data: update,
                  code: 1,
                });
                return;
              }
              res.status(200).json({
                status: "ok",
                data: UpdatedData,
                code: 1,
              });
            }
            // else if (
            //   BookingStatusByAdmin == "Out For Delivery" ||
            //   BookingStatusByAdmin == "Delivered"
            // ) {
            //   let selectedNotif =
            //     BookingStatusByAdmin == "Delivered"
            //       ? notifs.subscription_accepted
            //       : notifs.subscription_rejected;

            //   let bookingID = SubscriptionData.SubscriptionID;
            //   let message;
            //   let subject;
            //   if (BookingStatusByAdmin == "Out For Delivery") {
            //     //console.log(date, "  :datedatedatedatedate");
            //     message =
            //       "Your subscription with ID " +
            //       bookingID +
            //       " for " +
            //       date.toDateString() +
            //       " has been dispatched. It will be delivered by " +
            //       common.toTitleCase(driverData.driver_name) +
            //       " " +
            //       driverData.driver_mobile +
            //       ". Contact us at 919667066462.";

            //     subject = "Order Out For Delivery";
            //   } else if (BookingStatusByAdmin == "Delivered") {
            //     message =
            //       "Your subscription with ID " +
            //       bookingID +
            //       " for " +
            //       new Date(date).toDateString() +
            //       " has been successfully delivered. Get in touch with us at 919667066462.";
            //     subject = "Order Delivered";
            //   }
            //   let name = userData.name;
            //   let contactNumber = userData.contactNumber;
            //   let email = userData.email;
            //   let data = "Order updated";
            //   // common.sendOtp(contactNumber, message);
            //   if (email && subject != "Order Delivered") {
            //     common.sendMail(email, subject, name, message, data);
            //   } else {
            //     res.status(200).json({
            //       message: "ok",
            //       data: update,
            //       code: 1,
            //     });
            //     return;
            //   }
            //   res.status(200).json({
            //     status: "ok",
            //     data: UpdatedData,
            //     code: 1,
            //   });
            // }
            else {
              res.status(200).json({
                status: "ok",
                data: UpdatedData,
                code: 1,
              });
            }
          }
        });
      }
    });
};

// cancel a subscription
module.exports.cancelOne = async (req, res) => {
  const { subscriptionID } = req.body;

  try {
    if (!subscriptionID) {
      common.formValidate("subscriptionID", res);
      return false;
    }

    Subscription.findOneAndUpdate({ _id: subscriptionID }, { unsubscribed: true }, { new: true }, (err, docs) => {
      if (err) {
        res.status(400).json(err);
      } else {
        Subscription.findOne({ _id: subscriptionID })
          .lean()
          .exec(async function (err, SubscriptionData) {
            if (SubscriptionData.preOrder) {
              await common.reversePreOrderQtyToInventory(subscriptionID);
            }

            let notifs = await OnOffDataBase.findOne({}).lean();

            var email = SubscriptionData.userEmail;
            var name = SubscriptionData.userName;
            var mobile = SubscriptionData.userMobile;
            var bookingId = SubscriptionData.SubscriptionID;
            var data = "Subscription cancelled successfully";

            if (notifs.subscription_cancelled.user_email) {
              var keys = {
                userName: common.toTitleCase(name),
                userMobile: mobile,
                bookingId: bookingId,
                type: "user",
                template_name: "subscription cancelled mail to user",
                userEmail: email,
              };
              common.dynamicEmail(keys);
            }

            let users = await Admin.find(
              {
                user_role: { $in: notifs.subscription_cancelled.admin_roles },
              },
              { username: 1, email: 1 }
            ).lean();

            if (notifs.subscription_cancelled.admin_email) {
              users.forEach((user) => {
                var keys = {
                  userName: common.toTitleCase(name),
                  userMobile: mobile,
                  bookingId: bookingId,
                  type: "admin",
                  template_name: "subscription cancelled mail to admin",
                  userEmail: email,
                  adminEmail: user.email,
                  adminName: user.username,
                };
                common.dynamicEmail(keys);
              });
            }

            return res.status(200).json({
              message: "ok",
              data: "Subscription cancelled successfully",
              code: 1,
            });
          });
      }
    });
  } catch (err) {
    errorLogger.error(err, "\n", "\n");
    res.status(400).json(err);
  }
};

// Move today's subscriptions to booking
// Cron job every day at midnight   0 0 * * *
cron.schedule("* * * * *", () => {
  console.log("subscription cron executed !!!");
  try {
    let tomorrow = new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(0, 0, 0, 0));
    //let tomorrow = new Date(new Date(new Date().setDate(new Date().getDate() - 15)).setHours(0, 0, 0, 0))
    let dayAfterTomorrow = new Date(new Date(new Date().setDate(new Date().getDate() + 2)).setHours(0, 0, 0, 0));
    console.log(tomorrow);
    Subscription.find({
      active: true,
      BookingStatusByAdmin: "Accepted",
      payment: "Complete",
      unsubscribed: false,
      dates: {
        $elemMatch: {
          date: {
            $gte: tomorrow,
            $lt: dayAfterTomorrow,
          },
          orderCreated: false,
        },
      },
    })
      .populate("user_id")
      .lean()
      .exec((err, docs) => {
        // console.log(docs);
        if (err) {
          errorLogger.error(err, "\n", "\n");
        } else {
          async.parallel(
            docs.map((doc) => {
              return (callback) => {
                let regionId = doc.regionID;

                couponDataBase
                  .findOne({ _id: doc.couponId })
                  .exec()
                  .then(async (getCoupon) => {
                    if (getCoupon) {
                      var couponId = getCoupon._id;
                      var couponApplied = true;
                      var coupon_code = getCoupon.coupon_code;
                      var discountType = getCoupon.discountType;
                      var discountAmount = getCoupon.discountAmount;
                      var discountLocation = getCoupon.discountLocation;
                      var discountPercentage = getCoupon.discountPercentage;
                      var discount_upto = getCoupon.discount_upto;
                      var discountProduct = getCoupon.discountProduct;
                      var discountProductPackageId = getCoupon.discountProductPackageId;
                    } else {
                      var couponId = null;
                      var couponApplied = false;
                      var coupon_code = null;
                      var discountType = null;
                      var discountAmount = null;
                      var discountLocation = null;
                      var discountPercentage = null;
                      var discount_upto = null;
                      var discountProduct = null;
                      var discountProductPackageId = null;
                    }

                    var invoiceNO = null;

                    let billingCompany = await Company.findOne({
                      isDefault: true,
                    }).lean();

                    // console.log(tomorrow);
                    // console.log(new Date(moment(tomorrow).tz("Asia/kolkata").format("MM/DD/yyyy")));

                    // checking if all products are in stock
                    let bookingdetail = doc.bookingdetail;

                    let simpleProductsQuantity = {};
                    let configProductsQuantity = {};
                    let productNotFoundInDB = false;

                    for (const bookingItem of bookingdetail) {
                      let [product] = await products
                        .aggregate([
                          { $match: { _id: mongoose.Types.ObjectId(bookingItem.product_id._id) } },
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
                                          { $eq: ["$variant_name", bookingItem.variant_name] },
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
                              { $unwind: { path: "$groupData", preserveNullAndEmptyArrays: true } },
                              { $unwind: { path: "$groupData.sets", preserveNullAndEmptyArrays: true } },
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
                        productNotFoundInDB = true;
                        continue;
                      }

                      if (bookingItem.TypeOfProduct == "simple") {
                        // check if out of stock
                        // let simpleData = product.simpleData.filter((data) => data.region == regionId);
                        // if (simpleData.length == 0) {
                        //   outOfStock.push(bookingItem.product_id.product_name);
                        //   continue;
                        // }

                        let availQty = product.availableQuantity;
                        let totalQty = bookingItem.without_package
                          ? bookingItem.qty * bookingItem.unitQuantity
                          : bookingItem.qty * bookingItem.packet_size;
                        console.log("totalQty = ", totalQty, " and availQty = ", availQty);

                        if (!simpleProductsQuantity[`${product._id}__${regionId}`]) {
                          simpleProductsQuantity[`${product._id}__${regionId}`] = [
                            product.product_name,
                            regionId,
                            availQty,
                            totalQty,
                            product.unitMeasurement,
                          ];
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

                              if (!productData) {
                                productNotFoundInDB = true;
                                continue;
                              }

                              var availQty = productData.availableQuantity;
                              var totalQty =
                                (set.sets[k].package ? set.sets[k].package.packet_size : set.sets[k].unitQuantity) *
                                set.sets[k].qty *
                                bookingItem.qty;
                              console.log("totalQty = ", totalQty, " and availQty = ", availQty);

                              if (!simpleProductsQuantity[`${productData._id}__${regionId}`]) {
                                simpleProductsQuantity[`${productData._id}__${regionId}`] = [
                                  productData.product_name,
                                  regionId,
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
                          allErrors.push(` ${element[0]}`);
                        }
                      }
                    }

                    for (const key in configProductsQuantity) {
                      if (Object.hasOwnProperty.call(configProductsQuantity, key)) {
                        const element = configProductsQuantity[key];
                        if (element[2] < element[3]) {
                          allErrors.push(` ${element[0]}`);
                        }
                      }
                    }

                    if (allErrors.length > 0 || productNotFoundInDB) {
                      callback(true, "Failed");

                      // find if mail is already sent
                      let mailSent = doc.dates.filter((date) => +date.date >= +tomorrow && +date.date < +dayAfterTomorrow)[0].mailSent;
                      console.log("mailSentmailSentmailSentmailSent ", mailSent);

                      // send mail if not already sent
                      if (!mailSent) {
                        let users = await Admin.find(
                          {
                            user_role: {
                              $in: ["60e2cdf2a68f4170e70a8d61", "600a85c1759e8aa636d870fe", "60e2cd8ea68f4170e70a8d5e"],
                            },
                          },
                          { username: 1, email: 1 }
                        ).lean();

                        let subject = `Order Failed for ${doc.SubscriptionID}`;
                        let message = `An order cannot be placed from ${doc.SubscriptionID} due to insufficient inventory of ${allErrors}. `;

                        users.forEach((user) => {
                          common.sendMail(user.email, subject, user.username, message);
                        });

                        // update mailSent status after sending mail

                        let docDates = doc.dates.map((date) => {
                          if (+date.date >= +tomorrow && +date.date < +dayAfterTomorrow) {
                            date.mailSent = true;
                          }
                          return date;
                        });

                        let subUpdated = await Subscription.updateOne({ _id: doc._id }, { $set: { dates: docDates } });

                        console.log("mail sent to users");
                      }

                      return;
                    }

                    // creating new order

                    let jsonData = {
                      user_id: doc.user_id._id,
                      userName: doc.user_id.name,
                      userEmail: doc.user_id.email,
                      userMobile: doc.user_id.contactNumber,
                      userType: doc.user_id.user_type,
                      userData: doc.user_id,
                      subscriptionID: doc._id,
                      subscriptionCode: doc.SubscriptionID,
                      regionName: doc.regionName,
                      regionID: doc.regionID,
                      device_name: doc.device_name,
                      preOrder: doc.preOrder,
                      bookingMode: "online",
                      booking_code: "KC",
                      DeliveryDate: new Date(+new Date(tomorrow) + 19800000),
                      invoiceNO: invoiceNO,
                      paymentmethod: doc.paymentmethod,
                      payment: doc.payment,
                      totalCouponDiscountAmount: doc.totalCouponDiscountAmount,
                      total_payment: doc.total_payment,
                      totalCartPriceWithoutGST: doc.totalCartPriceWithoutGST,
                      booking_address: doc.booking_address,
                      delivery_instructions: doc.delivery_instructions,
                      deliveryCharges: doc.deliveryCharges,
                      otheraddress: null,
                      bookingdetail: doc.bookingdetail,
                      billingCompany: billingCompany._id,
                      couponId: couponId,
                      couponApplied: couponApplied,
                      coupon_code: coupon_code,
                      discountType: discountType,
                      discountAmount: discountAmount,
                      discountLocation: discountLocation,
                      discountPercentage: discountPercentage,
                      discount_upto: discount_upto,
                      discountProduct: discountProduct,
                      discountProductPackageId: discountProductPackageId,
                      redeem_point: doc.redeem_point,
                      redeemDiscount: doc.redeemDiscount,
                      referralDiscount: doc.referralDiscount,
                      allGstLists: doc.allGstLists,
                      gst: doc.gst,
                      totalCartPrice: doc.totalCartPrice,
                      BookingStatusByAdmin: "Pending",
                      //BookingStatusByAdmin: "Accepted",
                      deliverySlot: doc.deliverySlot,
                      inventory_ids: doc.inventory_ids,
                    };
                    //console.log(jsonData,'jsonDatajsonDatajsonData')
                    bookingDataBase.create(jsonData, async function (err, insertedData) {
                      if (err) {
                        errorLogger.error(err, "\n", "\n");
                        //console.log(err, 'errrrrrrrrrrrrrrrrrrrrrrrrrrrr')
                        callback(true, "failed");
                      } else {
                        // update order id with counter start added by chitra
                        var booking_code = "KC" + (insertedData.counter < 10 ? "0" + insertedData.counter : insertedData.counter);

                        var d = new Date();
                        var year = d.getFullYear();
                        var date = d.getDate();
                        // var invoiceNO =
                        //   insertedData.counter +
                        //   "/" +
                        //   `${new Date().getFullYear().toString()}-${(
                        //     new Date().getFullYear() + 1
                        //   )
                        //     .toString()
                        //     .slice(2)}`;

                        let updated = await bookingDataBase.update(
                          {
                            _id: insertedData._id,
                          },
                          {
                            booking_code: booking_code,
                            //invoiceNO: invoiceNO,
                          }
                        );
                        //update order id with counter end
                        var bookingID = insertedData._id;
                        if (doc.preOrder === false) {
                          await common.reduceQtyFormproductAndInventory(bookingID);
                        }

                        let docActive = doc.dates.filter((date) => +date.date >= +dayAfterTomorrow).length > 0;
                        let docDates = doc.dates.map((date) => {
                          if (+date.date >= +tomorrow && +date.date < +dayAfterTomorrow) {
                            date.orderCreated = true;
                          }
                          return date;
                        });

                        let subUpdated = await Subscription.updateOne({ _id: doc._id }, { $set: { active: docActive, dates: docDates } });
                        callback(false, "success");
                      }
                    });
                  });
              };
            }),

            (err, results) => {
              // main task results
              if (err) {
                errorLogger.error(err, "\n", "\n");
                console.log("somethings went wrong on daily subscription cron");
              } else {
                console.log("daily subscription cron Complete without errors");
              }
              //console.log(results);
            }
          );
        }
      });
  } catch (err) {
    errorLogger.error(err, "\n", "\n");
    console.log("catch error ::::: ", err);
  }
});
