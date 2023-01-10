var mongoose = require("mongoose");

var Schema = mongoose.Schema({
  reviewRating: {
    type: Boolean,
    default: true,
  },
  giftingOnOff: {
    type: Boolean,
    default: true,
  },
  creditPaymentOnOff: {
    type: Boolean,
    default: true,
  },
  creditPaymentOnline: {
    type: Boolean,
    default: true,
  },
  creditPaymentOffline: {
    type: Boolean,
    default: true,
  },
  whatsappOnOff: {
    type: Boolean,
    default: true,
  },

  whatsappLastStatus: {
    // used for restoring whatsapp's last status before node app crashing (or restarting )
    type: String,
    default: "offline",
    enum: ["offline", "online"],
  },

  invoiceDeclaration: {
    type: String,
    default: null,
  },
  invoicePaymentDetail: {
    type: String,
    default: null,
  },
  //product type on off
  simple_product: {
    type: Boolean,
    default: false,
  },
  config_product: {
    type: Boolean,
    default: false,
  },
  group_product: {
    type: Boolean,
    default: false,
  },
  createDate: {
    type: Date,
    timezone: "Asia/Kolkata",
    default: Date.now(),
  },
  updateDate: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model("storeheysettings", Schema);
