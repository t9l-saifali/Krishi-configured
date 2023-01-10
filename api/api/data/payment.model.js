var mongoose = require('mongoose');
var PaymentSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: false,
    },
    // order_id: {
    //     type : mongoose.Schema.Types.ObjectId,
    //     ref:'orders',
    //     required : false,
    // },
    order_id: {
        type: String,
        required: false
    },
    name: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: false
    },
    contactNumber: {
        type: String,
        required: false
    },
    amount: {
        type: String,
        required: false,
    },

    houseNo: {
        type: String,
        required: false
    },
    street: {
        type: String,
        required: false
    },
    city: {
        type: String,
        required: false
    },
    pincode: {
        type: Number,
        required: false
    },
    district: {
        type: String,
        required: false
    },
    state: {
        type: String,
        required: false
    },
    country: {
        type: String,
        required: false
    },
    payment_type: {
        type: String,
        required: false,
    },
    delivery_time: {
        type: String,
        required: false,
    },
    delivery_date: {
        type: String,
        required: false,
    },
    payment_status: {
        type: String,
        required: false,
    },
    payment_items: {
        type: Array,
        required: false,
    },
    orderType: {
        type: String,
        required: false,
    },
    created_at: {
        type: Date,
        required: false,
        default: Date.now
    }
});
mongoose.model('Payment', PaymentSchema);