// imports
const mongoose = require("mongoose");
const Category = mongoose.model("categories");
const Product = mongoose.model("products");
const common = require("../../common");

// initialize multer
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

// utility functions

function uniqueId(length) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const updateAncestorsAndLevel = async (id, parent_id) => {
  let ancest = [];
  let newLevel;
  try {
    let parent_category = await Category.findOne(
      { _id: parent_id },
      { category_name: 1, slug: 1, ancestors: 1, level: 1 }
    ).exec();
    if (parent_category) {
      const { _id, category_name, slug } = parent_category;
      ancest = [...parent_category.ancestors];
      //console.log("000000000111", ancest);
      ancest.unshift({ _id, category_name, slug });
      newLevel = Number(parent_category.level + 1);
      const category = await Category.findByIdAndUpdate(id, {
        $set: { ancestors: ancest, level: newLevel },
      });
    } else {
      //console.log("no category found");
    }
  } catch (err) {
    //console.log(err.message);
  }
};

const rebuildHierarchyAncestorsAndLevel = async (category_id, parent_id) => {
  if (category_id && parent_id) updateAncestorsAndLevel(category_id, parent_id);
  if (category_id && !parent_id) {
    await Category.findByIdAndUpdate(category_id, {
      $set: { ancestors: [], level: 0 },
    });
  }
  const result = await Category.find({ parent: category_id }).exec();
  if (result)
    result.forEach((doc) => {
      // console.log("============", doc.category_name);
      rebuildHierarchyAncestorsAndLevel(doc._id, category_id);
    });
};

// API controllers

module.exports.AddOne = (req, res) => {
  upload(req, res, function (err) {
    let slug = common.slugify(req.body.category_name);
    let nameFilter = { slug };
    let parent = req.body.parent ? req.body.parent : null;
    var priorityFilter = { priority: +req.body.priority, parent };
    var error = {};
    Category.find(nameFilter)
      .exec()
      .then(async (GetFilter) => {
        if (GetFilter.length > 0) {
          error["category_name"] = "Category already exist";
        }
        if (req.body.priority) {
          let docCount = await Category.find(priorityFilter).count();
          if (docCount > 0) {
            error["priority"] = "Category with given priority already exist";
          }
          //console.log("docCount::::::::::::", docCount);
        } else {
          // console.log("req.body.priorityreq.body.priorityreq.body.priority", !req.body.priority);
          req.body.priority = Infinity;

          // console.log("req.body.priorityreq.body.priorityreq.body.priority", req.body.priority);
        }
        var errorArray = Object.keys(error).length;
        if (errorArray > 0) {
          return res.status(500).json({
            message: "error",
            data: [error],
            code: 0,
          });
        } else {
          var banner = "";
          var icon = "";
          if (req.files) {
            for (var j = 0; j < req.files.length; j++) {
              if (req.files[j].fieldname === "banner") {
                banner = req.files[j].filename;
              }
              if (req.files[j].fieldname === "icon") {
                icon = req.files[j].filename;
              }
            }
          }
          Category.create(
            {
              category_name: req.body.category_name,
              slug,
              priority: +req.body.priority,
              parent: parent,
              banner: banner,
              icon: icon,
              category_code: req.body.category_code,
              //tex_percent: req.body.tex_percent,
              meta_title: req.body.meta_title,
              meta_keyword: req.body.meta_keyword,
              meta_desc: req.body.meta_desc,
              status: req.body.status,
            },
            async (err, newCategory) => {
              if (err) {
                res.status(501).json(err);
              } else {
                if (parent) {
                  await updateAncestorsAndLevel(newCategory._id, parent);
                }
                res.status(201).json({
                  message: "ok",
                  data: "category created",
                  code: 1,
                });
              }
            }
          );
        }
      })
      .catch(function (err) {
        res.status(503).json(err);
        console.log(err);
      });
  });
};

module.exports.GetAll = (req, res) => {
  let { category_name, status } = req.body;
  let DataFilter = {};
  if (category_name) {
    DataFilter.category_name = {
      $regex: category_name,
      $options: "i",
    };
  }
  if (status === true || status === false) {
    DataFilter.status = status;
  }

  Category.find(DataFilter)
    .sort({ priority: 1 })
    // .populate("parent")
    .exec(function (err, resCategory) {
      var results = [];
      results.push(resCategory);
      if (err) {
        res.status(404).json({ message: "", data: err, code: 0 });
      } else {
        return res.status(200).json({
          message: "ok",
          data: results,
          code: 1,
        });
      }
    });
};

