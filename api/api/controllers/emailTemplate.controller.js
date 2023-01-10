var mongoose = require("mongoose");
var table = mongoose.model("email_templates");
var Settings = mongoose.model("settings");
var common = require("../../common");

module.exports.AddOne = function (req, res) {
  var {template_name, email_subject, email_text} = req.body

  if (template_name == "" || !template_name || template_name == undefined || template_name == null) {
    common.formValidate("template_name", res);
    return false;
  }
  if (email_subject == "" || !email_subject || email_subject == undefined || email_subject == null) {
    common.formValidate("email_subject", res);
    return false;
  }
  if (email_text == "" || !email_text || email_text == undefined || email_text == null) {
    common.formValidate("email_text", res);
    return false;
  }
  var Filter = { name: req.body.template_name };
  var error = {};
  table
    .find(Filter)
    .exec()
    .then((GetFilter) => {
      if (GetFilter.length > 0) {
        error["template_name"] = "template_name already exist";
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
            template_name: req.body.template_name,
            email_subject: req.body.email_subject,
            email_text: req.body.email_text,
            status: req.body.status,
          },
          function (err, data) {
            if (err) {
              //console.log("Error creating");
              res.status(400).json(err);
            } else {
              console.log("created!", data);
              res.status(200).json({ message: "ok", data: data, code: 1 });
            }
          }
        );
      }
    })
    .catch(function (err) {
      res.status(400).json(err);
    });
};

module.exports.GetAll = function (req, res) {
  // console.log('GET the users');
  //console.log(req.body);

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
  table.count().exec(function (err, count) {
    table
      .find()
      .skip(skip)
      .limit(limit)
      .sort({ template_name: 1 })
      .exec(function (err, data) {
        if (err) {
          res.status(500).json(err);
        } else {
          //console.log("Found data", data.length);
          res
            .status(200)
            .json({ message: "ok", data: data, count: count, code: 1 });
        }
      });
  });
};
module.exports.GetOne = function (req, res) {
  table
    .findOne({ template_name: req.body.template_name })
    .exec(function (err, data) {
      if (err) {
        res.status(500).json(err);
      } else {
        res
          .status(200)
          .json({ message: "ok", data: data, code: 1 });
      }
    });
};
module.exports.GetActiveOne = function (req, res) {
  table
    .findOne({ template_name: req.body.template_name, status: true })
    .lean()
    .exec(function (err, data) {
      if (data) {
        //get static email message body
        var message = data.email_text;
        //make static to dynamic email message body
        message = message.replace(/##user_name##/g, "chitra singh");
        var params = {
          to: "chitra@mailinator.com",
          subject: data.email_subject,
          message: message,
        };
        common.sendDynamicEmail(params, function (error, emailStatus) {
          if (error) {
            res.json({
              status: 0,
              code: 200,
              type: "other",
              message: "Mail sending fail.",
            });
          } else {
            res.json({
              status: 1,
              code: 200,
              type: "success",
              message: "Mail send successfull.",
            });
          }
        });
      } else {
        console.log(err);
        res.status(200).json({
          message: "error",
          data: "Oops! something went wrong.",
          code: 0,
        });
      }
    });
};

module.exports.Update = function (req, res) {
  var _id = req.body._id;
  var {_id, template_name, email_subject, email_text, status} = req.body

  if (_id == "" || !_id || _id == undefined || _id == null) {
    common.formValidate("_id", res);
    return false;
  }
  if (template_name == "" || !template_name || template_name == undefined || template_name == null) {
    common.formValidate("template_name", res);
    return false;
  }
  if (email_subject == "" || !email_subject || email_subject == undefined || email_subject == null) {
    common.formValidate("email_subject", res);
    return false;
  }
  if (email_text == "" || !email_text || email_text == undefined || email_text == null) {
    common.formValidate("email_text", res);
    return false;
  }
  var Filter = { template_name: req.body.template_name };
  var error = {};
  table
    .find(Filter)
    .exec()
    .then((GetFilter) => {
      if (GetFilter.length > 0) {
        if (GetFilter[0]._id != _id) {
          error["template_name"] = "template_name alreday exist";
        }
      }
      var errorArray = Object.keys(error).length;
      console.log(errorArray)
      if (errorArray > 0) {
        return res.status(400).json({
          message: "error",
          data: [error],
          code: 0,
        });
      } else {
        table.findById(_id).exec(function (err, data) {
          if (err) {
            res.status(404).json({ message: "err", data: err, code: 0 });
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
            template_name: req.body.template_name,
            email_subject: req.body.email_subject,
            email_text: req.body.email_text,
            status: req.body.status,
          };
          table.update({ _id: _id }, { $set: updateData }, function (err, data) {
            if (err) {
              res.status(500).json({ message: "error", data: err, code: 0 });
            } else {
              res.status(200).json({ message: "ok", data: "", code: 1 });
              return;
            }
          });
        });
      }
    })
    .catch(function (err) {
      console.log(err)
      res.status(400).json(err);
    });
};

module.exports.DeleteOne = function (req, res) {
  var Id = req.body._id;
  //console.log("delete -==>>", Id);
  table.findByIdAndRemove(Id).exec(function (err, data) {
    if (err) {
      res.status(404).json({ message: "error", data: err, code: 0 });
    } else {
      res.status(200).json({ message: "ok", data: "", code: 1 });
      return;
    }
  });
};
