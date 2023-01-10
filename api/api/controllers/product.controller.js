var mongoose = require("mongoose");
var table = mongoose.model("products");
var InventoryTable = mongoose.model("inventory");
var BookingTable = mongoose.model("bookings");
var stockMaster = mongoose.model("stock_masters");
var reportSummary = mongoose.model("report_summary");
var multer = require("multer");
var nodemailer = require("nodemailer");
var common = require("../../common.js");
var CatDataBase = mongoose.model("product_categories");
const Category = mongoose.model("categories");
const Blogs = mongoose.model("blogs");
var Admin = mongoose.model("admin");
var Packages = mongoose.model("packages");
var RegionTable = mongoose.model("regions");
var TaxTable = mongoose.model("taxs");
var UnitTable = mongoose.model("unit_measurements");

// For Decimal Precision
const Decimal = require("decimal.js");
var settingsModel = mongoose.model("settings");
var ratingreviewModel = mongoose.model("ratingreviews");
var parser = require("simple-excel-to-json");

const moment = require("moment");

var errorLogger = common.errorLogger;

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

const createCsvWriter = require("csv-writer").createObjectCsvWriter;

function uniqueId(length) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function getImageName(files, image) {
  for (var j = 0; j < files.length; j++) {
    if (files[j].originalname == image) {
      return files[j].filename;
    }
  }
}
module.exports.editPriority = async (req, res)=> {
  for(let k of req.body.priorityobj){
    if(k.priority){
    let isPriorityAvailable = await table.findOne({ priority_obj: 
                { $elemMatch : 
                   { 
                     category: k.category 
                   } 
                },_id:k.product_id
            })
if(isPriorityAvailable){
 let priority_obj = isPriorityAvailable?.priority_obj.map((cur)=>{
  if(cur['category'] == String(k.category)){
    cur['priority'] = k.priority
  }
  return cur
 })
 await table.findOneAndUpdate({_id:k.product_id},{priority_obj:priority_obj})
} else {
let productObj = await table.findOne({_id:k.product_id})
let priority_obj = [...productObj.priority_obj,{category:String(k.category),priority:k.priority}]
await table.findOneAndUpdate({_id:k.product_id},{priority_obj:priority_obj})
}
    }
  }
res.status(200).json({
  success:true,
  message:"Ok"
 })
}
module.exports.getAllForPriority = async (req, res)=> {
  let products = await table.find({product_categories : { $in:[ mongoose.Types.ObjectId(req.body.product_categories) ]}})
        let sortedByPriority = products.sort((a,b)=> (a.priority_obj?.filter((cur)=>cur.category === String(req.body.product_categories))[0]?.priority || 1000) - (b.priority_obj?.filter((cur)=>cur.category === String(req.body.product_categories))[0]?.priority || 1000))
  res.status(200).json({
    success:true,
    data:sortedByPriority
  })
}
module.exports.AddOne = function (req, res) {
  upload(req, res, function (err) {
    var regionType = req.body.regionType;
    var admin_id = req.body.admin_id;
    var a = req.body.color;
    var images = [];
    var image_config = [];
    var attachment = "";
    var banner = "";
    var nameFilter = { product_name: req.body.product_name };
    var error = {};

    if (admin_id == "" || !admin_id || admin_id == undefined || admin_id == null) {
      common.formValidate("admin_id", res);
      return false;
    }

    Admin.findOne({ _id: admin_id })
      .exec()
      .then((getAdmin) => {
        if (getAdmin == null) {
          error["admin_id"] = "admin_id not found in database";
        }
        var errorArray = Object.keys(error).length;
        if (errorArray > 0) {
          return res.status(400).json({
            message: "error",
            data: [error],
            code: 0,
          });
        }
        table
          .find(nameFilter)
          .exec()
          .then(async (GetFilter) => {
            if (GetFilter.length > 0) {
              error["product_name"] = "name already exist";
            }
            var errorArray = Object.keys(error).length;
            if (errorArray > 0) {
              return res.status(200).json({
                status: "error",
                result: [error],
              });
            } else {
              var variant_images = {};
              for (var j = 0; j < req.files.length; j++) {
                if (req.files[j].fieldname === "image") {
                  images.push({
                    image: req.files[j].filename,
                  });
                }
                if (req.files[j].fieldname === "image_config") {
                  image_config.push({
                    image_config: req.files[j].filename,
                  });
                }

                if (req.files[j].fieldname === "attachment") {
                  attachment = req.files[j].filename;
                }

                if (req.files[j].fieldname.includes("attachment")) {
                  variant_images[req.files[j].fieldname] = req.files[j].filename;
                }

                if (req.files[j].fieldname === "banner") {
                  banner = req.files[j].filename;
                }
              }
              var simpleDataArray = [];
              var conDataArray = [];
              var groupDataArray = [];

              var packageDocs = [];
              if (req.body.TypeOfProduct == "simple") {
                var simpleData1 = req.body.product_data;
                var simpleData = JSON.parse(simpleData1);
                if (simpleData != undefined || simpleData != "") {
                  var simpleDataArray = [];
                  // console.log("888888888", simpleData);
                  for (var i = 0; i < simpleData.length; i++) {
                    var PackageData = simpleData[i].package;

                    // check if two packages in same region have same packet size
                    let valueArr = PackageData.map(function (item) {
                      return item.packet_size;
                    });
                    let isDuplicate = valueArr.some(function (item, idx) {
                      return valueArr.indexOf(item) != idx;
                    });
                    if (isDuplicate == true) {
                      return res.status(400).json({
                        message: "error",
                        data: "diplicate package found in same region",
                        code: 0,
                      });
                      process.exit(1);
                    }

                    var PackageDataArray = [];
                    var packageDocs = [];
                    for (var k = 0; k < PackageData.length; k++) {
                      let pkg = new Packages({
                        product: null,
                        region: simpleData[i].region,
                        packet_size: PackageData[k].packet_size,
                        packetLabel: PackageData[k].packetLabel,
                        selling_price: PackageData[k].selling_price,
                        B2B_price: PackageData[k].B2B_price,
                        Retail_price: PackageData[k].Retail_price,
                        packetmrp: PackageData[k].packetmrp,
                        barcode: PackageData[k].barcode,
                      });
                      await pkg.save();
                      PackageDataArray.push(pkg._id);
                      packageDocs.push(pkg);
                    }
                    simpleDataArray.push({
                      region: simpleData[i].region,
                      RegionSKUcode: simpleData[i].RegionSKUcode,
                      package: PackageDataArray,
                      ExpirationDate: null,
                    });
                  }

                  var valueArr = simpleDataArray.map(function (item) {
                    return item.region;
                  });
                  var isDuplicate = valueArr.some(function (item, idx) {
                    return valueArr.indexOf(item) != idx;
                  });

                  if (isDuplicate == true) {
                    return res.status(400).json({
                      message: "error",
                      data: "same region found",
                      code: 0,
                    });
                    process.exit(1);
                  }
                }
              } else if (req.body.TypeOfProduct == "configurable") {
                if (!req.body.attribute_group) {
                  common.formValidate("attribute_group", res);
                  return false;
                }
                var Data1 = req.body.product_data;
                var conData = JSON.parse(Data1);
                try {
                  if (conData != undefined || conData != "") {
                    var conDataArray = [];
                    var conDataArrayFind = [];
                    for (let i = 0; i < conData.length; i++) {
                      const conf = conData[i];
                      let identifier = conf.region;
                      conf.attributes.forEach((attribute) => {
                        identifier += `__${attribute.attributeName}__${attribute.attributeValue}`;
                      });

                      let imageConfig;
                      if (image_config != null) {
                        // imageConfig = image_config[i].image_config;
                      } else {
                        imageConfig = null;
                      }
                      conDataArray.push({
                        ...conf,
                        image: variant_images["variant" + i] || "",
                        identifier,
                      });
                    }

                    let duplicate = false;
                    for (let i = 0; i < conDataArray.length; i++) {
                      for (let j = 0; j < conDataArray.length; j++) {
                        if (i != j && conDataArray[i].identifier == conDataArray[j].identifier) {
                          duplicate = true;
                        }
                      }
                    }

                    if (duplicate) {
                      return res.status(500).json({
                        message: "error",
                        data: "Duplicate Variant found",
                        code: 0,
                      });
                      process.exit(1);
                    }

                    conDataArray.forEach((conf) => {
                      conf.variant_name = conf.identifier.split("__").splice(1).join("__");
                      delete conf.identifier;
                    });

                    // for (var i = 0; i < conData.length; i++) {
                    //   var variantIds = conData[i].variant_id;
                    //   var variantItem = conData[i].variant_item;
                    //   var variantItemName = conData[i].variantItemName;
                    //   var varDataArray = [];
                    //   var varItemDataArray = [];

                    //   for (var i1 = 0; i1 < variantIds.length; i1++) {
                    //     varDataArray.push({
                    //       variantId: variantIds[i1],
                    //       variantItem: variantItem[i1],
                    //       //"variantItemName": variantItemName[i1]
                    //     });
                    //     varItemDataArray.push({
                    //       variantItem: variantItem[i1],
                    //     });
                    //     conDataArrayFind.push({
                    //       region: conData[i].region,
                    //       variant_item: variantItem[i1],
                    //     });
                    //   }
                    //   if (image_config != null) {
                    //     var imageConfig = image_config[i].image_config;
                    //   } else {
                    //     var imageConfig = null;
                    //   }
                    //   conDataArray.push({
                    //     region: conData[i].region,
                    //     variant_id: varDataArray,
                    //     // "variant_item": varItemDataArray,
                    //     sellingPrice: conData[i].selling_price,
                    //     costPrice: 0,
                    //     total_amount: 0,
                    //     quantity: 0,
                    //     ExpirationDate: null,
                    //     skuCode: conData[i].sku_code,
                    //     image: imageConfig,
                    //   });
                    // }
                    // var ab = [];
                    // for (var i = 0; i < conDataArrayFind.length; i++) {
                    //   var found = false;
                    //   for (var j = 0; j < conDataArrayFind.length; j++) {
                    //     if (j != i) {
                    //       if (
                    //         conDataArrayFind[i].region == conDataArrayFind[j].region &&
                    //         conDataArrayFind[i].variant_item == conDataArrayFind[j].variant_item
                    //       ) {
                    //         found = true;
                    //       }
                    //     }
                    //   }
                    //   if (found) {
                    //     ab.push(conDataArrayFind[i]);
                    //   }
                    // }
                    // if (ab.length > 0) {
                    //   return res.status(400).json({
                    //     message: "error",
                    //     data: "same region found",
                    //     code: 0,
                    //   });
                    //   process.exit(1);
                    // }
                  }
                } catch (err) {
                  errorLogger.error(err, "\n", "\n");
                  process.exit(1);
                }
              } else if (req.body.TypeOfProduct == "group") {
                var groupData1 = req.body.product_data;
                groupDataArray = JSON.parse(groupData1);
              } else {
                simpleDataArray = [];
                conDataArray = [];
                groupDataArray = [];
              }

              // res.status(200).json(simpleData);
              var product_id1 = req.body.relatedProduct;
              if (product_id1 != "null" && product_id1 && product_id1.length > 0) {
                var product_id = JSON.parse(product_id1);
                var productData = [];
                for (var i = 0; i < product_id.length; i++) {
                  productData.push({
                    product_id: product_id[i]._id,
                  });
                }
              } else {
                var productData = [];
              }

              var blog_id1 = req.body.relatedRecipes;
              if (blog_id1 != "null" && blog_id1 && blog_id1.length > 0) {
                var blog_id = JSON.parse(blog_id1);
                var blogData = [];
                for (var i = 0; i < blog_id.length; i++) {
                  blogData.push({
                    blog_id: blog_id[i]._id,
                  });
                }
              } else {
                var blogData = [];
              }

              var RegionTax_id1 = req.body.RegionTax;
              if (RegionTax_id1 != "null" && RegionTax_id1 && RegionTax_id1.length > 0) {
                var RegionTax_id = JSON.parse(RegionTax_id1);
                var ProductRegionData = [];
                for (var i = 0; i < RegionTax_id.length; i++) {
                  ProductRegionData.push({
                    region_id: RegionTax_id[i].value,
                  });
                }
              } else {
                var ProductRegionData = [];
              }

              var unitMeasurement1 = req.body.unitMeasurement;
              if (unitMeasurement1 != "null" && unitMeasurement1 && unitMeasurement1.length > 0) {
                var unitMeasurement = req.body.unitMeasurement;
              } else {
                var unitMeasurement = null;
              }
              // console.log(req.body);
              console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ ", typeof req.body.barcode, req.body.barcode);

              var slug = common.slugify(req.body.product_name);
              table.create(
                {
                  admin_id: req.body.admin_id,
                  product_categories: JSON.parse(req.body.product_categories),
                  product_name: req.body.product_name,
                  slug: slug,
                  longDesc: req.body.longDesc,
                  shortDesc: req.body.shortDesc,
                  images: images,
                  attachment: attachment,
                  banner: banner,
                  relatedProduct: productData,
                  relatedRecipes: blogData,
                  productThreshold: req.body.productThreshold,
                  productSubscription: req.body.productSubscription,
                  preOrder: req.body.preOrder,
                  preOrderQty: 0,
                  preOrderRemainQty: 0,
                  preOrderStartDate: req.body.preOrderStartDate,
                  preOrderEndDate: req.body.preOrderEndDate,
                  ProductRegion: ProductRegionData,
                  salesTaxOutSide: req.body.salesTaxOutSide,
                  salesTaxWithIn: req.body.salesTaxWithIn,
                  purchaseTax: req.body.purchaseTax,
                  hsnCode: req.body.hsnCode,
                  unitMeasurement: unitMeasurement,
                  unitQuantity: 1,
                  TypeOfProduct: req.body.TypeOfProduct,
                  base_price: req.body.TypeOfProduct == "group" ? req.body.base_price : 0,
                  group_mrp: req.body.TypeOfProduct == "group" ? req.body.group_mrp : 0,

                  attribute_group: req.body.TypeOfProduct == "configurable" ? req.body.attribute_group : null,
                  simpleData: simpleDataArray,
                  configurableData: conDataArray,
                  groupData: groupDataArray,
                  // groupRegions: JSON.parse(req.body.groupRegions),

                  SKUCode: req.body.SKUCode,
                  status: req.body.status,
                  showstatus: req.body.showstatus,
                  productExpiryDay: req.body.productExpiryDay,
                  priority: req.body.priority && +req.body.priority ? req.body.priority : Infinity,
                  sameDayDelivery: req.body.sameDayDelivery || false,
                  farmPickup: req.body.farmPickup || false,
                  youtube_link: req.body.youtube_link || null,
                  barcode: req.body.barcode ? JSON.parse(req.body.barcode) : [],
                },
                async function (err, data) {
                  if (err) {
                    res.status(400).json(err);
                  } else {
                    for (const doc of packageDocs) {
                      doc.product = data._id;
                      await doc.save();
                    }
                    res.status(201).json({
                      message: "ok",
                      data: "data created",
                      code: 1,
                    });
                  }
                }
              );
            }
          })
          .catch(function (err) {
            errorLogger.error(err, "\n", "\n");
            console.log("errr::::: ", err);
            res.status(400).json(err);
          });
      });
  });
};

