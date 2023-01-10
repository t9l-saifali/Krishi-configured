var mongoose = require("mongoose");

var CollectionSchema = new mongoose.Schema({
    Pincode: String,    
    Region_ID : {
        type : mongoose.Schema.Types.ObjectId,
        ref:'regions',
        required : false,
        default:null
    }, 
    Message: String,
    Delivery_Charges: {type: Number, default: 0 },
    Free_Shipping: {type: String, lowercase: true, trim: true},
    Free_Shipping_amount: {
        type: Number,
        default: 0,
    }, 
    COD: {type: String, lowercase: true, trim: true},
    COD_Charges: {
        type: Number,
        default: 0,
    },
    MOQ: {type: String, lowercase: true, trim: true},
    MOQ_Charges: {
        type: Number,
        default: 0,
    },
    Farm_pick_up : {type: String, lowercase: true, trim: true}, 
    Farm_pick_up_delivery_charges: {
        type: Number,
        default: 0,
    }, 
    Same_day_delivery_till_2pm: {type: String, lowercase: true, trim: true},
    Same_day_delivery_till_2pm_charges: {
        type: Number,
        default: 0,
    }, 
    Next_day_delivery_Standard_9am_9pm: {type: String, lowercase: true, trim: true},
    Next_day_delivery_Standard_9am_9pm_charges: {
        type: Number,
        default: 0,
    }, 
    Next_day_delivery_8am_2pm: {type: String, lowercase: true, trim: true},
    Next_day_delivery_8am_2pm_charges: {
        type: Number,
        default: 0,
    }, 
    Next_day_delivery_2pm_8pm: {type: String, lowercase: true, trim: true},
    Next_day_delivery_2pm_8pm_charges: {
        type: Number,
        default: 0,
    }, 
    Standard_delivery: {type: String, lowercase: true, trim: true},
    Standard_delivery_charges: {
        type: Number,
        default: 0,
    }, 
    status: {type: String, lowercase: true, default: 'active'},
    created_at: {
        type: Date,
        required: false,
        default: Date.now,
    timezone: "Asia/Kolkata"
    },
});
mongoose.model("pincodes", CollectionSchema);
