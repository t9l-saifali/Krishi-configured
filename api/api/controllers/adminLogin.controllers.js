var mongoose = require("mongoose");
var Admin = mongoose.model("admin");
var common = require("../../common");

let jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports.adminLogin = function (req, res) {
  var email = req.body.email.trim();
  var password = req.body.password.trim();
  if (email && password) {
    Admin.findOne({ email: email, password: password, status: true })
      .populate("user_role")
      .lean()
      .exec(function (err, Admin) {
        if (err) {
          res.status(404).json(err);
          return;
        } else if (!Admin) {
          res.status(404).json({ message: "Invalid credentials !" });
          return;
        } else {
          let token = jwt.sign({ ID: Admin._id }, process.env.JWT_SECRET, {
            expiresIn: "24h", // expires in 24 hours
          });
          return res.status(200).json({ ...Admin, token });
        }
      });
  } else {
    res
      .status(404)
      .json({ message: "Please send the both key email and password!" });
  }
};

module.exports.adminGetAll = function (req, res) {
  var skip = 0;
  var limit = 50;
  var maxCount = 100;

  if (req.body.limit) {
    limit = req.body.limit;
  }
  if (req.body.skip) {
    skip = req.body.skip;
  }

  if (limit > maxCount) {
    res.status(400).json({
      message: "Count limit of " + maxCount + " exceeded",
    });
    return;
  }

  if (req.body.username) {
    var username = req.body.username;
  }
  if (req.body.email) {
    var email = req.body.email;
  }
  if (req.body.mobile) {
    var mobile = parseInt(req.body.mobile);
  }
  if (req.body.status) {
    var status = req.body.status;
  }
  if (req.body.user_role) {
    var user_role = req.body.user_role;
  }

  var DataFilter = {};
  if (username != null) {
    DataFilter["username"] = { $regex: username, $options: "i" };
  }
  if (email != null) {
    DataFilter["email"] = { $regex: email, $options: "i" };
  }
  if (req.body.mobile != null) {
    // DataFilter['mobile'] = mobile
    DataFilter["$where"] = `/^${req.body.mobile}.*/.test(this.mobile)`;
  }
  if (
    req.body.status != null ||
    req.body.status === false ||
    req.body.status === true
  ) {
    DataFilter["status"] = req.body.status;
  }
  if (user_role != null) {
    DataFilter["user_role"] = user_role;
  }

  Admin.find(DataFilter)
    .count()
    .exec(function (err, count) {
      Admin.find(DataFilter)
        .skip(skip)
        .limit(limit)
        .populate("user_role")
        .sort({ created_at: "desc" })
        .exec(function (err, Admins) {
          console.log(err);
          // console.log(Admins);
          if (err) {
            console.log("Error finding Admins");
            res.status(500).json(err);
          } else {
            res.json({ message: "ok", data: Admins, count: count });
          }
        });
    });
};
module.exports.adminGetAll_for_sales_person = async function (req, res) {
  let users = await Admin.find().populate("user_role").select("user_role username");
  // let sales_persons = users.filter((cur) => cur.user_role.role_name == "sales & marketing team");
  res.status(200).json({
    success: true,
    sales_persons: users,
  });
};

