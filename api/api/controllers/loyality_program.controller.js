var mongoose = require("mongoose");
var User = mongoose.model("Users");
var Admin = mongoose.model("admin");
var common = require("../../common");
const cron = require("node-cron");
var moment = require("moment-timezone");
var LoyalityProgramHistory = mongoose.model("loyality_program_histories");
var LoyalityPrograms = mongoose.model("loyality_programs");
var OnOffDataBase = mongoose.model("email_sms_on_off");

module.exports.addProgram = (req, res) => {
  let {
    adminID,
    level,
    name,
    startOrderNo,
    endOrderNo,
    accumulation,
    redeem,
    status,
  } = req.body;

  //name = name.toLowerCase();

  if (!adminID) {
    common.formValidate("adminID", res);
    return false;
  }
  if (!level) {
    common.formValidate("level", res);
    return false;
  }
  if (!name) {
    common.formValidate("name", res);
    return false;
  }
  if (startOrderNo == null) {
    common.formValidate("startOrderNo", res);
    return false;
  }
  if (endOrderNo == null) {
    common.formValidate("endOrderNo", res);
    return false;
  }
  if (accumulation == null) {
    common.formValidate("accumulation", res);
    return false;
  }
  if (redeem == null) {
    common.formValidate("redeem", res);
    return false;
  }

  LoyalityPrograms.find({ $or: [{ name }, { level }] }, (err, programs) => {
    if (err) {
      res.status(500).json(err);
    } else if (programs.length > 0) {
      res.status(500).json({
        msg: "A program with given name or level already exists",
      });
    } else {
      LoyalityPrograms.create(
        {
          adminID,
          level,
          name,
          startOrderNo,
          endOrderNo,
          accumulation,
          redeem,
          status,
        },
        (err, doc) => {
          if (err) {
            res.status(500).json(err);
          } else {
            res.status(200).json({
              message: "ok",
              data: doc,
              code: 1,
            });
          }
        }
      );
    }
  });
};

module.exports.updateProgram = (req, res) => {
  let {
    program_id,
    adminID,
    level,
    name,
    startOrderNo,
    endOrderNo,
    accumulation,
    redeem,
    status,
  } = req.body;

  if (program_id == null) {
    common.formValidate("program_id", res);
    return false;
  }
  if (!adminID) {
    common.formValidate("adminID", res);
    return false;
  }
  if (!level) {
    common.formValidate("level", res);
    return false;
  }
  if (!name) {
    common.formValidate("name", res);
    return false;
  }
  if (startOrderNo == null) {
    common.formValidate("startOrderNo", res);
    return false;
  }
  if (endOrderNo == null) {
    common.formValidate("endOrderNo", res);
    return false;
  }
  if (accumulation == null) {
    common.formValidate("accumulation", res);
    return false;
  }
  if (redeem == null) {
    common.formValidate("redeem", res);
    return false;
  }

  if (name) {
    name = name.toLowerCase();
  }

  let jsonData = {
    adminID,
    level,
    name,
    startOrderNo,
    endOrderNo,
    accumulation,
    redeem,
    status,
  };

  LoyalityPrograms.findOneAndUpdate(
    { _id: program_id },
    { $set: jsonData },
    { new: true },
    (err, updatedDoc) => {
      if (err) {
        res.status(500).json(err);
      } else {
        res.status(200).json({
          message: "ok",
          data: updatedDoc,
          code: 1,
        });
      }
    }
  );
};

module.exports.getAllPrograms = (req, res) => {
  let { name, level, accumulation } = req.body;

  let dataFilter = {};
  if (name) {
    name = name.toLowerCase();
    dataFilter.name = name;
  }
  if (level) {
    dataFilter.level = level;
  }
  if (accumulation) {
    dataFilter.accumulation = accumulation;
  }
  LoyalityPrograms.find(dataFilter, (err, data) => {
    if (err) {
      res.status(500).json(err);
    } else {
      res.status(200).json({
        message: "ok",
        data: data,
        code: 1,
      });
    }
  }).lean();
};

module.exports.deleteProgram = (req, res) => {
  const { program_id } = req.body;
  LoyalityPrograms.deleteOne({ _id: program_id }, (err, data) => {
    if (err) {
      res.status(500).json(err);
    } else {
      res.status(200).json({
        message: "ok",
        data: data,
        code: 1,
      });
    }
  });
};

// ###################################################################################################

