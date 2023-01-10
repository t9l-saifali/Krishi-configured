var mongoose = require("mongoose");
var table = mongoose.model("settings");
var AboutTable = mongoose.model("abouts");
var PPtable = mongoose.model("privacy_policies");
var TCtable = mongoose.model("tcs");
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
    // console.log(req.body.maintenanceStatus);
    table.create(
      {
        icon: req.files.filter((i) => i.fieldname === "icon").map((i) => i.filename),
        image: req.files.filter((i) => i.fieldname === "image").map((i) => i.filename),
        logo: req.files.filter((i) => i.fieldname === "logo").map((i) => i.filename),
        mailBanner: req.files.filter((i) => i.fieldname === "mailBanner").map((i) => i.filename),
        banner: req.files.filter((i) => i.fieldname === "banner").map((i) => i.filename),
        maintenanceBanner: req.files.filter((i) => i.fieldname === "maintenanceBanner").map((i) => i.filename),
        maintenanceLink: req.body.maintenanceLink,
        maintenanceStatus: req.body.maintenanceStatus || false,
        corporateOffice: req.body.corporateOffice,
        registeredOffice: req.body.registeredOffice,
        weblink: req.body.weblink,
        apilink: req.body.apilink,
        email1: req.body.email1,
        email2: req.body.email2,
        phone1: req.body.phone1,
        phone2: req.body.phone2,
        whatAppNo: req.body.whatAppNo,
        whatChatLink: req.body.whatChatLink,
        googleMap: req.body.googleMap,
        facebook: req.body.facebook,
        twitter: req.body.twitter,
        instagram: req.body.instagram,
        linkedin: req.body.linkedin,
        google: req.body.google,
        youtube: req.body.youtube,
        slogan: req.body.slogan,
        preOrder: req.body.preOrder || false,
        preOrderPaymentType: req.body.preOrderPaymentType,
        prePrderPaymentPercentage: req.body.prePrderPaymentPercentage,
        partialStatus: req.body.partialStatus,
        partialPaymentType: req.body.partialPaymentType,
        partialPaymentPercentage: req.body.partialPaymentPercentage,
        ProductAllowedWithPre: req.body.ProductAllowedWithPre,
        refferalPointsOnOff: req.body.refferalPointsOnOff,
        companyName: req.body.companyName,
        seedValue: req.body.seedValue ? +req.body.seedValue : 1,
        mail_host: req.body.mail_host,
        mail_port: req.body.mail_port,
        mail_username: req.body.mail_username,
        mail_password: req.body.mail_password,
        sms_senderID: req.body.sms_senderID,
        sms_username: req.body.sms_username,
        sms_password: req.body.sms_password,
        payment_mid: req.body.payment_mid,
        payment_key: req.body.payment_key,
        payment_website: req.body.payment_website,
        map: req.body.map || "",
        emailOnSignup: req.body.emailOnSignup,
        tokenExpiration: req.body.tokenExpiration,
        driverNumber: req.body.driverNumber,
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
  });
};

module.exports.GetAll = function (req, res) {
  table.find().exec(function (err, data) {
    if (err) {
      res.status(500).json(err);
    } else {
      res.status(200).json({ message: "ok", data: data, code: 1 });
    }
  });
};

