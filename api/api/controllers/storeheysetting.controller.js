var mongoose = require("mongoose");
var table = mongoose.model("storeheysettings");
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
    table.create(
      {
        reviewRating: req.body.reviewRating,
        giftingOnOff: req.body.giftingOnOff,
        creditPaymentOnOff: req.body.creditPaymentOnOff,
        creditPaymentOnline: req.body.creditPaymentOnline,
        creditPaymentOffline: req.body.creditPaymentOffline,
        invoiceDeclaration: req.body.invoiceDeclaration,
        invoicePaymentDetail: req.body.invoicePaymentDetail,
        whatsappOnOff: req.body.whatsappOnOff,
        simple_product: req.body.simple_product,
        config_product: req.body.config_product,
        group_product: req.body.group_product,
      },
      function (err, data) {
        if (err) {
          res.status(400).json(err);
        } else {
          res.status(201).json({
            message: "ok",
            data: data,
            code: 1,
          });
        }
      }
    );
  });
};

module.exports.GetAll = function (req, res) {
  table.find().exec(function (err, data) {
    if (err) {
      res.status(500).json(err);
    } else {
      res.status(200).json({ message: "ok", data: data, code: 1 });
    }
  });
};

module.exports.UpdateOne = function (req, res) {
  upload(req, res, function (err) {
    var Id = req.body._id;
    table.findById(Id).exec(function (err, data) {
      if (err) {
        res.status(404).json({
          message: "id not found in the database",
          data: err,
          code: 0,
        });
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
        reviewRating: req.body.reviewRating,
        giftingOnOff: req.body.giftingOnOff,
        creditPaymentOnOff: req.body.creditPaymentOnOff,
        creditPaymentOnline: req.body.creditPaymentOnline,
        creditPaymentOffline: req.body.creditPaymentOffline,
        invoiceDeclaration: req.body.invoiceDeclaration,
        invoicePaymentDetail: req.body.invoicePaymentDetail,
        whatsappOnOff: req.body.whatsappOnOff,
        simple_product: req.body.simple_product,
        config_product: req.body.config_product,
        group_product: req.body.group_product,
      };
      table.updateOne({ _id: Id }, { $set: updateData }, function (err, data) {
        if (err) {
          res.status(500).json({
            message: "",
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
    });
  });
};
