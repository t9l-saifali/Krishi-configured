var mongoose = require('mongoose');
var counters = new mongoose.Schema({
    _id : {
        type : String,
        default:'orderid',
        required : false,
        lowercase: true
    },
    sequence_value : {
        type:Number,
        default:0
    },
    created_at : {
        type : Date,
        required : false,
        "default" : Date.now,
    timezone: "Asia/Kolkata"
    }
});
mongoose.model('counters',counters);
