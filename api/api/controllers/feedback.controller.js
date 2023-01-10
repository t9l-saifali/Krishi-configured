var mongoose = require("mongoose");
var table = mongoose.model("feedback");
var Admin = mongoose.model("admin");
var Roles = mongoose.model("role");
var multer = require("multer");
const common = require("../../common");
const OnOffDataBase = mongoose.model("email_sms_on_off");

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

module.exports.AddOne = (req, res) => {
  upload(req, res, async (err) => {
    try {
      let notifs = await OnOffDataBase.findOne({}).lean();
      let feedback_notifs = notifs.feedback;
      // console.log("feedback::::::::::", notifs, feedback_notifs);

      var attachment = "";
      if (req.files) {
        for (var j = 0; j < req.files.length; j++) {
          if (req.files[j].fieldname === "attachment") {
            attachment = req.files[j].filename;
          }
        }
      }

      var booking_id = req.body.booking_id;
      if (booking_id != "null" && booking_id && booking_id.length > 0) {
        var bookingId = req.body.booking_id;
      } else {
        var bookingId = null;
      }

      table.create(
        {
          name: req.body.name,
          email: req.body.email,
          mobile: req.body.mobile,
          city: req.body.city,
          feedback: req.body.feedback,
          booking_id: bookingId,
          attachment: attachment,
        },
        async function (err, data) {
          if (err) {
            res.status(400).json(err);
          } else { 
            if (+feedback_notifs.user_email) {
              var keys = {
                userName : common.toTitleCase(req.body.name),                
                userMobile : req.body.mobile,
                feedback : common.toTitleCase(req.body.feedback),
                userCity : common.toTitleCase(req.body.city),
                bookingId: bookingId,
                attachment:attachment,
                type:'user',
                template_name : 'feedback mail to user',
                userEmail : req.body.email,
              }
              common.dynamicEmail(keys);
            }
            if (+feedback_notifs.admin_email) {
              let users = await Admin.find(
                { user_role: { $in: feedback_notifs.admin_roles } },
                { username: 1, email: 1 }
              ).lean();

              users.forEach((user) => {
                var keys = {
                  userName : common.toTitleCase(req.body.name),                
                  userMobile : req.body.mobile,
                  feedback : common.toTitleCase(req.body.feedback),
                  userCity : common.toTitleCase(req.body.city),
                  bookingId: bookingId,
                  attachment:attachment,
                  type:'admin',
                  template_name : 'feedback mail to admin',
                  userEmail : req.body.email,
                  adminEmail: user.email,
                  adminName:user.username,                    
                }
                common.dynamicEmail(keys);
              });
            }

            return res.status(200).json({
              message: "ok",
              data: "query submitted successfully",
              code: 1,
            });
          }
        }
      );
    } catch (err) {
      console.log("errrrrrr", err);
    }
  });
};

module.exports.GetAll = function (req, res) {
  console.log('123')
  var skip = 0;
  var limit = 0;
  var maxCount = 50;
  var name = null;
  var email = null;
  var mobile = null;
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
  if (req.body.email) {
    var email = req.body.email;
  }
  if (req.body.mobile) {
    var mobile = req.body.mobile;
  }
  if (req.body.city) {
    var city = req.body.city;
  }
  if (req.body.status) {
    var status = req.body.status;
  }

  var DataFilter = {};
  if (name != null) {
    DataFilter["name"] = { $regex: name, $options: "i" };
  }
  if (email != null) {
    DataFilter["email"] = { $regex: email, $options: "i" };
  }
  if (mobile != null) {
    //DataFilter['mobile'] = mobile
    DataFilter["$where"] = `/^${mobile}.*/.test(this.mobile)`;
  }
  if (city != null) {
    DataFilter["city"] = { $regex: city, $options: "i" };
  }
  if (status != null) {
    DataFilter["status"] = status;
  }

  table
    .find(DataFilter)
    .count()
    .exec(function (err, count) {
      table
        .find(DataFilter)
        // .populate("booking_id")
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

module.exports.Update = function (req, res) {
  upload(req, res, function (err) {
    var Id = req.body._id;
    var attachment = "";
    if (req.files) {
      for (var j = 0; j < req.files.length; j++) {
        if (req.files[j].fieldname === "attachment") {
          attachment = req.files[j].filename;
        }
      }
    }
    table.findById(Id).exec(function (err, data) {
      if (err) {
        res.status(404).json({ message: "err", data: err, code: 0 });
        return;
      } else if (!data) {
        res.status(404).json({ message: "id not found in the database", data: "", code: 0 });
        return;
      }

      if (attachment) {
        attachment = attachment;
      } else {
        attachment = data.attachment;
      }

      var booking_id = req.body.booking_id;
      if (booking_id != "null" && booking_id && booking_id.length > 0) {
        var bookingId = req.body.booking_id;
      } else {
        var bookingId = null;
      }

      var updateData = {
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile,
        city: req.body.city,
        feedback: req.body.feedback,
        booking_id: bookingId,
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
  });
};

module.exports.DeleteOne = function (req, res) {
  var Id = req.body._id;

  table.findByIdAndRemove(Id).exec(function (err, data) {
    if (err) {
      res.status(404).json({ message: "", data: err, code: 0 });
    } else {
      res.status(200).json({ message: "ok", data: "", code: 1 });
      return;
    }
  });
};
