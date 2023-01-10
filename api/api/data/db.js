var mongoose = require("mongoose");
var autoIncrement = require("mongoose-auto-increment");

autoIncrement.initialize(mongoose.connection);

// BRING IN YOUR SCHEMAS & MODELS
require("./users.model");
require("./product_categories.model");
require("./size_masters.model");
require("./color_masters.model");
require("./voucher_head_masters.model");
require("./coupon_masters.model");
require("./stock_masters.model");
require("./supplier_masters.model");
require("./products.model");
require("./orders.model");
require("./report_summary.model");
require("./ledgers.model");
require("./banner.model");
require("./slides.model");
require("./payment.model");
require("./payment_options.model");
require("./userAddress.model");
require("./blog.model");
require("./feedback.model");
require("./adminLogin.model");
require("./newsletter.model");
require("./attribute_group.model");
require("./attribute.model");
require("./account_head.model");
require("./region.model");
require("./unit_measurement.model");
require("./role.model");
require("./role_modules.model");
require("./blog_category.model");
require("./tax.model");
require("./inventory.model");
require("./inventory_item.model");
require("./addtocart.model");
require("./faq.model");
require("./booking.model");
require("./setting.model");
require("./voucherInventory.model");
require("./drivers.model");
require("./report_generations.model");
require("./subscriptions.model");
require("./loyality_program_histories.model");
require("./loyality_program.model");
require("./wallet_histories.model");
require("./about.model");
require("./tc.model");
require("./privacy_policy.model");
require("./category.model");
require("./counters.model");
require("./company.model");
require("./pincode.model");
require("./email_sms_on_off.model");
require("./pincodeSetting.model");
require("./emailTemplate.model");
require("./pages.model");
require("./ratingreviews.model");
require("./packages.model");
require("./storeheysetting.model");
require("./sms_gateways.model");

// logs config
const log4js = require("log4js");
const { db } = require("./booking.model");

log4js.configure({
  appenders: {
    multi: {
      type: "multiFile",
      base: "public/app_logs/",
      property: "categoryName",
      extension: ".log",
      maxLogSize: 10485760,
      backups: 3,
      compress: true,
    },
  },
  categories: {
    default: { appenders: ["multi"], level: "trace" },
  },
});
const errorLogger = log4js.getLogger("node_process_error");

// whatsapp start after db connection
var StoreheySettingsTable = mongoose.model("storeheysettings");
// var whatsapp = require("../../whatsapp");

// var dburl = "mongodb://localhost:27017/manmohey_db";
var dburl = "mongodb://127.0.01:27017/krishicress_db";
//var dburl = "mongodb://localhost:27017/test2_db";

var retry = null;
//mongoose.connect(dburl);

// mongoose.connect("mongodb://localhost:27017/manmohey_db");
// mongoose.connect("mongodb://127.0.0.1:27017/krishicress_db");
mongoose.connect("mongodb://127.0.0.1:27017/krishicress_db");
// mongoose.connect("mongodb://localhost:27017/test2_db");

// CONNECTION EVENTS
mongoose.connection.on("connected", function () {
  errorLogger.debug("Mongoose connected to " + dburl);
  console.log("Mongoose connected to " + dburl);

  // StoreheySettingsTable.findOne({}, (err, data) => {
  //   var whatsappLastStatus = "online";
  //   if (whatsappLastStatus == "online") {
  //     whatsapp.getQR();
  //   }
  // });
});
mongoose.connection.on("error", function (err) {
  errorLogger.debug("Mongoose connection error: " + err);
  console.log("Mongoose connection error: " + err);
});
mongoose.connection.on("disconnected", function () {
  errorLogger.debug("Mongoose disconnected");
  console.log("Mongoose disconnected");
});

// CAPTURE APP TERMINATION / RESTART EVENTS
// To be called when process is restarted or terminated
// function gracefulShutdown(msg, callback) {
//   mongoose.connection.close(function () {
//     errorLogger.debug("Mongoose disconnected because of " + msg);
//     console.log("Mongoose disconnected through " + msg);
//     callback();
//   });
// }

// For nodemon restarts
// process.once("SIGUSR2", function () {
//   gracefulShutdown("nodemon restart", function () {
//     process.kill(process.pid, "SIGUSR2");
//   });
// });

// For app termination
// process.on("SIGINT", function () {
//   gracefulShutdown("App termination (SIGINT)", function () {
//     process.exit(0);
//   });
// });

// For Heroku app termination
// process.on("SIGTERM", function () {
//   gracefulShutdown("App termination (SIGTERM)", function () {
//     process.exit(0);
//   });
// });

// For any unhandled errors
process.on("uncaughtException", (err) => {
  errorLogger.error("unhandled error / uncaughtException :::::: " + err);
  console.log(`Uncaught Exception: ${err.message}`);
  console.log(err.stack);
  // gracefulShutdown("Uncaught Exception", function () {
  //   process.exit(1);
  // });
});

process.on("unhandledRejection", (reason, promise) => {
  errorLogger.error("Unhandled rejection at ", promise, `reason: ${reason}`);
  console.log("Unhandled rejection at ", promise, `reason: ${reason}`);
  // gracefulShutdown("Unhandled rejection", function () {
  //   process.exit(1);
  // });
});

// require('./');
