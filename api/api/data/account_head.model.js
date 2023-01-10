var mongoose = require('mongoose');
var CategorySchema = new mongoose.Schema({
    
    name : {
        type : String,
        required : false,
        lowercase: true
    },
    status : {
        type:Boolean,
        default:true
    },
    created_at : {
        type : Date,
        required : false,
        "default" : Date.now,
        timezone: "Asia/Kolkata",
    }
});
mongoose.model('account_heads',CategorySchema);
