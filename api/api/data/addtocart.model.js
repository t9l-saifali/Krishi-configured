var mongoose = require("mongoose");
var Schema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    default: null,
  },
  redeem_point: {
    type: Number,
    default: 0,
  },
  totalCartPrice: {
    type: Number,
    default: 0,
  },
  subscribe: {
    type: Boolean,
    default: false,
  },
  regionID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "regions",
    required: false,
  },

  CartDetail: [
    {
      product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
        require: true,
      },
      unique_id: {
        type: Number,
        require: false,
      },
      productItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
        require: true,
      },
      product_cat_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product_categories",
        required: false,
        default: null,
      },
      product_subCat1_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subCategory1",
        required: false,
        default: null,
      },
      product_categories: {
        type: Array,
        required: false,
        default: null,
      },
      TypeOfProduct: {
        type: String,
        default: null,
      },
      variant_name: {
        type: String,
        default: null,
      },
      // variant: {
      //     type: String,
      //     default: null,
      // },
      itemDiscountPercentage: {
        type: Number,
        default: 0,
      },
      itemDiscountAmount: {
        type: Number,
        default: 0,
      },
      groupData: Array,
      without_package: {
        type: Boolean,
        default: false,
      },
      unitQuantity: {
        type: Number,
        default: null,
      },
      unitMeasurement: {
        type: Object,
        default: null,
      },
      packet_size: {
        type: Number,
        default: null,
      },
      packetLabel: {
        type: String,
        default: null,
      },
      qty: {
        type: Number,
        default: null,
      },
      price: {
        type: Number,
        default: null,
      },
      totalprice: {
        type: Number,
        default: null,
      },
      preOrder: {
        type: Boolean,
        default: false,
      },
      status: {
        type: Boolean,
        default: true,
      },
      createDate: {
        type: Date,
        timezone: "Asia/Kolkata",
        default: Date.now,
      },
    },
  ],

  SubscribeDetail: [
    {
      product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
        require: true,
      },
      productItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
        require: true,
      },
      product_cat_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product_categories",
        required: false,
        default: null,
      },
      product_subCat1_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subCategory1",
        required: false,
        default: null,
      },
      TypeOfProduct: {
        type: String,
        default: null,
      },
      groupData: Array,
      without_package: {
        type: Boolean,
        default: false,
      },
      unitQuantity: {
        type: Number,
        default: null,
      },
      unitMeasurement: {
        type: String,
        default: null,
      },
      packet_size: {
        type: Number,
        default: null,
      },
      packetLabel: {
        type: String,
        default: null,
      },
      qty: {
        type: Number,
        default: null,
      },
      price: {
        type: Number,
        default: null,
      },
      totalprice: {
        type: Number,
        default: null,
      },
      status: {
        type: Boolean,
        default: true,
      },
      createDate: {
        type: Date,
        timezone: "Asia/Kolkata",
        default: Date.now,
      },
    },
  ],
  createDate: {
    type: Date,
    required: false,
    timezone: "Asia/Kolkata",
    // "default" : Date.now
  },
});
mongoose.model("addtocarts", Schema);
