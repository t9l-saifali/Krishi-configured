var mongoose = require("mongoose");
var table = mongoose.model("pages");
var multer = require("multer");
const async = require("async");
var common = require("../../common");

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

module.exports.AddOne =  function (req, res){
  upload(req, res, async function (err){
    var {name,priority} = req.body
    if (name == "" || !name || name == undefined || name == null) {
      common.formValidate("name", res);
      return false;
    }
    if (priority == "" || !priority || priority == undefined || priority == null) {
      common.formValidate("priority", res);
      return false;
    }
    var error = {}
    var nameFilter = { 'name':req.body.name};
    var GetFilter = await table.find(nameFilter)
    var GetPriority = await table.find({priority:req.body.priority})
    if(GetFilter.length > 0) {
        error['name'] = 'name already exist';
    } 
    if(GetPriority.length > 0) {
        error['priority'] = 'priority already exist';
    } 
    var errorArray = Object.keys(error).length;
    if(errorArray > 0){
        return res.status(400).json({
            "message": "error",
            "data": [error],
            "code": 0
        });                          
    }else{
      var icon = "";
      var image = "";
      for (var j = 0; j < req.files.length; j++) {
        if (req.files[j].fieldname === "icon") {
          icon = req.files[j].filename;
        }
        if (req.files[j].fieldname === "image") {
          image = req.files[j].filename;
        }      
      }
      table.create(
        {
          icon: icon,
          image: image,
          addedby: req.body.addedby,
          name: req.body.name,
          title: req.body.title,
          priority:req.body.priority,
          detail: req.body.detail,
          meta_title: req.body.meta_title,
          meta_desc: req.body.meta_desc,
          HeaderVisibility: req.body.HeaderVisibility,
          FooterVisibility: req.body.FooterVisibility,
          status: req.body.status,
        },
        function (err, data) {
          if (err) {
            console.log(err)
            res.status(400).json({
              message: "error",
              data: 'Somthing went wrong',
              code: 0,
            });
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
  });
};

module.exports.GetAll = function (req, res) {
  table.find().exec(function (err, data) {
    if (err) {
      res.status(500).json({
        message: "error",
        data: 'Somthing went wrong',
        code: 0,
      });
    } else {
      res.status(200).json({ message: "ok", data: data, code: 1 });
    }
  });
};

module.exports.GetOne = function (req, res) {
  table.findOne({_id:req.body._id}).lean().exec(function (err, data) {
    if (err) {
      res.status(500).json({
        message: "error",
        data: 'Somthing went wrong',
        code: 0,
      });
    } else {
      res.status(200).json({ message: "ok", data: data, code: 1 });
    }
  });
};

module.exports.GetActiveOne = function (req, res) {
  table.findOne({_id:req.body._id, status:true}).lean().exec(function (err, data) {
    if (err) {
      res.status(500).json({
        message: "error",
        data: 'Somthing went wrong',
        code: 0,
      });
    } else {
      res.status(200).json({ message: "ok", data: data, code: 1 });
    }
  });
};

module.exports.UpdateOne = function (req, res) {
  upload(req, res, async function (err) {
    var {_id,name,priority} = req.body
    if (_id == "" || !_id || _id == undefined || _id == null) {
      common.formValidate("_id", res);
      return false;
    }
    if (name == "" || !name || name == undefined || name == null) {
      common.formValidate("name", res);
      return false;
    }
    if (priority == "" || !priority || priority == undefined || priority == null) {
      common.formValidate("priority", res);
      return false;
    }
    var _id = req.body._id;
    var error = {}
    var nameFilter = { 'name':req.body.name};
    var GetFilter = await table.find(nameFilter)
    var GetPriority = await table.find({priority:req.body.priority})
    if(GetFilter.length > 0) {
        if (GetFilter[0]._id != _id) {
          error['name'] = 'name alreday exist';
        } 
    } 
    console.log(GetPriority)
    if(GetPriority.length > 0) {
        if (GetPriority[0]._id != _id) {
          error['priority'] = 'priority alreday exist';
        } 
    } 
    var errorArray = Object.keys(error).length;
    if(errorArray > 0){
        return res.status(400).json({
            "message": "error",
            "data": [error],
            "code": 0
        });                          
    }else{
      
      var icon = "";
      var image = "";
      for (var j = 0; j < req.files.length; j++) {
        if (req.files[j].fieldname === "icon") {
          icon = req.files[j].filename;
        }
        if (req.files[j].fieldname === "image") {
          image = req.files[j].filename;
        }      
      }
      table
        .findById(_id)
        .exec(function (err, data) {
          if (err) {
            res.status(404).json({
              message: "error",
              data: 'id not found in the database',
              code: 0,
            });
            return;
          } else if (!data) {
            res.status(404).json({
               message: "error",
              data: 'id not found in the database',
              code: 0,
            });
            return;
          }
          if (icon) {
            icon = icon;
          } else {
            icon = data.icon;
          }

          if (image) {
            image = image;
          } else {
            image = data.image;
          }

          var updateData = {
            icon: icon,
            image: image,
            addedby: req.body.addedby,
            name: req.body.name,
            priority:req.body.priority,
            title: req.body.title,
            detail: req.body.detail,
            meta_title: req.body.meta_title,
            meta_desc: req.body.meta_desc,
            HeaderVisibility: req.body.HeaderVisibility,
            FooterVisibility: req.body.FooterVisibility,
            status: req.body.status,
            updateDate:new Date()
          };
          table.update({ _id: _id }, { $set: updateData }, function (err, data) {
            if (err) {
              res.status(500).json({
                message: "error",
                data: 'Somthing went wrong',
                code: 0,
              });
            } else {
              res.status(200).json({
                message: "ok",
                data: "update successfully Complete",
                code: 1,
              });
              return;
            }
          });
        });
      }
  });
};

module.exports.DeleteOne = function (req, res) {
  var _id = req.body._id;
  //console.log("delete -==>>", Id);
  table
    .findByIdAndRemove(_id)
    .exec(function (err, data) {
      if (err) {
        res
          .status(404)
          .json({ "message": 'error', "data": err, "code": 0 });
      } else {
        res
          .status(200)
          .json({ "message": 'ok', "data": '', "code": 1 })
        return;
      }
    })
};