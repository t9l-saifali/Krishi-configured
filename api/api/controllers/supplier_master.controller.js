var mongoose = require("mongoose");
var table = mongoose.model("supplier_masters");
var multer = require("multer");
var common = require("../../common");

///var moment                = require('moment-timezone');

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
    var name = req.body.name;
    var email = req.body.email;
    var phone = req.body.phone;

    if (name == "" || !name || name == undefined || name == null) {
      common.formValidate("name", res);
      return false;
    }
    if (email == "" || !email || email == undefined || email == null) {
      common.formValidate("email", res);
      return false;
    }
    if (phone == "" || !phone || phone == undefined || phone == null) {
      common.formValidate("phone", res);
      return false;
    }

    var emailFilter = { email: req.body.email };
    var phoneFilter = { phone: req.body.phone };
    var error = {};
    table
      .find(emailFilter)
      .exec()
      .then((GetEmailFilter) => {
        table
          .find(phoneFilter)
          .exec()
          .then((GetPhoneFilter) => {
            if (GetEmailFilter.length > 0) {
              error["email"] = "email already exist";
            }
            if (GetPhoneFilter.length > 0) {
              error["phone"] = "phone already exist";
            }
            var errorArray = Object.keys(error).length;
            if (errorArray > 0) {
              return res.status(400).json({
                message: "error",
                data: [error],
                code: 0,
              });
            } else {
              table.create(
                {
                  name: req.body.name,
                  company_name: req.body.company_name,
                  email: req.body.email,
                  phone: req.body.phone,
                  gst_no: req.body.gst_no,
                  paymentTerm: req.body.paymentTerm,
                  returnPolicy: req.body.returnPolicy,
                  address: req.body.address,
                  attachment: (req.files.filter((i) => i.fieldname === "attachment").map((i) => i.filename))[0],
                  status: req.body.status,
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
            }
          });
      })
      .catch(function (err) {
        res.status(400).json(err);
      });
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
    limit = parseInt(req.body.limit);
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
  if (req.body.company_name) {
    var company_name = req.body.company_name;
  }
  if (req.body.email) {
    var email = req.body.email;
  }

  if (req.body.phone) {
    var phone = req.body.phone;
  }
  if (req.body.status) {
    var status = req.body.status;
  }

  var DataFilter = {};
  if (name != null) {
    DataFilter["name"] = { $regex: name, $options: "i" };
  }
  if (company_name != null) {
    DataFilter["company_name"] = { $regex: company_name, $options: "i" };
  }
  if (email != null) {
    DataFilter["email"] = { $regex: email, $options: "i" };
  }
  if (phone != null) {
    DataFilter["$where"] = `/^${phone}.*/.test(this.phone)`;
  }
  if (req.body.status != null) {
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
        .sort({ created_at: -1 })
        .exec(function (err, data) {
          if (err) {
            res.status(500).json(err);
          } else {
            res.status(200).json({
              message: "ok",
              data: data,
              count: count,
              code: 1,
            });
          }
        });
    });
};

module.exports.GetAllActive = function (req, res) {
  table
    .find({ status: true })
    .select("company_name")
    .sort({ created_at: "desc" })
    // .skip(offset)
    // .limit(count)
    .exec(function (err, data) {
      if (err) {
        res.status(500).json(err);
      } else {
        res.status(200).json({ message: "ok", data: data, code: 1 });
      }
    });
};

module.exports.GetOne = function (req, res) {
  var id = req.params.Id;
  table.findById(id).exec(function (err, data) {
    var response = {
      status: 200,
      message: { message: "ok", data: data, code: 1 },
    };
    if (err) {
      response.status = 500;
      response.message = {
        message: "ID not found " + id,
        data: "",
        code: 0,
      };
    } else if (!data) {
      response.status = 404;
      response.message = {
        message: "ID not found " + id,
        data: "",
        code: 0,
      };
    }
    res.status(response.status).json(response.message);
  });
};