module.exports.UpdateOne = function (req, res) {
  upload(req, res, function (err) {
    // console.log(req.body.maintenanceStatus);

    var Id = req.body._id;
    var icon = "";
    var banner = "";
    var image = "";
    var logo = "";
    var mailBanner = "";
    var maintenanceBanner = "";
    for (var j = 0; j < req.files.length; j++) {
      if (req.files[j].fieldname === "icon") {
        icon = req.files[j].filename;
      }
      if (req.files[j].fieldname === "image") {
        image = req.files[j].filename;
      }
      if (req.files[j].fieldname === "banner") {
        banner = req.files[j].filename;
      }
      if (req.files[j].fieldname === "logo") {
        logo = req.files[j].filename;
      }
      if (req.files[j].fieldname === "mailBanner") {
        mailBanner = req.files[j].filename;
      }
      if (req.files[j].fieldname === "maintenanceBanner") {
        maintenanceBanner = req.files[j].filename;
      }
    }

    table
      .findById(Id)
      // .findOne({"email":emailId,"password":password})
      // .select('username email')
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

        if (banner) {
          banner = banner;
        } else {
          banner = data.banner;
        }

        if (logo) {
          logo = logo;
        } else {
          logo = data.logo;
        }

        if (mailBanner) {
          mailBanner = mailBanner;
        } else {
          mailBanner = data.mailBanner;
        }
        if (maintenanceBanner) {
          maintenanceBanner = maintenanceBanner;
        } else {
          maintenanceBanner = data.maintenanceBanner;
        }

        var updateData = {
          icon: icon,
          image: image,
          banner: banner,
          logo: logo,
          mailBanner: mailBanner,
          maintenanceBanner: maintenanceBanner,
          maintenanceLink: req.body.maintenanceLink,
          maintenanceStatus: req.body.maintenanceStatus || false,
          corporateOffice: req.body.corporateOffice,
          registeredOffice: req.body.registeredOffice,
          weblink: req.body.weblink,
          apilink: req.body.apilink,
          email1: req.body.email1,
          email2: req.body.email2,
          phone1: req.body.phone1,
          phone2: req.body.phone2,
          whatAppNo: req.body.whatAppNo,
          whatChatLink: req.body.whatChatLink,
          googleMap: req.body.googleMap,
          facebook: req.body.facebook,
          twitter: req.body.twitter,
          instagram: req.body.instagram,
          linkedin: req.body.linkedin,
          google: req.body.google,
          youtube: req.body.youtube,
          slogan: req.body.slogan,
          preOrder: req.body.preOrder || false,
          preOrderPaymentType: req.body.preOrderPaymentType,
          prePrderPaymentPercentage: req.body.prePrderPaymentPercentage,
          partialStatus: req.body.partialStatus,
          partialPaymentType: req.body.partialPaymentType,
          partialPaymentPercentage: req.body.partialPaymentPercentage,
          ProductAllowedWithPre: req.body.ProductAllowedWithPre,
          refferalPointsOnOff: req.body.refferalPointsOnOff,
          loyalityProgramOnOff: req.body.loyalityProgramOnOff,
          companyName: req.body.companyName,
          seedValue: req.body.seedValue ? +req.body.seedValue : 1,
          mail_host: req.body.mail_host,
          mail_port: req.body.mail_port,
          mail_username: req.body.mail_username,
          mail_password: req.body.mail_password,
          sms_senderID: req.body.sms_senderID,
          sms_username: req.body.sms_username,
          sms_password: req.body.sms_password,
          payment_mid: req.body.payment_mid,
          payment_key: req.body.payment_key,
          payment_website: req.body.payment_website,
          map: req.body.map || "",
          emailOnSignup: req.body.emailOnSignup,
          tokenExpiration: req.body.tokenExpiration,
          driverNumber: req.body.driverNumber,
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
  });
};

module.exports.addAbout = function (req, res) {
  let { _id, Team, partners, Philosophy, Journey, desc, status } = req.body;
  AboutTable.find()
    .exec()
    .then((getDetail) => {
      jsonData = {
        desc: desc,
        Team: Team,
        partners: partners,
        Philosophy: Philosophy,
        Journey: Journey,
        status: status,
      };
      if (getDetail.length > 0) {
        AboutTable.findOneAndUpdate({}, { $set: jsonData }, { new: true }, function (err, data) {
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
      } else {
        AboutTable.create(jsonData, function (err, data) {
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
      }
    });
};

module.exports.getAbout = function (req, res) {
  AboutTable.findOne().exec(function (err, data) {
    if (err) {
      res.status(500).json(err);
    } else {
      res.status(200).json({ message: "ok", data: data, code: 1 });
    }
  });
};

module.exports.addPrivacyPolicy = function (req, res) {
  let { _id, desc, status } = req.body;
  PPtable.find({})
    .exec()
    .then((getDetail) => {
      jsonData = {
        desc: desc,
        status: status,
      };
      if (getDetail.length > 0) {
        PPtable.findOneAndUpdate({}, { $set: jsonData }, { new: true }, function (err, data) {
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
      } else {
        PPtable.create(jsonData, function (err, data) {
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
      }
    });
};

module.exports.getPrivacyPolicy = function (req, res) {
  PPtable.findOne().exec(function (err, data) {
    if (err) {
      res.status(500).json(err);
    } else {
      res.status(200).json({ message: "ok", data: data, code: 1 });
    }
  });
};

module.exports.addTC = function (req, res) {
  let { _id, desc, status } = req.body;
  TCtable.find({})
    .exec()
    .then((getDetail) => {
      jsonData = {
        desc: desc,
        status: status,
      };
      if (getDetail.length > 0) {
        TCtable.findOneAndUpdate({}, { $set: jsonData }, { new: true }, function (err, data) {
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
      } else {
        TCtable.create(jsonData, function (err, data) {
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
      }
    });
};

module.exports.getTC = function (req, res) {
  TCtable.findOne().exec(function (err, data) {
    if (err) {
      res.status(500).json(err);
    } else {
      res.status(200).json({ message: "ok", data: data, code: 1 });
    }
  });
};

module.exports.imageUpload = function (req, res) {
  upload(req, res, function (err) {
    var imageName = req.files.filter((i) => i.fieldname === "image").map((i) => i.filename);
    var path = req.files.filter((i) => i.fieldname === "image").map((i) => i.filename);
    var data = { imageName: imageName, path: path };
    res.status(201).json({
      message: "ok",
      data: req.files,
      code: 1,
    });
  });
};
