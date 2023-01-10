var mongoose = require("mongoose");
var table = mongoose.model("product_categories");
var Detail = mongoose.model("products");
var SubCat1 = mongoose.model("subCategory1");
var SubCat2 = mongoose.model("subCategory2");
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

module.exports.AddOne = function (req, res) {
  upload(req, res, function (err) {
    var nameFilter = { category_name: req.body.category_name };
    if (req.body.priority === undefined) {
      req.body.priority = null;
    }
    var priorityFilter = { priority: +req.body.priority };
    var error = {};
    table
      .find(nameFilter)
      .exec()
      .then(async (GetFilter) => {
        if (GetFilter.length > 0) {
          error["category_name"] = "Category already exist";
        }
        if (req.body.priority) {
          var docCount = await table.find(priorityFilter).count();
          if (docCount > 0) {
            error["priority"] = "Category with given priority already exist";
          }
        }
        console.log("docCount::::::::::::", docCount);
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
              level: req.body.level,
              category_name: req.body.category_name,
              banner: req.files.filter((i) => i.fieldname === "banner").map((i) => i.filename),
              icon: req.files.filter((i) => i.fieldname === "icon").map((i) => i.filename),
              category_code: req.body.category_code,
              //tex_percent: req.body.tex_percent,
              priority: +req.body.priority,
              meta_title: req.body.meta_title,
              meta_keyword: req.body.meta_keyword,
              meta_desc: req.body.meta_desc,
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
      })
      .catch(function (err) {
        res.status(400).json(err);
      });
  });
};

// module.exports.GetAll = function (req, res) {
// 	var offset = 0;
// 	var count = 5;
// 	var maxCount = 50;

// 	if (req.query && req.query.offset) {
// 		offset = parseInt(req.query.offset, 10);
// 	}

// 	if (req.query && req.query.count) {
// 		count = parseInt(req.query.count, 10);
// 	}

// 	if (isNaN(offset) || isNaN(count)) {
// 		res
// 			.status(400)
// 			.json({
// 				"message": "If supplied in querystring, count and offset must both be numbers"
// 			});
// 		return;
// 	}

// 	if (count > maxCount) {
// 		res
// 			.status(400)
// 			.json({
// 				"message": "Count limit of " + maxCount + " exceeded"
// 			});
// 		return;
// 	}

// 	if(req.body.category_name){
//         var category_name = req.body.category_name;
//     }
//     if(req.body.status){
//         var status = req.body.status;
//     }

//     var DataFilter = {};
//     if(category_name != null){
//         DataFilter['category_name'] = {'$regex': category_name}

