var mongoose = require("mongoose");
var productCategorySchema = new mongoose.Schema({
    products: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
    },
    level: {
        type: String,
        required: false,
    },
    category_name: {
        type: String,
        required: false,
        trim: true,
    },
    priority: {
        type: Number,
        required: false,
    },
    regions: [{ type: mongoose.Schema.Types.ObjectId, ref: "regions" }],
    banner: {
        type: String,
        required: false,
    },
    icon: {
        type: String,
        required: false,
    },
    category_code: {
        type: String,
        required: false,
    },
    // tex_percent : {
    //     type : Number,
    //     required : false
    // },
    meta_title: {
        type: String,
        required: false,
    },
    meta_keyword: {
        type: String,
        required: false,
    },
    meta_desc: {
        type: String,
        required: false,
    },
    productAdded: {
        type: Boolean,
        required: false,
    },
    status: {
        type: Boolean,
        default: true,
    },
    created_at: {
        type: Date,
        required: false,
        default: Date.now,
    timezone: "Asia/Kolkata"
    },
});
mongoose.model("product_categories", productCategorySchema);
