var mongoose = require("mongoose");

var CollectionSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "attribute_groups",
  },
  name: {
    type: String,
    required: false,
    lowercase: true,
    // unique: true,
  },
  item: [
    {
      item_name: String,
      item_status: Boolean,
      _id: false,
    },
  ],
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
mongoose.model("attributes", CollectionSchema);
