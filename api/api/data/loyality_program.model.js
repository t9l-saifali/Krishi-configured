var mongoose = require('mongoose');
var CategorySchema = new mongoose.Schema({
    adminID : {
        type : mongoose.Schema.Types.ObjectId,
        ref:'admin',
        required : false,
        default:null
    },
    level : {
        type : Number,
        required : false,
        default: 0
    },
    name : {
        type : String,
        required : false,
        lowercase: true
    },
    startOrderNo : {
        type : Number,
        required : false,
    },
    endOrderNo : {
        type : Number,
        required : false,
    },
    accumulation : {
        type : Number,
        required : false,
        default: 0
    },
    redeem : {
        type : Number,
        required : false,
        default: 0
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
mongoose.model('loyality_programs',CategorySchema);
