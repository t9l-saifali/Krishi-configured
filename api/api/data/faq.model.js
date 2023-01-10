var mongoose = require('mongoose');
var Schema = new mongoose.Schema({
    
    question : {
        type : String,
        required : false,
        lowercase: true,
        unique: true
    },
    answer : {
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
    timezone: "Asia/Kolkata"
    }
});
mongoose.model('faqs',Schema);
