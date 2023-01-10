var mongoose = require('mongoose');
var newsletterSchema = new mongoose.Schema({
    email : {
        type : String,
        trim: true,
        required : false
    },
    created_at : {
        type : Date,
        required : false,
        "default" : Date.now,
    timezone: "Asia/Kolkata"
    }
});
mongoose.model('newsletter',newsletterSchema);
