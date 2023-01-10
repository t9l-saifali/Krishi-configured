var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    admin_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref:'admin',
        required : false,
    }, 
    desc:{
        type:String,
        required: false,
        default:null

    }, 
    Team:{
        type:String,
        required: false,
        default:null

    }, 
    partners:{
        type:String,
        required: false,
        default:null

    }, 
    Philosophy:{
        type:String,
        required: false,
        default:null

    }, 
    Journey:{
        type:String,
        required: false,
        default:null

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
mongoose.model('abouts',Schema);
