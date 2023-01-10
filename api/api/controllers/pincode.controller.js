var mongoose = require("mongoose");
var table = mongoose.model("pincodes");
var pincodeSetting = mongoose.model("pincodesettings");
var multer = require("multer");
var common = require("../../common.js");
var createCsvWriter = require("csv-writer").createObjectCsvWriter;
var Settings = mongoose.model("settings");
const readFile = require("fs").readFile;
//const xlsxFile = require('read-excel-file/node');
var parser = require("simple-excel-to-json");

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

function validate(req, res, next) {
  if (!req.file) {
    return res.send({
      errors: {
        message: "file cant be empty",
      },
    });
  }
  next();
}
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
    var JsonFile = req.files.filter((i) => i.fieldname === "sheet").map((i) => i.filename);
    //xlsxFile('./public/upload/'+JsonFile).then((rows) => {
    // rows.forEach((obj) => {
    // 	//console.log(obj)
    // })

    var doc = parser.parseXls2Json("./public/upload/" + JsonFile);
    var JsonData = doc[0];
    var InsertData = [];
    var ab = parseInt(JsonData.length);
    for (var i = 0; i < ab; i++) {
      var IData = JsonData[i];

      if (IData.Pincode) {
        InsertData.push({
          Pincode: IData.Pincode,
          Region_ID: IData.Region_ID,
          Free_Shipping: IData.Free_Shipping,
          Free_Shipping_amount: IData.Free_Shipping_amount,
          status: IData.Status,
          Message: IData.Message,
          MOQ: IData.MOQ,
          MOQ_Charges: IData.MOQ_Charges,
          COD: IData.COD,
          COD_Charges: IData.COD_Charges,
          Farm_pick_up: IData.Farm_pick_up,
          Farm_pick_up_delivery_charges: IData.Farm_pick_up_delivery_charges,
          Same_day_delivery_till_2pm: IData.Same_day_delivery_till_2pm,
          Same_day_delivery_till_2pm_charges: IData.Same_day_delivery_till_2pm_charges,
          Next_day_delivery_Standard_9am_9pm: IData.Next_day_delivery_Standard_9am_9pm,
          Next_day_delivery_Standard_9am_9pm_charges:
            IData.Next_day_delivery_Standard_9am_9pm_charges,
          Next_day_delivery_8am_2pm: IData.Next_day_delivery_8am_2pm,
          Next_day_delivery_8am_2pm_charges: IData.Next_day_delivery_8am_2pm_charges,
          Next_day_delivery_2pm_8pm: IData.Next_day_delivery_2pm_8pm,
          Next_day_delivery_2pm_8pm_charges: IData.Next_day_delivery_2pm_8pm_charges,
          Standard_delivery: IData.Standard_delivery,
          Standard_delivery_charges: IData.Standard_delivery_charges,
        });
      }
    }

    table.remove({}, function (err, RemovedData) {
      table.create(InsertData, function (err, insertedData) {
        if (err) {
          res.status(500).json({ message: "error", data: err, code: 0 });
        } else {
          console.log(insertedData, "Standard_delivery_charges Standard_delivery_charges");
          res.status(200).json({ message: "ok", data: "Data created", code: 1 });
        }
      });
    });
    //});
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
  table.count().exec(function (err, count) {
    table
      .find()
      .populate("Region_ID")
      .skip(skip)
      .limit(limit)
      .sort({ created_at: "desc" })
      .exec(function (err, data) {
        if (err) {
          res.status(500).json({ message: "error", data: null, code: 0 });
        } else {
          //console.log("Found data", data.length);
          res.status(200).json({ message: "ok", data: data, count: count, code: 1 });
        }
      });
  });
};

