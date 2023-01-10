var mongoose = require("mongoose");
var table = mongoose.model("slides");
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

module.exports.AddOne = async function (req, res) {
  upload(req, res, async function (err) {
    let exists = await table.findOne({ rank: req.body.rank }).lean();
    if (exists) {
      return res
        .status(400)
        .json({ message: "error", data: "Slide with given rank already exists", code: 0 });
    }
    table.create(
      {
        icon: req.files.filter((i) => i.fieldname === "icon").map((i) => i.filename)[0],
        image: req.files.filter((i) => i.fieldname === "image").map((i) => i.filename)[0],
        banner: req.files.filter((i) => i.fieldname === "banner").map((i) => i.filename)[0],
        link: req.body.link,
        status: req.body.status,
        rank: req.body.rank,
      },
      function (err, data) {
        if (err) {
          return res.status(400).json({ message: "error", data: err, code: 0 });
        } else {
          return res.status(201).json({ message: "ok", data: data, code: 1 });
        }
      }
    );
  });
};

module.exports.GetAll = function (req, res) {
  var skip = req.body.skip;
  var limit = req.body.limit;
  table.count().exec(function (err, count) {
    table
      .find()
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

module.exports.GetAllActive = function (req, res) {
  table
    .find({ status: true })
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

module.exports.Update = async function (req, res) {
  upload(req, res, async function (err) {
    var Id = req.body.id;
    var image = "";
    var icon = "";
    for (var j = 0; j < req.files.length; j++) {
      if (req.files[j].fieldname === "image") {
        image = req.files[j].filename;
      }
      if (req.files[j].fieldname === "icon") {
        icon = req.files[j].filename;
      }
    }

    table
      .findById(Id)
      // .findOne({"email":emailId,"password":password})
      // .select('username email')
      .exec(async function (err, data) {
        if (err) {
          res.status(404).json({ message: "id not found in the database", data: err, code: 0 });
          return;
        } else if (!data) {
          res.status(404).json({ message: "id not found in the database", data: "", code: 0 });
          return;
        }
        if (req.body.rank != data.rank) {
          let exists = await table
            .findOne({ rank: req.body.rank, _id: { $ne: mongoose.Types.ObjectId(req.body.id) } })
            .lean();
          if (exists) {
            return res
              .status(400)
              .json({ message: "error", data: "Slide with given rank already exists", code: 0 });
          }
        }
        if (!image) {
          image = data.image;
        }
        if (!icon) {
          icon = data.icon;
        }
        var updateData = {
          image: image,
          icon: icon,
          link: req.body.link,
          status: req.body.status,
          rank: req.body.rank,
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
  table.deleteOne({ _id: Id }).exec(function (err, data) {
    if (err) {
      res.status(404).json({ message: "", data: err, code: 0 });
    } else {
      res.status(200).json({ message: "ok", data: "", code: 1 });
      return;
    }
  });
};
