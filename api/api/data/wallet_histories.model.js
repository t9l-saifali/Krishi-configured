var mongoose = require("mongoose");
var WalletSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        require: true,
    },
    amount: {
        type: Number,
        required: true,
        default: 0,
    },
    paymentStatus: {
        type: String,
        required: true,
        enum: ["failed", "Complete"],
    },
    type: {
        type: String,
        required: true,
        enum: ["debit", "credit"],
    },

    debitType: {
        type: String,
        required: false,
        enum: ["order", "subscription"],
    },
    orderID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "bookings",
        require: false,
        default: null,
    },
    booking_code: {
        type: String,
        required: false,
        default: null,
    },
    subscription_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subscriptions",
        require: false,
        default: null,
    },
    SubscriptionID: {
        type: String,
        required: false,
        default: null,
    },

    // paytm response
    TXNID: {
        type: String,
        default: null,
    },
    TXNAMOUNT: {
        type: String,
        default: null,
    },
    PAYMENTMODE: {
        type: String,
        default: null,
    },
    CURRENCY: {
        type: String,
        default: null,
    },
    TXNDATE: {
        type: String,
        default: null,
    },
    STATUS: {
        type: String,
        default: null,
    },
    RESPCODE: {
        type: String,
        default: null,
    },
    RESPMSG: {
        type: String,
        default: null,
    },
    GATEWAYNAME: {
        type: String,
        default: null,
    },
    BANKTXNID: {
        type: String,
        default: null,
    },
    BANKNAME: {
        type: String,
        default: null,
    },
    CHECKSUMHASH: {
        type: String,
        default: null,
    },
    razorpay_orderid: {
        type: String,
        default: null,
    },

    created_at: {
        type: Date,
        required: false,
        default: Date.now,
    timezone: "Asia/Kolkata"
    },
});
mongoose.model("wallet_histories", WalletSchema);
