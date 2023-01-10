var mongoose = require("mongoose");
var ApiKeySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  keys: {
    type: Object,
  },
  status: {
    type: Boolean,
    default: true,
  },
  created_at: {
    type: Date,
    required: false,
    default: Date.now,
  },
});
mongoose.model("sms_gateways", ApiKeySchema);
