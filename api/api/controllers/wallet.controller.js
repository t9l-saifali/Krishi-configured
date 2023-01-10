var mongoose = require("mongoose");
var User = mongoose.model("Users");
var WalletHistories = mongoose.model("wallet_histories");
var common = require("../../common");
var moment = require("moment-timezone");
const Razorpay = require("razorpay");
// var payment_table = mongoose.model("payment_options");
// var OnOffDataBase = mongoose.model("email_sms_on_off");
module.exports.addMoney = async (req, res) => {
  const { amount, device_name } = req.body;
  // console.log({ user_id, amount, device_name });
  const user_id = req.decoded.ID;
  const userData = await User.findOne({ _id: user_id }).lean();
  if (!userData) {
    return res.status(500).json({ err: "No user Found" });
  } else {
    let CHANNEL_ID, WALLET_ID;
    if (device_name === "mobile") {
      CHANNEL_ID = "WAP";
    } else {
      CHANNEL_ID = "WEB";
    }

    WALLET_ID = user_id + "-" + new Date().getTime();

    common.WalletPayNow(
      {
        amount: String(amount),
        customerId: user_id,
        customerEmail: userData.email,
        customerPhone: String(userData.contactNumber),
        ORDER_ID: WALLET_ID,
        CHANNEL_ID: CHANNEL_ID,
      },
      res
    );
  }
};

module.exports.getUserWalletAmount = async (req, res) => {
  const user_id = req.decoded.ID;
  const userData = await User.findOne({ _id: user_id }, { walletAmount: 1, name: 1 }).lean();
  if (!userData) {
    return res.status(500).json({ err: "No user Found" });
  } else {
    return res.status(200).json({ msg: "ok", data: userData, code: 1 });
  }
};

module.exports.getAllTransactions = async (req, res) => {
  const { userName, customer_id, userEmail, userMobile, date, paymentStatus, amount } = req.body;

  let skip = req.body.skip ? +req.body.skip : 0;
  let limit = req.body.limit ? +req.body.limit : 0;

  var DataFilter = {};
  var USERDataFilter = [];
  //   DataFilter setup
  if (customer_id != null && customer_id != "") {
    DataFilter["user_id"] = mongoose.Types.ObjectId(customer_id);
  }
  if (date != null && date != "") {
    var to_date1 = new Date(date);
    to_date1.setDate(to_date1.getDate() + 1);
    DataFilter["created_at"] = {
      $gte: new Date(date),
      $lt: new Date(to_date1),
    };
  }
  if (paymentStatus != null && paymentStatus != "") {
    DataFilter["paymentStatus"] = paymentStatus;
  }
  if (amount != null && amount != "") {
    DataFilter["amount"] = +amount;
  }

  //   userDataFilter setup
  if (userName != null && userName != "") {
    USERDataFilter.push({
      $regexMatch: { input: "$user_id.name", regex: new RegExp(userName, "i") },
    });
  }
  if (userEmail != null && userEmail != "") {
    USERDataFilter.push({
      $regexMatch: { input: "$user_id.email", regex: new RegExp(userEmail, "i") },
    });
  }
  if (userMobile != null && userMobile != "") {
    USERDataFilter.push({
      $regexMatch: { input: "$user_id.contactNumber1", regex: new RegExp(String(userMobile), "i") },
    });
  }
  try {
    let data = await WalletHistories.aggregate([
      { $match: DataFilter },
      { $lookup: { from: "users", localField: "user_id", foreignField: "_id", as: "user_id" } },
      { $unwind: "$user_id" },
      {
        $addFields: {
          "user_id.contactNumber1": { $toString: { $toLong: "$user_id.contactNumber" } },
        },
      },
      { $addFields: { result: { $and: USERDataFilter } } },
      { $match: { result: true } },
      { $sort: { created_at: -1 } },
      {
        $facet: {
          count: [{ $count: "count" }],
          docs: [{ $skip: skip }, { $limit: limit }],
        },
      },
    ]);

    return res.status(200).json({
      msg: "ok",
      count: data[0].count[0] ? data[0].count[0].count : 0,
      data: data[0].docs,
      code: 1,
    });
  } catch (err) {
    return res.status(500).json({
      msg: "something went wrong",
      err: err,
      code: 1,
    });
  }
};

module.exports.getUserTransactions = async (req, res) => {
  const user_id = req.decoded.ID;
  let skip = req.body.skip ? +req.body.skip : 0;
  let limit = req.body.limit ? +req.body.limit : 0;

  if (!user_id) {
    common.formValidate("user_id", res);
    return false;
  }
  try {
    let transactions = await WalletHistories.find({ user_id: user_id })
      .populate("user_id")
      .populate("orderID")
      .populate("subscription_id")
      .skip(skip)
      .limit(limit)
      .sort({ created_at: "desc" });
    return res.status(200).json({ msg: "ok", data: transactions, code: 1 });
  } catch (err) {
    return res.status(500).json({
      msg: "something went wrong",
      err: err,
      code: 1,
    });
  }
};
module.exports.addMoneyByRozarpay = async (req,res)=>{
  try {
    if(!req.body.user_id || !req.body.razorpay_orderid || !req.body.amount){
      return res.status(409).json({
        success:false,
        message:"Missing Parameters"
      })
    }
    const userData = await User.findOne({ _id: req.body.user_id }).lean();
    if (!userData) {
      return res.status(500).json({ err: "No user Found" });
    }
    // const paymentdata = await payment_table.find();
    // const rozarpay_patment_rediantials = paymentdata.filter((curdata) => curdata.name == "Razorpay");
    var instance = new Razorpay({
      // key_id: rozarpay_patment_rediantials[0].keys.keyid,
      // key_secret: rozarpay_patment_rediantials[0].keys.secretid,
      key_id: 'rzp_test_YCo8jDxF7g25lC',
      key_secret: 'fCF9SEw7wdrn0C74rn6oFD0V',
    });
    let razorpayPayment = await instance.payments.fetch(req.body.razorpay_orderid);
    console.log(razorpayPayment,"razorpayPayment")
    if (razorpayPayment?.status == "authorized" || razorpayPayment?.status == "captured") {
      let Obj = {
          amount: Number(req.body.amount),
          user_id:userData._id,
          paymentStatus:'Complete',
          type:'credit',
          razorpay_orderid:req.body.razorpay_orderid
        }
        await  User.findOneAndUpdate({ _id: userData._id },{ $inc: { walletAmount: Number(req.body.amount) } })
        let addAmount = await WalletHistories.create(Obj)
        if(addAmount){
          res.status(200).json({
            success:true,
            message:"Added"
          })
        }
    }
    else {
      res.status(400).json({
        success:false,
        message:"Payment is not Captured"
      })
    }
  } catch (error) {
    res.status(400).json({
      success:false,
      message:'Something went wrong',
      err:error
    })
  }
}