//     }
//     if(req.body.status != null || req.body.status === false || req.body.status === true){
//         DataFilter['status'] = req.body.status
//     }
// 	table
// 	.find(DataFilter)
// 	.populate('products')
// 	.sort({'created_at': 'desc'})
// 	// .skip(offset)
// 	// .limit(count)
// 	.exec(function (err, data) {
// 		if (err) {
// 			res
// 				.status(500)
// 				.json(err);
// 		} else {
// 			res
// 				.status(200)
// 				.json({ "message": 'ok', "data": data, "code": 1 });
// 		}
// 	});
// };
module.exports.GetAll = function (req, res) {
  table.find().exec(function (err, resCategory) {
    
        var results = [];
        results.push(resCategory);
        if (err) {
          res.status(404).json({ message: "", data: err, code: 0 });
        } else {
          res.status(200).json({
            message: "ok 224355",
            data: results,
            code: 1,
          });
          return;
        }
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

module.exports.Update = function (req, res) {
  upload(req, res, function (err) {
    var banner = "";
    var icon = "";
    for (var j = 0; j < req.files.length; j++) {
      if (req.files[j].fieldname === "banner") {
        banner = req.files[j].filename;
      }
      if (req.files[j].fieldname === "icon") {
        icon = req.files[j].filename;
      }
    }

    var Id = req.body.id;
    if (req.body.priority === undefined) {
      req.body.priority = null;
    }
    var nameFilter = { category_name: req.body.category_name };
    var priorityFilter = { priority: +req.body.priority };
    var error = {};
    table
      .find(nameFilter)
      .exec()
      .then(async (GetFilter) => {
        if (GetFilter.length > 0) {
          if (GetFilter[0]._id != Id) {
            error["category_name"] = "Category alreday exist";
          }
        }
        if (req.body.priority) {
          var docCount = await table.find(priorityFilter).count();
          if (docCount > 0) {
            error["priority"] = "Category with given priority already exist";
          }
        }
        var errorArray = Object.keys(error).length;
        if (errorArray > 0) {
          return res.status(200).json({
            status: "error",
            result: [error],
          });
        } else {
          table
            .findById(Id)
            // .findOne({"email":emailId,"password":password})
            // .select('username email'
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
              if (banner) {
                banner = banner;
              } else {
                banner = data.banner;
              }
              if (icon) {
                icon = icon;
              } else {
                icon = data.icon;
              }
              var updateData = {
                level: req.body.level,
                category_name: req.body.category_name,
                banner: banner,
                icon: icon,
                category_code: req.body.category_code,
                priority: +req.body.priority,
                //tex_percent  : req.body.tex_percent,
                status: req.body.status,
                meta_title: req.body.meta_title,
                meta_keyword: req.body.meta_keyword,
                meta_desc: req.body.meta_desc,
              };
              table.update({ _id: Id }, { $set: updateData }, function (err, data) {
                if (err) {
                  res.status(500).json({
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
      })
      .catch(function (err) {
        res.status(400).json(err);
      });
  });
};

module.exports.DeleteOne = function (req, res) {
  var Id = req.params.Id;
  table.findByIdAndRemove(Id).exec(function (err, data) {
    if (err) {
      res.status(404).json({ message: "", data: err, code: 0 });
    } else {
      res.status(200).json({ message: "ok", data: "", code: 1 });
      return;
    }
  });
};

module.exports.GetCategoryProducts = function (req, res) {
  table
    .aggregate([
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "product_cat_id",
          as: "productData",
        },
      },
    ])
    .exec(function (err, data) {
      if (err) {
        res.status(500).json(err);
      } else {
        res.status(200).json({ message: "ok", data: data, code: 1 });
      }
    });
};

module.exports.GetCategorySubCat = function (req, res) {
  const regionID = req.body.regionID;
  console.log("regionID:::::::", regionID);
  table
    .aggregate([
      {
        $match: {
          status: true,
          regions: mongoose.Types.ObjectId(regionID),
        },
      },
      { $sort: { created_at: -1 } },
      {
        $lookup: {
          from: "subcategory1",
          let: { id: "$_id" },
          pipeline: [
            {
              $match: {
                regions: mongoose.Types.ObjectId(regionID),
                $expr: {
                  $eq: ["$parentCat_id", "$$id"],
                },
              },
            },
          ],
          as: "SubCatData",
        },
      },
      {
        $project: {
          "SubCatData.status": 1,
          "SubCatData.category_name": 1,
          "SubCatData._id": 1,
          "SubCatData.icon": 1,
          // "SubCatData.productAdded": 1,
          category_name: 1,
          icon: 1,
          // productAdded: 1,
          _id: 1,
        },
      },
    ])
    .exec(function (err, data) {
      if (err) {
        res.status(400).json(err);
      } else {
        // var jsonData = [];
        // for (var i = 0; i < data.length; i++) {
        //     var Idata = data[i];

        //     if (Idata.SubCatData != null || Idata.SubCatData != "") {
        //         var ISubData = Idata.SubCatData;
        //         var SubCatDataArray = [];
        //         for (var k = 0; k < ISubData.length; k++) {
        //             if (ISubData[k].productAdded == true) {
        //                 SubCatDataArray.push({
        //                     category_name: ISubData[k].category_name,
        //                     icon: ISubData[k].icon,
        //                     status: ISubData[k].status,
        //                     _id: ISubData[k]._id,
        //                 });
        //             }
        //         }
        //     } else {
        //         var SubCatDataArray = [];
        //     }
        //     if (Idata.productAdded == true) {
        //         jsonData.push({
        //             _id: Idata._id,
        //             category_name: Idata.category_name,
        //             icon: Idata.icon,
        //             SubCatData: SubCatDataArray,
        //         });
        //     }
        // }
        res.status(200).json({
          message: "ok",
          data: data,
          code: 1,
        });
      }
    });
};

module.exports.getAllCategories = function (req, res) {
  table.find().exec(function (err, resCategory) {
    SubCat1.find().exec(function (err, resSubCat1) {
      SubCat2.find().exec(function (err, resSubCat2) {
        var results = [];
        results.push(resCategory);
        results.push(resSubCat1);
        results.push(resSubCat2);
        if (err) {
          res.status(404).json({ message: "", data: err, code: 0 });
        } else {
          res.status(200).json({
            message: "ok",
            data: results,
            code: 1,
          });
          return;
        }
      });
    });
  });
};

module.exports.deleteCategory = async (req, res) => {
  if (req.body.categoryId.length >= 1) {
    var categoryId = req.body.categoryId;
    var categoryName = req.body.categoryName;
    var SubData;
    var detailCatData;
    var detailData;
    await SubCat2.find({
      parentCat_id: categoryId,
    }).exec(function (err, Data) {
      SubData = Data;
      SubCat1.find({
        parentCat_id: categoryId,
      }).exec(function (err, Data) {
        detailCatData = Data;
        Detail.find({
          product_cat_id: categoryId,
        }).exec(function (err, Data) {
          detailData = Data;

          if (detailCatData.length >= 1) {
            res.status(404).json({
              message: "Please delete category of this category before deleting this category",
            });
          } else if (detailData.length >= 1) {
            res.status(404).json({
              message: "Please delete product category of this category before deleting this category",
            });
          } else if (SubData.length >= 1) {
            res.status(404).json({
              message: "Please delete child Category before deleting this category",
            });
          } else {
            table
              .deleteOne({
                _id: categoryId,
              })
              .exec(function (err, location) {
                SubCat1.deleteOne({
                  _id: categoryId,
                }).exec(function (err, response) {
                  SubCat2.deleteOne({
                    _id: categoryId,
                  }).exec(function (err, response) {
                    if (err) {
                      res.status(404).json(err);
                    } else {
                      res.status(200).json({
                        message: "Deleted Succesfully",
                      });
                      return;
                    }
                  });
                });
              });
          }
        });
      });
    });
  } else {
    res.status(200).json({
      message: "Invalid CategoryId",
    });
    return;
  }
};

module.exports.updateAnyCategory = function (req, res) {
  var level = req.body.level;
  var CategoryId = req.body.CategoryId;
  var status = req.body.status;
  var newvalues = {
    status: status,
  };

  if (level == "1" || level == 1) {
    table.update({ _id: CategoryId }, { $set: newvalues }, function (err, data) {
      if (err) {
        res.status(500).json({ message: "", data: err });
      } else {
        table.findOne({ _id: CategoryId }).exec(function (err, data) {
          res.status(200).json({
            message: "category updated!",
            data: data,
            code: 1,
          });
          return;
        });
      }
    });
  }
  if (level == "2" || level == 2) {
    SubCat1.update({ _id: CategoryId }, { $set: newvalues }, function (err, data) {
      if (err) {
        res.status(500).json({ message: "", data: err });
      } else {
        // sendOtp(contactNumber,otp)
        SubCat1.findOne({ _id: CategoryId }).exec(function (err, data) {
          res.status(200).json({
            message: "category updated!",
            data: data,
            code: 1,
          });
          return;
        });
      }
    });
  }
  if (level == "3" || level == 3) {
    SubCat2.update({ _id: CategoryId }, { $set: newvalues }, function (err, data) {
      if (err) {
        res.status(500).json({ message: "", data: err });
      } else {
        // sendOtp(contactNumber,otp)
        SubCat2.findOne({ _id: CategoryId }).exec(function (err, data) {
          res.status(200).json({
            message: "category updated!",
            data: data,
            code: 1,
          });
          return;
        });
      }
    });
  }
};
