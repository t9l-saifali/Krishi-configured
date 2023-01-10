var mongoose = require("mongoose");
var table = mongoose.model("payment_options");

module.exports.Add = function (req, res) {
  var body = req.body;
  var nameFilter = { name: req.body.name };
  var error = {};
  table
    .find(nameFilter)
    .exec()
    .then((GetFilter) => {
      if (GetFilter.length > 0) {
        error["name"] = "name already exist";
      }
      var errorArray = Object.keys(error).length;
      if (errorArray > 0) {
        return res.status(400).json({
          message: "error",
          data: [error],
          code: 0,
        });
      } else {
        let data = {
          name: body.name,
          adminStatus: body.adminStatus,
          frontendStatus: body.frontendStatus,
          staging: body.staging,
          staging_txn_url: body.staging_txn_url,
          production_txn_url: body.production_txn_url,
        };
        delete body.name;
        delete body.adminStatus;
        delete body.frontendStatus;
        delete body.staging;
        delete body.staging_txn_url;
        delete body.production_txn_url;
        data.keys = body;
        console.log("data ======= ", data);
        table.create(data, function (err, data) {
          if (err) {
            console.log(err);
            res.status(500).json({ message: "error", data: "Somthing went wrong", code: 0 });
          } else {
            res.status(201).json({ message: "ok", data: data, code: 1 });
          }
        });
      }
    });
};

module.exports.GetAll = function (req, res) {
  table.find().exec(function (err, data) {
    if (err) {
      res.status(500).json({ message: "error", data: "Somthing went wrong", code: 0 });
    } else {
      res.status(200).json({ message: "ok", data: data, code: 1 });
    }
  });
};

module.exports.GetOne = function (req, res) {
  table
    .findOne({ name: req.body.name })
    .lean()
    .exec(function (err, data) {
      if (err) {
        res.status(500).json({ message: "error", data: "Somthing went wrong", code: 0 });
      } else {
        res.status(200).json({ message: "ok", data: data, code: 1 });
      }
    });
};

module.exports.Update = function (req, res) {
  console.log(req.body);
  var body = req.body;
  var nameFilter = { name: req.body.name };
  var error = {};
  table
    .find(nameFilter)
    .exec()
    .then((GetFilter) => {
      console.log(GetFilter);
      if (GetFilter.length > 0) {
        if (GetFilter[0]._id != req.body._id) {
          error["name"] = "name alreday exist";
        }
      }
      var errorArray = Object.keys(error).length;
      if (errorArray > 0) {
        return res.status(400).json({
          message: "error",
          data: [error],
          code: 0,
        });
      } else {
        table.findById(req.body._id).exec(function (err, data) {
          if (err) {
            res.status(500).json({ message: "error", data: "Somthing went wrong", code: 0 });
            return;
          } else if (!data) {
            res.status(404).json({ message: "error", data: "id not found", code: 0 });
            return;
          }

          table.update({ _id: req.body._id }, { $set: req.body }, function (err, data) {
            if (err) {
              res.status(500).json({ message: "error", data: "Somthing went wrong", code: 0 });
            } else {
              res.status(200).json({ message: "ok", data: "Updated", code: 1 });
              return;
            }
          });
        });
      }
    });
};

module.exports.DeleteOne = function (req, res) {
  var _id = req.body._id;
  table.findByIdAndRemove(_id).exec(function (err, data) {
    if (err) {
      res.status(500).json({ message: "error", data: "Somthing went wrong", code: 0 });
    } else {
      res.status(200).json({ message: "ok", data: "", code: 1 });
      return;
    }
  });
};
