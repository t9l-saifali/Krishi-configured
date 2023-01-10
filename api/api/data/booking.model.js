var mongoose = require("mongoose");
var autoIncrement = require("mongoose-auto-increment");

var Schema = mongoose.Schema({
  qtyReduce: {
    type: Boolean,
    default: false,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    require: true,
  },
  userName: {
    type: String,
    lowercase: true,
    default: null,
  },
  userEmail: {
    type: String,
    default: null,
  },
  userMobile: {
    type: Number,
    default: null,
  },
  userType: {
    type: String,
    default: null,
  },
  contactNumber: {
    type: Number,
    required: false,
    default: null,
  },
  userData: {
    type: {},
    default: null,
  },
  addToCartID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "addtocarts",
    require: true,
  },
  subscriptionID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "subscriptions",
    default: null,
  },
  subscriptionCode: {
    type: String,
    required: false,
    default: null,
  },
  regionName: {
    type: String,
    required: false,
    default: null,
  },
  regionID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "regions",
    required: false,
    default: null,
  },
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "coupon_masters",
    require: true,
  },
  coupon_value: {
    type: Number,
    default: false,
    default: null,
  },
  coupon_code: {
    type: String,
    default: false,
    default: null,
  },
  couponApplied: {
    type: Boolean,
    default: false,
  },
  totalCouponDiscountAmount: {
    type: Number,
    required: false,
    default: 0,
  },
  discountType: {
    type: String,
    required: false,
    default: null,
  },
  discountAmount: {
    type: Number,
    required: false,
    default: 0,
  },
  discountLocation: {
    type: String,
    default: null,
  },
  discountPercentage: {
    type: Number,
    required: false,
    default: 0,
  },
  discount_upto: {
    type: Number,
    required: false,
    default: 0,
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
  booking_code: {
    type: String,
    default: null,
  },
  po_number: {
    type: String,
    default: null,
  },
  invoiceNO: {
    type: String,
    default: null,
  },
  challanNO: {
    type: String,
    default: null,
  },
  paymentmethod: {
    type: String,
    default: null,
  },
  paytm_link: {
    type: String,
    default: null,
  },

  MID: {
    type: String,
    default: null,
  },
  TXNID: {
    type: String,
    default: null,
  },
  razorpay_orderid: {
    type: String,
    default: null,
  },
  TXNAMOUNT: {
    type: String,
    default: null,
  },
  PAYMENTMODE: {
    type: String,
    default: null,
  },
  CURRENCY: {
    type: String,
    default: null,
  },
  TXNDATE: {
    type: String,
    default: null,
  },
  STATUS: {
    type: String,
    default: null,
  },
  RESPCODE: {
    type: String,
    default: null,
  },
  RESPMSG: {
    type: String,
    default: null,
  },
  GATEWAYNAME: {
    type: String,
    default: null,
  },
  BANKTXNID: {
    type: String,
    default: null,
  },
  BANKNAME: {
    type: String,
    default: null,
  },
  CHECKSUMHASH: {
    type: String,
    default: null,
  },

  payment_id: {
    type: String,
    default: null,
  },
  bookingMode: {
    type: String,
    default: null,
  },
  payment: {
    type: String,
    default: "Pending",
  },
  BookingStatusByAdmin: {
    type: String,
    default: "Pending",
  },
  BookingStatusByAdminID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "admins",
    default: null,
  },
  DeliveryDate: {
    type: Date,
    timezone: "Asia/Kolkata",
    default: null,
  },
  paymentDateByAdmin: {
    type: Date,
    timezone: "Asia/Kolkata",
    default: null,
  },
  deliverySlot: {
    type: String,
    default: null,
  },
  paymentRemarkByAdmin: {
    type: String,
    default: null,
  },
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "admins",
    default: null,
  },
  paymentDateByAdmin: {
    type: Date,
    timezone: "Asia/Kolkata",
    default: null,
  },
  total_payment: {
    type: Number,
    default: 0,
  },
  balance_payment: {
    type: Number,
    default: 0,
  },
  balance_paymentStatus: {
    type: String,
    default: "Pending",
  },
  balance_paymentStatusByAdminID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "admins",
    default: null,
  },
  gst: {
    type: Number,
    default: 0,
  },
  allGstLists: {
    type: Array,
    default: null,
  },
  taxType: {
    type: String,
    default: null,
  },
  totalCartPrice: {
    type: Number,
    default: 0,
  },
  totalCartPriceWithoutGST: {
    type: Number,
    default: 0,
  },
  cod: {
    type: Boolean,
    default: false,
  },
  codCharges: {
    type: Number,
    default: 0,
  },
  deliveryCharges: {
    type: Number,
    default: 0,
  },
  codRemoveReason: {
    type: String,
    default: null,
  },
  codRemoveAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "admins",
    default: null,
  },

  loyaltyProgram: {
    type: Object,
    default: {},
  },

  redeem_point: {
    type: Number,
    default: 0,
  },
  redeemDiscount: {
    type: Number,
    default: 0,
  },
  referralDiscount: {
    type: Number,
    default: 0,
  },
  adminDiscountType: {
    type: String,
    default: "none",
  },
  adminDiscountPercentage: {
    type: Number,
    default: 0,
  },
  adminDiscount: {
    type: Number,
    default: 0,
  },
  adminDiscountReason: {
    type: String,
    default: "",
  },
  billingCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "companies",
    default: null,
  },
  billType: {
    type: String,
    enum: ["invoice", "challan"],
    default: "invoice",
  },
  giftingStatus: {
    type: Boolean,
    default: false,
  },
  giftingName: {
    type: String,
    default: null,
  },
  giftingContact: {
    type: Number,
    default: null,
  },
  giftingAddress: {
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
    houseNo: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    locationTag: {
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
  giftingNote: {
    type: String,
    default: null,
  },
  booking_address: {
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
    houseNo: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    locationTag: {
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
  delivery_instructions: {
    type: String,
    default: null,
  },
  driver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "drivers",
    require: false,
    default: null,
  },
  driverName: {
    type: String,
    default: null,
  },
  driverMobile: {
    type: Number,
    default: null,
  },
  driverAddress: {
    type: String,
    default: null,
  },
  otheraddress: {
    type: String,
    default: null,
  },
  device_name: {
    type: String,
    default: null,
  },
  backendOrderDate: {
    type: Date,
    timezone: "Asia/Kolkata",
    default: null,
  },
  createDate: {
    type: Date,
    timezone: "Asia/Kolkata",
    default: Date.now,
  },
  bookingdetail: { type: Array, default: null },
  inventory_ids: {
    type: [
      {
        inventory_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "inventories",
        },
        product_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "products",
        },
        qty: Number,
        variant_name: {
          type: String,
          default: null,
        },
        _id: false,
      },
    ],
    default: [],
  },
});

Schema.plugin(autoIncrement.plugin, { model: "bookings", field: "counter" });
module.exports = mongoose.model("bookings", Schema);
