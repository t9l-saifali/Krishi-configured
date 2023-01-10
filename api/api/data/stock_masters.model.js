var mongoose = require('mongoose');
var stockMasterSchema = new mongoose.Schema({
    user_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref:'users',
        required : false,
    },
    time : {
        type : String,
        required : false,
    },
    voucher_no : {
        type : String,
        required : false,
        
    },
    voucher_date : {
        type : Date,
        required : false,
        "default" : Date.now
    },
    account : {
        type : String,
        required : false
    },
    invoice_slip_no : {
        type : String,
        required : false
    },
    invoice_date : {
        type : Date,
        required : false,
        "default" : Date.now
    },
    total_qty : {
        type : Number,
        required : false
    },
    available_qty : {
        type : Number,
        required : false
    },
    invoice_amount : {
        type : String,
        required : false
    },
    payment_due_date : {
        type : Date,
        required : false,
        "default" : Date.now
    },
    party_name : {
        type : String,
        required : false
    },
    shipping_courier : {
        type : String,
        required : false
    },
    cash_amount : {
        type : String,
        required : false
    },
    card_amount : {
        type : String,
        required : false
    },
    card_approval_no : {
        type : String,
        required : false
    },
    card_type : {
        type : String,
        required : false
    },
    card_holder_name : {
        type : String,
        required : false
    },
    gift_amount : {
        type : String,
        required : false
    },
    gift_voucher_no : {
        type : String,
        required : false
    },
    cheque_amount : {
        type : String,
        required : false
    },
    cheque_no : {
        type : String,
        required : false
    },
    cheque_date : {
        type : Date,
        required : false,
        "default" : Date.now
    },
    cheque_bank : {
        type : String,
        required : false
    },
    stock_date : {
        type : Date,
        required : false,
        "default" : Date.now
    },
    stock_approval_status : {
        type : String,
        required:false,
        "default" : 'pending'
    },
    stock_approval_date : {
        type : Date,
        required : false,
        "default" : Date.now
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
mongoose.model('stock_masters',stockMasterSchema);
