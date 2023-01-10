var mongoose = require("mongoose");
var categorySchema = new mongoose.Schema({
    // products: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "products",
    // },
    category_name: {
        type: String,
        required: false,
    },
    slug: { type: String, index: true },
    priority: {
        type: Number,
        default: 0,
        required: false,
    },
    level: {
        type: Number,
        default: 0,
        required: false,
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "categories",
    },
    ancestors: [
        {
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                index: true,
            },
            category_name: String,
            slug: String,
        },
    ],
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
    // productAdded: {
    //     type: Boolean,
    //     required: false,
    // },
    status: {
        type: Boolean,
        default: true,
    },
    created_at: {
        type: Date,
        required: false,
        default: Date.now,
        timezone: "Asia/Kolkata",
    },
});

mongoose.model("categories", categorySchema);