module.exports.GetInvoiceDueDate = function (req, res) {
  var id = req.body._id;
  var bill_date = req.body.bill_date;
  table.findById(id).exec(function (err, data) {
    if (data == "") {
      res.status(400).json({
        message: "error",
        data: "id not found",
        code: 0,
      });
    }
    var payTearm = data.paymentTerm;
    var date = new Date();
    console.log("payTearmpayTearm", payTearm);
    if (payTearm == 0) {
      var d = new Date(bill_date);
      var n = d.getDay();
      var invoiceDate = date;
    } else if (payTearm == 15) {
      var d = new Date(bill_date);
      var n = d.getDate();
      var invoiceDate = "";
      console.log("date", n);
      if (n <= 15) {
        // var invoiceDate = new Date(
        //     date.getFullYear(),
        //     date.getMonth(),
        //     1
        // );
        var invoiceDate = new Date(date.getFullYear(), date.getMonth(), 1);
        invoiceDate.setDate(invoiceDate.getDate() + 14);
        //var invoiceDate = invoiceDate.toUTCString();
        console.log("n<15", invoiceDate);
      } else {
        var invoiceDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        invoiceDate.setDate(invoiceDate.getDate());
        console.log("nelse15", invoiceDate);
        //var invoiceDate = invoiceDate.toUTCString();
      }
    } else if (payTearm == 30) {
      var invoiceDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      invoiceDate.setDate(invoiceDate.getDate());
      console.log("invoiceDate", invoiceDate);
      //var invoiceDate = invoiceDate.toUTCString();
    }
    res.status(200).json({ message: "ok", payTearm: payTearm, data: invoiceDate, code: 1 });
  });
};

module.exports.Update = function (req, res) {
  upload(req, res, function (err) {
    var Id = req.body.id;
    var name = req.body.name;
    var email = req.body.email;
    var phone = req.body.phone;

    if (Id == "" || !Id || Id == undefined || Id == null) {
      common.formValidate("id", res);
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
    if (phone == "" || !phone || phone == undefined || phone == null) {
      common.formValidate("phone", res);
      return false;
    }

    var attachment = "";
    for (var j = 0; j < req.files.length; j++) {
      if (req.files[j].fieldname === "attachment") {
        attachment = req.files[j].filename;
      }
    }

    var emailFilter = { email: req.body.email };
    var phoneFilter = { phone: req.body.phone };
    var error = {};
    table
      .find(emailFilter)
      .exec()
      .then((GetEmailFilter) => {
        table
          .find(phoneFilter)
          .exec()
          .then((GetPhoneFilter) => {
            if (GetEmailFilter.length > 0) {
              if (GetEmailFilter[0]._id != Id) {
                error["email"] = "email alreday exist";
              }
            }
            if (GetPhoneFilter.length > 0) {
              if (GetPhoneFilter[0]._id != Id) {
                error["phone"] = "phone alreday exist";
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
              table
                .findById(Id)
                // .findOne({"email":emailId,"password":password})
                // .select('username email')
                .exec(function (err, data) {
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

                  if (attachment) {
                    attachment = attachment;
                  } else {
                    attachment = data.attachment;
                  }

                  var updateData = {
                    name: req.body.name,
                    company_name: req.body.company_name,
                    email: req.body.email,
                    phone: req.body.phone,
                    gst_no: req.body.gst_no,
                    paymentTerm: req.body.paymentTerm,
                    returnPolicy: req.body.returnPolicy,
                    address: req.body.address,
                    attachment: attachment,
                    status: req.body.status,
                  };
                  table.update({ _id: Id }, { $set: updateData }, function (err, data) {
                    if (err) {
                      res.status(400).json({
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
            }
          });
      })
      .catch(function (err) {
        res.status(400).json(err);
      });
  });
};

module.exports.DeleteOne = function (req, res) {
  var Id = req.body._id;
  table.findByIdAndRemove(Id).exec(function (err, data) {
    if (err) {
      res.status(400).json({ message: "", data: err, code: 0 });
    } else {
      res.status(200).json({ message: "ok", data: "", code: 1 });
      return;
    }
  });
};
