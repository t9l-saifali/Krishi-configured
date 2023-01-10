var mongoose = require("mongoose");
var table = mongoose.model("attributes");
var groupTable = mongoose.model("attribute_groups");

module.exports.AddOne = function (req, res) {
  //   console.log("POST new data", req.body);
  var group_id = req.body.group_id;
  var attribute_name = req.body.name;
  var items = req.body.items;
  var status = req.body.status;
  var newItems = [];

  if (!group_id) {
    return res.status(400).json({
      status: "error",
      result: "group_id required",
    });
  }
  if (!attribute_name) {
    return res.status(400).json({
      status: "error",
      result: "attribute_name required",
    });
  }
  if (!items || items.length <= 0) {
    return res.status(400).json({
      status: "error",
      result: "minimum one item should be added.",
    });
  }

  if (items && items.length > 0) {
    for (var i = 0; i < items.length; i++) {
      newItems.push({
        item_name: items[i],
        item_status: true,
      });
    }
  }

  var nameFilter = { name: attribute_name.toLowerCase(), group: group_id };
  var error = {};
  table
    .find(nameFilter)
    .exec()
    .then((GetFilter) => {
      if (GetFilter.length > 0) {
        error["name"] = "name already exists in group";
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
            group: group_id,
            name: attribute_name,
            item: newItems,
            status: status,
          },
          function (err, data) {
            if (err) {
              res.status(400).json({message: "error", data: err, code: 0 });
            } else {
              res.status(201).json({ message: "ok", data: data, code: 1 });
            }
          }
        );
      }
    })
    .catch(function (err) {
      res.status(400).json({message: "error", data: err, code: 0 });
    });
};

module.exports.GetAll = function (req, res) {
  var skip = req.body.skip;
  var limit = req.body.limit;

  table.count().exec(function (err, count) {
    table
      .find()
      .populate("group")
      .skip(skip)
      .limit(limit)
      .sort({ created_at: "desc" })
      .exec(function (err, data) {
        if (err) {
          res.status(500).json({message: "error", data: err, code: 0 });
        } else {
          res.status(200).json({ message: "ok", data: data, count: count, code: 1 });
        }
      });
  });
};

module.exports.GetAllActive = function (req, res) {
  var skip = req.body.skip || 0;
  var limit = req.body.limit || 0;

  table
    .find({ status: true })
    .populate("group")
    .sort({ created_at: "desc" })
    .skip(skip)
    .limit(limit)
    .exec(function (err, data) {
      console.log(err);
      if (err) {
        res.status(500).json({message: "error", data: err, code: 0 });
      } else {
        res.status(200).json({ message: "ok", data: data, code: 1 });
      }
    });
};

module.exports.GetOne = function (req, res) {
  var id = req.params.Id;
  table
    .findById(id)
    .populate("group")
    .exec(function (err, data) {
      var response = {
        status: 200,
        message: { message: "ok", data: data, code: 1 },
      };
      if (err) {
        // console.log("Error finding user");
        response.status = 500;
        response.message = { message:"error" , data: "ID not found " + id, code: 0 };
      } else if (!data) {
        // console.log("userId not found in database", id);
        response.status = 404;
        response.message = { message:"error" , data: "ID not found " + id, code: 0 };
      }
      res.status(response.status).json(response.message);
    });
};

module.exports.Update = function (req, res) {
  var Id = req.body.id;

  var group_id = req.body.group_id;
  var attribute_name = req.body.name;
  var items = req.body.items;
  var status = req.body.status;
  var newItems = [];

  if (!group_id) {
    res.status(500).json({
      error: "group_id required.",
    });
  }
  if (!attribute_name) {
    res.status(500).json({
      error: "name required.",
    });
  }
  if (!items || items.length <= 0) {
    res.status(500).json({
      error: "minimum one item should be added.",
    });
  }

  if (items && items.length > 0) {
    for (var i = 0; i < items.length; i++) {
      newItems.push({
        item_name: items[i],
        item_status: true,
      });
    }
  }

  var nameFilter = { name: attribute_name, group: group_id };
  var error = {};
  table
    .find(nameFilter)
    .exec()
    .then((GetFilter) => {
      if (GetFilter.length > 0) {
        if (GetFilter[0]._id != Id) {
          error["name"] = "name alreday exists in group";
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
              // console.log('error finding the user');
              res.status(404).json({ message: "error", data: "id not found in the database", code: 0 });
              return;
            } else if (!data) {
              // console.log('user id not found in the database')
              res.status(404).json({ message: "error", data: "id not found in the database", code: 0 });
              return;
            }
            var updateData = {
              group: group_id,
              name: attribute_name,
              item: newItems,
              status: status,
            };
            table.update({ _id: Id }, { $set: updateData }, function (err, data) {
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
      res.status(400).json(err);
    });
};

module.exports.DeleteOne = function (req, res) {
  var Id = req.body.Id;
  // console.log(userId);
  table.findByIdAndRemove(Id).exec(function (err, data) {
    if (err) {
      res.status(404).json({ message: "error", data: err, code: 0 });
    } else {
      res.status(200).json({ message: "ok", data: "", code: 1 });
      return;
    }
  });
};

module.exports.GetAttributesInSingleGroup = function (req, res) {
  table
    .find({ group: req.body.group_id })
    .populate("group")
    .exec(function (err, data) {
      console.log(err);
      if (err) {
        res.status(500).json({ message: "error", data: err, code: 0 });
      } else {
        res.status(200).json({ message: "ok", data: data, code: 1 });
      }
    });
};