module.exports.GetOne = async (req, res) => {
  var pincode = req.body.pincode;
  if (pincode == "" || !pincode || pincode == undefined || pincode == null) {
    common.formValidate("pincode", res);
    return false;
  }

  let Settings = await pincodeSetting.findOne({}).lean();
  table
    .findOne({ Pincode: pincode, status: "active" })
    .populate("Region_ID")
    .lean()
    .exec(function (err, data) {
      if (err) {
        res.status(500).json({ message: "error", data: err, code: 0 });
      } else if (!data) {
        res.status(404).json({
          message: "error",
          data: "We are currently not delivering in your area.",
          code: 0,
        });
      } else {
        var IData = data;
        let underAllowedTime = (allowedTime) => {
          if (!allowedTime) {
            return true;
          }
          let today = new Date();
          let minutesUpTillNow = today.getHours() * 60 + +today.getMinutes();
          let minutesInAllowedTime = allowedTime.split(":")[0] * 60 + +allowedTime.split(":")[1];
          console.log("minutesUpTillNow = ", minutesUpTillNow);
          console.log("minutesInAllowedTime = ", minutesInAllowedTime);
          return minutesUpTillNow <= minutesInAllowedTime;
        };
        console.log("got here jjjj", Settings?.same_day_delivery_time, Settings?.farm_pick_up_time);
        var sameDayDlvry = underAllowedTime(Settings?.same_day_delivery_time)
          ? IData.Same_day_delivery_till_2pm
          : "no";
        var farmPickUp = underAllowedTime(Settings?.farm_pick_up_time) ? IData.Farm_pick_up : "no";
        let jsonData = {
          Pincode: IData.Pincode,
          Region_ID: IData.Region_ID,
          Free_Shipping: Settings?.Free_Shipping === "no" ? "no" : IData.Free_Shipping,
          Free_Shipping_amount: IData.Free_Shipping_amount,
          status: IData.Status,
          Message: IData.Message,
          MOQ: Settings?.MOQ === "no" ? "no" : IData.MOQ,
          MOQ_Charges: IData.MOQ_Charges,
          COD: Settings?.COD === "no" ? "no" : IData.COD,
          COD_Charges: IData.COD_Charges,
          Farm_pick_up: Settings?.Farm_pick_up === "no" ? "no" : farmPickUp,
          Farm_pick_up_delivery_charges: IData.Farm_pick_up_delivery_charges,
          Same_day_delivery_till_2pm:
            Settings?.Same_day_delivery_till_2pm === "no" ? "no" : sameDayDlvry,
          Same_day_delivery_till_2pm_charges: IData.Same_day_delivery_till_2pm_charges,
          Next_day_delivery_Standard_9am_9pm:
            Settings?.Next_day_delivery_Standard_9am_9pm === "no"
              ? "no"
              : IData.Next_day_delivery_Standard_9am_9pm,
          Next_day_delivery_Standard_9am_9pm_charges:
            IData.Next_day_delivery_Standard_9am_9pm_charges,
          Next_day_delivery_8am_2pm:
            Settings?.Next_day_delivery_8am_2pm === "no" ? "no" : IData.Next_day_delivery_8am_2pm,
          Next_day_delivery_8am_2pm_charges: IData.Next_day_delivery_8am_2pm_charges,
          Next_day_delivery_2pm_8pm:
            Settings?.Next_day_delivery_2pm_8pm === "no" ? "no" : IData.Next_day_delivery_2pm_8pm,
          Next_day_delivery_2pm_8pm_charges: IData.Next_day_delivery_2pm_8pm_charges,
          Standard_delivery: Settings?.Standard_delivery === "no" ? "no" : IData.Standard_delivery,
          Standard_delivery_charges: IData.Standard_delivery_charges,
          Slot1String: Settings?.Slot1String,
          Slot2String: Settings?.Slot2String,
          Slot3String: Settings?.Slot3String,
          Slot4String: Settings?.Slot4String,
          Slot5String: Settings?.Slot5String,
        };

        res.status(200).json({ message: "ok", data: jsonData, code: 1 });
      }
    });
};

