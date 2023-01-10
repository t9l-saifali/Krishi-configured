var mongoose = require("mongoose");
var table = mongoose.model("inventory");
var ProductDataBase = mongoose.model("products");
var SupplierMastersTable = mongoose.model("supplier_masters");
var RegionTable = mongoose.model("regions");
var multer = require("multer");
var nodemailer = require("nodemailer");
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

module.exports.AddOne = function (req, res) {
  var supplier_id = req.body.supplier_id;
  var admin_id = req.body.admin_id;
  if (supplier_id == "" || !supplier_id || supplier_id == undefined || supplier_id == null) {
    common.formValidate("supplier_id", res);
    return false;
  }
  if (admin_id == "" || !admin_id || admin_id == undefined || admin_id == null) {
    common.formValidate("admin_id", res);
    return false;
  }

  var nameFilter = { InvoiceNumber: req.body.InvoiceNumber };
  var error = {};
  table
    .find(nameFilter)
    .exec()
    .then((GetFilter) => {
      if (GetFilter.length > 0) {
        error["InvoiceNumber"] = "Invoice Number already exist";
      }
      var errorArray = Object.keys(error).length;
      if (errorArray > 0) {
        return res.status(200).json({
          status: "error",
          result: [error],
        });
      } else {
        if (req.body.product_data) {
          var product_data = req.body.product_data;
          var product_data = JSON.parse(product_data);

          var valueArr = product_data.map(function (item) {
            return item.product;
          });
          var isDuplicate = valueArr.some(function (item, idx) {
            return valueArr.indexOf(item) != idx;
          });

          if (isDuplicate == true) {
            return res.status(401).json({ message: "error", data: "same product found", code: 0 });
            process.exit(1);
          }

          for (k = 0; k < product_data.length; k++) {
            if (product_data[k].prodType == "simple") {
              var simpleData = product_data[k].regionalData;
              if (simpleData != undefined || simpleData != "") {
                var simpleDataArray = [];
                for (var i = 0; i < simpleData.length; i++) {
                  simpleDataArray.push({
                    region: simpleData[i].region,
                    costPrice: simpleData[i].cost_price,
                    total_amount: simpleData[i].total_amount,
                    quantity: simpleData[i].quantity,
                    ExpirationDate: simpleData[i].expiration,
                  });
                  var valueArr = simpleDataArray.map(function (item) {
                    return item.region;
                  });
                  var isDuplicate = valueArr.some(function (item, idx) {
                    return valueArr.indexOf(item) != idx;
                  });

                  if (isDuplicate == true) {
                    return res.status(400).json({ message: "error", data: "same region found", code: 0 });
                    process.exit(1);
                  }
                  ProductDataBase.updateOne(
                    {
                      _id: product_data[k].product,
                      simpleData: { $elemMatch: { region: simpleData[i].region } },
                    },
                    {
                      $set: {
                        //"productQuantity":simpleData[i].quantity,
                        "simpleData.$.costPrice": simpleData[i].cost_price,
                        "simpleData.$.total_amount": simpleData[i].total_amount,
                        "simpleData.$.quantity": simpleData[i].quantity,
                        "simpleData.$.ExpirationDate": simpleData[i].expiration,
                      },
                      $inc: { productQuantity: simpleData[i].quantity },
                    },
                    { new: true },
                    function (err, data) {}
                  );
                }
              }
            } else if (product_data[k].prodType == "configurable") {
              var conData = product_data[k].regionalData;

              //var conData = Data1;
              if (conData != undefined || conData != "") {
                var conDataArray = [];
                for (var i = 0; i < conData.length; i++) {
                  conDataArray.push({
                    region: conData[i].region,
                    ProductconfigurableObjectId: conData[i]._id,
                    costPrice: conData[i].cost_price,
                    total_amount: conData[i].total_amount,
                    quantity: conData[i].quantity,
                    ExpirationDate: conData[i].expiration,
                  });

                  var valueArr = conDataArray.map(function (item) {
                    return item.region;
                  });
                  var isDuplicate = valueArr.some(function (item, idx) {
                    return valueArr.indexOf(item) != idx;
                  });

                  if (isDuplicate == true) {
                    return res.status(400).json({ message: "error", data: "same region found", code: 0 });
                    process.exit(1);
                  }

                  ProductDataBase.updateOne(
                    {
                      _id: product_data[k].product,
                      configurableData: { $elemMatch: { region: conData[i].region } },
                    },
                    {
                      $set: {
                        //"productQuantity":conData[i].quantity,
                        "configurableData.$.costPrice": conData[i].cost_price,
                        "configurableData.$.total_amount": conData[i].total_amount,
                        "configurableData.$.quantity": conData[i].quantity,
                        "configurableData.$.ExpirationDate": conData[i].expiration,
                      },
                      $inc: { productQuantity: conData[i].quantity },
                    },
                    { new: true },
                    function (err, data) {}
                  );
                }
              }
            } else {
              simpleDataArray = [];
              conDataArray = [];
            }

            table.create(
              {
                admin_id: req.body.admin_id,
                supplier_id: req.body.supplier_id,
                //product_subCat1_id : product_subCat1_id,
                product_id: product_data[k].product,
                product_name: null,
                AccountHead: req.body.AccountHead,
                Date: req.body.Date,
                Time: req.body.Time,
                InvoiceNumber: req.body.InvoiceNumber,
                InvoiceDate: req.body.InvoiceDate,
                InvoiceAmount: req.body.InvoiceAmount,
                InvoiceDueDate: req.body.InvoiceDueDate,
                TypeOfProduct: product_data[k].prodType,
                simpleData: simpleDataArray,
                configuredProduct: conDataArray,
              },
              function (err, data) {}
            );
          }
          res.status(201).json({ message: "ok", data: "data created", code: 1 });
        }
      }
    })
    .catch(function (err) {
      res.status(400).json(err);
    });
};

