var mongoose = require("mongoose");
var User = mongoose.model("Users");
var Admin = mongoose.model("admin");
var common = require("../../common");
var bookingDataBase = mongoose.model("bookings");
var ProductDatabase = mongoose.model("products");
var CatDataBase = mongoose.model("product_categories");
var UserAddressTable = mongoose.model("UserAddress");
var SettingsModel = mongoose.model("settings");
var jwt = require("jsonwebtoken");
const { default: async } = require("async");
require("dotenv").config();

function uniqueId(length) {
  var result = "";
  var characters = "0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function refferID(length) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function sendNotification(mobile, otp, name = null, email = null) {
  var message = "Welcome to Krishi Cress. Your OTP is " + otp;
  const subject = "Sign up OTP for Krishi Cress.";
  // console.log('otp -==>>>', otp);

  try {
    common.sendOtp(mobile, message);
    if (email) {
      common.sendMail(email, subject, name, message, null, null);
    }
  } catch (err) {
    console.log(err);
  }
}

// module.exports.mobileSignUp = async function (req, res) {
//   var contactNumber = req.body.contactNumber;
//   if (!contactNumber) {
//     common.formValidate("contactNumber", res);
//     return false;
//   }

//   let userData = await User.findOne({ contactNumber }).lean();
//   if (userData) {
//     // user exists -- send otp for login
//     if (userData.status === false) {
//       return res
//         .status(400)
//         .json({ message: "error", data: "Account deactivate" });
//     }
//     let otp = uniqueId(6);
//     let newvalues = { otp };
//     await User.updateOne({ contactNumber }, { $set: newvalues });

//     let { emailOnSignup } = await SettingsModel.findOne(
//       {},
//       { emailOnSignup: 1 }
//     ).lean();
//     emailOnSignup
//       ? sendNotification(contactNumber, otp, userData.name, userData.email)
//       : sendNotification(contactNumber, otp);

//     return res.status(200).json({
//       message: "ok",
//       data: { userExists: true, ...userData, otp },
//       code: 1,
//     });
//   } else {
//     // user doesn't exists -- so signup
//     return res
//       .status(200)
//       .json({ message: "ok", data: { userExists: false }, code: 1 });
//   }
// };
module.exports.mobileSignUp = async function (req, res) {
  var contactNumber = req.body.contactNumber;
  if (!contactNumber) {
    common.formValidate("contactNumber", res);
    return false;
  }

  let userData = await User.findOne({ contactNumber }).lean();
  if (userData) {
    // user exists -- send otp for login
    if (userData.status === false) {
      return res.status(400).json({ message: "error", data: "Account deactivate" });
    }
    let otp = uniqueId(6);
    let newvalues = { otp };
    let updation = {
      otp: otp,
      isLogedIn: true,
    };
    //console.log(updation);
    //await User.updateOne({ contactNumber }, { $set: newvalues });
    await User.updateOne({ contactNumber }, { $set: updation });

    // let { emailOnSignup } = await SettingsModel.findOne({}, { emailOnSignup: 1 }).lean();
    // emailOnSignup ? sendNotification(contactNumber, otp, userData.name, userData.email) : sendNotification(contactNumber, otp);

    return res.status(200).json({
      message: "ok",
      data: { userExists: true, ...userData, otp },
      code: 1,
    });
  } else {
    // user doesn't exists -- so signup
    return res.status(200).json({ message: "ok", data: { userExists: false }, code: 1 });
  }
};
module.exports.updateMobile = async function (req, res) {
  var _id = req.body.user_id;
  var contactNumber = req.body.contactNumber;
  var otp = uniqueId(6);
  var error = {};
  if (_id == "" || !_id || _id == undefined || _id == null) {
    common.formValidate("user_id", res);
    return false;
  }
  if (contactNumber == "" || !contactNumber || contactNumber == undefined || contactNumber == null) {
    common.formValidate("contactNumber", res);
    return false;
  }

  let { emailOnSignup } = await SettingsModel.findOne({}, { emailOnSignup: 1 }).lean();

  var GetMobile = { contactNumber: req.body.contactNumber };
  User.find(GetMobile)
    .exec()
    .then((GetMobile) => {
      User.findOne({ _id: _id }).exec(function (err, data) {
        // console.log("GetMobile", GetMobile);
        // console.log("_id", _id);
        // console.log("contactNumber", contactNumber);
        if (GetMobile.length > 0) {
          if (GetMobile[0]._id != _id) {
            error["contactNumber"] = "mobile already exist";
          }
        }
        if (!data) {
          error["user_id"] = "User not found";
        }
        var errorArray = Object.keys(error).length;
        if (errorArray > 0) {
          return res.status(200).json({
            status: "error",
            result: [error],
          });
        } else {
          if (data.contactNumber == contactNumber) {
            var newvalues = {
              contactNumber: contactNumber,
            };
          } else {
            emailOnSignup ? sendNotification(contactNumber, otp, null, data.email) : sendNotification(contactNumber, otp);
            var newvalues = {
              otp: otp,
              otp_verified: false,
            };
          }

          User.update({ _id: _id }, { $set: newvalues }, function (err, data) {
            if (err) {
              res.status(500).json({ message: "error", data: err });
            } else {
              User.find({ _id: _id }).exec(function (err, user) {
                if (err) {
                  res.status(404).json({ message: "error", data: err, code: 0 });
                  return;
                } else {
                  res.status(200).json({ message: "ok", data: user, code: 1 });
                  return;
                }
              });
            }
          });
        }
      });
    });
};

