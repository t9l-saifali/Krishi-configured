var mongoose = require("mongoose");
var table = mongoose.model("blogs");
var multer = require("multer");
var common = require("../../common.js");
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
module.exports.updatealldatabase = async (req, res) => {
  table.find({}, { _id: 1, title: 1 }).exec(function (err, data) {
    for (var i = 0; i < data.length; i++) {
      let iData = data[i];
      var slug = common.slugify(iData.title);
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
module.exports.AddOne = function (req, res) {
  upload(req, res, function (err) {
    var images = [];
    for (var j = 0; j < req.files.length; j++) {
      if (req.files[j].fieldname === "image") {
        images.push({ image: req.files[j].filename });
      }
    }
    var slug = common.slugify(req.body.title);
    table.create(
      {
        parentCat_id: JSON.parse(req.body.parentCat_id),
        title: req.body.title,
        slug: slug,
        images: images,
        banner: req.files.filter((i) => i.fieldname === "banner").map((i) => i.filename)[0],
        videoUrl: req.body.videoUrl,
        mediaLink: req.body.mediaLink,
        date: req.body.date,
        description1: req.body.description1,
        description2: req.body.description2,
        description3: req.body.description3,
        description4: req.body.description4,
        attachment: req.files.filter((i) => i.fieldname === "attachment").map((i) => i.filename)[0],
        relatedProduct: JSON.parse(req.body.relatedProduct),
        meta_title: req.body.meta_title,
        meta_keyword: req.body.meta_keyword,
        meta_desc: req.body.meta_desc,
        status: req.body.status,
        noOfServe: req.body.noOfServe,
        prepTime: req.body.prepTime,
        chefName: req.body.chefName,
        recipeIcon: req.files.filter((i) => i.fieldname === "recipeIcon").map((i) => i.filename)[0],
      },
      function (err, data) {
        if (err) {
          res.status(400).json(err);
        } else {
          res.status(201).json({ message: "ok", data: data, code: 1 });
        }
      }
    );
  });
};

module.exports.GetAll = function (req, res) {
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

  if (req.body.title) {
    var title = req.body.title;
  }
  if (req.body.parentCat_id) {
    var parentCat_id = req.body.parentCat_id;
  }
  if (req.body.status) {
    var status = req.body.status;
  }

  var DataFilter = {};
  if (title != null) {
    DataFilter["title"] = { $regex: title, $options: "i" };
  }
  if (parentCat_id != null) {
    DataFilter["parentCat_id"] = parentCat_id;
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
        .populate("parentCat_id")

        //.populate('relatedProduct.product_id')
        .populate({
          path: "relatedProduct.product_id", // populate blogs
          populate: {
            path: "unitMeasurement", // in blogs, populate comments
          },
        })
        .skip(skip)
        .limit(limit)
        .sort({ date: -1 })
        .exec(function (err, data) {
          if (err) {
            res.status(500).json(err);
          } else {
            res.status(200).json({ message: "ok", data: data, count: count, code: 1 });
          }
        });
    });
};

module.exports.GetOne = function (req, res) {
  var blog_id = req.body.blog_id;
  var region_id = req.body.RegionId;
  if (blog_id == "" || !blog_id || blog_id == undefined || blog_id == null) {
    common.formValidate("blog_id", res);
    return false;
  }

  // table
  //   .findOne({ slug: blog_id })
  //   .populate("parentCat_id")
  //   // .populate('relatedProduct.product_id')
  //   .populate({
  //     path: "relatedProduct.product_id", // populate blogs
  //     populate: [
  //       { path: "unitMeasurement" },
  //       { path: "product_categories" },
  //       // { path: "unitMeasurement" },
  //       // { path: "simpleData.region" },
  //       { path: "simpleData.package" },
  //       { path: "groupData.sets.package" },
  //       { path: "groupData.sets.product" },
  //       { path: "configurableData.region" },
  //       { path: "configurableData.attributes.attributeId" },
  //     ],
  //   })
  //   .lean()

  table
    .aggregate(
      [
        { $match: { slug: blog_id } },

        {
          $lookup: {
            from: "blog_categories",
            localField: "parentCat_id",
            foreignField: "_id",
            as: "parentCat_id",
          },
        },

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
              parentCat_id: { $first: "$parentCat_id" },
              title: { $first: "$title" },
              slug: { $first: "$slug" },
              noOfServe: { $first: "$noOfServe" },
              prepTime: { $first: "$prepTime" },
              chefName: { $first: "$chefName" },
              recipeIcon: { $first: "$recipeIcon" },
              images: { $first: "$images" },
              banner: { $first: "$banner" },
              videoUrl: { $first: "$videoUrl" },
              mediaLink: { $first: "$mediaLink" },
              date: { $first: "$date" },
              description1: { $first: "$description1" },
              description2: { $first: "$description2" },
              description3: { $first: "$description3" },
              description4: { $first: "$description4" },
              attachment: { $first: "$attachment" },
              meta_title: { $first: "$meta_title" },
              meta_keyword: { $first: "$meta_keyword" },
              meta_desc: { $first: "$meta_desc" },
              status: { $first: "$status" },
              created_at: { $first: "$created_at" },
              relatedProduct: { $push: "$relatedProduct" },
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
      async (err, data) => {
        if (err) {
          console.log(err);
          res.status(500).json(err);
        } else if (data.length == 0) {
          res.status(404).json({ error: "resource not found" });
        } else {
          data = data[0];
          // let data = { ...blogData._doc };
          // let relatedProducts = [];
          // for(let i = 0; i< blogData.relatedProduct.length; i++){
          //     let simpleData =
          // }

          // data.relatedProduct = data.relatedProduct.filter((prod) => {
          //   let noCatOff = true;
          //   for (const cat of prod.product_id.product_categories) {
          //     if (!cat.status) {
          //       noCatOff = false;
          //     }
          //   }
          //   return prod.product_id.status && prod.product_id.showstatus && noCatOff;
          // });

          // data.relatedProduct.forEach((prod) => {
          //   prod.product_id.simpleData = prod.product_id.simpleData.filter((sd) => sd.region == region_id);

          //   if (prod.product_id.simpleData[0])
          //     prod.product_id.outOfStock = prod.product_id.AvailableQuantity <= 0 || prod.product_id.simpleData[0].availQuantity <= 0;
          // });

          let youmayalsolike = [];

          for (let i = 0; i < data.parentCat_id.length; i++) {
            let cat_id = data.parentCat_id[i]._id;
            let blogsFromCat = await table
              .find({ parentCat_id: cat_id, _id: { $ne: data._id } })
              .sort({ date: -1 })
              .limit(5)
              .lean();
            let limit = 3;
            blogsFromCat.forEach((blog1) => {
              let alreadyExists = youmayalsolike.filter((blog2) => blog2._id.toString() == blog1._id.toString()).length == 0 ? false : true;
              if (!alreadyExists && limit > 0) {
                youmayalsolike.push(blog1);
                limit--;
              } else {
                // console.log("already exists so skip and dont push");
              }
            });
          }

          data.youmayalsolike = youmayalsolike;

          res.status(200).json({ message: "ok", data: data, code: 1 });
        }
      }
    )
    .option({ serializeFunctions: true });
};

module.exports.SearchBlog = function (req, res) {
  var skip = 0;
  var limit = 0;
  var maxCount = 50;
  var keyword = req.body.keyword;
  keyword = keyword.trim();

  if (keyword == "" || !keyword || keyword == undefined || keyword == null) {
    common.formValidate("keyword", res);
    return false;
  }

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

  if (keyword != null) {
    var DataFilter = {
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { description1: { $regex: keyword, $options: "i" } },
        { description2: { $regex: keyword, $options: "i" } },
        { description3: { $regex: keyword, $options: "i" } },
        { description4: { $regex: keyword, $options: "i" } },
      ],
    };
  } else {
    var DataFilter = {};
  }

  table
    .find(DataFilter)
    .count()
    .exec(function (err, count) {
      table
        .find(DataFilter)
        .populate("parentCat_id")
        .skip(skip)
        .limit(limit)
        .sort({ date: -1 })
        .exec(function (err, data) {
          if (err) {
            res.status(500).json(err);
          } else {
            res.status(200).json({ message: "ok", data: data, count: count, code: 1 });
          }
        });
    });
};

module.exports.Update = function (req, res) {
  upload(req, res, function (err) {
    var Id = req.body._id;
    var images = [];
    var banner = "";
    var attachment = "";
    var recipeIcon = "";

    if (req.body.images) {
      var oldImages = JSON.parse(req.body.images);
      if (oldImages) {
        for (var i = 0; i < oldImages.length; i++) {
          images.push({ image: oldImages[i] });
        }
      }
    }

    for (var j = 0; j < req.files.length; j++) {
      if (req.files[j].fieldname === "image") {
        images.push({ image: req.files[j].filename });
      }
      if (req.files[j].fieldname === "banner") {
        banner = req.files[j].filename;
      }
      if (req.files[j].fieldname === "attachment") {
        attachment = req.files[j].filename;
      }
      if (req.files[j].fieldname === "recipeIcon") {
        recipeIcon = req.files[j].filename;
      }
    }

    table.findById(Id).exec(function (err, data) {
      if (err) {
        res.status(404).json({ message: "err", data: err, code: 0 });
        return;
      } else if (!data) {
        res.status(404).json({ message: "id not found in the database", data: "", code: 0 });
        return;
      }

      if (banner) {
        banner = banner;
      } else {
        banner = req.body.banner;
      }

      if (attachment) {
        attachment = attachment;
      } else {
        attachment = data.attachment;
      }

      if (recipeIcon) {
        recipeIcon = recipeIcon;
      } else {
        recipeIcon = data.recipeIcon;
      }
      var slug = common.slugify(req.body.title);
      var updateData = {
        parentCat_id: JSON.parse(req.body.parentCat_id),
        title: req.body.title,
        slug: slug,
        images: images,
        banner: banner,
        videoUrl: req.body.videoUrl,
        mediaLink: req.body.mediaLink,
        date: req.body.date,
        description1: req.body.description1,
        description2: req.body.description2,
        description3: req.body.description3,
        description4: req.body.description4,
        attachment: attachment,
        meta_title: req.body.meta_title,
        meta_keyword: req.body.meta_keyword,
        meta_desc: req.body.meta_desc,
        noOfServe: req.body.noOfServe,
        prepTime: req.body.prepTime,
        chefName: req.body.chefName,
        recipeIcon: recipeIcon,
        relatedProduct: JSON.parse(req.body.relatedProduct),
      };

      table.update({ _id: Id }, { $set: updateData }, function (err, data) {
        if (err) {
          res.status(500).json({ message: "", data: err, code: 0 });
        } else {
          res.status(200).json({ message: "ok", data: "", code: 1 });
          return;
        }
      });
    });
  });
};

module.exports.DeleteOne = function (req, res) {
  var Id = req.body._id;
  table.findByIdAndRemove(Id).exec(function (err, data) {
    if (err) {
      res.status(404).json({ message: "", data: err, code: 0 });
    } else {
      res.status(200).json({ message: "ok", data: "", code: 1 });
      return;
    }
  });
};
