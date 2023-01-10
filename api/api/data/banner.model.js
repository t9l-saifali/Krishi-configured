var mongoose = require('mongoose');
var bannerSchema = new mongoose.Schema({
    image : {
        type : String,
        required : false
    },
    banner : {
        type : String,
        required : false
    },
    icon : {
        type : String,
        required : false
    },
    link : {
        type:String,
        default:true
    },
    status : {
        type:String,
        default:true
    },
    created_at : {
        type : Date,
        required : false,
        "default" : Date.now,
    timezone: "Asia/Kolkata",
    }
});
mongoose.model('banner',bannerSchema);
