var mongoose = require("mongoose");
var CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: false,
        lowercase: true,
    },
    slug: {
        type: String,
        required: true,
        lowercase: true,
      },
    status: {
        type: Boolean,
        default: true,
    },
    banner: {
        type: String,
        default: null,
    },
    created_at: {
        type: Date,
        required: false,
        default: Date.now,
    timezone: "Asia/Kolkata",
    },
});
mongoose.model("blog_categories", CategorySchema);
