var mongoose = require('mongoose');
var roleSchema = new mongoose.Schema({
    role_name: {
        type: String,
        required: false,
        lowercase: true
    },
    modules: {
        type: Array,
        default: true
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
mongoose.model('role', roleSchema);
