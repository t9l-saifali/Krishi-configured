var mongoose = require("mongoose");

var Schema = new mongoose.Schema({
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "admin",
    required: false,
  },
  admin_name: {
    type: String,
    required: false,
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "products",
    required: false,
    default: null,
  },
  regionID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "regions",
    required: false,
  },
  product_name: {
    type: String,
    required: false,
  },
  voucherType: {
    type: String,
    required: false,
  },
  TotalQuantity: {
    type: Number,
    required: false,
    default: 0,
  },
  unitMeasurement: {
    type: String,
    required: false,
    default: "",
  },
  variant_name: {
    type: String,
    required: false,
    default: "",
  },
  TypeOfProduct: {
    type: String,
    required: false,
  },
  note: {
    type: String,
    required: false,
  },
  status: {
    type: Boolean,
    default: true,
  },
  created_at: {
    type: Date,
    required: false,
    default: Date.now,
    timezone: "Asia/Kolkata",
  },
});
mongoose.model("voucherInventory", Schema);
