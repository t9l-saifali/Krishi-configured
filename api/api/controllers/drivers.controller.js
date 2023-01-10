var mongoose = require("mongoose");
var table = mongoose.model("drivers");

module.exports.AddOne = function (req, res) {
  var emailFilter = { email: req.body.email };
  var mobileFilter = { mobile: req.body.mobile };
  var error = {};

  table
    .find(emailFilter)
    .exec()
    .then((getEmail) => {
      table
        .find(mobileFilter)
        .exec()
        .then((getMobile) => {
          // if (getEmail.length > 0) {
          //   error["email"] = "email already exist";
          // }
          // if (getMobile.length > 0) {
          //   error["mobile"] = "mobile already exist";
          // }
          var errorArray = Object.keys(error).length;
          if (errorArray > 0) {
            return res.status(400).json({
              message: "error",
              data: [error],
              code: 0,
            });
          } else {
            var name = req.body.name;
            table.create(
              {
                name: name.toLowerCase(),
                email: req.body.email,
                mobile: req.body.mobile,
                address: req.body.address,
              },
              function (err, data) {
                if (err) {
                  return res.status(400).json({
                    message: "error",
                    data: err,
                    code: 0,
                  });
                } else {
                  res.status(200).json({ message: "ok", data: data, code: 1 });
                }
              }
            );
          }
        })
        .catch(function (err) {
          return res.status(400).json({
            message: "error",
            data: err,
            code: 0,
          });
        });
    })
    .catch(function (err) {
      return res.status(400).json({
        message: "error",
        data: err,
        code: 0,
      });
    });
};

module.exports.Update = function (req, res) {
  var Id = req.body._id;
  var emailFilter = { email: req.body.email };
  var mobileFilter = { mobile: req.body.mobile };
  var error = {};
  table
    .find(emailFilter)
    .exec()
    .then((getEmail) => {
      table
        .find(mobileFilter)
        .exec()
        .then((getMobile) => {
          // if (getEmail.length > 0) {
          //   if (getEmail[0]._id != Id) {
          //     error["email"] = "email alreday exist";
          //   }
          // }
          // if (getMobile.length > 0) {
          //   if (getMobile[0]._id != Id) {
          //     error["mobile"] = "mobile alreday exist";
          //   }
          // }
          var errorArray = Object.keys(error).length;
          if (errorArray > 0) {
            return res.status(400).json({
              message: "error",
              data: [error],
              code: 0,
            });
          } else {
            table.findById(Id).exec(function (err, data) {
              if (err) {
                res.status(404).json({ message: "err", data: err, code: 0 });
                return;
              } else if (!data) {
                res.status(404).json({ message: "id not found in the database", data: "", code: 0 });
                return;
              }

              var updateData = {
                name: req.body.name,
                email: req.body.email,
                mobile: req.body.mobile,
                address: req.body.address,
                status: req.body.status,
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
          }
        })
        .catch(function (err) {
          return res.status(400).json({
            status: "error",
            result: err,
          });
        });
    })
    .catch(function (err) {
      return res.status(400).json({
        message: "error",
        data: err,
        code: 0,
      });
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

  if (limit > maxCount) {
    res.status(400).json({
      message: "Count limit of " + maxCount + " exceeded",
    });
    return;
  }

  if (req.body.name) {
    var name = req.body.name;
  }
  if (req.body.driver_id) {
    var driver_id = req.body.driver_id;
  }
  if (req.body.mobile) {
    var mobile = parseInt(req.body.mobile);
  }
  if (req.body.status) {
    var status = req.body.status;
  }

  var DataFilter = {};
  if (name != null) {
    DataFilter["name"] = { $regex: name, $options: "i" };
  }
  if (req.body.mobile != null) {
    //DataFilter['mobile'] = mobile
    DataFilter["$where"] = `/^${req.body.mobile}.*/.test(this.mobile)`;
  }
  if (driver_id) {
    DataFilter["_id"] = driver_id;
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

module.exports.DeleteOne = function (req, res) {
  var Id = req.body._id;
  table.findByIdAndRemove(Id).exec(function (err, data) {
    if (err) {
      res.status(404).json({ message: "error", data: err, code: 0 });
    } else {
      res.status(200).json({ message: "ok", data: "", code: 1 });
      return;
    }
  });
};
