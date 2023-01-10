var mongoose = require("mongoose");
var couponMasterSchema = new mongoose.Schema({
  couponValue: {
    type: Number,
    required: false,
  },
  name: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  image: {
    type: String,
    required: false,
  },
  start_date: {
    type: Date,
    required: false,
    default: Date.now,
  },
  end_date: {
    type: Date,
    required: false,
    default: Date.now,
  },
  tc: {
    type: String,
    required: false,
  },
  coupon_code: {
    type: String,
    uppercase: true,
    required: false,
  },
  usageLimit: {
    type: Number,
    required: false,
    default: null,
  },
  UserType: {
    type: String,
    required: false,
  },

  discountType: {
    type: String,
    required: false,
  },
  discountAmount: {
    type: Number,
    required: false,
  },
  discountLocation: {
    type: String,
    required: false,
    default: null,
  },
  discountPercentage: {
    type: String,
    required: false,
  },
  discount_upto: {
    type: Number,
    required: false,
  },
  discountProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "products",
    require: false,
    default: null,
  },
  discountProductPackageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "products",
    require: false,
    default: null,
  },
  region: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "regions",
    required: false,
  },
  couponUsed: {
    type: String,
    required: false,
    default: "no",
  },
  couponNoOfUsed: {
    type: Number,
    required: false,
    default: 0,
  },
  ProductCategoryType: {
    type: String,
    required: false,
  },
  productDetail: [
    {
      product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
        require: false,
      },
    },
  ],
  categoryDetail: [
    {
      category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "categories",
        require: false,
      },
    },
  ],
  status: {
    type: Boolean,
    default: true,
  },
  catelogviewstatus: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    required: false,
    default: Date.now,
    timezone: "Asia/Kolkata",
  },
});
mongoose.model("coupon_masters", couponMasterSchema);
