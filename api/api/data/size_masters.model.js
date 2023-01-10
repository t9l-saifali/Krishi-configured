var mongoose = require('mongoose');
var sizeMasterSchema = new mongoose.Schema({
    name : {
        type : String,
        required : false,
        lowercase: true
    },
    status : {
        type:String,
        default:true
    },
    created_at : {
        type : Date,
        required : false,
        "default" : Date.now
    }
});
mongoose.model('size_masters',sizeMasterSchema);