module.exports.GetAll = function (req, res) {
  var skip = 0;
  var limit = 5;
  var maxCount = 50;

  if (req.body && req.body.skip) {
    skip = parseInt(req.body.skip);
  }

  if (req.body && req.body.limit) {
    limit = parseInt(req.body.limit, 10);
  }
  table.count().exec(function (err, count) {
    table
      .aggregate([
        {
          $group: {
            _id: {
              InvoiceNumber: "$InvoiceNumber",
              InvoiceDate: "$InvoiceDate",
              InvoiceDueDate: "$InvoiceDueDate",
              InvoiceAmount: "$InvoiceAmount",
              Date: "$Date",
              Time: "$Time",
              supplier_id: "$supplier_id",
            },
            products: { $push: "$$ROOT" },
          },
        },

        { $skip: skip },
        { $limit: limit },
      ])
      .exec(function (err, data) {
        ProductDataBase.populate(data, { path: "products.product_id", select: "product_name" }, function (err, populatedTransactions) {
          SupplierMastersTable.populate(data, { path: "_id.supplier_id", select: "name" }, function (err, populatedTransactions) {
            RegionTable.populate(data, { path: "products.simpleData.region", select: "name" }, function (err, populatedTransactions) {
              RegionTable.populate(data, { path: "products.configuredProduct.region", select: "name" }, function (err, populatedTransactions) {
                RegionTable.populate(
                  data,
                  { path: "products.configuredProduct.ProductconfigurableObjectId", select: "name" },
                  function (err, populatedTransactions) {
                    if (err) {
                      res.status(400).json(err);
                    } else {
                      console.log(data);
                      res.status(200).json({ message: "ok", data: data, count: data.length, code: 1 });
                    }
                  }
                );
              });
            });
          });
        });
      });
  });
};

module.exports.GetAllInventoryByProduct = function (req, res) {
  var product_id = req.body.product_id;

  table
    .find({ product_id: product_id })
    .populate("admin_id")
    .populate("product_cat_id", "category_name")
    .populate("AccountHead", "name")
    .populate("unitMeasurement", "name")
    .populate("simpleData.region", "name")
    .populate("configuredProduct.region", "name")
    .sort({ created_at: "desc" })
    .exec(function (err, data) {
      if (err) {
        res.status(400).json(err);
      } else {
        res.status(200).json({ message: "ok", data: data, code: 1 });
      }
    });
};

module.exports.GetAllActive = function (req, res) {
  table
    .find({ status: true })
    // .skip(offset)
    // .limit(count)
    .populate({
      path: "product_cat_id",
    })
    .exec(function (err, data) {
      if (err) {
        res.status(500).json(err);
      } else {
        res.status(200).json({ message: "ok", data: data, code: 1 });
      }
    });
};

