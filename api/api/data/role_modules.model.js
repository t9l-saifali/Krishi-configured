var mongoose = require('mongoose');
var role_modulesSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false,
        lowercase: true
    },
    status: {
        type: Boolean,
        default: true
    },
    created_at: {
        type: Date,
        required: false,
        "default": Date.now,
    timezone: "Asia/Kolkata"
    }
});
mongoose.model('role_modules', role_modulesSchema);
