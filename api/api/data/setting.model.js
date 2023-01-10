var mongoose = require("mongoose");

var contactSchema = mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    default: null,
  },

  key: {
    type: String,
    default: "contact-detail",
  },
  banner: {
    type: String,
    default: null,
  },
  logo: {
    type: String,
    default: null,
  },
  mailBanner: {
    type: String,
    default: null,
  },
  maintenanceBanner: {
    type: String,
    default: null,
  },
  maintenanceLink: {
    type: String,
    default: null,
  },
  maintenanceStatus: {
    type: Boolean,
    default: false,
  },
  slogan: {
    type: String,
    default: null,
  },
  icon: {
    type: String,
    default: null,
  },
  image: {
    type: String,
    default: null,
  },
  companyName: {
    type: String,
    default: null,
  },
  corporateOffice: {
    type: String,
    default: null,
  },
  registeredOffice: {
    type: String,
    default: null,
  },
  weblink: {
    type: String,
    default: null,
  },
  apilink: {
    type: String,
    default: null,
  },
  whatChatLink: {
    type: String,
    default: null,
  },
  email1: {
    type: String,
    default: null,
  },
  email2: {
    type: String,
    default: null,
  },
  phone1: {
    type: Number,
    default: null,
  },
  phone2: {
    type: Number,
    default: null,
  },
  whatAppNo: {
    type: Number,
    default: null,
  },
  googleMap: {
    type: String,
    default: null,
  },
  facebook: {
    type: String,
    trim: true,
    default: null,
  },
  twitter: {
    type: String,
    trim: true,
    default: null,
  },
  instagram: {
    type: String,
    trim: true,
    default: null,
  },
  linkedin: {
    type: String,
    trim: true,
    default: null,
  },
  google: {
    type: String,
    trim: true,
    default: null,
  },
  youtube: {
    type: String,
    trim: true,
    default: null,
  },
  loyalityProgramOnOff: {
    type: String,
    trim: true,
    default: "on",
  },
  refferalPointsOnOff: {
    type: String,
    trim: true,
    default: "on",
  },
  seedValue: {
    type: Number,
    default: 1,
  },
  preOrder: {
    type: Boolean,
    default: false,
  },
  preOrderPaymentType: {
    type: String,
    default: "Full",
  },
  prePrderPaymentPercentage: {
    type: Number,
    default: 0,
  },
  partialStatus: {
    type: Boolean,
    default: false,
  },
  partialPaymentType: {
    type: String,
    default: "Full",
  },
  partialPaymentPercentage: {
    type: Number,
    default: 0,
  },
  ProductAllowedWithPre: {
    type: String,
    default: "none",
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
  isDelete: {
    type: Number,
    default: 0,
  },

  // sms alert and email creds
  mail_host: {
    type: String,
    required: false,
    default: "",
  },
  mail_port: {
    type: String,
    required: false,
    default: "",
  },
  mail_username: {
    type: String,
    required: false,
    default: "",
  },
  mail_password: {
    type: String,
    required: false,
    default: "",
  },
  sms_senderID: {
    type: String,
    required: false,
    default: "",
  },
  sms_username: {
    type: String,
    required: false,
    default: "",
  },
  sms_password: {
    type: String,
    required: false,
    default: "",
  },
  payment_mid: {
    type: String,
    required: false,
    default: "",
  },
  payment_key: {
    type: String,
    required: false,
    default: "",
  },
  payment_website: {
    type: String,
    required: false,
    default: "",
  },

  emailOnSignup: {
    type: Boolean,
    default: false,
  },
  tokenExpiration: {
    // in minutes
    type: Number,
    default: 10080,
  },
  // contact us page map iframe
  map: {
    type: String,
    default: "",
  },
  driverNumber: {
    type: String,
    default: "",
  },
});

module.exports = mongoose.model("settings", contactSchema);