module.exports.GetOneInventory = function (req, res) {
  var InvoiceNumber = req.body.InvoiceNumber;

  table
    .aggregate([
      { $match: { InvoiceNumber: InvoiceNumber } },
      {
        $group: {
          _id: {
            InvoiceNumber: "$InvoiceNumber",
            InvoiceDate: "$InvoiceDate",
            InvoiceDueDate: "$InvoiceDueDate",
            InvoiceAmount: "$InvoiceAmount",
            Date: "$Date",
            Time: "$Time",
            supplier_id: "$supplier_id",
          },
          products: { $push: "$$ROOT" },
        },
      },
    ])
    .exec(function (err, data) {
      ProductDataBase.populate(data, { path: "products.product_id", select: "product_name" }, function (err, populatedTransactions) {
        SupplierMastersTable.populate(data, { path: "_id.supplier_id", select: "name" }, function (err, populatedTransactions) {
          RegionTable.populate(data, { path: "products.simpleData.region", select: "name" }, function (err, populatedTransactions) {
            RegionTable.populate(data, { path: "products.configuredProduct.region", select: "name" }, function (err, populatedTransactions) {
              RegionTable.populate(
                data,
                { path: "products.configuredProduct.ProductconfigurableObjectId", select: "name" },
                function (err, populatedTransactions) {
                  if (err) {
                    res.status(400).json(err);
                  } else {
                    console.log(data);
                    res.status(200).json({ message: "ok", data: data[0], code: 1 });
                  }
                }
              );
            });
          });
        });
      });
    });
};