module.exports.CSVGet = async (req, res) => {
  let settings = await Settings?.findOne({}).lean();
  let apiUrl = Settings?.apilink;
  table.find().exec(function (err, data) {
    var FileName = "pincode";
    var d = new Date();
    var n = d.getDate();
    var file_Name = FileName + "-" + (n + new Date().getMilliseconds());
    var report = file_Name + ".csv";
    const csvWriter = createCsvWriter({
      path: "./public/pincode/" + file_Name + ".csv",
      header: [
        { id: "Pincode", title: "Pincode" },
        { id: "Region_ID", title: "Region_ID" },
        { id: "status", title: "Status" },
        { id: "Message", title: "Message" },
        { id: "MOQ", title: "MOQ" },
        { id: "MOQ_Charges", title: "MOQ_Charges" },
        { id: "Free_Shipping", title: "Free_Shipping" },
        { id: "Free_Shipping_amount", title: "Free_Shipping_amount" },
        { id: "COD", title: "COD" },
        { id: "COD_Charges", title: "COD_Charges" },
        { id: "Farm_pick_up", title: "Farm_pick_up" },
        { id: "Farm_pick_up_delivery_charges", title: "Farm_pick_up_delivery_charges" },
        { id: "Same_day_delivery_till_2pm", title: "Same_day_delivery_till_2pm" },
        { id: "Same_day_delivery_till_2pm_charges", title: "Same_day_delivery_till_2pm_charges" },
        { id: "Next_day_delivery_Standard_9am_9pm", title: "Next_day_delivery_Standard_9am_9pm" },
        {
          id: "Next_day_delivery_Standard_9am_9pm_charges",
          title: "Next_day_delivery_Standard_9am_9pm_charges",
        },
        { id: "Next_day_delivery_8am_2pm", title: "Next_day_delivery_8am_2pm" },
        { id: "Next_day_delivery_8am_2pm_charges", title: "Next_day_delivery_8am_2pm_charges" },
        { id: "Next_day_delivery_2pm_8pm", title: "Next_day_delivery_2pm_8pm" },
        { id: "Next_day_delivery_2pm_8pm_charges", title: "Next_day_delivery_2pm_8pm_charges" },
        { id: "Standard_delivery", title: "Standard_delivery" },
        { id: "Standard_delivery_charges", title: "Standard_delivery_charges" },
      ],
    });
    var jsonData = [];
    for (var i = 0; i < data.length; i++) {
      var IData = data[i];
      jsonData.push({
        Pincode: IData.Pincode,
        Region_ID: IData.Region_ID,
        Free_Shipping: IData.Free_Shipping,
        Free_Shipping_amount: IData.Free_Shipping_amount,
        status: IData.status,
        Message: IData.Message,
        MOQ: IData.MOQ,
        MOQ_Charges: IData.MOQ_Charges,
        COD: IData.COD,
        COD_Charges: IData.COD_Charges,
        Farm_pick_up: IData.Farm_pick_up,
        Farm_pick_up_delivery_charges: IData.Farm_pick_up_delivery_charges,
        Same_day_delivery_till_2pm: IData.Same_day_delivery_till_2pm,
        Same_day_delivery_till_2pm_charges: IData.Same_day_delivery_till_2pm_charges,
        Next_day_delivery_Standard_9am_9pm: IData.Next_day_delivery_Standard_9am_9pm,
        Next_day_delivery_Standard_9am_9pm_charges:
          IData.Next_day_delivery_Standard_9am_9pm_charges,
        Next_day_delivery_8am_2pm: IData.Next_day_delivery_8am_2pm,
        Next_day_delivery_8am_2pm_charges: IData.Next_day_delivery_8am_2pm_charges,
        Next_day_delivery_2pm_8pm: IData.Next_day_delivery_2pm_8pm,
        Next_day_delivery_2pm_8pm_charges: IData.Next_day_delivery_2pm_8pm_charges,
        Standard_delivery: IData.Standard_delivery,
        Standard_delivery_charges: IData.Standard_delivery_charges,
      });
    }
    csvWriter
      .writeRecords(jsonData) // returns a promise
      .then(() => {});
    res.status(201).json({ message: "ok", data: apiUrl + "/pincode/" + report, code: 1 });
  });
};

