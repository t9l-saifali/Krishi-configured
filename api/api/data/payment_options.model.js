var mongoose = require("mongoose");
var ApiKeySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  keys: {
    type: Object,
    default: {},
  },
  staging: {
    type: Boolean,
    default: true,
  },
  staging_txn_url: {
    type: String,
    default: "",
  },
  production_txn_url: {
    type: String,
    default: "",
  },
  adminStatus: {
    type: Boolean,
    default: true,
  },
  frontendStatus: {
    type: Boolean,
    default: true,
  },
  created_at: {
    type: Date,
    required: false,
    default: Date.now,
  },
});
mongoose.model("payment_options", ApiKeySchema);
