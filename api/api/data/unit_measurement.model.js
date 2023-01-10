var mongoose = require('mongoose');
var CategorySchema = new mongoose.Schema({
    
    name : {
        type : String,
        required : false,
        lowercase: true
    },
    availability:{
        type: String,
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
mongoose.model('unit_measurements',CategorySchema);
