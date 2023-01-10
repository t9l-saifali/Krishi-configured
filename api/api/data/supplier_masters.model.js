var mongoose = require('mongoose');
var supplierMasterSchema = new mongoose.Schema({
    name : {
        type : String,
        required : false,
        lowercase: true
    },
    company_name : {
        type : String,
        required : false
    },
    email : {
        type : String,
        required : false
    },
    phone : {
        type : Number,
        required : false
    },
    gst_no : {
        type : String,
        required : false
    },
    paymentTerm: {
        type : Number,
        required : false
    },
    returnPolicy: {
        type : String,
        required : false
    },
    address : {
        type : String,
        required : false
    },
    attachment: {
        type: String,
        required : false,
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
    timezone: "Asia/Kolkata"
    }
});
mongoose.model('supplier_masters',supplierMasterSchema);
