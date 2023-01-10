var mongoose = require("mongoose");
var table = mongoose.model("voucherInventory");
var Admin = mongoose.model("admin");
var ProductDataBase = mongoose.model("products");
var SupplierMastersTable = mongoose.model("supplier_masters");
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

module.exports.AddOne = async function (req, res) {
  console.log(req.body);
  var admin_id = req.body.admin_id;
  var voucherType = req.body.voucherType;
  var error = {};
  if (admin_id == "" || !admin_id || admin_id == undefined || admin_id == null) {
    common.formValidate("admin_id", res);
    return false;
  }
  let getAdmin = Admin.findOne({ _id: admin_id }, { username: 1 }).lean();
  if (getAdmin == null) {
    error["admin_id"] = "admin not found in database";
  }
  var errorArray = Object.keys(error).length;
  if (errorArray > 0) {
    return res.status(400).json({
      status: "error",
      result: [error],
    });
  } else {
    var product_data = req.body.product_data;
    var product_data = JSON.parse(product_data);

    for (k = 0; k < product_data.length; k++) {
      var product_id = product_data[k].product_id;
      var regionID = product_data[k].regionID;
      var TotalQuantity = product_data[k].TotalQuantity;
      var variant_name = product_data[k]?.variant_name
      var createdData = await table.create({
        admin_id: req.body.admin_id,
        admin_name: getAdmin.username,
        voucherType: req.body.voucherType,
        note: req.body.note,
        product_id: product_data[k].product_id,
        regionID: product_data[k].regionID,
        TotalQuantity: product_data[k].TotalQuantity,
        unitMeasurement: product_data[k].unitMeasurement,
        TypeOfProduct: product_data[k].TypeOfProduct,
        variant_name:variant_name
      });
      await common.reduceLostQtyFromInventory(product_id, regionID, TotalQuantity, voucherType ,variant_name);
    }
    res.status(201).json({ message: "ok", data: "data created", code: 1 });
  }
};

module.exports.GetAll = function (req, res) {
  var skip = req.body.skip;
  var limit = req.body.limit;
  var voucherType = req.body.voucherType;

  if (voucherType == "" || !voucherType || voucherType == undefined || voucherType == null) {
    common.formValidate("voucherType", res);
    return false;
  }

  if (req.body.product_name) {
    var product_name = req.body.product_name;
  }
  if (req.body.status) {
    var status = req.body.status;
  }
  if (req.body.date) {
    var date = req.body.date;
    var to_date1 = new Date(date);
    to_date1.setDate(to_date1.getDate() + 1);
  }
  if (req.body.admin) {
    var admin = req.body.admin;
  }

  var DataFilter = {};
  DataFilter["voucherType"] = voucherType;
  if (product_name != null) {
    DataFilter["product_name"] = { $regex: product_name, $options: "i" };
  }
  if (req.body.status != null) {
    DataFilter["status"] = req.body.status;
  }
  if (admin != null) {
    DataFilter["admin_name"] = { $regex: admin, $options: "i" };
  }
  if (date != null) {
    DataFilter["created_at"] = {
      $gte: new Date(date),
      $lte: new Date(to_date1),
    };
  }

  table
    .find(DataFilter)
    .count()
    .exec(function (err, count) {
      table
        .find(DataFilter)
        .populate("admin_id")
        .populate("product_id")
        .populate("regionID")
        .skip(skip)
        .limit(limit)
        .sort({ created_at: "desc" })
        .exec(function (err, data) {
          if (err) {
            res.status(500).json({ message: "ok", data: err, code: 1 });
          } else {
            res.status(200).json({ message: "ok", data: data, count: count, code: 1 });
          }
        });
    });
};

module.exports.GetOne = function (req, res) {
  var id = req.body._id;
  if (id == "" || !id || id == undefined || id == null) {
    common.formValidate("_id", res);
    return false;
  }

  table
    .findById(id)
    .populate("admin_id")
    .populate("product_id")
    .populate("simpleData.regionID")
    .exec(function (err, data) {
      if (err) {
        res.status(500).json({ message: "ok", data: err, code: 1 });
      } else if (!data) {
        res.status(400).json({ message: "ok", data: "data not found", code: 1 });
      }
      res.status(201).json({ message: "ok", data: data, code: 1 });
    });
};
