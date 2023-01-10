var mongoose = require("mongoose");
var table = mongoose.model("ratingreviews");
var bookingDataBase = mongoose.model("bookings");
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

module.exports.AddOne = function (req, res) {
  upload(req, res, async function (err) {
    let { user_id, product_id, rating } = req.body;
    if (user_id == "" || !user_id || user_id == undefined || user_id == null) {
      common.formValidate("user_id", res);
      return false;
    }
    if (product_id == "" || !product_id || product_id == undefined || product_id == null) {
      common.formValidate("product_id", res);
      return false;
    }
    if (rating == "" || !rating || rating == undefined || rating == null) {
      common.formValidate("rating", res);
      return false;
    }

    var error = "";
    // let Filter = { user_id: req.body.user_id, product_id: req.body.product_id };
    // let GetFilter = await table.find(Filter).lean();
    // let Purchased = await bookingDataBase.findOne({ "bookingdetail._id": product_id, user_id: req.body.user_id }).lean();
    // if (GetFilter.length > 0) {
    //   error = "you have already reviewed this product";
    // }
    // if (!Purchased) {
    //   error = "you have not purchased this product";
    // }
    // var errorArray = Object.keys(error).length;
    if (error) {
      return res.status(400).json({
        message: "error",
        data: error,
        code: 0,
      });
    } else {
      var image = "";
      if (req.files) {
        for (var j = 0; j < req.files.length; j++) {
          if (req.files[j].fieldname === "image") {
            image = req.files[j].filename;
          }
        }
      }

      table.create(
        {
          user_id: req.body.user_id,
          product_id: req.body.product_id,
          rating: req.body.rating,
          review: req.body.review,
          image: image,
        },
        function (err, data) {
          if (err) {
            res.status(400).json({ message: "error", data: "Somthing went wrong", code: 0 });
          } else {
            res.status(200).json({ message: "ok", data: data, code: 1 });
          }
        }
      );
    }
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

  table
    .find()
    .count()
    .exec(function (err, count) {
      table
        .find()
        .skip(skip)
        .limit(limit)
        .sort({ created_at: "desc" })
        .exec(function (err, data) {
          if (err) {
            res.status(500).json(err);
          } else {
            res.status(200).json({ message: "ok", data: data, count: count, code: 1 });
          }
        });
    });
};
