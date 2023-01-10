var mongoose = require("mongoose");
var blogSchema = new mongoose.Schema({
  parentCat_id: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "blog_categories",
    },
  ],
  title: {
    type: String,
    default: true,
    lowercase: true,
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
  },
  noOfServe: {
    type: Number,
    required: false,
    default: null,
  },
  prepTime: {
    type: String,
    required: false,
    default: null,
  },
  chefName: {
    type: String,
    required: false,
    default: null,
  },
  recipeIcon: {
    type: String,
    required: false,
    default: null,
  },
  images: {
    type: Array,
    required: false,
    default: null,
  },
  banner: {
    type: String,
    required: false,
    default: null,
  },
  videoUrl: {
    type: String,
    required: false,
    default: null,
  },
  mediaLink: {
    type: String,
    required: false,
    default: null,
  },
  date: {
    type: Date,
    required: false,
    default: null,
  },
  description1: {
    type: String,
    required: false,
    default: null,
  },
  description2: {
    type: String,
    required: false,
    default: null,
  },
  description3: {
    type: String,
    required: false,
    default: null,
  },
  description4: {
    type: String,
    required: false,
    default: null,
  },
  relatedProduct: [
    {
      product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
        required: false,
      },
    },
  ],
  attachment: {
    type: String,
    required: false,
    default: null,
  },
  meta_title: {
    type: String,
    required: false,
    default: null,
  },
  meta_keyword: {
    type: String,
    required: false,
    default: null,
  },
  meta_desc: {
    type: String,
    required: false,
    default: null,
  },
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
mongoose.model("blogs", blogSchema);
