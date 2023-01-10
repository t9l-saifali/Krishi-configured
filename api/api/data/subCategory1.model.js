var mongoose = require("mongoose");
var SubCategory1Schema = new mongoose.Schema({
    level: {
        type: String,
        required: false,
    },
    parentCat_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product_categories",
    },
    category_name: {
        type: String,
        required: false,
        lowercase: true,
    },
    priority: {
        type: Number,
        required: false,
    },
    regions: [{ type: mongoose.Schema.Types.ObjectId, ref: "regions" }],
    parent: {
        type: String,
        required: false,
    },
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
    tex_percent: {
        type: Number,
        required: false,
    },
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
    },
});
mongoose.model("subCategory1", SubCategory1Schema);