module.exports.AddOnePincodeSetting = function (req, res) {
  pincodeSetting.create(
    {
      Pincode: req.body.Pincode,
      Region_ID: req.body.Region_ID,
      Free_Shipping: req.body.Free_Shipping,
      MOQ: req.body.MOQ,
      COD: req.body.COD,
      farm_pick_up_time: req.body.farm_pick_up_time,
      Farm_pick_up: req.body.Farm_pick_up,
      Same_day_delivery_till_2pm: req.body.Same_day_delivery_till_2pm,
      same_day_delivery_time: req.body.same_day_delivery_time,
      Next_day_delivery_Standard_9am_9pm: req.body.Next_day_delivery_Standard_9am_9pm,
      Next_day_delivery_8am_2pm: req.body.Next_day_delivery_8am_2pm,
      Next_day_delivery_2pm_8pm: req.body.Next_day_delivery_2pm_8pm,
      Standard_delivery: req.body.Standard_delivery,
      Slot1String: req.body.Slot1String,
      Slot2String: req.body.Slot2String,
      Slot3String: req.body.Slot3String,
      Slot4String: req.body.Slot4String,
      Slot5String: req.body.Slot5String,
    },
    function (err, data) {
      if (err) {
        //console.log("Error creating");
        res.status(400).json(err);
      } else {
        console.log("created!", data);
        res.status(201).json({ message: "ok", data: data, code: 1 });
      }
    }
  );
};
module.exports.GetOnePincodeSetting = function (req, res) {
  pincodeSetting
    .find({})
    .lean()
    .exec(function (err, data) {
      if (err) {
        res.status(500).json({ message: "error", data: err, code: 0 });
      } else if (!data) {
        res.status(404).json({ message: "error", data: "data not found", code: 0 });
      } else {
        res.status(200).json({ message: "ok", data: data[0], code: 1 });
      }
    });
};

module.exports.UpdatePincodeSetting = function (req, res) {
  pincodeSetting
    .findOne({ _id: req.body._id })
    .lean()
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
      var updateData = {
        Pincode: req.body.Pincode,
        Region_ID: req.body.Region_ID,
        Free_Shipping: req.body.Free_Shipping,
        MOQ: req.body.MOQ,
        COD: req.body.COD,
        Farm_pick_up: req.body.Farm_pick_up,
        farm_pick_up_time: req.body.farm_pick_up_time,
        Same_day_delivery_till_2pm: req.body.Same_day_delivery_till_2pm,
        same_day_delivery_time: req.body.same_day_delivery_time,
        Next_day_delivery_Standard_9am_9pm: req.body.Next_day_delivery_Standard_9am_9pm,
        Next_day_delivery_8am_2pm: req.body.Next_day_delivery_8am_2pm,
        Next_day_delivery_2pm_8pm: req.body.Next_day_delivery_2pm_8pm,
        Standard_delivery: req.body.Standard_delivery,
        Slot1String: req.body.Slot1String,
        Slot2String: req.body.Slot2String,
        Slot3String: req.body.Slot3String,
        Slot4String: req.body.Slot4String,
        Slot5String: req.body.Slot5String,
      };

      pincodeSetting.update({ _id: req.body._id }, { $set: updateData }, function (err, data) {
        if (err) {
          res.status(500).json({
            message: "",
            data: err,
            code: 0,
          });
        } else {
          console.log(data);
          res.status(200).json({
            message: "ok",
            data: "",
            code: 1,
          });
          return;
        }
      });
    });
};