module.exports.GetAllActive = (req, res) => {
  Category.find({status:true})
    .sort({ priority: 1 })
    // .populate("parent")
    .exec(function (err, resCategory) {
      var results = [];
      results.push(resCategory);
      if (err) {
        res.status(404).json({ message: "", data: err, code: 0 });
      } else {
        return res.status(200).json({
          message: "ok",
          data: results,
          code: 1,
        });
      }
    });
};

module.exports.Update = (req, res) => {
  upload(req, res, function (err) {
    var banner = "";
    var icon = "";
    if (req.files) {
      for (var j = 0; j < req.files.length; j++) {
        if (req.files[j].fieldname === "banner") {
          banner = req.files[j].filename;
        }
        if (req.files[j].fieldname === "icon") {
          icon = req.files[j].filename;
        }
      }
    }

    let slug = common.slugify(req.body.category_name);

    var Id = req.body.id;
    let parent = req.body.parent ? req.body.parent : null;

    var nameFilter = { category_name: req.body.category_name };
    var priorityFilter = { priority: +req.body.priority, parent };

    var error = {};
    Category.find(nameFilter)
      .exec()
      .then(async (GetFilter) => {
        if (GetFilter.length > 0) {
          if (GetFilter[0]._id != Id) {
            error["category_name"] = "Category alreday exist";
          }
        }
        if (req.body.priority) {
          var docs = await Category.find(priorityFilter).lean();
          if (docs.length > 0) {
            docs.forEach((doc) => {
              if (doc._id != Id) {
                error["priority"] = "Category with given priority already exist";
              }
            });
          }
        } else {
          // console.log("req.body.priorityreq.body.priorityreq.body.priority", !req.body.priority);
          req.body.priority = Infinity;

          // console.log("req.body.priorityreq.body.priorityreq.body.priority", req.body.priority);
        }
        var errorArray = Object.keys(error).length;
        if (errorArray > 0) {
          return res.status(200).json({
            status: "error",
            result: [error],
          });
        } else {
          Category.findById(Id)
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
                category_name: req.body.category_name,
                level: 0,
                priority: +req.body.priority,
                parent: parent,
                banner: banner,
                icon: icon,
                category_code: req.body.category_code,
                slug: slug,
                //tex_percent  : req.body.tex_percent,
                status: req.body.status,
                meta_title: req.body.meta_title,
                meta_keyword: req.body.meta_keyword,
                meta_desc: req.body.meta_desc,
              };
              Category.update({ _id: Id }, { $set: updateData }, function (err, result) {
                if (err) {
                  res.status(500).json({
                    message: "",
                    data: err,
                    code: 0,
                  });
                } else {
                  if (data.parent != parent) {
                    rebuildHierarchyAncestorsAndLevel(data._id, parent);
                  }
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

module.exports.GetCategorySubCat = function (req, res) {
  const region_id = req.body.regionID;
  var subscribe = req.body.subscribe ? req.body.subscribe : false;
  if (subscribe == true || subscribe == "true") {
    var DataFilter = {
      status: true,
      productSubscription: "yes",
      $or: [
        {
          "simpleData.region": region_id,
          simpleData: { $elemMatch: { region: region_id } },
          //"simpleData._id":0,
        },
        {
          "configurableData.region": region_id,
          configurableData: { $elemMatch: { region: region_id } },
          //"simpleData._id":0,
        },
        // {
        //   TypeOfProduct: "group",
        // },
      ],
    };
  } else {
    var DataFilter = {
      status: true,
      $or: [
        {
          "simpleData.region": region_id,
          simpleData: { $elemMatch: { region: region_id } },
          //"simpleData._id":0,
        },
        {
          "configurableData.region": region_id,
          configurableData: { $elemMatch: { region: region_id } },
          //"simpleData._id":0,
        },
        // {
        //   TypeOfProduct: "group",
        // },
      ],
    };
  }
  Product.find(DataFilter, { product_categories: 1, ProductRegion: 1 })
    .populate("product_categories")
    .populate("ProductRegion.region_id", "name")
    //.sort({ priority: 1 })
    .exec(async function (err, data) {
      if (err) {
        res.status(500).json(err);
      } else if (data == "" || data.length == 0) {
        res.status(200).json({
          message: "No products found",
          data: data,
          code: 1,
        });
      } else {
        let categories = [];
        data.forEach((prod) => {
          prod.product_categories.forEach((cat) => {
            if (!categories.includes(cat._id)) {
              categories.push(mongoose.Types.ObjectId(cat._id));
            }
            cat.ancestors.forEach((el) => {
              if (!categories.includes(el._id)) {
                categories.push(mongoose.Types.ObjectId(el._id));
              }
            });
          });
        });
        //console.log("categories:::::::", categories);
        let categoriesData = await Category.find({
          _id: { $in: categories },
        }).lean();

        const result = [...categoriesData];
        //console.log(result);

        const idMapping = result.reduce((acc, el, i) => {
          acc[el._id] = i;
          return acc;
        }, {});
        // console.log(idMapping);

        let root = [];
        result.forEach((el) => {
          // Handle the root category
          if (el.parent === null) {
            root.push(el);
            return;
          }
          const parentEl = result[idMapping[el.parent]];
          // Add our current el to its parent's `children` array
          parentEl.SubCatData = [...(parentEl.SubCatData || []), el];
        });

        //sorting of json data by chitra

        root.sort((a, b) => a.priority - b.priority);
        // root.forEach((el) => {
        //   console.log({ name: el.category_name, priority: el.priority });
        // });
        res.status(200).json({
          message: "ok",
          data: root,
          code: 1,
        });
      }
    });
};

module.exports.getAllDescendantCategories = async (req, res) => {
  let id = req.body.id;
  let findFilter;
  if (id) {
    findFilter = { "ancestors._id": id };
  } else {
    findFilter = {};
  }
  const data = await Category.find(findFilter).lean();
  const result = [...data];
  //console.log(result);

  const idMapping = result.reduce((acc, el, i) => {
    acc[el._id] = i;
    return acc;
  }, {});
  // console.log(idMapping);

  let root = [];
  result.forEach((el) => {
    // Handle the root category
    if (el.parent === null) {
      root.push(el);
      return;
    }
    const parentEl = result[idMapping[el.parent]];
    // Add our current el to its parent's `children` array
    parentEl.SubCatData = [...(parentEl.SubCatData || []), el];
  });

  res.status(200).json({
    message: "ok",
    data: root,
    code: 1,
  });
};

module.exports.deleteCategory = async (req, res) => {
  try {
    var categoryId = req.body.categoryId;
    var categoryName = req.body.categoryName;
    let DataFilter = {};
    if (categoryId) {
      DataFilter._id = categoryId;
    }
    if (categoryName) {
      DataFilter.category_name = categoryName;
    }
    let category = await Category.findOne(DataFilter);
    if (!category) {
      return res.status(200).json({
        message: "No category found in db",
      });
    }
    categoryId = category._id;
    // console.log("::::: category ::::::::", category);
    let childCategories = await Category.find({ "ancestors._id": categoryId });
    // console.log("::::: category ::::::::", childCategories);
    if (childCategories.length > 0) {
      return res.status(400).json({
        message: "error",
        data: "This category contains sub-category. You need to delete it first.",
        code: 0,
      });
    }
    let products = await Product.find({ product_categories: categoryId });
    if (products.length > 0) {
      return res.status(400).json({
        message: "error",
        data: "This category contains products. You need to delete them first.",
        code: 0,
      });
    }
    console.log("::::: all okay ::::::::");

    let deleted = await Category.deleteOne({ _id: categoryId });
    return res.status(200).json({
      message: "ok",
      data: "Deleted Successfully.",
      code: 1,
    });
  } catch (err) {
    return res.status(500).json({
      message: "error",
      data: "Something went wrong.",
      error: err,
      code: 0,
    });
  }
};

module.exports.updateCategoryStatus = function (req, res) {
  var _id = req.body._id;
  var status = req.body.status;
  var newvalues = {
    status: status,
  };

  if (_id == "" || !_id || _id == undefined || _id == null) {
    common.formValidate("_id", res);
    return false;
  }
  if (status == "" || !status || status == undefined || status == null) {
    common.formValidate("status", res);
    return false;
  }
  Category.update({ _id: _id }, { $set: newvalues }, function (err, data) {
    if (err) {
      res.status(500).json({ message: "", data: err });
    } else {
      Category.findOne({ _id: _id }).exec(function (err, data) {
        res.status(200).json({
          message: "category updated!",
          data: data,
          code: 1,
        });
        return;
      });
    }
  });
};