module.exports.adminAddOne = function (req, res) {
  var username = req.body.username;
  var user_role = req.body.user_role;
  var email = req.body.email;
  var mobile = req.body.mobile;
  var password = req.body.password;
  var status = req.body.status;
  var user_type = req.body.user_type;

  if (
    username == "" ||
    !username ||
    username == undefined ||
    username == null
  ) {
    common.formValidate("username", res);
    return false;
  }
  if (email == "" || !email || email == undefined || email == null) {
    common.formValidate("email", res);
    return false;
  }
  if (mobile == "" || !mobile || mobile == undefined || mobile == null) {
    common.formValidate("mobile", res);
    return false;
  }
  if (
    user_role == "" ||
    !user_role ||
    user_role == undefined ||
    user_role == null
  ) {
    common.formValidate("user_role", res);
    return false;
  }
  if (
    password == "" ||
    !password ||
    password == undefined ||
    password == null
  ) {
    common.formValidate("password", res);
    return false;
  }
  if (status == "" || !status || status == undefined || status == null) {
    common.formValidate("status", res);
    return false;
  }
  var DataFilter = { email: req.body.email };
  var DataMobile = { mobile: req.body.mobile };
  var error = {};
  Admin.find(DataFilter)
    .lean()
    .exec()
    .then((GetFilter) => {
      Admin.find(DataMobile)
        .lean()
        .exec()
        .then((GetMobile) => {
          if (GetFilter.length > 0) {
            error["email"] = "email alreday exist";
          }
          if (GetMobile.length > 0) {
            error["mobile"] = "mobile alreday exist";
          }
          var errorArray = Object.keys(error).length;
          if (errorArray > 0) {
            return res.status(400).json({
              message: "error",
              data: [error],
              code: 0,
            });
          } else {
            Admin.create(
              {
                username: username.toLowerCase(),
                user_role: user_role,
                email: email,
                mobile: mobile,
                password: password,
                status: status,
                user_type: "admin",
              },
              function (err, Admin) {
                if (err) {
                  res.status(400).json(err);
                } else {
                  res.status(201).json(Admin);
                }
              }
            );
          }
        });
    });
};

module.exports.adminDeleteOne = function (req, res) {
  var AdminId = req.body._id;
  Admin.findByIdAndRemove(AdminId).exec(function (err, location) {
    if (err) {
      res.status(404).json(err);
    } else {
      res.status(200).json({ message: "deleted succesfully" });
      return;
    }
  });
};

module.exports.updateAdmin = function (req, res) {
  var username = req.body.username;
  var user_role = req.body.user_role;
  var email = req.body.email;
  var mobile = req.body.mobile;
  var password = req.body.password;
  var status = req.body.status;
  var user_type = req.body.user_type;
  var _id = req.body._id;

  if (_id == "" || !_id || _id == undefined || _id == null) {
    common.formValidate("_id", res);
    return false;
  }
  if (
    username == "" ||
    !username ||
    username == undefined ||
    username == null
  ) {
    common.formValidate("username", res);
    return false;
  }
  if (email == "" || !email || email == undefined || email == null) {
    common.formValidate("email", res);
    return false;
  }
  if (mobile == "" || !mobile || mobile == undefined || mobile == null) {
    common.formValidate("mobile", res);
    return false;
  }
  if (
    user_role == "" ||
    !user_role ||
    user_role == undefined ||
    user_role == null
  ) {
    common.formValidate("user_role", res);
    return false;
  }
  // if (status == "" || !status || status == undefined || status == null) {
  //   common.formValidate("status", res);
  //   return false;
  // }

  var newvalues = {
    username: username,
    email: email,
    mobile: mobile,
    user_role: user_role,
    status: status,
    password: req.body.password,
  };
  var DataFilter = { email: req.body.email };
  var DataMobile = { mobile: req.body.mobile };
  var error = {};

  Admin.find(DataFilter)
    .lean()
    .exec()
    .then((GetFilter) => {
      Admin.find(DataMobile)
        .lean()
        .exec()
        .then((GetMobile) => {
          if (GetFilter.length > 0) {
            if (GetFilter[0]._id != _id) {
              error["email"] = "email alreday exist";
            } else {
              console.log("else");
            }
          }

          if (GetMobile.length > 0) {
            if (GetMobile[0]._id != _id) {
              error["mobile"] = "mobile alreday exist";
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
            Admin.update({ _id: _id }, { $set: newvalues }, function (
              err,
              data
            ) {
              if (err) {
                res.status(500).json({ message: "", data: err });
              } else {
                Admin.findOne({ _id: _id }).exec(function (err, user) {
                  res
                    .status(200)
                    .json({ message: "admin updated!", data: user, code: 1 });
                  return;
                });
              }
            });
          }
        });
    });
};
