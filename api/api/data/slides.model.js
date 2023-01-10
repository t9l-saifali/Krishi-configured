var mongoose = require('mongoose');
const moment = require('moment-timezone');
const dateThailand = moment.tz(Date.now(), "America/Los_Angeles");

var slidesSchema = new mongoose.Schema({
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
        type: Boolean,
        default:true
    },
    rank : {
        type: Number,
        default:true
    },
    created_at : {
        type: Date, default: dateThailand
    }
});
mongoose.model('slides',slidesSchema);
