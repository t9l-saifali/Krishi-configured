var mongoose = require("mongoose");
var Schema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: {
      address: {
        type: String,
        trim: true,
        lowercase: true,
        default: null,
      },
      country: {
        type: String,
        trim: true,
        lowercase: true,
        default: null,
      },
      state: {
        type: String,
        trim: true,
        lowercase: true,
        default: null,
      },
      state_code: {
        type: Number,
        default: null,
      },
      city: {
        type: String,
        trim: true,
        lowercase: true,
        default: null,
      },
      pincode: {
        type: String,
        trim: true,
        lowercase: true,
        default: null,
      },
      locality: {
        type: String,
        trim: true,
        lowercase: true,
        default: null,
      },
      latitude: {
        type: String,
        trim: true,
        lowercase: true,
        default: null,
      },
      longitude: {
        type: String,
        trim: true,
        lowercase: true,
        default: null,
      },
    },
    required: true,
  },
  isDefault: {
    type: Boolean,
    required: true,
  },
  FSSAI_NO: {
    type: String,
  },
  GSTIN_UIN: {
    type: String,
  },
  email: {
    type: String,
  },
  logo: {
    type: String,
    default: null,
  },
  consumer_number: {
    type: String,
    default: null,
  },
  hospitality_number: {
    type: String,
    default: null,
  },
});

mongoose.model("companies", Schema);