module.exports.userMobileVerification = async function (req, res) {
  let getToken = req.body.getToken;
  var _id = req.body.user_id;
  var otp = req.body.otp;
  var contactNumber = req.body.contactNumber;

  let users = await User.findOne({ contactNumber: contactNumber });
  if (users && users.length > 0) {
    res.status(200).json({
      status: "error",
      result: [{ contactNumber: "mobile already exist" }],
    });
  }

  let  tokenExpiration = 3600000

  if (_id) {
    User.findById(_id).exec(function (err, data) {
      if (err) {
        res.status(404).json({
          message: "id not found in the database",
          data: err,
          code: 0,
        });
        return;
      } else if (!data) {
        res.status(404).json({ message: "id not found in the database", data: "", code: 0 });
        return;
        // } else if (data.otp_verified === true) {
        //   res.status(200).json({ message: "already verified", data: data, code: 1 });
        //   return;
      } else if (parseInt(otp) === parseInt(data.otp)) {
        var newvalues = {
          otp_verified: true,
          verified_on: new Date(),
        };
        if (contactNumber) {
          newvalues.contactNumber = contactNumber;
        }

        let token = null;
        // getToken && data.name && data.email && data.contactNumber
        if (getToken) {
          // console.log("process.env.JWT_SECRET ::::::::::::", process.env.JWT_SECRET);
          token = jwt.sign({ ID: data._id }, process.env.JWT_SECRET, {
            expiresIn: +tokenExpiration * 60,
          });
          newvalues = { ...newvalues, token: token };
          if(data?.tokens?.length < 4 && Array.isArray(data?.tokens)){
          newvalues = { ...newvalues, tokens: [...data.tokens,token] };
          } else if (!Array.isArray(data?.tokens)) {
          newvalues = { ...newvalues, tokens: [token] };
          } else if(data?.tokens?.length >= 4) {
            newvalues = { ...newvalues, tokens: [...data.tokens.slice(-4),token] };
          }
        }

        User.updateOne({ _id: _id }, { $set: newvalues }, function (err, data) {
          if (err) {
            res.status(500).json({ message: "", data: err });
          } else {
            User.findById(_id).exec(function (err, data1) {
              if (err) {
                res.status(404).json({
                  message: "id not found in the database",
                  data: err,
                  code: 0,
                });
                return;
              } else {
                res.status(200).json({
                  message: "otp Verified!",
                  data: data1,
                  code: 1,
                  token,
                });
                return;
              }
            });
          }
        });
      } else {
        res.status(401).json({ message: "otp not Matched!", data: [], code: 0 });
        return;
      }
    });
  } else {
    res.status(404).json({ message: "user_id required!", data: [], code: 0 });
    return;
  }
};

module.exports.resendOtp = async function (req, res) {
  var otp = uniqueId(6);
  var contactNumber = req.body.contactNumber;
  // var email = req.body.email;

  // let { emailOnSignup } = await SettingsModel.findOne({}, { emailOnSignup: 1 }).lean();

  if (contactNumber) {
    User.find({ contactNumber: contactNumber }).exec(function (err, data) {
      if (err) {
        res.status(404).json(err);
      } else if (!data) {
        res.status(404).json({ message: "no user found", code: 0 });
      } else {
        var newvalues = {
          // user_id: data.user_id,
          contactNumber: contactNumber,
          otp: otp,
          // otp_verified: false,
        };
        User.update({ contactNumber: contactNumber }, { $set: newvalues }, function (err, data1) {
          if (err) {
            res.status(500).json({ message: "", data: err });
          } else {
            // emailOnSignup ? sendNotification(contactNumber, otp, data[0].name || null, data[0].email) : sendNotification(contactNumber, otp);
            res.status(200).json({ message: "ok", code: 1 });
            return;
          }
        });
      }
    });
  } else {
    res.status(404).json({ message: "contactNumber required!", otp: "", code: 0 });
    return;
  }
};

module.exports.userUpdate = async function (req, res) {
  let getToken = req.body.getToken;
  var user_id = req.decoded.ID;
  var name = typeof req.body.name == "string" ? req.body.name.trim() : req.body.name;
  var email = req.body.email;
  var contactNumber = req.body.contactNumber;
  var refferalCodeFrom = req.body.refferalCodeFrom;
  var gst_no = req.body.gst_no;
  var otp = uniqueId(6);

  console.log(refferalCodeFrom, "frommmmmmmmmmm");
  if (contactNumber == "" || !contactNumber || contactNumber == undefined || contactNumber == null) {
    common.formValidate("contactNumber", res);
    return false;
  }

  if (refferalCodeFrom) {
    let users = [];
    users = await User.findOne({ myRefferalCode: refferalCodeFrom }).lean();
    if (!users || users.length <= 0) {
      return res.status(200).json({
        message: "error",
        data: [],
        code: 0,
        invalidRefferal: true,
      });
    }
  }

  let { tokenExpiration } = await SettingsModel.findOne({}, { tokenExpiration: 1 }).lean();

  var newvalues = {
    name: name,
    email: email,
    contactNumber: contactNumber,
    gst_no: gst_no,
    refferalCodeFrom: refferalCodeFrom,
  };
  console.log(newvalues, "newvaluesnewvalues");
  var DataFilter = { email: new RegExp(req.body.email, "i") };
  var GetMobile = { contactNumber: req.body.contactNumber };
  var error = {};
  User.find(DataFilter)
    .exec()
    .then((GetFilter) => {
      User.find(GetMobile)
        .exec()
        .then(async (GetMobile) => {
          if (GetFilter.length > 0) {
            if (GetFilter[0]._id != user_id) {
              // error["email"] = "Email already exist";
            }
          }
          if (GetMobile.length > 0) {
            if (GetMobile[0]._id != user_id) {
              error["contactNumber"] = "Mobile already exist";
            }
          }
          var errorArray = Object.keys(error).length;
          if (errorArray > 0) {
            return res.status(200).json({
              status: "error",
              result: [error],
            });
          } else {
            // console.log(newvalues);

            let token = null;
            // getToken
            if (getToken) {
              // console.log("process.env.JWT_SECRET ::::::::::::", process.env.JWT_SECRET);
              token = jwt.sign({ ID: user_id }, process.env.JWT_SECRET, {
                expiresIn: +tokenExpiration * 60,
              });
          let data = await User.findById(user_id)
          if(data?.tokens?.length < 4 && Array.isArray(data?.tokens)){
          newvalues = { ...newvalues, tokens: [...data.tokens,token] }
          } else if (!Array.isArray(data?.tokens)) {
          newvalues = { ...newvalues, tokens: [token] };
          } else if(data?.tokens?.length >= 4) {
            newvalues = { ...newvalues, tokens: [...data.tokens.slice(-4),token] };
          }
            }

            User.findOneAndUpdate({ _id: user_id }, { $set: newvalues }, { new: true }, function (err, data) {
              // console.log("--------- 2", err);
              // console.log("--------- 3", data);
              if (err) {
                res.status(500).json({ message: "", data: err });
              } else {
                // console.log("--------- 4", token);
                //sendNotification(contactNumber, otp)
                return res.status(200).json({
                  message: "user updated!",
                  data: data,
                  code: 1,
                  token,
                });
              }
            });
          }
        });
    });
};