module.exports.GetAll = async function (req, res) {
  var skip = +req.body.skip || 0;
  var limit = 10;
  var maxCount = 50;

  if (req.body && req.body.limit) {
    limit = parseInt(req.body.limit, 10);
  }

  if (limit > maxCount) {
    res.status(400).json({
      message: "Count limit of " + maxCount + " exceeded",
    });
    return;
  }
  if (req.body.product_name) {
    var product_name = req.body.product_name;
  }
  if (req.body.product_categories) {
    var product_categories = req.body.product_categories;
  }
  if (req.body.status) {
    var status = req.body.status;
  }
  var DataFilter = {};
  if (product_name != null) {
    DataFilter["product_name"] = { $regex: product_name, $options: "i" };
  }
  if (product_categories != null) {
    DataFilter["product_categories"] = { $in:[ mongoose.Types.ObjectId(product_categories) ]};
  }
  if ((req.body.status != null && req.body.status != "") || req.body.status === false || req.body.status === true) {
    DataFilter["status"] = req.body.status;
  }

  try {
    let data = await table
      .aggregate([
        { $match: DataFilter },
        { $sort: { created_at: 1 } },
        {
          $facet: {
            count: [{ $count: "count" }],
            docs: [
              { $skip: skip },
              { $limit: limit },
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
                          $expr: { $eq: ["$product_id", "$$product_id"] },
                        },
                      },
                      {
                        $group: {
                          _id: null,
                         //_id: "$region",
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
                    lostQuantity: { $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0] },
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

              // For Populating nested keys inside nested array of objects
              ...[
                // inside simpleData array
                ...[
                  { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
                  {
                    $lookup: {
                      from: "regions",
                      foreignField: "_id",
                      localField: "simpleData.region",
                      as: "simpleData.region",
                    },
                  },
                  { $unwind: { path: "$simpleData.region", preserveNullAndEmptyArrays: true } },
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
                    $unwind: { path: "$groupData.sets.package", preserveNullAndEmptyArrays: true },
                  },

                  // *************************************************************************************************************
                  // Starting of code for populating Inner Product of Group Product
                  // *************************************************************************************************************
                  {
                    $lookup: {
                      from: "products",
                      let: { product_id: "$groupData.sets.product" },
                      pipeline: [
                        { $match: { $expr: { $eq: ["$$product_id", "$_id"] } } },
                        // For adding quantity keys
                        ...[
                          {
                            $lookup: {
                              from: "inventory_items",
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
                          { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
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
                              configurableData: { $first: "$configurableData" },
                              groupData: { $first: "$groupData" },
                              base_price: { $first: "$base_price" },
                              slug: { $first: "$slug" },
                              TypeOfProduct: { $first: "$TypeOfProduct" },
                              outOfStock: { $first: "$outOfStock" },
                              availableQuantity: { $first: "$availableQuantity" },
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
                            $unwind: { path: "$unitMeasurement", preserveNullAndEmptyArrays: true },
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
                            $unwind: { path: "$salesTaxOutSide", preserveNullAndEmptyArrays: true },
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
                            $unwind: { path: "$salesTaxWithIn", preserveNullAndEmptyArrays: true },
                          },

                          {
                            $lookup: {
                              from: "taxs",
                              localField: "purchaseTax",
                              foreignField: "_id",
                              as: "purchaseTax",
                            },
                          },
                          { $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true } },
                        ],
                      ],
                      as: "groupData.sets.product",
                    },
                  },
                  {
                    $unwind: { path: "$groupData.sets.product", preserveNullAndEmptyArrays: true },
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

                // inside related products
                ...[
                  { $unwind: { path: "$relatedProduct", preserveNullAndEmptyArrays: true } },
                  // *************************************************************************************************************
                  // Starting of code for populating related products
                  // *************************************************************************************************************
                  {
                    $lookup: {
                      from: "products",
                      let: { product_id: "$relatedProduct.product_id" },
                      pipeline: [
                        { $match: { $expr: { $eq: ["$$product_id", "$_id"] } } },
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
                                    $expr: { $eq: ["$product_id", "$$product_id"] },
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

                        // For Populating nested keys inside nested array of objects
                        ...[
                          // inside simpleData array
                          ...[
                            { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
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
                                relatedProduct: { $first: "$relatedProduct" },
                                product_categories: { $first: "$product_categories" },
                              },
                            },
                          ],

                          // inside groupData array
                          ...[
                            { $unwind: { path: "$groupData", preserveNullAndEmptyArrays: true } },
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
                            // Starting of code for populating Inner Product of Group Product in " related products "
                            // *************************************************************************************************************
                            {
                              $lookup: {
                                from: "products",
                                let: { product_id: "$groupData.sets.product" },
                                pipeline: [
                                  { $match: { $expr: { $eq: ["$$product_id", "$_id"] } } },
                                  // For adding quantity keys
                                  ...[
                                    {
                                      $lookup: {
                                        from: "inventory_items",
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
                                        configurableData: { $first: "$configurableData" },
                                        groupData: { $first: "$groupData" },
                                        base_price: { $first: "$base_price" },
                                        slug: { $first: "$slug" },
                                        TypeOfProduct: { $first: "$TypeOfProduct" },
                                        outOfStock: { $first: "$outOfStock" },
                                        availableQuantity: { $first: "$availableQuantity" },
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
                                relatedProduct: { $first: "$relatedProduct" },
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
                            $unwind: { path: "$unitMeasurement", preserveNullAndEmptyArrays: true },
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
                            $unwind: { path: "$salesTaxOutSide", preserveNullAndEmptyArrays: true },
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
                            $unwind: { path: "$salesTaxWithIn", preserveNullAndEmptyArrays: true },
                          },

                          {
                            $lookup: {
                              from: "taxs",
                              localField: "purchaseTax",
                              foreignField: "_id",
                              as: "purchaseTax",
                            },
                          },
                          { $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true } },
                        ],
                      ],
                      as: "relatedProduct.product_id",
                    },
                  },
                  {
                    $unwind: {
                      path: "$relatedProduct.product_id",
                      preserveNullAndEmptyArrays: true,
                    },
                  },
                  // *************************************************************************************************************
                  // Ending of code for populating related products in " related products "
                  // *************************************************************************************************************
                  {
                    $group: {
                      _id: "$_id",
                      product_name: { $first: "$product_name" },
                      images: { $first: "$images" },
                      simpleData: { $first: "$simpleData" },
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
                      relatedProduct: { $push: "$relatedProduct" },
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
                  {
                    $addFields: {
                      relatedProduct: {
                        $filter: {
                          input: "$relatedProduct",
                          as: "rp",
                          cond: { $ne: [{ $size: { $objectToArray: "$$rp" } }, 0] },
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
                    from: "categories",
                    localField: "product_categories",
                    foreignField: "_id",
                    as: "product_categories",
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
                { $unwind: { path: "$unitMeasurement", preserveNullAndEmptyArrays: true } },

                {
                  $lookup: {
                    from: "taxs",
                    localField: "salesTaxOutSide",
                    foreignField: "_id",
                    as: "salesTaxOutSide",
                  },
                },
                { $unwind: { path: "$salesTaxOutSide", preserveNullAndEmptyArrays: true } },

                {
                  $lookup: {
                    from: "taxs",
                    localField: "salesTaxWithIn",
                    foreignField: "_id",
                    as: "salesTaxWithIn",
                  },
                },
                { $unwind: { path: "$salesTaxWithIn", preserveNullAndEmptyArrays: true } },

                {
                  $lookup: {
                    from: "taxs",
                    localField: "purchaseTax",
                    foreignField: "_id",
                    as: "purchaseTax",
                  },
                },
                { $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true } },
              ],

              { $sort: { created_at: 1 } },
            ],
          },
        },
      ])
      .option({ serializeFunctions: true });
    //console.log(data);

    res.status(200).json({ message: "ok", data: data[0]?.docs, count: data[0]?.count[0]?.count, code: 1 });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "error",
      data: err,
      code: 0,
    });
  }
};

module.exports.GetAllActive = function (req, res) {
  table.find({ status: true }, { _id: 1, product_name: 1, slug: 1, without_package: 1, TypeOfProduct: 1 }).exec(function (err, data) {
    if (err) {
      res.status(500).json(err);
    } else {
      res.status(200).json({ message: "ok", data: data, code: 1 });
    }
  });
};

module.exports.getAllProductsInInventory = async (req, res) => {
  try {
    let data = await table.aggregate([
      { $match: { TypeOfProduct: { $in: ["simple", "configurable"] } } },
      // For adding quantity keys
      ...[
        {
          $lookup: {
            from: "inventory_items",
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
            lostQuantity: { $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0] },
            returnQuantity: {
              $ifNull: [{ $toDouble: "$inventories.returnQuantity" }, 0],
            },
            inhouseQuantity: {
              $ifNull: [{ $toDouble: "$inventories.inhouseQuantity" }, 0],
            },
          },
        },
      ],
      { $match: { availableQuantity: { $gt: 0 } } },
      {
        $project: {
          product_name: 1,
          TypeOfProduct:1
        },
      },
    ]);

    res.status(200).json({ message: "ok", data: data, code: 1 });
  } catch (err) {
    res.status(500).json(err);
  }
};

// module.exports.getAllProductsInInventory = function (req, res) {
//   table
//     .find(
//       {
//         TypeOfProduct: { $in: ["simple", "configurable"] },
//         AvailableQuantity: { $gt: 0 },
//       },
//       { _id: 1, product_name: 1, slug: 1, without_package: 1 }
//     )
//     .exec(function (err, data) {
//       if (err) {
//         res.status(500).json(err);
//       } else {
//         res.status(200).json({ message: "ok", data: data, code: 1 });
//       }
//     });
// };

// module.exports.getAllActiveProducts = async (req, res) => {
//   try {
//     let products = await table.aggregate([{ $match: { status: true, TypeOfProduct: "simple" } }]);
//   } catch (err) {
//     console.log(err);
//   }
// };

module.exports.getAllActiveProducts = async (req, res) => {
  // return all active products with all packages in all regions
  let products = await table
    .find({ status: true, TypeOfProduct: "simple" })
    .populate("salesTaxOutSide")
    .populate("salesTaxWithIn")
    .populate("purchaseTax")
    .populate("simpleData.package")
    .populate("groupData.sets.package")
    .lean();
  products.forEach((prod) => {
    let packages = [];
    prod.simpleData.forEach((sd) => {
      sd.package.forEach((pack) => {
        let exists = false;
        packages.forEach((item) => {
          if (item._id == pack._id) {
            exists = true;
          }
        });
        if (!exists) packages.push({ ...pack, regionID: sd.region });
      });
    });

    prod.allPackages = packages;
  });
  res.status(200).json({ message: "ok", data: products, code: 1 });
};

module.exports.GetAllByStock = function (req, res) {
  var id = req.params.Id;
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

  table
    .find({ stock_id: id })
    .sort({ created_at: -1 })
    .populate({
      path: "product_cat_id",
      // match: { category_name: 'shirt12'},
    })
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

module.exports.GetOne = async (req, res) => {
  var id = req.params.Id;

  try {
    var data = await table
      .aggregate([
        { $match: { _id: mongoose.Types.ObjectId(id) } },
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
                    $expr: { $eq: ["$product_id", "$$product_id"] },
                  },
                },
                {
                  $facet: {
                    overall: [
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
                    ],
                    regionWise: [
                      {
                        $group: {
                          _id: "$region",
                          productQuantity: { $sum: "$productQuantity" },
                          bookingQuantity: { $sum: "$bookingQuantity" },
                          availableQuantity: { $sum: "$availableQuantity" },
                          lostQuantity: { $sum: "$lostQuantity" },
                          returnQuantity: { $sum: "$returnQuantity" },
                          inhouseQuantity: { $sum: "$inhouseQuantity" },
                        },
                      },
                    ],
                  },
                },
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
            $unwind: {
              path: "$inventories.overall",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $addFields: {
              productQuantity: {
                $ifNull: [{ $toDouble: "$inventories.overall.productQuantity" }, 0],
              },
              bookingQuantity: {
                $ifNull: [{ $toDouble: "$inventories.overall.bookingQuantity" }, 0],
              },
              availableQuantity: {
                $ifNull: [{ $toDouble: "$inventories.overall.availableQuantity" }, 0],
              },
              lostQuantity: { $ifNull: [{ $toDouble: "$inventories.overall.lostQuantity" }, 0] },
              returnQuantity: {
                $ifNull: [{ $toDouble: "$inventories.overall.returnQuantity" }, 0],
              },
              inhouseQuantity: {
                $ifNull: [{ $toDouble: "$inventories.overall.inhouseQuantity" }, 0],
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

        // For Populating nested keys inside nested array of objects
        ...[
          // inside simpleData array
          ...[
            { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "regions",
                foreignField: "_id",
                localField: "simpleData.region",
                as: "simpleData.region",
              },
            },
            { $unwind: { path: "$simpleData.region", preserveNullAndEmptyArrays: true } },
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
                "simpleData.availableQuantity": {
                  $function: {
                    body: function (regionArr, region) {
                      return regionArr.filter((el) => el._id.toString() == region.toString())[0];
                    },
                    args: ["$inventories.regionWise", "$simpleData.region._id"],
                    lang: "js",
                  },
                },
              },
            },
            {
              $addFields: {
                "simpleData.availableQuantity": {
                  $toDouble: "$simpleData.availableQuantity.availableQuantity",
                },
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
                group_mrp: { $first: "$group_mrp" },
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
                // inventories: { $first: "$inventories" },
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
            {
              $addFields: {
                simpleData: {
                  $filter: {
                    input: "$simpleData",
                    as: "sd",
                    cond: { $gt: [{ $size: { $objectToArray: "$$sd" } }, 2] },
                  },
                },
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
            { $unwind: { path: "$groupData.sets.package", preserveNullAndEmptyArrays: true } },

            // *************************************************************************************************************
            // Starting of code for populating Inner Product of Group Product
            // *************************************************************************************************************
            {
              $lookup: {
                from: "products",
                let: { product_id: "$groupData.sets.product" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$$product_id", "$_id"] } } },
                  // For adding quantity keys
                  ...[
                    {
                      $lookup: {
                        from: "inventory_items",
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
                        lostQuantity: { $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0] },
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
                    { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
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
                        configurableData: { $first: "$configurableData" },
                        groupData: { $first: "$groupData" },
                        base_price: { $first: "$base_price" },
                        group_mrp: { $first: "$group_mrp" },
                        slug: { $first: "$slug" },
                        TypeOfProduct: { $first: "$TypeOfProduct" },
                        outOfStock: { $first: "$outOfStock" },
                        availableQuantity: { $first: "$availableQuantity" },
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
                      },
                    },
                    {
                      $addFields: {
                        simpleData: {
                          $filter: {
                            input: "$simpleData",
                            as: "sd",
                            cond: { $gt: [{ $size: { $objectToArray: "$$sd" } }, 2] },
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
                    { $unwind: { path: "$unitMeasurement", preserveNullAndEmptyArrays: true } },

                    {
                      $lookup: {
                        from: "taxs",
                        localField: "salesTaxOutSide",
                        foreignField: "_id",
                        as: "salesTaxOutSide",
                      },
                    },
                    { $unwind: { path: "$salesTaxOutSide", preserveNullAndEmptyArrays: true } },

                    {
                      $lookup: {
                        from: "taxs",
                        localField: "salesTaxWithIn",
                        foreignField: "_id",
                        as: "salesTaxWithIn",
                      },
                    },
                    { $unwind: { path: "$salesTaxWithIn", preserveNullAndEmptyArrays: true } },

                    {
                      $lookup: {
                        from: "taxs",
                        localField: "purchaseTax",
                        foreignField: "_id",
                        as: "purchaseTax",
                      },
                    },
                    { $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true } },
                  ],
                ],
                as: "groupData.sets.product",
              },
            },
            { $unwind: { path: "$groupData.sets.product", preserveNullAndEmptyArrays: true } },
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
                group_mrp: { $first: "$group_mrp" },
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

          // inside related products
          ...[
            { $unwind: { path: "$relatedProduct", preserveNullAndEmptyArrays: true } },
            // *************************************************************************************************************
            // Starting of code for populating related products
            // *************************************************************************************************************
            {
              $lookup: {
                from: "products",
                let: { product_id: "$relatedProduct.product_id" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$$product_id", "$_id"] } } },
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
                              $expr: { $eq: ["$product_id", "$$product_id"] },
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
                        lostQuantity: { $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0] },
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

                  // For Populating nested keys inside nested array of objects
                  ...[
                    // inside simpleData array
                    ...[
                      { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
                      {
                        $lookup: {
                          from: "regions",
                          foreignField: "_id",
                          localField: "simpleData.region",
                          as: "simpleData.region",
                        },
                      },
                      { $unwind: { path: "$simpleData.region", preserveNullAndEmptyArrays: true } },
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
                          group_mrp: { $first: "$group_mrp" },
                          slug: { $first: "$slug" },
                          TypeOfProduct: { $first: "$TypeOfProduct" },
                          outOfStock: { $first: "$outOfStock" },
                          availableQuantity: { $first: "$availableQuantity" },
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
                          relatedProduct: { $first: "$relatedProduct" },
                          product_categories: { $first: "$product_categories" },
                        },
                      },
                      {
                        $addFields: {
                          simpleData: {
                            $filter: {
                              input: "$simpleData",
                              as: "sd",
                              cond: { $gt: [{ $size: { $objectToArray: "$$sd" } }, 2] },
                            },
                          },
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

                      // *************************************************************************************************************
                      // Starting of code for populating Inner Product of Group Product in " related products "
                      // *************************************************************************************************************
                      {
                        $lookup: {
                          from: "products",
                          let: { product_id: "$groupData.sets.product" },
                          pipeline: [
                            { $match: { $expr: { $eq: ["$$product_id", "$_id"] } } },
                            // For adding quantity keys
                            ...[
                              {
                                $lookup: {
                                  from: "inventory_items",
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
                                $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true },
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
                                  configurableData: { $first: "$configurableData" },
                                  groupData: { $first: "$groupData" },
                                  base_price: { $first: "$base_price" },
                                  group_mrp: { $first: "$group_mrp" },
                                  slug: { $first: "$slug" },
                                  TypeOfProduct: { $first: "$TypeOfProduct" },
                                  outOfStock: { $first: "$outOfStock" },
                                  availableQuantity: { $first: "$availableQuantity" },
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
                                },
                              },
                              {
                                $addFields: {
                                  simpleData: {
                                    $filter: {
                                      input: "$simpleData",
                                      as: "sd",
                                      cond: { $gt: [{ $size: { $objectToArray: "$$sd" } }, 2] },
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
                                $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true },
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
                group_mrp: { $first: "$group_mrp" },

                          slug: { $first: "$slug" },
                          TypeOfProduct: { $first: "$TypeOfProduct" },
                          outOfStock: { $first: "$outOfStock" },
                          availableQuantity: { $first: "$availableQuantity" },
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
                          relatedProduct: { $first: "$relatedProduct" },
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
                    { $unwind: { path: "$unitMeasurement", preserveNullAndEmptyArrays: true } },

                    {
                      $lookup: {
                        from: "taxs",
                        localField: "salesTaxOutSide",
                        foreignField: "_id",
                        as: "salesTaxOutSide",
                      },
                    },
                    { $unwind: { path: "$salesTaxOutSide", preserveNullAndEmptyArrays: true } },

                    {
                      $lookup: {
                        from: "taxs",
                        localField: "salesTaxWithIn",
                        foreignField: "_id",
                        as: "salesTaxWithIn",
                      },
                    },
                    { $unwind: { path: "$salesTaxWithIn", preserveNullAndEmptyArrays: true } },

                    {
                      $lookup: {
                        from: "taxs",
                        localField: "purchaseTax",
                        foreignField: "_id",
                        as: "purchaseTax",
                      },
                    },
                    { $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true } },
                  ],
                ],
                as: "relatedProduct.product_id",
              },
            },
            { $unwind: { path: "$relatedProduct.product_id", preserveNullAndEmptyArrays: true } },
            // *************************************************************************************************************
            // Ending of code for populating related products in " related products "
            // *************************************************************************************************************
            {
              $group: {
                _id: "$_id",
                product_name: { $first: "$product_name" },
                images: { $first: "$images" },
                simpleData: { $first: "$simpleData" },
                configurableData: { $first: "$configurableData" },
                groupData: { $first: "$groupData" },
                base_price: { $first: "$base_price" },
                group_mrp: { $first: "$group_mrp" },

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
                relatedProduct: { $push: "$relatedProduct" },
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
            {
              $addFields: {
                relatedProduct: {
                  $filter: {
                    input: "$relatedProduct",
                    as: "rp",
                    cond: { $ne: [{ $size: { $objectToArray: "$$rp" } }, 0] },
                  },
                },
              },
            },
          ],

          // For Product Regions array
          ...[
            { $unwind: { path: "$ProductRegion", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "regions",
                foreignField: "_id",
                localField: "ProductRegion.region_id",
                as: "ProductRegion.region_id",
              },
            },
            { $unwind: { path: "$ProductRegion.region_id", preserveNullAndEmptyArrays: true } },
            {
              $group: {
                _id: "$_id",
                product_name: { $first: "$product_name" },
                images: { $first: "$images" },
                simpleData: { $first: "$simpleData" },
                configurableData: { $first: "$configurableData" },
                groupData: { $first: "$groupData" },
                base_price: { $first: "$base_price" },
                group_mrp: { $first: "$group_mrp" },

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
                ProductRegion: { $push: "$ProductRegion" },
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

          // for related recipes
          ...[
            {
              $lookup: {
                from: "blogs",
                let: { product_id: "$_id" },
                pipeline: [
                  { $match: { $expr: { $in: ["$$product_id", "$relatedProduct.product_id"] } } },
                  {
                    $project: {
                      blog_id: "$$ROOT",
                      _id: null,
                    },
                  },
                ],
                as: "relatedRecipes",
              },
            },
          ],
        ],

        // For populating other small keys
        ...[
          {
            $lookup: {
              from: "categories",
              localField: "product_categories",
              foreignField: "_id",
              as: "product_categories",
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
          { $unwind: { path: "$unitMeasurement", preserveNullAndEmptyArrays: true } },

          {
            $lookup: {
              from: "taxs",
              localField: "salesTaxOutSide",
              foreignField: "_id",
              as: "salesTaxOutSide",
            },
          },
          { $unwind: { path: "$salesTaxOutSide", preserveNullAndEmptyArrays: true } },

          {
            $lookup: {
              from: "taxs",
              localField: "salesTaxWithIn",
              foreignField: "_id",
              as: "salesTaxWithIn",
            },
          },
          { $unwind: { path: "$salesTaxWithIn", preserveNullAndEmptyArrays: true } },

          {
            $lookup: {
              from: "taxs",
              localField: "purchaseTax",
              foreignField: "_id",
              as: "purchaseTax",
            },
          },
          { $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true } },
        ],
      ])
      .option({ serializeFunctions: true });

    res.status(200).json({ message: "ok", data: data[0], code: 1 });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "error",
      data: err,
      code: 0,
    });
  }
};
// module.exports.GetOne2 = async (req, res) => {
//   var id = req.params.Id;

//   try {
//     var data = await table
//       .aggregate([
//         { $match: { _id: mongoose.Types.ObjectId(id) } },
//       ])
//       .option({ serializeFunctions: true });

//     res.status(200).json({ message: "ok", data: data[0], code: 1 });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({
//       message: "error",
//       data: err,
//       code: 0,
//     });
//   }
// };
module.exports.GetOne2 = function (req, res) {
  var id = req.params.Id;
  table
    .find({ _id: id })
    .populate("admin_id", "name")
    .populate("product_categories")
    // .populate("groupRegions")
    .populate("groupData.sets.product")
    .populate("groupData.sets.package")
    .populate("relatedProduct.product_id", "product_name")
    .populate("relatedRecipes.blog_id", "title")
    .populate("ProductRegion.region_id", "name")
    .populate("unitMeasurement", "name")
    .populate("simpleData.region", "name")
    .populate("simpleData.package")
    .populate("configurableData.region", "name")
    .populate("configurableData.attributes.attributeId", "name item")
    .populate("salesTaxOutSide")
    .populate("salesTaxWithIn")
    .populate("purchaseTax")
    .exec(async function (err, data) {
      if (err) {
        errorLogger.error(err, "\n", "\n");
        console.log(err);
        res.status = 500;
        res.message = {
          message: "ID not found " + id,
          data: "",
          code: 0,
        };
      } else if (data == null || data.length == 0) {
        res.status = 404;
        res.message = {
          message: "ok",
          data: "data not found",
          code: 0,
        };
      } else {
        let productObj = data[0];

        await table.populate(productObj, { path: "groupData.sets.product.simpleData.package" });

        if (productObj.TypeOfProduct == "group") {
          productObj.groupData = productObj.groupData.map((set) => {
            set.sets.forEach((prod) => {
              prod.product.AvailableQuantity =
                typeof prod.product.AvailableQuantity == "object" ? +prod.product.AvailableQuantity.$numberDecimal : +prod.product.AvailableQuantity;
              prod.product.BookingQuantity =
                typeof prod.product.BookingQuantity == "object" ? +prod.product.BookingQuantity.$numberDecimal : +prod.product.BookingQuantity;
              prod.product.productQuantity =
                typeof prod.product.productQuantity == "object" ? +prod.product.productQuantity.$numberDecimal : +prod.product.productQuantity;
              prod.product.lostQuantity =
                typeof prod.product.lostQuantity == "object" ? +prod.product.lostQuantity.$numberDecimal : +prod.product.lostQuantity;
              prod.product.inhouseQuantity =
                typeof prod.product.inhouseQuantity == "object" ? +prod.product.inhouseQuantity.$numberDecimal : +prod.product.inhouseQuantity;
              prod.product.returnQuantity =
                typeof prod.product.returnQuantity == "object" ? +prod.product.returnQuantity.$numberDecimal : +prod.product.returnQuantity;

              prod.product.simpleData = prod.product.simpleData.map((sd) => {
                sd.quantity = typeof sd.quantity == "object" ? +sd.quantity.$numberDecimal : +sd.quantity;
                sd.availQuantity = typeof sd.availQuantity == "object" ? +sd.availQuantity.$numberDecimal : +sd.availQuantity;
                sd.bookingQuantity = typeof sd.bookingQuantity == "object" ? +sd.bookingQuantity.$numberDecimal : +sd.bookingQuantity;
                sd.lostQuantity = typeof sd.lostQuantity == "object" ? +sd.lostQuantity.$numberDecimal : +sd.lostQuantity;
                sd.returnQuantity = typeof sd.returnQuantity == "object" ? +sd.returnQuantity.$numberDecimal : +sd.returnQuantity;
                sd.inhouseQuantity = typeof sd.inhouseQuantity == "object" ? +sd.inhouseQuantity.$numberDecimal : +sd.inhouseQuantity;
                return sd;
              });
              return prod;
            });
            return set;
          });
        }

        res.status(200).json({ message: "ok", data: productObj, code: 1 });
      }
    });
};

// module.exports.GetOneDetailByName = function (req, res) {
//   var product_name = req.params.product_name;
//   table
//     .findOne({ product_name: product_name })
//     .populate("admin_id")
//     .populate("relatedProduct.product_id")
//     .populate("relatedRecipes.blog_id")
//     .populate("ProductRegion.region_id", "name")
//     .populate("unitMeasurement", "name")
//     .populate("simpleData.region", "name")
//     .populate("simpleData.package")
//     .populate("groupData.sets.package")
//     .populate("groupData.sets.product")
//     .populate("configurableData.region", "name")
//     .populate("configurableData.attributes.attributeId", "name item")
//     .populate("salesTaxOutSide")
//     .populate("salesTaxWithIn")
//     .populate("purchaseTax")
//     .exec(function (err, data) {
//       if (err) {
//         res.status = 500;
//         res.message = {
//           message: "name not found " + product_name,
//           data: "",
//           code: 0,
//         };
//       } else if (!data) {
//         res.status = 404;
//         res.message = {
//           message: "name not found " + product_name,
//           data: "",
//           code: 0,
//         };
//       } else {
//         var DataJson = {};
//         //for (var i = 0; i < data.length; i++) {
//         var DataI = data;
//         var varItem = DataI.configurableData;
//         var ItemVarArray = {};
//         var configurableDataPush = [];
//         var variantIdArrayPush = [];
//         for (var j = 0; j < varItem.length; j++) {
//           var variantIdArray = varItem[j].variant_id;
//           for (var k = 0; k < variantIdArray.length; k++) {
//             var item = variantIdArray[k].variantId.item;
//             for (var l = 0; l < item.length; l++) {
//               if (JSON.stringify(item[l]._id) == JSON.stringify(variantIdArray[k].variantItem)) {
//                 ItemVarArray = {
//                   item: item[l].item_name,
//                   _id: item[l]._id,
//                 };
//               }
//             }
//             variantIdArrayPush.push({
//               variantId: variantIdArray[k].variantId,
//               variantItem: variantIdArray[k].variantItem,
//               variantItemObject: ItemVarArray,
//               _id: variantIdArray._id,
//             });
//           }
//           configurableDataPush.push({
//             region: varItem[j].region,
//             sellingPrice: varItem[j].sellingPrice,
//             costPrice: varItem[j].costPrice,
//             total_amount: varItem[j].total_amount,
//             quantity: varItem[j].quantity,
//             ExpirationDate: varItem[j].ExpirationDate,
//             skuCode: varItem[j].skuCode,
//             _id: varItem[j]._id,
//             variant_id: variantIdArrayPush,
//           });
//         }
//         DataJson = {
//           _id: DataI._id,
//           admin_id: DataI.admin_id,
//           product_name: DataI.product_name,
//           slug: DataI.slug,
//           longDesc: DataI.longDesc,
//           shortDesc: DataI.shortDesc,
//           attachment: DataI.attachment,
//           productThreshold: DataI.productThreshold,
//           productSubscription: DataI.productSubscription,
//           salesTaxOutSide: DataI.salesTaxOutSide,
//           salesTaxWithIn: DataI.salesTaxWithIn,
//           purchaseTax: DataI.purchaseTax,
//           hsnCode: DataI.hsnCode,
//           unitMeasurement: DataI.unitMeasurement,
//           TypeOfProduct: DataI.TypeOfProduct,
//           SKUCode: DataI.SKUCode,
//           __v: DataI.__v,
//           created_at: DataI.created_at,
//           status: DataI.status,
//           sameDayDelivery: DataI.sameDayDelivery,
//           farmPickup: DataI.farmPickup,
//           youtube_link: DataI.youtube_link,
//           configurableData: configurableDataPush,
//           simpleData: DataI.simpleData,
//           ProductRegion: DataI.ProductRegion,
//           relatedRecipes: DataI.relatedRecipes,
//           relatedProduct: DataI.relatedProduct,
//           images: DataI.images,
//           banner: DataI.banner,
//           product_subCat1_id: DataI.product_subCat1_id,
//           product_cat_id: DataI.product_cat_id,
//           preOrder: DataI.preOrder,
//           preOrderQty: DataI.preOrderQty,
//           preOrderBookQty: DataI.preOrderBookQty,
//           preOrderRemainQty: DataI.preOrderRemainQty,
//           preOrderStartDate: DataI.preOrderStartDate,
//           preOrderEndDate: DataI.preOrderEndDate,
//         };
//         //}
//         res.status(200).json({
//           message: "ok",
//           data: DataJson,
//           code: 1,
//         });
//       }
//     });
// };

module.exports.UpdateProduct = function (req, res) {
  try {
    upload(req, res, function (err) {
      //console.log(req.body);
      var regionType = req.body.regionType;
      var admin_id = req.body.admin_id;
      var product_id = req.body.product_id;
      var a = req.body.color;
      var images = [];
      var image_config = [];
      var attachment = "";
      var banner = "";
      var nameFilter = { product_name: req.body.product_name };
      var error = {};

      if (product_id == "" || !product_id || product_id == undefined || product_id == null) {
        common.formValidate("product_id", res);
        return false;
      }

      if (admin_id == "" || !admin_id || admin_id == undefined || admin_id == null) {
        common.formValidate("admin_id", res);
        return false;
      }

      Admin.findOne({ _id: admin_id })
        .exec()
        .then((getAdmin) => {
          if (getAdmin == null) {
            error["admin_id"] = "admin_id not found in database";
          }
          var errorArray = Object.keys(error).length;
          if (errorArray > 0) {
            return res.status(400).json({
              status: "error",
              result: [error],
            });
          }
          table
            .find(nameFilter)
            .exec()
            .then(async (GetFilter) => {
              if (GetFilter.length > 0) {
                if (GetFilter[0]._id != req.body.product_id) {
                  error["product_name"] = "product_name alreday exist";
                }
              }

              var errorArray = Object.keys(error).length;
              if (errorArray > 0) {
                return res.status(200).json({
                  status: "error",
                  result: [error],
                });
              } else {
                // console.log("rrrrrrrrrrrrrrr 1");

                var variant_images = {};
                var oldImages = JSON.parse(req.body.images);

                if (oldImages) {
                  for (var i = 0; i < oldImages.length; i++) {
                    images.push({ image: oldImages[i].image });
                  }
                }

                for (var j = 0; j < req.files.length; j++) {
                  if (req.files[j].fieldname === "image") {
                    images.push({
                      image: req.files[j].filename,
                    });
                  }
                  if (req.files[j].fieldname === "image_config") {
                    image_config.push({
                      image_config: req.files[j].filename,
                    });
                  }

                  if (req.files[j].fieldname === "attachment") {
                    attachment = req.files[j].filename;
                  }

                  if (req.files[j].fieldname.includes("attachment")) {
                    variant_images[req.files[j].fieldname] = req.files[j].filename;
                  }

                  if (req.files[j].fieldname === "banner") {
                    banner = req.files[j].filename;
                  }
                }

                var groupDataArray = [];

                // console.log("rrrrrrrrrrrrrrr 2");
                if (req.body.TypeOfProduct == "simple") {
                  //var simpleData = req.body.product_data;
                  let simpleData = JSON.parse(req.body.product_data);
                  if (simpleData != undefined || simpleData != "") {
                    var simpleDataArray = [];

                    for (let i = 0; i < simpleData.length; i++) {
                      let PackageData = simpleData[i].package;
                      var PackageDataArray = [];
                      for (var k = 0; k < PackageData.length; k++) {
                        let package_id = null;
                        if (PackageData[k]._id) {
                          package_id = PackageData[k]._id;
                          await Packages.updateMany(
                            { _id: PackageData[k]._id },
                            {
                              $set: {
                                packet_size: PackageData[k].packet_size,
                                packetLabel: PackageData[k].packetLabel,
                                selling_price: PackageData[k].selling_price,
                                B2B_price: PackageData[k].B2B_price,
                                Retail_price: PackageData[k].Retail_price,
                                packetmrp: PackageData[k].packetmrp,
                                barcode: PackageData[k].barcode,
                                status: PackageData[k].status,
                              },
                            }
                          );
                        } else {
                          let doc = await Packages.create({
                            product: req.body.product_id,
                            region: simpleData[i].region,
                            packet_size: PackageData[k].packet_size,
                            packetLabel: PackageData[k].packetLabel,
                            selling_price: PackageData[k].selling_price,
                            B2B_price: PackageData[k].B2B_price,
                            Retail_price: PackageData[k].Retail_price,
                            packetmrp: PackageData[k].packetmrp,
                            barcode: PackageData[k].barcode,
                            status: PackageData[k].status,
                          });
                          package_id = doc._id;
                        }

                        PackageDataArray.push(package_id);
                      }

                      if (simpleData[i]._id) {
                        var simpleData_id = simpleData[i]._id;
                      } else {
                        var simpleData_id = null;
                      }

                      ExpirationDate: null;

                      // console.log("66666666666666666666666", simpleData[i]);

                      simpleDataArray.push({
                        // "_id"               : simpleData_id,
                        region: simpleData[i].region,
                        RegionSKUcode: simpleData[i].RegionSKUcode,
                        package: PackageDataArray,
                        ExpirationDate: simpleData[i].ExpirationDate,
                      });
                    }

                    var valueArr = simpleDataArray.map(function (item) {
                      return item.region;
                    });
                    var isDuplicate = valueArr.some(function (item, idx) {
                      return valueArr.indexOf(item) != idx;
                    });

                    if (isDuplicate == true) {
                      return res.status(400).json({
                        message: "error",
                        data: "same region found in simple data",
                        code: 0,
                      });
                      process.exit(1);
                    }
                  }
                } else if (req.body.TypeOfProduct == "configurable") {
                  var Data1 = req.body.product_data;
                  var conData = JSON.parse(Data1);
                  try {
                    if (conData != undefined || conData != "") {
                      var conDataArray = [];
                      var conDataArrayFind = [];
                      for (let i = 0; i < conData.length; i++) {
                        const conf = conData[i];
                        let identifier = conf.region;
                        conf.attributes.forEach((attribute) => {
                          identifier += `__${attribute.attributeName}__${attribute.attributeValue}`;
                        });

                        let imageConfig;
                        if (image_config != null) {
                          // imageConfig = image_config[i].image_config;
                        } else {
                          imageConfig = null;
                        }
                        conDataArray.push({
                          ...conf,
                          image: conf.image || variant_images["variant" + i] || "",
                          identifier,
                        });
                      }

                      let duplicate = false;
                      for (let i = 0; i < conDataArray.length; i++) {
                        for (let j = 0; j < conDataArray.length; j++) {
                          if (i != j && conDataArray[i].identifier == conDataArray[j].identifier) {
                            duplicate = true;
                          }
                        }
                      }

                      if (duplicate) {
                        return res.status(500).json({
                          message: "error",
                          data: "Duplicate Variant found",
                          code: 0,
                        });
                        process.exit(1);
                      }

                      conDataArray.forEach((conf) => {
                        conf.variant_name = conf.identifier.split("__").splice(1).join("__");
                        delete conf.identifier;
                      });

                      // for (var i = 0; i < conData.length; i++) {
                      //   var variantIds = conData[i].variant_id;
                      //   var variantItem = conData[i].variant_item;
                      //   var variantItemName = conData[i].variantItemName;
                      //   var varDataArray = [];
                      //   var varItemDataArray = [];

                      //   for (var i1 = 0; i1 < variantIds.length; i1++) {
                      //     varDataArray.push({
                      //       variantId: variantIds[i1],
                      //       variantItem: variantItem[i1],
                      //       //"variantItemName": variantItemName[i1]
                      //     });
                      //     varItemDataArray.push({
                      //       variantItem: variantItem[i1],
                      //     });
                      //     conDataArrayFind.push({
                      //       region: conData[i].region,
                      //       variant_item: variantItem[i1],
                      //     });
                      //   }
                      //   if (image_config != null) {
                      //     var imageConfig = image_config[i].image_config;
                      //   } else {
                      //     var imageConfig = null;
                      //   }
                      //   conDataArray.push({
                      //     region: conData[i].region,
                      //     variant_id: varDataArray,
                      //     // "variant_item": varItemDataArray,
                      //     sellingPrice: conData[i].selling_price,
                      //     costPrice: 0,
                      //     total_amount: 0,
                      //     quantity: 0,
                      //     ExpirationDate: null,
                      //     skuCode: conData[i].sku_code,
                      //     image: imageConfig,
                      //   });
                      // }
                      // var ab = [];
                      // for (var i = 0; i < conDataArrayFind.length; i++) {
                      //   var found = false;
                      //   for (var j = 0; j < conDataArrayFind.length; j++) {
                      //     if (j != i) {
                      //       if (
                      //         conDataArrayFind[i].region == conDataArrayFind[j].region &&
                      //         conDataArrayFind[i].variant_item == conDataArrayFind[j].variant_item
                      //       ) {
                      //         found = true;
                      //       }
                      //     }
                      //   }
                      //   if (found) {
                      //     ab.push(conDataArrayFind[i]);
                      //   }
                      // }
                      // if (ab.length > 0) {
                      //   return res.status(400).json({
                      //     message: "error",
                      //     data: "same region found",
                      //     code: 0,
                      //   });
                      //   process.exit(1);
                      // }
                    }
                  } catch (err) {
                    errorLogger.error(err, "\n", "\n");
                    process.exit(1);
                  }
                } else if (req.body.TypeOfProduct == "group") {
                  var groupData1 = req.body.product_data;
                  groupDataArray = JSON.parse(groupData1);

                  groupDataArray = groupDataArray.map((set) => {
                    set.sets.forEach((prod) => {
                      prod.product = prod.product._id;
                      return prod;
                    });
                    return set;
                  });
                } else {
                  simpleDataArray = [];
                  conDataArray = [];
                  groupDataArray = [];
                }
                // console.log("rrrrrrrrrrrrrrr 3");

                var product_id1 = req.body.relatedProduct;
                if (product_id1 != "null" && product_id1 && product_id1.length > 0) {
                  var product_id = JSON.parse(product_id1);
                  var productData = [];
                  for (var i = 0; i < product_id.length; i++) {
                    productData.push({
                      product_id: product_id[i].value,
                    });
                  }
                } else {
                  var productData = [];
                }

                var blog_id1 = req.body.relatedRecipes;
                if (blog_id1 != "null" && blog_id1 && blog_id1.length > 0) {
                  var blog_id = JSON.parse(blog_id1);
                  var blogData = [];
                  for (var i = 0; i < blog_id.length; i++) {
                    blogData.push({
                      blog_id: blog_id[i].value,
                    });
                  }
                } else {
                  var blogData = [];
                }

                var RegionTax_id1 = req.body.RegionTax;
                if (RegionTax_id1 != "null" && RegionTax_id1 && RegionTax_id1.length > 0) {
                  var RegionTax_id = JSON.parse(RegionTax_id1);
                  var ProductRegionData = [];
                  for (var i = 0; i < RegionTax_id.length; i++) {
                    ProductRegionData.push({
                      region_id: RegionTax_id[i].value,
                    });
                  }
                } else {
                  var ProductRegionData = [];
                }

                var unitMeasurement1 = req.body.unitMeasurement;
                if (unitMeasurement1 != "null" && unitMeasurement1 && unitMeasurement1.length > 0) {
                  var unitMeasurement = req.body.unitMeasurement;
                } else {
                  var unitMeasurement = null;
                }
                // var subCat_id1 = req.body.subCat_id;
                // if (
                //     subCat_id1 != "null" &&
                //     subCat_id1 &&
                //     subCat_id1.length > 0
                // ) {
                //     var product_subCat1_id = req.body.subCat_id;
                // } else {
                //     var product_subCat1_id = null;
                // }

                if (banner) {
                  var bannerImage = banner;
                } else {
                  var bannerImage = req.body.banner;
                }

                // console.log("rrrrrrrrrrrrrrr 4");
                console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ ", typeof req.body.barcode, req.body.barcode);

                var slug = common.slugify(req.body.product_name);
                var updateData = {
                  admin_id: req.body.admin_id,
                  product_categories: JSON.parse(req.body.product_categories),
                  product_name: req.body.product_name,
                  slug: slug,
                  longDesc: req.body.longDesc,
                  shortDesc: req.body.shortDesc,
                  images: images,
                  attachment: attachment,
                  banner: bannerImage,
                  relatedProduct: productData,
                  relatedRecipes: blogData,
                  productThreshold: req.body.productThreshold,
                  productSubscription: req.body.productSubscription,
                  preOrder: req.body.preOrder,
                  preOrderQty: 0,
                  preOrderRemainQty: 0,
                  preOrderStartDate: req.body.preOrderStartDate,
                  preOrderEndDate: req.body.preOrderEndDate,
                  ProductRegion: ProductRegionData,
                  salesTaxOutSide: req.body.salesTaxOutSide,
                  salesTaxWithIn: req.body.salesTaxWithIn,
                  purchaseTax: req.body.purchaseTax,
                  hsnCode: req.body.hsnCode,
                  unitMeasurement: unitMeasurement,
                  unitQuantity: 1,
                  TypeOfProduct: req.body.TypeOfProduct,
                  base_price: req.body.TypeOfProduct == "group" ? req.body.base_price : 0,
                  group_mrp: req.body.TypeOfProduct == "group" ? req.body.group_mrp : 0,
                  simpleData: simpleDataArray,
                  configurableData: conDataArray,
                  groupData: groupDataArray,
                  SKUCode: req.body.SKUCode,
                  status: req.body.status,
                  showstatus: req.body.showstatus,
                  productExpiryDay: req.body.productExpiryDay,
                  priority: req.body.priority && +req.body.priority ? req.body.priority : Infinity,
                  sameDayDelivery: req.body.sameDayDelivery || false,
                  farmPickup: req.body.farmPickup || false,
                  youtube_link: req.body.youtube_link || null,
                  barcode: req.body.barcode ? JSON.parse(req.body.barcode) : [],
                };

                // return res.status(200).json(updateData);
                // console.log("rrrrrrrrrrrrrrr 5");
                table.updateMany({ _id: req.body.product_id }, { $set: updateData }, function (err, data) {
                  if (err) {
                    errorLogger.error(err, "\n", "\n");
                    res.status(500).json({
                      message: "",
                      data: err,
                      code: 0,
                    });
                  } else {
                    // console.log("rrrrrrrrrrrrrrr 6");
                    res.status(200).json({
                      message: "ok",
                      data: "",
                      code: 1,
                    });
                    return;
                  }
                });
              }
            })
            .catch(function (err) {
              errorLogger.error(err, "\n", "\n");
              console.log("error:::::::::::", err);
              res.status(400).json(err);
            });
        });
    });
  } catch (err) {
    errorLogger.error(err, "\n", "\n");
    console.log("error1:::::::::::", err);
    res.status(400).json(err);
  }
};

module.exports.DeleteOne = function (req, res) {
  var Id = req.params.Id;
  table.findByIdAndRemove(Id).exec(function (err, data) {
    if (err) {
      res.status(404).json({ message: "", data: err, code: 0 });
    } else {
      res.status(200).json({
        message: "ok",
        data: "Delete Successfully",
        code: 1,
      });
      return;
    }
  });
};

module.exports.checkVariantByRegion = function (req, res) {
  var product_id = req.body.product_id;
  var region_id = req.body.region_id;

  table
    .findOne(
      {
        _id: product_id,
        configurableData: { $elemMatch: { region: region_id } },
      },
      { configurableData: 1 }
    )
    .populate("configurableData.attributes.attributeId", "name item")
    .exec(function (err, data) {
      if (err) {
        res.status(400).json({ message: err, data: [], code: 0 });
      } else if (data) {
        res.status(200).json({ message: "ok", data: data, code: 1 });
      }
    });
};

function getUnique(product_variant, comp) {
  const unique = product_variant
    .map((e) => e[comp])

    // store the keys of the unique objects
    .map((e, i, final) => final.indexOf(e) === i && i)

    // eliminate the dead keys & store unique objects
    .filter((e) => product_variant[e])
    .map((e) => product_variant[e]);

  return unique;
}

module.exports.FilterProducts = function (req, res) {
  var cat_id = req.body.cat_id;
  table
    .find({ product_cat_id: cat_id })
    .populate({
      path: "product_cat_id",
    })
    .exec(function (err, data) {
      var response = {
        status: 200,
        message: { message: "ok", data: data, code: 1 },
      };
      if (err) {
        response.status = 500;
        response.message = {
          message: "ID not found " + cat_id,
          data: "",
          code: 0,
        };
      } else if (!data) {
        response.status = 404;
        response.message = {
          message: "ID not found " + cat_id,
          data: "",
          code: 0,
        };
      }
      res.status(response.status).json(response.message);
    });
};

module.exports.filterVariantsByAttributes = function (req, res) {
  const { product_id, region_id, initialAttributes, attributesList } = req.body;

  let variantMatchArr = [];
  attributesList.forEach((attr) => {
    let regex = attr.attributeName + "__" + attr.attributeValue;
    variantMatchArr.push({
      $regexMatch: { input: "$$variant.variant_name", regex: regex },
    });
  });
  // console.log("variantMatchArrvariantMatchArrvariantMatchArr ", variantMatchArr);

  table
    .aggregate([
      { $match: { _id: mongoose.Types.ObjectId(product_id) } },
      {
        $project: {
          configurableData: {
            $filter: {
              input: "$configurableData",
              as: "variant",
              cond: { $and: variantMatchArr },
            },
          },
        },
      },
    ])
    .exec((err, data) => {
      if (err) {
        errorLogger.error(err, "\n", "\n");
        console.log("err", err);
      } else {
        // console.log("data", data);
        let configurableData = data[0].configurableData;

        let attributes = {};

        for (let i = 0; i < configurableData.length; i++) {
          const variant = configurableData[i];
          variant.attributes.forEach((attr) => {
            let index = (attributes[attr.attributeName] || []).indexOf(attr.attributeValue);
            if (index == -1) attributes[attr.attributeName] = [...(attributes[attr.attributeName] || []), attr.attributeValue];
          });
        }

        Object.keys(initialAttributes).forEach((name) => {
          initialAttributes[name] = initialAttributes[name].map((old) => {
            if (attributes[name] && attributes[name].findIndex((recent) => old.value === recent) !== -1) {
              return {
                ...old,
                status: "yes",
              };
            } else {
              return {
                ...old,
                status: "no",
              };
            }
          });
        });

        res.json({
          message: "",
          data: { configurableData, attributes: initialAttributes },
        });
      }
    });
};

module.exports.GetAllActiveProductByregion = async (req, res) => {
  try {
    console.log("HHHHHHHHHHHHH");
    let skip = +req.body.skip;
    let limit = +req.body.limit;
    var region_id = req.body.RegionId;
    var subscribe = req.body.subscribe;
    if (subscribe == true || subscribe == "true") {
      var DataFilter = {
        status: true,
        showstatus: true,
        productSubscription: "yes",
        $or: [
          {
            "simpleData.region": mongoose.Types.ObjectId(region_id),
            simpleData: { $elemMatch: { region: mongoose.Types.ObjectId(region_id) } },
            //"simpleData._id":0,
          },
          {
            "configurableData.region": mongoose.Types.ObjectId(region_id),
            configurableData: { $elemMatch: { region: mongoose.Types.ObjectId(region_id) } },
            //"simpleData._id":0,
          },
          // {
          //     groupRegions: mongoose.Types.ObjectId(region_id),
          // },
        ],
      };
    } else {
      var DataFilter = {
        status: true,
        showstatus: true,
        $or: [
          {
            "simpleData.region": mongoose.Types.ObjectId(region_id),
            simpleData: { $elemMatch: { region: mongoose.Types.ObjectId(region_id) } },
            //"simpleData._id":0,
          },
          {
            "configurableData.region": mongoose.Types.ObjectId(region_id),
            configurableData: { $elemMatch: { region: mongoose.Types.ObjectId(region_id) } },
            //"simpleData._id":0,
          },
          // {
          //     groupRegions: mongoose.Types.ObjectId(region_id),
          // },
        ],
      };
    }
    let DataJson = await table
      .aggregate([
        { $match: DataFilter },
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
                    $expr: { $eq: ["$product_id", "$$product_id"] },
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
              lostQuantity: { $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0] },
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

        // For Populating nested keys inside nested array of objects
        ...[
          // inside simpleData array
          ...[
            { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "regions",
                foreignField: "_id",
                localField: "simpleData.region",
                as: "simpleData.region",
              },
            },
            { $unwind: { path: "$simpleData.region", preserveNullAndEmptyArrays: true } },
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
            {
              $addFields: {
                simpleData: {
                  $filter: {
                    input: "$simpleData",
                    as: "sd",
                    cond: { $gt: [{ $size: { $objectToArray: "$$sd" } }, 2] },
                  },
                },
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
            { $unwind: { path: "$groupData.sets.package", preserveNullAndEmptyArrays: true } },

            // *************************************************************************************************************
            // Starting of code for populating Inner Product of Group Product
            // *************************************************************************************************************
            {
              $lookup: {
                from: "products",
                let: { product_id: "$groupData.sets.product" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$$product_id", "$_id"] } } },
                  // For adding quantity keys
                  ...[
                    {
                      $lookup: {
                        from: "inventory_items",
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
                        lostQuantity: { $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0] },
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
                    { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
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
                        configurableData: { $first: "$configurableData" },
                        groupData: { $first: "$groupData" },
                        base_price: { $first: "$base_price" },
                        slug: { $first: "$slug" },
                        TypeOfProduct: { $first: "$TypeOfProduct" },
                        outOfStock: { $first: "$outOfStock" },
                        availableQuantity: { $first: "$availableQuantity" },
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
                      },
                    },
                    {
                      $addFields: {
                        simpleData: {
                          $filter: {
                            input: "$simpleData",
                            as: "sd",
                            cond: { $gt: [{ $size: { $objectToArray: "$$sd" } }, 2] },
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
                    { $unwind: { path: "$unitMeasurement", preserveNullAndEmptyArrays: true } },

                    {
                      $lookup: {
                        from: "taxs",
                        localField: "salesTaxOutSide",
                        foreignField: "_id",
                        as: "salesTaxOutSide",
                      },
                    },
                    { $unwind: { path: "$salesTaxOutSide", preserveNullAndEmptyArrays: true } },

                    {
                      $lookup: {
                        from: "taxs",
                        localField: "salesTaxWithIn",
                        foreignField: "_id",
                        as: "salesTaxWithIn",
                      },
                    },
                    { $unwind: { path: "$salesTaxWithIn", preserveNullAndEmptyArrays: true } },

                    {
                      $lookup: {
                        from: "taxs",
                        localField: "purchaseTax",
                        foreignField: "_id",
                        as: "purchaseTax",
                      },
                    },
                    { $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true } },
                  ],
                ],
                as: "groupData.sets.product",
              },
            },
            { $unwind: { path: "$groupData.sets.product", preserveNullAndEmptyArrays: true } },
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

          // inside related products
          ...[
            { $unwind: { path: "$relatedProduct", preserveNullAndEmptyArrays: true } },
            // *************************************************************************************************************
            // Starting of code for populating related products
            // *************************************************************************************************************
            {
              $lookup: {
                from: "products",
                let: { product_id: "$relatedProduct.product_id" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$$product_id", "$_id"] } } },
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
                              $expr: { $eq: ["$product_id", "$$product_id"] },
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
                        lostQuantity: { $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0] },
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

                  // For Populating nested keys inside nested array of objects
                  ...[
                    // inside simpleData array
                    ...[
                      { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
                      {
                        $lookup: {
                          from: "regions",
                          foreignField: "_id",
                          localField: "simpleData.region",
                          as: "simpleData.region",
                        },
                      },
                      { $unwind: { path: "$simpleData.region", preserveNullAndEmptyArrays: true } },
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
                          relatedProduct: { $first: "$relatedProduct" },
                          product_categories: { $first: "$product_categories" },
                        },
                      },
                      {
                        $addFields: {
                          simpleData: {
                            $filter: {
                              input: "$simpleData",
                              as: "sd",
                              cond: { $gt: [{ $size: { $objectToArray: "$$sd" } }, 2] },
                            },
                          },
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

                      // *************************************************************************************************************
                      // Starting of code for populating Inner Product of Group Product in " related products "
                      // *************************************************************************************************************
                      {
                        $lookup: {
                          from: "products",
                          let: { product_id: "$groupData.sets.product" },
                          pipeline: [
                            { $match: { $expr: { $eq: ["$$product_id", "$_id"] } } },
                            // For adding quantity keys
                            ...[
                              {
                                $lookup: {
                                  from: "inventory_items",
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
                                $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true },
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
                                  configurableData: { $first: "$configurableData" },
                                  groupData: { $first: "$groupData" },
                                  base_price: { $first: "$base_price" },
                                  slug: { $first: "$slug" },
                                  TypeOfProduct: { $first: "$TypeOfProduct" },
                                  outOfStock: { $first: "$outOfStock" },
                                  availableQuantity: { $first: "$availableQuantity" },
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
                                },
                              },
                              {
                                $addFields: {
                                  simpleData: {
                                    $filter: {
                                      input: "$simpleData",
                                      as: "sd",
                                      cond: { $gt: [{ $size: { $objectToArray: "$$sd" } }, 2] },
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
                                $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true },
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
                          relatedProduct: { $first: "$relatedProduct" },
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
                    { $unwind: { path: "$unitMeasurement", preserveNullAndEmptyArrays: true } },

                    {
                      $lookup: {
                        from: "taxs",
                        localField: "salesTaxOutSide",
                        foreignField: "_id",
                        as: "salesTaxOutSide",
                      },
                    },
                    { $unwind: { path: "$salesTaxOutSide", preserveNullAndEmptyArrays: true } },

                    {
                      $lookup: {
                        from: "taxs",
                        localField: "salesTaxWithIn",
                        foreignField: "_id",
                        as: "salesTaxWithIn",
                      },
                    },
                    { $unwind: { path: "$salesTaxWithIn", preserveNullAndEmptyArrays: true } },

                    {
                      $lookup: {
                        from: "taxs",
                        localField: "purchaseTax",
                        foreignField: "_id",
                        as: "purchaseTax",
                      },
                    },
                    { $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true } },
                  ],
                ],
                as: "relatedProduct.product_id",
              },
            },
            { $unwind: { path: "$relatedProduct.product_id", preserveNullAndEmptyArrays: true } },
            // *************************************************************************************************************
            // Ending of code for populating related products in " related products "
            // *************************************************************************************************************
            {
              $group: {
                _id: "$_id",
                product_name: { $first: "$product_name" },
                images: { $first: "$images" },
                simpleData: { $first: "$simpleData" },
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
                relatedProduct: { $push: "$relatedProduct" },
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
            {
              $addFields: {
                relatedProduct: {
                  $filter: {
                    input: "$relatedProduct",
                    as: "rp",
                    cond: { $ne: [{ $size: { $objectToArray: "$$rp" } }, 0] },
                  },
                },
              },
            },
          ],

          // For Product Regions array
          ...[
            { $unwind: { path: "$ProductRegion", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "regions",
                foreignField: "_id",
                localField: "ProductRegion.region_id",
                as: "ProductRegion.region_id",
              },
            },
            { $unwind: { path: "$ProductRegion.region_id", preserveNullAndEmptyArrays: true } },
            {
              $group: {
                _id: "$_id",
                product_name: { $first: "$product_name" },
                images: { $first: "$images" },
                simpleData: { $first: "$simpleData" },
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
                ProductRegion: { $push: "$ProductRegion" },
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

          // for related recipes
          ...[
            {
              $lookup: {
                from: "blogs",
                let: { product_id: "$_id" },
                pipeline: [
                  { $match: { $expr: { $in: ["$$product_id", "$relatedProduct.product_id"] } } },
                  {
                    $project: {
                      blog_id: "$$ROOT",
                      _id: null,
                    },
                  },
                ],
                as: "relatedRecipes",
              },
            },
          ],
        ],

        // For populating other small keys
        ...[
          {
            $lookup: {
              from: "categories",
              localField: "product_categories",
              foreignField: "_id",
              as: "product_categories",
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
          { $unwind: { path: "$unitMeasurement", preserveNullAndEmptyArrays: true } },

          {
            $lookup: {
              from: "taxs",
              localField: "salesTaxOutSide",
              foreignField: "_id",
              as: "salesTaxOutSide",
            },
          },
          { $unwind: { path: "$salesTaxOutSide", preserveNullAndEmptyArrays: true } },

          {
            $lookup: {
              from: "taxs",
              localField: "salesTaxWithIn",
              foreignField: "_id",
              as: "salesTaxWithIn",
            },
          },
          { $unwind: { path: "$salesTaxWithIn", preserveNullAndEmptyArrays: true } },

          {
            $lookup: {
              from: "taxs",
              localField: "purchaseTax",
              foreignField: "_id",
              as: "purchaseTax",
            },
          },
          { $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true } },
        ],
      ])
      .option({ serializeFunctions: true });

    res.status(200).json({
      message: "ok",
      data: DataJson,
      count: DataJson.length,
      code: 1,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "error",
      data: err,
      code: 0,
    });
  }
};


module.exports.GetAllActiveProductBriefByregion = async (req, res) => {
  let skip = +req.body.skip || 0;
  let limit = +req.body.limit || 0;
  var region_id = req.body.RegionId;
  var subscribe = req.body.subscribe;
  if (req.body.showall == true) {
    if (subscribe == true || subscribe == "true") {
      var DataFilter = {
        //status: true,
        // showstatus: true,
        productSubscription: "yes",
        $or: [
          {
            "simpleData.region": mongoose.Types.ObjectId(region_id),
            simpleData: { $elemMatch: { region: mongoose.Types.ObjectId(region_id) } },
            //"simpleData._id":0,
          },
          {
            "configurableData.region": mongoose.Types.ObjectId(region_id),
            configurableData: { $elemMatch: { region: mongoose.Types.ObjectId(region_id) } },
            //"simpleData._id":0,
          },
          {
            TypeOfProduct: "group",
          },
        ],
      };
    } else {
      var DataFilter = {
        //status: true,
        // showstatus: true,
        $or: [
          {
            "simpleData.region": mongoose.Types.ObjectId(region_id),
            simpleData: { $elemMatch: { region: mongoose.Types.ObjectId(region_id) } },
            //"simpleData._id":0,
          },
          {
            "configurableData.region": mongoose.Types.ObjectId(region_id),
            configurableData: { $elemMatch: { region: mongoose.Types.ObjectId(region_id) } },
            //"simpleData._id":0,
          },
          {
            TypeOfProduct: "group",
          },
        ],
      };
    }
  } else {
    if (subscribe == true || subscribe == "true") {
      var DataFilter = {
        status: true,
        // showstatus: true,
        productSubscription: "yes",
        $or: [
          {
            "simpleData.region": mongoose.Types.ObjectId(region_id),
            simpleData: { $elemMatch: { region: mongoose.Types.ObjectId(region_id) } },
            //"simpleData._id":0,
          },
          {
            "configurableData.region": mongoose.Types.ObjectId(region_id),
            configurableData: { $elemMatch: { region: mongoose.Types.ObjectId(region_id) } },
            //"simpleData._id":0,
          },
          {
            TypeOfProduct: "group",
          },
        ],
      };
    } else {
      var DataFilter = {
        status: true,
        // showstatus: true,
        $or: [
          {
            "simpleData.region": mongoose.Types.ObjectId(region_id),
            simpleData: { $elemMatch: { region: mongoose.Types.ObjectId(region_id) } },
            //"simpleData._id":0,
          },
          {
            "configurableData.region": mongoose.Types.ObjectId(region_id),
            configurableData: { $elemMatch: { region: mongoose.Types.ObjectId(region_id) } },
            //"simpleData._id":0,
          },
          {
            TypeOfProduct: "group",
          },
        ],
      };
    }
  }

  console.log("DataFilter ::: $$$ ::: ", DataFilter);

  let DataJson = await table
    .aggregate([
      { $match: DataFilter },
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
            lostQuantity: { $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0] },
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

      // For Populating nested keys inside nested array of objects
      ...[
        // inside simpleData array
        ...[
          { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "regions",
              foreignField: "_id",
              localField: "simpleData.region",
              as: "simpleData.region",
            },
          },
          { $unwind: { path: "$simpleData.region", preserveNullAndEmptyArrays: true } },
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
              "simpleData.availableQuantity": "$availableQuantity",
            },
          },
          {
            $group: {
              _id: "$_id",
              product_name: { $first: "$product_name" },
              //images: { $first: "$images" },
              simpleData: { $push: "$simpleData" },
              configurableData: { $first: "$configurableData" },
              groupData: { $first: "$groupData" },
              base_price: { $first: "$base_price" },
              TypeOfProduct: { $first: "$TypeOfProduct" },
              outOfStock: { $first: "$outOfStock" },
              availableQuantity: { $first: "$availableQuantity" },
              productSubscription: { $first: "$productSubscription" },
              sameDayDelivery: { $first: "$sameDayDelivery" },
              farmPickup: { $first: "$farmPickup" },
              status: { $first: "$status" },
              unitMeasurement: { $first: "$unitMeasurement" },
              salesTaxOutSide: { $first: "$salesTaxOutSide" },
              salesTaxWithIn: { $first: "$salesTaxWithIn" },
              barcode: { $first: "$barcode" },
              ProductRegion: { $first: "$ProductRegion" },
              unitQuantity: { $first: "$unitQuantity" },
            },
          },
          {
            $addFields: {
              simpleData: {
                $filter: {
                  input: "$simpleData",
                  as: "sd",
                  cond: { $eq: ["$$sd.region._id", mongoose.Types.ObjectId(region_id)] },
                },
              },
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
          { $unwind: { path: "$groupData.sets.package", preserveNullAndEmptyArrays: true } },

          // *************************************************************************************************************
          // Starting of code for populating Inner Product of Group Product
          // *************************************************************************************************************
          {
            $lookup: {
              from: "products",
              let: { product_id: "$groupData.sets.product" },
              pipeline: [
                { $match: { $expr: { $eq: ["$$product_id", "$_id"] } } },
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
                      
                      availableQuantity: {
                        $ifNull: [{ $toDouble: "$inventories.availableQuantity" }, 0],
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
                  { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
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
                      configurableData: { $first: "$configurableData" },
                      groupData: { $first: "$groupData" },
                      TypeOfProduct: { $first: "$TypeOfProduct" },
                      outOfStock: { $first: "$outOfStock" },
                      availableQuantity: { $first: "$availableQuantity" },
                      productSubscription: { $first: "$productSubscription" },
                      sameDayDelivery: { $first: "$sameDayDelivery" },
                      farmPickup: { $first: "$farmPickup" },
                      status: { $first: "$status" },
                      unitMeasurement: { $first: "$unitMeasurement" },
                      salesTaxOutSide: { $first: "$salesTaxOutSide" },
                      salesTaxWithIn: { $first: "$salesTaxWithIn" },
                    },
                  },
                  {
                    $addFields: {
                      simpleData: {
                        $filter: {
                          input: "$simpleData",
                          as: "sd",
                          cond: { $gt: [{ $size: { $objectToArray: "$$sd" } }, 2] },
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
                  { $unwind: { path: "$unitMeasurement", preserveNullAndEmptyArrays: true } },

                  {
                    $lookup: {
                      from: "taxs",
                      localField: "salesTaxOutSide",
                      foreignField: "_id",
                      as: "salesTaxOutSide",
                    },
                  },
                  { $unwind: { path: "$salesTaxOutSide", preserveNullAndEmptyArrays: true } },

                  {
                    $lookup: {
                      from: "taxs",
                      localField: "salesTaxWithIn",
                      foreignField: "_id",
                      as: "salesTaxWithIn",
                    },
                  },
                  { $unwind: { path: "$salesTaxWithIn", preserveNullAndEmptyArrays: true } },

                  {
                    $lookup: {
                      from: "taxs",
                      localField: "purchaseTax",
                      foreignField: "_id",
                      as: "purchaseTax",
                    },
                  },
                  { $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true } },
                ],
              ],
              as: "groupData.sets.product",
            },
          },
          { $unwind: { path: "$groupData.sets.product", preserveNullAndEmptyArrays: true } },
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
              TypeOfProduct: { $first: "$TypeOfProduct" },
              outOfStock: { $first: "$outOfStock" },
              availableQuantity: { $first: "$availableQuantity" },
              sameDayDelivery: { $first: "$sameDayDelivery" },
              farmPickup: { $first: "$farmPickup" },
              //priority: { $first: "$priority" },
              status: { $first: "$status" },
              unitMeasurement: { $first: "$unitMeasurement" },
              salesTaxOutSide: { $first: "$salesTaxOutSide" },
              salesTaxWithIn: { $first: "$salesTaxWithIn" },
              //relatedProduct: { $first: "$relatedProduct" },
              barcode: { $first: "$barcode" },
              ProductRegion: { $first: "$ProductRegion" },
              unitQuantity: { $first: "$unitQuantity" },
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
        // For Product Regions array
        ...[
          { $unwind: { path: "$ProductRegion", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "regions",
              foreignField: "_id",
              localField: "ProductRegion.region_id",
              as: "ProductRegion.region_id",
            },
          },
          { $unwind: { path: "$ProductRegion.region_id", preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: "$_id",
              product_name: { $first: "$product_name" }, 
              simpleData: { $first: "$simpleData" },
              configurableData: { $first: "$configurableData" },
              groupData: { $first: "$groupData" },
              base_price: { $first: "$base_price" },
              TypeOfProduct: { $first: "$TypeOfProduct" },
              outOfStock: { $first: "$outOfStock" },
              availableQuantity: { $first: "$availableQuantity" },
              sameDayDelivery: { $first: "$sameDayDelivery" },
              farmPickup: { $first: "$farmPickup" },
              status: { $first: "$status" },
              unitMeasurement: { $first: "$unitMeasurement" },
              salesTaxOutSide: { $first: "$salesTaxOutSide" },
              salesTaxWithIn: { $first: "$salesTaxWithIn" },
              barcode: { $first: "$barcode" },
              unitQuantity: { $first: "$unitQuantity" },
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
        { $unwind: { path: "$unitMeasurement", preserveNullAndEmptyArrays: true } },

        {
          $lookup: {
            from: "taxs",
            localField: "salesTaxOutSide",
            foreignField: "_id",
            as: "salesTaxOutSide",
          },
        },
        { $unwind: { path: "$salesTaxOutSide", preserveNullAndEmptyArrays: true } },

        {
          $lookup: {
            from: "taxs",
            localField: "salesTaxWithIn",
            foreignField: "_id",
            as: "salesTaxWithIn",
          },
        },
        { $unwind: { path: "$salesTaxWithIn", preserveNullAndEmptyArrays: true } },
        
      ],
      {
        $project: {
          outOfStock: {
            $and: [{ $lte: ["$availableQuantity", 0] }, { $eq: ["$TypeOfProduct", "simple"] }],
          },
          availableQuantity: 1,
          TypeOfProduct: 1,
          salesTaxOutSide: 1,
          salesTaxWithIn: 1,
          simpleData: 1,
          groupData: 1,
          configurableData: 1,
          preOrder: 1,
          status: 1,
          unitMeasurement: 1,
          unitQuantity: 1,
          product_name: 1,
          //slug: 1,
          base_price: 1,
          barcode: 1,
        },
      },
    ])
    .option({ serializeFunctions: true });

  res.status(200).json({
    message: "ok",
    data: DataJson,
    count: DataJson.length,
    code: 1,
  });
};
// module.exports.GetAllActiveProductBriefByregion = async (req, res) => {
//   let skip = +req.body.skip || 0;
//   let limit = +req.body.limit || 0;
//   var region_id = req.body.RegionId;
//   var subscribe = req.body.subscribe;
//   if (req.body.showall == true) {
//     if (subscribe == true || subscribe == "true") {
//       var DataFilter = {
//         //status: true,
//         // showstatus: true,
//         productSubscription: "yes",
//         $or: [
//           {
//             "simpleData.region": mongoose.Types.ObjectId(region_id),
//             simpleData: { $elemMatch: { region: mongoose.Types.ObjectId(region_id) } },
//             //"simpleData._id":0,
//           },
//           {
//             "configurableData.region": mongoose.Types.ObjectId(region_id),
//             configurableData: { $elemMatch: { region: mongoose.Types.ObjectId(region_id) } },
//             //"simpleData._id":0,
//           },
//           {
//             TypeOfProduct: "group",
//           },
//         ],
//       };
//     } else {
//       var DataFilter = {
//         //status: true,
//         // showstatus: true,
//         $or: [
//           {
//             "simpleData.region": mongoose.Types.ObjectId(region_id),
//             simpleData: { $elemMatch: { region: mongoose.Types.ObjectId(region_id) } },
//             //"simpleData._id":0,
//           },
//           {
//             "configurableData.region": mongoose.Types.ObjectId(region_id),
//             configurableData: { $elemMatch: { region: mongoose.Types.ObjectId(region_id) } },
//             //"simpleData._id":0,
//           },
//           {
//             TypeOfProduct: "group",
//           },
//         ],
//       };
//     }
//   } else {
//     if (subscribe == true || subscribe == "true") {
//       var DataFilter = {
//         status: true,
//         // showstatus: true,
//         productSubscription: "yes",
//         $or: [
//           {
//             "simpleData.region": mongoose.Types.ObjectId(region_id),
//             simpleData: { $elemMatch: { region: mongoose.Types.ObjectId(region_id) } },
//             //"simpleData._id":0,
//           },
//           {
//             "configurableData.region": mongoose.Types.ObjectId(region_id),
//             configurableData: { $elemMatch: { region: mongoose.Types.ObjectId(region_id) } },
//             //"simpleData._id":0,
//           },
//           {
//             TypeOfProduct: "group",
//           },
//         ],
//       };
//     } else {
//       var DataFilter = {
//         status: true,
//         // showstatus: true,
//         $or: [
//           {
//             "simpleData.region": mongoose.Types.ObjectId(region_id),
//             simpleData: { $elemMatch: { region: mongoose.Types.ObjectId(region_id) } },
//             //"simpleData._id":0,
//           },
//           {
//             "configurableData.region": mongoose.Types.ObjectId(region_id),
//             configurableData: { $elemMatch: { region: mongoose.Types.ObjectId(region_id) } },
//             //"simpleData._id":0,
//           },
//           {
//             TypeOfProduct: "group",
//           },
//         ],
//       };
//     }
//   }

//   console.log("DataFilter ::: $$$ ::: ", DataFilter);

//   let DataJson = await table
//     .aggregate([
//       { $match: DataFilter },
//       {
//         $addFields: {
//           simpleData: {
//             $ifNull: ["$simpleData", []],
//           },
//           configurableData: {
//             $ifNull: ["$configurableData", []],
//           },
//           groupData: {
//             $ifNull: ["$groupData", []],
//           },
//         },
//       },
//       // For adding quantity keys
//       ...[
//         {
//           $lookup: {
//             from: "inventory_items",
//             let: { product_id: "$_id" },
//             pipeline: [
//               {
//                 $match: {
//                   $expr: {
//                     $and: [
//                       { $eq: ["$product_id", "$$product_id"] },
//                       {
//                         $eq: ["$region", mongoose.Types.ObjectId(region_id)],
//                       },
//                     ],
//                   },
//                 },
//               },
//               {
//                 $group: {
//                   _id: null,
//                   productQuantity: { $sum: "$productQuantity" },
//                   bookingQuantity: { $sum: "$bookingQuantity" },
//                   availableQuantity: { $sum: "$availableQuantity" },
//                   lostQuantity: { $sum: "$lostQuantity" },
//                   returnQuantity: { $sum: "$returnQuantity" },
//                   inhouseQuantity: { $sum: "$inhouseQuantity" },
//                 },
//               },
//               { $project: { _id: 0 } },
//             ],
//             as: "inventories",
//           },
//         },
//         {
//           $unwind: {
//             path: "$inventories",
//             preserveNullAndEmptyArrays: true,
//           },
//         },
//         {
//           $addFields: {
//             productQuantity: {
//               $ifNull: [{ $toDouble: "$inventories.productQuantity" }, 0],
//             },
//             bookingQuantity: {
//               $ifNull: [{ $toDouble: "$inventories.bookingQuantity" }, 0],
//             },
//             availableQuantity: {
//               $ifNull: [{ $toDouble: "$inventories.availableQuantity" }, 0],
//             },
//             lostQuantity: { $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0] },
//             returnQuantity: {
//               $ifNull: [{ $toDouble: "$inventories.returnQuantity" }, 0],
//             },
//             inhouseQuantity: {
//               $ifNull: [{ $toDouble: "$inventories.inhouseQuantity" }, 0],
//             },
//           },
//         },
//         {
//           $addFields: {
//             outOfStock: {
//               $cond: [{ $eq: ["$TypeOfProduct", "simple"] }, { $lte: ["$availableQuantity", 0] }, false],
//             },
//           },
//         },
//       ],

//       // For Populating nested keys inside nested array of objects
//       ...[
//         // inside simpleData array
//         ...[
//           { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
//           {
//             $lookup: {
//               from: "regions",
//               foreignField: "_id",
//               localField: "simpleData.region",
//               as: "simpleData.region",
//             },
//           },
//           { $unwind: { path: "$simpleData.region", preserveNullAndEmptyArrays: true } },
//           {
//             $unset: ["simpleData.region.stateData", "simpleData.region.__v", "simpleData.region.created_at"],
//           },
//           {
//             $lookup: {
//               from: "packages",
//               foreignField: "_id",
//               localField: "simpleData.package",
//               as: "simpleData.package",
//             },
//           },
//           {
//             $addFields: {
//               "simpleData.availableQuantity": "$availableQuantity",
//             },
//           },
//           {
//             $group: {
//               _id: "$_id",
//               product_name: { $first: "$product_name" },
//               images: { $first: "$images" },
//               simpleData: { $push: "$simpleData" },
//               configurableData: { $first: "$configurableData" },
//               groupData: { $first: "$groupData" },
//               base_price: { $first: "$base_price" },
//               slug: { $first: "$slug" },
//               TypeOfProduct: { $first: "$TypeOfProduct" },
//               outOfStock: { $first: "$outOfStock" },
//               productQuantity: { $first: "$productQuantity" },
//               bookingQuantity: { $first: "$bookingQuantity" },
//               availableQuantity: { $first: "$availableQuantity" },
//               lostQuantity: { $first: "$lostQuantity" },
//               returnQuantity: { $first: "$returnQuantity" },
//               inhouseQuantity: { $first: "$inhouseQuantity" },
//               productSubscription: { $first: "$productSubscription" },
//               preOrderQty: { $first: "$preOrderQty" },
//               preOrderBookQty: { $first: "$preOrderBookQty" },
//               preOrderRemainQty: { $first: "$preOrderRemainQty" },
//               preOrder: { $first: "$preOrder" },
//               preOrderStartDate: { $first: "$preOrderStartDate" },
//               preOrderEndDate: { $first: "$preOrderEndDate" },
//               sameDayDelivery: { $first: "$sameDayDelivery" },
//               farmPickup: { $first: "$farmPickup" },
//               priority: { $first: "$priority" },
//               status: { $first: "$status" },
//               showstatus: { $first: "$showstatus" },
//               ratings: { $first: "$ratings" },
//               ratingsCount: { $first: "$ratingsCount" },
//               reviews: { $first: "$reviews" },
//               reviewsCount: { $first: "$reviewsCount" },
//               unitMeasurement: { $first: "$unitMeasurement" },
//               salesTaxOutSide: { $first: "$salesTaxOutSide" },
//               salesTaxWithIn: { $first: "$salesTaxWithIn" },
//               purchaseTax: { $first: "$purchaseTax" },
//               relatedProduct: { $first: "$relatedProduct" },
//               product_categories: { $first: "$product_categories" },
//               // other keys
//               barcode: { $first: "$barcode" },
//               slug: { $first: "$slug" },
//               longDesc: { $first: "$longDesc" },
//               shortDesc: { $first: "$shortDesc" },
//               attachment: { $first: "$attachment" },
//               banner: { $first: "$banner" },
//               productThreshold: { $first: "$productThreshold" },
//               ProductRegion: { $first: "$ProductRegion" },
//               hsnCode: { $first: "$hsnCode" },
//               SKUCode: { $first: "$SKUCode" },
//               unitQuantity: { $first: "$unitQuantity" },
//               productExpiryDay: { $first: "$productExpiryDay" },
//               attribute_group: { $first: "$attribute_group" },
//               youtube_link: { $first: "$youtube_link" },
//               created_at: { $first: "$created_at" },
//             },
//           },
//           {
//             $addFields: {
//               simpleData: {
//                 $filter: {
//                   input: "$simpleData",
//                   as: "sd",
//                   cond: { $eq: ["$$sd.region._id", mongoose.Types.ObjectId(region_id)] },
//                 },
//               },
//             },
//           },
//         ],

//         // inside groupData array
//         ...[
//           { $unwind: { path: "$groupData", preserveNullAndEmptyArrays: true } },
//           { $unwind: { path: "$groupData.sets", preserveNullAndEmptyArrays: true } },
//           // { $sort: { "groupData.sets.priority": 1 } },
//           {
//             $lookup: {
//               from: "packages",
//               foreignField: "_id",
//               localField: "groupData.sets.package",
//               as: "groupData.sets.package",
//             },
//           },
//           { $unwind: { path: "$groupData.sets.package", preserveNullAndEmptyArrays: true } },

//           // *************************************************************************************************************
//           // Starting of code for populating Inner Product of Group Product
//           // *************************************************************************************************************
//           {
//             $lookup: {
//               from: "products",
//               let: { product_id: "$groupData.sets.product" },
//               pipeline: [
//                 { $match: { $expr: { $eq: ["$$product_id", "$_id"] } } },
//                 // For adding quantity keys
//                 ...[
//                   {
//                     $lookup: {
//                       from: "inventory_items",
//                       let: { product_id: "$_id" },
//                       pipeline: [
//                         {
//                           $match: {
//                             $expr: {
//                               $and: [
//                                 { $eq: ["$product_id", "$$product_id"] },
//                                 {
//                                   $eq: ["$region", mongoose.Types.ObjectId(region_id)],
//                                 },
//                               ],
//                             },
//                           },
//                         },
//                         {
//                           $group: {
//                             _id: null,
//                             productQuantity: { $sum: "$productQuantity" },
//                             bookingQuantity: { $sum: "$bookingQuantity" },
//                             availableQuantity: { $sum: "$availableQuantity" },
//                             lostQuantity: { $sum: "$lostQuantity" },
//                             returnQuantity: { $sum: "$returnQuantity" },
//                             inhouseQuantity: { $sum: "$inhouseQuantity" },
//                           },
//                         },
//                         { $project: { _id: 0 } },
//                       ],
//                       as: "inventories",
//                     },
//                   },
//                   {
//                     $unwind: {
//                       path: "$inventories",
//                       preserveNullAndEmptyArrays: true,
//                     },
//                   },
//                   {
//                     $addFields: {
//                       productQuantity: {
//                         $ifNull: [{ $toDouble: "$inventories.productQuantity" }, 0],
//                       },
//                       bookingQuantity: {
//                         $ifNull: [{ $toDouble: "$inventories.bookingQuantity" }, 0],
//                       },
//                       availableQuantity: {
//                         $ifNull: [{ $toDouble: "$inventories.availableQuantity" }, 0],
//                       },
//                       lostQuantity: { $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0] },
//                       returnQuantity: {
//                         $ifNull: [{ $toDouble: "$inventories.returnQuantity" }, 0],
//                       },
//                       inhouseQuantity: {
//                         $ifNull: [{ $toDouble: "$inventories.inhouseQuantity" }, 0],
//                       },
//                     },
//                   },
//                   {
//                     $addFields: {
//                       outOfStock: {
//                         $cond: [{ $eq: ["$TypeOfProduct", "simple"] }, { $lte: ["$availableQuantity", 0] }, false],
//                       },
//                     },
//                   },
//                 ],

//                 {
//                   $addFields: {
//                     simpleData: {
//                       $ifNull: ["$simpleData", []],
//                     },
//                     configurableData: {
//                       $ifNull: ["$configurableData", []],
//                     },
//                     groupData: {
//                       $ifNull: ["$groupData", []],
//                     },
//                   },
//                 },

//                 // inside simpleData array
//                 ...[
//                   { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
//                   {
//                     $lookup: {
//                       from: "packages",
//                       foreignField: "_id",
//                       localField: "simpleData.package",
//                       as: "simpleData.package",
//                     },
//                   },
//                   {
//                     $addFields: {
//                       "simpleData.availableQuantity": "$availableQuantity",
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
//                       availableQuantity: { $first: "$availableQuantity" },
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
//                     },
//                   },
//                   {
//                     $addFields: {
//                       simpleData: {
//                         $filter: {
//                           input: "$simpleData",
//                           as: "sd",
//                           cond: { $gt: [{ $size: { $objectToArray: "$$sd" } }, 2] },
//                         },
//                       },
//                     },
//                   },
//                   {
//                     $addFields: {
//                       soldInRegion: {
//                         $cond: [{ $gt: [{ $size: "$simpleData" }, 0] }, true, false],
//                         // $size: "$simpleData",
//                       },
//                     },
//                   },
//                 ],

//                 // For populating other small keys
//                 ...[
//                   {
//                     $lookup: {
//                       from: "unit_measurements",
//                       localField: "unitMeasurement",
//                       foreignField: "_id",
//                       as: "unitMeasurement",
//                     },
//                   },
//                   { $unwind: { path: "$unitMeasurement", preserveNullAndEmptyArrays: true } },

//                   {
//                     $lookup: {
//                       from: "taxs",
//                       localField: "salesTaxOutSide",
//                       foreignField: "_id",
//                       as: "salesTaxOutSide",
//                     },
//                   },
//                   { $unwind: { path: "$salesTaxOutSide", preserveNullAndEmptyArrays: true } },

//                   {
//                     $lookup: {
//                       from: "taxs",
//                       localField: "salesTaxWithIn",
//                       foreignField: "_id",
//                       as: "salesTaxWithIn",
//                     },
//                   },
//                   { $unwind: { path: "$salesTaxWithIn", preserveNullAndEmptyArrays: true } },

//                   {
//                     $lookup: {
//                       from: "taxs",
//                       localField: "purchaseTax",
//                       foreignField: "_id",
//                       as: "purchaseTax",
//                     },
//                   },
//                   { $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true } },
//                 ],
//               ],
//               as: "groupData.sets.product",
//             },
//           },
//           { $unwind: { path: "$groupData.sets.product", preserveNullAndEmptyArrays: true } },
//           // *************************************************************************************************************
//           // Ending of code for populating Inner Product of Group Product
//           // *************************************************************************************************************
//           // { $sort: { "groupData.sets.priority": 1, "groupData.sets.product.product_name": 1 } },
//           {
//             $group: {
//               _id: "$_id",
//               product_name: { $first: "$product_name" },
//               images: { $first: "$images" },
//               simpleData: { $first: "$simpleData" },
//               configurableData: { $first: "$configurableData" },
//               groupData: { $push: "$groupData" },
//               base_price: { $first: "$base_price" },
//               slug: { $first: "$slug" },
//               TypeOfProduct: { $first: "$TypeOfProduct" },
//               outOfStock: { $first: "$outOfStock" },
//               productQuantity: { $first: "$productQuantity" },
//               bookingQuantity: { $first: "$bookingQuantity" },
//               availableQuantity: { $first: "$availableQuantity" },
//               lostQuantity: { $first: "$lostQuantity" },
//               returnQuantity: { $first: "$returnQuantity" },
//               inhouseQuantity: { $first: "$inhouseQuantity" },
//               productSubscription: { $first: "$productSubscription" },
//               preOrderQty: { $first: "$preOrderQty" },
//               preOrderBookQty: { $first: "$preOrderBookQty" },
//               preOrderRemainQty: { $first: "$preOrderRemainQty" },
//               preOrder: { $first: "$preOrder" },
//               preOrderStartDate: { $first: "$preOrderStartDate" },
//               preOrderEndDate: { $first: "$preOrderEndDate" },
//               sameDayDelivery: { $first: "$sameDayDelivery" },
//               farmPickup: { $first: "$farmPickup" },
//               priority: { $first: "$priority" },
//               status: { $first: "$status" },
//               showstatus: { $first: "$showstatus" },
//               ratings: { $first: "$ratings" },
//               ratingsCount: { $first: "$ratingsCount" },
//               reviews: { $first: "$reviews" },
//               reviewsCount: { $first: "$reviewsCount" },
//               unitMeasurement: { $first: "$unitMeasurement" },
//               salesTaxOutSide: { $first: "$salesTaxOutSide" },
//               salesTaxWithIn: { $first: "$salesTaxWithIn" },
//               purchaseTax: { $first: "$purchaseTax" },
//               relatedProduct: { $first: "$relatedProduct" },
//               product_categories: { $first: "$product_categories" },
//               // other keys
//               barcode: { $first: "$barcode" },
//               slug: { $first: "$slug" },
//               longDesc: { $first: "$longDesc" },
//               shortDesc: { $first: "$shortDesc" },
//               attachment: { $first: "$attachment" },
//               banner: { $first: "$banner" },
//               productThreshold: { $first: "$productThreshold" },
//               ProductRegion: { $first: "$ProductRegion" },
//               hsnCode: { $first: "$hsnCode" },
//               SKUCode: { $first: "$SKUCode" },
//               unitQuantity: { $first: "$unitQuantity" },
//               productExpiryDay: { $first: "$productExpiryDay" },
//               attribute_group: { $first: "$attribute_group" },
//               youtube_link: { $first: "$youtube_link" },
//               created_at: { $first: "$created_at" },
//             },
//           },

//           // For grouping groupData.sets and
//           // For sorting inner products inside group products based on priorities
//           {
//             $addFields: {
//               groupData: {
//                 $function: {
//                   body: function (groupData) {
//                     let new_groupData = [];
//                     for (let gd of groupData) {
//                       if (gd.name) {
//                         let found = false;
//                         for (let new_gd of new_groupData) {
//                           if (new_gd._id.toString() === gd._id.toString() && new_gd.name === gd.name) {
//                             found = new_gd;
//                           }
//                         }
//                         if (found) {
//                           found.sets.push(gd.sets);
//                         } else {
//                           gd.sets = [gd.sets];
//                           new_groupData.push(gd);
//                         }
//                       }
//                     }

//                     for (const gd of new_groupData) {
//                       for (const set of gd.sets) {
//                         if (set.priority === null) {
//                           set.priority = Infinity;
//                         }
//                       }
//                       gd.sets.sort((a, b) => a.priority - b.priority);
//                     }

//                     return new_groupData;
//                   },
//                   args: ["$groupData"],
//                   lang: "js",
//                 },
//               },
//             },
//           },
//         ],

//         // inside related products
//         ...[
//           { $unwind: { path: "$relatedProduct", preserveNullAndEmptyArrays: true } },
//           // *************************************************************************************************************
//           // Starting of code for populating related products
//           // *************************************************************************************************************
//           {
//             $lookup: {
//               from: "products",
//               let: { product_id: "$relatedProduct.product_id" },
//               pipeline: [
//                 { $match: { $expr: { $eq: ["$$product_id", "$_id"] } } },
//                 {
//                   $addFields: {
//                     simpleData: {
//                       $ifNull: ["$simpleData", []],
//                     },
//                     configurableData: {
//                       $ifNull: ["$configurableData", []],
//                     },
//                     groupData: {
//                       $ifNull: ["$groupData", []],
//                     },
//                   },
//                 },

//                 // For adding quantity keys
//                 ...[
//                   {
//                     $lookup: {
//                       from: "inventory_items",
//                       let: { product_id: "$_id" },
//                       pipeline: [
//                         {
//                           $match: {
//                             $expr: {
//                               $and: [
//                                 { $eq: ["$product_id", "$$product_id"] },
//                                 {
//                                   $eq: ["$region", mongoose.Types.ObjectId(region_id)],
//                                 },
//                               ],
//                             },
//                           },
//                         },
//                         {
//                           $group: {
//                             _id: null,
//                             productQuantity: { $sum: "$productQuantity" },
//                             bookingQuantity: { $sum: "$bookingQuantity" },
//                             availableQuantity: { $sum: "$availableQuantity" },
//                             lostQuantity: { $sum: "$lostQuantity" },
//                             returnQuantity: { $sum: "$returnQuantity" },
//                             inhouseQuantity: { $sum: "$inhouseQuantity" },
//                           },
//                         },
//                         { $project: { _id: 0 } },
//                       ],
//                       as: "inventories",
//                     },
//                   },
//                   {
//                     $unwind: {
//                       path: "$inventories",
//                       preserveNullAndEmptyArrays: true,
//                     },
//                   },
//                   {
//                     $addFields: {
//                       productQuantity: {
//                         $ifNull: [{ $toDouble: "$inventories.productQuantity" }, 0],
//                       },
//                       bookingQuantity: {
//                         $ifNull: [{ $toDouble: "$inventories.bookingQuantity" }, 0],
//                       },
//                       availableQuantity: {
//                         $ifNull: [{ $toDouble: "$inventories.availableQuantity" }, 0],
//                       },
//                       lostQuantity: { $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0] },
//                       returnQuantity: {
//                         $ifNull: [{ $toDouble: "$inventories.returnQuantity" }, 0],
//                       },
//                       inhouseQuantity: {
//                         $ifNull: [{ $toDouble: "$inventories.inhouseQuantity" }, 0],
//                       },
//                     },
//                   },
//                   {
//                     $addFields: {
//                       outOfStock: {
//                         $cond: [{ $eq: ["$TypeOfProduct", "simple"] }, { $lte: ["$availableQuantity", 0] }, false],
//                       },
//                     },
//                   },
//                 ],

//                 // For Populating nested keys inside nested array of objects
//                 ...[
//                   // inside simpleData array
//                   ...[
//                     { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
//                     {
//                       $lookup: {
//                         from: "regions",
//                         foreignField: "_id",
//                         localField: "simpleData.region",
//                         as: "simpleData.region",
//                       },
//                     },
//                     { $unwind: { path: "$simpleData.region", preserveNullAndEmptyArrays: true } },
//                     {
//                       $unset: ["simpleData.region.stateData", "simpleData.region.__v", "simpleData.region.created_at"],
//                     },
//                     {
//                       $lookup: {
//                         from: "packages",
//                         foreignField: "_id",
//                         localField: "simpleData.package",
//                         as: "simpleData.package",
//                       },
//                     },
//                     {
//                       $addFields: {
//                         "simpleData.availableQuantity": "$availableQuantity",
//                       },
//                     },
//                     {
//                       $group: {
//                         _id: "$_id",
//                         product_name: { $first: "$product_name" },
//                         images: { $first: "$images" },
//                         simpleData: { $push: "$simpleData" },
//                         configurableData: { $first: "$configurableData" },
//                         groupData: { $first: "$groupData" },
//                         base_price: { $first: "$base_price" },
//                         slug: { $first: "$slug" },
//                         TypeOfProduct: { $first: "$TypeOfProduct" },
//                         outOfStock: { $first: "$outOfStock" },
//                         availableQuantity: { $first: "$availableQuantity" },
//                         productSubscription: { $first: "$productSubscription" },
//                         preOrder: { $first: "$preOrder" },
//                         preOrderQty: { $first: "$preOrderQty" },
//                         preOrderBookQty: { $first: "$preOrderBookQty" },
//                         preOrderRemainQty: { $first: "$preOrderRemainQty" },
//                         preOrderStartDate: { $first: "$preOrderStartDate" },
//                         preOrderEndDate: { $first: "$preOrderEndDate" },
//                         sameDayDelivery: { $first: "$sameDayDelivery" },
//                         farmPickup: { $first: "$farmPickup" },
//                         priority: { $first: "$priority" },
//                         status: { $first: "$status" },
//                         showstatus: { $first: "$showstatus" },
//                         ratings: { $first: "$ratings" },
//                         ratingsCount: { $first: "$ratingsCount" },
//                         reviews: { $first: "$reviews" },
//                         reviewsCount: { $first: "$reviewsCount" },
//                         unitMeasurement: { $first: "$unitMeasurement" },
//                         salesTaxOutSide: { $first: "$salesTaxOutSide" },
//                         salesTaxWithIn: { $first: "$salesTaxWithIn" },
//                         purchaseTax: { $first: "$purchaseTax" },
//                         relatedProduct: { $first: "$relatedProduct" },
//                         product_categories: { $first: "$product_categories" },
//                       },
//                     },
//                     {
//                       $addFields: {
//                         simpleData: {
//                           $filter: {
//                             input: "$simpleData",
//                             as: "sd",
//                             cond: { $gt: [{ $size: { $objectToArray: "$$sd" } }, 2] },
//                           },
//                         },
//                       },
//                     },
//                   ],

//                   // inside groupData array
//                   ...[
//                     { $unwind: { path: "$groupData", preserveNullAndEmptyArrays: true } },
//                     { $unwind: { path: "$groupData.sets", preserveNullAndEmptyArrays: true } },
//                     // { $sort: { "groupData.sets.priority": 1 } },
//                     {
//                       $lookup: {
//                         from: "packages",
//                         foreignField: "_id",
//                         localField: "groupData.sets.package",
//                         as: "groupData.sets.package",
//                       },
//                     },
//                     {
//                       $unwind: {
//                         path: "$groupData.sets.package",
//                         preserveNullAndEmptyArrays: true,
//                       },
//                     },

//                     // *************************************************************************************************************
//                     // Starting of code for populating Inner Product of Group Product in " related products "
//                     // *************************************************************************************************************
//                     {
//                       $lookup: {
//                         from: "products",
//                         let: { product_id: "$groupData.sets.product" },
//                         pipeline: [
//                           { $match: { $expr: { $eq: ["$$product_id", "$_id"] } } },
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
//                                             $eq: ["$region", mongoose.Types.ObjectId(region_id)],
//                                           },
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
//                             {
//                               $addFields: {
//                                 outOfStock: {
//                                   $cond: [{ $eq: ["$TypeOfProduct", "simple"] }, { $lte: ["$availableQuantity", 0] }, false],
//                                 },
//                               },
//                             },
//                           ],

//                           {
//                             $addFields: {
//                               simpleData: {
//                                 $ifNull: ["$simpleData", []],
//                               },
//                               configurableData: {
//                                 $ifNull: ["$configurableData", []],
//                               },
//                               groupData: {
//                                 $ifNull: ["$groupData", []],
//                               },
//                             },
//                           },

//                           // inside simpleData array
//                           ...[
//                             { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
//                             {
//                               $lookup: {
//                                 from: "packages",
//                                 foreignField: "_id",
//                                 localField: "simpleData.package",
//                                 as: "simpleData.package",
//                               },
//                             },
//                             {
//                               $addFields: {
//                                 "simpleData.availableQuantity": "$availableQuantity",
//                               },
//                             },
//                             {
//                               $group: {
//                                 _id: "$_id",
//                                 product_name: { $first: "$product_name" },
//                                 images: { $first: "$images" },
//                                 simpleData: { $push: "$simpleData" },
//                                 configurableData: { $first: "$configurableData" },
//                                 groupData: { $first: "$groupData" },
//                                 base_price: { $first: "$base_price" },
//                                 slug: { $first: "$slug" },
//                                 TypeOfProduct: { $first: "$TypeOfProduct" },
//                                 outOfStock: { $first: "$outOfStock" },
//                                 availableQuantity: { $first: "$availableQuantity" },
//                                 productSubscription: { $first: "$productSubscription" },
//                                 preOrder: { $first: "$preOrder" },
//                                 preOrderQty: { $first: "$preOrderQty" },
//                                 preOrderBookQty: { $first: "$preOrderBookQty" },
//                                 preOrderRemainQty: { $first: "$preOrderRemainQty" },
//                                 preOrderStartDate: { $first: "$preOrderStartDate" },
//                                 preOrderEndDate: { $first: "$preOrderEndDate" },
//                                 sameDayDelivery: { $first: "$sameDayDelivery" },
//                                 farmPickup: { $first: "$farmPickup" },
//                                 priority: { $first: "$priority" },
//                                 status: { $first: "$status" },
//                                 showstatus: { $first: "$showstatus" },
//                                 ratings: { $first: "$ratings" },
//                                 ratingsCount: { $first: "$ratingsCount" },
//                                 reviews: { $first: "$reviews" },
//                                 reviewsCount: { $first: "$reviewsCount" },
//                                 unitMeasurement: { $first: "$unitMeasurement" },
//                                 salesTaxOutSide: { $first: "$salesTaxOutSide" },
//                                 salesTaxWithIn: { $first: "$salesTaxWithIn" },
//                                 purchaseTax: { $first: "$purchaseTax" },
//                                 product_categories: { $first: "$product_categories" },
//                               },
//                             },
//                             {
//                               $addFields: {
//                                 simpleData: {
//                                   $filter: {
//                                     input: "$simpleData",
//                                     as: "sd",
//                                     cond: { $gt: [{ $size: { $objectToArray: "$$sd" } }, 2] },
//                                   },
//                                 },
//                               },
//                             },
//                             {
//                               $addFields: {
//                                 soldInRegion: {
//                                   $cond: [{ $gt: [{ $size: "$simpleData" }, 0] }, true, false],
//                                   // $size: "$simpleData",
//                                 },
//                               },
//                             },
//                           ],

//                           // For populating other small keys
//                           ...[
//                             {
//                               $lookup: {
//                                 from: "unit_measurements",
//                                 localField: "unitMeasurement",
//                                 foreignField: "_id",
//                                 as: "unitMeasurement",
//                               },
//                             },
//                             {
//                               $unwind: {
//                                 path: "$unitMeasurement",
//                                 preserveNullAndEmptyArrays: true,
//                               },
//                             },

//                             {
//                               $lookup: {
//                                 from: "taxs",
//                                 localField: "salesTaxOutSide",
//                                 foreignField: "_id",
//                                 as: "salesTaxOutSide",
//                               },
//                             },
//                             {
//                               $unwind: {
//                                 path: "$salesTaxOutSide",
//                                 preserveNullAndEmptyArrays: true,
//                               },
//                             },

//                             {
//                               $lookup: {
//                                 from: "taxs",
//                                 localField: "salesTaxWithIn",
//                                 foreignField: "_id",
//                                 as: "salesTaxWithIn",
//                               },
//                             },
//                             {
//                               $unwind: {
//                                 path: "$salesTaxWithIn",
//                                 preserveNullAndEmptyArrays: true,
//                               },
//                             },

//                             {
//                               $lookup: {
//                                 from: "taxs",
//                                 localField: "purchaseTax",
//                                 foreignField: "_id",
//                                 as: "purchaseTax",
//                               },
//                             },
//                             { $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true } },
//                           ],
//                         ],
//                         as: "groupData.sets.product",
//                       },
//                     },
//                     {
//                       $unwind: {
//                         path: "$groupData.sets.product",
//                         preserveNullAndEmptyArrays: true,
//                       },
//                     },
//                     // *************************************************************************************************************
//                     // Ending of code for populating Inner Product of Group Product
//                     // *************************************************************************************************************
//                     // { $sort: { "groupData.sets.priority": 1, "groupData.sets.product.product_name": 1 } },
//                     {
//                       $group: {
//                         _id: "$_id",
//                         product_name: { $first: "$product_name" },
//                         images: { $first: "$images" },
//                         simpleData: { $first: "$simpleData" },
//                         configurableData: { $first: "$configurableData" },
//                         groupData: { $push: "$groupData" },
//                         base_price: { $first: "$base_price" },
//                         slug: { $first: "$slug" },
//                         TypeOfProduct: { $first: "$TypeOfProduct" },
//                         outOfStock: { $first: "$outOfStock" },
//                         availableQuantity: { $first: "$availableQuantity" },
//                         productSubscription: { $first: "$productSubscription" },
//                         preOrder: { $first: "$preOrder" },
//                         preOrderQty: { $first: "$preOrderQty" },
//                         preOrderBookQty: { $first: "$preOrderBookQty" },
//                         preOrderRemainQty: { $first: "$preOrderRemainQty" },
//                         preOrderStartDate: { $first: "$preOrderStartDate" },
//                         preOrderEndDate: { $first: "$preOrderEndDate" },
//                         sameDayDelivery: { $first: "$sameDayDelivery" },
//                         farmPickup: { $first: "$farmPickup" },
//                         priority: { $first: "$priority" },
//                         status: { $first: "$status" },
//                         showstatus: { $first: "$showstatus" },
//                         ratings: { $first: "$ratings" },
//                         ratingsCount: { $first: "$ratingsCount" },
//                         reviews: { $first: "$reviews" },
//                         reviewsCount: { $first: "$reviewsCount" },
//                         unitMeasurement: { $first: "$unitMeasurement" },
//                         salesTaxOutSide: { $first: "$salesTaxOutSide" },
//                         salesTaxWithIn: { $first: "$salesTaxWithIn" },
//                         purchaseTax: { $first: "$purchaseTax" },
//                         relatedProduct: { $first: "$relatedProduct" },
//                         product_categories: { $first: "$product_categories" },
//                       },
//                     },

//                     // For grouping groupData.sets and
//                     // For sorting inner products inside group products based on priorities
//                     {
//                       $addFields: {
//                         groupData: {
//                           $function: {
//                             body: function (groupData) {
//                               let new_groupData = [];
//                               for (let gd of groupData) {
//                                 if (gd.name) {
//                                   let found = false;
//                                   for (let new_gd of new_groupData) {
//                                     if (new_gd._id.toString() === gd._id.toString() && new_gd.name === gd.name) {
//                                       found = new_gd;
//                                     }
//                                   }
//                                   if (found) {
//                                     found.sets.push(gd.sets);
//                                   } else {
//                                     gd.sets = [gd.sets];
//                                     new_groupData.push(gd);
//                                   }
//                                 }
//                               }

//                               for (const gd of new_groupData) {
//                                 for (const set of gd.sets) {
//                                   if (set.priority === null) {
//                                     set.priority = Infinity;
//                                   }
//                                 }
//                                 gd.sets.sort((a, b) => a.priority - b.priority);
//                               }

//                               return new_groupData;
//                             },
//                             args: ["$groupData"],
//                             lang: "js",
//                           },
//                         },
//                       },
//                     },
//                   ],
//                 ],

//                 // For populating other small keys
//                 ...[
//                   {
//                     $lookup: {
//                       from: "unit_measurements",
//                       localField: "unitMeasurement",
//                       foreignField: "_id",
//                       as: "unitMeasurement",
//                     },
//                   },
//                   { $unwind: { path: "$unitMeasurement", preserveNullAndEmptyArrays: true } },

//                   {
//                     $lookup: {
//                       from: "taxs",
//                       localField: "salesTaxOutSide",
//                       foreignField: "_id",
//                       as: "salesTaxOutSide",
//                     },
//                   },
//                   { $unwind: { path: "$salesTaxOutSide", preserveNullAndEmptyArrays: true } },

//                   {
//                     $lookup: {
//                       from: "taxs",
//                       localField: "salesTaxWithIn",
//                       foreignField: "_id",
//                       as: "salesTaxWithIn",
//                     },
//                   },
//                   { $unwind: { path: "$salesTaxWithIn", preserveNullAndEmptyArrays: true } },

//                   {
//                     $lookup: {
//                       from: "taxs",
//                       localField: "purchaseTax",
//                       foreignField: "_id",
//                       as: "purchaseTax",
//                     },
//                   },
//                   { $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true } },
//                 ],
//               ],
//               as: "relatedProduct.product_id",
//             },
//           },
//           { $unwind: { path: "$relatedProduct.product_id", preserveNullAndEmptyArrays: true } },
//           // *************************************************************************************************************
//           // Ending of code for populating related products in " related products "
//           // *************************************************************************************************************
//           {
//             $group: {
//               _id: "$_id",
//               product_name: { $first: "$product_name" },
//               images: { $first: "$images" },
//               simpleData: { $first: "$simpleData" },
//               configurableData: { $first: "$configurableData" },
//               groupData: { $first: "$groupData" },
//               base_price: { $first: "$base_price" },
//               slug: { $first: "$slug" },
//               TypeOfProduct: { $first: "$TypeOfProduct" },
//               outOfStock: { $first: "$outOfStock" },
//               productQuantity: { $first: "$productQuantity" },
//               bookingQuantity: { $first: "$bookingQuantity" },
//               availableQuantity: { $first: "$availableQuantity" },
//               lostQuantity: { $first: "$lostQuantity" },
//               returnQuantity: { $first: "$returnQuantity" },
//               inhouseQuantity: { $first: "$inhouseQuantity" },
//               productSubscription: { $first: "$productSubscription" },
//               preOrderQty: { $first: "$preOrderQty" },
//               preOrderBookQty: { $first: "$preOrderBookQty" },
//               preOrderRemainQty: { $first: "$preOrderRemainQty" },
//               preOrder: { $first: "$preOrder" },
//               preOrderStartDate: { $first: "$preOrderStartDate" },
//               preOrderEndDate: { $first: "$preOrderEndDate" },
//               sameDayDelivery: { $first: "$sameDayDelivery" },
//               farmPickup: { $first: "$farmPickup" },
//               priority: { $first: "$priority" },
//               status: { $first: "$status" },
//               showstatus: { $first: "$showstatus" },
//               ratings: { $first: "$ratings" },
//               ratingsCount: { $first: "$ratingsCount" },
//               reviews: { $first: "$reviews" },
//               reviewsCount: { $first: "$reviewsCount" },
//               unitMeasurement: { $first: "$unitMeasurement" },
//               salesTaxOutSide: { $first: "$salesTaxOutSide" },
//               salesTaxWithIn: { $first: "$salesTaxWithIn" },
//               purchaseTax: { $first: "$purchaseTax" },
//               relatedProduct: { $push: "$relatedProduct" },
//               product_categories: { $first: "$product_categories" },
//               // other keys
//               barcode: { $first: "$barcode" },
//               slug: { $first: "$slug" },
//               longDesc: { $first: "$longDesc" },
//               shortDesc: { $first: "$shortDesc" },
//               attachment: { $first: "$attachment" },
//               banner: { $first: "$banner" },
//               productThreshold: { $first: "$productThreshold" },
//               ProductRegion: { $first: "$ProductRegion" },
//               hsnCode: { $first: "$hsnCode" },
//               SKUCode: { $first: "$SKUCode" },
//               unitQuantity: { $first: "$unitQuantity" },
//               productExpiryDay: { $first: "$productExpiryDay" },
//               attribute_group: { $first: "$attribute_group" },
//               youtube_link: { $first: "$youtube_link" },
//               created_at: { $first: "$created_at" },
//             },
//           },
//           {
//             $addFields: {
//               relatedProduct: {
//                 $filter: {
//                   input: "$relatedProduct",
//                   as: "rp",
//                   cond: { $ne: [{ $size: { $objectToArray: "$$rp" } }, 0] },
//                 },
//               },
//             },
//           },
//         ],

//         // For Product Regions array
//         ...[
//           { $unwind: { path: "$ProductRegion", preserveNullAndEmptyArrays: true } },
//           {
//             $lookup: {
//               from: "regions",
//               foreignField: "_id",
//               localField: "ProductRegion.region_id",
//               as: "ProductRegion.region_id",
//             },
//           },
//           { $unwind: { path: "$ProductRegion.region_id", preserveNullAndEmptyArrays: true } },
//           {
//             $group: {
//               _id: "$_id",
//               product_name: { $first: "$product_name" },
//               images: { $first: "$images" },
//               simpleData: { $first: "$simpleData" },
//               configurableData: { $first: "$configurableData" },
//               groupData: { $first: "$groupData" },
//               base_price: { $first: "$base_price" },
//               slug: { $first: "$slug" },
//               TypeOfProduct: { $first: "$TypeOfProduct" },
//               outOfStock: { $first: "$outOfStock" },
//               productQuantity: { $first: "$productQuantity" },
//               bookingQuantity: { $first: "$bookingQuantity" },
//               availableQuantity: { $first: "$availableQuantity" },
//               lostQuantity: { $first: "$lostQuantity" },
//               returnQuantity: { $first: "$returnQuantity" },
//               inhouseQuantity: { $first: "$inhouseQuantity" },
//               productSubscription: { $first: "$productSubscription" },
//               preOrderQty: { $first: "$preOrderQty" },
//               preOrderBookQty: { $first: "$preOrderBookQty" },
//               preOrderRemainQty: { $first: "$preOrderRemainQty" },
//               preOrder: { $first: "$preOrder" },
//               preOrderStartDate: { $first: "$preOrderStartDate" },
//               preOrderEndDate: { $first: "$preOrderEndDate" },
//               sameDayDelivery: { $first: "$sameDayDelivery" },
//               farmPickup: { $first: "$farmPickup" },
//               priority: { $first: "$priority" },
//               status: { $first: "$status" },
//               showstatus: { $first: "$showstatus" },
//               ratings: { $first: "$ratings" },
//               ratingsCount: { $first: "$ratingsCount" },
//               reviews: { $first: "$reviews" },
//               reviewsCount: { $first: "$reviewsCount" },
//               unitMeasurement: { $first: "$unitMeasurement" },
//               salesTaxOutSide: { $first: "$salesTaxOutSide" },
//               salesTaxWithIn: { $first: "$salesTaxWithIn" },
//               purchaseTax: { $first: "$purchaseTax" },
//               relatedProduct: { $first: "$relatedProduct" },
//               product_categories: { $first: "$product_categories" },
//               // other keys
//               barcode: { $first: "$barcode" },
//               slug: { $first: "$slug" },
//               longDesc: { $first: "$longDesc" },
//               shortDesc: { $first: "$shortDesc" },
//               attachment: { $first: "$attachment" },
//               banner: { $first: "$banner" },
//               productThreshold: { $first: "$productThreshold" },
//               ProductRegion: { $push: "$ProductRegion" },
//               hsnCode: { $first: "$hsnCode" },
//               SKUCode: { $first: "$SKUCode" },
//               unitQuantity: { $first: "$unitQuantity" },
//               productExpiryDay: { $first: "$productExpiryDay" },
//               attribute_group: { $first: "$attribute_group" },
//               youtube_link: { $first: "$youtube_link" },
//               created_at: { $first: "$created_at" },
//             },
//           },
//         ],

//         // for related recipes
//         ...[
//           {
//             $lookup: {
//               from: "blogs",
//               let: { product_id: "$_id" },
//               pipeline: [
//                 { $match: { $expr: { $in: ["$$product_id", "$relatedProduct.product_id"] } } },
//                 {
//                   $project: {
//                     blog_id: "$$ROOT",
//                     _id: null,
//                   },
//                 },
//               ],
//               as: "relatedRecipes",
//             },
//           },
//         ],
//       ],

//       // For populating other small keys
//       ...[
//         {
//           $lookup: {
//             from: "categories",
//             localField: "product_categories",
//             foreignField: "_id",
//             as: "product_categories",
//           },
//         },

//         {
//           $lookup: {
//             from: "unit_measurements",
//             localField: "unitMeasurement",
//             foreignField: "_id",
//             as: "unitMeasurement",
//           },
//         },
//         { $unwind: { path: "$unitMeasurement", preserveNullAndEmptyArrays: true } },

//         {
//           $lookup: {
//             from: "taxs",
//             localField: "salesTaxOutSide",
//             foreignField: "_id",
//             as: "salesTaxOutSide",
//           },
//         },
//         { $unwind: { path: "$salesTaxOutSide", preserveNullAndEmptyArrays: true } },

//         {
//           $lookup: {
//             from: "taxs",
//             localField: "salesTaxWithIn",
//             foreignField: "_id",
//             as: "salesTaxWithIn",
//           },
//         },
//         { $unwind: { path: "$salesTaxWithIn", preserveNullAndEmptyArrays: true } },

//         {
//           $lookup: {
//             from: "taxs",
//             localField: "purchaseTax",
//             foreignField: "_id",
//             as: "purchaseTax",
//           },
//         },
//         { $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true } },
//       ],
//       {
//         $project: {
//           outOfStock: {
//             $and: [{ $lte: ["$availableQuantity", 0] }, { $eq: ["$TypeOfProduct", "simple"] }],
//           },
//           availableQuantity: 1,
//           TypeOfProduct: 1,
//           salesTaxOutSide: 1,
//           salesTaxWithIn: 1,
//           simpleData: 1,
//           groupData: 1,
//           configurableData: 1,
//           preOrder: 1,
//           status: 1,
//           unitMeasurement: 1,
//           unitQuantity: 1,
//           product_name: 1,
//           slug: 1,
//           base_price: 1,
//           barcode: 1,
//         },
//       },
//     ])
//     .option({ serializeFunctions: true });

//   res.status(200).json({
//     message: "ok",
//     data: DataJson,
//     count: DataJson.length,
//     code: 1,
//   });
// };



module.exports.GetProductByregionAndProductId = async (req, res) => {
  var region_id = req.body.RegionId;
  var product_id = req.body.product_id;
  var product_name = req.body.product_name;
  if (product_name || product_name != null) {
    var DataFilter = {
      slug: product_name,
      status: true,
      showstatus: true,
      $or: [
        {
          "simpleData.region": mongoose.Types.ObjectId(region_id),
          simpleData: { $elemMatch: { region: mongoose.Types.ObjectId(region_id) } },
          //"simpleData._id":0,
        },
        {
          "configurableData.region": mongoose.Types.ObjectId(region_id),
          configurableData: { $elemMatch: { region: mongoose.Types.ObjectId(region_id) } },
          //"simpleData._id":0,
        },
        {
          TypeOfProduct: "group",
        },
      ],
    };
  } else {
    var DataFilter = {
      _id: mongoose.Types.ObjectId(product_id),
      status: true,
      showstatus: true,
      $or: [
        {
          "simpleData.region": mongoose.Types.ObjectId(region_id),
          simpleData: { $elemMatch: { region: mongoose.Types.ObjectId(region_id) } },
          //"simpleData._id":0,
        },
        {
          "configurableData.region": mongoose.Types.ObjectId(region_id),
          configurableData: { $elemMatch: { region: mongoose.Types.ObjectId(region_id) } },
          //"simpleData._id":0,
        },
        {
          TypeOfProduct: "group",
        },
      ],
    };
  }

  try {
    let data = await table
      .aggregate([
        { $match: DataFilter },
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
              lostQuantity: { $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0] },
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
                { $match: { $expr: { $eq: ["$product_id", "$$product_id"] } } },
                {
                  $group: {
                    _id: null,
                    ratingsCount: { $sum: 1 },
                    ratingsSum: { $sum: "$rating" },
                    ratingsArray: { $push: "$rating" },
                    reviewArray: { $push: "$$ROOT" },
                  },
                },
              ],
              as: "ratingreviews",
            },
          },
          { $unwind: { path: "$ratingreviews", preserveNullAndEmptyArrays: true } },
          {
            $addFields: {
              ratings: {
                $round: [{ $divide: ["$ratingreviews.ratingsSum", "$ratingreviews.ratingsCount"] }, 1],
              },
              reviews: {
                $filter: {
                  input: "$ratingreviews.reviewArray",
                  as: "review",
                  cond: { $ne: ["$$review.review", ""] },
                },
              },
              ratingsCount: "$ratingreviews.ratingsCount",
            },
          },
          {
            $addFields: {
              reviewsCount: {
                $cond: { if: { $isArray: "$reviews" }, then: { $size: "$reviews" }, else: 0 },
              },
            },
          },
        ],

        // For Populating nested keys inside nested array of objects
        ...[
          // inside simpleData array
          ...[
            { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "regions",
                foreignField: "_id",
                localField: "simpleData.region",
                as: "simpleData.region",
              },
            },
            { $unwind: { path: "$simpleData.region", preserveNullAndEmptyArrays: true } },
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
                shortDesc:{ $first: "$shortDesc" },
                longDesc:{ $first: "$longDesc" },
                product_name: { $first: "$product_name" },
                images: { $first: "$images" },
                banner: { $first: "$banner" },
                simpleData: { $push: "$simpleData" },
                configurableData: { $first: "$configurableData" },
                groupData: { $first: "$groupData" },
                base_price: { $first: "$base_price" },
                slug: { $first: "$slug" },
                TypeOfProduct: { $first: "$TypeOfProduct" },
                outOfStock: { $first: "$outOfStock" },
                availableQuantity: { $first: "$availableQuantity" },
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
                relatedProduct: { $first: "$relatedProduct" },
                product_categories: { $first: "$product_categories" },
              },
            },
            {
              $addFields: {
                simpleData: {
                  $filter: {
                    input: "$simpleData",
                    as: "sd",
                    cond: { $eq: ["$$sd.region._id", mongoose.Types.ObjectId(region_id)] },
                  },
                },
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
            { $unwind: { path: "$groupData.sets.package", preserveNullAndEmptyArrays: true } },

            // *************************************************************************************************************
            // Starting of code for populating Inner Product of Group Product
            // *************************************************************************************************************
            {
              $lookup: {
                from: "products",
                let: { product_id: "$groupData.sets.product" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$$product_id", "$_id"] } } },
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
                        lostQuantity: { $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0] },
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
                    { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
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
                        shortDesc:{ $first: "$shortDesc" },
                        longDesc:{ $first: "$longDesc" },
                        product_name: { $first: "$product_name" },
                        images: { $first: "$images" },
                        banner: { $first: "$banner" },
                        simpleData: { $push: "$simpleData" },
                        configurableData: { $first: "$configurableData" },
                        groupData: { $first: "$groupData" },
                        base_price: { $first: "$base_price" },
                        slug: { $first: "$slug" },
                        TypeOfProduct: { $first: "$TypeOfProduct" },
                        outOfStock: { $first: "$outOfStock" },
                        availableQuantity: { $first: "$availableQuantity" },
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
                      },
                    },
                    {
                      $addFields: {
                        simpleData: {
                          $filter: {
                            input: "$simpleData",
                            as: "sd",
                            cond: { $eq: [{ $toString: "$$sd.region" }, { $toString: region_id }] },
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
                    { $unwind: { path: "$unitMeasurement", preserveNullAndEmptyArrays: true } },

                    {
                      $lookup: {
                        from: "taxs",
                        localField: "salesTaxOutSide",
                        foreignField: "_id",
                        as: "salesTaxOutSide",
                      },
                    },
                    { $unwind: { path: "$salesTaxOutSide", preserveNullAndEmptyArrays: true } },

                    {
                      $lookup: {
                        from: "taxs",
                        localField: "salesTaxWithIn",
                        foreignField: "_id",
                        as: "salesTaxWithIn",
                      },
                    },
                    { $unwind: { path: "$salesTaxWithIn", preserveNullAndEmptyArrays: true } },

                    {
                      $lookup: {
                        from: "taxs",
                        localField: "purchaseTax",
                        foreignField: "_id",
                        as: "purchaseTax",
                      },
                    },
                    { $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true } },
                  ],
                ],
                as: "groupData.sets.product",
              },
            },
            { $unwind: { path: "$groupData.sets.product", preserveNullAndEmptyArrays: true } },
            // *************************************************************************************************************
            // Ending of code for populating Inner Product of Group Product
            // *************************************************************************************************************
            // { $sort: { "groupData.sets.priority": 1, "groupData.sets.product.product_name": 1 } },
            {
              $group: {
                _id: "$_id",
                shortDesc:{ $first: "$shortDesc" },
                longDesc:{ $first: "$longDesc" },
                product_name: { $first: "$product_name" },
                images: { $first: "$images" },
                banner: { $first: "$banner" },
                simpleData: { $first: "$simpleData" },
                configurableData: { $first: "$configurableData" },
                groupData: { $push: "$groupData" },
                base_price: { $first: "$base_price" },
                slug: { $first: "$slug" },
                TypeOfProduct: { $first: "$TypeOfProduct" },
                outOfStock: { $first: "$outOfStock" },
                availableQuantity: { $first: "$availableQuantity" },
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
                relatedProduct: { $first: "$relatedProduct" },
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

          // inside related products
          ...[
            { $unwind: { path: "$relatedProduct", preserveNullAndEmptyArrays: true } },
            // *************************************************************************************************************
            // Starting of code for populating related products
            // *************************************************************************************************************
            {
              $lookup: {
                from: "products",
                let: { product_id: "$relatedProduct.product_id" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$$product_id", "$_id"] } } },
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
                        lostQuantity: { $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0] },
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
                          { $match: { $expr: { $eq: ["$product_id", "$$product_id"] } } },
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
                    { $unwind: { path: "$ratingreviews", preserveNullAndEmptyArrays: true } },
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
                      { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
                      {
                        $lookup: {
                          from: "regions",
                          foreignField: "_id",
                          localField: "simpleData.region",
                          as: "simpleData.region",
                        },
                      },
                      { $unwind: { path: "$simpleData.region", preserveNullAndEmptyArrays: true } },
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
                          shortDesc:{ $first: "$shortDesc" },
                          longDesc:{ $first: "$longDesc" },
                          product_name: { $first: "$product_name" },
                          images: { $first: "$images" },
                          banner: { $first: "$banner" },
                          simpleData: { $push: "$simpleData" },
                          configurableData: { $first: "$configurableData" },
                          groupData: { $first: "$groupData" },
                          base_price: { $first: "$base_price" },
                          slug: { $first: "$slug" },
                          TypeOfProduct: { $first: "$TypeOfProduct" },
                          outOfStock: { $first: "$outOfStock" },
                          availableQuantity: { $first: "$availableQuantity" },
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
                          relatedProduct: { $first: "$relatedProduct" },
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

                      // *************************************************************************************************************
                      // Starting of code for populating Inner Product of Group Product in " related products "
                      // *************************************************************************************************************
                      {
                        $lookup: {
                          from: "products",
                          let: { product_id: "$groupData.sets.product" },
                          pipeline: [
                            { $match: { $expr: { $eq: ["$$product_id", "$_id"] } } },
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
                                $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true },
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
                                  shortDesc:{ $first: "$shortDesc" },
                                  longDesc:{ $first: "$longDesc" },
                                  product_name: { $first: "$product_name" },
                                  images: { $first: "$images" },
                                  banner: { $first: "$banner" },
                                  simpleData: { $push: "$simpleData" },
                                  configurableData: { $first: "$configurableData" },
                                  groupData: { $first: "$groupData" },
                                  base_price: { $first: "$base_price" },
                                  slug: { $first: "$slug" },
                                  TypeOfProduct: { $first: "$TypeOfProduct" },
                                  outOfStock: { $first: "$outOfStock" },
                                  availableQuantity: { $first: "$availableQuantity" },
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
                                $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true },
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
                          shortDesc:{ $first: "$shortDesc" },
                          longDesc:{ $first: "$longDesc" },
                          product_name: { $first: "$product_name" },
                          images: { $first: "$images" },
                          banner: { $first: "$banner" },
                          simpleData: { $first: "$simpleData" },
                          configurableData: { $first: "$configurableData" },
                          groupData: { $push: "$groupData" },
                          base_price: { $first: "$base_price" },
                          slug: { $first: "$slug" },
                          TypeOfProduct: { $first: "$TypeOfProduct" },
                          outOfStock: { $first: "$outOfStock" },
                          availableQuantity: { $first: "$availableQuantity" },
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
                          relatedProduct: { $first: "$relatedProduct" },
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
                    { $unwind: { path: "$unitMeasurement", preserveNullAndEmptyArrays: true } },

                    {
                      $lookup: {
                        from: "taxs",
                        localField: "salesTaxOutSide",
                        foreignField: "_id",
                        as: "salesTaxOutSide",
                      },
                    },
                    { $unwind: { path: "$salesTaxOutSide", preserveNullAndEmptyArrays: true } },

                    {
                      $lookup: {
                        from: "taxs",
                        localField: "salesTaxWithIn",
                        foreignField: "_id",
                        as: "salesTaxWithIn",
                      },
                    },
                    { $unwind: { path: "$salesTaxWithIn", preserveNullAndEmptyArrays: true } },

                    {
                      $lookup: {
                        from: "taxs",
                        localField: "purchaseTax",
                        foreignField: "_id",
                        as: "purchaseTax",
                      },
                    },
                    { $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true } },
                  ],
                ],
                as: "relatedProduct.product_id",
              },
            },
            { $unwind: { path: "$relatedProduct.product_id", preserveNullAndEmptyArrays: true } },
            // *************************************************************************************************************
            // Ending of code for populating related products in " related products "
            // *************************************************************************************************************
            {
              $group: {
                _id: "$_id",
                shortDesc:{ $first: "$shortDesc" },
                longDesc:{ $first: "$longDesc" },
                product_name: { $first: "$product_name" },
                images: { $first: "$images" },
                banner: { $first: "$banner" },
                simpleData: { $first: "$simpleData" },
                configurableData: { $first: "$configurableData" },
                groupData: { $first: "$groupData" },
                base_price: { $first: "$base_price" },
                slug: { $first: "$slug" },
                TypeOfProduct: { $first: "$TypeOfProduct" },
                outOfStock: { $first: "$outOfStock" },
                availableQuantity: { $first: "$availableQuantity" },
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
                relatedProduct: { $push: "$relatedProduct" },
                product_categories: { $first: "$product_categories" },
              },
            },
            {
              $addFields: {
                relatedProduct: {
                  $filter: {
                    input: "$relatedProduct",
                    as: "rp",
                    cond: { $ne: [{ $size: { $objectToArray: "$$rp" } }, 0] },
                  },
                },
              },
            },
          ],

          // for related recipes
          ...[
            {
              $lookup: {
                from: "blogs",
                let: { product_id: "$_id" },
                pipeline: [
                  { $match: { $expr: { $in: ["$$product_id", "$relatedProduct.product_id"] } } },
                  {
                    $project: {
                      blog_id: "$$ROOT",
                      _id: null,
                    },
                  },
                ],
                as: "relatedRecipes",
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
          { $unwind: { path: "$unitMeasurement", preserveNullAndEmptyArrays: true } },

          {
            $lookup: {
              from: "taxs",
              localField: "salesTaxOutSide",
              foreignField: "_id",
              as: "salesTaxOutSide",
            },
          },
          { $unwind: { path: "$salesTaxOutSide", preserveNullAndEmptyArrays: true } },

          {
            $lookup: {
              from: "taxs",
              localField: "salesTaxWithIn",
              foreignField: "_id",
              as: "salesTaxWithIn",
            },
          },
          { $unwind: { path: "$salesTaxWithIn", preserveNullAndEmptyArrays: true } },

          {
            $lookup: {
              from: "taxs",
              localField: "purchaseTax",
              foreignField: "_id",
              as: "purchaseTax",
            },
          },
          { $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true } },
        ],
      ])
      .option({ serializeFunctions: true });
    res.status(200).json({
      message: "ok",
      data: data,
      code: 1,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "error",
      data: err,
      code: 0,
    });
  }
};


// module.exports.searchProduct = async function (req, res) {
//   let skip = +req.body.skip || 0;
//   let limit = +req.body.limit || 0;
//   console.log(limit);
//   // let limit = 10;
//   var region_id = req.body.RegionId;
//   var product_name = req.body.product_name;
//   var product_categories = req.body.product_categories;
//   var variantItem = req.body.variantItem;
//   var settings = await settingsModel.findOne({}).lean();
//   var preOrderProduct = settings.preOrder;
//   if (region_id == "" || !region_id || region_id == undefined || region_id == null) {
//     common.formValidate("Pincode", res);
//     return false;
//   }

//   // console.log(skip, limit);

//   var subscribe = req.body.subscribe;
//   if (subscribe == true || subscribe == "true") {
//     var DataFilter = {
//       productSubscription: "yes",
//       status: true,
//       showstatus: true,
//       "ProductRegion.region_id": mongoose.Types.ObjectId(region_id),
//       $or: [
//         {
//           "simpleData.region": mongoose.Types.ObjectId(region_id),
//           simpleData: {
//             $elemMatch: {
//               region: { $in: [mongoose.Types.ObjectId(region_id)] },
//             },
//           },
//           //"simpleData._id":1,
//         },
//         {
//           "configurableData.region": mongoose.Types.ObjectId(region_id),
//           configurableData: {
//             $elemMatch: {
//               region: { $in: [mongoose.Types.ObjectId(region_id)] },
//             },
//           },
//           //"simpleData._id":1,
//         },
//         {
//           TypeOfProduct: "group",
//         },
//       ],
//     };
//   } else {
//     var DataFilter = {
//       status: true,
//       showstatus: true,
//       "ProductRegion.region_id": mongoose.Types.ObjectId(region_id),
//       $or: [
//         {
//           "simpleData.region": mongoose.Types.ObjectId(region_id),
//           simpleData: {
//             $elemMatch: {
//               region: { $in: [mongoose.Types.ObjectId(region_id)] },
//             },
//           },
//           //"simpleData._id":1,
//         },
//         {
//           "configurableData.region": mongoose.Types.ObjectId(region_id),
//           configurableData: {
//             $elemMatch: {
//               region: { $in: [mongoose.Types.ObjectId(region_id)] },
//             },
//           },
//           //"simpleData._id":1,
//         },
//         {
//           TypeOfProduct: "group",
//         },
//       ],
//     };
//   }
//   if (product_name != null) {
//     var product_name1 = product_name.toLowerCase();
//     DataFilter["product_name"] = { $regex: product_name1, $options: "i" };
//   }
//   if (product_categories != null) {
//     var categories = [mongoose.Types.ObjectId(product_categories)];
//     const catData = await Category.findOne({
//       _id: mongoose.Types.ObjectId(product_categories),
//     }).lean();
//     const data = await Category.find({
//       "ancestors._id": product_categories,
//     }).lean();
//     if (catData && !catData.status) {
//       return res.status(200).json({
//         message: "ok",
//         data: "Category Disabled",
//         count: 0,
//         code: 1,
//       });
//     }
//     data.forEach((item) => {
//       categories.push(mongoose.Types.ObjectId(item._id));
//     });

//     DataFilter["product_categories"] = { $in: categories };
//   }
//   if (variantItem != null) {
//     DataFilter["configurableData.variant_id.variantItem"] = variantItem;
//   }

//   try {
//     let data = await table
//       .aggregate([
//         { $match: DataFilter },
//         { $sort: { priority: 1, product_name: 1 } },
//         {
//           $facet: {
//             count: [{ $count: "count" }],
//             docs: [
//               // For addings category status based checks
//               ...[
//                 {
//                   $lookup: {
//                     from: "categories",
//                     foreignField: "_id",
//                     localField: "product_categories",
//                     as: "product_categories",
//                   },
//                 },
//                 {
//                   $addFields: {
//                     allCategories: {
//                       $function: {
//                         body: function (cats) {
//                           let x = [];
//                           cats.forEach((cat) => {
//                             x.push(cat._id);
//                             cat.ancestors.forEach((ancestor) => {
//                               x.push(ancestor._id);
//                             });
//                           });
//                           return x;
//                         },
//                         args: ["$product_categories"],
//                         lang: "js",
//                       },
//                     },
//                   },
//                 },
//                 {
//                   $lookup: {
//                     from: "categories",
//                     foreignField: "_id",
//                     localField: "allCategories",
//                     as: "allCategories",
//                   },
//                 },
//                 {
//                   $addFields: {
//                     allCategoryStatus: {
//                       $function: {
//                         body: function (cats) {
//                           return cats.filter((cat) => !cat.status).length > 0 ? false : true;
//                         },
//                         args: ["$allCategories"],
//                         lang: "js",
//                       },
//                     },
//                   },
//                 },
//                 { $match: { allCategoryStatus: true } },
//               ],

//               ...(skip ? [{ $skip: skip }] : []),
//               ...(limit ? [{ $limit: limit }] : []),
//               {
//                 $addFields: {
//                   simpleData: {
//                     $ifNull: ["$simpleData", []],
//                   },
//                   configurableData: {
//                     $ifNull: ["$configurableData", []],
//                   },
//                   groupData: {
//                     $ifNull: ["$groupData", []],
//                   },
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
//                                 $eq: ["$region", mongoose.Types.ObjectId(region_id)],
//                               },
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
//                     lostQuantity: { $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0] },
//                     returnQuantity: {
//                       $ifNull: [{ $toDouble: "$inventories.returnQuantity" }, 0],
//                     },
//                     inhouseQuantity: {
//                       $ifNull: [{ $toDouble: "$inventories.inhouseQuantity" }, 0],
//                     },
//                   },
//                 },
//                 {
//                   $addFields: {
//                     outOfStock: {
//                       $cond: [{ $eq: ["$TypeOfProduct", "simple"] }, { $lte: ["$availableQuantity", 0] }, false],
//                     },
//                   },
//                 },
//               ],

//               // For adding ratings and reviews keys
//               ...[
//                 {
//                   $lookup: {
//                     from: "ratingreviews",
//                     let: { product_id: "$_id" },
//                     pipeline: [
//                       { $match: { $expr: { $eq: ["$product_id", "$$product_id"] } } },
//                       {
//                         $group: {
//                           _id: null,
//                           ratingsCount: { $sum: 1 },
//                           ratingsSum: { $sum: "$rating" },
//                           ratingsArray: { $push: "$rating" },
//                           reviewArray: { $push: "$review" },
//                         },
//                       },
//                     ],
//                     as: "ratingreviews",
//                   },
//                 },
//                 { $unwind: { path: "$ratingreviews", preserveNullAndEmptyArrays: true } },
//                 {
//                   $addFields: {
//                     ratings: {
//                       $round: [{ $divide: ["$ratingreviews.ratingsSum", "$ratingreviews.ratingsCount"] }, 1],
//                     },
//                     reviews: {
//                       $filter: {
//                         input: "$ratingreviews.reviewArray",
//                         as: "review",
//                         cond: { $ne: ["$$review", ""] },
//                       },
//                     },
//                     ratingsCount: "$ratingreviews.ratingsCount",
//                   },
//                 },
//                 {
//                   $addFields: {
//                     reviewsCount: {
//                       $cond: { if: { $isArray: "$reviews" }, then: { $size: "$reviews" }, else: 0 },
//                     },
//                   },
//                 },
//               ],

//               // For Populating nested keys inside nested array of objects
//               ...[
//                 // inside simpleData array
//                 ...[
//                   { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
//                   {
//                     $lookup: {
//                       from: "regions",
//                       foreignField: "_id",
//                       localField: "simpleData.region",
//                       as: "simpleData.region",
//                     },
//                   },
//                   { $unwind: { path: "$simpleData.region", preserveNullAndEmptyArrays: true } },
//                   {
//                     $unset: ["simpleData.region.stateData", "simpleData.region.__v", "simpleData.region.created_at"],
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
//                     $addFields: {
//                       "simpleData.package": {
//                         $filter: {
//                           input: "$simpleData.package",
//                           as: "item",
//                           cond: { $eq: ["$$item.status", true] },
//                         },
//                       },
//                       "simpleData.availableQuantity": "$availableQuantity",
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
//                       availableQuantity: { $first: "$availableQuantity" },
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
//                     },
//                   },
//                   {
//                     $addFields: {
//                       simpleData: {
//                         $filter: {
//                           input: "$simpleData",
//                           as: "sd",
//                           cond: { $eq: ["$$sd.region._id", mongoose.Types.ObjectId(region_id)] },
//                         },
//                       },
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
//                     $unwind: { path: "$groupData.sets.package", preserveNullAndEmptyArrays: true },
//                   },

//                   // *************************************************************************************************************
//                   // Starting of code for populating Inner Product of Group Product
//                   // *************************************************************************************************************
//                   {
//                     $lookup: {
//                       from: "products",
//                       let: { product_id: "$groupData.sets.product" },
//                       pipeline: [
//                         { $match: { $expr: { $eq: ["$$product_id", "$_id"] } } },
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
//                                         { $eq: ["$product_id", "$$product_id"] },
//                                         {
//                                           $eq: ["$region", mongoose.Types.ObjectId(region_id)],
//                                         },
//                                       ],
//                                     },
//                                   },
//                                 },
//                                 {
//                                   $group: {
//                                     _id: null,
//                                     productQuantity: { $sum: "$productQuantity" },
//                                     bookingQuantity: { $sum: "$bookingQuantity" },
//                                     availableQuantity: { $sum: "$availableQuantity" },
//                                     lostQuantity: { $sum: "$lostQuantity" },
//                                     returnQuantity: { $sum: "$returnQuantity" },
//                                     inhouseQuantity: { $sum: "$inhouseQuantity" },
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
//                                 $ifNull: [{ $toDouble: "$inventories.productQuantity" }, 0],
//                               },
//                               bookingQuantity: {
//                                 $ifNull: [{ $toDouble: "$inventories.bookingQuantity" }, 0],
//                               },
//                               availableQuantity: {
//                                 $ifNull: [{ $toDouble: "$inventories.availableQuantity" }, 0],
//                               },
//                               lostQuantity: {
//                                 $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0],
//                               },
//                               returnQuantity: {
//                                 $ifNull: [{ $toDouble: "$inventories.returnQuantity" }, 0],
//                               },
//                               inhouseQuantity: {
//                                 $ifNull: [{ $toDouble: "$inventories.inhouseQuantity" }, 0],
//                               },
//                             },
//                           },
//                           {
//                             $addFields: {
//                               outOfStock: {
//                                 $cond: [{ $eq: ["$TypeOfProduct", "simple"] }, { $lte: ["$availableQuantity", 0] }, false],
//                               },
//                             },
//                           },
//                         ],

//                         {
//                           $addFields: {
//                             simpleData: {
//                               $ifNull: ["$simpleData", []],
//                             },
//                             configurableData: {
//                               $ifNull: ["$configurableData", []],
//                             },
//                             groupData: {
//                               $ifNull: ["$groupData", []],
//                             },
//                           },
//                         },

//                         // inside simpleData array
//                         ...[
//                           { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
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
//                               "simpleData.availableQuantity": "$availableQuantity",
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
//                               availableQuantity: { $first: "$availableQuantity" },
//                               productSubscription: { $first: "$productSubscription" },
//                               preOrder: { $first: "$preOrder" },
//                               preOrderQty: { $first: "$preOrderQty" },
//                               preOrderBookQty: { $first: "$preOrderBookQty" },
//                               preOrderRemainQty: { $first: "$preOrderRemainQty" },
//                               preOrderStartDate: { $first: "$preOrderStartDate" },
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
//                               product_categories: { $first: "$product_categories" },
//                             },
//                           },
//                           {
//                             $addFields: {
//                               simpleData: {
//                                 $filter: {
//                                   input: "$simpleData",
//                                   as: "sd",
//                                   cond: {
//                                     $eq: [{ $toString: "$$sd.region" }, { $toString: region_id }],
//                                   },
//                                 },
//                               },
//                             },
//                           },
//                           {
//                             $addFields: {
//                               soldInRegion: {
//                                 $cond: [{ $gt: [{ $size: "$simpleData" }, 0] }, true, false],
//                                 // $size: "$simpleData",
//                               },
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
//                             $unwind: { path: "$unitMeasurement", preserveNullAndEmptyArrays: true },
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
//                             $unwind: { path: "$salesTaxOutSide", preserveNullAndEmptyArrays: true },
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
//                             $unwind: { path: "$salesTaxWithIn", preserveNullAndEmptyArrays: true },
//                           },

//                           {
//                             $lookup: {
//                               from: "taxs",
//                               localField: "purchaseTax",
//                               foreignField: "_id",
//                               as: "purchaseTax",
//                             },
//                           },
//                           { $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true } },
//                         ],
//                       ],
//                       as: "groupData.sets.product",
//                     },
//                   },
//                   {
//                     $unwind: { path: "$groupData.sets.product", preserveNullAndEmptyArrays: true },
//                   },
//                   // *************************************************************************************************************
//                   // Ending of code for populating Inner Product of Group Product
//                   // *************************************************************************************************************
//                   // { $sort: { "groupData.sets.priority": 1, "groupData.sets.product.product_name": 1 } },
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
//                       availableQuantity: { $first: "$availableQuantity" },
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

//               // For populating other small keys
//               ...[
//                 {
//                   $lookup: {
//                     from: "unit_measurements",
//                     localField: "unitMeasurement",
//                     foreignField: "_id",
//                     as: "unitMeasurement",
//                   },
//                 },
//                 { $unwind: { path: "$unitMeasurement", preserveNullAndEmptyArrays: true } },

//                 {
//                   $lookup: {
//                     from: "taxs",
//                     localField: "salesTaxOutSide",
//                     foreignField: "_id",
//                     as: "salesTaxOutSide",
//                   },
//                 },
//                 { $unwind: { path: "$salesTaxOutSide", preserveNullAndEmptyArrays: true } },

//                 {
//                   $lookup: {
//                     from: "taxs",
//                     localField: "salesTaxWithIn",
//                     foreignField: "_id",
//                     as: "salesTaxWithIn",
//                   },
//                 },
//                 { $unwind: { path: "$salesTaxWithIn", preserveNullAndEmptyArrays: true } },

//                 {
//                   $lookup: {
//                     from: "taxs",
//                     localField: "purchaseTax",
//                     foreignField: "_id",
//                     as: "purchaseTax",
//                   },
//                 },
//                 { $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true } },
//               ],

//               // sorting on priority
//               { $sort: { priority: 1, product_name: 1 } },
//             ],
//           },
//         },
//       ])
//       .option({ serializeFunctions: true });
      
//       var result = data[0].docs
//     if(result.length > 0){
//       res.status(200).json({ message: "ok", data: data[0].docs, count: data[0]?.count[0]?.count, code: 1 });
//     }else{
//       res.status(200).json({ message: "ok", data: 'no products found', count: 0, code: 1 });
//     }
    
//   } catch (err) {
//     res.status(500).json({
//       message: "error",
//       data: err,
//       code: 0,
//     });
//   }
// };
module.exports.searchProduct = async function (req, res) {
  let skip = +req.body.skip || 0;
  let limit = +req.body.limit || 0;
  console.log(limit);
  // let limit = 10;
  var region_id = req.body.RegionId;
  var product_name = req.body.product_name;
  var product_categories = req.body.product_categories;
  var variantItem = req.body.variantItem;
  var settings = await settingsModel.findOne({}).lean();
  var categoryData ;
  //var preOrderProduct = settings.preOrder;
  if (region_id == "" || !region_id || region_id == undefined || region_id == null) {
    common.formValidate("Pincode", res);
    return false;
  }

  // console.log(skip, limit);

  var subscribe = req.body.subscribe;
  if (subscribe == true || subscribe == "true") {
    var DataFilter = {
      productSubscription: "yes",
      status: true,
      showstatus: true,
      "ProductRegion.region_id": mongoose.Types.ObjectId(region_id),
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
    };
  } else {
    var DataFilter = {
      status: true,
      showstatus: true,
      "ProductRegion.region_id": mongoose.Types.ObjectId(region_id),
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
    };
  }
  if (product_name != null) {
    var product_name1 = product_name.toLowerCase();
    DataFilter["product_name"] = { $regex: product_name1, $options: "i" };
  }
  if (product_categories != null) {
    var categories = [mongoose.Types.ObjectId(product_categories)];
    const catData = await Category.findOne({
      _id: mongoose.Types.ObjectId(product_categories),
    }).lean();
    const data = await Category.find({
      "ancestors._id": product_categories,
    }).lean();
    if (catData && !catData.status) {
      return res.status(200).json({
        message: "ok",
        data: "Category Disabled",
        count: 0,
        code: 1,
      });
    }
    data.forEach((item) => {
      categories.push(mongoose.Types.ObjectId(item._id));
    });

    DataFilter["product_categories"] = { $in: categories };
  }
  // filter for category page
  if (req.body.categoryName != null) {
    var categories = [];
    const catData = await Category.findOne({
      slug: req.body.categoryName,
    }).lean();
    categoryData = catData
    const data = await Category.find({
      "ancestors.slug": req.body.categoryName,
    }).lean();
    if (catData && !catData.status) {
      return res.status(200).json({
        message: "ok",
        data: "Category Disabled",
        count: 0,
        code: 1,
      });
    }
    categories.push(mongoose.Types.ObjectId(catData?._id))
    req.body.product_categories = catData?._id
    data.forEach((item) => {
      categories.push(mongoose.Types.ObjectId(item._id));
    });

    DataFilter["product_categories"] = { $in: categories };
  }
  if (variantItem != null) {
    DataFilter["configurableData.variant_id.variantItem"] = variantItem;
  }

  try {
    let data = await table
      .aggregate([
        { $match: DataFilter },
        { $sort: { priority: 1, product_name: 1 } },
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

              ...(skip ? [{ $skip: skip }] : []),
              ...(limit ? [{ $limit: limit }] : []),
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
                    lostQuantity: { $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0] },
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
                      { $match: { $expr: { $eq: ["$product_id", "$$product_id"] } } },
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
                { $unwind: { path: "$ratingreviews", preserveNullAndEmptyArrays: true } },
                {
                  $addFields: {
                    ratings: {
                      $round: [{ $divide: ["$ratingreviews.ratingsSum", "$ratingreviews.ratingsCount"] }, 1],
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
                      $cond: { if: { $isArray: "$reviews" }, then: { $size: "$reviews" }, else: 0 },
                    },
                  },
                },
              ],

              // For Populating nested keys inside nested array of objects
              ...[
                // inside simpleData array
                ...[
                  { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
                  {
                    $lookup: {
                      from: "regions",
                      foreignField: "_id",
                      localField: "simpleData.region",
                      as: "simpleData.region",
                    },
                  },
                  { $unwind: { path: "$simpleData.region", preserveNullAndEmptyArrays: true } },
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
                      group_mrp: { $first: "$group_mrp" },
                      slug: { $first: "$slug" },
                      TypeOfProduct: { $first: "$TypeOfProduct" },
                      outOfStock: { $first: "$outOfStock" },
                      availableQuantity: { $first: "$availableQuantity" },
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
                      priority_obj:{$first: "$priority_obj"}

                    },
                  },
                  {
                    $addFields: {
                      simpleData: {
                        $filter: {
                          input: "$simpleData",
                          as: "sd",
                          cond: { $eq: ["$$sd.region._id", mongoose.Types.ObjectId(region_id)] },
                        },
                      },
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
                    $unwind: { path: "$groupData.sets.package", preserveNullAndEmptyArrays: true },
                  },

                  // *************************************************************************************************************
                  // Starting of code for populating Inner Product of Group Product
                  // *************************************************************************************************************
                  {
                    $lookup: {
                      from: "products",
                      let: { product_id: "$groupData.sets.product" },
                      pipeline: [
                        { $match: { $expr: { $eq: ["$$product_id", "$_id"] } } },
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
                          { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
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
                              configurableData: { $first: "$configurableData" },
                              groupData: { $first: "$groupData" },
                              base_price: { $first: "$base_price" },
                              group_mrp: { $first: "$group_mrp" },

                              slug: { $first: "$slug" },
                              TypeOfProduct: { $first: "$TypeOfProduct" },
                              outOfStock: { $first: "$outOfStock" },
                              availableQuantity: { $first: "$availableQuantity" },
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
                              priority_obj:{$first: "$priority_obj"}

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
                            $unwind: { path: "$unitMeasurement", preserveNullAndEmptyArrays: true },
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
                            $unwind: { path: "$salesTaxOutSide", preserveNullAndEmptyArrays: true },
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
                            $unwind: { path: "$salesTaxWithIn", preserveNullAndEmptyArrays: true },
                          },

                          {
                            $lookup: {
                              from: "taxs",
                              localField: "purchaseTax",
                              foreignField: "_id",
                              as: "purchaseTax",
                            },
                          },
                          { $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true } },
                        ],
                      ],
                      as: "groupData.sets.product",
                    },
                  },
                  {
                    $unwind: { path: "$groupData.sets.product", preserveNullAndEmptyArrays: true },
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
                      group_mrp: { $first: "$group_mrp" },
                      slug: { $first: "$slug" },
                      TypeOfProduct: { $first: "$TypeOfProduct" },
                      outOfStock: { $first: "$outOfStock" },
                      availableQuantity: { $first: "$availableQuantity" },
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
                      priority_obj:{$first: "$priority_obj"}
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
                { $unwind: { path: "$unitMeasurement", preserveNullAndEmptyArrays: true } },

                {
                  $lookup: {
                    from: "taxs",
                    localField: "salesTaxOutSide",
                    foreignField: "_id",
                    as: "salesTaxOutSide",
                  },
                },
                { $unwind: { path: "$salesTaxOutSide", preserveNullAndEmptyArrays: true } },

                {
                  $lookup: {
                    from: "taxs",
                    localField: "salesTaxWithIn",
                    foreignField: "_id",
                    as: "salesTaxWithIn",
                  },
                },
                { $unwind: { path: "$salesTaxWithIn", preserveNullAndEmptyArrays: true } },

                {
                  $lookup: {
                    from: "taxs",
                    localField: "purchaseTax",
                    foreignField: "_id",
                    as: "purchaseTax",
                  },
                },
                { $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true } },
              ],

              // sorting on priority
              { $sort: { priority: 1, product_name: 1 } },
            ],
          },
        },
      ])
      .option({ serializeFunctions: true });
      
      var result = data[0].docs
    if(result.length > 0){
      let sortedByPriority = data[0]?.docs.sort((a,b)=> (a.priority_obj?.filter((cur)=>cur.category === String(req.body.product_categories))[0]?.priority || 1000) - (b.priority_obj?.filter((cur)=>cur.category === String(req.body.product_categories))[0]?.priority || 1000))
      res.status(200).json({ message: "ok",categoryData:categoryData, data: sortedByPriority, count: data[0]?.count[0]?.count, code: 1 });
    }else{
      res.status(200).json({ message: "ok", data: 'no products found', count: 0, code: 1 });
    }
    
  } catch (err) {
    console.log(err)
    res.status(500).json({
      message: "error",
      data: err,
      code: 0,
    });
  }
};


module.exports.updateProductStatus = function (req, res) {
  var _id = req.body._id;
  var status = req.body.status;
  var newvalues = {
    status: status,
  };

  if (_id == "" || !_id || _id == undefined || _id == null) {
    common.formValidate("_id", res);
    return false;
  }
  if (status == "" || !status || status == undefined || status == null) {
    common.formValidate("status", res);
    return false;
  }
  table.update({ _id: _id }, { $set: newvalues }, function (err, data) {
    if (err) {
      res.status(500).json({ message: "", data: err });
    } else {
      table.findOne({ _id: _id }).exec(function (err, data) {
        res.status(200).json({
          message: "Product updated!",
          data: data,
          code: 1,
        });
        return;
      });
    }
  });
};

module.exports.updateProductShowStatus = function (req, res) {
  var _id = req.body._id;
  var showstatus = req.body.showstatus;
  var newvalues = {
    showstatus: showstatus,
  };

  if (_id == "" || !_id || _id == undefined || _id == null) {
    common.formValidate("_id", res);
    return false;
  }
  if (showstatus == "" || !showstatus || showstatus == undefined || showstatus == null) {
    common.formValidate("showstatus", res);
    return false;
  }
  table.update({ _id: _id }, { $set: newvalues }, function (err, data) {
    if (err) {
      res.status(500).json({ message: "", data: err });
    } else {
      table.findOne({ _id: _id }).exec(function (err, data) {
        res.status(200).json({
          message: "Product updated!",
          data: data,
          code: 1,
        });
        return;
      });
    }
  });
};

module.exports.updateFarmPickUpStatus = function (req, res) {
  var _id = req.body._id;
  var farmPickup = req.body.farmPickup;
  var newvalues = {
    farmPickup: farmPickup,
  };

  if (_id == "" || !_id || _id == undefined || _id == null) {
    common.formValidate("_id", res);
    return false;
  }
  if (farmPickup == "" || !farmPickup || farmPickup == undefined || farmPickup == null) {
    common.formValidate("farmPickup", res);
    return false;
  }
  table.update({ _id: _id }, { $set: newvalues }, function (err, data) {
    if (err) {
      res.status(500).json({ message: "", data: err });
    } else {
      table.findOne({ _id: _id }).exec(function (err, data) {
        res.status(200).json({
          message: "Product updated!",
          data: data,
          code: 1,
        });
        return;
      });
    }
  });
};

module.exports.updateSameDayDlvryStatus = function (req, res) {
  var _id = req.body._id;
  var sameDayDelivery = req.body.sameDayDelivery;
  var newvalues = {
    sameDayDelivery: sameDayDelivery,
  };

  if (_id == "" || !_id || _id == undefined || _id == null) {
    common.formValidate("_id", res);
    return false;
  }
  if (sameDayDelivery == "" || !sameDayDelivery || sameDayDelivery == undefined || sameDayDelivery == null) {
    common.formValidate("sameDayDelivery", res);
    return false;
  }
  table.update({ _id: _id }, { $set: newvalues }, function (err, data) {
    if (err) {
      res.status(500).json({ message: "", data: err });
    } else {
      table.findOne({ _id: _id }).exec(function (err, data) {
        res.status(200).json({
          message: "Product updated!",
          data: data,
          code: 1,
        });
        return;
      });
    }
  });
};

module.exports.updatealldatabase = async (req, res) => {
  table.find({}, { _id: 1, product_name: 1 }).exec(function (err, data) {
    for (var i = 0; i < data.length; i++) {
      let iData = data[i];
      var slug = common.slugify(iData.product_name);
      table.update(
        {
          _id: iData._id,
        },
        {
          $set: {
            slug: slug,
          },
        },
        function (err, data) {}
      );
    }
  });
};

module.exports.remodelPackages = async (req, res) => {
  try {
    let products = await table.find({ TypeOfProduct: "simple" }).populate("unitMeasurement").lean();
    for (const prod of products) {
      for (const sd of prod.simpleData) {
        if (sd.package.length == 0) {
          let doc = await Packages.create({
            B2B_price: sd.RegionB2BPrice,
            Retail_price: sd.RegionRetailPrice,
            selling_price: sd.RegionSellingPrice,
            packetmrp: sd.mrp,
            packetLabel: `${prod.unitQuantity} ${prod.unitMeasurement.name}`,
            packet_size: prod.unitQuantity,
            status: true,
            product: prod._id,
            region: sd.region,
          });
          console.log("=====......", doc._id, prod.product_name);
        } else {
          for (const pkg of sd.package) {
            // console.log("$$$$$$$$$$$", {
            //   ...pkg,
            //   product: prod._id,
            //   region: sd.region,
            // });
            if (pkg.packetLabel) {
              delete pkg._id;
              // console.log("$$$$$$$$$$$", {
              //   ...pkg,
              //   product: prod._id,
              //   region: sd.region,
              // });
              await Packages.create({
                ...pkg,
                product: prod._id,
                region: sd.region,
              });
            }
          }
        }
      }
    }
    res.status(200).json({ msg: "Done" });
  } catch (err) {
    errorLogger.error(err, "\n", "\n");
    console.log("error ::::::::: ", err);
    res.status(500).json({ msg: "Something went wrong!", err: err });
  }
};

module.exports.remodelPackages2 = async (req, res) => {
  try {
    let packages = await Packages.find({}).lean();
    for (const pkg of packages) {
      let [prod] = await table.find({ _id: pkg.product }).lean();
      prod.simpleData.forEach((sd) => {
        if (sd.region.toString() === pkg.region.toString()) {
          found = false;
          sd.package.forEach((sd_pkg, i, theArray) => {
            if (pkg.packet_size === sd_pkg.packet_size) {
              console.log(sd_pkg);
              theArray[i] = pkg._id;
              console.log(sd_pkg);
              found = true;
            }
          });
          if (!found) {
            console.log("not found !!!!!!!!!", prod.product_name);
            let filtered = sd.package.filter((item) => item.toString() === pkg._id.toString());
            console.log("=======", filtered, pkg._id);
            if (filtered.length == 0) {
              sd.package.push(pkg._id);
              console.log(sd.package);
            }
          }
        }
      });
      // console.log("product simpleData new ::::::::: ", JSON.stringify(prod.simpleData));
      delete prod._id;
      await table.updateOne({ _id: pkg.product }, { $set: prod });
    }
    res.status(200).json({ msg: "Done" });
  } catch (err) {
    errorLogger.error(err, "\n", "\n");
    console.log("error ::::::::: ", err);
    res.status(500).json({ msg: "Something went wrong!", err: err });
  }
};

module.exports.remodelPackages3 = async (req, res) => {
  try {
    let products = await table.find({ TypeOfProduct: "group" }).lean();
    for (const product of products) {
      for (const gd of product.groupData) {
        for (const prod of gd.sets) {
          if (prod.package && prod.package.packetLabel && prod.package.regionID) {
            let [pkg] = await Packages.find({
              product: prod.product,
              region: prod.package.regionID,
              packet_size: prod.package.packet_size,
            }).lean();
            if (pkg) {
              prod.package = pkg._id;
            } else {
              prod.package = null;
            }
          } else if (!prod.package) {
            prod.package = null;
          }
        }
      }
      await table.updateOne({ _id: product._id }, { $set: product });
    }
    res.status(200).json({ msg: "Done" });
  } catch (err) {
    errorLogger.error(err, "\n", "\n");
    console.log("error ::::::::: ", err);
    res.status(500).json({ msg: "Something went wrong!", err: err });
  }
};

module.exports.correction = async (req, res) => {
  try {
    // let count = 0;
    // let productArray = [];
    // let packageArray = [];
    // let products = await table.find({ TypeOfProduct: "group" }).populate("groupData.sets.product").lean();
    // for (const product of products) {
    //   for (const gd of product.groupData) {
    //     for (const prod of gd.sets) {
    //       if (!prod.product) {
    //         productArray.push(`${product.product_name} ::::: ${gd.name}`);
    //       } else if (!prod.package) {
    //         packageArray.push(`${product.product_name} ::::: ${gd.name} :::::: ${prod.product.product_name}`);
    //       }
    //     }
    //   }
    //   // await table.updateOne({ _id: product._id }, { $set: product });
    // }
    // res.status(200).json({
    //   msg: "Done",
    //   count,
    //   productArray,
    //   packageArray,
    //   productCount: productArray.length,
    //   packageCount: packageArray.length,
    // });

    let count = 0;
    let productArray = [];
    let products = await table.find({ TypeOfProduct: "simple" }).lean();
    for (const prod of products) {
      // if (prod.product_name !== "Peashoot Microgreen") {
      //   continue;
      // }
      for (const sd of prod.simpleData) {
        let newPackage = [];
        for (const pkg of sd.package) {
          if (!newPackage.includes(pkg.toString())) {
            newPackage.push(pkg.toString());
          }
        }
        console.log(newPackage);
        await table.updateMany({ _id: prod._id, "simpleData.region": sd.region }, { $set: { "simpleData.$.package": newPackage } });
      }
    }
    res.status(200).json({
      msg: "Done",
    });
  } catch (err) {
    errorLogger.error(err, "\n", "\n");
    console.log("error ::::::::: ", err);
    res.status(500).json({ msg: "Something went wrong!", err: err });
  }
};

module.exports.getPackageObj = async (req, res) => {
  try {
    // let count = 0;
    // let productArray = [];
    // let packageArray = [];

    let arr = req.body.str.split(" ::::: ");
    let product = arr[0];
    let set = arr[1];
    let inner_product = arr[2];

    let data = await table.findOne({ TypeOfProduct: "group", product_name: product }).populate("groupData.sets.product").lean();

    for (const gd of data.groupData) {
      if (gd.name == set) {
        for (const prod of gd.sets) {
          if (prod.product.product_name == inner_product) {
            let pkgg = prod.package;
            delete pkgg._id;
            pkgg.region = pkgg.regionID;
            delete pkgg.regionID;
            return res.status(200).json({
              msg: "found",
              package: { ...pkgg, product: prod.product._id },
              product_id: prod.product._id,
            });
          }
        }
      }
      // await table.updateOne({ _id: product._id }, { $set: product });
    }
    return res.status(200).json({
      msg: "not found",
    });
  } catch (err) {
    errorLogger.error(err, "\n", "\n");
    console.log("error ::::::::: ", err);
    res.status(500).json({ msg: "Something went wrong!", err: err });
  }
};

module.exports.createOrGetPackage = async (req, res) => {
  try {
    let package = req.body.package;
    package.product = mongoose.Types.ObjectId(package.product);

    let foundPackage = await Packages.findOne({
      product: package.product,
      region: package.region,
      packet_size: package.packet_size,
    }).lean();

    if (foundPackage) {
      return res.status(200).json({
        msg: "found",
        package_id: foundPackage._id,
        product_id: package.product,
      });
    } else {
      let pkg = new Packages({ ...package, status: false });
      await pkg.save();
      return res.status(200).json({
        msg: "not found",
        package_id: pkg._id,
        product_id: package.product,
      });
    }

    // let count = 0;
    // let productArray = [];
    // let packageArray = [];

    // let arr = req.body.str.split(" ::::: ");
    // let product = arr[0];
    // let set = arr[1];
    // let inner_product = arr[2];

    // let data = await table
    //   .findOne({ TypeOfProduct: "group", product_name: product })
    //   .populate("groupData.sets.product")
    //   .lean();

    // for (const gd of data.groupData) {
    //   if (gd.name == set) {
    //     for (const prod of gd.sets) {
    //       if (prod.product.product_name == inner_product) {
    //         return res.status(200).json({
    //           msg: "found",
    //           package: prod.package,
    //           product_id: prod.product._id,
    //         });
    //       }
    //     }
    //   }
    //   // await table.updateOne({ _id: product._id }, { $set: product });
    // }
    // return res.status(200).json({
    //   msg: "not found",
    // });
  } catch (err) {
    errorLogger.error(err, "\n", "\n");
    console.log("error ::::::::: ", err);
    res.status(500).json({ msg: "Something went wrong!", err: err });
  }
};

// module.exports.qtycorrectionPI = async (req, res) => {
//   // InventoryTable
//   // table
//   try {
//     let proData = await table.aggregate([
//       { $match: { TypeOfProduct: { $in: ["simple", "configurable"] } } },
//       {
//         $project: {
//           TypeOfProduct: 1,
//           product_name: 1,
//           productQuantity: 1,
//           AvailableQuantity: 1,
//           BookingQuantity: 1,
//           lostQuantity: 1,
//           returnQuantity: 1,
//           inhouseQuantity: 1,
//           simpleData: 1,
//           configurableData: 1,
//         },
//       },
//     ]);

//     let wrongProducts = [];
//     //let i = 0;
//     for (const prod of proData) {
//       // i++;
//       // if(i > 10){
//       //   break;
//       // }
//       let inevdata = await InventoryTable.aggregate([
//         { $match: { "productData.product_id": prod._id } },
//         { $project: { billNo: 1, InvoiceNumber: 1, productData: 1, created_at: 1 } },
//         { $unwind: "$productData" },
//         { $unwind: { path: "$productData.configurableData", preserveNullAndEmptyArrays: true } },
//         { $unwind: { path: "$productData.simpleData", preserveNullAndEmptyArrays: true } },
//         { $match: { "productData.product_id": prod._id } },
//         {
//           $facet: {
//             simple: [
//               {
//                 $group: {
//                   _id: "$productData.simpleData.region",
//                   totalPQ: { $sum: "$productData.simpleData.quantity" },
//                   totalAQ: { $sum: "$productData.simpleData.availQuantity" },
//                   totalBQ: { $sum: "$productData.simpleData.bookingQuantity" },
//                   totalLQ: { $sum: "$productData.simpleData.lostQuantity" },
//                   totalRQ: { $sum: "$productData.simpleData.returnQuantity" },
//                   totalIQ: { $sum: "$productData.simpleData.inhouseQuantity" },
//                 },
//               },
//             ],
//             config: [
//               {
//                 $group: {
//                   _id: "$productData.configurableData.region",
//                   totalPQ: { $sum: "$productData.configurableData.quantity" },
//                   totalAQ: { $sum: "$productData.configurableData.availQuantity" },
//                   totalBQ: { $sum: "$productData.configurableData.bookingQuantity" },
//                   totalLQ: { $sum: "$productData.configurableData.lostQuantity" },
//                   totalRQ: { $sum: "$productData.configurableData.returnQuantity" },
//                   totalIQ: { $sum: "$productData.configurableData.inhouseQuantity" },
//                 },
//               },
//             ],
//           },
//         },
//         {
//           $project: {
//             simple: {
//               $filter: {
//                 input: "$simple",
//                 as: "sdata",
//                 cond: { $ne: ["$$sdata._id", null] },
//               },
//             },
//             config: {
//               $filter: {
//                 input: "$config",
//                 as: "cdata",
//                 cond: { $ne: ["$$cdata._id", null] },
//               },
//             },
//           },
//         },
//       ]);

//       // errros
//       let regionDataMisMatchBwInventoryAndProduct = false;
//       let productInsideAndOutsideRegionMismatch = false;

//       let insidePQ = Decimal(0),
//         insideAQ = Decimal(0),
//         insideBQ = Decimal(0),
//         insideLQ = Decimal(0),
//         insideRQ = Decimal(0),
//         insideIQ = Decimal(0);

//       let inventoryArray = prod.TypeOfProduct == "simple" ? inevdata[0].simple : inevdata[0].config;
//       let productArray = prod.TypeOfProduct == "simple" ? prod.simpleData : prod.configurableData;

//       for (const item2 of productArray) {
//         insidePQ = insidePQ.plus(Decimal(+item2.quantity));
//         insideAQ = insideAQ.plus(Decimal(+item2.availQuantity));
//         insideBQ = insideBQ.plus(Decimal(+item2.bookingQuantity));
//         insideLQ = insideLQ.plus(Decimal(+item2.lostQuantity));
//         insideRQ = insideRQ.plus(Decimal(+item2.returnQuantity));
//         insideIQ = insideIQ.plus(Decimal(+item2.inhouseQuantity));

//         for (const item1 of inventoryArray) {
//           if (String(item1._id) === String(item2.region)) {
//             if (
//               Number(item1.totalPQ) != Number(item2.quantity) ||
//               Number(item1.totalAQ) != Number(item2.availQuantity) ||
//               Number(item1.totalBQ) != Number(item2.bookingQuantity) ||
//               Number(item1.totalLQ) != Number(item2.lostQuantity) ||
//               Number(item1.totalRQ) != Number(item2.returnQuantity) ||
//               Number(item1.totalIQ) != Number(item2.inhouseQuantity)
//             ) {
//               regionDataMisMatchBwInventoryAndProduct = true;
//             }
//           }
//         }
//       }

//       if (
//         Number(insidePQ) != Number(prod.productQuantity) ||
//         Number(insideAQ) != Number(prod.AvailableQuantity) ||
//         Number(insideBQ) != Number(prod.BookingQuantity) ||
//         Number(insideLQ) != Number(prod.lostQuantity) ||
//         Number(insideRQ) != Number(prod.returnQuantity) ||
//         Number(insideIQ) != Number(prod.inhouseQuantity)
//       ) {
//         productInsideAndOutsideRegionMismatch = true;
//         console.log(prod.product_name, "*******************************************************************");
//         console.log(insidePQ, prod.productQuantity);
//         console.log(insideAQ, prod.AvailableQuantity);
//         console.log(insideBQ, prod.BookingQuantity);
//         console.log(insideLQ, prod.lostQuantity);
//         console.log(insideRQ, prod.returnQuantity);
//         console.log(insideIQ, prod.inhouseQuantity);
//       }
//       if (regionDataMisMatchBwInventoryAndProduct || productInsideAndOutsideRegionMismatch) {
//         wrongProducts.push({
//           regionDataMisMatchBwInventoryAndProduct,
//           productInsideAndOutsideRegionMismatch,
//           name: prod.product_name,
//           _id: prod._id,
//         });
//       }
//     }

//     // return res.status(200).json({inevdata})
//     return res.status(200).json({ wrongProducts, count: wrongProducts.length });
//   } catch (err) {
//     console.log(err);
//   }
// };

module.exports.qtycorrectionPI = async (req, res) => {
  try {
    let proData = await table.aggregate([
      { $match: { TypeOfProduct: { $in: ["simple", "configurable"] } } },
      {
        $project: {
          TypeOfProduct: 1,
          product_name: 1,
          productQuantity: 1,
          AvailableQuantity: 1,
          BookingQuantity: 1,
          lostQuantity: 1,
          returnQuantity: 1,
          inhouseQuantity: 1,
          simpleData: 1,
          configurableData: 1,
        },
      },
    ]);

    let wrongProducts = [];

    // for (const prod of proData) {
    //   if (prod.TypeOfProduct == "simple") {
    //     await table.updateMany(
    //       { product_name: prod.product_name },
    //       {
    //         $set: {
    //           "simpleData.0.quantity": prod.productQuantity,
    //           "simpleData.0.availableQuantity": prod.AvailableQuantity,
    //           "simpleData.0.bookingQuantity": prod.BookingQuantity,
    //           "simpleData.0.lostQuantity": prod.lostQuantity,
    //           "simpleData.0.returnQuantity": prod.returnQuantity,
    //           "simpleData.0.inhouseQuantity": prod.inhouseQuantity,
    //         },
    //       }
    //     );
    //   }
    // }

    for (const prod of proData) {
      // if (prod.product_name !== "Berry Kombucha - Strawberry, Gooseberry and Mulberry - 200ml") {
      //   continue;
      // }

      // errros
      let productInsideAndOutsideRegionMismatch = false;
      let regionDataMisMatchBwInventoryAndProduct = false;
      let regionDataMisMatchBwBookingAndProduct = false;

      {
        // for error ::::: productInsideAndOutsideRegionMismatch
        let insidePQ = Decimal(0),
          insideAQ = Decimal(0),
          insideBQ = Decimal(0),
          insideLQ = Decimal(0),
          insideRQ = Decimal(0),
          insideIQ = Decimal(0);

        let productArray = prod.TypeOfProduct == "simple" ? prod.simpleData : prod.configurableData;
        for (const item of productArray) {
          insidePQ = insidePQ.plus(Decimal(+item.quantity));
          insideAQ = insideAQ.plus(Decimal(+item.availQuantity));
          insideBQ = insideBQ.plus(Decimal(+item.bookingQuantity));
          insideLQ = insideLQ.plus(Decimal(+item.lostQuantity));
          insideRQ = insideRQ.plus(Decimal(+item.returnQuantity));
          insideIQ = insideIQ.plus(Decimal(+item.inhouseQuantity));
        }

        if (
          Number(insidePQ) != Number(prod.productQuantity) ||
          Number(insideAQ) != Number(prod.AvailableQuantity) ||
          Number(insideBQ) != Number(prod.BookingQuantity) ||
          Number(insideLQ) != Number(prod.lostQuantity) ||
          Number(insideRQ) != Number(prod.returnQuantity) ||
          Number(insideIQ) != Number(prod.inhouseQuantity)
        ) {
          productInsideAndOutsideRegionMismatch = true;
        }
      }

      let inventoryData;
      {
        // for error ::::: regionDataMisMatchBwInventoryAndProduct
        let inevdata = await InventoryTable.aggregate([
          { $match: { "productData.product_id": prod._id } },
          {
            $project: {
              billNo: 1,
              InvoiceNumber: 1,
              productData: 1,
              created_at: 1,
            },
          },
          { $unwind: "$productData" },
          {
            $unwind: {
              path: "$productData.configurableData",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $unwind: {
              path: "$productData.simpleData",
              preserveNullAndEmptyArrays: true,
            },
          },
          { $match: { "productData.product_id": prod._id } },
          {
            $facet: {
              simple: [
                {
                  $group: {
                    _id: "$productData.simpleData.region",
                    totalPQ: { $sum: "$productData.simpleData.quantity" },
                    totalAQ: { $sum: "$productData.simpleData.availQuantity" },
                    totalBQ: {
                      $sum: "$productData.simpleData.bookingQuantity",
                    },
                    totalLQ: { $sum: "$productData.simpleData.lostQuantity" },
                    totalRQ: { $sum: "$productData.simpleData.returnQuantity" },
                    totalIQ: {
                      $sum: "$productData.simpleData.inhouseQuantity",
                    },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    region: "$_id",
                    totalPQ: 1,
                    totalAQ: 1,
                    totalBQ: 1,
                    totalLQ: 1,
                    totalRQ: 1,
                    totalIQ: 1,
                  },
                },
              ],
              config: [
                {
                  $group: {
                    _id: "$productData.configurableData.region",
                    totalPQ: { $sum: "$productData.configurableData.quantity" },
                    totalAQ: {
                      $sum: "$productData.configurableData.availQuantity",
                    },
                    totalBQ: {
                      $sum: "$productData.configurableData.bookingQuantity",
                    },
                    totalLQ: {
                      $sum: "$productData.configurableData.lostQuantity",
                    },
                    totalRQ: {
                      $sum: "$productData.configurableData.returnQuantity",
                    },
                    totalIQ: {
                      $sum: "$productData.configurableData.inhouseQuantity",
                    },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    region: "$_id",
                    totalPQ: 1,
                    totalAQ: 1,
                    totalBQ: 1,
                    totalLQ: 1,
                    totalRQ: 1,
                    totalIQ: 1,
                  },
                },
              ],
            },
          },
          {
            $project: {
              simple: {
                $filter: {
                  input: "$simple",
                  as: "sdata",
                  cond: { $ne: ["$$sdata.region", null] },
                },
              },
              config: {
                $filter: {
                  input: "$config",
                  as: "cdata",
                  cond: { $ne: ["$$cdata.region", null] },
                },
              },
            },
          },
        ]);

        inventoryData = inevdata[0];

        let inventoryArray = prod.TypeOfProduct == "simple" ? inventoryData.simple : inventoryData.config;
        let productArray = prod.TypeOfProduct == "simple" ? prod.simpleData : prod.configurableData;

        for (const item1 of inventoryArray) {
          for (const item2 of productArray) {
            if (String(item1.region) === String(item2.region)) {
              if (
                Number(item1.totalPQ) != Number(item2.quantity) ||
                Number(item1.totalAQ) != Number(item2.availQuantity) ||
                Number(item1.totalBQ) != Number(item2.bookingQuantity) ||
                Number(item1.totalLQ) != Number(item2.lostQuantity) ||
                Number(item1.totalRQ) != Number(item2.returnQuantity) ||
                Number(item1.totalIQ) != Number(item2.inhouseQuantity)
              ) {
                regionDataMisMatchBwInventoryAndProduct = true;
              }
            }
          }
        }
      }

      let bookingData, sum;
      {
        // for error ::::: regionDataMisMatchBwBookingAndProduct
        let ordersData = await BookingTable.aggregate([
          {
            $match: {
              $and: [
                {
                  $or: [
                    { "bookingdetail.product_id._id": prod._id },
                    {
                      "bookingdetail.groupData.sets.product._id": prod._id.toString(),
                    },
                  ],
                },
                { qtyReduce: true },
              ],
            },
          },
          { $project: { booking_code: 1, bookingdetail: 1, regionID: 1 } },
          { $unwind: "$bookingdetail" },
          {
            $match: {
              $or: [
                { "bookingdetail.product_id._id": prod._id },
                {
                  "bookingdetail.groupData.sets.product._id": prod._id.toString(),
                },
              ],
            },
          },

          {
            $facet: {
              simple: [
                {
                  $match: {
                    "bookingdetail.TypeOfProduct": "simple",
                    "bookingdetail.product_id._id": prod._id,
                  },
                },
                {
                  $project: {
                    booking_code: 1,
                    regionID: 1,
                    qty: {
                      $cond: [
                        { $eq: ["$bookingdetail.without_package", true] },
                        {
                          $multiply: [{ $toDecimal: "$bookingdetail.qty" }, { $toDecimal: "$bookingdetail.unitQuantity" }],
                        },
                        {
                          $multiply: [{ $toDecimal: "$bookingdetail.qty" }, { $toDecimal: "$bookingdetail.packet_size" }],
                        },
                      ],
                    },
                  },
                },
                {
                  $group: {
                    _id: "$regionID",
                    totalSoldQty: { $sum: "$qty" },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    region: "$_id",
                    totalSoldQty: 1,
                  },
                },
              ],
              config: [
                {
                  $match: {
                    "bookingdetail.TypeOfProduct": "configurable",
                    "bookingdetail.product_id._id": prod._id,
                  },
                },
                {
                  $project: {
                    booking_code: 1,
                    regionID: 1,
                    qty: {
                      $multiply: [{ $toDecimal: "$bookingdetail.qty" }, { $toDecimal: "$bookingdetail.unitQuantity" }],
                    },
                  },
                },
                {
                  $group: {
                    _id: "$regionID",
                    totalSoldQty: { $sum: "$qty" },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    region: "$_id",
                    totalSoldQty: 1,
                  },
                },
              ],
              group: [
                {
                  $match: {
                    "bookingdetail.TypeOfProduct": "group",
                    "bookingdetail.groupData.sets.product._id": prod._id.toString(),
                  },
                },
                { $unwind: "$bookingdetail.groupData" },
                { $unwind: "$bookingdetail.groupData.sets" },
                {
                  $match: {
                    "bookingdetail.groupData.sets.product._id": prod._id.toString(),
                  },
                },
                {
                  $project: {
                    booking_code: 1,
                    regionID: 1,
                    qty: {
                      $cond: [
                        {
                          $eq: ["$bookingdetail.groupData.sets.without_package", true],
                        },
                        {
                          $multiply: [
                            { $toDecimal: "$bookingdetail.qty" },
                            { $toDecimal: "$bookingdetail.groupData.sets.qty" },
                            {
                              $toDecimal: "$bookingdetail.groupData.sets.unitQuantity",
                            },
                          ],
                        },
                        {
                          $multiply: [
                            { $toDecimal: "$bookingdetail.qty" },
                            { $toDecimal: "$bookingdetail.groupData.sets.qty" },
                            {
                              $toDecimal: "$bookingdetail.groupData.sets.package.packet_size",
                            },
                          ],
                        },
                      ],
                    },
                  },
                },
                {
                  $group: {
                    _id: "$regionID",
                    totalSoldQty: { $sum: "$qty" },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    region: "$_id",
                    totalSoldQty: 1,
                  },
                },
              ],
            },
          },

          {
            $project: {
              simple: {
                $filter: {
                  input: "$simple",
                  as: "sdata",
                  cond: { $ne: ["$$sdata.totalSoldQty", 0] },
                },
              },
              config: {
                $filter: {
                  input: "$config",
                  as: "cdata",
                  cond: { $ne: ["$$cdata.totalSoldQty", 0] },
                },
              },
              group: {
                $filter: {
                  input: "$group",
                  as: "gdata",
                  cond: { $ne: ["$$gdata.totalSoldQty", 0] },
                },
              },
            },
          },
        ]);

        bookingData = ordersData[0];

        // sum = 0;
        // for (const d of ordersData) {
        //   sum++;
        //   // console.log(
        //   //   typeof d.bookingdetail.TypeOfProduct,
        //   //   typeof d.bookingdetail.without_package,
        //   //   typeof d.bookingdetail.qty,
        //   //   typeof d.bookingdetail.unitQuantity,
        //   //   typeof d.bookingdetail.packet_size
        //   // );
        //   // console.log(
        //   //   d.bookingdetail.TypeOfProduct,
        //   //   d.bookingdetail.without_package,
        //   //   d.bookingdetail.qty,
        //   //   d.bookingdetail.unitQuantity,
        //   //   d.bookingdetail.packet_size
        //   // );
        //   // if (d.bookingdetail.TypeOfProduct == "simple") {
        //   //   sum =
        //   //     sum +
        //   //     (d.bookingdetail.without_package
        //   //       ? d.bookingdetail.qty * d.bookingdetail.unitQuantity
        //   //       : d.bookingdetail.qty * d.bookingdetail.packet_size);
        //   // }
        // }

        // console.log("sum :::::::::::::; ", sum);

        let bookingArray = prod.TypeOfProduct == "simple" ? bookingData.simple : bookingData.config;
        let productArray = prod.TypeOfProduct == "simple" ? prod.simpleData : prod.configurableData;

        let tempArray = [...bookingArray, ...bookingData.group];

        let bookingQtyInRegion = Decimal(0);
        for (const item of tempArray) {
          bookingQtyInRegion = bookingQtyInRegion.plus(Decimal(+item.totalSoldQty));
        }
        let difference = bookingQtyInRegion.minus(Decimal(+prod.BookingQuantity));
        if (Number(difference)) {
          console.log("------", difference, typeof difference, prod.product_name);
          regionDataMisMatchBwBookingAndProduct = true;
        }
        if (Number(difference) && Number(difference) < 0) {
          let pq, aq, bq, lq, rq, iq;
          pq = Decimal(+prod.productQuantity);
          aq = Decimal(+prod.AvailableQuantity);
          bq = Decimal(+bookingQtyInRegion);
          lq = Decimal(+prod.lostQuantity).minus(Decimal(Number(difference)));
          rq = Decimal(+prod.returnQuantity);
          iq = Decimal(+prod.inhouseQuantity);

          console.log(pq, aq, bq, lq, rq, iq);

          // await table.updateMany(
          //   { product_name: prod.product_name },
          //   {
          //     $set: {
          //       productQuantity: pq,
          //       AvailableQuantity: aq,
          //       BookingQuantity: bq,
          //       lostQuantity: lq,
          //       returnQuantity: rq,
          //       inhouseQuantity: iq,
          //     },
          //   }
          // );
        }
        if (Number(difference) && Number(difference) > 0) {
          let pq, aq, bq, lq, rq, iq;
          pq = Decimal(+prod.productQuantity);
          aq = Decimal(+prod.AvailableQuantity);
          bq = Decimal(+bookingQtyInRegion);
          lq = Decimal(+prod.lostQuantity).minus(Decimal(Number(difference)));
          rq = Decimal(+prod.returnQuantity);
          iq = Decimal(+prod.inhouseQuantity);

          console.log(pq, aq, bq, lq, rq, iq);

          // await table.updateMany(
          //   { product_name: prod.product_name },
          //   {
          //     $set: {
          //       productQuantity: pq,
          //       AvailableQuantity: aq,
          //       BookingQuantity: bq,
          //       lostQuantity: lq,
          //       returnQuantity: rq,
          //       inhouseQuantity: iq,
          //     },
          //   }
          // );
        }

        // for (const item1 of productArray) {
        //   let bookingQtyInRegion = Decimal(0);
        //   for (const item2 of tempArray) {
        //     if (item1.region.toString() == item2.region.toString()) {
        //       bookingQtyInRegion = bookingQtyInRegion.plus(Decimal(+item2.totalSoldQty));
        //     }
        //   }
        //   if (Number(item1.bookingQuantity) !== Number(bookingQtyInRegion)) {
        //     regionDataMisMatchBwBookingAndProduct = true;

        //     let difference = bookingQtyInRegion.minus(item1.BookingQuantity);
        //     if(difference && difference < 0){
        //       let pq, aq, bq, lq, rq, iq;
        //       pq = Decimal(item1.quantity);
        //       aq = Decimal(bookingQtyInRegion);
        //       bq = Decimal(bookingQtyInRegion);

        //     }
        //   }
        // }
      }

      // wrongProducts.push({
      //   name: prod.product_name,
      //   _id: prod._id,
      //   productInsideAndOutsideRegionMismatch,
      //   regionDataMisMatchBwInventoryAndProduct,
      //   regionDataMisMatchBwBookingAndProduct,
      //   inventoryQtySum: inventoryData,
      //   bookingQtySum: bookingData,
      //   sum,
      // });

      if (productInsideAndOutsideRegionMismatch || regionDataMisMatchBwInventoryAndProduct || regionDataMisMatchBwBookingAndProduct) {
        wrongProducts.push({
          name: prod.product_name,
          _id: prod._id,
          productInsideAndOutsideRegionMismatch,
          regionDataMisMatchBwInventoryAndProduct,
          regionDataMisMatchBwBookingAndProduct,
          inventoryQtySum: inventoryData,
          bookingQtySum: bookingData,
        });
      }
    }

    // return res.status(200).json({inevdata})
    return res.status(200).json({ wrongProducts, count: wrongProducts.length });
  } catch (err) {
    console.log(err);
  }
};

// Product bulk import/export using excel sheets
// import
module.exports.importXls = function (req, res) {
  upload(req, res, function (err) {
    var JsonFile = req.files.filter((i) => i.fieldname === "sheet").map((i) => i.filename);
    //xlsxFile('./public/upload/'+JsonFile).then((rows) => {
    // rows.forEach((obj) => {
    // 	//console.log(obj)
    // })

    var doc = parser.parseXls2Json("./public/upload/" + JsonFile);
    var JsonData = doc[0];
    var InsertData = [];

    // console.log("bbbbb", JsonData);
    // return;

    let promiseArr = [];
    for (const prod of JsonData) {
      let p = new Promise(async (resolve, reject) => {
        try {
          if (
            !prod._id ||
            !prod.unitMeasurement ||
            !prod.ProductRegion ||
            !prod.salesTaxOutSide ||
            !prod.salesTaxWithIn ||
            !prod.purchaseTax ||
            !prod.product_categories
          ) {
            reject(`required field absent, cannot modify ${prod.product_name}`);
          } else {
            let temp = {};
            for (const key in prod) {
              if (["created_at", "preOrderStartDate", "preOrderEndDate"].includes(key)) {
                temp[key] = prod[key] ? new Date(moment(prod[key], "MMMM Do YYYY, h:mm:ss a")) : null;
              } else if (key == "ProductRegion") {
                temp[key] = [];
                let arr = prod.ProductRegion.split(",\n");
                for (const el of arr) {
                  let doc = await RegionTable.aggregate([{ $match: { name: el } }, { $project: { name: 1 } }]);
                  // console.log("%%%%%%", doc);
                  if (doc.length > 0 && doc[0]._id) {
                    temp[key].push({ region_id: doc[0]._id });
                  } else {
                    reject(`No region found with name ${el}, cannot modify ${prod.product_name}`);
                  }
                }
              } else if (key == "barcode") {
                temp[key] = [];
                prod.barcode.split(",\n").forEach((el) => {
                  if (el) {
                    temp[key].push(el);
                  }
                });
              } else if (["farmPickup", "sameDayDelivery"].includes(key)) {
                temp[key] = prod[key] == "false" || prod[key] == "true" ? JSON.parse(prod[key]) : prod[key];
              } else if (key == "admin_id") {
                temp[key] = prod[key].name || null;
              } else if (key == "priority") {
                temp[key] = prod[key] == "unset" ? Infinity : prod[key];
              } else if (key == "banner") {
                temp[key] = prod[key].split("https://kc.storehey.com:3003/upload/")[1];
              } else if (key == "attachment") {
                temp[key] = prod[key].split("https://kc.storehey.com:3003/upload/")[1];
              } else if (key == "images") {
                temp[key] = [];
                prod.images.split(",\n").forEach((el) => {
                  temp[key].push({ image: el.split("https://kc.storehey.com:3003/upload/")[1] });
                });
                // console.log(temp);
              } else if (key == "salesTaxOutSide") {
                if (prod[key]) {
                  let doc = await TaxTable.aggregate([{ $match: { name: prod[key] } }, { $project: { name: 1 } }]);
                  // console.log("%%%%%%", doc);
                  if (doc.length > 0 && doc[0]._id) {
                    temp[key] = doc[0]._id;
                  } else {
                    reject(`No salesTaxOutSide found with name ${el}, cannot modify ${prod.product_name}`);
                  }
                } else {
                  // no salesTaxOutSide
                }
              } else if (key == "salesTaxWithIn") {
                if (prod[key]) {
                  let doc = await TaxTable.aggregate([{ $match: { name: prod[key] } }, { $project: { name: 1 } }]);
                  // console.log("%%%%%%", doc);
                  if (doc.length > 0 && doc[0]._id) {
                    temp[key] = doc[0]._id;
                  } else {
                    reject(`No salesTaxWithIn found with name ${el}, cannot modify ${prod.product_name}`);
                  }
                } else {
                  // no salesTaxWithIn
                }
              } else if (key == "purchaseTax") {
                if (prod[key]) {
                  let doc = await TaxTable.aggregate([{ $match: { name: prod[key] } }, { $project: { name: 1 } }]);
                  // console.log("%%%%%%", doc);
                  if (doc.length > 0 && doc[0]._id) {
                    temp[key] = doc[0]._id;
                  } else {
                    reject(`No purchaseTax found with name ${el}, cannot modify ${prod.product_name}`);
                  }
                } else {
                  // no purchaseTax
                }
              } else if (key == "unitMeasurement") {
                if (prod[key]) {
                  let doc = await UnitTable.aggregate([{ $match: { name: prod[key] } }, { $project: { name: 1 } }]);
                  // console.log("%%%%%%", doc);
                  if (doc.length > 0 && doc[0]._id) {
                    temp[key] = doc[0]._id;
                  } else {
                    reject(`No unitMeasurement found with name ${el}, cannot modify ${prod.product_name}`);
                  }
                } else {
                  // no unitMeasurement
                }
              } else if (key == "product_categories") {
                temp[key] = [];
                let arr = prod.product_categories.split(",\n");
                for (const el of arr) {
                  let doc = await Category.aggregate([{ $match: { category_name: el } }, { $project: { category_name: 1 } }]);
                  // console.log("%%%%%%", doc);
                  if (doc.length > 0 && doc[0]._id) {
                    temp[key].push(doc[0]._id);
                  } else {
                    reject(`No product_categories found with name ${el}, cannot modify ${prod.product_name}`);
                  }
                }
              } else if (key == "relatedProduct") {
                temp[key] = [];
                let arr = prod.relatedProduct.split(",\n");
                for (const el of arr) {
                  let doc = await table.aggregate([{ $match: { product_name: el } }, { $project: { product_name: 1 } }]);
                  // console.log("%%%%%%", doc);
                  if (doc.length > 0 && doc[0]._id) {
                    temp[key].push({ product_id: doc[0]._id });
                  } else {
                    reject(`No related product found with name ${el}, cannot modify ${prod.product_name}`);
                  }
                }
              } else if (
                [
                  "configurableData",
                  "groupData",
                  "simpleData",
                  "preOrderQty",
                  "preOrderBookQty",
                  "preOrderRemainQty",
                  "reviews",
                  "attribute_group",
                  "relatedRecipes",
                  "outOfStock",
                  "ratings",
                  "ratingsCount",
                  "reviewsCount",
                ].includes(key)
              ) {
                // do nothing
                // console.log("skipped key ::: ", key);
              } else {
                temp[key] = prod[key] == "false" || prod[key] == "true" ? JSON.parse(prod[key]) : prod[key];
              }
            }

            // console.log("========", temp);

            // update the row
            let updated = await table.updateOne({ _id: mongoose.Types.ObjectId(temp._id) }, { $set: temp });
            resolve(`updated ${temp.product_name}`);
          }
        } catch (err) {
          console.log(err);
          reject(`cannot modify ${prod.product_name}`);
        }
      });
      promiseArr.push(p);
    }

    Promise.allSettled(promiseArr)
      .then((results) => {
        console.log("resultsresults", results);
        return res.status(200).json({
          status: "ok",
          // msg: "ok",
          data: results,
          code: 0,
        });
      })
      .catch((errors) => {
        console.log("errorserrors", errors);
        return res.status(500).json({
          status: "error",
          msg: "Something went wrong",
          code: 1,
        });
      });
  });
};

module.exports.exportXls = async (req, res) => {
  let settings = await settingsModel.findOne({}).lean();
  let apiUrl = settings.apilink;
  let data = await table
    .aggregate([
      // { $match: { product_name: "1_TEST product1" } },
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
                      // {
                      //   $eq: ["$region", mongoose.Types.ObjectId(region_id)],
                      // },
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
            lostQuantity: { $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0] },
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
              { $match: { $expr: { $eq: ["$product_id", "$$product_id"] } } },
              {
                $group: {
                  _id: null,
                  ratingsCount: { $sum: 1 },
                  ratingsSum: { $sum: "$rating" },
                  ratingsArray: { $push: "$rating" },
                  reviewArray: { $push: "$$ROOT" },
                },
              },
            ],
            as: "ratingreviews",
          },
        },
        { $unwind: { path: "$ratingreviews", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            ratings: {
              $round: [{ $divide: ["$ratingreviews.ratingsSum", "$ratingreviews.ratingsCount"] }, 1],
            },
            reviews: {
              $filter: {
                input: "$ratingreviews.reviewArray",
                as: "review",
                cond: { $ne: ["$$review.review", ""] },
              },
            },
            ratingsCount: "$ratingreviews.ratingsCount",
          },
        },
        {
          $addFields: {
            reviewsCount: {
              $cond: { if: { $isArray: "$reviews" }, then: { $size: "$reviews" }, else: 0 },
            },
          },
        },
      ],

      // For Populating nested keys inside nested array of objects
      ...[
        // inside simpleData array
        ...[
          // { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
          // {
          //   $lookup: {
          //     from: "regions",
          //     foreignField: "_id",
          //     localField: "simpleData.region",
          //     as: "simpleData.region",
          //   },
          // },
          // { $unwind: { path: "$simpleData.region", preserveNullAndEmptyArrays: true } },
          // {
          //   $unset: ["simpleData.region.stateData", "simpleData.region.__v", "simpleData.region.created_at"],
          // },
          // {
          //   $lookup: {
          //     from: "packages",
          //     foreignField: "_id",
          //     localField: "simpleData.package",
          //     as: "simpleData.package",
          //   },
          // },
          // {
          //   $addFields: {
          //     "simpleData.package": {
          //       $filter: {
          //         input: "$simpleData.package",
          //         as: "item",
          //         cond: { $eq: ["$$item.status", true] },
          //       },
          //     },
          //     "simpleData.availableQuantity": "$availableQuantity",
          //   },
          // },
          // {
          //   $group: {
          //     _id: "$_id",
          //     product_name: { $first: "$product_name" },
          //     images: { $first: "$images" },
          //     simpleData: { $push: "$simpleData" },
          //     configurableData: { $first: "$configurableData" },
          //     groupData: { $first: "$groupData" },
          //     base_price: { $first: "$base_price" },
          //     slug: { $first: "$slug" },
          //     TypeOfProduct: { $first: "$TypeOfProduct" },
          //     outOfStock: { $first: "$outOfStock" },
          //     availableQuantity: { $first: "$availableQuantity" },
          //     productSubscription: { $first: "$productSubscription" },
          //     preOrder: { $first: "$preOrder" },
          //     preOrderQty: { $first: "$preOrderQty" },
          //     preOrderBookQty: { $first: "$preOrderBookQty" },
          //     preOrderRemainQty: { $first: "$preOrderRemainQty" },
          //     preOrderStartDate: { $first: "$preOrderStartDate" },
          //     preOrderEndDate: { $first: "$preOrderEndDate" },
          //     sameDayDelivery: { $first: "$sameDayDelivery" },
          //     farmPickup: { $first: "$farmPickup" },
          //     priority: { $first: "$priority" },
          //     status: { $first: "$status" },
          //     showstatus: { $first: "$showstatus" },
          //     ratings: { $first: "$ratings" },
          //     ratingsCount: { $first: "$ratingsCount" },
          //     reviews: { $first: "$reviews" },
          //     reviewsCount: { $first: "$reviewsCount" },
          //     unitMeasurement: { $first: "$unitMeasurement" },
          //     salesTaxOutSide: { $first: "$salesTaxOutSide" },
          //     salesTaxWithIn: { $first: "$salesTaxWithIn" },
          //     purchaseTax: { $first: "$purchaseTax" },
          //     relatedProduct: { $first: "$relatedProduct" },
          //     product_categories: { $first: "$product_categories" },
          //   },
          // },
          // {
          //   $addFields: {
          //     simpleData: {
          //       $filter: {
          //         input: "$simpleData",
          //         as: "sd",
          //         cond: { $eq: ["$$sd.region._id", mongoose.Types.ObjectId(region_id)] },
          //       },
          //     },
          //   },
          // },
        ],

        // inside groupData array
        ...[
          // { $unwind: { path: "$groupData", preserveNullAndEmptyArrays: true } },
          // { $unwind: { path: "$groupData.sets", preserveNullAndEmptyArrays: true } },
          // // { $sort: { "groupData.sets.priority": 1 } },
          // {
          //   $lookup: {
          //     from: "packages",
          //     foreignField: "_id",
          //     localField: "groupData.sets.package",
          //     as: "groupData.sets.package",
          //   },
          // },
          // { $unwind: { path: "$groupData.sets.package", preserveNullAndEmptyArrays: true } },
          // // *************************************************************************************************************
          // // Starting of code for populating Inner Product of Group Product
          // // *************************************************************************************************************
          // {
          //   $lookup: {
          //     from: "products",
          //     let: { product_id: "$groupData.sets.product" },
          //     pipeline: [
          //       { $match: { $expr: { $eq: ["$$product_id", "$_id"] } } },
          //       // For adding quantity keys
          //       ...[
          //         {
          //           $lookup: {
          //             from: "inventory_items",
          //             let: { product_id: "$_id" },
          //             pipeline: [
          //               {
          //                 $match: {
          //                   $expr: {
          //                     $and: [
          //                       { $eq: ["$product_id", "$$product_id"] },
          //                       {
          //                         $eq: ["$region", mongoose.Types.ObjectId(region_id)],
          //                       },
          //                     ],
          //                   },
          //                 },
          //               },
          //               {
          //                 $group: {
          //                   _id: null,
          //                   productQuantity: { $sum: "$productQuantity" },
          //                   bookingQuantity: { $sum: "$bookingQuantity" },
          //                   availableQuantity: { $sum: "$availableQuantity" },
          //                   lostQuantity: { $sum: "$lostQuantity" },
          //                   returnQuantity: { $sum: "$returnQuantity" },
          //                   inhouseQuantity: { $sum: "$inhouseQuantity" },
          //                 },
          //               },
          //               { $project: { _id: 0 } },
          //             ],
          //             as: "inventories",
          //           },
          //         },
          //         {
          //           $unwind: {
          //             path: "$inventories",
          //             preserveNullAndEmptyArrays: true,
          //           },
          //         },
          //         {
          //           $addFields: {
          //             productQuantity: {
          //               $ifNull: [{ $toDouble: "$inventories.productQuantity" }, 0],
          //             },
          //             bookingQuantity: {
          //               $ifNull: [{ $toDouble: "$inventories.bookingQuantity" }, 0],
          //             },
          //             availableQuantity: {
          //               $ifNull: [{ $toDouble: "$inventories.availableQuantity" }, 0],
          //             },
          //             lostQuantity: { $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0] },
          //             returnQuantity: {
          //               $ifNull: [{ $toDouble: "$inventories.returnQuantity" }, 0],
          //             },
          //             inhouseQuantity: {
          //               $ifNull: [{ $toDouble: "$inventories.inhouseQuantity" }, 0],
          //             },
          //           },
          //         },
          //         {
          //           $addFields: {
          //             outOfStock: {
          //               $cond: [{ $eq: ["$TypeOfProduct", "simple"] }, { $lte: ["$availableQuantity", 0] }, false],
          //             },
          //           },
          //         },
          //       ],
          //       {
          //         $addFields: {
          //           simpleData: {
          //             $ifNull: ["$simpleData", []],
          //           },
          //           configurableData: {
          //             $ifNull: ["$configurableData", []],
          //           },
          //           groupData: {
          //             $ifNull: ["$groupData", []],
          //           },
          //         },
          //       },
          //       // inside simpleData array
          //       ...[
          //         { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
          //         {
          //           $lookup: {
          //             from: "packages",
          //             foreignField: "_id",
          //             localField: "simpleData.package",
          //             as: "simpleData.package",
          //           },
          //         },
          //         {
          //           $addFields: {
          //             "simpleData.availableQuantity": "$availableQuantity",
          //           },
          //         },
          //         {
          //           $group: {
          //             _id: "$_id",
          //             product_name: { $first: "$product_name" },
          //             images: { $first: "$images" },
          //             simpleData: { $push: "$simpleData" },
          //             configurableData: { $first: "$configurableData" },
          //             groupData: { $first: "$groupData" },
          //             base_price: { $first: "$base_price" },
          //             slug: { $first: "$slug" },
          //             TypeOfProduct: { $first: "$TypeOfProduct" },
          //             outOfStock: { $first: "$outOfStock" },
          //             availableQuantity: { $first: "$availableQuantity" },
          //             productSubscription: { $first: "$productSubscription" },
          //             preOrder: { $first: "$preOrder" },
          //             preOrderQty: { $first: "$preOrderQty" },
          //             preOrderBookQty: { $first: "$preOrderBookQty" },
          //             preOrderRemainQty: { $first: "$preOrderRemainQty" },
          //             preOrderStartDate: { $first: "$preOrderStartDate" },
          //             preOrderEndDate: { $first: "$preOrderEndDate" },
          //             sameDayDelivery: { $first: "$sameDayDelivery" },
          //             farmPickup: { $first: "$farmPickup" },
          //             priority: { $first: "$priority" },
          //             status: { $first: "$status" },
          //             showstatus: { $first: "$showstatus" },
          //             ratings: { $first: "$ratings" },
          //             ratingsCount: { $first: "$ratingsCount" },
          //             reviews: { $first: "$reviews" },
          //             reviewsCount: { $first: "$reviewsCount" },
          //             unitMeasurement: { $first: "$unitMeasurement" },
          //             salesTaxOutSide: { $first: "$salesTaxOutSide" },
          //             salesTaxWithIn: { $first: "$salesTaxWithIn" },
          //             purchaseTax: { $first: "$purchaseTax" },
          //             product_categories: { $first: "$product_categories" },
          //           },
          //         },
          //         {
          //           $addFields: {
          //             simpleData: {
          //               $filter: {
          //                 input: "$simpleData",
          //                 as: "sd",
          //                 cond: { $eq: [{ $toString: "$$sd.region" }, { $toString: region_id }] },
          //               },
          //             },
          //           },
          //         },
          //         {
          //           $addFields: {
          //             soldInRegion: {
          //               $cond: [{ $gt: [{ $size: "$simpleData" }, 0] }, true, false],
          //               // $size: "$simpleData",
          //             },
          //           },
          //         },
          //       ],
          //       // For populating other small keys
          //       ...[
          //         {
          //           $lookup: {
          //             from: "unit_measurements",
          //             localField: "unitMeasurement",
          //             foreignField: "_id",
          //             as: "unitMeasurement",
          //           },
          //         },
          //         { $unwind: { path: "$unitMeasurement", preserveNullAndEmptyArrays: true } },
          //         {
          //           $lookup: {
          //             from: "taxs",
          //             localField: "salesTaxOutSide",
          //             foreignField: "_id",
          //             as: "salesTaxOutSide",
          //           },
          //         },
          //         { $unwind: { path: "$salesTaxOutSide", preserveNullAndEmptyArrays: true } },
          //         {
          //           $lookup: {
          //             from: "taxs",
          //             localField: "salesTaxWithIn",
          //             foreignField: "_id",
          //             as: "salesTaxWithIn",
          //           },
          //         },
          //         { $unwind: { path: "$salesTaxWithIn", preserveNullAndEmptyArrays: true } },
          //         {
          //           $lookup: {
          //             from: "taxs",
          //             localField: "purchaseTax",
          //             foreignField: "_id",
          //             as: "purchaseTax",
          //           },
          //         },
          //         { $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true } },
          //       ],
          //     ],
          //     as: "groupData.sets.product",
          //   },
          // },
          // { $unwind: { path: "$groupData.sets.product", preserveNullAndEmptyArrays: true } },
          // // *************************************************************************************************************
          // // Ending of code for populating Inner Product of Group Product
          // // *************************************************************************************************************
          // // { $sort: { "groupData.sets.priority": 1, "groupData.sets.product.product_name": 1 } },
          // {
          //   $group: {
          //     _id: "$_id",
          //     product_name: { $first: "$product_name" },
          //     images: { $first: "$images" },
          //     simpleData: { $first: "$simpleData" },
          //     configurableData: { $first: "$configurableData" },
          //     groupData: { $push: "$groupData" },
          //     base_price: { $first: "$base_price" },
          //     slug: { $first: "$slug" },
          //     TypeOfProduct: { $first: "$TypeOfProduct" },
          //     outOfStock: { $first: "$outOfStock" },
          //     availableQuantity: { $first: "$availableQuantity" },
          //     productSubscription: { $first: "$productSubscription" },
          //     preOrder: { $first: "$preOrder" },
          //     preOrderQty: { $first: "$preOrderQty" },
          //     preOrderBookQty: { $first: "$preOrderBookQty" },
          //     preOrderRemainQty: { $first: "$preOrderRemainQty" },
          //     preOrderStartDate: { $first: "$preOrderStartDate" },
          //     preOrderEndDate: { $first: "$preOrderEndDate" },
          //     sameDayDelivery: { $first: "$sameDayDelivery" },
          //     farmPickup: { $first: "$farmPickup" },
          //     priority: { $first: "$priority" },
          //     status: { $first: "$status" },
          //     showstatus: { $first: "$showstatus" },
          //     ratings: { $first: "$ratings" },
          //     ratingsCount: { $first: "$ratingsCount" },
          //     reviews: { $first: "$reviews" },
          //     reviewsCount: { $first: "$reviewsCount" },
          //     unitMeasurement: { $first: "$unitMeasurement" },
          //     salesTaxOutSide: { $first: "$salesTaxOutSide" },
          //     salesTaxWithIn: { $first: "$salesTaxWithIn" },
          //     purchaseTax: { $first: "$purchaseTax" },
          //     relatedProduct: { $first: "$relatedProduct" },
          //     product_categories: { $first: "$product_categories" },
          //   },
          // },
          // // For grouping groupData.sets and
          // // For sorting inner products inside group products based on priorities
          // {
          //   $addFields: {
          //     groupData: {
          //       $function: {
          //         body: function (groupData) {
          //           let new_groupData = [];
          //           for (let gd of groupData) {
          //             if (gd.name) {
          //               let found = false;
          //               for (let new_gd of new_groupData) {
          //                 if (new_gd._id.toString() === gd._id.toString() && new_gd.name === gd.name) {
          //                   found = new_gd;
          //                 }
          //               }
          //               if (found) {
          //                 found.sets.push(gd.sets);
          //               } else {
          //                 gd.sets = [gd.sets];
          //                 new_groupData.push(gd);
          //               }
          //             }
          //           }
          //           for (const gd of new_groupData) {
          //             for (const set of gd.sets) {
          //               if (set.priority === null) {
          //                 set.priority = Infinity;
          //               }
          //             }
          //             gd.sets.sort((a, b) => a.priority - b.priority);
          //           }
          //           return new_groupData;
          //         },
          //         args: ["$groupData"],
          //         lang: "js",
          //       },
          //     },
          //   },
          // },
        ],

        // inside related products
        ...[
          { $unwind: { path: "$relatedProduct", preserveNullAndEmptyArrays: true } },
          // *************************************************************************************************************
          // Starting of code for populating related products
          // *************************************************************************************************************
          {
            $lookup: {
              from: "products",
              let: { product_id: "$relatedProduct.product_id" },
              pipeline: [
                { $match: { $expr: { $eq: ["$$product_id", "$_id"] } } },
                { $project: { product_name: 1 } },
                // // For addings category status based checks
                // ...[
                //   {
                //     $lookup: {
                //       from: "categories",
                //       foreignField: "_id",
                //       localField: "product_categories",
                //       as: "product_categories",
                //     },
                //   },
                //   {
                //     $addFields: {
                //       allCategories: {
                //         $function: {
                //           body: function (cats) {
                //             let x = [];
                //             cats.forEach((cat) => {
                //               x.push(cat._id);
                //               cat.ancestors.forEach((ancestor) => {
                //                 x.push(ancestor._id);
                //               });
                //             });
                //             return x;
                //           },
                //           args: ["$product_categories"],
                //           lang: "js",
                //         },
                //       },
                //     },
                //   },
                //   {
                //     $lookup: {
                //       from: "categories",
                //       foreignField: "_id",
                //       localField: "allCategories",
                //       as: "allCategories",
                //     },
                //   },
                //   {
                //     $addFields: {
                //       allCategoryStatus: {
                //         $function: {
                //           body: function (cats) {
                //             return cats.filter((cat) => !cat.status).length > 0 ? false : true;
                //           },
                //           args: ["$allCategories"],
                //           lang: "js",
                //         },
                //       },
                //     },
                //   },
                //   { $match: { allCategoryStatus: true } },
                // ],
                // {
                //   $addFields: {
                //     simpleData: {
                //       $ifNull: ["$simpleData", []],
                //     },
                //     configurableData: {
                //       $ifNull: ["$configurableData", []],
                //     },
                //     groupData: {
                //       $ifNull: ["$groupData", []],
                //     },
                //   },
                // },

                // // For adding quantity keys
                // ...[
                //   {
                //     $lookup: {
                //       from: "inventory_items",
                //       let: { product_id: "$_id" },
                //       pipeline: [
                //         {
                //           $match: {
                //             $expr: {
                //               $and: [
                //                 { $eq: ["$product_id", "$$product_id"] },
                //                 {
                //                   $eq: ["$region", mongoose.Types.ObjectId(region_id)],
                //                 },
                //               ],
                //             },
                //           },
                //         },
                //         {
                //           $group: {
                //             _id: null,
                //             productQuantity: { $sum: "$productQuantity" },
                //             bookingQuantity: { $sum: "$bookingQuantity" },
                //             availableQuantity: { $sum: "$availableQuantity" },
                //             lostQuantity: { $sum: "$lostQuantity" },
                //             returnQuantity: { $sum: "$returnQuantity" },
                //             inhouseQuantity: { $sum: "$inhouseQuantity" },
                //           },
                //         },
                //         { $project: { _id: 0 } },
                //       ],
                //       as: "inventories",
                //     },
                //   },
                //   {
                //     $unwind: {
                //       path: "$inventories",
                //       preserveNullAndEmptyArrays: true,
                //     },
                //   },
                //   {
                //     $addFields: {
                //       productQuantity: {
                //         $ifNull: [{ $toDouble: "$inventories.productQuantity" }, 0],
                //       },
                //       bookingQuantity: {
                //         $ifNull: [{ $toDouble: "$inventories.bookingQuantity" }, 0],
                //       },
                //       availableQuantity: {
                //         $ifNull: [{ $toDouble: "$inventories.availableQuantity" }, 0],
                //       },
                //       lostQuantity: { $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0] },
                //       returnQuantity: {
                //         $ifNull: [{ $toDouble: "$inventories.returnQuantity" }, 0],
                //       },
                //       inhouseQuantity: {
                //         $ifNull: [{ $toDouble: "$inventories.inhouseQuantity" }, 0],
                //       },
                //     },
                //   },
                //   {
                //     $addFields: {
                //       outOfStock: {
                //         $cond: [{ $eq: ["$TypeOfProduct", "simple"] }, { $lte: ["$availableQuantity", 0] }, false],
                //       },
                //     },
                //   },
                // ],

                // // For adding ratings and reviews keys
                // ...[
                //   {
                //     $lookup: {
                //       from: "ratingreviews",
                //       let: { product_id: "$_id" },
                //       pipeline: [
                //         { $match: { $expr: { $eq: ["$product_id", "$$product_id"] } } },
                //         {
                //           $group: {
                //             _id: null,
                //             ratingsCount: { $sum: 1 },
                //             ratingsSum: { $sum: "$rating" },
                //             ratingsArray: { $push: "$rating" },
                //             reviewArray: { $push: "$review" },
                //           },
                //         },
                //       ],
                //       as: "ratingreviews",
                //     },
                //   },
                //   { $unwind: { path: "$ratingreviews", preserveNullAndEmptyArrays: true } },
                //   {
                //     $addFields: {
                //       ratings: {
                //         $round: [
                //           {
                //             $divide: ["$ratingreviews.ratingsSum", "$ratingreviews.ratingsCount"],
                //           },
                //           1,
                //         ],
                //       },
                //       reviews: {
                //         $filter: {
                //           input: "$ratingreviews.reviewArray",
                //           as: "review",
                //           cond: { $ne: ["$$review", ""] },
                //         },
                //       },
                //       ratingsCount: "$ratingreviews.ratingsCount",
                //     },
                //   },
                //   {
                //     $addFields: {
                //       reviewsCount: {
                //         $cond: {
                //           if: { $isArray: "$reviews" },
                //           then: { $size: "$reviews" },
                //           else: 0,
                //         },
                //       },
                //     },
                //   },
                // ],

                // // For Populating nested keys inside nested array of objects
                // ...[
                //   // inside simpleData array
                //   ...[
                //     { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
                //     {
                //       $lookup: {
                //         from: "regions",
                //         foreignField: "_id",
                //         localField: "simpleData.region",
                //         as: "simpleData.region",
                //       },
                //     },
                //     { $unwind: { path: "$simpleData.region", preserveNullAndEmptyArrays: true } },
                //     {
                //       $unset: ["simpleData.region.stateData", "simpleData.region.__v", "simpleData.region.created_at"],
                //     },
                //     {
                //       $lookup: {
                //         from: "packages",
                //         foreignField: "_id",
                //         localField: "simpleData.package",
                //         as: "simpleData.package",
                //       },
                //     },
                //     {
                //       $addFields: {
                //         "simpleData.package": {
                //           $filter: {
                //             input: "$simpleData.package",
                //             as: "item",
                //             cond: { $eq: ["$$item.status", true] },
                //           },
                //         },
                //         "simpleData.availableQuantity": "$availableQuantity",
                //       },
                //     },
                //     {
                //       $group: {
                //         _id: "$_id",
                //         product_name: { $first: "$product_name" },
                //         images: { $first: "$images" },
                //         simpleData: { $push: "$simpleData" },
                //         configurableData: { $first: "$configurableData" },
                //         groupData: { $first: "$groupData" },
                //         base_price: { $first: "$base_price" },
                //         slug: { $first: "$slug" },
                //         TypeOfProduct: { $first: "$TypeOfProduct" },
                //         outOfStock: { $first: "$outOfStock" },
                //         availableQuantity: { $first: "$availableQuantity" },
                //         productSubscription: { $first: "$productSubscription" },
                //         preOrder: { $first: "$preOrder" },
                //         preOrderQty: { $first: "$preOrderQty" },
                //         preOrderBookQty: { $first: "$preOrderBookQty" },
                //         preOrderRemainQty: { $first: "$preOrderRemainQty" },
                //         preOrderStartDate: { $first: "$preOrderStartDate" },
                //         preOrderEndDate: { $first: "$preOrderEndDate" },
                //         sameDayDelivery: { $first: "$sameDayDelivery" },
                //         farmPickup: { $first: "$farmPickup" },
                //         priority: { $first: "$priority" },
                //         status: { $first: "$status" },
                //         showstatus: { $first: "$showstatus" },
                //         ratings: { $first: "$ratings" },
                //         ratingsCount: { $first: "$ratingsCount" },
                //         reviews: { $first: "$reviews" },
                //         reviewsCount: { $first: "$reviewsCount" },
                //         unitMeasurement: { $first: "$unitMeasurement" },
                //         salesTaxOutSide: { $first: "$salesTaxOutSide" },
                //         salesTaxWithIn: { $first: "$salesTaxWithIn" },
                //         purchaseTax: { $first: "$purchaseTax" },
                //         relatedProduct: { $first: "$relatedProduct" },
                //         product_categories: { $first: "$product_categories" },
                //       },
                //     },
                //     {
                //       $addFields: {
                //         simpleData: {
                //           $filter: {
                //             input: "$simpleData",
                //             as: "sd",
                //             cond: {
                //               $eq: ["$$sd.region._id", mongoose.Types.ObjectId(region_id)],
                //             },
                //           },
                //         },
                //       },
                //     },
                //   ],

                //   // inside groupData array
                //   ...[
                //     { $unwind: { path: "$groupData", preserveNullAndEmptyArrays: true } },
                //     { $unwind: { path: "$groupData.sets", preserveNullAndEmptyArrays: true } },
                //     // { $sort: { "groupData.sets.priority": 1 } },
                //     {
                //       $lookup: {
                //         from: "packages",
                //         foreignField: "_id",
                //         localField: "groupData.sets.package",
                //         as: "groupData.sets.package",
                //       },
                //     },
                //     {
                //       $unwind: {
                //         path: "$groupData.sets.package",
                //         preserveNullAndEmptyArrays: true,
                //       },
                //     },

                //     // *************************************************************************************************************
                //     // Starting of code for populating Inner Product of Group Product in " related products "
                //     // *************************************************************************************************************
                //     {
                //       $lookup: {
                //         from: "products",
                //         let: { product_id: "$groupData.sets.product" },
                //         pipeline: [
                //           { $match: { $expr: { $eq: ["$$product_id", "$_id"] } } },
                //           // For adding quantity keys
                //           ...[
                //             {
                //               $lookup: {
                //                 from: "inventory_items",
                //                 let: { product_id: "$_id" },
                //                 pipeline: [
                //                   {
                //                     $match: {
                //                       $expr: {
                //                         $and: [
                //                           { $eq: ["$product_id", "$$product_id"] },
                //                           {
                //                             $eq: ["$region", mongoose.Types.ObjectId(region_id)],
                //                           },
                //                         ],
                //                       },
                //                     },
                //                   },
                //                   {
                //                     $group: {
                //                       _id: null,
                //                       productQuantity: { $sum: "$productQuantity" },
                //                       bookingQuantity: { $sum: "$bookingQuantity" },
                //                       availableQuantity: { $sum: "$availableQuantity" },
                //                       lostQuantity: { $sum: "$lostQuantity" },
                //                       returnQuantity: { $sum: "$returnQuantity" },
                //                       inhouseQuantity: { $sum: "$inhouseQuantity" },
                //                     },
                //                   },
                //                   { $project: { _id: 0 } },
                //                 ],
                //                 as: "inventories",
                //               },
                //             },
                //             {
                //               $unwind: {
                //                 path: "$inventories",
                //                 preserveNullAndEmptyArrays: true,
                //               },
                //             },
                //             {
                //               $addFields: {
                //                 productQuantity: {
                //                   $ifNull: [{ $toDouble: "$inventories.productQuantity" }, 0],
                //                 },
                //                 bookingQuantity: {
                //                   $ifNull: [{ $toDouble: "$inventories.bookingQuantity" }, 0],
                //                 },
                //                 availableQuantity: {
                //                   $ifNull: [{ $toDouble: "$inventories.availableQuantity" }, 0],
                //                 },
                //                 lostQuantity: {
                //                   $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0],
                //                 },
                //                 returnQuantity: {
                //                   $ifNull: [{ $toDouble: "$inventories.returnQuantity" }, 0],
                //                 },
                //                 inhouseQuantity: {
                //                   $ifNull: [{ $toDouble: "$inventories.inhouseQuantity" }, 0],
                //                 },
                //               },
                //             },
                //             {
                //               $addFields: {
                //                 outOfStock: {
                //                   $cond: [{ $eq: ["$TypeOfProduct", "simple"] }, { $lte: ["$availableQuantity", 0] }, false],
                //                 },
                //               },
                //             },
                //           ],

                //           {
                //             $addFields: {
                //               simpleData: {
                //                 $ifNull: ["$simpleData", []],
                //               },
                //               configurableData: {
                //                 $ifNull: ["$configurableData", []],
                //               },
                //               groupData: {
                //                 $ifNull: ["$groupData", []],
                //               },
                //             },
                //           },

                //           // inside simpleData array
                //           ...[
                //             {
                //               $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true },
                //             },
                //             {
                //               $lookup: {
                //                 from: "packages",
                //                 foreignField: "_id",
                //                 localField: "simpleData.package",
                //                 as: "simpleData.package",
                //               },
                //             },
                //             {
                //               $addFields: {
                //                 "simpleData.availableQuantity": "$availableQuantity",
                //               },
                //             },
                //             {
                //               $group: {
                //                 _id: "$_id",
                //                 product_name: { $first: "$product_name" },
                //                 images: { $first: "$images" },
                //                 simpleData: { $push: "$simpleData" },
                //                 configurableData: { $first: "$configurableData" },
                //                 groupData: { $first: "$groupData" },
                //                 base_price: { $first: "$base_price" },
                //                 slug: { $first: "$slug" },
                //                 TypeOfProduct: { $first: "$TypeOfProduct" },
                //                 outOfStock: { $first: "$outOfStock" },
                //                 availableQuantity: { $first: "$availableQuantity" },
                //                 productSubscription: { $first: "$productSubscription" },
                //                 preOrder: { $first: "$preOrder" },
                //                 preOrderQty: { $first: "$preOrderQty" },
                //                 preOrderBookQty: { $first: "$preOrderBookQty" },
                //                 preOrderRemainQty: { $first: "$preOrderRemainQty" },
                //                 preOrderStartDate: { $first: "$preOrderStartDate" },
                //                 preOrderEndDate: { $first: "$preOrderEndDate" },
                //                 sameDayDelivery: { $first: "$sameDayDelivery" },
                //                 farmPickup: { $first: "$farmPickup" },
                //                 priority: { $first: "$priority" },
                //                 status: { $first: "$status" },
                //                 showstatus: { $first: "$showstatus" },
                //                 ratings: { $first: "$ratings" },
                //                 ratingsCount: { $first: "$ratingsCount" },
                //                 reviews: { $first: "$reviews" },
                //                 reviewsCount: { $first: "$reviewsCount" },
                //                 unitMeasurement: { $first: "$unitMeasurement" },
                //                 salesTaxOutSide: { $first: "$salesTaxOutSide" },
                //                 salesTaxWithIn: { $first: "$salesTaxWithIn" },
                //                 purchaseTax: { $first: "$purchaseTax" },
                //                 product_categories: { $first: "$product_categories" },
                //               },
                //             },
                //             {
                //               $addFields: {
                //                 simpleData: {
                //                   $filter: {
                //                     input: "$simpleData",
                //                     as: "sd",
                //                     cond: {
                //                       $eq: [{ $toString: "$$sd.region" }, { $toString: region_id }],
                //                     },
                //                   },
                //                 },
                //               },
                //             },
                //             {
                //               $addFields: {
                //                 soldInRegion: {
                //                   $cond: [{ $gt: [{ $size: "$simpleData" }, 0] }, true, false],
                //                   // $size: "$simpleData",
                //                 },
                //               },
                //             },
                //           ],

                //           // For populating other small keys
                //           ...[
                //             {
                //               $lookup: {
                //                 from: "unit_measurements",
                //                 localField: "unitMeasurement",
                //                 foreignField: "_id",
                //                 as: "unitMeasurement",
                //               },
                //             },
                //             {
                //               $unwind: {
                //                 path: "$unitMeasurement",
                //                 preserveNullAndEmptyArrays: true,
                //               },
                //             },

                //             {
                //               $lookup: {
                //                 from: "taxs",
                //                 localField: "salesTaxOutSide",
                //                 foreignField: "_id",
                //                 as: "salesTaxOutSide",
                //               },
                //             },
                //             {
                //               $unwind: {
                //                 path: "$salesTaxOutSide",
                //                 preserveNullAndEmptyArrays: true,
                //               },
                //             },

                //             {
                //               $lookup: {
                //                 from: "taxs",
                //                 localField: "salesTaxWithIn",
                //                 foreignField: "_id",
                //                 as: "salesTaxWithIn",
                //               },
                //             },
                //             {
                //               $unwind: {
                //                 path: "$salesTaxWithIn",
                //                 preserveNullAndEmptyArrays: true,
                //               },
                //             },

                //             {
                //               $lookup: {
                //                 from: "taxs",
                //                 localField: "purchaseTax",
                //                 foreignField: "_id",
                //                 as: "purchaseTax",
                //               },
                //             },
                //             {
                //               $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true },
                //             },
                //           ],
                //         ],
                //         as: "groupData.sets.product",
                //       },
                //     },
                //     {
                //       $unwind: {
                //         path: "$groupData.sets.product",
                //         preserveNullAndEmptyArrays: true,
                //       },
                //     },
                //     // *************************************************************************************************************
                //     // Ending of code for populating Inner Product of Group Product
                //     // *************************************************************************************************************
                //     // { $sort: { "groupData.sets.priority": 1, "groupData.sets.product.product_name": 1 } },
                //     {
                //       $group: {
                //         _id: "$_id",
                //         product_name: { $first: "$product_name" },
                //         images: { $first: "$images" },
                //         simpleData: { $first: "$simpleData" },
                //         configurableData: { $first: "$configurableData" },
                //         groupData: { $push: "$groupData" },
                //         base_price: { $first: "$base_price" },
                //         slug: { $first: "$slug" },
                //         TypeOfProduct: { $first: "$TypeOfProduct" },
                //         outOfStock: { $first: "$outOfStock" },
                //         availableQuantity: { $first: "$availableQuantity" },
                //         productSubscription: { $first: "$productSubscription" },
                //         preOrder: { $first: "$preOrder" },
                //         preOrderQty: { $first: "$preOrderQty" },
                //         preOrderBookQty: { $first: "$preOrderBookQty" },
                //         preOrderRemainQty: { $first: "$preOrderRemainQty" },
                //         preOrderStartDate: { $first: "$preOrderStartDate" },
                //         preOrderEndDate: { $first: "$preOrderEndDate" },
                //         sameDayDelivery: { $first: "$sameDayDelivery" },
                //         farmPickup: { $first: "$farmPickup" },
                //         priority: { $first: "$priority" },
                //         status: { $first: "$status" },
                //         showstatus: { $first: "$showstatus" },
                //         ratings: { $first: "$ratings" },
                //         ratingsCount: { $first: "$ratingsCount" },
                //         reviews: { $first: "$reviews" },
                //         reviewsCount: { $first: "$reviewsCount" },
                //         unitMeasurement: { $first: "$unitMeasurement" },
                //         salesTaxOutSide: { $first: "$salesTaxOutSide" },
                //         salesTaxWithIn: { $first: "$salesTaxWithIn" },
                //         purchaseTax: { $first: "$purchaseTax" },
                //         relatedProduct: { $first: "$relatedProduct" },
                //         product_categories: { $first: "$product_categories" },
                //       },
                //     },

                //     // For grouping groupData.sets and
                //     // For sorting inner products inside group products based on priorities
                //     {
                //       $addFields: {
                //         groupData: {
                //           $function: {
                //             body: function (groupData) {
                //               let new_groupData = [];
                //               for (let gd of groupData) {
                //                 if (gd.name) {
                //                   let found = false;
                //                   for (let new_gd of new_groupData) {
                //                     if (new_gd._id.toString() === gd._id.toString() && new_gd.name === gd.name) {
                //                       found = new_gd;
                //                     }
                //                   }
                //                   if (found) {
                //                     found.sets.push(gd.sets);
                //                   } else {
                //                     gd.sets = [gd.sets];
                //                     new_groupData.push(gd);
                //                   }
                //                 }
                //               }

                //               for (const gd of new_groupData) {
                //                 for (const set of gd.sets) {
                //                   if (set.priority === null) {
                //                     set.priority = Infinity;
                //                   }
                //                 }
                //                 gd.sets.sort((a, b) => a.priority - b.priority);
                //               }

                //               return new_groupData;
                //             },
                //             args: ["$groupData"],
                //             lang: "js",
                //           },
                //         },
                //       },
                //     },
                //   ],
                // ],

                // // For populating other small keys
                // ...[
                //   {
                //     $lookup: {
                //       from: "unit_measurements",
                //       localField: "unitMeasurement",
                //       foreignField: "_id",
                //       as: "unitMeasurement",
                //     },
                //   },
                //   { $unwind: { path: "$unitMeasurement", preserveNullAndEmptyArrays: true } },

                //   {
                //     $lookup: {
                //       from: "taxs",
                //       localField: "salesTaxOutSide",
                //       foreignField: "_id",
                //       as: "salesTaxOutSide",
                //     },
                //   },
                //   { $unwind: { path: "$salesTaxOutSide", preserveNullAndEmptyArrays: true } },

                //   {
                //     $lookup: {
                //       from: "taxs",
                //       localField: "salesTaxWithIn",
                //       foreignField: "_id",
                //       as: "salesTaxWithIn",
                //     },
                //   },
                //   { $unwind: { path: "$salesTaxWithIn", preserveNullAndEmptyArrays: true } },

                //   {
                //     $lookup: {
                //       from: "taxs",
                //       localField: "purchaseTax",
                //       foreignField: "_id",
                //       as: "purchaseTax",
                //     },
                //   },
                //   { $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true } },
                // ],
              ],
              as: "relatedProduct.product_id",
            },
          },
          { $unwind: { path: "$relatedProduct.product_id", preserveNullAndEmptyArrays: true } },
          // *************************************************************************************************************
          // Ending of code for populating related products in " related products "
          // *************************************************************************************************************
          {
            $group: {
              _id: "$_id",
              product_name: { $first: "$product_name" },
              admin_id: { $first: "$admin_id" },
              images: { $first: "$images" },
              simpleData: { $first: "$simpleData" },
              configurableData: { $first: "$configurableData" },
              groupData: { $first: "$groupData" },
              base_price: { $first: "$base_price" },
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
              relatedProduct: { $push: "$relatedProduct" },
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
          {
            $addFields: {
              relatedProduct: {
                $filter: {
                  input: "$relatedProduct",
                  as: "rp",
                  cond: { $ne: [{ $size: { $objectToArray: "$$rp" } }, 0] },
                },
              },
            },
          },
        ],

        // For Product Regions array
        ...[
          { $unwind: { path: "$ProductRegion", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "regions",
              foreignField: "_id",
              localField: "ProductRegion.region_id",
              as: "ProductRegion.region_id",
            },
          },
          { $unwind: { path: "$ProductRegion.region_id", preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: "$_id",
              product_name: { $first: "$product_name" },
              admin_id: { $first: "$admin_id" },
              images: { $first: "$images" },
              simpleData: { $first: "$simpleData" },
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
              ProductRegion: { $push: "$ProductRegion" },
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

        // for related recipes
        ...[
          {
            $lookup: {
              from: "blogs",
              let: { product_id: "$_id" },
              pipeline: [
                { $match: { $expr: { $in: ["$$product_id", "$relatedProduct.product_id"] } } },
                {
                  $project: {
                    blog_id: "$$ROOT",
                    _id: null,
                  },
                },
              ],
              as: "relatedRecipes",
            },
          },
        ],
      ],

      // For populating other small keys
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
          $lookup: {
            from: "admins",
            localField: "admin_id",
            foreignField: "_id",
            as: "admin_id",
          },
        },
        { $unwind: { path: "$admin_id", preserveNullAndEmptyArrays: true } },

        {
          $lookup: {
            from: "unit_measurements",
            localField: "unitMeasurement",
            foreignField: "_id",
            as: "unitMeasurement",
          },
        },
        { $unwind: { path: "$unitMeasurement", preserveNullAndEmptyArrays: true } },

        {
          $lookup: {
            from: "taxs",
            localField: "salesTaxOutSide",
            foreignField: "_id",
            as: "salesTaxOutSide",
          },
        },
        { $unwind: { path: "$salesTaxOutSide", preserveNullAndEmptyArrays: true } },

        {
          $lookup: {
            from: "taxs",
            localField: "salesTaxWithIn",
            foreignField: "_id",
            as: "salesTaxWithIn",
          },
        },
        { $unwind: { path: "$salesTaxWithIn", preserveNullAndEmptyArrays: true } },

        {
          $lookup: {
            from: "taxs",
            localField: "purchaseTax",
            foreignField: "_id",
            as: "purchaseTax",
          },
        },
        { $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true } },
      ],

      { $sort: { product_name: 1 } },
    ])
    .option({ serializeFunctions: true });

  var FileName = "products";
  var d = new Date();
  var n = d.getDate();
  var file_Name = FileName + "-" + (n + new Date().getMilliseconds());
  var file = file_Name + ".csv";
  var jsonData = [];
  var header = [];

  if (!data || data.length == 0) {
    return res.status(500).json({
      status: "error",
      msg: "No Products found",
      code: 1,
    });
  }

  Object.keys(data[0]).forEach((key) => {
    if (!["preOrderQty", "preOrderBookQty", "preOrderRemainQty", "reviews", "attribute_group"].includes(key)) {
      header.push({ id: key, title: key });
    }
  });
  data.forEach((data) => {
    let temp = {};
    Object.keys(data).forEach((key) => {
      if (["created_at", "preOrderStartDate", "preOrderEndDate"].includes(key)) {
        temp[key] = data[key] ? moment(data[key]).format("MMMM Do YYYY, h:mm:ss a") : "";
      } else if (["productQuantity", "bookingQuantity", "availableQuantity", "lostQuantity", "returnQuantity", "inhouseQuantity"].includes(key)) {
        temp[key] = data[key] || 0;
      } else if (key == "ProductRegion") {
        temp[key] = [];
        if(data.ProductRegion > 0){
          data.ProductRegion.forEach((el) => {
            console.log(el, 'el.region_idel.region_idel.region_id')
            temp[key].push(el.region_id.name);
          });
        }
        temp[key] = temp[key].join(",\r\n");
      } else if (key == "barcode") {
        temp[key] = [];
        if (data.barcode && Array.isArray(data.barcode && data.barcode.length > 0)) {
          data.barcode.forEach((el) => {
            temp[key].push(el);
          });
        }
        temp[key] = temp[key].join(",\r\n");
      } else if (["farmPickup", "sameDayDelivery"].includes(key)) {
        temp[key] = data[key] ? data[key].toString() : "false";
      } else if (key == "admin_id") {
        temp[key] = data[key]?.name;
      } else if (key == "priority") {
        temp[key] = data[key] == Infinity ? "unset" : data[key];
      } else if (key == "banner") {
        temp[key] = data[key] ? "https://kc.storehey.com:3003/upload/" + data[key] : data[key];
      } else if (key == "attachment") {
        temp[key] = data[key] ? "https://kc.storehey.com:3003/upload/" + data[key] : data[key];
      } else if (key == "images") {
        temp[key] = [];
        data.images.forEach((el) => {
          temp[key].push(el.image ? "https://kc.storehey.com:3003/upload/" + el.image : el.image);
        });
        temp[key] = temp[key].join(",\r\n");
      } else if (key == "salesTaxOutSide") {
        temp[key] = data[key]?.name;
      } else if (key == "salesTaxWithIn") {
        temp[key] = data[key]?.name;
      } else if (key == "purchaseTax") {
        temp[key] = data[key]?.name;
      } else if (key == "unitMeasurement") {
        temp[key] = data[key]?.name;
      } else if (key == "product_categories") {
        temp[key] = [];
        data.product_categories.forEach((el) => {
          temp[key].push(el.category_name);
        });
        temp[key] = temp[key].join(",\r\n");
      } else if (key == "relatedProduct") {
        temp[key] = [];
        data.relatedProduct.forEach((el) => {
          temp[key].push(el.product_id.product_name);
        });
        temp[key] = temp[key].join(",\r\n");
      } else if (key == "relatedRecipes") {
        temp[key] = [];
        data.relatedRecipes.forEach((el) => {
          temp[key].push(el.blog_id.title);
        });
        temp[key] = temp[key].join(",\r\n");
      } else if (
        ["configurableData", "groupData", "simpleData", "preOrderQty", "preOrderBookQty", "preOrderRemainQty", "reviews", "attribute_group"].includes(
          key
        )
      ) {
        // do nothing
        // console.log("skipped key ::: ", key);
      } else {
        temp[key] = data[key];
      }
    });
    jsonData.push(temp);
  });

  const csvWriter = createCsvWriter({
    path: "./public/products/" + file,
    header: header,
  });

  // res.status(200).json(data);
  csvWriter
    .writeRecords(jsonData) // returns a promise
    .then(() => {
      res.status(201).json({
        message: "ok",
        data: apiUrl + "/products/" + file,
        code: 1,
      });
    })
    .catch((err) => {
      errorLogger.error(err, "\n", "\n");
      console.log(err);
    });
};

// Product bulk sample import/export using excel sheets
// import
module.exports.importSampleXls = function (req, res) {
  upload(req, res, function (err) {
    var JsonFile = req.files.filter((i) => i.fieldname === "sheet").map((i) => i.filename);
    //xlsxFile('./public/upload/'+JsonFile).then((rows) => {
    // rows.forEach((obj) => {
    // 	//console.log(obj)
    // })

    var doc = parser.parseXls2Json("./public/upload/" + JsonFile);
    var JsonData = doc[0];
    var InsertData = [];

    // console.log("bbbbb", JsonData);
    // return;

    let promiseArr = [];
    for (const prod of JsonData) {
      console.log(prod._id, prod.unitMeasurement, prod.ProductRegion, prod.salesTaxOutSide, prod.salesTaxWithIn, prod.purchaseTax, prod.product_categories)
      let p = new Promise(async (resolve, reject) => {
        try {
          if (
            !prod._id ||
            !prod.unitMeasurement ||
            //!prod.ProductRegion ||
            !prod.salesTaxOutSide ||
            !prod.salesTaxWithIn ||
            !prod.purchaseTax
            //!prod.product_categories
          ) {
            reject(`required field absent, cannot modify ${prod.product_name}`);
          } else {
            let temp = {};
            for (const key in prod) {
              if (["created_at", "preOrderStartDate", "preOrderEndDate"].includes(key)) {
                temp[key] = prod[key] ? new Date(moment(prod[key], "MMMM Do YYYY, h:mm:ss a")) : null;
              } 
              // else if (key == "ProductRegion") {
              //   temp[key] = [];
              //   let arr = prod.ProductRegion.split(",\n");
              //   for (const el of arr) {
              //     let doc = await RegionTable.aggregate([{ $match: { name: el } }, { $project: { name: 1 } }]);
              //     // console.log("%%%%%%", doc);
              //     if (doc.length > 0 && doc[0]._id) {
              //       temp[key].push({ region_id: doc[0]._id });
              //     } else {
              //       reject(`No region found with name ${el}, cannot modify ${prod.product_name}`);
              //     }
              //   }
              // } 
              else if (key == "barcode") {
                temp[key] = [];
                prod.barcode.split(",\n").forEach((el) => {
                  if (el) {
                    temp[key].push(el);
                  }
                });
              } else if (["farmPickup", "sameDayDelivery"].includes(key)) {
                temp[key] = prod[key] == "false" || prod[key] == "true" ? JSON.parse(prod[key]) : prod[key];
              } else if (key == "admin_id") {
                temp[key] = prod[key].name || null;
              } else if (key == "priority") {
                temp[key] = prod[key] == "unset" ? Infinity : prod[key];
              } else if (key == "banner") {
                temp[key] = prod[key].split("https://kc.storehey.com:3003/upload/")[1];
              } else if (key == "attachment") {
                temp[key] = prod[key].split("https://kc.storehey.com:3003/upload/")[1];
              } else if (key == "images") {
                temp[key] = [];
                prod.images.split(",\n").forEach((el) => {
                  temp[key].push({ image: el.split("https://kc.storehey.com:3003/upload/")[1] });
                });
                // console.log(temp);
              } else if (key == "salesTaxOutSide") {
                if (prod[key]) {
                  let doc = await TaxTable.aggregate([{ $match: { name: prod[key] } }, { $project: { name: 1 } }]);
                  // console.log("%%%%%%", doc);
                  if (doc.length > 0 && doc[0]._id) {
                    temp[key] = doc[0]._id;
                  } else {
                    reject(`No salesTaxOutSide found with name ${el}, cannot modify ${prod.product_name}`);
                  }
                } else {
                  // no salesTaxOutSide
                }
              } else if (key == "salesTaxWithIn") {
                if (prod[key]) {
                  let doc = await TaxTable.aggregate([{ $match: { name: prod[key] } }, { $project: { name: 1 } }]);
                  // console.log("%%%%%%", doc);
                  if (doc.length > 0 && doc[0]._id) {
                    temp[key] = doc[0]._id;
                  } else {
                    reject(`No salesTaxWithIn found with name ${el}, cannot modify ${prod.product_name}`);
                  }
                } else {
                  // no salesTaxWithIn
                }
              } else if (key == "purchaseTax") {
                if (prod[key]) {
                  let doc = await TaxTable.aggregate([{ $match: { name: prod[key] } }, { $project: { name: 1 } }]);
                  // console.log("%%%%%%", doc);
                  if (doc.length > 0 && doc[0]._id) {
                    temp[key] = doc[0]._id;
                  } else {
                    reject(`No purchaseTax found with name ${el}, cannot modify ${prod.product_name}`);
                  }
                } else {
                  // no purchaseTax
                }
              } else if (key == "unitMeasurement") {
                if (prod[key]) {
                  let doc = await UnitTable.aggregate([{ $match: { name: prod[key] } }, { $project: { name: 1 } }]);
                  // console.log("%%%%%%", doc);
                  if (doc.length > 0 && doc[0]._id) {
                    temp[key] = doc[0]._id;
                  } else {
                    reject(`No unitMeasurement found with name ${el}, cannot modify ${prod.product_name}`);
                  }
                } else {
                  // no unitMeasurement
                }
              } else if (key == "product_categories") {
                temp[key] = [];
                let arr = prod.product_categories.split(",\n");
                for (const el of arr) {
                  let doc = await Category.aggregate([{ $match: { category_name: el } }, { $project: { category_name: 1 } }]);
                  // console.log("%%%%%%", doc);
                  if (doc.length > 0 && doc[0]._id) {
                    temp[key].push(doc[0]._id);
                  } else {
                    reject(`No product_categories found with name ${el}, cannot modify ${prod.product_name}`);
                  }
                }
              } 
              // else if (key == "relatedProduct") {
              //   temp[key] = [];
              //   let arr = prod.relatedProduct.split(",\n");
              //   for (const el of arr) {
              //     let doc = await table.aggregate([{ $match: { product_name: el } }, { $project: { product_name: 1 } }]);
              //     // console.log("%%%%%%", doc);
              //     if (doc.length > 0 && doc[0]._id) {
              //       temp[key].push({ product_id: doc[0]._id });
              //     } else {
              //       reject(`No related product found with name ${el}, cannot modify ${prod.product_name}`);
              //     }
              //   }
              // } 
              else if (
                [
                  "configurableData",
                  "groupData",
                  "simpleData",
                  "preOrderQty",
                  "preOrderBookQty",
                  "preOrderRemainQty",
                  "reviews",
                  "ratings",
                  "reviewsCount",
                  "ratingsCount",
                  "attribute_group",
                  "productQuantity",
                  "bookingQuantity",
                  "availableQuantity",
                  "lostQuantity",
                  "returnQuantity",
                  "inhouseQuantity",
                  "relatedRecipes",
                  "TypeOfProduct",
                ].includes(key)
              ) {
                // do nothing
                // console.log("skipped key ::: ", key);
              } else {
                temp[key] = prod[key] == "false" || prod[key] == "true" ? JSON.parse(prod[key]) : prod[key];
              }
            }

            // console.log("========", temp);

            // update the row
            let updated = await table.updateOne({ _id: mongoose.Types.ObjectId(temp._id) }, { $set: temp });
            resolve(`updated ${temp.product_name}`);
          }
        } catch (err) {
          console.log(err);
          reject(`cannot modify ${prod.product_name}`);
        }
      });
      promiseArr.push(p);
    }

    Promise.allSettled(promiseArr)
      .then((results) => {
        //console.log("resultsresults", results);
        return res.status(200).json({
          status: "ok",
          // msg: "ok",
          data: results,
          code: 0,
        });
      })
      .catch((errors) => {
        //console.log("errorserrors", errors);
        return res.status(500).json({
          status: "error",
          msg: "Something went wrong",
          code: 1,
        });
      });
  });
};

module.exports.exportSampleXls = async (req, res) => {
  let settings = await settingsModel.findOne({}).lean();
  let apiUrl = settings.apilink;
  let data = await table
    .aggregate([
      // { $match: { product_name: "1_TEST product1" } },

      // For Populating nested keys inside nested array of objects
      ...[
        // inside simpleData array
        ...[
          // { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
          // {
          //   $lookup: {
          //     from: "regions",
          //     foreignField: "_id",
          //     localField: "simpleData.region",
          //     as: "simpleData.region",
          //   },
          // },
          // { $unwind: { path: "$simpleData.region", preserveNullAndEmptyArrays: true } },
          // {
          //   $unset: ["simpleData.region.stateData", "simpleData.region.__v", "simpleData.region.created_at"],
          // },
          // {
          //   $lookup: {
          //     from: "packages",
          //     foreignField: "_id",
          //     localField: "simpleData.package",
          //     as: "simpleData.package",
          //   },
          // },
          // {
          //   $addFields: {
          //     "simpleData.package": {
          //       $filter: {
          //         input: "$simpleData.package",
          //         as: "item",
          //         cond: { $eq: ["$$item.status", true] },
          //       },
          //     },
          //     "simpleData.availableQuantity": "$availableQuantity",
          //   },
          // },
          // {
          //   $group: {
          //     _id: "$_id",
          //     product_name: { $first: "$product_name" },
          //     images: { $first: "$images" },
          //     simpleData: { $push: "$simpleData" },
          //     configurableData: { $first: "$configurableData" },
          //     groupData: { $first: "$groupData" },
          //     base_price: { $first: "$base_price" },
          //     slug: { $first: "$slug" },
          //     TypeOfProduct: { $first: "$TypeOfProduct" },
          //     outOfStock: { $first: "$outOfStock" },
          //     availableQuantity: { $first: "$availableQuantity" },
          //     productSubscription: { $first: "$productSubscription" },
          //     preOrder: { $first: "$preOrder" },
          //     preOrderQty: { $first: "$preOrderQty" },
          //     preOrderBookQty: { $first: "$preOrderBookQty" },
          //     preOrderRemainQty: { $first: "$preOrderRemainQty" },
          //     preOrderStartDate: { $first: "$preOrderStartDate" },
          //     preOrderEndDate: { $first: "$preOrderEndDate" },
          //     sameDayDelivery: { $first: "$sameDayDelivery" },
          //     farmPickup: { $first: "$farmPickup" },
          //     priority: { $first: "$priority" },
          //     status: { $first: "$status" },
          //     showstatus: { $first: "$showstatus" },
          //     ratings: { $first: "$ratings" },
          //     ratingsCount: { $first: "$ratingsCount" },
          //     reviews: { $first: "$reviews" },
          //     reviewsCount: { $first: "$reviewsCount" },
          //     unitMeasurement: { $first: "$unitMeasurement" },
          //     salesTaxOutSide: { $first: "$salesTaxOutSide" },
          //     salesTaxWithIn: { $first: "$salesTaxWithIn" },
          //     purchaseTax: { $first: "$purchaseTax" },
          //     relatedProduct: { $first: "$relatedProduct" },
          //     product_categories: { $first: "$product_categories" },
          //   },
          // },
          // {
          //   $addFields: {
          //     simpleData: {
          //       $filter: {
          //         input: "$simpleData",
          //         as: "sd",
          //         cond: { $eq: ["$$sd.region._id", mongoose.Types.ObjectId(region_id)] },
          //       },
          //     },
          //   },
          // },
        ],

        // inside groupData array
        ...[
          // { $unwind: { path: "$groupData", preserveNullAndEmptyArrays: true } },
          // { $unwind: { path: "$groupData.sets", preserveNullAndEmptyArrays: true } },
          // // { $sort: { "groupData.sets.priority": 1 } },
          // {
          //   $lookup: {
          //     from: "packages",
          //     foreignField: "_id",
          //     localField: "groupData.sets.package",
          //     as: "groupData.sets.package",
          //   },
          // },
          // { $unwind: { path: "$groupData.sets.package", preserveNullAndEmptyArrays: true } },
          // // *************************************************************************************************************
          // // Starting of code for populating Inner Product of Group Product
          // // *************************************************************************************************************
          // {
          //   $lookup: {
          //     from: "products",
          //     let: { product_id: "$groupData.sets.product" },
          //     pipeline: [
          //       { $match: { $expr: { $eq: ["$$product_id", "$_id"] } } },
          //       // For adding quantity keys
          //       ...[
          //         {
          //           $lookup: {
          //             from: "inventory_items",
          //             let: { product_id: "$_id" },
          //             pipeline: [
          //               {
          //                 $match: {
          //                   $expr: {
          //                     $and: [
          //                       { $eq: ["$product_id", "$$product_id"] },
          //                       {
          //                         $eq: ["$region", mongoose.Types.ObjectId(region_id)],
          //                       },
          //                     ],
          //                   },
          //                 },
          //               },
          //               {
          //                 $group: {
          //                   _id: null,
          //                   productQuantity: { $sum: "$productQuantity" },
          //                   bookingQuantity: { $sum: "$bookingQuantity" },
          //                   availableQuantity: { $sum: "$availableQuantity" },
          //                   lostQuantity: { $sum: "$lostQuantity" },
          //                   returnQuantity: { $sum: "$returnQuantity" },
          //                   inhouseQuantity: { $sum: "$inhouseQuantity" },
          //                 },
          //               },
          //               { $project: { _id: 0 } },
          //             ],
          //             as: "inventories",
          //           },
          //         },
          //         {
          //           $unwind: {
          //             path: "$inventories",
          //             preserveNullAndEmptyArrays: true,
          //           },
          //         },
          //         {
          //           $addFields: {
          //             productQuantity: {
          //               $ifNull: [{ $toDouble: "$inventories.productQuantity" }, 0],
          //             },
          //             bookingQuantity: {
          //               $ifNull: [{ $toDouble: "$inventories.bookingQuantity" }, 0],
          //             },
          //             availableQuantity: {
          //               $ifNull: [{ $toDouble: "$inventories.availableQuantity" }, 0],
          //             },
          //             lostQuantity: { $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0] },
          //             returnQuantity: {
          //               $ifNull: [{ $toDouble: "$inventories.returnQuantity" }, 0],
          //             },
          //             inhouseQuantity: {
          //               $ifNull: [{ $toDouble: "$inventories.inhouseQuantity" }, 0],
          //             },
          //           },
          //         },
          //         {
          //           $addFields: {
          //             outOfStock: {
          //               $cond: [{ $eq: ["$TypeOfProduct", "simple"] }, { $lte: ["$availableQuantity", 0] }, false],
          //             },
          //           },
          //         },
          //       ],
          //       {
          //         $addFields: {
          //           simpleData: {
          //             $ifNull: ["$simpleData", []],
          //           },
          //           configurableData: {
          //             $ifNull: ["$configurableData", []],
          //           },
          //           groupData: {
          //             $ifNull: ["$groupData", []],
          //           },
          //         },
          //       },
          //       // inside simpleData array
          //       ...[
          //         { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
          //         {
          //           $lookup: {
          //             from: "packages",
          //             foreignField: "_id",
          //             localField: "simpleData.package",
          //             as: "simpleData.package",
          //           },
          //         },
          //         {
          //           $addFields: {
          //             "simpleData.availableQuantity": "$availableQuantity",
          //           },
          //         },
          //         {
          //           $group: {
          //             _id: "$_id",
          //             product_name: { $first: "$product_name" },
          //             images: { $first: "$images" },
          //             simpleData: { $push: "$simpleData" },
          //             configurableData: { $first: "$configurableData" },
          //             groupData: { $first: "$groupData" },
          //             base_price: { $first: "$base_price" },
          //             slug: { $first: "$slug" },
          //             TypeOfProduct: { $first: "$TypeOfProduct" },
          //             outOfStock: { $first: "$outOfStock" },
          //             availableQuantity: { $first: "$availableQuantity" },
          //             productSubscription: { $first: "$productSubscription" },
          //             preOrder: { $first: "$preOrder" },
          //             preOrderQty: { $first: "$preOrderQty" },
          //             preOrderBookQty: { $first: "$preOrderBookQty" },
          //             preOrderRemainQty: { $first: "$preOrderRemainQty" },
          //             preOrderStartDate: { $first: "$preOrderStartDate" },
          //             preOrderEndDate: { $first: "$preOrderEndDate" },
          //             sameDayDelivery: { $first: "$sameDayDelivery" },
          //             farmPickup: { $first: "$farmPickup" },
          //             priority: { $first: "$priority" },
          //             status: { $first: "$status" },
          //             showstatus: { $first: "$showstatus" },
          //             ratings: { $first: "$ratings" },
          //             ratingsCount: { $first: "$ratingsCount" },
          //             reviews: { $first: "$reviews" },
          //             reviewsCount: { $first: "$reviewsCount" },
          //             unitMeasurement: { $first: "$unitMeasurement" },
          //             salesTaxOutSide: { $first: "$salesTaxOutSide" },
          //             salesTaxWithIn: { $first: "$salesTaxWithIn" },
          //             purchaseTax: { $first: "$purchaseTax" },
          //             product_categories: { $first: "$product_categories" },
          //           },
          //         },
          //         {
          //           $addFields: {
          //             simpleData: {
          //               $filter: {
          //                 input: "$simpleData",
          //                 as: "sd",
          //                 cond: { $eq: [{ $toString: "$$sd.region" }, { $toString: region_id }] },
          //               },
          //             },
          //           },
          //         },
          //         {
          //           $addFields: {
          //             soldInRegion: {
          //               $cond: [{ $gt: [{ $size: "$simpleData" }, 0] }, true, false],
          //               // $size: "$simpleData",
          //             },
          //           },
          //         },
          //       ],
          //       // For populating other small keys
          //       ...[
          //         {
          //           $lookup: {
          //             from: "unit_measurements",
          //             localField: "unitMeasurement",
          //             foreignField: "_id",
          //             as: "unitMeasurement",
          //           },
          //         },
          //         { $unwind: { path: "$unitMeasurement", preserveNullAndEmptyArrays: true } },
          //         {
          //           $lookup: {
          //             from: "taxs",
          //             localField: "salesTaxOutSide",
          //             foreignField: "_id",
          //             as: "salesTaxOutSide",
          //           },
          //         },
          //         { $unwind: { path: "$salesTaxOutSide", preserveNullAndEmptyArrays: true } },
          //         {
          //           $lookup: {
          //             from: "taxs",
          //             localField: "salesTaxWithIn",
          //             foreignField: "_id",
          //             as: "salesTaxWithIn",
          //           },
          //         },
          //         { $unwind: { path: "$salesTaxWithIn", preserveNullAndEmptyArrays: true } },
          //         {
          //           $lookup: {
          //             from: "taxs",
          //             localField: "purchaseTax",
          //             foreignField: "_id",
          //             as: "purchaseTax",
          //           },
          //         },
          //         { $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true } },
          //       ],
          //     ],
          //     as: "groupData.sets.product",
          //   },
          // },
          // { $unwind: { path: "$groupData.sets.product", preserveNullAndEmptyArrays: true } },
          // // *************************************************************************************************************
          // // Ending of code for populating Inner Product of Group Product
          // // *************************************************************************************************************
          // // { $sort: { "groupData.sets.priority": 1, "groupData.sets.product.product_name": 1 } },
          // {
          //   $group: {
          //     _id: "$_id",
          //     product_name: { $first: "$product_name" },
          //     images: { $first: "$images" },
          //     simpleData: { $first: "$simpleData" },
          //     configurableData: { $first: "$configurableData" },
          //     groupData: { $push: "$groupData" },
          //     base_price: { $first: "$base_price" },
          //     slug: { $first: "$slug" },
          //     TypeOfProduct: { $first: "$TypeOfProduct" },
          //     outOfStock: { $first: "$outOfStock" },
          //     availableQuantity: { $first: "$availableQuantity" },
          //     productSubscription: { $first: "$productSubscription" },
          //     preOrder: { $first: "$preOrder" },
          //     preOrderQty: { $first: "$preOrderQty" },
          //     preOrderBookQty: { $first: "$preOrderBookQty" },
          //     preOrderRemainQty: { $first: "$preOrderRemainQty" },
          //     preOrderStartDate: { $first: "$preOrderStartDate" },
          //     preOrderEndDate: { $first: "$preOrderEndDate" },
          //     sameDayDelivery: { $first: "$sameDayDelivery" },
          //     farmPickup: { $first: "$farmPickup" },
          //     priority: { $first: "$priority" },
          //     status: { $first: "$status" },
          //     showstatus: { $first: "$showstatus" },
          //     ratings: { $first: "$ratings" },
          //     ratingsCount: { $first: "$ratingsCount" },
          //     reviews: { $first: "$reviews" },
          //     reviewsCount: { $first: "$reviewsCount" },
          //     unitMeasurement: { $first: "$unitMeasurement" },
          //     salesTaxOutSide: { $first: "$salesTaxOutSide" },
          //     salesTaxWithIn: { $first: "$salesTaxWithIn" },
          //     purchaseTax: { $first: "$purchaseTax" },
          //     relatedProduct: { $first: "$relatedProduct" },
          //     product_categories: { $first: "$product_categories" },
          //   },
          // },
          // // For grouping groupData.sets and
          // // For sorting inner products inside group products based on priorities
          // {
          //   $addFields: {
          //     groupData: {
          //       $function: {
          //         body: function (groupData) {
          //           let new_groupData = [];
          //           for (let gd of groupData) {
          //             if (gd.name) {
          //               let found = false;
          //               for (let new_gd of new_groupData) {
          //                 if (new_gd._id.toString() === gd._id.toString() && new_gd.name === gd.name) {
          //                   found = new_gd;
          //                 }
          //               }
          //               if (found) {
          //                 found.sets.push(gd.sets);
          //               } else {
          //                 gd.sets = [gd.sets];
          //                 new_groupData.push(gd);
          //               }
          //             }
          //           }
          //           for (const gd of new_groupData) {
          //             for (const set of gd.sets) {
          //               if (set.priority === null) {
          //                 set.priority = Infinity;
          //               }
          //             }
          //             gd.sets.sort((a, b) => a.priority - b.priority);
          //           }
          //           return new_groupData;
          //         },
          //         args: ["$groupData"],
          //         lang: "js",
          //       },
          //     },
          //   },
          // },
        ],

        // inside related products
        ...[
          { $unwind: { path: "$relatedProduct", preserveNullAndEmptyArrays: true } },
          // *************************************************************************************************************
          // Starting of code for populating related products
          // *************************************************************************************************************
          {
            $lookup: {
              from: "products",
              let: { product_id: "$relatedProduct.product_id" },
              pipeline: [
                { $match: { $expr: { $eq: ["$$product_id", "$_id"] } } },
                { $project: { product_name: 1 } },
                // // For addings category status based checks
                // ...[
                //   {
                //     $lookup: {
                //       from: "categories",
                //       foreignField: "_id",
                //       localField: "product_categories",
                //       as: "product_categories",
                //     },
                //   },
                //   {
                //     $addFields: {
                //       allCategories: {
                //         $function: {
                //           body: function (cats) {
                //             let x = [];
                //             cats.forEach((cat) => {
                //               x.push(cat._id);
                //               cat.ancestors.forEach((ancestor) => {
                //                 x.push(ancestor._id);
                //               });
                //             });
                //             return x;
                //           },
                //           args: ["$product_categories"],
                //           lang: "js",
                //         },
                //       },
                //     },
                //   },
                //   {
                //     $lookup: {
                //       from: "categories",
                //       foreignField: "_id",
                //       localField: "allCategories",
                //       as: "allCategories",
                //     },
                //   },
                //   {
                //     $addFields: {
                //       allCategoryStatus: {
                //         $function: {
                //           body: function (cats) {
                //             return cats.filter((cat) => !cat.status).length > 0 ? false : true;
                //           },
                //           args: ["$allCategories"],
                //           lang: "js",
                //         },
                //       },
                //     },
                //   },
                //   { $match: { allCategoryStatus: true } },
                // ],
                // {
                //   $addFields: {
                //     simpleData: {
                //       $ifNull: ["$simpleData", []],
                //     },
                //     configurableData: {
                //       $ifNull: ["$configurableData", []],
                //     },
                //     groupData: {
                //       $ifNull: ["$groupData", []],
                //     },
                //   },
                // },

                // // For adding quantity keys
                // ...[
                //   {
                //     $lookup: {
                //       from: "inventory_items",
                //       let: { product_id: "$_id" },
                //       pipeline: [
                //         {
                //           $match: {
                //             $expr: {
                //               $and: [
                //                 { $eq: ["$product_id", "$$product_id"] },
                //                 {
                //                   $eq: ["$region", mongoose.Types.ObjectId(region_id)],
                //                 },
                //               ],
                //             },
                //           },
                //         },
                //         {
                //           $group: {
                //             _id: null,
                //             productQuantity: { $sum: "$productQuantity" },
                //             bookingQuantity: { $sum: "$bookingQuantity" },
                //             availableQuantity: { $sum: "$availableQuantity" },
                //             lostQuantity: { $sum: "$lostQuantity" },
                //             returnQuantity: { $sum: "$returnQuantity" },
                //             inhouseQuantity: { $sum: "$inhouseQuantity" },
                //           },
                //         },
                //         { $project: { _id: 0 } },
                //       ],
                //       as: "inventories",
                //     },
                //   },
                //   {
                //     $unwind: {
                //       path: "$inventories",
                //       preserveNullAndEmptyArrays: true,
                //     },
                //   },
                //   {
                //     $addFields: {
                //       productQuantity: {
                //         $ifNull: [{ $toDouble: "$inventories.productQuantity" }, 0],
                //       },
                //       bookingQuantity: {
                //         $ifNull: [{ $toDouble: "$inventories.bookingQuantity" }, 0],
                //       },
                //       availableQuantity: {
                //         $ifNull: [{ $toDouble: "$inventories.availableQuantity" }, 0],
                //       },
                //       lostQuantity: { $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0] },
                //       returnQuantity: {
                //         $ifNull: [{ $toDouble: "$inventories.returnQuantity" }, 0],
                //       },
                //       inhouseQuantity: {
                //         $ifNull: [{ $toDouble: "$inventories.inhouseQuantity" }, 0],
                //       },
                //     },
                //   },
                //   {
                //     $addFields: {
                //       outOfStock: {
                //         $cond: [{ $eq: ["$TypeOfProduct", "simple"] }, { $lte: ["$availableQuantity", 0] }, false],
                //       },
                //     },
                //   },
                // ],

                // // For adding ratings and reviews keys
                // ...[
                //   {
                //     $lookup: {
                //       from: "ratingreviews",
                //       let: { product_id: "$_id" },
                //       pipeline: [
                //         { $match: { $expr: { $eq: ["$product_id", "$$product_id"] } } },
                //         {
                //           $group: {
                //             _id: null,
                //             ratingsCount: { $sum: 1 },
                //             ratingsSum: { $sum: "$rating" },
                //             ratingsArray: { $push: "$rating" },
                //             reviewArray: { $push: "$review" },
                //           },
                //         },
                //       ],
                //       as: "ratingreviews",
                //     },
                //   },
                //   { $unwind: { path: "$ratingreviews", preserveNullAndEmptyArrays: true } },
                //   {
                //     $addFields: {
                //       ratings: {
                //         $round: [
                //           {
                //             $divide: ["$ratingreviews.ratingsSum", "$ratingreviews.ratingsCount"],
                //           },
                //           1,
                //         ],
                //       },
                //       reviews: {
                //         $filter: {
                //           input: "$ratingreviews.reviewArray",
                //           as: "review",
                //           cond: { $ne: ["$$review", ""] },
                //         },
                //       },
                //       ratingsCount: "$ratingreviews.ratingsCount",
                //     },
                //   },
                //   {
                //     $addFields: {
                //       reviewsCount: {
                //         $cond: {
                //           if: { $isArray: "$reviews" },
                //           then: { $size: "$reviews" },
                //           else: 0,
                //         },
                //       },
                //     },
                //   },
                // ],

                // // For Populating nested keys inside nested array of objects
                // ...[
                //   // inside simpleData array
                //   ...[
                //     { $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true } },
                //     {
                //       $lookup: {
                //         from: "regions",
                //         foreignField: "_id",
                //         localField: "simpleData.region",
                //         as: "simpleData.region",
                //       },
                //     },
                //     { $unwind: { path: "$simpleData.region", preserveNullAndEmptyArrays: true } },
                //     {
                //       $unset: ["simpleData.region.stateData", "simpleData.region.__v", "simpleData.region.created_at"],
                //     },
                //     {
                //       $lookup: {
                //         from: "packages",
                //         foreignField: "_id",
                //         localField: "simpleData.package",
                //         as: "simpleData.package",
                //       },
                //     },
                //     {
                //       $addFields: {
                //         "simpleData.package": {
                //           $filter: {
                //             input: "$simpleData.package",
                //             as: "item",
                //             cond: { $eq: ["$$item.status", true] },
                //           },
                //         },
                //         "simpleData.availableQuantity": "$availableQuantity",
                //       },
                //     },
                //     {
                //       $group: {
                //         _id: "$_id",
                //         product_name: { $first: "$product_name" },
                //         images: { $first: "$images" },
                //         simpleData: { $push: "$simpleData" },
                //         configurableData: { $first: "$configurableData" },
                //         groupData: { $first: "$groupData" },
                //         base_price: { $first: "$base_price" },
                //         slug: { $first: "$slug" },
                //         TypeOfProduct: { $first: "$TypeOfProduct" },
                //         outOfStock: { $first: "$outOfStock" },
                //         availableQuantity: { $first: "$availableQuantity" },
                //         productSubscription: { $first: "$productSubscription" },
                //         preOrder: { $first: "$preOrder" },
                //         preOrderQty: { $first: "$preOrderQty" },
                //         preOrderBookQty: { $first: "$preOrderBookQty" },
                //         preOrderRemainQty: { $first: "$preOrderRemainQty" },
                //         preOrderStartDate: { $first: "$preOrderStartDate" },
                //         preOrderEndDate: { $first: "$preOrderEndDate" },
                //         sameDayDelivery: { $first: "$sameDayDelivery" },
                //         farmPickup: { $first: "$farmPickup" },
                //         priority: { $first: "$priority" },
                //         status: { $first: "$status" },
                //         showstatus: { $first: "$showstatus" },
                //         ratings: { $first: "$ratings" },
                //         ratingsCount: { $first: "$ratingsCount" },
                //         reviews: { $first: "$reviews" },
                //         reviewsCount: { $first: "$reviewsCount" },
                //         unitMeasurement: { $first: "$unitMeasurement" },
                //         salesTaxOutSide: { $first: "$salesTaxOutSide" },
                //         salesTaxWithIn: { $first: "$salesTaxWithIn" },
                //         purchaseTax: { $first: "$purchaseTax" },
                //         relatedProduct: { $first: "$relatedProduct" },
                //         product_categories: { $first: "$product_categories" },
                //       },
                //     },
                //     {
                //       $addFields: {
                //         simpleData: {
                //           $filter: {
                //             input: "$simpleData",
                //             as: "sd",
                //             cond: {
                //               $eq: ["$$sd.region._id", mongoose.Types.ObjectId(region_id)],
                //             },
                //           },
                //         },
                //       },
                //     },
                //   ],

                //   // inside groupData array
                //   ...[
                //     { $unwind: { path: "$groupData", preserveNullAndEmptyArrays: true } },
                //     { $unwind: { path: "$groupData.sets", preserveNullAndEmptyArrays: true } },
                //     // { $sort: { "groupData.sets.priority": 1 } },
                //     {
                //       $lookup: {
                //         from: "packages",
                //         foreignField: "_id",
                //         localField: "groupData.sets.package",
                //         as: "groupData.sets.package",
                //       },
                //     },
                //     {
                //       $unwind: {
                //         path: "$groupData.sets.package",
                //         preserveNullAndEmptyArrays: true,
                //       },
                //     },

                //     // *************************************************************************************************************
                //     // Starting of code for populating Inner Product of Group Product in " related products "
                //     // *************************************************************************************************************
                //     {
                //       $lookup: {
                //         from: "products",
                //         let: { product_id: "$groupData.sets.product" },
                //         pipeline: [
                //           { $match: { $expr: { $eq: ["$$product_id", "$_id"] } } },
                //           // For adding quantity keys
                //           ...[
                //             {
                //               $lookup: {
                //                 from: "inventory_items",
                //                 let: { product_id: "$_id" },
                //                 pipeline: [
                //                   {
                //                     $match: {
                //                       $expr: {
                //                         $and: [
                //                           { $eq: ["$product_id", "$$product_id"] },
                //                           {
                //                             $eq: ["$region", mongoose.Types.ObjectId(region_id)],
                //                           },
                //                         ],
                //                       },
                //                     },
                //                   },
                //                   {
                //                     $group: {
                //                       _id: null,
                //                       productQuantity: { $sum: "$productQuantity" },
                //                       bookingQuantity: { $sum: "$bookingQuantity" },
                //                       availableQuantity: { $sum: "$availableQuantity" },
                //                       lostQuantity: { $sum: "$lostQuantity" },
                //                       returnQuantity: { $sum: "$returnQuantity" },
                //                       inhouseQuantity: { $sum: "$inhouseQuantity" },
                //                     },
                //                   },
                //                   { $project: { _id: 0 } },
                //                 ],
                //                 as: "inventories",
                //               },
                //             },
                //             {
                //               $unwind: {
                //                 path: "$inventories",
                //                 preserveNullAndEmptyArrays: true,
                //               },
                //             },
                //             {
                //               $addFields: {
                //                 productQuantity: {
                //                   $ifNull: [{ $toDouble: "$inventories.productQuantity" }, 0],
                //                 },
                //                 bookingQuantity: {
                //                   $ifNull: [{ $toDouble: "$inventories.bookingQuantity" }, 0],
                //                 },
                //                 availableQuantity: {
                //                   $ifNull: [{ $toDouble: "$inventories.availableQuantity" }, 0],
                //                 },
                //                 lostQuantity: {
                //                   $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0],
                //                 },
                //                 returnQuantity: {
                //                   $ifNull: [{ $toDouble: "$inventories.returnQuantity" }, 0],
                //                 },
                //                 inhouseQuantity: {
                //                   $ifNull: [{ $toDouble: "$inventories.inhouseQuantity" }, 0],
                //                 },
                //               },
                //             },
                //             {
                //               $addFields: {
                //                 outOfStock: {
                //                   $cond: [{ $eq: ["$TypeOfProduct", "simple"] }, { $lte: ["$availableQuantity", 0] }, false],
                //                 },
                //               },
                //             },
                //           ],

                //           {
                //             $addFields: {
                //               simpleData: {
                //                 $ifNull: ["$simpleData", []],
                //               },
                //               configurableData: {
                //                 $ifNull: ["$configurableData", []],
                //               },
                //               groupData: {
                //                 $ifNull: ["$groupData", []],
                //               },
                //             },
                //           },

                //           // inside simpleData array
                //           ...[
                //             {
                //               $unwind: { path: "$simpleData", preserveNullAndEmptyArrays: true },
                //             },
                //             {
                //               $lookup: {
                //                 from: "packages",
                //                 foreignField: "_id",
                //                 localField: "simpleData.package",
                //                 as: "simpleData.package",
                //               },
                //             },
                //             {
                //               $addFields: {
                //                 "simpleData.availableQuantity": "$availableQuantity",
                //               },
                //             },
                //             {
                //               $group: {
                //                 _id: "$_id",
                //                 product_name: { $first: "$product_name" },
                //                 images: { $first: "$images" },
                //                 simpleData: { $push: "$simpleData" },
                //                 configurableData: { $first: "$configurableData" },
                //                 groupData: { $first: "$groupData" },
                //                 base_price: { $first: "$base_price" },
                //                 slug: { $first: "$slug" },
                //                 TypeOfProduct: { $first: "$TypeOfProduct" },
                //                 outOfStock: { $first: "$outOfStock" },
                //                 availableQuantity: { $first: "$availableQuantity" },
                //                 productSubscription: { $first: "$productSubscription" },
                //                 preOrder: { $first: "$preOrder" },
                //                 preOrderQty: { $first: "$preOrderQty" },
                //                 preOrderBookQty: { $first: "$preOrderBookQty" },
                //                 preOrderRemainQty: { $first: "$preOrderRemainQty" },
                //                 preOrderStartDate: { $first: "$preOrderStartDate" },
                //                 preOrderEndDate: { $first: "$preOrderEndDate" },
                //                 sameDayDelivery: { $first: "$sameDayDelivery" },
                //                 farmPickup: { $first: "$farmPickup" },
                //                 priority: { $first: "$priority" },
                //                 status: { $first: "$status" },
                //                 showstatus: { $first: "$showstatus" },
                //                 ratings: { $first: "$ratings" },
                //                 ratingsCount: { $first: "$ratingsCount" },
                //                 reviews: { $first: "$reviews" },
                //                 reviewsCount: { $first: "$reviewsCount" },
                //                 unitMeasurement: { $first: "$unitMeasurement" },
                //                 salesTaxOutSide: { $first: "$salesTaxOutSide" },
                //                 salesTaxWithIn: { $first: "$salesTaxWithIn" },
                //                 purchaseTax: { $first: "$purchaseTax" },
                //                 product_categories: { $first: "$product_categories" },
                //               },
                //             },
                //             {
                //               $addFields: {
                //                 simpleData: {
                //                   $filter: {
                //                     input: "$simpleData",
                //                     as: "sd",
                //                     cond: {
                //                       $eq: [{ $toString: "$$sd.region" }, { $toString: region_id }],
                //                     },
                //                   },
                //                 },
                //               },
                //             },
                //             {
                //               $addFields: {
                //                 soldInRegion: {
                //                   $cond: [{ $gt: [{ $size: "$simpleData" }, 0] }, true, false],
                //                   // $size: "$simpleData",
                //                 },
                //               },
                //             },
                //           ],

                //           // For populating other small keys
                //           ...[
                //             {
                //               $lookup: {
                //                 from: "unit_measurements",
                //                 localField: "unitMeasurement",
                //                 foreignField: "_id",
                //                 as: "unitMeasurement",
                //               },
                //             },
                //             {
                //               $unwind: {
                //                 path: "$unitMeasurement",
                //                 preserveNullAndEmptyArrays: true,
                //               },
                //             },

                //             {
                //               $lookup: {
                //                 from: "taxs",
                //                 localField: "salesTaxOutSide",
                //                 foreignField: "_id",
                //                 as: "salesTaxOutSide",
                //               },
                //             },
                //             {
                //               $unwind: {
                //                 path: "$salesTaxOutSide",
                //                 preserveNullAndEmptyArrays: true,
                //               },
                //             },

                //             {
                //               $lookup: {
                //                 from: "taxs",
                //                 localField: "salesTaxWithIn",
                //                 foreignField: "_id",
                //                 as: "salesTaxWithIn",
                //               },
                //             },
                //             {
                //               $unwind: {
                //                 path: "$salesTaxWithIn",
                //                 preserveNullAndEmptyArrays: true,
                //               },
                //             },

                //             {
                //               $lookup: {
                //                 from: "taxs",
                //                 localField: "purchaseTax",
                //                 foreignField: "_id",
                //                 as: "purchaseTax",
                //               },
                //             },
                //             {
                //               $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true },
                //             },
                //           ],
                //         ],
                //         as: "groupData.sets.product",
                //       },
                //     },
                //     {
                //       $unwind: {
                //         path: "$groupData.sets.product",
                //         preserveNullAndEmptyArrays: true,
                //       },
                //     },
                //     // *************************************************************************************************************
                //     // Ending of code for populating Inner Product of Group Product
                //     // *************************************************************************************************************
                //     // { $sort: { "groupData.sets.priority": 1, "groupData.sets.product.product_name": 1 } },
                //     {
                //       $group: {
                //         _id: "$_id",
                //         product_name: { $first: "$product_name" },
                //         images: { $first: "$images" },
                //         simpleData: { $first: "$simpleData" },
                //         configurableData: { $first: "$configurableData" },
                //         groupData: { $push: "$groupData" },
                //         base_price: { $first: "$base_price" },
                //         slug: { $first: "$slug" },
                //         TypeOfProduct: { $first: "$TypeOfProduct" },
                //         outOfStock: { $first: "$outOfStock" },
                //         availableQuantity: { $first: "$availableQuantity" },
                //         productSubscription: { $first: "$productSubscription" },
                //         preOrder: { $first: "$preOrder" },
                //         preOrderQty: { $first: "$preOrderQty" },
                //         preOrderBookQty: { $first: "$preOrderBookQty" },
                //         preOrderRemainQty: { $first: "$preOrderRemainQty" },
                //         preOrderStartDate: { $first: "$preOrderStartDate" },
                //         preOrderEndDate: { $first: "$preOrderEndDate" },
                //         sameDayDelivery: { $first: "$sameDayDelivery" },
                //         farmPickup: { $first: "$farmPickup" },
                //         priority: { $first: "$priority" },
                //         status: { $first: "$status" },
                //         showstatus: { $first: "$showstatus" },
                //         ratings: { $first: "$ratings" },
                //         ratingsCount: { $first: "$ratingsCount" },
                //         reviews: { $first: "$reviews" },
                //         reviewsCount: { $first: "$reviewsCount" },
                //         unitMeasurement: { $first: "$unitMeasurement" },
                //         salesTaxOutSide: { $first: "$salesTaxOutSide" },
                //         salesTaxWithIn: { $first: "$salesTaxWithIn" },
                //         purchaseTax: { $first: "$purchaseTax" },
                //         relatedProduct: { $first: "$relatedProduct" },
                //         product_categories: { $first: "$product_categories" },
                //       },
                //     },

                //     // For grouping groupData.sets and
                //     // For sorting inner products inside group products based on priorities
                //     {
                //       $addFields: {
                //         groupData: {
                //           $function: {
                //             body: function (groupData) {
                //               let new_groupData = [];
                //               for (let gd of groupData) {
                //                 if (gd.name) {
                //                   let found = false;
                //                   for (let new_gd of new_groupData) {
                //                     if (new_gd._id.toString() === gd._id.toString() && new_gd.name === gd.name) {
                //                       found = new_gd;
                //                     }
                //                   }
                //                   if (found) {
                //                     found.sets.push(gd.sets);
                //                   } else {
                //                     gd.sets = [gd.sets];
                //                     new_groupData.push(gd);
                //                   }
                //                 }
                //               }

                //               for (const gd of new_groupData) {
                //                 for (const set of gd.sets) {
                //                   if (set.priority === null) {
                //                     set.priority = Infinity;
                //                   }
                //                 }
                //                 gd.sets.sort((a, b) => a.priority - b.priority);
                //               }

                //               return new_groupData;
                //             },
                //             args: ["$groupData"],
                //             lang: "js",
                //           },
                //         },
                //       },
                //     },
                //   ],
                // ],

                // // For populating other small keys
                // ...[
                //   {
                //     $lookup: {
                //       from: "unit_measurements",
                //       localField: "unitMeasurement",
                //       foreignField: "_id",
                //       as: "unitMeasurement",
                //     },
                //   },
                //   { $unwind: { path: "$unitMeasurement", preserveNullAndEmptyArrays: true } },

                //   {
                //     $lookup: {
                //       from: "taxs",
                //       localField: "salesTaxOutSide",
                //       foreignField: "_id",
                //       as: "salesTaxOutSide",
                //     },
                //   },
                //   { $unwind: { path: "$salesTaxOutSide", preserveNullAndEmptyArrays: true } },

                //   {
                //     $lookup: {
                //       from: "taxs",
                //       localField: "salesTaxWithIn",
                //       foreignField: "_id",
                //       as: "salesTaxWithIn",
                //     },
                //   },
                //   { $unwind: { path: "$salesTaxWithIn", preserveNullAndEmptyArrays: true } },

                //   {
                //     $lookup: {
                //       from: "taxs",
                //       localField: "purchaseTax",
                //       foreignField: "_id",
                //       as: "purchaseTax",
                //     },
                //   },
                //   { $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true } },
                // ],
              ],
              as: "relatedProduct.product_id",
            },
          },
          { $unwind: { path: "$relatedProduct.product_id", preserveNullAndEmptyArrays: true } },
          // *************************************************************************************************************
          // Ending of code for populating related products in " related products "
          // *************************************************************************************************************
          {
            $group: {
              _id: "$_id",
              product_name: { $first: "$product_name" },
              admin_id: { $first: "$admin_id" },
              images: { $first: "$images" },
              simpleData: { $first: "$simpleData" },
              configurableData: { $first: "$configurableData" },
              groupData: { $first: "$groupData" },
              base_price: { $first: "$base_price" },
              TypeOfProduct: { $first: "$TypeOfProduct" },
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
              unitMeasurement: { $first: "$unitMeasurement" },
              salesTaxOutSide: { $first: "$salesTaxOutSide" },
              salesTaxWithIn: { $first: "$salesTaxWithIn" },
              purchaseTax: { $first: "$purchaseTax" },
              relatedProduct: { $push: "$relatedProduct" },
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
          {
            $addFields: {
              relatedProduct: {
                $filter: {
                  input: "$relatedProduct",
                  as: "rp",
                  cond: { $ne: [{ $size: { $objectToArray: "$$rp" } }, 0] },
                },
              },
            },
          },
        ],

        // For Product Regions array
        ...[
          { $unwind: { path: "$ProductRegion", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "regions",
              foreignField: "_id",
              localField: "ProductRegion.region_id",
              as: "ProductRegion.region_id",
            },
          },
          { $unwind: { path: "$ProductRegion.region_id", preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: "$_id",
              product_name: { $first: "$product_name" },
              admin_id: { $first: "$admin_id" },
              images: { $first: "$images" },
              simpleData: { $first: "$simpleData" },
              configurableData: { $first: "$configurableData" },
              groupData: { $first: "$groupData" },
              base_price: { $first: "$base_price" },
              slug: { $first: "$slug" },
              TypeOfProduct: { $first: "$TypeOfProduct" },
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
              ProductRegion: { $push: "$ProductRegion" },
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

        // for related recipes
        ...[
          {
            $lookup: {
              from: "blogs",
              let: { product_id: "$_id" },
              pipeline: [
                { $match: { $expr: { $in: ["$$product_id", "$relatedProduct.product_id"] } } },
                {
                  $project: {
                    blog_id: "$$ROOT",
                    _id: null,
                  },
                },
              ],
              as: "relatedRecipes",
            },
          },
        ],
      ],

      // For populating other small keys
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
          $lookup: {
            from: "admins",
            localField: "admin_id",
            foreignField: "_id",
            as: "admin_id",
          },
        },
        { $unwind: { path: "$admin_id", preserveNullAndEmptyArrays: true } },

        {
          $lookup: {
            from: "unit_measurements",
            localField: "unitMeasurement",
            foreignField: "_id",
            as: "unitMeasurement",
          },
        },
        { $unwind: { path: "$unitMeasurement", preserveNullAndEmptyArrays: true } },

        {
          $lookup: {
            from: "taxs",
            localField: "salesTaxOutSide",
            foreignField: "_id",
            as: "salesTaxOutSide",
          },
        },
        { $unwind: { path: "$salesTaxOutSide", preserveNullAndEmptyArrays: true } },

        {
          $lookup: {
            from: "taxs",
            localField: "salesTaxWithIn",
            foreignField: "_id",
            as: "salesTaxWithIn",
          },
        },
        { $unwind: { path: "$salesTaxWithIn", preserveNullAndEmptyArrays: true } },

        {
          $lookup: {
            from: "taxs",
            localField: "purchaseTax",
            foreignField: "_id",
            as: "purchaseTax",
          },
        },
        { $unwind: { path: "$purchaseTax", preserveNullAndEmptyArrays: true } },
      ],

      { $sort: { product_name: 1 } },
    ])
    .option({ serializeFunctions: true });

  var FileName = "products";
  var d = new Date();
  var n = d.getDate();
  var file_Name = FileName + "-" + (n + new Date().getMilliseconds());
  var file = file_Name + ".csv";
  var jsonData = [];
  var header = [];

  if (!data || data.length == 0) {
    return res.status(500).json({
      status: "error",
      msg: "No Products found",
      code: 1,
    });
  }

  Object.keys(data[0]).forEach((key) => {
    if (
      ![
        "configurableData",
        "groupData",
        "simpleData",
        "preOrderQty",
        "preOrderBookQty",
        "preOrderRemainQty",
        "reviews",
        "ratings",
        "reviewsCount",
        "ratingsCount",
        "attribute_group",
        "productQuantity",
        "bookingQuantity",
        "availableQuantity",
        "lostQuantity",
        "returnQuantity",
        "inhouseQuantity",
        "relatedRecipes",
        "TypeOfProduct",
      ].includes(key)
    ) {
      header.push({ id: key, title: key });
    }
  });
  data.forEach((data) => {
    let temp = {};
    Object.keys(data).forEach((key) => {
      if (["created_at", "preOrderStartDate", "preOrderEndDate"].includes(key)) {
        temp[key] = data[key] ? moment(data[key]).format("MMMM Do YYYY, h:mm:ss a") : "";
      } else if (key == "ProductRegion") {
        temp[key] = [];
        if(data.ProductRegion > 0){
          data.ProductRegion.forEach((el) => {
            temp[key].push(el.region_id.name);
          });
          temp[key] = temp[key].join(",\r\n");
        }
      } else if (key == "barcode") {
        temp[key] = [];
        if (data.barcode && Array.isArray(data.barcode && data.barcode.length > 0)) {
          data.barcode.forEach((el) => {
            temp[key].push(el);
          });
        }
        temp[key] = temp[key].join(",\r\n");
      } else if (["farmPickup", "sameDayDelivery"].includes(key)) {
        temp[key] = data[key] ? data[key].toString() : "false";
      } else if (key == "admin_id") {
        temp[key] = data[key]?.name;
      } else if (key == "priority") {
        temp[key] = data[key] == Infinity ? "unset" : data[key];
      } else if (key == "banner") {
        temp[key] = data[key] ? "https://kc.storehey.com:3003/upload/" + data[key] : data[key];
      } else if (key == "attachment") {
        temp[key] = data[key] ? "https://kc.storehey.com:3003/upload/" + data[key] : data[key];
      } else if (key == "images") {
        temp[key] = [];
        data.images.forEach((el) => {
          temp[key].push(el.image ? "https://kc.storehey.com:3003/upload/" + el.image : el.image);
        });
        temp[key] = temp[key].join(",\r\n");
      } else if (key == "salesTaxOutSide") {
        temp[key] = data[key]?.name;
      } else if (key == "salesTaxWithIn") {
        temp[key] = data[key]?.name;
      } else if (key == "purchaseTax") {
        temp[key] = data[key]?.name;
      } else if (key == "unitMeasurement") {
        temp[key] = data[key]?.name;
      } else if (key == "product_categories") {
        temp[key] = [];
        data.product_categories.forEach((el) => {
          temp[key].push(el.category_name);
        });
        temp[key] = temp[key].join(",\r\n");
      } else if (key == "relatedProduct") {
        temp[key] = [];
        data.relatedProduct.forEach((el) => {
          temp[key].push(el.product_id.product_name);
        });
        temp[key] = temp[key].join(",\r\n");
      } else if (
        [
          "configurableData",
          "groupData",
          "simpleData",
          "preOrderQty",
          "preOrderBookQty",
          "preOrderRemainQty",
          "reviews",
          "ratings",
          "reviewsCount",
          "ratingsCount",
          "attribute_group",
          "productQuantity",
          "bookingQuantity",
          "availableQuantity",
          "lostQuantity",
          "returnQuantity",
          "inhouseQuantity",
          "relatedRecipes",
          "TypeOfProduct",
        ].includes(key)
      ) {
        // do nothing
        // console.log("skipped key ::: ", key);
      } else {
        temp[key] = data[key];
      }
    });
    jsonData.push(temp);
  });

  const csvWriter = createCsvWriter({
    path: "./public/products/" + file,
    header: header,
  });

  // res.status(200).json(data);
  csvWriter
    .writeRecords(jsonData) // returns a promise
    .then(() => {
      res.status(201).json({
        message: "ok",
        data: apiUrl + "/products/" + file,
        code: 1,
      });
    })
    .catch((err) => {
      errorLogger.error(err, "\n", "\n");
      console.log(err);
    });
};
