var mongoose = require("mongoose");
var feedbackSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false,
        lowercase: true,
    },
    attachment: {
        type: String,
        required: false,
    },
    email: {
        type: String,
        default: true,
    },
    mobile: {
        type: String,
        required: false,
    },
    city: {
        type: String,
        default: true,
    },
    feedback: {
        type: String,
        required: false,
    },
    booking_id: {
        type: String,
        default: null,
    },
    created_at: {
        type: Date,
        required: false,
        default: Date.now,
    timezone: "Asia/Kolkata"
    },
});
mongoose.model("feedback", feedbackSchema);