module.exports.createUserWhileSignup = async function (req, res) {
  // let getToken = req.body.getToken;
  // var user_id = req.decoded.ID;
  var name = typeof req.body.name == "string" ? req.body.name.trim() : req.body.name;
  var email = req.body.email;
  var contactNumber = req.body.contactNumber;
  var refferalCodeFrom = req.body.refferalCodeFrom;
  // var gst_no = req.body.gst_no;
  var otp = uniqueId(6);

  console.log(refferalCodeFrom, "frommmmmmmmmmm");
  if (!contactNumber) {
    common.formValidate("contactNumber", res);
    return false;
  }

  if (refferalCodeFrom) {
    let users = [];
    users = await User.findOne({ myRefferalCode: refferalCodeFrom }).lean();
    if (!users || users.length <= 0) {
      return res.status(200).json({
        message: "error",
        data: [],
        code: 0,
        invalidRefferal: true,
      });
    }
  }

  // let { tokenExpiration } = await SettingsModel.findOne({}, { tokenExpiration: 1 }).lean();
  let { emailOnSignup } = await SettingsModel.findOne({}, { emailOnSignup: 1 }).lean();

  var newvalues = {
    name: name,
    email: email,
    contactNumber: contactNumber,
    // gst_no: gst_no,
    refferalCodeFrom: refferalCodeFrom || null,
    myRefferalCode: refferID(6) + +new Date(),
    otp: otp,
    otp_verified: false,
  };
  // console.log(newvalues, "newvaluesnewvalues");
  // var DataFilter = { email: new RegExp(req.body.email, "i") };
  var GetMobile = { contactNumber: req.body.contactNumber };
  var error = {};
  // User.find(DataFilter)
  // .exec()
  // .then((GetFilter) => {
  User.find(GetMobile)
    .exec()
    .then((GetMobile) => {
      // if (GetFilter.length > 0) {
      // if (GetFilter[0]._id != user_id) {
      // error["email"] = "Email already exist";
      // }
      // }
      if (GetMobile.length > 0) {
        // if (GetMobile[0]._id != user_id) {
        error["contactNumber"] = "Mobile already exist";
        // }
      }
      var errorArray = Object.keys(error).length;
      if (errorArray > 0) {
        return res.status(200).json({
          status: "error",
          result: [error],
        });
      } else {
        // console.log(newvalues);

        // let token = null;
        // // getToken
        // if (getToken) {
        //   // console.log("process.env.JWT_SECRET ::::::::::::", process.env.JWT_SECRET);
        //   token = jwt.sign({ ID: user_id }, process.env.JWT_SECRET, {
        //     expiresIn: +tokenExpiration * 60,
        //   });
        // }

        User.create(newvalues, function (err, data) {
          // console.log("--------- 2", err);
          // console.log("--------- 3", data);
          if (err) {
            res.status(500).json({ message: "", data: err });
          } else {
            // console.log("--------- 4", token);
            //sendNotification(contactNumber, otp)
            emailOnSignup ? sendNotification(contactNumber, otp, name, email) : sendNotification(contactNumber, otp);

            return res.status(200).json({
              message: "user created!",
              data: data,
              code: 1,
              // token,
            });
          }
        });
      }
    });
  // });
};

module.exports.userCreateByAdmin = function (req, res) {
  var adminID = req.body.adminID;
  var name = typeof req.body.name == "string" ? req.body.name.trim() : req.body.name;
  var email = req.body.email;
  var contactNumber = req.body.contactNumber;
  var status = req.body.status;
  var creditLimit = req.body.creditLimit;
  var user_type = req.body.user_type;
  var gst_number = req.body.gst_number;

  if (adminID == "" || !adminID || adminID == undefined || adminID == null) {
    common.formValidate("adminID", res);
    return false;
  }
  if (name == "" || !name || name == undefined || name == null) {
    common.formValidate("name", res);
    return false;
  }
  if (email == "" || !email || email == undefined || email == null) {
    common.formValidate("email", res);
    return false;
  }
  if (contactNumber == "" || !contactNumber || contactNumber == undefined || contactNumber == null) {
    common.formValidate("contactNumber", res);
    return false;
  }
  if (user_type == "" || !user_type || user_type == undefined || user_type == null) {
    common.formValidate("user_type", res);
    return false;
  }

  var newvalues = {
    adminID: adminID,
    name: name,
    email: email,
    contactNumber: contactNumber,
    user_type: user_type,
    gst_no: gst_number ? gst_number : null,
    myRefferalCode: refferID(6) + +new Date(),
    status: true,
    creditLimit: +creditLimit || 0,
    otp_verified: true,
  };

  var DataFilter = { email: new RegExp(req.body.email, "i") };
  var DataMobile = { contactNumber: req.body.contactNumber };
  var error = {};
  Admin.findOne({ _id: adminID })
    .lean()
    .exec()
    .then((getAdmin) => {
      User.find(DataFilter)
        .lean()
        .exec()
        .then((GetFilter) => {
          User.find(DataMobile)
            .lean()
            .exec()
            .then((GetMobile) => {
              //console.log('')
              if (getAdmin == null) {
                error["adminID"] = "admin not found in database";
              }
              if (GetFilter.length > 0) {
                // error["email"] = "email already exist";
              }

              if (GetMobile.length > 0) {
                error["contactNumber"] = "mobile already exist";
              }
              var errorArray = Object.keys(error).length;
              if (errorArray > 0) {
                return res.status(400).json({
                  status: "error",
                  result: [error],
                });
              } else {
                //console.log('newvalues', newvalues)
                User.create(newvalues, function (err, data) {
                  if (err) {
                    res.status(500).json({ message: "error", data: err });
                  } else {
                    res.status(200).json({ message: "ok", data: data, code: 1 });
                    return;
                  }
                });
              }
            });
        });
    });
};
// module.exports.userUpdateByAdmin = async function (req, res) {
//   var adminID = req.body.adminID;
//   var user_id = req.body.user_id;
//   var gst_number = req.body.gst_number;
//   var creditLimit = req.body.creditLimit;
//   var name = typeof req.body.name == "string" ? req.body.name.trim() : req.body.name;
//   var email = req.body.email;
//   var contactNumber = req.body.contactNumber;
//   var user_type = req.body.user_type;
//   var status = req.body.status;

