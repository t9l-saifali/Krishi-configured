var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    admin_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref:'admin',
        required : false,
    }, 
    desc:{
        type:String,
        required: false

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
mongoose.model('tcs',Schema);
