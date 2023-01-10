var mongoose = require("mongoose");
var table = mongoose.model("email_sms_on_off");

module.exports.addOne = async (req, res) => {
  try {
    await table.remove({});
    let data = await table.create({});
    return res.json({ message: "ok", data: data, code: 1 });
  } catch (err) {
    console.log("error :::::::::::::::::::::: ", err);
    return res
      .status(500)
      .json({ message: "something went wrong!", error: err, code: 0 });
  }
};

module.exports.updateOne = async (req, res) => {
  try {
    let body = req.body;
    let updatedDoc = await table.updateOne({}, { $set: body }, { new: true });
    return res.json({ message: "ok", data: updatedDoc, code: 1 });
  } catch (err) {
    console.log("error :::::::::::::::::::::: ", err);
    return res
      .status(500)
      .json({ message: "something went wrong!", error: err, code: 0 });
  }
};

module.exports.getOne = async (req, res) => {
  try {
    let data = await table.findOne({}).lean();
    return res.json({ message: "ok", data: data, code: 1 });
  } catch (err) {
    console.log("error :::::::::::::::::::::: ", err);
    return res
      .status(500)
      .json({ message: "something went wrong!", error: err, code: 0 });
  }
};