//   if (adminID == "" || !adminID || adminID == undefined || adminID == null) {
//     common.formValidate("adminID", res);
//     return false;
//   }
//   if (user_id == "" || !user_id || user_id == undefined || user_id == null) {
//     common.formValidate("user_id", res);
//     return false;
//   }
//   if (contactNumber == "" || !contactNumber || contactNumber == undefined || contactNumber == null) {
//     common.formValidate("contactNumber", res);
//     return false;
//   }
//   let { tokenExpiration } = await SettingsModel.findOne({}, { tokenExpiration: 1 }).lean();
//   token = jwt.sign({ ID: req.body.user_id }, process.env.JWT_SECRET, {
//     expiresIn: +tokenExpiration * 60,
//   });
//   var newvalues = {
//     adminID: adminID,
//     name: name,
//     email: email,
//     contactNumber: contactNumber,
//     status: status,
//     gst_no: gst_number ? gst_number : null,
//     creditLimit: +creditLimit || 0,
//     user_type: user_type,
//     isLogedIn: false,
//     token: token,
//   };

//   var DataFilter = { email: new RegExp(req.body.email, "i") };
//   var DataMobile = { contactNumber: req.body.contactNumber };
//   var error = {};
//   Admin.findOne({ _id: adminID })
//     .lean()
//     .exec()
//     .then((getAdmin) => {
//       User.find(DataFilter)
//         .lean()
//         .exec()
//         .then((GetFilter) => {
//           User.find(DataMobile)
//             .lean()
//             .exec()
//             .then((GetMobile) => {
//               if (getAdmin == null) {
//                 error["adminID"] = "admin not found in database";
//               }
//               if (GetFilter.length > 0) {
//                 if (GetFilter[0]._id != user_id) {
//                   //console.log('email')
//                   // error["email"] = "email already exist";
//                 } else {
//                   //console.log('else');
//                 }
//               }

//               if (GetMobile.length > 0) {
//                 //console.log('mobile')
//                 if (GetMobile[0]._id != user_id) {
//                   error["contactNumber"] = "mobile already exist";
//                 }
//               }

//               var errorArray = Object.keys(error).length;
//               if (errorArray > 0) {
//                 return res.status(200).json({
//                   status: "error",
//                   result: [error],
//                 });
//               } else {
//                 User.findOneAndUpdate({ _id: user_id }, { $set: newvalues }, function (err, data) {
//                   if (err) {
//                     res.status(500).json({ message: "", data: err });
//                   } else {
//                     // sendOtp(contactNumber,otp)
//                     User.findOne({ _id: user_id }).exec(function (err, user) {
//                       res.status(200).json({
//                         message: "user updated!",
//                         data: user,
//                         code: 1,
//                       });
//                       return;
//                     });
//                   }
//                 });
//               }
//             });
//         });
//     });
// };

