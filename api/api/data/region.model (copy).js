var mongoose = require('mongoose');


var CollectionSchema = new mongoose.Schema({
    name : {
        type : String,
        required : false,
        lowercase: true
    },
    // item : [{
    //   district : {
    //         type:String
    //     },
    //   item_status : {
    //         type:String,
    //         default:true
    //     }
    // }],
    regionData : {
        type : Array,
        required : false
    },
    status : {
        type:Boolean,
        default:true
    },
    created_at : {
        type : Date,
        required : false,
        "default" : Date.now
    }
});
mongoose.model('regions',CollectionSchema);
