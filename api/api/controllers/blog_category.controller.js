var mongoose = require("mongoose");
var table = mongoose.model("blog_categories");
var BlogTable = mongoose.model("blogs");
var common = require("../../common.js");
const ObjectId = mongoose.Types.ObjectId;
var multer = require("multer");
var common = require("../../common.js");
var errorLogger = common.errorLogger;
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

module.exports.updatealldatabase = async (req, res) => {
  table.find({}, { _id: 1, name: 1 }).exec(function (err, data) {
    for (var i = 0; i < data.length; i++) {
      let iData = data[i];
      var slug = common.slugify(iData.name);
      table.update(
        {
          _id: iData._id,
        },
        {
          $set: {
            slug: slug,
          },
        },
        function (err, data) {}
      );
    }
  });
};
module.exports.AddOne = function (req, res) {
  upload(req, res, async function (err) {
    var slug = common.slugify(req.body.name);
    var nameFilter = { slug: slug };
    var error = {};
    var GetFilter = await table.find(nameFilter).lean();
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
      table.create(
        {
          name: req.body.name,
          slug: slug,
          status: req.body.status,
          banner: req.files.length > 0 ? req.files.filter((i) => i.fieldname === "banner").map((i) => i.filename)[0] : null,
        },
        function (err, data) {
          if (err) {
            errorLogger.error(error, "\n", "\n");
            console.log("Error creating", err);
            res.status(400).json(err);
          } else {
            // console.log("created!", data);
            res.status(201).json({ message: "ok", data: data, code: 1 });
          }
        }
      );
    }
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
  if (req.body.date) {
    var date = req.body.date;
    var to_date1 = new Date(date);
    to_date1.setDate(to_date1.getDate() + 1);
  }
  if (req.body.status) {
    var status = req.body.status;
  }

  var DataFilter = {};
  if (name != null) {
    DataFilter["name"] = { $regex: name, $options: "i" };
  }
  if (date != null) {
    DataFilter["created_at"] = { $gte: new Date(date), $lte: new Date(to_date1) };
  }
  console.log(req.body.status);
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

module.exports.GetAllBlogByCategory = function (req, res) {
  var parentCat_id = req.body.parentCat_id;
  var categoryName = req.body.categoryName;

  if (categoryName.length > 0) {
    var DataFilter = { slug: categoryName, status: true };
  } else {
    var DataFilter = { _id: ObjectId(parentCat_id), status: true };
  }

  table
    .aggregate([
      { $match: DataFilter },
      {
        $lookup: {
          from: "blogs",
          localField: "_id",
          foreignField: "parentCat_id",
          as: "blogData",
        },
      },
      { $sort: { "blogData.date": 1 } },
    ])
    .exec(function (err, data) {
      if (err) {
        res.status(500).json({ message: "error", data: err, code: 1 });
      } else {
        res.status(200).json({ message: "ok", data: data, code: 1 });
      }
    });
};

module.exports.GetCategoryBlogs = function (req, res) {
  table
    .aggregate([
      { $match: { status: true } },
      {
        $lookup: {
          from: "blogs",
          localField: "_id",
          foreignField: "parentCat_id",
          as: "blogData",
        },
      },
      { $sort: { "blogData.date": -1 } },
    ])
    .exec(function (err, data) {
      if (err) {
        res.status(500).json({ message: "error", data: err, code: 1 });
      } else {
        var jsonData = [];

        for (var i = 0; i < data.length; i++) {
          var blogDataArray = data[i].blogData;
          blogDataArray.sort((a, b) => b.date - a.date);

          jsonData.push({
            blogData: blogDataArray,
            created_at: data[i].created_at,
            name: data[i].name,
            slug: data[i].slug,
            status: data[i].status,
            __v: data[i].__v,
            _id: data[i]._id,
          });
        }
        res.status(200).json({ message: "okscsddsds", data: jsonData, code: 1 });
      }
    });
};

module.exports.GetCategoryBlogsMobile = function (req, res) {
  BlogTable.find({ status: true })
    .populate("parentCat_id")
    //.populate('relatedProduct.product_id')
    .populate({
      path: "relatedProduct.product_id", // populate blogs
      populate: {
        path: "unitMeasurement", // in blogs, populate comments
      },
    })
    .limit(50)
    .sort({ date: -1 })
    .lean()
    .exec(function (err, data) {
      if (err) {
        res.status(500).json(err);
      } else if (!data) {
        res.status(200).json({ message: "ok", data: "No data found", code: 1 });
      } else {
        var JsonData = [];
        for (var i = 0; i < data.length; i++) {
          var iData = data[i];
          var array = iData.parentCat_id ? iData.parentCat_id : [];
          var blogCatArrayTrue = [];
          var blogCatArrayFalse = [];
          for (var i1 = 0; i1 < array.length; i1++) {
            var blogCat = array[i1];
            if (blogCat.name == "Media Coverage" || blogCat.name == "media coverage") {
              blogCatArrayTrue.push(true);
            } else {
              blogCatArrayFalse.push(false);
            }
          }
          if (blogCatArrayTrue.length > 0) {
          } else {
            JsonData.push({
              _id: iData._id,
              __v: iData.__v,
              created_at: iData.created_at,
              status: iData.status,
              meta_desc: iData.meta_desc,
              meta_keyword: iData.meta_keyword,
              meta_title: iData.meta_title,
              attachment: iData.attachment,
              relatedProduct: iData.relatedProduct,
              description4: iData.description4,
              description3: iData.description3,
              description2: iData.description2,
              description1: iData.description1,
              date: iData.date,
              mediaLink: iData.mediaLink,
              videoUrl: iData.videoUrl,
              banner: iData.banner,
              images: iData.images,
              recipeIcon: iData.recipeIcon,
              chefName: iData.chefName,
              prepTime: iData.prepTime,
              noOfServe: iData.noOfServe,
              title: iData.title,
              slug: iData.slug,
              parentCat_id: iData.parentCat_id,
            });
          }
        }
        if (JsonData.length <= 5) {
          var finalJsonData = JsonData;
        } else {
          var finalJsonData = JsonData.slice(0, 5);
        }
        res.status(200).json({ message: "ok", data: finalJsonData, code: 1 });
      }
    });
};

module.exports.Update = function (req, res) {
  upload(req, res, async function (err) {
    var Id = req.body._id;
    var slug = common.slugify(req.body.name);
    var nameFilter = { slug: slug };
    var error = {};
    var GetFilter = await table.find(nameFilter).lean();
    var error = {};
    if (GetFilter.length > 0) {
      if (GetFilter[0]._id != Id) {
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
      table.findById(Id).exec(function (err, data) {
        if (err) {
          res.status(404).json({ message: "err", data: err, code: 0 });
          return;
        } else if (!data) {
          res.status(404).json({ message: "id not found in the database", data: "", code: 0 });
          return;
        }
        var slug = common.slugify(req.body.name);
        var updateData = {
          name: req.body.name,
          slug: slug,
          status: req.body.status,
        };
        if (req.files.length > 0) {
          updateData.banner = req.files.filter((i) => i.fieldname === "banner").map((i) => i.filename)[0];
        }
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
