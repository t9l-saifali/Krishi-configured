var mongoose = require("mongoose");
var table = mongoose.model("addtocarts");
var User = mongoose.model("Users");
// var request = require("request");
var common = require("../../common");
var ProductData = mongoose.model("products");
const ObjectId = mongoose.Types.ObjectId;
const async = require("async");
const cron = require("node-cron");
var settingsModel = mongoose.model("settings");
var PackagesModel = mongoose.model("packages");

var errorLogger = common.errorLogger;

module.exports.AddOne = async function (req, res) {
  try {
    var user_id = req.body.user_id;
    {
      console.log("rrrr", user_id);
      var CartDetail = req.body.CartDetail;
      var regionID = req.body.regionID;
      var subscribe = req.body.subscribe;
      var error = {};
      if (
        regionID == "" ||
        !regionID ||
        regionID == undefined ||
        regionID == null
      ) {
        common.formValidate("regionID", res);
        return false;
      }
      if (
        subscribe === "undefined" ||
        subscribe === undefined ||
        subscribe === "" ||
        subscribe === "null" ||
        subscribe === null
      ) {
        common.formValidate("subscribe", res);
        return false;
      }

      let existingCart;

      if (!user_id) {
        existingCart = { CartDetail: [] };
      }

      existingCart = await table.findOne({
        user_id: mongoose.Types.ObjectId(user_id),
      });
      if (!existingCart) {
        existingCart = { CartDetail: [] };
      }
      let getUser = await User.findOne({ _id: user_id });

      // console.log("item in req body :::::::: ", CartDetail[0]);
      // console.log("item in cart :::::::: ", existingCart.CartDetail[0]);

      let productsToCheck = [];
      CartDetail.forEach((el) => {
        if (el.TypeOfProduct == "simple") {
          productsToCheck.push(el.product_id.toString());
        } else if (el.TypeOfProduct == "group") {
          for (let j = 0; j < el.groupData.length; j++) {
            let set = el.groupData[j];
            let setQty = 0;
            for (let k = 0; k < set.sets.length; k++) {
              let product = set.sets[k].product._id;
              productsToCheck.push(product.toString());
            }
          }
        }
      });

      // console.log("productsToCheck ==== ", productsToCheck);

      // change existing cart
      let newCartData = [];

      if (CartDetail.length > 1) {
        newCartData = CartDetail;
      } else if (CartDetail.length == 1) {
        found = false;
        newCartData = existingCart.CartDetail.map((item1) => {
          if (
            item1.TypeOfProduct == "simple" &&
            item1?.productItemId == CartDetail[0]?.productItemId &&
            item1.product_id == CartDetail[0].product_id.toString()
          ) {
            found = true;
            return CartDetail[0].qty == 0 ? null : CartDetail[0];
          } else if (item1.TypeOfProduct == "simple") {
            return {
              TypeOfProduct: item1.TypeOfProduct,
              packetLabel: item1.packetLabel,
              packet_size: item1.packet_size,
              preOrder: item1.preOrder,
              preOrderRemainQty: item1.preOrderRemainQty || null,
              price: item1.price,
              variant_name: item1.variant_name || null,
              itemDiscountPercentage: item1.itemDiscountPercentage || 0,
              itemDiscountAmount: item1.itemDiscountAmount || 0,
              groupData: [],
              productItemId: item1.productItemId,
              product_cat_id: item1.product_cat_id,
              product_categories: item1.product_categories,
              product_id: item1.product_id.toString(),
              product_name: item1.product_name || null,
              product_subCat1_id: item1.product_subCat1_id,
              qty: item1.qty,
              subscribe: item1.subscribe || null,
              totalprice: item1.totalprice,
              unitMeasurement: item1.unitMeasurement,
              without_package: item1.without_package,
            };
          } else if (
            item1.TypeOfProduct == "group" &&
            !CartDetail[0].newlyAdded &&
            item1.unique_id == CartDetail[0].unique_id &&
            item1.product_id == CartDetail[0].product_id.toString()
          ) {
            // console.log("found xxxxxxxxxxxxxxxxxxxxxxxxxxxx");
            found = true;
            return CartDetail[0].qty == 0 ? null : CartDetail[0];
          } else if (
            item1.TypeOfProduct == "group" &&
            item1.unique_id !== CartDetail[0].unique_id
          ) {
            return {
              TypeOfProduct: item1.TypeOfProduct,
              packetLabel: item1.packetLabel,
              packet_size: item1.packet_size,
              preOrder: item1.preOrder,
              preOrderRemainQty: item1.preOrderRemainQty || null,
              price: item1.price,
              variant_name: item1.variant_name || null,
              itemDiscountPercentage: item1.itemDiscountPercentage || 0,
              itemDiscountAmount: item1.itemDiscountAmount || 0,
              groupData: item1.groupData,
              productItemId: item1.productItemId,
              product_cat_id: item1.product_cat_id,
              product_categories: item1.product_categories,
              product_id: item1.product_id.toString(),
              unique_id: item1.unique_id,
              product_name: item1.product_name || null,
              product_subCat1_id: item1.product_subCat1_id,
              qty: item1.qty,
              subscribe: item1.subscribe || null,
              totalprice: item1.totalprice,
              unitMeasurement: item1.unitMeasurement,
              without_package: item1.without_package,
            };
          } 
          else if(newCartData.filter((cur)=>String(cur.product_id) == item1.product_id && cur?.variant_name == item1?.variant_name).length == 0 && CartDetail[0]?.variant_name != item1?.variant_name && item1.TypeOfProduct == "configurable"){
            return {
              TypeOfProduct: item1.TypeOfProduct,
              packetLabel: item1.packetLabel,
              packet_size: item1.packet_size,
              preOrder: item1.preOrder,
              preOrderRemainQty: item1.preOrderRemainQty || null,
              price: item1.price,
              variant_name: item1.variant_name || null,
              itemDiscountPercentage: item1.itemDiscountPercentage || 0,
              itemDiscountAmount: item1.itemDiscountAmount || 0,
              groupData: [],
              productItemId: item1.productItemId,
              product_cat_id: item1.product_cat_id,
              product_categories: item1.product_categories,
              product_id: item1.product_id.toString(),
              product_name: item1.product_name || null,
              product_subCat1_id: item1.product_subCat1_id,
              qty: item1.qty,
              subscribe: item1.subscribe || null,
              totalprice: item1.totalprice,
              unitMeasurement: item1.unitMeasurement,
              without_package: item1.without_package,
            };
          }
        });
        if (!found && CartDetail[0].qty > 0) {
          newCartData.push(CartDetail[0]);
        }
        // if(newCartData.filter((curD)=>String(curD?.product_id) == String(CartDetail[0]?.product_id) && curD?.variant_name == CartDetail[0]?.variant_name).length == 0 && CartDetail[0]?.qty > 0){
        if(newCartData.filter((curD)=>String(curD?.product_id) == String(CartDetail[0]?.product_id) && curD?.variant_name == CartDetail[0]?.variant_name).length == 0){

          newCartData.push(CartDetail[0]);
        }
      }

      newCartData = newCartData.filter((x) => x && x.qty > 0);
      newCartData = newCartData.reverse().reduce((acc, obj) => {
        // if (!acc.find(o => String(o?.product_id) == String(obj?.product_id))) {
        // // if (!acc.find(o => String(o?.product_id) == String(obj?.product_id) && o?.variant_name == obj?.variant_name)) {
        //   acc.push(obj);
        // }
        if(obj?.TypeOfProduct == "simple" || obj?.TypeOfProduct == "group"){
          acc.push(obj);
        } else if (!(acc.find(o => String(o?.product_id) == String(obj?.product_id) && o?.variant_name == obj?.variant_name) )) {
            acc.push(obj);
          }
        return acc;
      }, []);

       newCartData = newCartData.filter((x) => x && x.qty > 0);
     

      // const arr = [{id: 1}, {id: 2}, {id: 3}, {id: 1}, {id: 2}];
      
      console.log("newCartData length ==== ", newCartData.length);

      var totalCartPrice = 0;
      var CartDetailArray = [];
      var preOrderArrayTrue = [];
      var preOrderArrayFalse = [];
      var groupDataTrue = false;
      var simpleDataTrue = false;
      var configDataTrue = false;
      var subscribeItem = false;

      // console.log("existingCart.totalCartPriceexistingCart.totalCartPrice", existingCart);

      // totalCartPrice += existingCart.totalCartPrice;

      var settings = await settingsModel.findOne({}).lean();

      let simpleProductsQuantity = {};
      let configProductsQuantity = {};

      for (var i = 0; i < newCartData.length; i++) {
        var CartDetailI = newCartData[i];
        totalCartPrice += CartDetailI.totalprice;
        let productData = { preOrder: false };
        if (CartDetailI.TypeOfProduct == "configurable") {
          // console.log(
          //   "$$$$$$$$$$$",
          //   CartDetailI.product_id || CartDetailI.product_id._id,
          //   regionID,
          //   CartDetailI.variant_name
          // );
          [productData] = await ProductData.aggregate([
            {
              $match: {
                _id: mongoose.Types.ObjectId(
                  CartDetailI.product_id || CartDetailI.product_id._id
                ),
                "configurableData.region": mongoose.Types.ObjectId(regionID),
                "configurableData.variant_name": CartDetailI.variant_name,
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
                              $eq: [
                                "$region",
                                mongoose.Types.ObjectId(regionID),
                              ],
                            },
                            {
                              $eq: ["$variant_name", CartDetailI.variant_name],
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
                    $ifNull: [
                      { $toDouble: "$inventories.availableQuantity" },
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

          if (!productData) {
            return res.status(500).json({
              message: "errror",
              data: "Something went wrong",
              code: 0,
            });
          }

          var availQty = productData.availableQuantity;
          var totalQty = CartDetailI.unitQuantity * CartDetailI.qty;
          console.log("totalQty = ", totalQty, " and availQty = ", availQty);

          if (
            !configProductsQuantity[
              `${CartDetailI.product_id}__${regionID}__${CartDetailI.variant_name}`
            ]
          ) {
            configProductsQuantity[
              `${CartDetailI.product_id}__${regionID}__${CartDetailI.variant_name}`
            ] = [
              productData.product_name,
              regionID,
              availQty,
              totalQty,
              productData.unitMeasurement,
            ];
          } else {
            configProductsQuantity[
              `${CartDetailI.product_id}__${regionID}__${CartDetailI.variant_name}`
            ][2] = availQty;
            configProductsQuantity[
              `${CartDetailI.product_id}__${regionID}__${CartDetailI.variant_name}`
            ][3] += totalQty;
          }
        } else if (CartDetailI.TypeOfProduct == "simple") {
          try {
            var productItemId = CartDetailI.without_package
              ? null
              : CartDetailI.productItemId;

            [productData] = await ProductData.aggregate([
              {
                $match: {
                  _id: mongoose.Types.ObjectId(CartDetailI.product_id),
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
                              { $eq: ["$product_id", "$$product_id"] },
                              {
                                $eq: [
                                  "$region",
                                  mongoose.Types.ObjectId(regionID),
                                ],
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
                      $ifNull: [
                        { $toDouble: "$inventories.productQuantity" },
                        0,
                      ],
                    },
                    bookingQuantity: {
                      $ifNull: [
                        { $toDouble: "$inventories.bookingQuantity" },
                        0,
                      ],
                    },
                    availableQuantity: {
                      $ifNull: [
                        { $toDouble: "$inventories.availableQuantity" },
                        0,
                      ],
                    },
                    lostQuantity: {
                      $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0],
                    },
                    returnQuantity: {
                      $ifNull: [
                        { $toDouble: "$inventories.returnQuantity" },
                        0,
                      ],
                    },
                    inhouseQuantity: {
                      $ifNull: [
                        { $toDouble: "$inventories.inhouseQuantity" },
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

            if (!productData) {
              return res.status(500).json({
                message: "errror",
                data: "Something went wrong",
                code: 0,
              });
            }

            //// console.log(req.body)
            var availQty = productData.availableQuantity;
            var totalQty =
              CartDetailI.without_package === true &&
              CartDetailI.preOrder == false
                ? CartDetailI.unitQuantity * CartDetailI.qty
                : CartDetailI.packet_size * CartDetailI.qty;
            console.log("totalQty = ", totalQty, " and availQty = ", availQty);

            if (
              !simpleProductsQuantity[`${CartDetailI.product_id}__${regionID}`]
            ) {
              simpleProductsQuantity[
                `${CartDetailI.product_id}__${regionID}`
              ] = [
                productData.product_name,
                regionID,
                availQty,
                totalQty,
                productData.unitMeasurement,
              ];
            } else {
              simpleProductsQuantity[
                `${CartDetailI.product_id}__${regionID}`
              ][2] = availQty;
              simpleProductsQuantity[
                `${CartDetailI.product_id}__${regionID}`
              ][3] += totalQty;
            }

            // else if (CartDetailI.preOrder == false) {
            //   var totalQty = CartDetailI.packet_size * CartDetailI.qty;
            //   //console.log('totalQty==>',totalQty)
            //   if (totalQty > availQty) {
            //     return res.status(400).json({ message: "error", data: errorCode, code: 0 });
            //   }
            // } else if (CartDetailI.preOrder == true) {
            //   var preOrderRemainQty = productData.preOrderRemainQty == null ? 0 : productData.preOrderRemainQty;
            //   // console.log("whyyyyy ?????????", CartDetailI.qty, preOrderRemainQty)
            //   if (CartDetailI.qty > preOrderRemainQty) {
            //     var errorCode1 = "You can not add " + CartDetailI.product_name + " more than " + preOrderRemainQty;
            //     return res.status(400).json({ message: "error", data: errorCode1, code: 0 });
            //   }
            // }
          } catch (error) {
            errorLogger.error(error, "\n", "\n");
            console.log("errror", error);
          }
        } else if (
          CartDetailI.TypeOfProduct == "group" &&
          CartDetailI.preOrder == false
        ) {
          try {
            productData = await ProductData.findOne(
              { _id: CartDetailI.product_id },
              {
                _id: 0,
                preOrder: 1,
              }
            ).lean();

            for (let j = 0; j < CartDetailI.groupData.length; j++) {
              let set = CartDetailI.groupData[j];
              let setQty = 0;
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
                                  { $eq: ["$product_id", "$$product_id"] },
                                  {
                                    $eq: [
                                      "$region",
                                      mongoose.Types.ObjectId(regionID),
                                    ],
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
                          $ifNull: [
                            { $toDouble: "$inventories.productQuantity" },
                            0,
                          ],
                        },
                        bookingQuantity: {
                          $ifNull: [
                            { $toDouble: "$inventories.bookingQuantity" },
                            0,
                          ],
                        },
                        availableQuantity: {
                          $ifNull: [
                            { $toDouble: "$inventories.availableQuantity" },
                            0,
                          ],
                        },
                        lostQuantity: {
                          $ifNull: [
                            { $toDouble: "$inventories.lostQuantity" },
                            0,
                          ],
                        },
                        returnQuantity: {
                          $ifNull: [
                            { $toDouble: "$inventories.returnQuantity" },
                            0,
                          ],
                        },
                        inhouseQuantity: {
                          $ifNull: [
                            { $toDouble: "$inventories.inhouseQuantity" },
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
                  (set.sets[k].package
                    ? set.sets[k].package.packet_size
                    : set.sets[k].unitQuantity) *
                  set.sets[k].qty *
                  CartDetailI.qty;
                console.log(
                  "totalQty = ",
                  totalQty,
                  " and availQty = ",
                  availQty
                );

                if (
                  !simpleProductsQuantity[`${productData1._id}__${regionID}`]
                ) {
                  simpleProductsQuantity[`${productData1._id}__${regionID}`] = [
                    productData1.product_name,
                    regionID,
                    availQty,
                    totalQty,
                    productData1.unitMeasurement,
                  ];
                } else {
                  simpleProductsQuantity[
                    `${productData1._id}__${regionID}`
                  ][2] = availQty;
                  simpleProductsQuantity[
                    `${productData1._id}__${regionID}`
                  ][3] += totalQty;
                }
              }
            }
            // console.log("========================= 2");
          } catch (err) {
            console.log("err #:::::", err);
            errorLogger.error(err, "\n", "\n");
          }
        }

        if (CartDetailI.preOrder == true || CartDetailI.preOrder == "true") {
          preOrderArrayTrue.push(true);
        } else {
          preOrderArrayFalse.push(false);
        }

        if (CartDetailI.TypeOfProduct == "group") {
          groupDataTrue = true;
        }
        if (CartDetailI.TypeOfProduct == "simple") {
          var simpleDataTrue = true;
        }
        if (CartDetailI.TypeOfProduct == "configurable") {
          var configDataTrue = true;
        }

        console.log(
          "addToCart0 -- preorder -- ",
          CartDetailI.preOrder ?? productData.preOrder
        );

        subscribeItem = subscribe === true ? true : false;
        //subscribeItem = subscribe == true && CartDetailI.subscribe == "yes" ? true : false;
        CartDetailArray.push({
          product_id: CartDetailI.product_id,
          unique_id: CartDetailI.unique_id,
          product_cat_id: CartDetailI.product_cat_id,
          product_subCat1_id: CartDetailI.product_subCat1_id,
          product_categories: CartDetailI.product_categories,
          productItemId: productItemId,
          TypeOfProduct: CartDetailI.TypeOfProduct,
          variant_name: CartDetailI.variant_name,
          itemDiscountPercentage: CartDetailI.itemDiscountPercentage,
          itemDiscountAmount: CartDetailI.itemDiscountAmount,
          groupData: CartDetailI.groupData ? CartDetailI.groupData : [],
          packet_size: CartDetailI.packet_size,
          packetLabel: CartDetailI.packetLabel,
          qty: CartDetailI.qty,
          price: CartDetailI.price,
          unitQuantity: CartDetailI.unitQuantity,
          unitMeasurement: CartDetailI.unitMeasurement,
          without_package: CartDetailI.without_package,
          totalprice: CartDetailI.totalprice,
          status: true,
          createDate: Date(),
          preOrder: CartDetailI.preOrder ?? productData.preOrder,
          subscribe: CartDetailI.subscribe,
        });

        // console.log("========================= 3", CartDetailArray);
      }

      let allErrors = [];
      for (const key in simpleProductsQuantity) {
        if (Object.hasOwnProperty.call(simpleProductsQuantity, key)) {
          const element = simpleProductsQuantity[key];
          if (
            element[2] < element[3] &&
            productsToCheck.includes(key.split("__")[0])
          ) {
            allErrors.push(
              ` ${element[0]} more than ${element[2]} ${element[4].name}`
            );
          }
        }
      }

      for (const key in configProductsQuantity) {
        if (Object.hasOwnProperty.call(configProductsQuantity, key)) {
          const element = configProductsQuantity[key];
          if (
            element[2] < element[3] &&
            productsToCheck.includes(key.split("__")[0])
          ) {
            allErrors.push(
              ` ${element[0]} more than ${element[2]} ${element[4].name}`
            );
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

      if (preOrderArrayTrue.length > 1) {
        return res.status(400).json({
          message: "error",
          data: "you can order one preorder product at a time.",
          code: 0,
        });
      }

      var productAllowed = settings?.ProductAllowedWithPre;
      var groupShowError =
        productAllowed == "group" && groupDataTrue == true ? true : false;
      var simpleShowError =
        productAllowed == "simple" && simpleDataTrue == true ? true : false;
      var configShowError =
        productAllowed == "configurable" && configDataTrue == true
          ? true
          : false;
      var subpreBoth =
        preOrderArrayTrue && subscribeItem === true ? true : false;
      var itemBoth =
        preOrderArrayTrue.length > 0 && preOrderArrayFalse.length > 0
          ? true
          : false;
      // console.log(subpreBoth, " subpreBoth");
      // console.log(itemBoth, " itemBoth");
      if (productAllowed == "none" || productAllowed == "") {
        if (
          subpreBoth === false &&
          itemBoth === true &&
          CartDetailArray.length != preOrderArrayFalse.length &&
          CartDetailArray.length != preOrderArrayTrue.length
        ) {
          // console.log("error 11111111111111111111111111111111111111111111111111 ");
          return res.status(400).json({
            message: "error",
            data: "you can not add both item",
            code: 0,
          });
        }
      }

      if (
        subscribe === true &&
        (settings?.preOrder === true || settings?.preOrder == "true")
      ) {
        if (groupShowError || simpleShowError || configShowError) {
          // console.log("error 2222222222222222222222222222222222222 ");
          return res.status(400).json({
            message: "error",
            data: "you can not add both item",
            code: 0,
          });
        }
      }

      if (
        user_id == "" ||
        !user_id ||
        user_id == undefined ||
        user_id == null
      ) {
        // common.formValidate("user_id", res);
        // return false;
        return res.status(200).json({
          message: "ok",
          data: "user is not logged in",
          code: 1,
        });
      }

      // console.log("jjjjjjjjjfsddd", CartDetailArray);

      var jsonData = {
        user_id: req.body.user_id,
        totalCartPrice: totalCartPrice,
        regionID: regionID,
        CartDetail: CartDetailArray,
        subscribe: subscribe,
        createDate: Date(),
      };

      // return;

      table
        .findOne({ user_id: user_id })
        .exec()
        .then((getDetail) => {
          if (getDetail) {
            table.findOneAndUpdate(
              { user_id: user_id },
              { $set: jsonData },
              function (err, data) {
                if (err) {
                  console.log("err @ ", err);
                }
                table
                  .findOne({ user_id: user_id })
                  .exec()
                  .then((FindData) => {
                    if (err) {
                      res.status(500).json(err);
                    } else {
                      res.status(200).json({
                        message: "ok",
                        data: FindData,
                        alert: subpreBoth == true ? true : false,
                        code: 1,
                      });
                    }
                  });
              }
            );
          } else {
            console.log("got in here ****** ");
            table.create(jsonData, function (err, data) {
              if (err) {
                console.log("errrrrr 1111", err);
                res.status(500).json(err);
              } else {
                table
                  .aggregate(
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
                              $match: {
                                $expr: { $eq: ["$$product_id", "$_id"] },
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
                                            {
                                              $eq: [
                                                "$product_id",
                                                "$$product_id",
                                              ],
                                            },
                                            {
                                              $eq: ["$region", "$$region_id"],
                                            },
                                            {
                                              $eq: [
                                                "$variant_name",
                                                "$$variant_name",
                                              ],
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
                                        $toDouble:
                                          "$inventories.productQuantity",
                                      },
                                      0,
                                    ],
                                  },
                                  bookingQuantity: {
                                    $ifNull: [
                                      {
                                        $toDouble:
                                          "$inventories.bookingQuantity",
                                      },
                                      0,
                                    ],
                                  },
                                  availableQuantity: {
                                    $ifNull: [
                                      {
                                        $toDouble:
                                          "$inventories.availableQuantity",
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
                                        $toDouble:
                                          "$inventories.returnQuantity",
                                      },
                                      0,
                                    ],
                                  },
                                  inhouseQuantity: {
                                    $ifNull: [
                                      {
                                        $toDouble:
                                          "$inventories.inhouseQuantity",
                                      },
                                      0,
                                    ],
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
                                  $unset: [
                                    "simpleData.region.stateData",
                                    "simpleData.region.__v",
                                    "simpleData.region.created_at",
                                  ],
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
                                    "simpleData.productQuantity":
                                      "$productQuantity",
                                    "simpleData.bookingQuantity":
                                      "$bookingQuantity",
                                    "simpleData.availableQuantity":
                                      "$availableQuantity",
                                    "simpleData.lostQuantity": "$lostQuantity",
                                    "simpleData.returnQuantity":
                                      "$returnQuantity",
                                    "simpleData.inhouseQuantity":
                                      "$inhouseQuantity",
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
                                    productQuantity: {
                                      $first: "$productQuantity",
                                    },
                                    bookingQuantity: {
                                      $first: "$bookingQuantity",
                                    },
                                    availableQuantity: {
                                      $first: "$availableQuantity",
                                    },
                                    lostQuantity: { $first: "$lostQuantity" },
                                    returnQuantity: {
                                      $first: "$returnQuantity",
                                    },
                                    inhouseQuantity: {
                                      $first: "$inhouseQuantity",
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
                                    salesTaxWithIn: {
                                      $first: "$salesTaxWithIn",
                                    },
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
                                    productThreshold: {
                                      $first: "$productThreshold",
                                    },
                                    ProductRegion: { $first: "$ProductRegion" },
                                    hsnCode: { $first: "$hsnCode" },
                                    SKUCode: { $first: "$SKUCode" },
                                    unitQuantity: { $first: "$unitQuantity" },
                                    productExpiryDay: {
                                      $first: "$productExpiryDay",
                                    },
                                    attribute_group: {
                                      $first: "$attribute_group",
                                    },
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
                                    configurableData: {
                                      $first: "$configurableData",
                                    },
                                    groupData: { $push: "$groupData" },
                                    base_price: { $first: "$base_price" },
                                    slug: { $first: "$slug" },
                                    TypeOfProduct: { $first: "$TypeOfProduct" },
                                    outOfStock: { $first: "$outOfStock" },
                                    productQuantity: {
                                      $first: "$productQuantity",
                                    },
                                    bookingQuantity: {
                                      $first: "$bookingQuantity",
                                    },
                                    availableQuantity: {
                                      $first: "$availableQuantity",
                                    },
                                    lostQuantity: { $first: "$lostQuantity" },
                                    returnQuantity: {
                                      $first: "$returnQuantity",
                                    },
                                    inhouseQuantity: {
                                      $first: "$inhouseQuantity",
                                    },
                                    productSubscription: {
                                      $first: "$productSubscription",
                                    },
                                    preOrderQty: { $first: "$preOrderQty" },
                                    preOrderBookQty: {
                                      $first: "$preOrderBookQty",
                                    },
                                    preOrderRemainQty: {
                                      $first: "$preOrderRemainQty",
                                    },
                                    preOrder: { $first: "$preOrder" },
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
                                    salesTaxWithIn: {
                                      $first: "$salesTaxWithIn",
                                    },
                                    purchaseTax: { $first: "$purchaseTax" },
                                    relatedProduct: {
                                      $first: "$relatedProduct",
                                    },
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
                                    productThreshold: {
                                      $first: "$productThreshold",
                                    },
                                    ProductRegion: { $first: "$ProductRegion" },
                                    hsnCode: { $first: "$hsnCode" },
                                    SKUCode: { $first: "$SKUCode" },
                                    unitQuantity: { $first: "$unitQuantity" },
                                    productExpiryDay: {
                                      $first: "$productExpiryDay",
                                    },
                                    attribute_group: {
                                      $first: "$attribute_group",
                                    },
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
                                                if (
                                                  new_gd._id.toString() ===
                                                    gd._id.toString() &&
                                                  new_gd.name === gd.name
                                                ) {
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
                                            gd.sets.sort(
                                              (a, b) => a.priority - b.priority
                                            );
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
                    async (err, data) => {
                      if (err) {
                        console.log("errrrrr 2222", err);
                        errorLogger.error(err, "\n", "\n");
                        res.status(500).json(err);
                      } else {
                        data = data[0];
                        // console.log("-------::::::::::::::::--------- 1");
                        var CartDetailArray = [];
                        if (data.CartDetail != null) {
                          var CartDetail = data.CartDetail;
                          for (var i = 0; i < CartDetail.length; i++) {
                            // console.log("-------::::::::::::::::--------- 2");
                            var DataI = CartDetail[i];
                            var ConfigItemPush = {};
                            var SimpleItemPush = {};
                            var GroupItemPush = {};
                            if (
                              DataI.product_id === null ||
                              DataI.product_id === "null"
                            ) {
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

                              for (let j = 0; j < varItem.length; j++) {
                                const variant = varItem[j];
                                if (
                                  variant.region._id == regionID &&
                                  variant.variant_name == DataI.variant_name
                                ) {
                                  ConfigItemPush = {
                                    region: variant.region,
                                    variant_name: variant.variant_name,
                                    attributes: variant.attributes,
                                    selling_price: variant.selling_price,
                                    B2B_price: variant.B2B_price,
                                    Retail_price: variant.Retail_price,
                                    mrp: variant.mrp,
                                    ExpirationDate: variant.ExpirationDate,
                                    variantSKUcode: variant.variantSKUcode,
                                    _id: variant._id,
                                  };
                                }
                              }
                            } else if (DataI.TypeOfProduct == "simple") {
                              var SimpleData = DataI.product_id.simpleData;
                              for (var j = 0; j < SimpleData.length; j++) {
                                var SimpleDataIPackage = SimpleData[j].package;
                                for (
                                  var k = 0;
                                  k < SimpleDataIPackage.length;
                                  k++
                                ) {
                                  var packageDataI = SimpleDataIPackage[k];
                                  if (
                                    JSON.stringify(DataI.productItemId) ==
                                    JSON.stringify(packageDataI._id)
                                  ) {
                                    SimpleItemPush = {
                                      packet_size: packageDataI.packet_size,
                                      packetLabel: packageDataI.packetLabel,
                                      selling_price: packageDataI.selling_price,
                                      B2B_price: packageDataI.B2B_price,
                                      Retail_price: packageDataI.Retail_price,
                                      packetmrp: packageDataI.packetmrp,
                                      _id: packageDataI._id,
                                    };
                                  }
                                }
                              }
                            } else if (DataI.TypeOfProduct == "group") {
                              GroupItemPush = DataI.groupData;
                              // console.log("-------::::::::::::::::--------- 3");
                            }
                            CartDetailArray.push({
                              _id: DataI._id,
                              product_id: DataI.product_id,
                              product_cat_id: DataI.product_cat_id,
                              product_subCat1_id: DataI.product_subCat1_id,
                              product_categories: DataI.product_categories,
                              productItemId: DataI.productItemId,
                              TypeOfProduct: DataI.TypeOfProduct,
                              variant_name: DataI.variant_name,
                              itemDiscountPercentage:
                                DataI.itemDiscountPercentage,
                              itemDiscountAmount: DataI.itemDiscountAmount,
                              price: DataI.price,
                              qty: DataI.qty,
                              unitQuantity: DataI.unitQuantity,
                              unitMeasurement: DataI.unitMeasurement,
                              without_package: DataI.without_package,
                              totalprice: DataI.totalprice,
                              createDate: DataI.createDate,
                              status: DataI.status,
                              simpleItem: SimpleItemPush,
                              ConfigItem: ConfigItemPush,
                              groupItem: GroupItemPush,
                              preOrder: DataI.preOrder,
                              subscribe: DataI.subscribe,
                              preOrderStartDate: DataI.preOrderStartDate,
                              preOrderEndDate: DataI.preOrderEndDate,
                            });
                            // console.log("-------::::::::::::::::--------- 4");
                          }
                        }

                        DataJson = {
                          AddToCartId: data._id,
                          user_id: data.user_id,
                          totalCartPrice: data.totalCartPrice,
                          redeem_point: data.redeem_point,
                          totalcartprice: data.totalcartprice,
                          cartDetail: CartDetailArray,
                          regionID: data.regionID,
                          subscribe: data.subscribe,
                          __v: data.__v,
                        };
                        // console.log("-------::::::::::::::::--------- 5");
                        res.status(200).json({
                          message: "ok",
                          data: DataJson,
                          alert: subpreBoth === true ? true : false,
                          code: 1,
                        });
                      }
                    }
                  )
                  .option({ serializeFunctions: true });

                // res
                // .status(200)
                // .json({ "message": 'ok', "data": data,"code": 1 });
              }
            });
          }
        })
        .catch((err) => console.log("eeeeerrrrrrrrrr :: ", err));
    }
  } catch (err) {
    errorLogger.error(err, "\n", "\n");
    console.log("errrr === ", err);
  }
};

module.exports.UpdateOne = function (req, res) {
  // var user_id = req.body.user_id;

  console.log("req.body from whatsapp :::: ", req.body);

  // CartDetail = {
  //     product_id: req.body.product_id,
  //     product_cat_id: req.body.product_cat_id,
  //     product_subCat1_id: req.body.product_subCat1_id,
  //     productItemId: req.body.productItemId,
  //     TypeOfProduct: req.body.TypeOfProduct,
  //     packet_size: req.body.packet_size,
  //     packetLabel: req.body.packetLabel,
  //     qty: req.body.qty,
  //     price: req.body.price,
  //     totalprice: req.body.totalprice,
  //     status: true,
  //     createDate: Date(),
  // };

  // var jsonData = {
  //     user_id: req.body.user_id,
  //     totalCartPrice: req.body.totalCartPrice,
  //     CartDetail: CartDetail,
  // };

  // table
  //     .findOne({ user_id: user_id })
  //     .exec()
  //     .then((getDetail) => {
  //         if (getDetail) {
  //             table.findOneAndUpdate({ user_id: user_id }, { $push: { CartDetail: CartDetail } }, function (err, data) {
  //                 if (err) {
  //                     res.status(500).json(err);
  //                 } else {
  //                     res.status(200).json({ message: "ok", data: data, code: 1 });
  //                 }
  //             });
  //         } else {
  //             table.create(jsonData, function (err, data) {
  //                 if (err) {
  //                     res.status(500).json(err);
  //                 } else {
  //                     res.status(200).json({ message: "ok", data: data, code: 1 });
  //                 }
  //             });
  //         }
  //     });
};

// module.exports.GetAll = function (req, res) {
//   var user_id = req.params.user_id;
//   var dates = req.body.subscription_dates ? req.body.subscription_dates : 1;

//   User.findOne({ _id: user_id }, async (err, user) => {
//     if (err) {
//       return res.status(401).json({ msg: "User not found" });
//     } else {
//       table.aggregate(
//         [
//           { $match: { user_id: mongoose.Types.ObjectId(user_id) } },
//           { $unwind: { path: "$CartDetail", preserveNullAndEmptyArrays: true } },
//           {
//             $lookup: {
//               from: "products",
//               let: { product_id: "$CartDetail.product_id", region_id: "$regionID" },
//               pipeline: [
//                 { $match: { $expr: { $eq: ["$$product_id", "$_id"] } } },

//                 // populate product categories
//                 {
//                   $lookup: {
//                     from: "categories",
//                     foreignField: "_id",
//                     localField: "product_categories",
//                     as: "product_categories",
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
//                                   $eq: ["$region", "$$region_id"],
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
//                 ],

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
//                       "simpleData.productQuantity": "$productQuantity",
//                       "simpleData.bookingQuantity": "$bookingQuantity",
//                       "simpleData.availableQuantity": "$availableQuantity",
//                       "simpleData.lostQuantity": "$lostQuantity",
//                       "simpleData.returnQuantity": "$returnQuantity",
//                       "simpleData.inhouseQuantity": "$inhouseQuantity",
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
//               as: "CartDetail.product_id",
//             },
//           },
//           { $unwind: { path: "$CartDetail.product_id", preserveNullAndEmptyArrays: true } },
//           {
//             $group: {
//               _id: "$_id",
//               user_id: { $first: "$user_id" },
//               redeem_point: { $first: "$redeem_point" },
//               totalCartPrice: { $first: "$totalCartPrice" },
//               subscribe: { $first: "$subscribe" },
//               regionID: { $first: "$regionID" },
//               CartDetail: { $push: "$CartDetail" },
//               SubscribeDetail: { $first: "$SubscribeDetail" },
//               createDate: { $first: "$createDate" },
//             },
//           },
//           {
//             $addFields: {
//               CartDetail: {
//                 $filter: {
//                   input: "$CartDetail",
//                   as: "cd",
//                   cond: { $gt: [{ $size: { $objectToArray: "$$cd" } }, 2] },
//                 },
//               },
//             },
//           },
//         ],
//         async (err, cartData) => {
//           let AddToCartData = cartData[0];
//           if (err) {
//             errorLogger.error(err, "\n", "\n");
//             res.status(500).json(err);
//           } else if (AddToCartData == null) {
//             res.status(200).json({
//               message: "error",
//               data: "No data found in cart",
//               code: 1,
//             });
//           } else {
//             let bookingdetail = AddToCartData.CartDetail;
//             let regionId = AddToCartData.regionID;
//             let notAdded = [];
//             let outOfStock = [];

//             async.parallel(
//               bookingdetail.map((bookingItem) => {
//                 console.log("thisssssss ===>>>> ", bookingItem);
//                 return (callback) => {
//                   if (!bookingItem) {
//                     // notAdded.push(bookingItem.product_id.product_name || bookingItem.product_id);
//                     callback(null, 1);
//                     return;
//                   } else {
//                     ProductData.aggregate(
//                       [
//                         {
//                           $match: {
//                             _id: mongoose.Types.ObjectId(bookingItem.product_id._id || bookingItem.product_id),
//                           },
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
//                                         { $eq: ["$product_id", "$$product_id"] },
//                                         {
//                                           $eq: ["$region", mongoose.Types.ObjectId(regionId)],
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
//                         ],

//                         // For Populating nested keys inside nested array of objects
//                         ...[
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
//                           ],

//                           // inside groupData array
//                           ...[
//                             { $unwind: { path: "$groupData", preserveNullAndEmptyArrays: true } },
//                             {
//                               $unwind: {
//                                 path: "$groupData.sets",
//                                 preserveNullAndEmptyArrays: true,
//                               },
//                             },
//                             // { $sort: { "groupData.sets.priority": 1 } },
//                             {
//                               $lookup: {
//                                 from: "packages",
//                                 foreignField: "_id",
//                                 localField: "groupData.sets.package",
//                                 as: "groupData.sets.package",
//                               },
//                             },
//                             {
//                               $unwind: {
//                                 path: "$groupData.sets.package",
//                                 preserveNullAndEmptyArrays: true,
//                               },
//                             },
//                             {
//                               $group: {
//                                 _id: "$_id",
//                                 product_name: { $first: "$product_name" },
//                                 images: { $first: "$images" },
//                                 simpleData: { $first: "$simpleData" },
//                                 configurableData: { $first: "$configurableData" },
//                                 groupData: { $push: "$groupData" },
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

//                             // For grouping groupData.sets and
//                             // For sorting inner products inside group products based on priorities
//                             {
//                               $addFields: {
//                                 groupData: {
//                                   $function: {
//                                     body: function (groupData) {
//                                       let new_groupData = [];
//                                       for (let gd of groupData) {
//                                         if (gd.name) {
//                                           let found = false;
//                                           for (let new_gd of new_groupData) {
//                                             if (new_gd._id.toString() === gd._id.toString() && new_gd.name === gd.name) {
//                                               found = new_gd;
//                                             }
//                                           }
//                                           if (found) {
//                                             found.sets.push(gd.sets);
//                                           } else {
//                                             gd.sets = [gd.sets];
//                                             new_groupData.push(gd);
//                                           }
//                                         }
//                                       }

//                                       for (const gd of new_groupData) {
//                                         for (const set of gd.sets) {
//                                           if (set.priority === null) {
//                                             set.priority = Infinity;
//                                           }
//                                         }
//                                         gd.sets.sort((a, b) => a.priority - b.priority);
//                                       }

//                                       return new_groupData;
//                                     },
//                                     args: ["$groupData"],
//                                     lang: "js",
//                                   },
//                                 },
//                               },
//                             },
//                           ],
//                         ],
//                       ],
//                       async (err, product) => {
//                         product = product[0];
//                         if (err) {
//                           errorLogger.error(err, "\n", "\n");
//                           console.log("jsonDatajsonDatajsonDatajsonDatajsonData -1", err);
//                           notAdded.push(bookingItem.product_id.product_name || bookingItem.product_id);
//                           callback(null, 1);
//                           return;
//                         } else {
//                           if (!product.status || !product.showstatus) {
//                             outOfStock.push(product.product_name);
//                             callback(null, 2);
//                             return;
//                           }
//                           for (const cat of product.product_categories) {
//                             if (!cat.status) {
//                               outOfStock.push(product.product_name);
//                               callback(null, 2);
//                               return;
//                             }
//                           }

//                           // console.log("jsonDatajsonDatajsonDatajsonDatajsonData -1", product);
//                           if (product.TypeOfProduct == "configurable") {
//                             let variant = product.configurableData.filter(
//                               (data) => JSON.stringify(data.region) == JSON.stringify(regionId) && data.variant_name == bookingItem.variant_name
//                             );
//                             if (variant.length == 0) {
//                               outOfStock.push(bookingItem.product_id.product_name);
//                               callback(null, 2);
//                               return;
//                             }
//                             variant = variant[0];
//                             var availQty = variant.availQuantity;
//                             var totalQty = bookingItem.unitQuantity * bookingItem.qty;

//                             if (totalQty > availQty) {
//                               outOfStock.push(bookingItem.product_id.product_name);
//                               callback(null, 3);
//                               return;
//                             } else {
//                               let itemPrice;
//                               if (user.user_type === "b2b") {
//                                 itemPrice = variant.B2B_price || variant.mrp;
//                               } else if (user.user_type === "retail") {
//                                 itemPrice = variant.Retail_price || variant.mrp;
//                               } else if (user.user_type === "user" || user.user_type === null) {
//                                 itemPrice = variant.selling_price || variant.mrp;
//                               } else {
//                                 itemPrice = variant.mrp;
//                               }
//                               // console.log("ppppppppppppppp", user.user_type, itemPrice);
//                               let cartData = {
//                                 product_id: bookingItem.product_id._id,
//                                 //product_cat_id: bookingItem.product_id.product_cat_id._id,
//                                 // product_subCat1_id: product_subCat1_id,
//                                 TypeOfProduct: bookingItem.TypeOfProduct,
//                                 product_categories: bookingItem.product_categories,
//                                 itemDiscountPercentage: bookingItem.itemDiscountPercentage,
//                                 itemDiscountAmount: bookingItem.itemDiscountAmount,
//                                 qty: bookingItem.qty,
//                                 variant_name: bookingItem.variant_name,
//                                 price: itemPrice,
//                                 unitQuantity: bookingItem.unitQuantity,
//                                 unitMeasurement: bookingItem.unitMeasurement,
//                                 totalprice: bookingItem.qty * itemPrice,
//                                 preOrder: bookingItem.preOrder,
//                                 subscribe: bookingItem.subscribe,
//                                 status: true,
//                                 createDate: Date(),
//                               };
//                               // console.log("jsonDatajsonDatajsonDatajsonDatajsonData -3", cartData);
//                               callback(null, cartData);
//                               return;
//                             }
//                           } else if (product.TypeOfProduct == "simple") {
//                             // check if out of stock
//                             let simpleData = product.simpleData.filter((data) => JSON.stringify(data.region) == JSON.stringify(regionId));

//                             if (simpleData.length == 0) {
//                               outOfStock.push(bookingItem.product_id.product_name);
//                               callback(null, 2);
//                               return;
//                             }
//                             let bookingQuantity = bookingItem.without_package
//                               ? bookingItem.qty * bookingItem.unitQuantity * dates
//                               : bookingItem.qty * bookingItem.packet_size * dates;
//                             let availableQuantity = simpleData[0].availableQuantity;

//                             console.log("aaaa@ ", bookingQuantity, availableQuantity);

//                             if (bookingQuantity > availableQuantity && bookingItem.preOrder == false) {
//                               outOfStock.push(bookingItem.product_id.product_name);
//                               callback(null, 3);
//                               return;
//                             }
//                             // else if (bookingItem.preOrder == true && bookingQuantity > product.preOrderRemainQty) {
//                             //   outOfStock.push(bookingItem.product_id.product_name);
//                             //   callback(null, 3);
//                             // }
//                             else {
//                               // In stock

//                               let productItemId, unitMeasurement, itemPrice;

//                               if (bookingItem.without_package === true || bookingItem.without_package === "true") {
//                                 // *******setting price for items without packages********
//                                 if (user.user_type === "b2b") {
//                                   itemPrice = simpleData[0].RegionB2BPrice;
//                                 } else if (user.user_type === "retail") {
//                                   itemPrice = simpleData[0].RegionRetailPrice;
//                                 } else if (user.user_type === "user" || user.user_type === null) {
//                                   itemPrice = simpleData[0].RegionSellingPrice;
//                                 }
//                                 // ******************************************************

//                                 productItemId = null;
//                                 let typeOF = typeof bookingItem.unitMeasurement;

//                                 if (typeOF === "object") {
//                                   unitMeasurement = bookingItem.unitMeasurement.name;
//                                 } else {
//                                   unitMeasurement = bookingItem.unitMeasurement;
//                                 }
//                               } else {
//                                 productItemId = bookingItem.productItemId;
//                                 unitMeasurement = null;

//                                 let package = simpleData[0].package.filter((pack) => pack.packetLabel == bookingItem.packetLabel);
//                                 if (package.length > 0) {
//                                   productItemId = package[0]._id;
//                                   // *******setting price for items with packages********
//                                   if (user.user_type === "b2b") {
//                                     itemPrice = package[0].B2B_price ? package[0].B2B_price : package[0].packetmrp;
//                                   } else if (user.user_type === "retail") {
//                                     itemPrice = package[0].Retail_price ? package[0].Retail_price : package[0].packetmrp;
//                                   } else if (user.user_type === "user" || user.user_type === null) {
//                                     itemPrice = package[0].selling_price ? package[0].selling_price : package[0].packetmrp;
//                                   }
//                                 } else {
//                                   notAdded.push(bookingItem.product_id.product_name);
//                                   callback(null, 4);
//                                   return;
//                                 }
//                                 // ******************************************************
//                               }

//                               if (bookingItem.product_id.product_subCat1_id) {
//                                 var product_subCat1_id = bookingItem.product_id.product_subCat1_id._id;
//                               }
//                               let cartData = {
//                                 product_id: bookingItem.product_id._id,
//                                 //product_cat_id: bookingItem.product_id.product_cat_id._id,
//                                 // product_subCat1_id: product_subCat1_id,
//                                 productItemId: productItemId,
//                                 TypeOfProduct: bookingItem.TypeOfProduct,
//                                 product_categories: bookingItem.product_categories,
//                                 itemDiscountPercentage: bookingItem.itemDiscountPercentage,
//                                 itemDiscountAmount: bookingItem.itemDiscountAmount,
//                                 packet_size: bookingItem.packet_size,
//                                 packetLabel: bookingItem.packetLabel,
//                                 qty: bookingItem.qty,
//                                 price: itemPrice,
//                                 unitQuantity: bookingItem.unitQuantity,
//                                 variant_name: bookingItem.variant_name || null,
//                                 unitMeasurement: unitMeasurement,
//                                 without_package: bookingItem.without_package,
//                                 totalprice: bookingItem.qty * itemPrice,
//                                 preOrder: bookingItem.preOrder,
//                                 subscribe: bookingItem.subscribe,
//                                 status: true,
//                                 createDate: Date(),
//                               };
//                               callback(null, cartData);
//                               return;
//                             }
//                           } else if (product.TypeOfProduct == "group") {
//                             try {
//                               for (let j = 0; j < bookingItem.groupData.length; j++) {
//                                 let set = bookingItem.groupData[j];
//                                 let setQty = 0;
//                                 for (let k = 0; k < set.sets.length; k++) {
//                                   let product = set.sets[k].product;

//                                   let productData = await ProductData.aggregate([
//                                     {
//                                       $match: {
//                                         _id: mongoose.Types.ObjectId(product._id),
//                                         "simpleData.region": mongoose.Types.ObjectId(regionId),
//                                       },
//                                     },
//                                     // For adding quantity keys
//                                     ...[
//                                       {
//                                         $lookup: {
//                                           from: "inventory_items",
//                                           let: { product_id: "$_id" },
//                                           pipeline: [
//                                             {
//                                               $match: {
//                                                 $expr: {
//                                                   $and: [
//                                                     { $eq: ["$product_id", "$$product_id"] },
//                                                     {
//                                                       $eq: ["$region", mongoose.Types.ObjectId(regionId)],
//                                                     },
//                                                   ],
//                                                 },
//                                               },
//                                             },
//                                             {
//                                               $group: {
//                                                 _id: null,
//                                                 productQuantity: { $sum: "$productQuantity" },
//                                                 bookingQuantity: { $sum: "$bookingQuantity" },
//                                                 availableQuantity: { $sum: "$availableQuantity" },
//                                                 lostQuantity: { $sum: "$lostQuantity" },
//                                                 returnQuantity: { $sum: "$returnQuantity" },
//                                                 inhouseQuantity: { $sum: "$inhouseQuantity" },
//                                               },
//                                             },
//                                             { $project: { _id: 0 } },
//                                           ],
//                                           as: "inventories",
//                                         },
//                                       },
//                                       {
//                                         $unwind: {
//                                           path: "$inventories",
//                                           preserveNullAndEmptyArrays: true,
//                                         },
//                                       },
//                                       {
//                                         $addFields: {
//                                           productQuantity: {
//                                             $ifNull: [{ $toDouble: "$inventories.productQuantity" }, 0],
//                                           },
//                                           bookingQuantity: {
//                                             $ifNull: [{ $toDouble: "$inventories.bookingQuantity" }, 0],
//                                           },
//                                           availableQuantity: {
//                                             $ifNull: [{ $toDouble: "$inventories.availableQuantity" }, 0],
//                                           },
//                                           lostQuantity: {
//                                             $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0],
//                                           },
//                                           returnQuantity: {
//                                             $ifNull: [{ $toDouble: "$inventories.returnQuantity" }, 0],
//                                           },
//                                           inhouseQuantity: {
//                                             $ifNull: [{ $toDouble: "$inventories.inhouseQuantity" }, 0],
//                                           },
//                                         },
//                                       },
//                                     ],
//                                     {
//                                       $project: {
//                                         availableQuantity: 1,
//                                       },
//                                     },
//                                   ]);

//                                   var availQty = productData[0].availableQuantity;

//                                   var totalQty =
//                                     (set.sets[k].package ? set.sets[k].package.packet_size : set.sets[k].unitQuantity) *
//                                     set.sets[k].qty *
//                                     bookingItem.qty;

//                                   console.log("bbb @", totalQty, availQty);
//                                   if (totalQty > availQty) {
//                                     outOfStock.push(bookingItem.product_id.product_name);
//                                     callback(null, 3);
//                                     return;
//                                   }
//                                 }
//                               }
//                               // console.log("========================= 2");
//                             } catch (err) {
//                               errorLogger.error(err, "\n", "\n");
//                               console.log("err::::::", err);
//                             }

//                             let cartData = {
//                               product_id: bookingItem.product_id._id,
//                               //product_cat_id: bookingItem.product_id.product_cat_id._id,
//                               // product_subCat1_id: product_subCat1_id,
//                               productItemId: null,
//                               TypeOfProduct: bookingItem.TypeOfProduct || null,
//                               product_categories: bookingItem.product_categories,
//                               variant_name: bookingItem.variant_name || null,
//                               itemDiscountPercentage: bookingItem.itemDiscountPercentage || null,
//                               itemDiscountAmount: bookingItem.itemDiscountAmount || null,
//                               groupData: bookingItem.groupData || null,
//                               packet_size: bookingItem.packet_size || null,
//                               packetLabel: bookingItem.packetLabel || null,
//                               qty: bookingItem.qty || null,
//                               price: bookingItem.price || null,
//                               unitQuantity: bookingItem.unitQuantity || null,
//                               unitMeasurement: bookingItem.unitMeasurement || null,
//                               without_package: bookingItem.without_package || null,
//                               totalprice: bookingItem.totalprice || null,
//                               status: true,
//                               preOrder: bookingItem.preOrder,
//                               subscribe: bookingItem.subscribe,
//                               createDate: Date(),
//                             };
//                             callback(null, cartData);
//                             return;
//                           }
//                         }
//                       }
//                     );
//                   }
//                 };
//               }),
//               (err, results) => {
//                 if (err) {
//                   errorLogger.error(err, "\n", "\n");
//                   console.log("something went wrong with one of the products");
//                 }

//                 let CartDetail = results.filter((result) => typeof result == "object");

//                 console.log("ccc @ ", JSON.stringify(CartDetail));

//                 let jsonData = {
//                   user_id: user_id,
//                   totalCartPrice: AddToCartData.totalCartPrice,
//                   regionID: AddToCartData.regionID,
//                   subscribe: AddToCartData.subscribe,
//                   CartDetail,
//                 };

//                 table.findOneAndUpdate({ user_id: user_id }, { $set: jsonData }, { new: true }, function (err, data) {
//                   if (err) {
//                     errorLogger.error(err, "\n", "\n");
//                     // console.log("jsonDatajsonDatajsonDatajsonDatajsonData -2", err);
//                     return res.status(500).json(err);
//                   } else {
//                     //add to cart listing start

//                     table.aggregate(
//                       [
//                         { $match: { user_id: mongoose.Types.ObjectId(user_id) } },
//                         { $unwind: { path: "$CartDetail", preserveNullAndEmptyArrays: true } },
//                         {
//                           $lookup: {
//                             from: "products",
//                             let: { product_id: "$CartDetail.product_id", region_id: "$regionID" },
//                             pipeline: [
//                               { $match: { $expr: { $eq: ["$$product_id", "$_id"] } } },

//                               // populate product categories
//                               {
//                                 $lookup: {
//                                   from: "categories",
//                                   foreignField: "_id",
//                                   localField: "product_categories",
//                                   as: "product_categories",
//                                 },
//                               },

//                               // For adding quantity keys
//                               ...[
//                                 {
//                                   $lookup: {
//                                     from: "inventory_items",
//                                     let: { product_id: "$_id" },
//                                     pipeline: [
//                                       {
//                                         $match: {
//                                           $expr: {
//                                             $and: [
//                                               { $eq: ["$product_id", "$$product_id"] },
//                                               {
//                                                 $eq: ["$region", "$$region_id"],
//                                               },
//                                             ],
//                                           },
//                                         },
//                                       },
//                                       {
//                                         $group: {
//                                           _id: null,
//                                           productQuantity: { $sum: "$productQuantity" },
//                                           bookingQuantity: { $sum: "$bookingQuantity" },
//                                           availableQuantity: { $sum: "$availableQuantity" },
//                                           lostQuantity: { $sum: "$lostQuantity" },
//                                           returnQuantity: { $sum: "$returnQuantity" },
//                                           inhouseQuantity: { $sum: "$inhouseQuantity" },
//                                         },
//                                       },
//                                       { $project: { _id: 0 } },
//                                     ],
//                                     as: "inventories",
//                                   },
//                                 },
//                                 {
//                                   $unwind: {
//                                     path: "$inventories",
//                                     preserveNullAndEmptyArrays: true,
//                                   },
//                                 },
//                                 {
//                                   $addFields: {
//                                     productQuantity: {
//                                       $ifNull: [{ $toDouble: "$inventories.productQuantity" }, 0],
//                                     },
//                                     bookingQuantity: {
//                                       $ifNull: [{ $toDouble: "$inventories.bookingQuantity" }, 0],
//                                     },
//                                     availableQuantity: {
//                                       $ifNull: [{ $toDouble: "$inventories.availableQuantity" }, 0],
//                                     },
//                                     lostQuantity: {
//                                       $ifNull: [{ $toDouble: "$inventories.lostQuantity" }, 0],
//                                     },
//                                     returnQuantity: {
//                                       $ifNull: [{ $toDouble: "$inventories.returnQuantity" }, 0],
//                                     },
//                                     inhouseQuantity: {
//                                       $ifNull: [{ $toDouble: "$inventories.inhouseQuantity" }, 0],
//                                     },
//                                   },
//                                 },
//                               ],

//                               // inside simpleData array
//                               ...[
//                                 {
//                                   $unwind: {
//                                     path: "$simpleData",
//                                     preserveNullAndEmptyArrays: true,
//                                   },
//                                 },
//                                 {
//                                   $lookup: {
//                                     from: "regions",
//                                     foreignField: "_id",
//                                     localField: "simpleData.region",
//                                     as: "simpleData.region",
//                                   },
//                                 },
//                                 {
//                                   $unwind: {
//                                     path: "$simpleData.region",
//                                     preserveNullAndEmptyArrays: true,
//                                   },
//                                 },
//                                 {
//                                   $unset: ["simpleData.region.stateData", "simpleData.region.__v", "simpleData.region.created_at"],
//                                 },
//                                 {
//                                   $lookup: {
//                                     from: "packages",
//                                     foreignField: "_id",
//                                     localField: "simpleData.package",
//                                     as: "simpleData.package",
//                                   },
//                                 },
//                                 {
//                                   $addFields: {
//                                     "simpleData.productQuantity": "$productQuantity",
//                                     "simpleData.bookingQuantity": "$bookingQuantity",
//                                     "simpleData.availableQuantity": "$availableQuantity",
//                                     "simpleData.lostQuantity": "$lostQuantity",
//                                     "simpleData.returnQuantity": "$returnQuantity",
//                                     "simpleData.inhouseQuantity": "$inhouseQuantity",
//                                   },
//                                 },
//                                 {
//                                   $group: {
//                                     _id: "$_id",
//                                     product_name: { $first: "$product_name" },
//                                     images: { $first: "$images" },
//                                     simpleData: { $push: "$simpleData" },
//                                     configurableData: { $first: "$configurableData" },
//                                     groupData: { $first: "$groupData" },
//                                     base_price: { $first: "$base_price" },
//                                     slug: { $first: "$slug" },
//                                     TypeOfProduct: { $first: "$TypeOfProduct" },
//                                     outOfStock: { $first: "$outOfStock" },
//                                     productQuantity: { $first: "$productQuantity" },
//                                     bookingQuantity: { $first: "$bookingQuantity" },
//                                     availableQuantity: { $first: "$availableQuantity" },
//                                     lostQuantity: { $first: "$lostQuantity" },
//                                     returnQuantity: { $first: "$returnQuantity" },
//                                     inhouseQuantity: { $first: "$inhouseQuantity" },
//                                     productSubscription: { $first: "$productSubscription" },
//                                     preOrder: { $first: "$preOrder" },
//                                     preOrderQty: { $first: "$preOrderQty" },
//                                     preOrderBookQty: { $first: "$preOrderBookQty" },
//                                     preOrderRemainQty: { $first: "$preOrderRemainQty" },
//                                     preOrderStartDate: { $first: "$preOrderStartDate" },
//                                     preOrderEndDate: { $first: "$preOrderEndDate" },
//                                     sameDayDelivery: { $first: "$sameDayDelivery" },
//                                     farmPickup: { $first: "$farmPickup" },
//                                     priority: { $first: "$priority" },
//                                     status: { $first: "$status" },
//                                     showstatus: { $first: "$showstatus" },
//                                     ratings: { $first: "$ratings" },
//                                     ratingsCount: { $first: "$ratingsCount" },
//                                     reviews: { $first: "$reviews" },
//                                     reviewsCount: { $first: "$reviewsCount" },
//                                     unitMeasurement: { $first: "$unitMeasurement" },
//                                     salesTaxOutSide: { $first: "$salesTaxOutSide" },
//                                     salesTaxWithIn: { $first: "$salesTaxWithIn" },
//                                     purchaseTax: { $first: "$purchaseTax" },
//                                     product_categories: { $first: "$product_categories" },
//                                     // other keys
//                                     barcode: { $first: "$barcode" },
//                                     slug: { $first: "$slug" },
//                                     longDesc: { $first: "$longDesc" },
//                                     shortDesc: { $first: "$shortDesc" },
//                                     attachment: { $first: "$attachment" },
//                                     banner: { $first: "$banner" },
//                                     productThreshold: { $first: "$productThreshold" },
//                                     ProductRegion: { $first: "$ProductRegion" },
//                                     hsnCode: { $first: "$hsnCode" },
//                                     SKUCode: { $first: "$SKUCode" },
//                                     unitQuantity: { $first: "$unitQuantity" },
//                                     productExpiryDay: { $first: "$productExpiryDay" },
//                                     attribute_group: { $first: "$attribute_group" },
//                                     youtube_link: { $first: "$youtube_link" },
//                                     created_at: { $first: "$created_at" },
//                                   },
//                                 },
//                               ],

//                               // For populating other small keys
//                               ...[
//                                 {
//                                   $lookup: {
//                                     from: "unit_measurements",
//                                     localField: "unitMeasurement",
//                                     foreignField: "_id",
//                                     as: "unitMeasurement",
//                                   },
//                                 },
//                                 {
//                                   $unwind: {
//                                     path: "$unitMeasurement",
//                                     preserveNullAndEmptyArrays: true,
//                                   },
//                                 },

//                                 {
//                                   $lookup: {
//                                     from: "taxs",
//                                     localField: "salesTaxOutSide",
//                                     foreignField: "_id",
//                                     as: "salesTaxOutSide",
//                                   },
//                                 },
//                                 {
//                                   $unwind: {
//                                     path: "$salesTaxOutSide",
//                                     preserveNullAndEmptyArrays: true,
//                                   },
//                                 },

//                                 {
//                                   $lookup: {
//                                     from: "taxs",
//                                     localField: "salesTaxWithIn",
//                                     foreignField: "_id",
//                                     as: "salesTaxWithIn",
//                                   },
//                                 },
//                                 {
//                                   $unwind: {
//                                     path: "$salesTaxWithIn",
//                                     preserveNullAndEmptyArrays: true,
//                                   },
//                                 },

//                                 {
//                                   $lookup: {
//                                     from: "taxs",
//                                     localField: "purchaseTax",
//                                     foreignField: "_id",
//                                     as: "purchaseTax",
//                                   },
//                                 },
//                                 {
//                                   $unwind: {
//                                     path: "$purchaseTax",
//                                     preserveNullAndEmptyArrays: true,
//                                   },
//                                 },
//                               ],
//                             ],
//                             as: "CartDetail.product_id",
//                           },
//                         },
//                         {
//                           $unwind: {
//                             path: "$CartDetail.product_id",
//                             preserveNullAndEmptyArrays: true,
//                           },
//                         },
//                         {
//                           $group: {
//                             _id: "$_id",
//                             user_id: { $first: "$user_id" },
//                             redeem_point: { $first: "$redeem_point" },
//                             totalCartPrice: { $first: "$totalCartPrice" },
//                             subscribe: { $first: "$subscribe" },
//                             regionID: { $first: "$regionID" },
//                             CartDetail: { $push: "$CartDetail" },
//                             SubscribeDetail: { $first: "$SubscribeDetail" },
//                             createDate: { $first: "$createDate" },
//                           },
//                         },
//                         {
//                           $addFields: {
//                             CartDetail: {
//                               $filter: {
//                                 input: "$CartDetail",
//                                 as: "cd",
//                                 cond: { $gt: [{ $size: { $objectToArray: "$$cd" } }, 2] },
//                               },
//                             },
//                           },
//                         },
//                       ],
//                       async (err, cartData1) => {
//                         let data = cartData1[0];
//                         if (err) {
//                           res.status(500).json(err);
//                         } else if (data == null) {
//                           res.status(200).json({
//                             message: "error",
//                             data: "No data found in cart",
//                             code: 1,
//                           });
//                         } else {
//                           var CartDetailArray = [];
//                           if (data.CartDetail != null) {
//                             var CartDetail = data.CartDetail;
//                             for (var i = 0; i < CartDetail.length; i++) {
//                               var DataI = CartDetail[i];
//                               var ConfigItemPush = {};
//                               var SimpleItemPush = {};
//                               var groupData = [];
//                               if (DataI.product_id === null || DataI.product_id === "null") {
//                                 return res.status(400).json({
//                                   message: "error",
//                                   data: "product not found in database",
//                                   code: 1,
//                                 });
//                                 process.exit(1);
//                               }
//                               if (DataI.TypeOfProduct == "configurable") {
//                                 var varItem = DataI.product_id.configurableData;

//                                 for (var j = 0; j < varItem.length; j++) {
//                                   if (
//                                     JSON.stringify(data.regionID) == JSON.stringify(varItem[j].region._id) &&
//                                     DataI.variant_name == varItem[j].variant_name
//                                   ) {
//                                     ConfigItemPush = varItem[j];
//                                   }
//                                 }
//                               } else if (DataI.TypeOfProduct == "simple") {
//                                 var SimpleData = DataI.product_id.simpleData;
//                                 if (SimpleData.length > 0) {
//                                   for (var j = 0; j < SimpleData.length; j++) {
//                                     var SimpleDataIPackage = SimpleData[j].package;
//                                     for (var k = 0; k < SimpleDataIPackage.length; k++) {
//                                       var packageDataI = SimpleDataIPackage[k];
//                                       if (JSON.stringify(DataI.productItemId) == JSON.stringify(packageDataI._id)) {
//                                         SimpleItemPush = packageDataI;
//                                       }
//                                     }
//                                   }
//                                 }

//                                 var simpleDatabyRegion = DataI.product_id.simpleData;
//                                 var simpleDatabyRegionArray = [];
//                                 for (var x = 0; x < simpleDatabyRegion.length; x++) {
//                                   if (JSON.stringify(data.regionID) === JSON.stringify(simpleDatabyRegion[x].region._id)) {
//                                     simpleDatabyRegionArray.push({
//                                       _id: simpleDatabyRegion[x]._id,
//                                       region: simpleDatabyRegion[x].region,
//                                       ExpirationDate: simpleDatabyRegion[x].ExpirationDate,

//                                       productQuantity: simpleDatabyRegion[x].productQuantity,
//                                       bookingQuantity: simpleDatabyRegion[x].bookingQuantity,
//                                       availableQuantity: simpleDatabyRegion[x].availableQuantity,
//                                       lostQuantity: simpleDatabyRegion[x].lostQuantity,
//                                       returnQuantity: simpleDatabyRegion[x].returnQuantity,
//                                       inhouseQuantity: simpleDatabyRegion[x].inhouseQuantity,

//                                       quantity: simpleDatabyRegion[x].quantity,
//                                       total_amount: simpleDatabyRegion[x].total_amount,
//                                       costPrice: simpleDatabyRegion[x].costPrice,
//                                       package: simpleDatabyRegion[x].package,
//                                       RegionSKUcode: simpleDatabyRegion[x].RegionSKUcode,
//                                       mrp: simpleDatabyRegion[x].mrp,
//                                       RegionRetailPrice: simpleDatabyRegion[x].RegionRetailPrice,
//                                       RegionB2BPrice: simpleDatabyRegion[x].RegionB2BPrice,
//                                       RegionSellingPrice: simpleDatabyRegion[x].RegionSellingPrice,
//                                     });
//                                   }
//                                 }
//                               } else if (DataI.TypeOfProduct == "group") {
//                                 groupData = DataI.groupData;
//                               }

//                               var productData = {
//                                 _id: DataI.product_id._id,
//                                 admin_id: DataI.product_id.admin_id,
//                                 product_name: DataI.product_id.product_name,
//                                 product_categories: DataI.product_id.product_categories,
//                                 slug: DataI.product_id.slug,
//                                 base_price: DataI.product_id.base_price || null,
//                                 longDesc: DataI.product_id.longDesc,
//                                 shortDesc: DataI.product_id.shortDesc,
//                                 attachment: DataI.product_id.attachment,
//                                 banner: DataI.product_id.banner,
//                                 productThreshold: DataI.product_id.productThreshold,
//                                 productSubscription: DataI.product_id.productSubscription,
//                                 salesTaxOutSide: DataI.product_id.salesTaxOutSide,
//                                 salesTaxWithIn: DataI.product_id.salesTaxWithIn,
//                                 purchaseTax: DataI.product_id.purchaseTax,
//                                 hsnCode: DataI.product_id.hsnCode,
//                                 unitMeasurement: DataI.product_id.unitMeasurement,
//                                 TypeOfProduct: DataI.product_id.TypeOfProduct,
//                                 SKUCode: DataI.product_id.SKUCode,
//                                 sameDayDelivery: DataI.product_id.sameDayDelivery,
//                                 farmPickup: DataI.product_id.farmPickup,
//                                 __v: 0,
//                                 created_at: DataI.product_id.created_at,
//                                 status: DataI.product_id.status,
//                                 configurableData: ConfigItemPush,
//                                 simpleData: simpleDatabyRegionArray,
//                                 groupData: groupData,

//                                 productQuantity: DataI.product_id.productQuantity,
//                                 bookingQuantity: DataI.product_id.bookingQuantity,
//                                 availableQuantity: DataI.product_id.availableQuantity,
//                                 lostQuantity: DataI.product_id.lostQuantity,
//                                 returnQuantity: DataI.product_id.returnQuantity,
//                                 inhouseQuantity: DataI.product_id.inhouseQuantity,

//                                 unitQuantity: DataI.product_id.unitQuantity,
//                                 ProductRegion: DataI.product_id.ProductRegion,
//                                 relatedRecipes: DataI.product_id.relatedRecipes,
//                                 relatedProduct: DataI.product_id.relatedProduct,
//                                 images: DataI.product_id.images,
//                                 product_subCat1_id: DataI.product_id.product_subCat1_id,
//                                 product_cat_id: DataI.product_id.product_cat_id,
//                                 preOrder: DataI.product_id.preOrder,
//                                 preOrderStartDate: DataI.product_id.preOrderStartDate,
//                                 preOrderEndDate: DataI.product_id.preOrderEndDate,
//                               };

//                               CartDetailArray.push({
//                                 _id: DataI._id,
//                                 product_id: productData,
//                                 slug: DataI.product_id.slug,
//                                 // "product_cat_id"       : DataI.product_cat_id,
//                                 // "product_subCat1_id"   : DataI.product_subCat1_id,
//                                 productItemId: DataI.productItemId,
//                                 salesTax: DataI.salesTax,
//                                 TypeOfProduct: DataI.TypeOfProduct,
//                                 product_categories: DataI.product_categories,
//                                 itemDiscountPercentage: DataI.itemDiscountPercentage,
//                                 itemDiscountAmount: DataI.itemDiscountAmount,
//                                 groupData: groupData,
//                                 price: DataI.price,
//                                 qty: DataI.qty,
//                                 preOrder: DataI.preOrder,
//                                 preOrderEndDate: DataI.product_id.preOrderEndDate,
//                                 base_price: DataI.product_id.base_price || null,
//                                 subscribe: DataI.subscribe,
//                                 unitQuantity: DataI.unitQuantity,
//                                 unitMeasurement: DataI.unitMeasurement,
//                                 without_package: DataI.without_package,
//                                 totalprice: DataI.totalprice,
//                                 createDate: DataI.createDate,
//                                 status: DataI.status,
//                                 simpleItem: SimpleItemPush,
//                                 configurableItem: ConfigItemPush,
//                                 variant_name: DataI.variant_name,
//                               });
//                             }
//                           }

//                           DataJson = {
//                             AddToCartId: data._id,
//                             user_id: data.user_id,
//                             totalCartPrice: data.totalCartPrice,
//                             redeem_point: data.redeem_point,
//                             totalcartprice: data.totalcartprice,
//                             cartDetail: CartDetailArray,
//                             regionID: data.regionID,
//                             subscribe: data.subscribe,
//                             notAdded,
//                             outOfStock,
//                             __v: data.__v,
//                           };
//                           res.status(200).json({ message: "ok", data: DataJson, code: 1 });
//                         }
//                       }
//                     );
//                     //add to cart listing end
//                   }
//                 });
//               }
//             );
//           }
//         }
//       );
//     }
//   });
// };

module.exports.GetAll = function (req, res) {
  var user_id = req.params.user_id;
  var dates = req.body.subscription_dates ? req.body.subscription_dates : 1;

  User.findOne({ _id: user_id }, async (err, user) => {
    if (err) {
      return res.status(401).json({ msg: "User not found" });
    } else {
      table
        .aggregate(
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
                  { $match: { $expr: { $eq: ["$$product_id", "$_id"] } } },

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
                                    $eq: ["$region", "$$region_id"],
                                  },
                                  { $eq: ["$variant_name", "$$variant_name"] },
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
                          $ifNull: [
                            { $toDouble: "$inventories.productQuantity" },
                            0,
                          ],
                        },
                        bookingQuantity: {
                          $ifNull: [
                            { $toDouble: "$inventories.bookingQuantity" },
                            0,
                          ],
                        },
                        availableQuantity: {
                          $ifNull: [
                            { $toDouble: "$inventories.availableQuantity" },
                            0,
                          ],
                        },
                        lostQuantity: {
                          $ifNull: [
                            { $toDouble: "$inventories.lostQuantity" },
                            0,
                          ],
                        },
                        returnQuantity: {
                          $ifNull: [
                            { $toDouble: "$inventories.returnQuantity" },
                            0,
                          ],
                        },
                        inhouseQuantity: {
                          $ifNull: [
                            { $toDouble: "$inventories.inhouseQuantity" },
                            0,
                          ],
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
                        $unset: [
                          "simpleData.region.stateData",
                          "simpleData.region.__v",
                          "simpleData.region.created_at",
                        ],
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
                                      if (
                                        new_gd._id.toString() ===
                                          gd._id.toString() &&
                                        new_gd.name === gd.name
                                      ) {
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
                                  gd.sets.sort(
                                    (a, b) => a.priority - b.priority
                                  );
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
                    cond: { $gt: [{ $size: { $objectToArray: "$$cd" } }, 2] },
                  },
                },
              },
            },
          ],
          async (err, cartData1) => {
            if (err) {
              console.log(err);
              return res.status(500).json(err);
            }
            let data = cartData1?.[0];
            console.log(data)
            if (data == null) {
              return res.status(200).json({
                message: "error",
                data: "No data found in cart",
                code: 1,
              });
            } else {
              var CartDetailArray = [];
              if (data.CartDetail != null) {
                var regionID = data.regionID;
                var CartDetail = data.CartDetail;

                let simpleProductsQuantity = {};
                let configProductsQuantity = {};
                var priceChanged = false;

                for (var i = 0; i < CartDetail.length; i++) {
                  var DataI = CartDetail[i];
                  var ConfigItemPush = {};
                  var SimpleItemPush = {};
                  var groupData = [];
                  if (
                    DataI.product_id === null ||
                    DataI.product_id === "null"
                  ) {
                    return res.status(400).json({
                      message: "error",
                      data: "product not found in database",
                      code: 1,
                    });
                    process.exit(1);
                  }

                  let itemPrice;
                  if (DataI.TypeOfProduct == "configurable") {
                    var availQty = DataI.product_id.availableQuantity;
                    var totalQty = (DataI.unitQuantity) * DataI.qty;
                    console.log(
                      "totalQty = ",
                      totalQty,
                      " and availQty = ",
                      availQty
                    );

                    if (
                      !configProductsQuantity[
                        `${DataI.product_id._id}__${regionID}__${DataI.variant_name}`
                      ]
                    ) {
                      configProductsQuantity[
                        `${DataI.product_id._id}__${regionID}__${DataI.variant_name}`
                      ] = [
                        DataI.product_id.product_name,
                        regionID,
                        availQty,
                        totalQty,
                        DataI.product_id.unitMeasurement,
                      ];
                    } else {
                      configProductsQuantity[
                        `${DataI.product_id._id}__${regionID}__${DataI.variant_name}`
                      ][2] = availQty;
                      configProductsQuantity[
                        `${DataI.product_id._id}__${regionID}__${DataI.variant_name}`
                      ][3] += totalQty;
                    }

                    var varItem = DataI.product_id.configurableData;

                    for (var j = 0; j < varItem.length; j++) {
                      if (
                        JSON.stringify(data.regionID) ==
                          JSON.stringify(varItem[j].region._id) &&
                        DataI.variant_name == varItem[j].variant_name
                      ) {
                        ConfigItemPush = varItem[j];
                        if (user.user_type === "b2b") {
                          itemPrice =
                            ConfigItemPush.B2B_price || ConfigItemPush.mrp;
                        } else if (user.user_type === "retail") {
                          itemPrice =
                            ConfigItemPush.Retail_price || ConfigItemPush.mrp;
                        } else if (
                          user.user_type === "user" ||
                          user.user_type === null
                        ) {
                          itemPrice =
                            ConfigItemPush.selling_price || ConfigItemPush.mrp;
                        } else {
                          itemPrice = ConfigItemPush.mrp;
                        }
                      }
                    }
                  } else if (DataI.TypeOfProduct == "simple") {
                    var availQty = DataI.product_id.availableQuantity;
                    var totalQty =
                      DataI.without_package === true && DataI.preOrder == false
                        ? DataI.unitQuantity * DataI.qty
                        : DataI.packet_size * DataI.qty;
                    console.log(
                      "totalQty = ",
                      totalQty,
                      " and availQty = ",
                      availQty
                    );

                    if (
                      !simpleProductsQuantity[
                        `${DataI.product_id._id}__${regionID}`
                      ]
                    ) {
                      simpleProductsQuantity[
                        `${DataI.product_id._id}__${regionID}`
                      ] = [
                        DataI.product_id.product_name,
                        regionID,
                        availQty,
                        totalQty,
                        DataI.product_id.unitMeasurement,
                      ];
                    } else {
                      simpleProductsQuantity[
                        `${DataI.product_id._id}__${regionID}`
                      ][2] = availQty;
                      simpleProductsQuantity[
                        `${DataI.product_id._id}__${regionID}`
                      ][3] += totalQty;
                    }

                    var SimpleData = DataI.product_id.simpleData;
                    if (SimpleData.length > 0) {
                      for (var j = 0; j < SimpleData.length; j++) {
                        var SimpleDataIPackage = SimpleData[j].package;
                        for (var k = 0; k < SimpleDataIPackage.length; k++) {
                          var packageDataI = SimpleDataIPackage[k];
                          if (
                            JSON.stringify(DataI.productItemId) ==
                            JSON.stringify(packageDataI._id)
                          ) {
                            SimpleItemPush = packageDataI;

                            if (user.user_type === "b2b") {
                              itemPrice =
                                SimpleItemPush.B2B_price ||
                                SimpleItemPush.packetmrp;
                            } else if (user.user_type === "retail") {
                              itemPrice =
                                SimpleItemPush.Retail_price ||
                                SimpleItemPush.packetmrp;
                            } else if (
                              user.user_type === "user" ||
                              user.user_type === null
                            ) {
                              itemPrice =
                                SimpleItemPush.selling_price ||
                                SimpleItemPush.packetmrp;
                            } else {
                              itemPrice = SimpleItemPush.packetmrp;
                            }
                          }
                        }
                      }
                    }

                    var simpleDatabyRegion = DataI.product_id.simpleData;
                    var simpleDatabyRegionArray = [];
                    for (var x = 0; x < simpleDatabyRegion.length; x++) {
                      if (
                        JSON.stringify(data.regionID) ===
                        JSON.stringify(simpleDatabyRegion[x].region._id)
                      ) {
                        simpleDatabyRegionArray.push({
                          _id: simpleDatabyRegion[x]._id,
                          region: simpleDatabyRegion[x].region,
                          ExpirationDate: simpleDatabyRegion[x].ExpirationDate,

                          productQuantity:
                            simpleDatabyRegion[x].productQuantity,
                          bookingQuantity:
                            simpleDatabyRegion[x].bookingQuantity,
                          availableQuantity:
                            simpleDatabyRegion[x].availableQuantity,
                          lostQuantity: simpleDatabyRegion[x].lostQuantity,
                          returnQuantity: simpleDatabyRegion[x].returnQuantity,
                          inhouseQuantity:
                            simpleDatabyRegion[x].inhouseQuantity,

                          quantity: simpleDatabyRegion[x].quantity,
                          total_amount: simpleDatabyRegion[x].total_amount,
                          costPrice: simpleDatabyRegion[x].costPrice,
                          package: simpleDatabyRegion[x].package,
                          RegionSKUcode: simpleDatabyRegion[x].RegionSKUcode,
                          mrp: simpleDatabyRegion[x].mrp,
                          RegionRetailPrice:
                            simpleDatabyRegion[x].RegionRetailPrice,
                          RegionB2BPrice: simpleDatabyRegion[x].RegionB2BPrice,
                          RegionSellingPrice:
                            simpleDatabyRegion[x].RegionSellingPrice,
                        });
                      }
                    }
                  } else if (DataI.TypeOfProduct == "group") {
                    groupData = DataI.groupData;

                    let priceSum = 0;
                    for (let j = 0; j < DataI.groupData.length; j++) {
                      let set = DataI.groupData[j];
                      for (let k = 0; k < set.sets.length; k++) {
                        let product = set.sets[k].product;

                        let [productData1] = await ProductData.aggregate([
                          {
                            $match: {
                              _id: mongoose.Types.ObjectId(product._id),
                              "simpleData.region": mongoose.Types.ObjectId(
                                regionID
                              ),
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
                                            $eq: [
                                              "$product_id",
                                              "$$product_id",
                                            ],
                                          },
                                          {
                                            $eq: [
                                              "$region",
                                              mongoose.Types.ObjectId(regionID),
                                            ],
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
                                      $toDouble:
                                        "$inventories.availableQuantity",
                                    },
                                    0,
                                  ],
                                },
                                lostQuantity: {
                                  $ifNull: [
                                    { $toDouble: "$inventories.lostQuantity" },
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

                        set.sets[k].package = await PackagesModel.findOne({
                          _id: mongoose.Types.ObjectId(set.sets[k].package._id),
                        });
                        if (user.user_type === "b2b") {
                          set.sets[k].price =
                            (set.sets[k].package.B2B_price ||
                              set.sets[k].package.packetmrp) * set.sets[k].qty;
                        } else if (user.user_type === "retail") {
                          set.sets[k].price =
                            (set.sets[k].package.Retail_price ||
                              set.sets[k].package.packetmrp) * set.sets[k].qty;
                        } else if (
                          user.user_type === "user" ||
                          user.user_type === null
                        ) {
                          set.sets[k].price =
                            (set.sets[k].package.selling_price ||
                              set.sets[k].package.packetmrp) * set.sets[k].qty;
                        } else {
                          set.sets[k].price = set.sets[k].package.packetmrp;
                        }

                        priceSum += +set.sets[k].price;

                        var availQty = productData1.availableQuantity;
                        var totalQty =
                          (set.sets[k].package
                            ? set.sets[k].package.packet_size
                            : set.sets[k].unitQuantity) *
                          set.sets[k].qty *
                          DataI.qty;
                        console.log(
                          "totalQty = ",
                          totalQty,
                          " and availQty = ",
                          availQty
                        );

                        if (
                          !simpleProductsQuantity[
                            `${productData1._id}__${regionID}`
                          ]
                        ) {
                          simpleProductsQuantity[
                            `${productData1._id}__${regionID}`
                          ] = [
                            productData1.product_name,
                            regionID,
                            availQty,
                            totalQty,
                            productData1.unitMeasurement,
                          ];
                        } else {
                          simpleProductsQuantity[
                            `${productData1._id}__${regionID}`
                          ][2] = availQty;
                          simpleProductsQuantity[
                            `${productData1._id}__${regionID}`
                          ][3] += totalQty;
                        }
                      }
                    }

                    if (DataI.product_id.base_price) {
                      itemPrice = DataI.product_id.base_price;
                    } else {
                      itemPrice = priceSum;
                    }
                  }

                  if (itemPrice !== DataI.price) {
                    priceChanged = true;
                  }

                  var productData = {
                    ...DataI.product_id,
                    configurableData: ConfigItemPush,
                    simpleData: simpleDatabyRegionArray,
                    groupData: groupData,
                  };

                  console.log("addToCart -- preorder -- ", DataI.preOrder);

                  CartDetailArray.push({
                    _id: DataI._id,
                    product_id: productData,
                    unique_id: DataI.unique_id,
                    slug: DataI.product_id.slug,
                    productItemId: DataI.productItemId,
                    salesTax: DataI.salesTax,
                    TypeOfProduct: DataI.TypeOfProduct,
                    product_categories: DataI.product_categories,
                    itemDiscountPercentage: DataI.itemDiscountPercentage,
                    itemDiscountAmount: DataI.itemDiscountAmount,
                    groupData: groupData,
                    price: itemPrice,
                    qty: DataI.qty,
                    totalprice: DataI.qty * itemPrice,
                    preOrder: DataI.preOrder,
                    preOrderEndDate: DataI.product_id.preOrderEndDate,
                    base_price: DataI.product_id.base_price || null,
                    subscribe: DataI.subscribe,
                    unitQuantity: DataI.unitQuantity,
                    unitMeasurement: DataI.unitMeasurement,
                    without_package: DataI.without_package,
                    createDate: DataI.createDate,
                    status: DataI.status,
                    simpleItem: SimpleItemPush,
                    configurableItem: ConfigItemPush,
                    variant_name: DataI.variant_name,
                  });
                }

                var allErrors = [];
                for (const key in simpleProductsQuantity) {
                  if (Object.hasOwnProperty.call(simpleProductsQuantity, key)) {
                    const element = simpleProductsQuantity[key];
                    if (element[2] < element[3]) {
                      allErrors.push(
                        ` ${element[0]} more than ${element[2]} ${element[4].name}`
                      );
                    }
                  }
                }

                for (const key in configProductsQuantity) {
                  if (Object.hasOwnProperty.call(configProductsQuantity, key)) {
                    const element = configProductsQuantity[key];
                    if (element[2] < element[3]) {
                      allErrors.push(
                        ` ${element[0]} more than ${element[2]} ${element[4].name}`
                      );
                    }
                  }
                }
              }

              DataJson = {
                AddToCartId: data._id,
                user_id: data.user_id,
                totalCartPrice: data.totalCartPrice,
                redeem_point: data.redeem_point,
                totalcartprice: data.totalcartprice,
                cartDetail: CartDetailArray,
                regionID: data.regionID,
                subscribe: data.subscribe,
                cartData1:cartData1,
                notAdded: [],
                outOfStock: [],
                priceChanged,
                __v: data.__v,
              };
              res
                .status(200)
                .json({ message: "ok", data: DataJson, allErrors, code: 1 });
            }
          }
        )
        .option({ serializeFunctions: true });
    }
  });
};

// var getWPPost = function (req, res) {
//   var headers, options;

//   // Set the headers
//   headers = {
//     "Content-Type": "application/x-www-form-urlencoded",
//   };

//   // Configure the request
//   options = {
//     url: "https://cms.fostersupport.org/wp-json/wp/v2/posts",
//     method: "GET",
//     headers: headers,
//   };

//   // Start the request
//   request(options, function (error, response, body) {
//     if (!error && response.statusCode == 200) {
//       res.send({
//         success: true,
//         message: "Successfully fetched a list of post",
//         posts: JSON.parse(body),
//       });
//     } else {
//     }
//   });
// };

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

//this cron is running for preorder false
//at every 6 hour 0 */6 * * *
//at every second   * * * * *
var preOrderStatus = cron.schedule(
  "* * * * *",
  () => {
    try {
      // console.log("preorder cron run");
      // code here
      ProductData.find(
        {
          status: true,
          preOrder: true,
          $or: [{ preOrderEndDate: { $lte: new Date() } }],
          //preOrderEndDate:{"$lte":new Date()}
        },
        { _id: 1, preOrder: 1, preOrderEndDate: 1 }
      )
        .lean()
        .exec()
        .then(async (Productsdata) => {
          var productIDS = [];
          for (var i = 0; i < Productsdata.length; i++) {
            productIDS.push(Productsdata[i]._id);
            await ProductData.update(
              { _id: Productsdata[i]._id },
              { $set: { preOrder: false } },
              function (err, data) {}
            );
          }
          ProductData.update(
            { _id: { $in: productIDS } },
            { $set: { preOrder: false } },
            { multi: true }
          );
        });
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
preOrderStatus.start();
