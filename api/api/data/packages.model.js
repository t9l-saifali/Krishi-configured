var mongoose = require("mongoose");

var packageSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      required: false,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "products",
      default: null,
    },
    region: {
      type: String,
      default: null,
    },
    barcode:{
      type: String,
      default: null,
    },
    packet_size: {
      type: Number,
      required: false,
      default: 0,
    },
    packetLabel: {
      type: String,
      required: false,
    },
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
    packetmrp: {
      type: Number,
      required: false,
      default: 0,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { strictPopulate: false }
);

mongoose.model("packages", packageSchema);
