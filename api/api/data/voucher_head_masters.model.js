var mongoose = require('mongoose');
var voucherHeadMasterSchema = new mongoose.Schema({
    name : {
        type : String,
        required : false,
        lowercase: true
    },
    type : {
        type : String,
        required : false
    },
    status : {
        type:String,
        default:true
    },
    created_at : {
        type : Date,
        required : false,
        "default" : Date.now,
    timezone: "Asia/Kolkata"
    }
});
mongoose.model('voucher_head_masters',voucherHeadMasterSchema);
