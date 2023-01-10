var mongoose = require("mongoose");

var objSchema = new mongoose.Schema({
  _id: false,
  admin_roles: {
    type: [mongoose.Schema.Types.ObjectId],
    default: [],
  },
  admin_email: {
    type: Number,
    default: 0,
  },
  user_email: {
    type: Number,
    default: 0,
  },
  sms: {
    type: Number,
    default: 0,
  },
});

let defaultObj = {
  admin_roles: [],
  admin_email: 0,
  user_email: 0,
  sms: 0,
};

var schema1 = new mongoose.Schema({
  order_placed: {
    type: objSchema,
    default: defaultObj,
  },
  subscription_placed: {
    type: objSchema,
    default: defaultObj,
  },

  feedback: {
    type: objSchema,
    default: defaultObj,
  },
  inventory_add: {
    type: objSchema,
    default: defaultObj,
  },
  inventory_edit: {
    type: objSchema,
    default: defaultObj,
  },
  loyalty_added: {
    type: objSchema,
    default: defaultObj,
  },
  loyalty_expiration: {
    type: objSchema,
    default: defaultObj,
  },
  threshold: {
    type: objSchema,
    default: defaultObj,
  },
  out_of_stock: {
    type: objSchema,
    default: defaultObj,
  },
  product_expiration: {
    type: objSchema,
    default: defaultObj,
  },
  referral_benefit: {
    type: objSchema,
    default: defaultObj,
  },
  order_accepted: {
    type: objSchema,
    default: defaultObj,
  },
  order_rejected: {
    type: objSchema,
    default: defaultObj,
  },
  order_out_for_delivery: {
    type: objSchema,
    default: defaultObj,
  },
  order_out_for_delivery_email_to_driver: {
    type: Boolean,
    default: false,
  },
  order_out_for_delivery_sms_to_driver: {
    type: Boolean,
    default: false,
  },
  supplier_inventory_add: {
    type: Boolean,
    default: false,
  },
  supplier_inventory_update: {
    type: Boolean,
    default: false,
  },
  order_delivered: {
    type: objSchema,
    default: defaultObj,
  },
  order_failed: {
    type: objSchema,
    default: defaultObj,
  },
  wallet_add: {
    type: objSchema,
    default: defaultObj,
  },
  subscription_accepted: {
    type: objSchema,
    default: defaultObj,
  },
  subscription_rejected: {
    type: objSchema,
    default: defaultObj,
  },
  subscription_cancelled: {
    type: objSchema,
    default: defaultObj,
  },

  // solo mails
  supplier_inventory: {
    type: objSchema,
    default: defaultObj,
  },
  driver_delivery: {
    type: objSchema,
    default: defaultObj,
  },
});
mongoose.model("email_sms_on_off", schema1);
