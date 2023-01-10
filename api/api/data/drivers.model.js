var mongoose = require('mongoose');
var CategorySchema = new mongoose.Schema({
    
    name : {
        type : String,
        required : false,
        lowercase: true
    },
    email : {
        type : String,
        required : false,
        lowercase: true
    },
    mobile : {
        type : Number,
        required : false,
    },
    address : {
        type : String,
        required : false,
    },
    status : {
        type:Boolean,
        default:true
    },
    created_at : {
        type : Date,
        required : false,
        "default" : Date.now,
        timezone: 'Asia/Calcutta'
    }
});
mongoose.model('drivers',CategorySchema);
