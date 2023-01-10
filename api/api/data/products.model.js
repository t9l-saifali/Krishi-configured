var mongoose = require("mongoose");
var subReferencesPopulate = require("mongoose-sub-references-populate");

// const Decimal = require("Decimal.js");
// const Number = require("mongoose-Decimal");

var VariantSchema = new mongoose.Schema(
  {
    _id: false,

    region: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "regions",
      required: true,
    },

    variant_name: {
      type: String,
      required: true,
    },
    attributes: [
      {
        _id: false,
        attributeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "attributes",
          required: false,
        },
        attributeName: {
          type: String,
          required: false,
        },
        attributeValue: {
          type: String,
          required: false,
        },
      },
    ],

    selling_price: {
      type: Number,
      required: false,
      default: 0,
    },
    B2B_price: {
      type: Number,
      required: false,
      default: 0,
    },
    Retail_price: {
      type: Number,
      required: false,
      default: 0,
    },
    mrp: {
      type: Number,
      required: false,
      default: 0,
    },

    variantSKUcode: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: false,
    },
    ExpirationDate: {
      type: Date,
      required: false,
      default: null,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { strictPopulate: false }
);

var simpleSchema = new mongoose.Schema(
  {
    region: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "regions",
      required: false,
    },
    package: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "packages",
      },
    ],
    ExpirationDate: {
      type: Date,
      required: false,
      default: null,
    },
  },
  { strictPopulate: false }
);

var groupSchema = new mongoose.Schema(
  {
    name: String,
    minqty: Number,
    maxqty: Number,
    sets: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "products",
        },
        setminqty: Number,
        setmaxqty: Number,
        package: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "packages",
        },
        preset: Number,
        priority: {
          type: Number,
          default: Infinity,
        },
      },
    ],
  },
  { strictPopulate: false }
);

var productSchema = new mongoose.Schema(
  {
    barcode: {
      type: [String],
      default: [],
    },
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admin",
      required: false,
    },
    product_categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "categories",
      },
    ],
    product_subCat1_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "subCategory1",
      required: false,
      default: null,
    },
    product_cat_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product_categories",
      required: false,
      default: null,
    },
    base_price: {
      type: Number,
      required: false,
      default: 0,
    },
    group_mrp: {
      type: Number,
      required: false,
      default: 0,
    },
    product_name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
    },
    longDesc: {
      type: String,
      required: false,
    },
    shortDesc: {
      type: String,
      required: false,
    },
    images: {
      type: Array,
      required: false,
    },
    attachment: {
      type: String,
      required: false,
    },
    banner: {
      type: String,
      required: false,
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
    priority_obj: [
      {
        category: {
          type: String,
        },
        priority: {
          type: String,
        },
      },
    ],
    relatedRecipes: [
      {
        blog_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "blogs",
          required: false,
        },
      },
    ],
    productThreshold: {
      type: Number,
      required: false,
    },
    productSubscription: {
      type: String,
      required: false,
    },
    preOrderQty: {
      type: Number,
      default: 0,
    },
    preOrderBookQty: {
      type: Number,
      default: 0,
    },
    preOrderRemainQty: {
      type: Number,
      default: 0,
    },
    preOrder: {
      type: Boolean,
      //required: false,
      default: false,
    },
    preOrderStartDate: {
      type: Date,
      required: false,
      default: null,
    },
    preOrderEndDate: {
      type: Date,
      required: false,
      default: null,
    },
    ProductRegion: [
      {
        region_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "regions",
          required: false,
        },
      },
    ],
    salesTaxOutSide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "taxs",
      required: false,
    },
    salesTaxWithIn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "taxs",
      required: false,
    },
    purchaseTax: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "taxs",
      required: false,
    },
    hsnCode: {
      type: String,
      required: false,
    },
    SKUCode: {
      type: String,
      required: false,
    },
    unitMeasurement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "unit_measurements",
      required: false,
    },
    unitQuantity: {
      type: Number,
      required: false,
      default: 1,
    },
    TypeOfProduct: {
      type: String,
      required: false,
    },
    productExpiryDay: {
      type: Number,
      default: 0,
    },
    batchID: {
      type: Number,
      required: false,
      default: 0,
    },
    attribute_group: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    configurableData: [VariantSchema],
    simpleData: [simpleSchema],
    groupData: [groupSchema],
    // groupRegions: [{ type: mongoose.Schema.Types.ObjectId, ref: "regions" }],

    sameDayDelivery: {
      type: Boolean,
      default: true,
    },
    farmPickup: {
      type: Boolean,
      default: true,
    },
    youtube_link: {
      type: String,
      default: null,
    },

    priority: {
      type: Number,
      default: Infinity,
    },
    status: {
      type: Boolean,
      default: true,
    },
    showstatus: {
      type: Boolean,
      default: true,
    },
    created_at: {
      type: Date,
      required: false,
      default: Date.now,
      timezone: "Asia/Kolkata",
    },
  },
  { strictPopulate: false }
);

productSchema.plugin(subReferencesPopulate);
mongoose.model("products", productSchema);
