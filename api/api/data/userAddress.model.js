var mongoose = require('mongoose');

var UserAddressSchema = new mongoose.Schema({
    user_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref:'Users',
        required : false,
    },
    houseNo : {
        type:String,
        default:null
    },
    street : {
        type:String,
        default:null
    },
    locality : {
        type:String,
        default:null
    },
    city : {
        type:String,
        default:null
    },
    pincode : {
        type : Number,
        default : null
    },
    district : {
        type:String,
        default:null
    },
    state : {
        type:String,
        default:null
    },
    country : {
        type:String,
        default:null
    },
    locationTag: {
        type: String,
        default: null,
    },
    latitude:{
        type : Number,
        default : null
    },
    longitude:{
        type : Number,
        default : null
    },
    created_at : {
        type : Date,
        required : false,
        "default" : Date.now,
    timezone: "Asia/Kolkata"
    }
});
mongoose.model('UserAddress', UserAddressSchema);
