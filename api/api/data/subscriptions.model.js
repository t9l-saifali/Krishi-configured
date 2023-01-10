var mongoose = require("mongoose");
var autoIncrement = require("mongoose-auto-increment");

var subscriptionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  userData: {
    type: Object,
    default: {},
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
  razorpay_orderid: {
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
  SubscriptionID: {
    type: String,
    default: null,
  },
  preOrder: {
    type: Boolean,
    //required: false,
    default: false,
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
  totalCouponDiscountAmount: {
    type: Number,
    required: false,
    default: 0,
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
  coupon_code: {
    type: String,
    default: false,
    default: null,
  },
  couponApplied: {
    type: Boolean,
    default: false,
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
  deliverySlot: {
    type: String,
    default: null,
  },
  invoiceNO: {
    type: String,
    default: null,
  },

  loyaltyProgram: {
    type: Object,
    default: {},
  },

  paymentmethod: {
    type: String,
    required: true,
  },
  paytm_link: {
    type: String,
    default: null,
  },
  payment_id: {
    type: String,
    default: null,
  },

  // paytm response
  MID: {
    type: String,
    default: null,
  },
  TXNID: {
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

  total_payment: {
    type: Number,
    default: 0,
  },
  OrderTotal: {
    type: Number,
    default: 0,
  },
  totalCartPrice: {
    type: Number,
    default: 0,
  },
  totalCartPriceWithoutGST: {
    type: Number,
    default: 0,
  },
  gst: {
    type: Number,
    default: 0,
  },
  allGstLists: {
    type: Array,
    default: null,
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
  device_name: {
    type: String,
    default: null,
  },

  // address
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

  createDate: {
    type: Date,
    timezone: "Asia/Kolkata",
    default: Date.now,
  },

  bookingdetail: {
    type: Array,
    required: true,
  },
  dates: {
    type: [
      {
        date: {
          type: Date,
        },
        status: {
          type: String,
          enum: ["Pending", "Accepted", "Out For Delivery", "Delivered", "Rejected"],
          default: "Pending",
        },
        driverData: {
          type: {
            driver_id: mongoose.Schema.Types.ObjectId,
            driver_name: String,
            driver_email: String,
            driver_mobile: String,
          },
          default: null,
        },
        orderCreated: {
          type: Boolean,
          default: false,
        },
        mailSent: {
          type: Boolean,
          default: false,
        },
      },
    ],
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  unsubscribed: {
    type: Boolean,
    default: false,
  },
  dateWiseData: Array,

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

subscriptionSchema.plugin(autoIncrement.plugin, { model: "subscriptions", field: "counter" });
mongoose.model("subscriptions", subscriptionSchema);