module.exports.userUpdateByAdmin = async function (req, res) {
  var adminID = req.body.adminID;
  var user_id = req.body.user_id;
  var gst_number = req.body.gst_number;
  var creditLimit = req.body.creditLimit;
  var name = typeof req.body.name == "string" ? req.body.name.trim() : req.body.name;
  var email = req.body.email;
  var contactNumber = req.body.contactNumber;
  var user_type = req.body.user_type;
  var status = req.body.status;

  if (adminID == "" || !adminID || adminID == undefined || adminID == null) {
    common.formValidate("adminID", res);
    return false;
  }
  if (user_id == "" || !user_id || user_id == undefined || user_id == null) {
    common.formValidate("user_id", res);
    return false;
  }
  if (contactNumber == "" || !contactNumber || contactNumber == undefined || contactNumber == null) {
    common.formValidate("contactNumber", res);
    return false;
  }
  let { tokenExpiration } = await SettingsModel.findOne({}, { tokenExpiration: 1 }).lean();
  token = jwt.sign({ ID: req.body.user_id }, process.env.JWT_SECRET, {
    expiresIn: +tokenExpiration * 60,
  });

  var newvalues = {
    adminID: adminID,
    name: name,
    email: email,
    contactNumber: contactNumber,
    status: status,
    gst_no: gst_number ? gst_number : null,
    creditLimit: +creditLimit || 0,
    user_type: user_type,
    isLogedIn: false,
    token: token,
  };
  let data = await User.findById(user_id)
          if(data?.tokens?.length < 4 && Array.isArray(data?.tokens)){
          newvalues = { ...newvalues, tokens: [...data.tokens,token] }
          } else if (!Array.isArray(data?.tokens)) {
          newvalues = { ...newvalues, tokens: [token] };
          } else if(data?.tokens?.length >= 4) {
            newvalues = { ...newvalues, tokens: [...data.tokens.slice(-4),token] };
          }
  if (req.body.sales_person) {
    newvalues = { ...newvalues, sales_person: req.body.sales_person };
  }
  var DataFilter = { email: new RegExp(req.body.email, "i") };
  var DataMobile = { contactNumber: req.body.contactNumber };
  var error = {};
  Admin.findOne({ _id: adminID })
    .lean()
    .exec()
    .then((getAdmin) => {
      User.find(DataFilter)
        .lean()
        .exec()
        .then((GetFilter) => {
          User.find(DataMobile)
            .lean()
            .exec()
            .then((GetMobile) => {
              if (getAdmin == null) {
                error["adminID"] = "admin not found in database";
              }
              if (GetFilter.length > 0) {
                if (GetFilter[0]._id != user_id) {
                  //console.log('email')
                  // error["email"] = "email already exist";
                } else {
                  //console.log('else');
                }
              }

              if (GetMobile.length > 0) {
                //console.log('mobile')
                if (GetMobile[0]._id != user_id) {
                  error["contactNumber"] = "mobile already exist";
                }
              }

              var errorArray = Object.keys(error).length;
              if (errorArray > 0) {
                return res.status(200).json({
                  status: "error",
                  result: [error],
                });
              } else {
                User.findOneAndUpdate({ _id: user_id }, { $set: newvalues }, function (err, data) {
                  if (err) {
                    res.status(500).json({ message: "", data: err });
                  } else {
                    // sendOtp(contactNumber,otp)
                    User.findOne({ _id: user_id }).exec(function (err, user) {
                      res.status(200).json({
                        message: "user updated!",
                        data: user,
                        code: 1,
                      });
                      return;
                    });
                  }
                });
              }
            });
        });
    });
};
module.exports.userLogin = function (req, res) {
  var email = req.body.email;
  var password = req.body.password;
  if (email && password) {
    User.findOne({ email: new RegExp(email, "i"), password: password }).exec(function (err, user) {
      if (err) {
        res.status(404).json(err);
        return;
      } else if (!user) {
        res.status(404).json({ message: "Invaild credencials !" });
        return;
      }
      res.status(200).json(user);
      return;
    });
  } else {
    res.status(404).json({ message: "Please send the both key email and password!" });
  }
};

// module.exports.usersGetAll = function (req, res) {
//   var name = null;
//   var email = null;
//   var contactNumber = null;
//   var customer_id = null;

//   var skip = 0;
//   var limit = 5;
//   var maxCount = 50;

//   if (req.body && req.body.skip) {
//     skip = parseInt(req.body.skip);
//   }

//   if (req.body && req.body.limit) {
//     limit = parseInt(req.body.limit, 10);
//   }

//   if (limit > maxCount) {
//     res.status(400).json({
//       message: "Count limit of " + maxCount + " exceeded",
//     });
//     return;
//   }
//   if (req.body.name) {
//     name =
//       typeof req.body.name == "string" ? req.body.name.trim() : req.body.name;
//   }
//   if (req.body.customer_id) {
//     customer_id = req.body.customer_id;
//   }
//   if (req.body.email) {
//     email = req.body.email;
//   }
//   if (req.body.contactNumber) {
//     contactNumber = req.body.contactNumber;
//   }
//   if (req.body.user_type) {
//     var user_type = req.body.user_type;
//   }

//   var DataFilter = {};
//   if (customer_id != null) {
//     DataFilter["_id"] = customer_id;
//   }

//   if (name != null) {
//     DataFilter["name"] = { $regex: name, $options: "i" };
//   }
//   if (email != null) {
//     DataFilter["email"] = { $regex: email, $options: "i" };
//   }
//   if (user_type != null) {
//     DataFilter["user_type"] = { $regex: user_type };
//   }
//   if (req.body.status != null) {
//     DataFilter["status"] = req.body.status;
//   }
//   DataFilter["otp_verified"] = true;
//   if (contactNumber != null) {
//     //DataFilter['contactNumber'] = contactNumber
//     DataFilter["$where"] = `/^${contactNumber}.*/.test(this.contactNumber)`;
//   }

//   User.find(DataFilter)
//     .count()
//     .exec(function (err, count) {
//       User.find(DataFilter)
//         .skip(skip)
//         .limit(limit)
//         .sort({ created_at: -1 })
//         .exec(function (err, array1) {
//           bookingDataBase
//             .aggregate([
//               {
//                 $group: {
//                   _id: "$user_id",
//                   details: { $push: "$$ROOT" },
//                   totalOrder: { $sum: 1 },
//                   totalAmount: { $sum: "$total_payment" },
//                 },
//               },
//             ])
//             .exec(function (err, array2) {
//               if (err) {
//                 res.status(500).json(err);
//               } else if (!array2) {
//                 res.status(400).json({ message: "error", data: "", code: 0 });
//               }

//               const obj = {
//                 part1: array1,
//                 part2: array2,
//               };
//               const mergeObject = (obj = {}) => {
//                 let result = [];
//                 result = Object.keys(obj).reduce(
//                   (function (hash) {
//                     return function (r, k) {
//                       obj[k].forEach(function (o) {
//                         if (!hash[o._id]) {
//                           hash[o._id] = {};
//                           r.push(hash[o._id]);
//                         }
//                         Object.keys(o).forEach(function (l) {
//                           hash[o._id][l] = o[l];
//                         });
//                       });
//                       return r;
//                     };
//                   })(Object.create(null)),
//                   []
//                 );
//                 return result;
//               };

//               var result = mergeObject(obj);

//               var JsonData = [];
//               for (var i = 0; i < result.length; i++) {
//                 //console.log(result[i])

