var mongoose = require("mongoose");
var GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
    lowercase: true,
    unique: true,
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
mongoose.model("attribute_groups", GroupSchema);