module.exports.UpdateOne = function (req, res) {
  var Id = req.body._id;
  var supplier_id = req.body.supplier_id;
  var admin_id = req.body.admin_id;
  var InvoiceNumber = req.body.InvoiceNumber;
  if (Id == "" || !Id || Id == undefined || Id == null) {
    common.formValidate("_id", res);
    return false;
  }
  if (supplier_id == "" || !supplier_id || supplier_id == undefined || supplier_id == null) {
    common.formValidate("supplier_id", res);
    return false;
  }
  if (admin_id == "" || !admin_id || admin_id == undefined || admin_id == null) {
    common.formValidate("admin_id", res);
    return false;
  }
  if (InvoiceNumber == "" || !InvoiceNumber || InvoiceNumber == undefined || InvoiceNumber == null) {
    common.formValidate("InvoiceNumber", res);
    return false;
  }

  var nameFilter = { InvoiceNumber: req.body.InvoiceNumber };
  var error = {};
  table
    .find(nameFilter)
    .exec()
    .then((GetFilter) => {
      if (GetFilter.length > 0) {
        if (GetFilter[0]._id != Id) {
          error["InvoiceNumber"] = "InvoiceNumber alreday exist";
        }
      }
      var errorArray = Object.keys(error).length;
      if (errorArray > 0) {
        return res.status(200).json({
          status: "error",
          result: [error],
        });
      } else {
        if (req.body.product_data) {
          var product_data = req.body.product_data;
          //var product_data = JSON.parse(product_data);

          var valueArr = product_data.map(function (item) {
            return item.product;
          });
          var isDuplicate = valueArr.some(function (item, idx) {
            return valueArr.indexOf(item) != idx;
          });

          if (isDuplicate == true) {
            return res.status(401).json({ message: "error", data: "same product found", code: 0 });
            process.exit(1);
          }

          for (k = 0; k < product_data.length; k++) {
            if (product_data[k].prodType == "simple") {
              var simpleData = product_data[k].regionalData;
              if (simpleData != undefined || simpleData != "") {
                var simpleDataArray = [];
                for (var i = 0; i < simpleData.length; i++) {
                  simpleDataArray.push({
                    region: simpleData[i].region,
                    costPrice: simpleData[i].cost_price,
                    total_amount: simpleData[i].total_amount,
                    quantity: simpleData[i].quantity,
                    ExpirationDate: simpleData[i].expiration,
                  });
                  var valueArr = simpleDataArray.map(function (item) {
                    return item.region;
                  });
                  var isDuplicate = valueArr.some(function (item, idx) {
                    return valueArr.indexOf(item) != idx;
                  });

                  if (isDuplicate == true) {
                    return res.status(400).json({ message: "error", data: "same region found", code: 0 });
                    process.exit(1);
                  }

                  //decrease old qty start
                  ProductDataBase.findOne(
                    { _id: product_data[k].product },
                    { _id: 0, simpleData: { $elemMatch: { region: simpleData[i].region } } },
                    function (err, oldData) {
                      console.log("old data ", oldData);
                    }
                  );

                  //decrease old qty end
                  ProductDataBase.updateOne(
                    {
                      _id: product_data[k].product,
                      simpleData: { $elemMatch: { region: simpleData[i].region } },
                    },
                    {
                      $set: {
                        //"productQuantity":simpleData[i].quantity,
                        "simpleData.$.costPrice": simpleData[i].cost_price,
                        "simpleData.$.total_amount": simpleData[i].total_amount,
                        "simpleData.$.quantity": simpleData[i].quantity,
                        "simpleData.$.ExpirationDate": simpleData[i].expiration,
                      },
                      $inc: { productQuantity: simpleData[i].quantity },
                    },
                    { new: true },
                    function (err, data) {}
                  );
                }
              }
            } else if (product_data[k].prodType == "configurable") {
              var conData = product_data[k].regionalData;

              //var conData = Data1;
              if (conData != undefined || conData != "") {
                var conDataArray = [];
                for (var i = 0; i < conData.length; i++) {
                  conDataArray.push({
                    region: conData[i].region,
                    ProductconfigurableObjectId: conData[i]._id,
                    costPrice: conData[i].cost_price,
                    total_amount: conData[i].total_amount,
                    quantity: conData[i].quantity,
                    ExpirationDate: conData[i].expiration,
                  });

                  var valueArr = conDataArray.map(function (item) {
                    return item.region;
                  });
                  var isDuplicate = valueArr.some(function (item, idx) {
                    return valueArr.indexOf(item) != idx;
                  });

                  if (isDuplicate == true) {
                    return res.status(400).json({ message: "error", data: "same region found", code: 0 });
                    process.exit(1);
                  }

                  ProductDataBase.updateOne(
                    {
                      _id: product_data[k].product,
                      configurableData: { $elemMatch: { region: conData[i].region } },
                    },
                    {
                      $set: {
                        //"productQuantity":conData[i].quantity,
                        "configurableData.$.costPrice": conData[i].cost_price,
                        "configurableData.$.total_amount": conData[i].total_amount,
                        "configurableData.$.quantity": conData[i].quantity,
                        "configurableData.$.ExpirationDate": conData[i].expiration,
                      },
                      $inc: { productQuantity: conData[i].quantity },
                    },
                    { new: true },
                    function (err, data) {}
                  );
                }
              }
            } else {
              simpleDataArray = [];
              conDataArray = [];
            }

            var updateData = {
              admin_id: req.body.admin_id,
              supplier_id: req.body.supplier_id,
              //product_subCat1_id : product_subCat1_id,
              product_id: product_data[k].product,
              product_name: null,
              AccountHead: req.body.AccountHead,
              Date: req.body.Date,
              Time: req.body.Time,
              InvoiceNumber: req.body.InvoiceNumber,
              InvoiceDate: req.body.InvoiceDate,
              InvoiceAmount: req.body.InvoiceAmount,
              InvoiceDueDate: req.body.InvoiceDueDate,
              TypeOfProduct: product_data[k].prodType,
              simpleData: simpleDataArray,
              configuredProduct: conDataArray,
            };
            table.update({ _id: Id }, { $set: updateData }, function (err, data) {
              if (err) {
                res.status(500).json({ message: "", data: err, code: 0 });
              } else {
                res.status(200).json({ message: "ok", data: "", code: 1 });
                return;
              }
            });
          }
          res.status(201).json({ message: "ok", data: "data updated", code: 1 });
        }
      }
    })
    .catch(function (err) {
      console.log(err);
      res.status(400).json(err);
    });
};

module.exports.DeleteOne = function (req, res) {
  var Id = req.params.Id;
  table.findByIdAndRemove(Id).exec(function (err, data) {
    if (err) {
      res.status(404).json({ message: "", data: err, code: 0 });
    } else {
      res.status(200).json({ message: "ok", data: "", code: 1 });
      return;
    }
  });
};