module.exports.AddPointsToUser = async function (req, res) {
  var adminID = req.body.adminID;
  var user_id = req.body.user_id;
  var reason = req.body.reason;
  var point = req.body.point;
  var pointStatus = req.body.pointStatus;
  var error = {};

  if (adminID == "" || !adminID || adminID == undefined || adminID == null) {
    common.formValidate("adminID", res);
    return false;
  }
  if (user_id == "" || !user_id || user_id == undefined || user_id == null) {
    common.formValidate("user_id", res);
    return false;
  }
  if (reason == "" || !reason || reason == undefined || reason == null) {
    common.formValidate("reason", res);
    return false;
  }
  if (point == "" || !point || point == undefined || point == null) {
    common.formValidate("point", res);
    return false;
  }
  if (
    pointStatus == "" ||
    !pointStatus ||
    pointStatus == undefined ||
    pointStatus == null
  ) {
    common.formValidate("pointStatus", res);
    return false;
  }

  let notifs = await OnOffDataBase.findOne({}).lean();
  let loyalty_notifs = notifs.loyalty_added;

  var newvalues = {
    adminID: adminID,
    user_id: user_id,
    reason: reason,
    point: Math.round(point),
    pointStatus: pointStatus,
  };
  var getAdmin = await Admin.findOne({ _id: adminID }).lean();
  var getUser = await User.findOne({ _id: user_id }).lean();
  if (getAdmin == null) {
    error["adminID"] = "admin not found in database";
  }
  if (getUser == null) {
    error["user_id"] = "user not found in database";
  }
  var errorArray = Object.keys(error).length;
  if (errorArray > 0) {
    return res.status(400).json({
      status: "error",
      result: [error],
    });
  } else {
    var data = await LoyalityProgramHistory.create(newvalues);
    var getData = await User.updateMany(
      { _id: user_id },
      {
        $inc: {
          TotalPoint:
            pointStatus == "Added" ? Math.round(point) : -Math.round(point),
        },
      }
    );

    if (loyalty_notifs.user_email) {
      var keys = {
        userName: common.toTitleCase(getUser.name),
        point: Math.round(point),
        reason: reason,
        type: "user",
        template_name: "loyality point mail to user",
        userEmail: getUser.email,
      };
      await common.dynamicEmail(keys);
    }

    return res.status(200).json({
      message: "ok",
      data: data,
      code: 1,
    });
  }
};

module.exports.LoyalityHistoryOfAllUser = function (req, res) {
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

  if (req.decoded.ID) {
    var user_id = req.decoded.ID;
  }

  LoyalityProgramHistory.find({ user_id })
    .count()
    .exec(function (err, count) {
      LoyalityProgramHistory.find({ user_id })
        .populate("adminID")
        .populate("user_id")
        .populate("orderID")
        .skip(skip)
        .limit(limit)
        .sort({ created_at: "desc" })
        .exec(function (err, data) {
          //console.log(data)
          if (err) {
            res.status(500).json(err);
          } else if (data.length > 0) {
            console.log("else id");
            if (req.body.user_id != null) {
              //console.log(data)
              if (data[0].user_id) {
                var totalPoint = data[0].user_id.TotalPoint;
              } else {
                var totalPoint = null;
              }
            } else {
              var totalPoint = null;
            }
            res.status(200).json({
              message: "ok",
              data: data,
              totalPoint: totalPoint,
              count: count,
              code: 1,
            });
          } else {
            res.status(400).json({
              message: "Data not fond",
              data: 0,
              count: count,
              code: 0,
            });
          }
        });
    });
};