//                 if (!result[i].details) {
//                   var details = [];
//                   var totalOrder = null;
//                   var totalAmount = null;
//                   var LOrderDate = null;
//                 } else {
//                   var LastOrderDate = result[i].details;
//                   var lastOrderDate = LastOrderDate[LastOrderDate.length - 1];
//                   var details = result[i].details;
//                   var totalOrder = result[i].totalOrder;
//                   var totalAmount = result[i].totalAmount;
//                   var LOrderDate = lastOrderDate.createDate;
//                 }
//                 if (result[i]._doc) {
//                   var userData = result[i]._doc;
//                   JsonData.push({
//                     user: userData,
//                     created_at: userData.created_at,
//                     details: details,
//                     totalOrder: userData.NoOfOrder,
//                     totalAmount: totalAmount,
//                     LOrderDate: userData.LastOrderDate,
//                     available_loyalty_points: userData.available_loyalty_points,
//                   });
//                 }
//               }

//               var sortedData = JsonData.sort(function (a, b) {
//                 return b.created_at - a.created_at;
//               });

//               res
//                 .status(200)
//                 .json({
//                   message: "ok",
//                   data: sortedData,
//                   count: count,
//                   code: 1,
//                 });
//             });
//         });
//     });
// };

module.exports.usersGetAll = function (req, res) {
  var name = null;
  var email = null;
  var contactNumber = null;
  var customer_id = null;

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
    name = typeof req.body.name == "string" ? req.body.name.trim() : req.body.name;
  }
  if (req.body.customer_id) {
    customer_id = req.body.customer_id;
  }
  if (req.body.email) {
    email = req.body.email;
  }
  if (req.body.contactNumber) {
    contactNumber = req.body.contactNumber;
  }
  if (req.body.user_type) {
    var user_type = req.body.user_type;
  }

  var DataFilter = {};
  if (customer_id != null) {
    DataFilter["_id"] = mongoose.Types.ObjectId(customer_id);
  }

  if (name != null) {
    DataFilter["name"] = { $regex: name, $options: "i" };
  }
  if (email != null) {
    DataFilter["email"] = { $regex: email, $options: "i" };
  }
  if (user_type != null) {
    DataFilter["user_type"] = { $regex: user_type };
  }
  if (req.body.status != null) {
    DataFilter["status"] = req.body.status;
  }
  DataFilter["otp_verified"] = true;

  let stagesIfNumberSearch = [];
  if (contactNumber != null) {
    //DataFilter['contactNumber'] = contactNumber
    stagesIfNumberSearch.push({
      $addFields: {
        contactNumber: { $toString: { $toLong: "$contactNumber" } },
      },
    });
    stagesIfNumberSearch.push({
      $match: { contactNumber: { $regex: contactNumber } },
    });
  }

  // console.log(
  //   "00000000 aggregation applied:::: ",
  //   JSON.stringify([
  //     { $match: DataFilter },
  //     ...stagesIfNumberSearch,
  //     { $sort: { created_at: -1 } },
  //     { $skip: skip },
  //     { $limit: limit },
  //   ])
  // );

  User.find(DataFilter)
    .count()
    .exec(function (err, count) {
      User.aggregate([{ $match: DataFilter }, ...stagesIfNumberSearch, { $sort: { created_at: -1 } }, { $skip: skip }, { $limit: limit }], {
        allowDiskUse: true,
      })
        // .find(DataFilter)
        // .skip(skip)
        // .limit(limit)
        // .sort({ created_at: -1 })
        .exec(async function (err, result) {
          // console.log("errrrrrrrrrrrrrrrrr:::: ", err);
          // console.log("resultresultresultresultresult:::: ", result);
          var JsonData = [];
          for (var i = 0; i < result.length; i++) {
            var UserBookingData = await bookingDataBase.aggregate([
              { $match: { user_id: mongoose.Types.ObjectId(result[i]._id) } },
              {
                $group: {
                  _id: "$user_id",
                  details: { $push: "$$ROOT" },
                  totalOrder: { $sum: 1 },
                  totalAmount: { $sum: "$total_payment" },
                },
              },
            ]);

            // console.log(UserBookingData, 'ttttttttttttttt')
            if (UserBookingData.length > 0) {
              var details = UserBookingData[0].details;
              var totalOrder = UserBookingData[0].totalOrder;
              var totalAmount = UserBookingData[0].totalAmount;
            } else {
              var details = [];
              var totalOrder = 0;
              var totalAmount = 0;
            }
            JsonData.push({
              user: result[i],
              details: details,
              totalOrder: totalOrder,
              totalAmount: totalAmount,
            });
          }

          var sortedData = JsonData.sort(function (a, b) {
            return b.created_at - a.created_at;
          });

          res.status(200).json({
            message: "ok",
            data: sortedData,
            count: count,
            code: 1,
          });
        });
    });
};
// module.exports.AdminUsersGetAll = function (req, res) {
//   var name = null;
//   var email = null;
//   var contactNumber = null;
//   var customer_id = null;

//   var skip = 0;
//   var limit = 5;
//   var maxCount = 50;

//   if (req.body && req.body.skip) {
//     skip = parseInt(req.body.skip);
//   }

//   if (req.body && req.body.limit) {
//     limit = parseInt(req.body.limit, 10);
//   }

//   if (limit > maxCount) {
//     res.status(400).json({
//       message: "Count limit of " + maxCount + " exceeded",
//     });
//     return;
//   }
//   if (req.body.name) {
//     name = typeof req.body.name == "string" ? req.body.name.trim() : req.body.name;
//   }
//   if (req.body.customer_id) {
//     customer_id = req.body.customer_id;
//   }
//   if (req.body.email) {
//     email = req.body.email;
//   }
//   if (req.body.contactNumber) {
//     contactNumber = req.body.contactNumber;
//   }
//   if (req.body.user_type) {
//     var user_type = req.body.user_type;
//   }

//   var DataFilter = {};
//   if (customer_id != null) {
//     DataFilter["_id"] = mongoose.Types.ObjectId(customer_id);
//   }

