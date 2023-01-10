var mongoose = require('mongoose');
var productSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: false,
    },
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products',
        required: false,
    },
    product_code: {
        type: String,
        required: false
    },
    product_name: {
        type: String,
        required: false,
        lowercase: true
    },
    product_variant_id: {
        type: String,
        required: false
    },
    color: {
        type: String,
        required: false,
    },
    size: {
        type: String,
        required: false,
    },
    qty: {
        type: Number,
        required: false,
    },
    selling_price: {
        type: Number,
        required: false
    },
    discount: {
        type: Number,
        required: false
    },
    tax: {
        type: Number,
        required: false,
    },
    price: {
        type: Number,
        required: false,
    }
});
var orderSchema = new mongoose.Schema({
    order_id: {
        type: String,
        required: false,
    },
    customer_name: {
        type: String,
        required: false,
    },
    mobile_no: {
        type: String,
        required: false,
    },
    email: {
        type: String,
        required: false
    },
    cash_amount: {
        type: String,
        required: false
    },
    card_amount: {
        type: String,
        required: false
    },
    card_approval_no: {
        type: String,
        required: false
    },
    card_type: {
        type: String,
        required: false
    },
    card_holder_name: {
        type: String,
        required: false
    },
    gift_amount: {
        type: String,
        required: false
    },
    gift_voucher_no: {
        type: String,
        required: false
    },
    total_amount: {
        type: Number,
        required: false
    },
    tax: {
        type: Number,
        required: false
    },
    payment_amount: {
        type: Number,
        required: false
    },
    products: [productSchema],
    status: {
        type: String,
        default: true
    },
    created_at: {
        type: Date,
        required: false,
        "default": Date.now,
    timezone: "Asia/Kolkata"
    }
});
mongoose.model('orders', orderSchema);
