var mongoose = require("mongoose");
var multer = require("multer");
var SubCat1 = mongoose.model("subCategory1");
var SubCat2 = mongoose.model("subCategory2");
var fileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/upload/");
    },
    filecategory_name: function (req, file, cb) {
        var ext = file.mimetype.split("/");
        cb(null, uniqueId(10) + "" + Date.now() + "." + ext[1]);
    },
});
var upload = multer({
    storage: fileStorage,
}).any();

function uniqueId(length) {
    var result = "";
    var characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * charactersLength)
        );
    }
    return result;
}
module.exports.createSubCat1 = function (req, res) {
    upload(req, res, function (err) {
        var nameFilter = { category_name: req.body.category_name };
        if (req.body.priority === undefined) {
            req.body.priority = null;
        }
        var priorityFilter = { priority: +req.body.priority };
        var error = {};
        SubCat1.find(nameFilter)
            .exec()
            .then(async (GetFilter) => {
                if (GetFilter.length > 0) {
                    error["category_name"] = "name already exist";
                }
                if (req.body.priority) {
                    var docCount = await SubCat1.find(priorityFilter).count();
                    if (docCount > 0) {
                        error["priority"] =
                            "Sub-Category with given priority already exist";
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
                    SubCat1.create(
                        {
                            level: req.body.level,
                            parentCat_id: req.body.parentCat_id,
                            category_name: req.body.category_name,
                            priority: req.body.priority,
                            parent: req.body.parent,
                            icon: req.files
                                .filter((i) => i.fieldname === "icon")
                                .map((i) => i.filename),
                            image: req.files
                                .filter((i) => i.fieldname === "image")
                                .map((i) => i.filename),
                            banner: req.files
                                .filter((i) => i.fieldname === "banner")
                                .map((i) => i.filename),
                            category_code: req.body.category_code,
                            tex_percent: req.body.tex_percent,
                            meta_title: req.body.meta_title,
                            meta_keyword: req.body.meta_keyword,
                            meta_desc: req.body.meta_desc,
                            created_at: Date.now(),
                        },
                        function (err, SubCat1) {
                            if (err) {
                                res.status(400).json(err);
                            } else {
                                res.status(200).json(SubCat1);
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

module.exports.updateSubCat1 = function (req, res) {
    upload(req, res, function (err) {
        var banner = "";
        var icon = "";
        var image = "";
        console.log(req.body);
        for (var j = 0; j < req.files.length; j++) {
            if (req.files[j].fieldname === "banner") {
                banner = req.files[j].filename;
            }
            if (req.files[j].fieldname === "icon") {
                icon = req.files[j].filename;
            }
            if (req.files[j].fieldname === "image") {
                image = req.files[j].filename;
            }
        }

        var Id = req.body.id;
        var nameFilter = { category_name: req.body.category_name };
        if (req.body.priority === undefined) {
            req.body.priority = null;
        }
        var priorityFilter = { priority: +req.body.priority };
        var error = {};
        SubCat1.find(nameFilter)
            .exec()
            .then(async (GetFilter) => {
                if (GetFilter.length > 0) {
                    if (GetFilter[0]._id != Id) {
                        error["category_name"] = "name alreday exist";
                    }
                }
                if (req.body.priority) {
                    var docCount = await SubCat1.find(priorityFilter).count();
                    if (docCount > 0) {
                        error["priority"] =
                            "Sub-Category with given priority already exist";
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
                    SubCat1.findById(Id)
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
                            if (image) {
                                image = data.image;
                            } else {
                                image = image;
                            }
                            var updateData = {
                                parentCat_id: req.body.parentCat_id,
                                category_name: req.body.category_name,
                                priority: req.body.priority,
                                parent: req.body.parent,
                                category_code: req.body.category_code,
                                tex_percent: req.body.tex_percent,
                                level: req.body.level,
                                banner: banner,
                                icon: icon,
                                image: image,
                                status: req.body.status,
                                meta_title: req.body.meta_title,
                                meta_keyword: req.body.meta_keyword,
                                meta_desc: req.body.meta_desc,
                            };
                            SubCat1.update(
                                { _id: Id },
                                { $set: updateData },
                                function (err, data) {
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
                                }
                            );
                        });
                }
            })
            .catch(function (err) {
                res.status(400).json(err);
            });
    });
};
module.exports.getAllSubCat1 = function (req, res) {
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

    SubCat1.find()
        .skip(skip)
        .limit(limit)
        .sort({ created_at: "desc" })
        .exec(function (err, data) {
            console.log(err);
            if (err) {
                res.status(500).json(err);
            } else {
                console.log("Found data", data.length);
                res.status(200).json({ message: "ok", data: data, code: 1 });
            }
        });
};
module.exports.deleteSubCat1 = function (req, res) {
    if (req.body.categoryId.length >= 1) {
        var categoryId = req.body.categoryId;
        console.log("deleting -=>", categoryId);
        SubCat1.deleteOne({
            _id: categoryId,
        }).exec(function (err, location) {
            if (err) {
                res.status(404).json(err);
            } else {
                res.status(200).json({
                    message: "Deleted Succesfully",
                });
                return;
            }
        });
    } else {
        res.status(200).json({
            message: "Invalid CategoryId",
        });
        return;
    }
};
module.exports.adminFilterSubCat = function (req, res) {
    console.log(req.body);
    var parentCat_id = req.body.parentCat_id;
    if (parentCat_id) {
        SubCat1.find({
            parentCat_id: parentCat_id,
        }).exec(function (err, SubCat1) {
            if (err) {
                res.status(400).json(err);
            } else {
                res.status(200).json({
                    message: "filter sub category",
                    data: SubCat1,
                });
                return;
            }
        });
    } else if (!parentCat_id) {
        SubCat1.find().exec(function (err, SubCat1) {
            if (err) {
                res.status(400).json(err);
            } else {
                res.status(200).json({
                    message: "all sub category",
                    data: SubCat1,
                });
                return;
            }
        });
    }
};
module.exports.filterSubCatList = function (req, res) {
    console.log(req.body);
    SubCat2.find({
        parentCat_id: req.body._id,
    }).exec(function (err, SubCat2Data) {
        if (err) {
            res.status(400).json(err);
        } else {
            if (SubCat2Data.length >= 1) {
                res.status(200).json(SubCat2Data);
            } else {
                res.status(200).json({
                    message: "Detail Page",
                });
            }
        }
    });
};
module.exports.cat_SubCat_detailList = async (req, res) => {
    var finalResult = [];
    await Category.find().exec(function (err, CategoryData) {
        SubCat1.find().exec(function (err, SubCat1Data) {
            if (err) {
                console.log("Error finding SubCat2 Data");
                res.status(400).json(err);
            } else {
                CategoryData.map((item, index) => {
                    SubCat1Data.map((item1, index1) =>
                        parseInt(item._id) === parseInt(item1.parentCat_id)
                            ? CategoryData.push("subCat_Data", item1)
                            : item
                    );
                });
                res.status(200).json({
                    message: "ok",
                    data: CategoryData,
                });
            }
        });
    });
};
