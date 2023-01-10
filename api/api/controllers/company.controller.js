var mongoose = require("mongoose");
var Company = mongoose.model("companies");

module.exports.addOne = (req, res) => {
  const {
    name,
    address,
    isDefault,
    FSSAI_NO,
    GSTIN_UIN,
    email,
    consumer_number,
    hospitality_number,
  } = req.body;
  const logo = req.files && req.files.logo ? req.files.logo : null;
  Company.create(
    {
      name,
      address,
      isDefault,
      FSSAI_NO,
      GSTIN_UIN,
      email,
      logo,
      consumer_number,
      hospitality_number,
    },
    (err, data) => {
      if (err) {
        return res.status(500).json({
          msg: "error",
          error: err,
          code: 0,
        });
      } else {
        return res.status(200).json({
          msg: "ok",
          data: data,
          code: 1,
        });
      }
    }
  );
};

module.exports.getAll = async (req, res) => {
  let data = await Company.find({});
  return res.status(200).json({
    msg: "ok",
    data: data,
    code: 1,
  });
};