//   if (name != null) {
//     DataFilter["name"] = { $regex: name, $options: "i" };
//   }
//   if (email != null) {
//     DataFilter["email"] = { $regex: email, $options: "i" };
//   }
//   if (user_type != null) {
//     DataFilter["user_type"] = { $regex: user_type };
//   }
//   if (req.body.status != null) {
//     DataFilter["status"] = req.body.status;
//   }
//   //DataFilter["otp_verified"] = true;

//   let stagesIfNumberSearch = [];
//   if (contactNumber != null) {
//     //DataFilter['contactNumber'] = contactNumber
//     stagesIfNumberSearch.push({
//       $addFields: {
//         contactNumber: { $toString: { $toLong: "$contactNumber" } },
//       },
//     });
//     stagesIfNumberSearch.push({
//       $match: { contactNumber: { $regex: contactNumber } },
//     });
//   }

//   // console.log(
//   //   "00000000 aggregation applied:::: ",
//   //   JSON.stringify([
//   //     { $match: DataFilter },
//   //     ...stagesIfNumberSearch,
//   //     { $sort: { created_at: -1 } },
//   //     { $skip: skip },
//   //     { $limit: limit },
//   //   ])
//   // );

//   User.find(DataFilter)
//     .count()
//     .exec(function (err, count) {
//       User.aggregate([{ $match: DataFilter }, ...stagesIfNumberSearch, { $sort: { created_at: -1 } }, { $skip: skip }, { $limit: limit }], {
//         allowDiskUse: true,
//       })
//         // .find(DataFilter)
//         // .skip(skip)
//         // .limit(limit)
//         // .sort({ created_at: -1 })
//         .exec(async function (err, result) {
//           // console.log("errrrrrrrrrrrrrrrrr:::: ", err);
//           // console.log("resultresultresultresultresult:::: ", result);
//           var JsonData = [];
//           for (var i = 0; i < result.length; i++) {
//             var UserBookingData = await bookingDataBase.aggregate([
//               { $match: { user_id: mongoose.Types.ObjectId(result[i]._id) } },
//               {
//                 $group: {
//                   _id: "$user_id",
//                   details: { $push: "$$ROOT" },
//                   totalOrder: { $sum: 1 },
//                   totalAmount: { $sum: "$total_payment" },
//                 },
//               },
//             ]);

//             // console.log(UserBookingData, 'ttttttttttttttt')
//             if (UserBookingData.length > 0) {
//               var details = UserBookingData[0].details;
//               var totalOrder = UserBookingData[0].totalOrder;
//               var totalAmount = UserBookingData[0].totalAmount;
//             } else {
//               var details = [];
//               var totalOrder = 0;
//               var totalAmount = 0;
//             }
//             JsonData.push({
//               user: result[i],
//               details: details,
//               totalOrder: totalOrder,
//               totalAmount: totalAmount,
//             });
//           }

//           var sortedData = JsonData.sort(function (a, b) {
//             return b.created_at - a.created_at;
//           });

//           res.status(200).json({
//             message: "ok",
//             data: sortedData,
//             count: count,
//             code: 1,
//           });
//         });
//     });
// };

module.exports.AdminUsersGetAll = function (req, res) {
  var name = null;
  var email = null;
  var contactNumber = null;
  var customer_id = null;

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
    name = typeof req.body.name == "string" ? req.body.name.trim() : req.body.name;
  }
  if (req.body.customer_id) {
    customer_id = req.body.customer_id;
  }
  if (req.body.email) {
    email = req.body.email;
  }
  if (req.body.contactNumber) {
    contactNumber = req.body.contactNumber;
  }
  if (req.body.user_type) {
    var user_type = req.body.user_type;
  }

  var DataFilter = {};
  if(req.body?.sales_person){
    DataFilter = {
      ...DataFilter,sales_person:mongoose.Types.ObjectId(req.body?.sales_person)
    }
  }
  if (customer_id != null) {
    DataFilter["_id"] = mongoose.Types.ObjectId(customer_id);
  }

  if (name != null) {
    DataFilter["name"] = { $regex: name, $options: "i" };
  }
  if (email != null) {
    DataFilter["email"] = { $regex: email, $options: "i" };
  }
  if (user_type != null) {
    DataFilter["user_type"] = { $regex: user_type };
  }
  if (req.body.status != null) {
    DataFilter["status"] = req.body.status;
  }
  //DataFilter["otp_verified"] = true;

  let stagesIfNumberSearch = [];
  if (contactNumber != null) {
    //DataFilter['contactNumber'] = contactNumber
    stagesIfNumberSearch.push({
      $addFields: {
        contactNumber: { $toString: { $toLong: "$contactNumber" } },
      },
    });
    stagesIfNumberSearch.push({
      $match: { contactNumber: { $regex: contactNumber } },
    });
  }
