var mongoose = require('mongoose');
var LedgerSchema = new mongoose.Schema({
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
    ledger_type : {
        type : String,
        required : false,
    },
    transaction_type : {
        type : String,
        required : false
    },
    cash_recd : {
        type : Number,
        required : false
    },
    cash_paid : {
        type : Number,
        required : false
    },
    transaction_details : {
        type : String,
        required : false
    },
    created_at : {
        type : Date,
        required : false,
        "default" : Date.now,
    timezone: "Asia/Kolkata"
    }
    
});
mongoose.model('ledgers',LedgerSchema);
