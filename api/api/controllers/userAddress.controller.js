var mongoose = require("mongoose");
var table = mongoose.model("UserAddress");

module.exports.AddOne = function (req, res) {
  var user_id = req.decoded.ID;
  var houseNo = req.body.houseNo;
  var street = req.body.street;
  var city = req.body.city;
  var district = req.body.district;
  var state = req.body.state;
  var country = req.body.country;
  var pincode = req.body.pincode;
  var locationTag = req.body.locationTag;
  var locality = req.body.locality;
  var latitude = req.body.latitude;
  var longitude = req.body.longitude;
  table.create(
    {
      user_id: user_id,
      houseNo: houseNo,
      street: street,
      city: city,
      pincode: pincode,
      district: district,
      state: state,
      country: country,
      locationTag: locationTag,
      locality: locality,
      latitude: latitude,
      longitude: longitude,
    },
    function (err, data) {
      if (err) {
        res.status(400).json(err);
      } else {
        res.status(201).json({ message: "ok", data: data, code: 1 });
      }
    }
  );
};

module.exports.admin_AddOne = function (req, res) {
  var user_id = req.body.user_id;
  var houseNo = req.body.houseNo;
  var street = req.body.street;
  var city = req.body.city;
  var district = req.body.district;
  var state = req.body.state;
  var country = req.body.country;
  var pincode = req.body.pincode;
  var locationTag = req.body.locationTag;
  var locality = req.body.locality;
  var latitude = req.body.latitude;
  var longitude = req.body.longitude;
  table.create(
    {
      user_id: user_id,
      houseNo: houseNo,
      street: street,
      city: city,
      pincode: pincode,
      district: district,
      state: state,
      country: country,
      locationTag: locationTag,
      locality: locality,
      latitude: latitude,
      longitude: longitude,
    },
    function (err, data) {
      if (err) {
        res.status(400).json(err);
      } else {
        res.status(201).json({ message: "ok", data: data, code: 1 });
      }
    }
  );
};

module.exports.GetUserAddress = function (req, res) {
  var user_id = req.decoded.ID;
  if (user_id) {
    table.find({ user_id: user_id }).exec(function (err, data) {
      if (err) {
        res.status(500).json(err);
      } else {
        res.status(200).json({ message: "ok", data: data, code: 1 });
      }
    });
  } else {
    res.status(200).json({ message: "user_id required!", data: [], code: 0 });
  }
};

module.exports.admin_GetUserAddress = function (req, res) {
  var user_id = req.body.user_id;
  if (user_id) {
    table.find({ user_id: user_id }).exec(function (err, data) {
      if (err) {
        res.status(500).json(err);
      } else {
        res.status(200).json({ message: "ok", data: data, code: 1 });
      }
    });
  } else {
    res.status(200).json({ message: "user_id required!", data: [], code: 0 });
  }
};

module.exports.DeleteOne = function (req, res) {
  console.log(req.body._id, 'req.body._id')
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

module.exports.Update = function (req, res) {
  var Id = req.body._id;
  var user_id = req.decoded.ID;
  var houseNo = req.body.houseNo;
  var street = req.body.street;
  var city = req.body.city;
  var district = req.body.district;
  var state = req.body.state;
  var country = req.body.country;
  var pincode = req.body.pincode;
  var locationTag = req.body.locationTag;
  var locality = req.body.locality;
  var latitude = req.body.latitude;
  var longitude = req.body.longitude;

  table
    .findById(Id)
    .lean()
    .exec(function (err, data) {
      if (err) {
        res.status(404).json({ message: "id not found in the database", data: err, code: 0 });
        return;
      } else if (!data) {
        res.status(404).json({ message: "id not found in the database", data: "", code: 0 });
        return;
      }
      if (data.user_id.toString() != user_id.toString()) {
        return res.status(500).json({ message: "error", data: "Cannot change other user's address", code: 0 });
      }
      var updateData = {
        // user_id: user_id,
        houseNo: houseNo,
        street: street,
        city: city,
        district: district,
        state: state,
        country: country,
        pincode: pincode,
        locationTag: locationTag,
        locality: locality,
        latitude: latitude,
        longitude: longitude,
      };
      table.update({ _id: Id }, { $set: updateData }, function (err, data) {
        if (err) {
          res.status(500).json({ message: "", data: err, code: 0 });
        } else {
          return res.status(200).json({ message: "ok", data: "", code: 1 });
        }
      });
    });
};

module.exports.admin_Update = function (req, res) {
  var Id = req.body._id;
  // var user_id = req.decoded.ID;
  var houseNo = req.body.houseNo;
  var street = req.body.street;
  var city = req.body.city;
  var district = req.body.district;
  var state = req.body.state;
  var country = req.body.country;
  var pincode = req.body.pincode;
  var locationTag = req.body.locationTag;
  var locality = req.body.locality;
  var latitude = req.body.latitude;
  var longitude = req.body.longitude;

  table
    .findById(Id)
    .lean()
    .exec(function (err, data) {
      if (err) {
        res.status(404).json({ message: "id not found in the database", data: err, code: 0 });
        return;
      } else if (!data) {
        res.status(404).json({ message: "id not found in the database", data: "", code: 0 });
        return;
      }
      // if (data.user_id.toString() != user_id.toString()) {
      //   res.status(500).json({ message: "error", data: "Cannot change other user's address", code: 0 });
      // }
      var updateData = {
        // user_id: user_id,
        houseNo: houseNo,
        street: street,
        city: city,
        district: district,
        state: state,
        country: country,
        pincode: pincode,
        locationTag: locationTag,
        locality: locality,
        latitude: latitude,
        longitude: longitude,
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
};
