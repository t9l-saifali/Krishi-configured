var mongoose = require('mongoose');


var CollectionSchema = new mongoose.Schema({
    parentCat_id:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'variant_categories'
    },
    name : {
        type : String,
        required : false,
        lowercase: true,
        unique: true
    },
    item : [{
      item_name : {
            type:String
        },
      item_status : {
            type:Boolean,
            default:true
        }
    }],
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
mongoose.model('variants',CollectionSchema);