console.log(DataFilter)
  // console.log(
  //   "00000000 aggregation applied:::: ",
  //   JSON.stringify([
  //     { $match: DataFilter },
  //     ...stagesIfNumberSearch,
  //     { $sort: { created_at: -1 } },
  //     { $skip: skip },
  //     { $limit: limit },
  //   ])
  // );

  User.find(DataFilter)
    .count()
    .exec(function (err, count) {
      User.aggregate(
        [
          { $match: DataFilter },
          ...stagesIfNumberSearch,
          {
            $lookup: {
              from: "admins",
              localField: "sales_person",
              foreignField: "_id",
              as: "salesPerson",
            },
          },
          { $sort: { created_at: -1 } },
          { $skip: skip },
          { $limit: limit },
        ],
        {
          allowDiskUse: true,
        }
      )
        // .find(DataFilter)
        // .skip(skip)
        // .limit(limit)
        // .sort({ created_at: -1 })
        .exec(async function (err, result) {
          // console.log("errrrrrrrrrrrrrrrrr:::: ", err);
          // console.log("resultresultresultresultresult:::: ", result);
          var JsonData = [];
          for (var i = 0; i < result.length; i++) {
            var UserBookingData = await bookingDataBase.aggregate([
              { $match: { user_id: mongoose.Types.ObjectId(result[i]._id) } },
              {
                $group: {
                  _id: "$user_id",
                  details: { $push: "$$ROOT" },
                  totalOrder: { $sum: 1 },
                  totalAmount: { $sum: "$total_payment" },
                },
              },
            ]);

            // console.log(UserBookingData, 'ttttttttttttttt')
            if (UserBookingData.length > 0) {
              var details = UserBookingData[0].details;
              var totalOrder = UserBookingData[0].totalOrder;
              var totalAmount = UserBookingData[0].totalAmount;
            } else {
              var details = [];
              var totalOrder = 0;
              var totalAmount = 0;
            }
            JsonData.push({
              user: result[i],
              details: details,
              totalOrder: totalOrder,
              totalAmount: totalAmount,
            });
          }

          var sortedData = JsonData.sort(function (a, b) {
            return b.created_at - a.created_at;
          });

          res.status(200).json({
            message: "ok",
            data: sortedData,
            count: count,
            code: 1,
          });
        });
    });
};
module.exports.usersGetAllActive = function (req, res) {
  User.find({ status: true, otp_verified: true })
    .count()
    .exec(function (err, count) {
      User.find({ status: true, otp_verified: true }).exec(function (err, data) {
        if (err) {
          res.status(500).json(err);
        } else {
          res.status(200).json({ message: "ok", data: data, count: count, code: 1 });
        }
      });
    });
};

// for frontend to get only a single user details
module.exports.usersGetOne = function (req, res) {
  var user_id = req.decoded.ID;

  User.find({ _id: user_id }).exec(function (err, doc) {
    if (err) {
      res.status(500).json(err);
    } else if (!doc) {
      res.status(404).json({ message: "error", data: "User ID not found", code: 0 });
    } else {
      res.status(200).json({ message: "ok", data: doc, code: 1 });
    }
  });
};

// for admin to get a single or all user details
module.exports.admin_usersGetOne = function (req, res) {
  var user_id = req.body.user_id;
  var contactNumber = req.body.contactNumber;

  var DataFilter = {};
  if (user_id) {
    DataFilter["_id"] = user_id;
  }
  if (contactNumber) {
    DataFilter["contactNumber"] = contactNumber;
  }

  User.find(DataFilter).exec(function (err, doc) {
    if (err) {
      res.status(500).json(err);
    } else if (!doc) {
      res.status(404).json({ message: "error", data: "User ID not found", code: 0 });
    } else {
      res.status(200).json({ message: "ok", data: doc, code: 1 });
    }
  });
};

module.exports.getAllUsersBrief = (req, res) => {
  User.find({ status: true }, { name: 1, contactNumber: 1 }).exec((err, data) => {
    if (err) {
      return res.status(500).json(err);
    } else {
      res.status(200).json({ message: "ok", data: data, code: 1 });
    }
  });
};

module.exports.usersAddOne = function (req, res) {
  // var emailFilter = { email: new RegExp(req.body.email, "i") };
  // var mobileFilter = { contactNumber: req.body.mobile };
  // var error = {};
  // User.find(emailFilter)
  //   .exec()
  //   .then((getEmail) => {
  //     User.find(mobileFilter)
  //       .exec()
  //       .then((getMobile) => {
  //         if (getEmail.length > 0) {
  //           error["email"] = "email already exist";
  //         }
  //         if (getMobile.length > 0) {
  //           error["mobile"] = "mobile already exist";
  //         }
  //         var errorArray = Object.keys(error).length;
  //         if (errorArray > 0) {
  //           res.status(400).json(error);
  //         } else {
  //           User.create(
  //             {
  //               username: req.body.username,
  //               email: req.body.email,
  //               contactNumber: req.body.mobile,
  //               password: req.body.password,
  //               decode_password: req.body.password,
  //               user_type: req.body.user_type,
  //             },
  //             function (err, user) {
  //               if (err) {
  //                 res.status(400).json(err);
  //               } else {
  //                 res.status(201).json(user);
  //               }
  //             }
  //           );
  //         }
  //       })
  //       .catch(function (err) {
  //         res.status(400).json(err);
  //       });
  //   })
  //   .catch(function (err) {
  //     res.status(400).json(err);
  //   });
};

module.exports.usersDeleteOne = function (req, res) {
  var userId = req.body._id;
  if (userId == "" || !userId || userId == undefined || userId == null) {
    common.formValidate("_id", res);
    return false;
  }
  User.findByIdAndRemove(userId).exec(function (err, location) {
    if (err) {
      res.status(404).json(err);
    } else {
      res.status(200).json({ message: "deleted succesfully" });
      return;
    }
  });
};

module.exports.subscribeToggleStatus = async function (req, res) {
  var userId = req.body._id;
  var subscribeToggle = req.body.subscribeToggle;
  if (userId == "" || !userId || userId == undefined || userId == null) {
    common.formValidate("_id", res);
    return false;
  }
  if (subscribeToggle === undefined || subscribeToggle === null) {
    common.formValidate("subscribeToggle", res);
    return false;
  }
  User.updateMany({ _id: userId }, { $set: { subscribeToggle: subscribeToggle } }).exec(function (err, data) {
    if (err) {
      res.status(404).json({ message: "error", data: err });
    } else {
      res.status(200).json({ message: "ok", data: "updated succesfully" });
      return;
    }
  });
};

module.exports.subscribeToggleStatusGet = async function (req, res) {
  var userId = req.body._id;
  if (userId == "" || !userId || userId == undefined || userId == null) {
    common.formValidate("_id", res);
    return false;
  }
  User.findOne({ _id: userId }, { subscribeToggle: 1 }).exec(function (err, data) {
    if (err) {
      res.status(404).json({ message: "error", data: err });
    } else {
      res.status(200).json({ message: "ok", data: data });
      return;
    }
  });
};
