 var mongoose = require('mongoose');
var reportSummarySchema = new mongoose.Schema({
    user_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref:'Users',
        default : null,
    },
    stock_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref:'stock_masters',
        default : null,
    },
    product_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref:'products',
        default : null,
    },
    order_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref:'orders',
        default : null,
    },
    report_type : {
        type : String,
        required : false,
    },
    created_at : {
        type : Date,
        required : false,
        "default" : Date.now,
    timezone: "Asia/Kolkata"
    }
    
});
mongoose.model('report_summary',reportSummarySchema);