module.exports.admin_LoyalityHistoryOfAllUser = function (req, res) {
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

  if (req.body.booking_code) {
    var booking_code = req.body.booking_code;
  }
  if (req.body.user_id) {
    var user_id = req.body.user_id;
  }
  if (req.body.loyalityName) {
    var loyalityName = req.body.loyalityName;
  }
  if (req.body.pointStatus) {
    var pointStatus = req.body.pointStatus;
  }
  if (req.body.date) {
    var date = req.body.date;
    var to_date1 = new Date(date);
    to_date1.setDate(to_date1.getDate() + 1);
  }

  var DataFilter = {};
  if (booking_code != null) {
    DataFilter["booking_code"] = { $regex: booking_code };
  }
  if (user_id != null) {
    DataFilter["user_id"] = user_id;
  }
  if (loyalityName != null) {
    DataFilter["loyalityName"] = loyalityName;
  }
  if (pointStatus != null) {
    DataFilter["pointStatus"] = pointStatus;
  }
  if (
    req.body.status != null ||
    req.body.status === false ||
    req.body.status === true
  ) {
    DataFilter["status"] = req.body.status;
  }
  if (date != null) {
    DataFilter["created_at"] = {
      $gte: new Date(date),
      $lt: new Date(to_date1),
    };
  }
  console.log(DataFilter);
  LoyalityProgramHistory.find(DataFilter)
    .count()
    .exec(function (err, count) {
      LoyalityProgramHistory.find(DataFilter)
        .populate("adminID")
        .populate("user_id")
        .populate("orderID")
        .skip(skip)
        .limit(limit)
        .sort({ created_at: "desc" })
        .exec(function (err, data) {
          //console.log(data)
          if (err) {
            res.status(500).json(err);
          } else if (data.length > 0) {
            console.log("else id");
            if (req.body.user_id != null) {
              //console.log(data)
              if (data[0].user_id) {
                var totalPoint = data[0].user_id.TotalPoint;
              } else {
                var totalPoint = null;
              }
            } else {
              var totalPoint = null;
            }
            res.status(200).json({
              message: "ok",
              data: data,
              totalPoint: totalPoint,
              count: count,
              code: 1,
            });
          } else {
            res.status(400).json({
              message: "Data not fond",
              data: 0,
              count: count,
              code: 0,
            });
          }
        });
    });
};

//2 reminder emails will Go To User before 15 days and before 7 days.
//at every 6 hour 0 */6 * * *
//at every second   * * * * *
var ExpirePointReminderMail = cron.schedule(
  "* * * * *",
  async () => {
    try {
      // code here
      const filter = { expiryDate: { $lte: new Date() } };
      const update = { TotalPoint: 0, oneweek: false, twentyfourhour: false };

      let data = await User.update(filter, update);
      let docs = await User.find({
        $or: [{ oneweek: false }, { twentyfourhour: false }],
        status: true,
        LastOrderDate: { $nin: [null, ""] },
        TotalPoint: { $ne: 0 },
      }).lean();

      if (docs.length > 0) {
        for (var i = 0; i < docs.length; i++) {
          var expiryDate = docs[i].expiryDate;
          var todayDate = new Date();
          var todayDate = moment.utc(todayDate).tz("Asia/Kolkata");
          var todayDate1 = todayDate.format("DD-MM-YYYY");
          var fifteenDay = new Date(expiryDate);
          fifteenDay.setDate(fifteenDay.getDate() - 7);
          var fifteenDay = moment.utc(fifteenDay).tz("Asia/Kolkata");
          var fifteenDayDate = fifteenDay.format("DD-MM-YYYY");

          var oneDay = new Date(expiryDate);
          oneDay.setDate(oneDay.getDate() - 1);
          var oneDay = moment.utc(oneDay).tz("Asia/Kolkata");
          var oneDayDate = oneDay.format("DD-MM-YYYY");
          if (fifteenDayDate == todayDate1 || oneDayDate == todayDate1) {
            let notifs = await OnOffDataBase.findOne({}).lean();
            let loyalty_notifs = notifs.loyalty_expiration;

            if (loyalty_notifs.user_email) {
              var name = docs[i].name;
              var email = docs[i].email;
              var expiryDate1 = moment
                .utc(docs[i].expiryDate)
                .tz("Asia/Kolkata");
              var PointExpiryDate = expiryDate1.format("DD-MMM-YYYY, hh:mm A");
              var point = Math.round(docs[i].TotalPoint);
              var keys = {
                userName: common.toTitleCase(name),
                point: point,
                PointExpiryDate: PointExpiryDate,
                type: "user",
                template_name: "point expiry mail to user",
                userEmail: email,
              };
              if (docs[i].oneweek === false && fifteenDayDate == todayDate1) {
                await User.update(
                  { _id: docs[i]._id },
                  { $set: { oneweek: true } }
                );
                await common.dynamicEmail(keys);
              } else if (
                docs[i].twentyfourhour === false &&
                oneDayDate == todayDate1
              ) {
                await User.update(
                  { _id: docs[i]._id },
                  { $set: { twentyfourhour: true } }
                );
                await common.dynamicEmail(keys);
              }
            }
          } else {
          }
        }
      }
    } catch (err) {
      console.log("catch error ::::: ", err);
    }
  },
  {
    scheduled: false,
    timezone: "Asia/Kolkata",
  }
);
ExpirePointReminderMail.start();
