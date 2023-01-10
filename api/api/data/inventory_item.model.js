var mongoose = require("mongoose");

var inventoryItemSchema = new mongoose.Schema({
  inventory_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "inventories",
    default: null,
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "products",
    default: null,
  },
  product_name: {
    type: String,
    default: null,
  },
  TypeOfProduct: {
    type: String,
  },
  product_measurment: {
    type: String,
  },
  region: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "regions",
  },
  variant_name: {
    type: String,
    default: null,
  },

  productQuantity: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0,
  },
  bookingQuantity: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0,
  },
  availableQuantity: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0,
  },
  lostQuantity: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0,
  },
  returnQuantity: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0,
  },
  inhouseQuantity: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0,
  },

  product_costPrice: {
    type: Number,
    default: null,
  },
  gst_percentage: {
    type: Number,
    default: null,
  },
  gst: {
    type: Number,
    default: null,
  },
  singlepricewithoutgst: {
    type: Number,
    default: null,
  },
  invoice_without_gst: {
    type: Number,
    default: null,
  },
  itemTotalPrice: {
    type: Number,
    default: null,
  },

  product_expiry: {
    type: Date,
    default: null,
  },
  batchID: {
    type: Number,
    required: 0,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  configurableData:[
    {
      variant_name: {
        type: String,
        default: null,
      },
      productQuantity: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0,
      },
      bookingQuantity: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0,
      },
      availableQuantity: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0,
      },
      lostQuantity: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0,
      },
      returnQuantity: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0,
      },
      inhouseQuantity: {
        type: mongoose.Schema.Types.Decimal128,
        default: 0,
      },
    }
  ]
});

mongoose.model("inventory_items", inventoryItemSchema);
