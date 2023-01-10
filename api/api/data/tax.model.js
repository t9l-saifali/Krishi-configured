var mongoose = require('mongoose');


var CollectionSchema = new mongoose.Schema({
    name : {
        type : String,
        required : false,
        lowercase: true
    },
    taxData :  [{                
        tax_name: {
            type: String,
            required : false
        },
        tax_percent: {
            type: Number,
            required : false,
            default:0
        },
    }],
    totalTax : {
        type : String,
        required : false
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
mongoose.model('taxs',CollectionSchema);
