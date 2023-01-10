var mongoose = require("mongoose");
var userSchema = new mongoose.Schema({
  adminID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "admins",
    required: false,
    default: null,
  },
  sales_person: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "admins",
    required: false,
    default: null,
  },
  old_User_id: {
    type: Number,
    default: 0,
  },
  client_id: {
    type: Number,
    default: 0,
  },
  name: {
    type: String,
    required: false,
    lowercase: true,
    default: null,
  },
  email: {
    type: String,
    default: null,
  },
  password: {
    type: String,
  },
  user_type: {
    type: String,
    default: "user",
  },
  contactNumber: {
    type: Number,
    required: false,
    default: null,
  },
  otp: {
    type: Number,
    required: false,
  },
  gst_no: {
    type: String,
    default: null,
  },
  otp_verified: {
    type: Boolean,
    default: false,
  },
  verified_on: {
    type: Date,
    required: false,
  },
  myRefferalCode: {
    type: String,
    default: null,
  },
  refferalCodeFrom: {
    type: String,
    default: null,
  },
  TotalPoint: {
    type: Number,
    default: 0,
  },
  NoOfOrder: {
    type: Number,
    default: 0,
  },
  prevNoOfOrder: {
    type: Number,
    default: 0,
  },
  last_transaction_location_id: {
    type: Number,
    default: 0,
  },
  total_transactions_amount: {
    type: Number,
    default: 0,
  },
  LastOrderDate: {
    type: Date,
    required: false,
    default: null,
  },
  expiryDate: {
    type: Date,
    required: false,
    default: null,
  },
  oneweek: {
    type: Boolean,
    default: false,
  },
  twentyfourhour: {
    type: Boolean,
    default: false,
  },
  status: {
    type: Boolean,
    default: true,
  },
  isLogedIn: {
    type: Boolean,
    default: false,
  },
  ip: {
    type: String,
    default: null,
  },
  token: {
    type: String,
    default: null,
  },
  tokens:[{type: String}],
  subscribeToggle: {
    type: Boolean,
    default: false,
  },
  walletAmount: {
    type: Number,
    default: 0,
  },
  creditUsed: {
    type: Number,
    default: 0,
  },
  creditLimit: {
    type: Number,
    default: 0,
  },
  user_modified: {
    type: Date,
    default: null,
  },
  created_at: {
    type: Date,
    required: true,
    default: Date.now(),
    timezone: "Asia/Kolkata",
  },
});

mongoose.model("Users", userSchema);
