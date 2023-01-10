var mongoose = require("mongoose");
var CategorySchema = new mongoose.Schema({
  adminID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "admin",
    required: false,
    default: null,
  },
  orderID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "bookings",
    require: false,
    default: null,
  },
  booking_code: {
    type: String,
    required: false,
    default: null,
  },
  subscriptionID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "subscriptions",
    require: false,
    default: null,
  },
  subscription_code: {
    type: String,
    required: false,
    default: null,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    require: true,
  },
  loyalityName: {
    type: String,
    required: false,
    lowercase: true,
  },
  loyalityPercentage: {
    type: Number,
    required: false,
    default: 0,
  },
  TotalAmount: {
    type: Number,
    required: false,
    default: 0,
  },
  point: {
    type: Number,
    required: false,
    default: 0,
  },
  reason: {
    type: String,
    required: false,
    default: null,
  },
  pointStatus: {
    type: String,
    required: false,
    default: null,
  },
  status: {
    type: Boolean,
    default: true,
  },
  created_at: {
    type: Date,
    required: false,
    default: Date.now,
    timezone: "Asia/Kolkata"
  },
});
mongoose.model("loyality_program_histories", CategorySchema);
