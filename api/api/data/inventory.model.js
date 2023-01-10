var mongoose = require("mongoose");
var autoIncrement = require("mongoose-auto-increment");

// const Decimal = require("Decimal.js");
// const DecimalSchema = require("mongoose-Decimal");

// var configuredSchema = new mongoose.Schema({
// region: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: "regions",
//
// },
//   variant_name: {
//     type: String,
//
//   },
//   costPrice: {
//     type: Number,
//
//   },
//   total_amount: {
//     type: Number,
//
//   },
//   quantity: {
//     type: mongoose.Schema.Types.Decimal128,
//
//     default: 0,
//   },
//   bookingQuantity: {
//     type: mongoose.Schema.Types.Decimal128,
//
//     default: 0,
//   },
//   availQuantity: {
//     type: mongoose.Schema.Types.Decimal128,
//
//     default: 0,
//   },
//   lostQuantity: {
//     type: mongoose.Schema.Types.Decimal128,
//
//     default: 0,
//   },
//   returnQuantity: {
//     type: mongoose.Schema.Types.Decimal128,
//
//     default: 0,
//   },
//   inhouseQuantity: {
//     type: mongoose.Schema.Types.Decimal128,
//
//     default: 0,
//   },
//   ExpirationDate: {
//     type: Date,
//
//   },
// });

// var simpleSchema = new mongoose.Schema({
//   region: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "regions",
//
//   },
//   costPrice: {
//     type: Number,
//
//     default: 0,
//   },
//   total_amount: {
//     type: Number,
//
//     default: 0,
//   },
//   quantity: {
//     type: mongoose.Schema.Types.Decimal128,
//
//     default: 0,
//   },
//   bookingQuantity: {
//     type: mongoose.Schema.Types.Decimal128,
//
//     default: 0,
//   },
//   availQuantity: {
//     type: mongoose.Schema.Types.Decimal128,
//
//     default: 0,
//   },
//   lostQuantity: {
//     type: mongoose.Schema.Types.Decimal128,
//
//     default: 0,
//   },
//   returnQuantity: {
//     type: mongoose.Schema.Types.Decimal128,
//
//     default: 0,
//   },
//   inhouseQuantity: {
//     type: mongoose.Schema.Types.Decimal128,
//
//     default: 0,
//   },
//   ExpirationDate: {
//     type: Date,
//
//   },
// });

var inventorySchema = new mongoose.Schema({
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "admin",
  },
  admin_name: {
    type: String,
    default: null,
  },
  billNo: {
    type: String,
    default: null,
  },
  supplier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "supplier_masters",

    default: null,
  },
  AccountHead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "account_heads",

    default: null,
  },
  Date: {
    type: Date,
  },
  Time: {
    type: String,
  },
  InvoiceNumber: {
    type: String,

    lowercase: true,
  },
  InvoiceDate: {
    type: String,
  },
  InvoiceAmount: {
    type: Number,

    default: 0,
  },
  total_gst: {
    type: Number,

    default: 0,
  },
  AmountWithoutGSTandDelivery: {
    type: Number,

    default: 0,
  },
  InvoiceDueDate: {
    type: String,
  },
  paymentStatus: {
    type: String,
    default: "pending",
  },
  paymentMethod: {
    type: String,
    default: null,
  },
  paymentDate: {
    type: Date,
    default: null,
  },
  note: {
    type: String,
    default: null,
  },
  delivery_charges: {
    type: Number,

    default: 0,
  },
  paymentUpdateByAdminID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "admins",
    default: null,
  },
  inventoryItems: [
    {
      _id: false,
      type: mongoose.Schema.Types.ObjectId,
      ref: "inventory_items",
    },
  ],
  addedByIP: {
    type: String,
    default: "",
  },
  updatedByIP: {
    type: [String],
    default: [],
  },
  status: {
    type: Boolean,
    default: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

inventorySchema.plugin(autoIncrement.plugin, {
  model: "inventory",
  field: "counter",
});
mongoose.model("inventory", inventorySchema);
