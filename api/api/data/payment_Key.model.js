var mongoose = require("mongoose");
var ApiKeySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  url: {
    type: String,
  },
  stage: {
    type: String,
  },
  keyid: {
    type: String,
    required: false,
  },
  secretid: {
    type: String,
    required: false,
  },
  clientid: {
    type: String,
    required: false,
  },
  secretcode: {
    type: String,
    required: false,
  },
  merchantid: {
    type: String,
    required: false,
  },
  key: {
    type: String,
    required: false,
  },
  website:{
    type:String,
    required:false
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
mongoose.model("payment_keys", ApiKeySchema);
