var nodemailer = require("nodemailer");
var mongoose = require("mongoose");
const http = require("http");
const https = require("https");
var path = require("path");
var bodyParser = require("body-parser");
var routes = require("./api/routes");
const fs = require("fs");
const qs = require("querystring");
const checksum_lib = require("./Paytm/checksum");
const config = require("./Paytm/config");
const SMS = require("smsalert");
var bookingDataBase = mongoose.model("bookings");
var inventoryDataBase = mongoose.model("inventory");
var inventoryItemTable = mongoose.model("inventory_items");
var Subscriptions = mongoose.model("subscriptions");
var WalletHistories = mongoose.model("wallet_histories");
var PaymentOptions = mongoose.model("payment_options");

var storeheySettingsModel = mongoose.model("storeheysettings");

// method for sending whatsapp messages
// const { sendWhatsappMessage, getState } = require("./whatsapp");

var LoyalityProgramHistory = mongoose.model("loyality_program_histories");
var LoyalityPrograms = mongoose.model("loyality_programs");

var addToCartDataBase = mongoose.model("addtocarts");
var couponDataBase = mongoose.model("coupon_masters");
var User = mongoose.model("Users");
var Admin = mongoose.model("admin");
var Roles = mongoose.model("role");
var driverDataBase = mongoose.model("drivers");
var products = mongoose.model("products");
var Settings = mongoose.model("settings");
var smsGatewayDatabase = mongoose.model("sms_gateways");
const Paytm = require("paytm-pg-node-sdk");
const async = require("async");
var moment = require("moment-timezone");
var voucherInventory = mongoose.model("voucherInventory");
var OnOffDataBase = mongoose.model("email_sms_on_off");
var EmailTemp = mongoose.model("email_templates");
const AWS = require("aws-sdk");

// For Decimal Precision
const Decimal = require("decimal.js");

// logs config
const log4js = require("log4js");
const { timeStamp } = require("node:console");

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

const logger = log4js.getLogger("product_quantity");
const ilogger = log4js.getLogger("inventory_quantity");
const iBodyLogger = log4js.getLogger("inventory_body_logs");
const paytmLogger = log4js.getLogger("paytm");
const orderStatusLogs = log4js.getLogger("order_status_logs");
const ThresholdLogger = log4js.getLogger("threshold_cron");
const OutOfStockLogger = log4js.getLogger("outofstock_cron");
const errorLogger = log4js.getLogger("errors");
const paytmStatusLogger = log4js.getLogger("paytmLoggerFetchingStatus");

//var smtpTransport = require("nodemailer-smtp-transport");

// for whatsapp messages
// const wbm = require('wbm');
// wbm.start().then(async () => {
//   const phones = ['9911431099'];
//   const message = 'Good Morning.';
//   await wbm.send(phones, message);
//   await wbm.end();
// }).catch(err => console.log(err));

module.exports = {
  slugify: function (string) {
    const a =
      "àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;/@";
    const b =
      "aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz--------";
    const p = new RegExp(a.split("").join("|"), "g");

    return string
      .toString()
      .toLowerCase()
      .replace(/\s+/g, "-") // Replace spaces with -
      .replace(p, (c) => b.charAt(a.indexOf(c))) // Replace special characters
      .replace(/&/g, "-and-") // Replace & with 'and'
      .replace(/[^\w\-]+/g, "") // Remove all non-word characters
      .replace(/\-\-+/g, "-") // Replace multiple - with single -
      .replace(/^-+/, "") // Trim - from start of text
      .replace(/-+$/, ""); // Trim - from end of text
  },

  sendOtp: async function (to, message) {
    // let whatsappState = await getState();
    // let { whatsappOnOff } = await storeheySettingsModel.findOne({}).lean();
    // if (whatsappState == "CONNECTED" && whatsappOnOff) {
    //   // await sendWhatsappMessage(to, message);
    // }
    try {
      let smsGateway = await smsGatewayDatabase.findOne({}).lean();
      if (smsGateway.name == "sms_alert") {
        const senderid = smsGateway.keys.senderID;
        const sms = new SMS(smsGateway.keys.username, smsGateway.keys.password);
        var messageRes = encodeURIComponent(message);
        sms
          .send(to, messageRes, senderid)
          .then(() => {
            //console.log('resultMessageresultMessage', resultMessage)
          })
          .catch((err) => {
            errorLogger.error(err, "\n", "\n");
            console.log("err", err);
          });
      } else if (smsGateway.name == "aws_sms") {
        console.log("aws_sms");
        // AWS.config.accessKeyId = 'AKIA2UKHBGPF5LC6FQ5M';
        // AWS.config.secretAccessKey = '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'
        // var sns = new AWS.SNS({region:'ap-south-1'});
        AWS.config.accessKeyId = smsGateway.keys.AWS_ACCESS_KEY_ID;
        AWS.config.secretAccessKey = smsGateway.keys.AWS_SECRET_ACCESS_KEY;
        var sns = new AWS.SNS({ region: smsGateway.keys.AWS_REGION });
        await sns
          .setSMSAttributes({
            attributes: {
              DefaultSMSType: "Transactional",
            },
          })
          .promise();
        var params = {
          Message: message /* required */,
          PhoneNumber: "+91" + to,
        };
        let result = await sns.publish(params).promise();
        console.log(result, "aws_sms");
        if (!result.MessageId) throw null;
      } //else if end
    } catch (err) {
      errorLogger.error(err, "\n", "\n");
      console.log("error :::::::::: ", err);
    }
  },

  fileNameDyanmic: function (startDateTime, endDateTime, FileName) {
    let startFDate = moment(startDateTime).format("DD-MM-YYYY hh:mm a");
    let endFDate = moment(endDateTime).format("DD-MM-YYYY hh:mm a");
    var file_Name = FileName + " (" + startFDate + " to " + endFDate + ")";
    return file_Name;
  },

  toTitleCase: (str) => {
    str = str ? str.trim() : "";
    return str.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  },

  OrderDetails: async function (orderDetails) {
    // order table
    let settings = await Settings.findOne({}).lean();
    // let hostUrl = settings.weblink.split("/#/")[0];
    let apiUrl = settings?.apilink;
    let table = "";
    if (orderDetails) {
      table += `<tr>
                    <td style="background-color:#fff;">
                        <table cellpadding="0" cellspacing="0" width="100%" align="center" class="content-mailer">
                            <tbody>
                                <tr>
                                    <td style="padding:15px;" class="mailer-start-prduct">
                                        <table cellpadding="0" cellspacing="0" width="100%" align="center" style="background-color:#F9F9F9;border:1px solid #d1d1d1;padding:15px;" class="mailer-product-header" >
                                            <tbody>
                                                <tr>
                                                    <td>
                                                        <table cellpadding="0" cellspacing="0" width="100%" align="center" class="mailer-status">
                                                            <tbody>
                                                                <tr>
                                                                    <td style="vertical-align:top;">
                                                                        <h6 style="margin:0px;font-size:16px; color:#323232;">${
                                                                          orderDetails.dates
                                                                            ? orderDetails.SubscriptionID
                                                                            : orderDetails.booking_code
                                                                        }</h6>
                                                                        <p style="margin:0px;color:#7E7E7E;font-size:12px;">${
                                                                          orderDetails.dates
                                                                            ? "Subscription"
                                                                            : "Order"
                                                                        } Placed on: <strong style="color:#323232;font-size:12px;">${orderDetails.createDate.toDateString()}</strong></p>
                                                                    </td>
                                                                    <td style="text-align:right;vertical-align:top;font-size:16px;font-weight:700;">${module.exports.toTitleCase(
                                                                      orderDetails.BookingStatusByAdmin
                                                                    )}</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                                
                                                
                                                <tr>
                                                    <td>
                                                        <table cellpadding="0" cellspacing="0" width="100%" align="center" class="mailer-order-item">
                                                            <tbody>
                                                                <tr>
                                                                    <td>
                                                                        <h6 class="heading-row" style="font-size:14px; color:#323232;border-bottom:1px solid #EBEBEB;padding-bottom:5px;font-weight:700;">${
                                                                          orderDetails.dates
                                                                            ? "Subscription"
                                                                            : "Order"
                                                                        } Items</h6>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="vertical-align:top; max-height: 230px; overflow: hidden; overflow-y: inherit;    display: block;" class="content-datab-box">
                                                        <table cellpadding="0" cellspacing="0" width="100%" align="center" class="mailer-product-list" >
                                                            <tbody>
                                                                
                                                                ${orderDetails.products
                                                                  .map(
                                                                    (
                                                                      prod
                                                                    ) => `<tr>
                                                                <td style="vertical-align:top;padding-bottom:10px;">
                                                                    <span style="display:table-cell;vertical-align:top;">
                                                                    <img height="64" width="64" src="${apiUrl}/upload/${
                                                                      prod
                                                                        .product_images[0]
                                                                        ? prod
                                                                            .product_images[0]
                                                                            .image ||
                                                                          prod
                                                                            .product_images[0]
                                                                        : settings.image
                                                                    }">
                                                                    </span>
                                                                    <span style="display:table-cell; vertical-align:top;padding-left:8px;">
                                                                        <p style="margin-top:0px;margin-bottom:5px;font-size:14px;color:#B1B1B1;"><strong style="color:#FEBC15;font-size:14px;">${module.exports.toTitleCase(
                                                                          prod.product_name
                                                                        )}</strong> ${
                                                                      prod.TypeOfProduct ==
                                                                      "simple"
                                                                        ? `- ${
                                                                            prod.without_package
                                                                              ? `${
                                                                                  prod.unitQuantity ||
                                                                                  ""
                                                                                } ${module.exports.toTitleCase(
                                                                                  prod
                                                                                    .unitMeasurement
                                                                                    .name ||
                                                                                    prod.unitMeasurement ||
                                                                                    ""
                                                                                )}`
                                                                              : module.exports.toTitleCase(
                                                                                  prod.packetLabel ||
                                                                                    ""
                                                                                )
                                                                          }`
                                                                        : ""
                                                                    }<span>${
                                                                      prod.preOrder ===
                                                                      true
                                                                        ? "pre-order"
                                                                        : ""
                                                                    }</span></p>
                                                                    ${
                                                                      prod.TypeOfProduct ==
                                                                      "configurable"
                                                                        ? `<p style="margin-top:0px;margin-bottom:5px;font-size:14px;color:#B1B1B1;"> ${((
                                                                            vn
                                                                          ) => {
                                                                            return vn
                                                                              .split(
                                                                                "__"
                                                                              )
                                                                              .reduce(
                                                                                (
                                                                                  acc,
                                                                                  x,
                                                                                  i
                                                                                ) => {
                                                                                  if (
                                                                                    i %
                                                                                      2 ==
                                                                                    1
                                                                                  )
                                                                                    return (
                                                                                      acc +
                                                                                      (acc
                                                                                        ? ", "
                                                                                        : "") +
                                                                                      x
                                                                                    );
                                                                                  else
                                                                                    return (
                                                                                      acc +
                                                                                      ""
                                                                                    );
                                                                                },
                                                                                ""
                                                                              );
                                                                          })(
                                                                            prod.variant_name
                                                                          )}</p>`
                                                                        : ""
                                                                    }
                                                                        <p style="margin-top:0px;margin-bottom:5px;font-size:14px;color:#B1B1B1;">Quantity ${
                                                                          prod.qty
                                                                        }</p>
                                                                        ${
                                                                          prod.TypeOfProduct ==
                                                                          "group"
                                                                            ? `
                                                                                    ${prod.groupData
                                                                                      .map(
                                                                                        (
                                                                                          set
                                                                                        ) => {
                                                                                          return `${set.sets
                                                                                            .map(
                                                                                              (
                                                                                                innerProd
                                                                                              ) => {
                                                                                                return +innerProd.qty
                                                                                                  ? `
                                                                                                <p style="margin-top:0px;margin-bottom:2px;font-size:14px;color:#B1B1B1;">
                                                                                                    ${
                                                                                                      innerProd
                                                                                                        .product
                                                                                                        .product_name
                                                                                                    }
                                                                                                    -${
                                                                                                      innerProd.package
                                                                                                        ? innerProd
                                                                                                            .package
                                                                                                            .packetLabel
                                                                                                        : `${
                                                                                                            innerProd.unitQuantity
                                                                                                          } ${
                                                                                                            innerProd
                                                                                                              .unitMeasurement
                                                                                                              .name ||
                                                                                                            innerProd.unitMeasurement
                                                                                                          }`
                                                                                                    }
                                                                                                    - (₹${
                                                                                                      innerProd.price
                                                                                                    })
                                                                                                    [${
                                                                                                      innerProd.qty
                                                                                                    }]
                                                                                                </p>
                                                                                                `
                                                                                                  : "";
                                                                                              }
                                                                                            )
                                                                                            .join(
                                                                                              ""
                                                                                            )}`;
                                                                                        }
                                                                                      )
                                                                                      .join(
                                                                                        ""
                                                                                      )}
                                                                                `
                                                                            : ""
                                                                        }
                                                                    </span>
                                                                </td>
                                                                <td style="text-align:right; vertical-align:top; padding-bottom:10px; font-size:14px;color:#323232; font-weight:700; padding-right:15px;">
                                                                    ₹${
                                                                      prod.totalPriceBeforeGST
                                                                    }
                                                                </td>
                                                            </tr>`
                                                                  )
                                                                  .join("")}
                                                                
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="shipping-box-detail">
                                                        <table  cellpadding="0" cellspacing="0" width="100%" align="center" class="mailer-shipping" >
                                                            <tbody>
                                                                <tr>
                                                                    <td>
                                                                    <h6 class="heading-row" style="font-size:14px; color:#323232;border-bottom:1px solid #EBEBEB;padding-bottom:5px;margin-bottom:5px; font-weight:700;">Shipping Details</h6>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td style="font-size:14px;color:#B1B1B1;">${module.exports.toTitleCase(
                                                                      orderDetails.name
                                                                    )}<br/> 
                                                                    ${module.exports.toTitleCase(
                                                                      orderDetails.address ||
                                                                        ""
                                                                    )}<br/> 
                                                                    <span  style="font-size:14px;color:#B1B1B1;">Delivery Slot - ${
                                                                      orderDetails.deliverySlot ||
                                                                      ""
                                                                    }</span></td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="payment-box-detail">
                                                        <table  cellpadding="0" cellspacing="0" width="100%" align="center" class="mailer-payment" >
                                                            <tbody>
                                                                <tr>
                                                                    <td>
                                                                    <h6 class="heading-row" style="font-size:14px; color:#323232;border-bottom:1px solid #EBEBEB;padding-bottom:5px;margin-bottom:5px; font-weight:700;">Payment Details</h6>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td style="font-size:14px;color:#B1B1B1;">${
                                                                      orderDetails.paymentMethod.toLowerCase() ==
                                                                      "cod"
                                                                        ? orderDetails.paymentMethod.toUpperCase()
                                                                        : module.exports.toTitleCase(
                                                                            orderDetails.paymentMethod
                                                                          )
                                                                    } - 
                                                                    ${module.exports.toTitleCase(
                                                                      orderDetails.paymentStatus
                                                                    )}</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="Order-Details" class="mailer-order-det">
                                                        <table  cellpadding="0" cellspacing="0" width="100%" align="center" >
                                                            <tbody>
                                                                <tr>
                                                                    <td>
                                                                    <h6 class="heading-row" style="font-size:14px; color:#323232;border-bottom:1px solid #EBEBEB;padding-bottom:5px;margin-bottom:5px; font-weight:700;">Order Details</h6>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td>
                                                                        <table  cellpadding="0" cellspacing="0" width="100%" align="center" class="order-content-stuts-wer">
                                                                            <tbody>

                                                                                <tr>
                                                                                    <td class="order-left" style="font-size: 14px; color: #B1B1B1;padding-top:10px;">Sub-Total</td>
                                                                                    <td class="order-right" style="font-size: 14px; color:#B1B1B1;text-align:right;padding-top:10px;">₹${orderDetails.totalCartPrice.toFixed(
                                                                                      2
                                                                                    )}</td>
                                                                                </tr>
                                                                                
                                                                                ${
                                                                                  orderDetails.adminDiscount
                                                                                    ? `<tr>
                                                                                            <td class="order-left" style="font-size: 14px; color: #B1B1B1;">Discount</td>
                                                                                            <td class="order-right" style="font-size: 14px; color:#B1B1B1;text-align:right;">₹${orderDetails.adminDiscount.toFixed(
                                                                                              2
                                                                                            )}</td>
                                                                                        </tr>`
                                                                                    : ""
                                                                                }
                                                                                ${
                                                                                  orderDetails.discountAmount
                                                                                    ? `<tr>
                                                                                            <td class="order-left" style="font-size: 14px; color: #B1B1B1;">Discount </td>
                                                                                            <td class="order-right" style="font-size: 14px; color:#B1B1B1;text-align:right;">₹${orderDetails.discountAmount.toFixed(
                                                                                              2
                                                                                            )}</td>
                                                                                        </tr>`
                                                                                    : ""
                                                                                }
                                                                                ${
                                                                                  orderDetails.redeemDiscount
                                                                                    ? `<tr>
                                                                                            <td class="order-left" style="font-size: 14px; color: #B1B1B1;">Redeem Point Discount </td>
                                                                                            <td class="order-right" style="font-size: 14px; color:#B1B1B1;text-align:right;">₹${orderDetails.redeemDiscount.toFixed(
                                                                                              2
                                                                                            )}</td>
                                                                                        </tr>`
                                                                                    : ""
                                                                                }
                                                                                ${
                                                                                  orderDetails.referralDiscount
                                                                                    ? `<tr>
                                                                                            <td class="order-left" style="font-size: 14px; color: #B1B1B1;">Referral Discount </td>
                                                                                            <td class="order-right" style="font-size: 14px; color:#B1B1B1;text-align:right;">₹${orderDetails.referralDiscount.toFixed(
                                                                                              2
                                                                                            )}</td>
                                                                                        </tr>`
                                                                                    : ""
                                                                                }

                                                                                <tr>
                                                                                    <td class="order-left" style="font-size: 14px; color: #B1B1B1;">GST</td>
                                                                                    <td class="order-right" style="font-size: 14px; color:#B1B1B1;text-align:right;">₹${orderDetails.gst.toFixed(
                                                                                      2
                                                                                    )}</td>
                                                                                </tr>

                                                                                ${
                                                                                  orderDetails.deliveryCharges
                                                                                    ? `<tr>
                                                                                                <td class="order-left" style="font-size: 14px; color: #B1B1B1;">Delivery Charges</td>
                                                                                                <td class="order-right" style="font-size: 14px; color:#B1B1B1;text-align:right;">₹${orderDetails.deliveryCharges}</td>
                                                                                            </tr>`
                                                                                    : ""
                                                                                }

                                                                                ${
                                                                                  orderDetails.codCharges
                                                                                    ? `<tr>
                                                                                                <td class="order-left" style="font-size: 14px; color: #B1B1B1;padding-bottom:10px;">COD Charges</td>
                                                                                                <td class="order-right" style="font-size: 14px; color:#B1B1B1;text-align:right;padding-bottom:10px;">₹${orderDetails.codCharges}</td>
                                                                                            </tr>`
                                                                                    : ""
                                                                                }

                                                                                ${
                                                                                  orderDetails.dates
                                                                                    ? `<tr>
                                                                                            <td class="order-left" style="font-size: 14px; color: #B1B1B1;">No. Of Days </td>
                                                                                            <td class="order-right" style="font-size: 14px; color:#B1B1B1;text-align:right;">${orderDetails.dates.length}</td>
                                                                                        </tr>`
                                                                                    : ""
                                                                                }
                                                                                
                                                                                <tr>
                                                                                    <td style="font-size:16px; color:#323232;padding-top:10px;border-top:1px solid #EBEBEB;font-weight:700;">Total</td>
                                                                                    <td style="font-size:16px; color:#323232;text-align:right; padding-top:10px;border-top:1px solid #EBEBEB; font-weight:700;">₹${
                                                                                      orderDetails.dates
                                                                                        ? orderDetails.total_payment *
                                                                                          orderDetails
                                                                                            .dates
                                                                                            .length
                                                                                        : orderDetails.total_payment
                                                                                    }</td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>`;
    }
    return table;
  },

  sendDynamicEmail: async (params, MailLogger = null) => {
    let settings = await Settings.findOne({}).lean();
    //Get email template
    var emailTemplatesHtml = fs.readFileSync(
      path.join(__dirname, "emailTemplate.html"),
      "utf8"
    );
    emailTemplatesHtml = emailTemplatesHtml.replace(
      /##DYNAMIC_EMAIL_HTML##/g,
      params.message
    );
    emailTemplatesHtml = emailTemplatesHtml.replace(/##logo##/g, settings.logo);
    emailTemplatesHtml = emailTemplatesHtml.replace(
      /##mailBanner##/g,
      settings.mailBanner
    );
    emailTemplatesHtml = emailTemplatesHtml.replace(
      /##companyName##/g,
      settings.companyName
    );
    emailTemplatesHtml = emailTemplatesHtml.replace(
      /##apilink##/g,
      settings.apilink
    );
    emailTemplatesHtml = emailTemplatesHtml.replace(
      /##phone2##/g,
      settings.phone2
    );
    emailTemplatesHtml = emailTemplatesHtml.replace(
      /##weblink##/g,
      settings.weblink
    );
    emailTemplatesHtml = emailTemplatesHtml.replace(
      /##email1##/g,
      settings.email1
    );
    emailTemplatesHtml = emailTemplatesHtml.replace(
      /##facebook##/g,
      settings.facebook
    );
    emailTemplatesHtml = emailTemplatesHtml.replace(
      /##instagram##/g,
      settings.instagram
    );
    emailTemplatesHtml = emailTemplatesHtml.replace(
      /##registeredOffice##/g,
      settings.registeredOffice
    );
    emailTemplatesHtml = emailTemplatesHtml.replace(
      /##slogan##/g,
      settings.slogan
    );
    let transporter = nodemailer.createTransport({
      host: settings.mail_host,
      port: +settings.mail_port,
      secure: true,
      auth: {
        user: settings.mail_username, // generated ethereal user
        pass: settings.mail_password, // generated ethereal password
      },
    });
    let hostUrl = settings.weblink.split("/#/")[0];
    let apiUrl = settings.apilink;
    console.log(settings.mail_username, params.to);
    transporter.sendMail(
      {
        from: settings.mail_username,
        to: params.to, // receiver
        subject: params.subject,
        html: emailTemplatesHtml, // body
      },
      function (error, response) {
        if (error) {
          MailLogger &&
            MailLogger.info(JSON.stringify(error), "Mail not sent by gmail");
        } else {
          MailLogger &&
            MailLogger.info(JSON.stringify(response), "Mail sent by gmail");
        }
        MailLogger && MailLogger.info("transporter close");
        transporter.close();
      }
    );
  },

  dynamicEmail: async function (keys, MailLogger = null) {
    let settings = await Settings.findOne({}).lean();
    EmailTemp.findOne({ template_name: keys.template_name, status: true })
      .lean()
      .exec(async function (err, data) {
        if (data) {
          //get static email message body
          var message = data.email_text;
          //make static to dynamic email message body
          message = message.replace(
            /##Admin_Name##/g,
            keys.adminName ? module.exports.toTitleCase(keys.adminName) : ""
          );
          message = message.replace(
            /##Customer_Name##/g,
            keys.userName ? module.exports.toTitleCase(keys.userName) : ""
          );
          message = message.replace(
            /##Customer_Mobile##/g,
            keys.userMobile ? keys.userMobile : ""
          );
          message = message.replace(
            /##Customer_Email##/g,
            keys.userEmail ? keys.userEmail : ""
          );
          message = message.replace(
            /##Customer_City##/g,
            keys.userCity ? module.exports.toTitleCase(keys.userCity) : ""
          );
          message = message.replace(
            /##Customer_Feedback##/g,
            keys.feedback ? keys.feedback : ""
          );
          message = message.replace(
            /##Order_Id##/g,
            keys.bookingId ? keys.bookingId : ""
          );
          message = message.replace(
            /##Customer_Attachment##/g,
            keys.attachment ? keys.attachment : ""
          );
          message = message.replace(
            /##Wallet_Amount##/g,
            keys.walletAmount ? keys.walletAmount : ""
          );
          message = message.replace(
            /##Loyalty_Points##/g,
            keys.Loyalty_Points ? keys.Loyalty_Points : ""
          );
          message = message.replace(
            /##Referral_Benefit_Points##/g,
            keys.Referral_Benefit_Points ? keys.Referral_Benefit_Points : ""
          );
          message = message.replace(/##Website_Link##/g, settings.weblink);
          message = message.replace(
            /##Order_Delivery_Date##/g,
            keys.dlvrDate ? keys.dlvrDate : ""
          );
          message = message.replace(
            /##Reason_To_Give_Loyalty_Points##/g,
            keys.reason ? keys.reason : ""
          ); // loyality points
          message = message.replace(
            /##Loyalty_Points_Expiry_Date##/g,
            keys.PointExpiryDate ? keys.PointExpiryDate : ""
          );
          message = message.replace(
            /##Referral_By##/g,
            keys.referralBy ? keys.referralBy : ""
          );
          message = message.replace(
            /##Subscription_Dates##/g,
            keys.subscriptionDates ? keys.subscriptionDates : ""
          );
          message = message.replace(
            /##Product_Detail##/g,
            keys.ProductDetail ? keys.ProductDetail : ""
          );
          message = message.replace(
            /##Order_Detail##/g,
            keys.OrderDetail ? keys.OrderDetail : ""
          );
          message = message.replace(
            /##Bill_Date##/g,
            keys.BillDate ? keys.BillDate : ""
          );
          message = message.replace(
            /##Bill_Time##/g,
            keys.BillTime ? keys.BillTime : ""
          );
          message = message.replace(
            /##Bill_No##/g,
            keys.BillNo ? keys.BillNo : ""
          );
          message = message.replace(
            /##Supplier_Name##/g,
            keys.supplierName
              ? module.exports.toTitleCase(keys.supplierName)
              : ""
          );
          message = message.replace(
            /##Total_Quantity##/g,
            keys.TotalQty ? keys.TotalQty : ""
          );
          message = message.replace(
            /##Total_Cost##/g,
            keys.TotalCost ? keys.TotalCost : ""
          );

          message = message.replace(
            /##Driver_Name##/g,
            keys.DriverName ? module.exports.toTitleCase(keys.DriverName) : ""
          );
          message = message.replace(
            /##Driver_Mobile##/g,
            keys.DriverMobile ? keys.DriverMobile : ""
          );
          // message = message.replace(/##ProductDetail##/g, keys.ProductDetail ? keys.ProductDetail : '')
          // message = message.replace(/##ProductDetail##/g, keys.ProductDetail ? keys.ProductDetail : '')

          if (keys.type === "user") {
            var toEmail = keys.userEmail;
          } else if (keys.type === "admin") {
            var toEmail = keys.adminEmail;
          } else if (keys.type === "supplier") {
            var toEmail = keys.supplierEmail;
          } else {
            var toEmail = "test@mailinator.com";
          }
          var subject = data.email_subject;
          subject = subject.replace(
            /##Order_Id##/g,
            keys.bookingId ? keys.bookingId : ""
          );
          subject = subject.replace(
            /##Loyalty_Points_Expiry_Date##/g,
            keys.PointExpiryDate ? keys.PointExpiryDate : ""
          );

          var params = {
            to: toEmail,
            //to: "chitrasingh.cs85@gmail.com",
            subject: subject,
            message: message,
          };
          await module.exports.sendDynamicEmail(params, MailLogger);
        }
      });
  },
  sendMail: async (
    email,
    subject,
    name,
    message,
    data,
    orderDetails = null
  ) => {
    try {
      let settings = await Settings.findOne({}).lean();
      let transporter = nodemailer.createTransport({
        host: settings.mail_host,
        port: +settings.mail_port,
        secure: true,
        auth: {
          user: settings.mail_username, // generated ethereal user
          pass: settings.mail_password, // generated ethereal password
        },
      });
      let hostUrl = settings.weblink.split("/#/")[0];
      let apiUrl = settings.apilink;
      var name = name;
      var content = message;
      // order table
      let table = "";
      // order table ends
      var BodyMessage = "";
      //header start
      BodyMessage += `<body style="margin:0;padding:15px;word-spacing:normal;background-color:#f3f3f3;font-family: "Montserrat", sans-serif;font;"><table cellpadding="0" cellspacing="0" width="650" align="center" class="main-table" style="border:1px solid #d1d1d1;border-bottom:5px solid #FEBC15;font-family: "Montserrat", sans-serif;font; font-weight:400;"><thead><tr><th style="text-align:center; padding:0px;background-color:#fff;" class="header-mailer"><table cellpadding="0" cellspacing="0" width="100%" align="center" ><tbody><tr><td style="padding:15px;" class="mailer-logo"><a href="https://www.krishicress.com/"><img src="${apiUrl}/emailimage/footer-mailer-logo.png" style="max-width:100vw;"></a></td></tr><tr><td style="" class="mailer-header"><img src="${apiUrl}/upload/${settings.mailBanner}" style="display:block; max-width:100%;"></td></tr></tbody></table></th></tr></thead><tbody>`;
      BodyMessage += `<tr><td style="background-color:#fff;"><table cellpadding="0" cellspacing="0" width="100%" align="center" class="content-mailer"><tbody><tr><td style="background-color:#fff;padding:30px 15px 15px 15px;" class="mailer-intro"><strong style="text-transform:capitalize;">
            ${name ? `Dear ${module.exports.toTitleCase(name)},` : ""}
            </strong><p style="margin:0px;font-size:14px;color:#323232; font-weight:400;padding-top:10px;">
            ${content}
            </p></td></tr>
            ${table}
            </tbody></table></td></tr>`;
      //footer start
      BodyMessage += `</tbody><tfoot><tr><td style="padding: 0px 0px 10px 10px; background-color:#fff;" class="footer-detail"><table  cellpadding="0" cellspacing="0" width="100%" align="center" class="footer-start"><tbody><tr><td style="padding-bottom:15px;" class="mailr-regard"><table  cellpadding="0" cellspacing="0" width="100%" align="center"><tbody><tr><td style="padding:15px 0px;font-size:14px;font-weight:400;color:#323232;">Thanks<br/>Team Krishi Cress</td></tr></tbody></table></td></tr><tr><td style="padding:15px;" class="mailer-co-info"><table  cellpadding="0" cellspacing="0" width="100%" align="center" class="maile-detail-info"><tbody><tr><td style="width:50%;display:table-cell; padding-right:10px;"> <a href="https://www.krishicress.com/"><img src="${apiUrl}/emailimage/footer-mailer-logo.png"></a></td><td style="width:50%;display:table-cell;padding-left:10px;border-left:1px solid #EBEBEB;"><p class="mailer-phone" style="margin:0px;font-size:14px;"><strong style="font-size:14px;"></strong> <span style="color:#B0B0B0;">Direct to consumer: +917217675253</span></p><p class="mailer-phone" style="margin:0px;font-size:14px;"><strong style="font-size:14px;"></strong> <span style="color:#B0B0B0;">Hospitality and Retail: 9871015333</span></p><p class="web-link" style="margin:0px;"><strong style="font-size:14px;"></strong> <a href="https://www.krishicress.com/" style="text-decoration:none; color:#B0B0B0; font-size:14px;">${settings.weblink}</a></p><p class="mailer-order" style="margin:0px;"><strong style="font-size:14px;"></strong> <a href="mailto:${settings.email1}" style="text-decoration:none; color:#B0B0B0;font-size:14px;">${settings.email1}</a></p><p class="mailer-social" style="margin-bottom:0px;"><span><a href="${settings.facebook}"><img src="${apiUrl}/emailimage/facebook.png"></a></span><span style="padding-left: 5px;"><a href="${settings.instagram}"><img src="${apiUrl}/emailimage/insta.png"></a></span></p></td></tr></tbody></table></td></tr><tr><td style="font-size:12px; color:#A9A9A9;padding:15px;border-top:1px solid #EBEBEB;" class="footr-bottom">${settings.registeredOffice}<br/>Delivering fresh produce, kombucha, artisanal farm products and ferments to Delhi, Gurgaon, Noida and Faridabad daily.</td></tr></tbody></table></td></tr></tfoot></table></body>`;
      let mailOptions = {
        // from: "kcorders@krishicress.com", // sender address
        from: settings.mail_username, // sender address
        to: email.toString(), // list of receivers
        subject: subject, // Subject line
        html: BodyMessage,
        //html: '<p>Html Here</p>'
      };
      let info = await transporter.sendMail(mailOptions);
      return info;
    } catch (err) {
      errorLogger.error(err, "\n", "\n");
    }
  },

  removeNullAndCapitalize(obj) {
    Object.keys(obj).forEach((key) => {
      obj[key] = obj[key]
        ? module.exports.toTitleCase(obj[key].toString())
        : "";
    });
    return obj;
  },

  //custom form validator
  formValidate: function (key, res) {
    //if (value == null) {
    return res.status(400).json({
      status: "error",
      result: key + " required",
    });
    //}
  },

  errorResponce: function (statusCode, error, res) {
    return res.status(statusCode).json({
      status: "error",
      result: err,
      code: 0,
    });
  },

  //booking paynow function
  bookingPayNow: async (paymentDetails, res) => {
    if (
      !paymentDetails.CHANNEL_ID ||
      !paymentDetails.ORDER_ID ||
      !paymentDetails.amount ||
      !paymentDetails.customerId ||
      !paymentDetails.customerEmail ||
      !paymentDetails.customerPhone
    ) {
      res.status(400).send("Payment Failed");
    } else {
      let settings = await Settings.findOne({}).lean();

      let hostUrl = settings.weblink.split("/#/")[0];
      let apiUrl = settings.apilink;

      let [paytm_doc] = await PaymentOptions.aggregate([
        { $match: { name: "Paytm" } },
      ]);

      paytmLogger.debug(
        "sending to paytm following params : ",
        JSON.stringify(paymentDetails)
      );
      if (paymentDetails.CHANNEL_ID === "WAP") {
        var environment = Paytm.LibraryConstants.STAGING_ENVIRONMENT;
        //var environment = Paytm.LibraryConstants.PRODUCTION_ENVIRONMENT;

        var mid = paytm_doc.keys.merchantid;
        var key = paytm_doc.keys.key;
        var website = paytm_doc.keys.website;
        var client_id = paymentDetails.customerId;
        var callbackUrl = apiUrl + "/PaytmResponseCallbackForMobile";

        Paytm.MerchantProperties.setCallbackUrl(callbackUrl);

        Paytm.MerchantProperties.initialize(
          environment,
          mid,
          key,
          client_id,
          website
        );

        var channelId = Paytm.EChannelId.WAP;
        var orderId = paymentDetails.ORDER_ID;
        var txnAmount = Paytm.Money.constructWithCurrencyAndValue(
          Paytm.EnumCurrency.INR,
          paymentDetails.amount
        );
        var userInfo = new Paytm.UserInfo("customer_id");
        var paymentDetailBuilder = new Paytm.PaymentDetailBuilder(
          channelId,
          orderId,
          txnAmount,
          userInfo
        );
        var paymentDetail = paymentDetailBuilder.build();

        var response = Paytm.Payment.createTxnToken(paymentDetail);
        response.then((resdata) => {
          var object = {};
          object.orderId = orderId;
          object.txnAmount = txnAmount;
          object.resdata = resdata;
          return res.status(200).json({
            message: "ok",
            data: object,
            code: 0,
          });
          //res.end();
          //return res
        });
      } else {
        var params = {};
        params["MID"] = paytm_doc.keys.merchantid;
        params["WEBSITE"] = paytm_doc.keys.website;
        params["CHANNEL_ID"] = paymentDetails.CHANNEL_ID;
        params["INDUSTRY_TYPE_ID"] = "Retail";
        params["ORDER_ID"] = paymentDetails.ORDER_ID;
        params["CUST_ID"] = paymentDetails.customerId;
        params["TXN_AMOUNT"] = paymentDetails.amount;
        params["CALLBACK_URL"] = apiUrl + "/PaytmResponseCallback";
        params["EMAIL"] = paymentDetails.customerEmail;
        params["MOBILE_NO"] = paymentDetails.customerPhone;

        checksum_lib.genchecksum(params, paytm_doc.keys.key, function (
          err,
          checksum
        ) {
          var txn_url = paytm_doc.staging
            ? paytm_doc.staging_txn_url
            : paytm_doc.production_txn_url;

          var form_fields = "";
          for (var x in params) {
            form_fields +=
              "<input type='hidden' name='" +
              x +
              "' value='" +
              params[x] +
              "' >";
          }
          form_fields +=
            "<input type='hidden' name='CHECKSUMHASH' value='" +
            checksum +
            "' >";

          res.writeHead(200, { "Content-Type": "text/html" });
          res.write(
            '<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' +
              txn_url +
              '" name="f1">' +
              form_fields +
              '</form><script type="text/javascript">document.f1.submit();</script></body></html>'
          );
          res.end();
        });
      }
    }
  },

  //update paymnet status in booking of user
  updatePaymentStatusByPaytm: async (post_data, paymentStatus, res) => {
    var booking_id = post_data.ORDERID;

    let settings = await Settings.findOne({}).lean();

    let hostUrl = settings.weblink.split("/#/")[0];
    let apiUrl = settings.apilink;
    if (paymentStatus == "Failed") {
      var BookingStatusByAdmin = "Failed";
    } else {
      var BookingStatusByAdmin = "Pending";
    }
    var updateData = {
      payment: paymentStatus,
      MID: post_data.MID,
      TXNID: post_data.TXNID,
      TXNAMOUNT: post_data.TXNAMOUNT,
      PAYMENTMODE: post_data.PAYMENTMODE,
      CURRENCY: post_data.CURRENCY,
      TXNDATE: post_data.TXNDATE,
      STATUS: post_data.STATUS,
      RESPCODE: post_data.RESPCODE,
      RESPMSG: post_data.RESPMSG,
      GATEWAYNAME: post_data.GATEWAYNAME,
      BANKTXNID: post_data.BANKTXNID,
      BANKNAME: post_data.BANKNAME,
      CHECKSUMHASH: post_data.CHECKSUMHASH,
      BookingStatusByAdmin: BookingStatusByAdmin,
    };
    let data = await bookingDataBase.updateMany(
      { booking_code: post_data.ORDERID },
      { $set: updateData }
    );

    let CreateBookingData = await bookingDataBase
      .findOne({ booking_code: post_data.ORDERID })
      .lean();

    try {
      if (paymentStatus == "Complete") {
        var bookingID = CreateBookingData._id;
        await module.exports.reduceQtyFormproductAndInventory(bookingID, res);
        await module.exports.processLoyaltyAndRefferal(
          post_data.ORDERID,
          settings.loyalityProgramOnOff,
          settings.refferalPointsOnOff
        );
        await addToCartDataBase.findOneAndUpdate(
          { user_id: CreateBookingData.user_id },
          {
            $set: {
              user_id: CreateBookingData.user_id,
              totalCartPrice: 0,
              CartDetail: [],
            },
          }
        );
      }

      let notifs = await OnOffDataBase.findOne({}).lean();
      var orderDetails = {
        name: CreateBookingData.userName,
        booking_code: CreateBookingData.booking_code,
        createDate: CreateBookingData.createDate,
        BookingStatusByAdmin: CreateBookingData.BookingStatusByAdmin,
        products: CreateBookingData.bookingdetail,
        address:
          CreateBookingData.booking_address.address +
          ", " +
          CreateBookingData.booking_address.locality +
          ", " +
          CreateBookingData.booking_address.city,
        paymentMethod: CreateBookingData.paymentmethod,
        paymentStatus: CreateBookingData.payment,
        gst: CreateBookingData.gst ? CreateBookingData.gst : 0,
        allGstLists: CreateBookingData.allGstLists,
        totalCartPrice: CreateBookingData.totalCartPriceWithoutGST
          ? CreateBookingData.totalCartPriceWithoutGST
          : 0,
        deliveryCharges: CreateBookingData.deliveryCharges
          ? CreateBookingData.deliveryCharges
          : 0,
        adminDiscount: CreateBookingData.adminDiscount
          ? CreateBookingData.adminDiscount
          : 0,
        discountAmount: CreateBookingData.discountAmount
          ? CreateBookingData.discountAmount
          : 0,
        redeemDiscount: CreateBookingData.redeemDiscount
          ? CreateBookingData.redeemDiscount
          : 0,
        referralDiscount: CreateBookingData.referralDiscount
          ? CreateBookingData.referralDiscount
          : 0,
        codCharges: CreateBookingData.codCharges
          ? CreateBookingData.codCharges
          : 0,
        total_payment: CreateBookingData.total_payment
          ? CreateBookingData.total_payment
          : 0,
        deliverySlot: CreateBookingData.deliverySlot
          ? CreateBookingData.deliverySlot
          : "",
      };
      var ProductDetail = await module.exports.OrderDetails(orderDetails);
      var email = CreateBookingData.userEmail;
      var contactNumber = CreateBookingData.userMobile;
      var name = CreateBookingData.userName;

      let selectedNotif =
        paymentStatus == "Failed" ? notifs.order_failed : notifs.order_placed;
      if (paymentStatus == "Failed") {
      } else {
        let data = CreateBookingData.booking_code;
        var mobileMsg = `Thank you for ordering at Krishi Cress. Your order ${data} has been placed. Questions? Get in touch with us +919667066462 or email us.`;
        var mobile = CreateBookingData.userMobile;
        if (notifs.order_placed.sms) {
          module.exports.sendOtp(mobile, mobileMsg);
        }
      }

      if (selectedNotif.user_email) {
        var template_name =
          paymentStatus == "Failed"
            ? "order failed mail to user"
            : "order place mail to user";
        var keys = {
          userName: module.exports.toTitleCase(name),
          userMobile: mobile,
          OrderDetail: ProductDetail,
          type: "user",
          template_name: template_name,
          userEmail: email,
        };
        module.exports.dynamicEmail(keys);
        //module.exports.sendMail(email, subject, name, message, data, orderDetails);
      }

      let users = await Admin.find(
        { user_role: { $in: selectedNotif.admin_roles } },
        { username: 1, email: 1 }
      ).lean();

      if (selectedNotif.admin_email) {
        users.forEach((user) => {
          var template_name =
            paymentStatus == "Failed"
              ? "order failed mail to admin"
              : "order place mail to admin";
          var keys = {
            userName: module.exports.toTitleCase(name),
            userMobile: mobile,
            userEmail: email,
            OrderDetail: ProductDetail,
            type: "admin",
            template_name: template_name,
            adminEmail: user.email,
            adminName: user.username,
          };
          commodule.exportsmon.dynamicEmail(keys);
        });
      }

      res.statusCode = 302;
      if (paymentStatus == "Complete")
        res.setHeader("Location", hostUrl + "/thankyou");
      else res.setHeader("Location", hostUrl + "/failed/" + booking_id);
      return res.end();
    } catch (err) {
      errorLogger.error(err, "\n", "\n");
      console.log("errorr in booking :::::: ", err);
      res.statusCode = 302;
      if (paymentStatus == "Complete")
        res.setHeader("Location", hostUrl + "/thankyou");
      else res.setHeader("Location", hostUrl + "/failed/" + booking_id);
      return res.end();
    }
  },

  // Paytm methods for Subscription
  SubscriptionPayNow: async (paymentDetails, res) => {
    var ab = "WAP";
    let settings = await Settings.findOne({}).lean();

    let hostUrl = settings.weblink.split("/#/")[0];
    let apiUrl = settings.apilink;

    let [paytm_doc] = await PaymentOptions.aggregate([
      { $match: { name: "Paytm" } },
    ]);
    //paymentDetails.CHANNEL_ID

    paytmLogger.debug(
      "sending to paytm following params : ",
      JSON.stringify(paymentDetails)
    );
    if (paymentDetails.CHANNEL_ID === "WAP") {
      var environment = Paytm.LibraryConstants.STAGING_ENVIRONMENT;
      //var environment = Paytm.LibraryConstants.PRODUCTION_ENVIRONMENT;

      // var mid = "JLAwJU93944774287842";
      // var key = "3BrUaj7p5XLu!B9d";
      // var website = "WEBSTAGING";
      var mid = paytm_doc.keys.merchantid;
      var key = paytm_doc.keys.key;
      var website = paytm_doc.keys.website;
      var client_id = paymentDetails.customerId;

      var callbackUrl = apiUrl + "/PaytmResponseCallbackForSubscriptionsMobile";
      //var callbackUrl = "http://18.190.24.89:3003/PaytmResponseCallbackForSubscriptionsMobile";
      Paytm.MerchantProperties.setCallbackUrl(callbackUrl);

      Paytm.MerchantProperties.initialize(
        environment,
        mid,
        key,
        client_id,
        website
      );

      var channelId = Paytm.EChannelId.WAP;
      var orderId = paymentDetails.ORDER_ID;
      var txnAmount = Paytm.Money.constructWithCurrencyAndValue(
        Paytm.EnumCurrency.INR,
        paymentDetails.amount
      );
      var userInfo = new Paytm.UserInfo("customer_id");
      var paymentDetailBuilder = new Paytm.PaymentDetailBuilder(
        channelId,
        orderId,
        txnAmount,
        userInfo
      );
      var paymentDetail = paymentDetailBuilder.build();
      var response = Paytm.Payment.createTxnToken(paymentDetail);

      response.then((resdata) => {
        var object = {};
        object.orderId = orderId;
        object.txnAmount = txnAmount;
        object.resdata = resdata;
        return res.status(200).json({
          message: "ok",
          data: object,
          code: 0,
        });
        //res.end();
        //return res
      });
    } else {
      var params = {};
      params["MID"] = paytm_doc.keys.merchantid;
      params["WEBSITE"] = paytm_doc.keys.website;
      params["CHANNEL_ID"] = paymentDetails.CHANNEL_ID;
      params["INDUSTRY_TYPE_ID"] = "Retail";
      params["ORDER_ID"] = paymentDetails.ORDER_ID;
      params["CUST_ID"] = paymentDetails.customerId;
      params["TXN_AMOUNT"] = paymentDetails.amount;
      params["CALLBACK_URL"] =
        apiUrl + "/PaytmResponseCallbackForSubscriptions";
      params["EMAIL"] = paymentDetails.customerEmail;
      params["MOBILE_NO"] = paymentDetails.customerPhone;
      // params["EXTEND_INFO"] = JSON.stringify({
      //     udf1: paymentDetails.customerId,
      // });

      checksum_lib.genchecksum(params, paytm_doc.keys.key, function (
        err,
        checksum
      ) {
        var txn_url = paytm_doc.staging
          ? paytm_doc.staging_txn_url
          : paytm_doc.production_txn_url;

        var form_fields = "";
        for (var x in params) {
          form_fields +=
            "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
        }
        form_fields +=
          "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";

        res.writeHead(200, { "Content-Type": "text/html" });
        res.write(
          '<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' +
            txn_url +
            '" name="f1">' +
            form_fields +
            '</form><script type="text/javascript">document.f1.submit();</script></body></html>'
        );
        res.end();
      });
    }
  },

  updatePaymentStatusByPaytmForSubscriptions: async (
    post_data,
    paymentStatus,
    _result,
    res
  ) => {
    var SubscriptionID = post_data.ORDERID;

    let settings = await Settings.findOne({}).lean();

    let hostUrl = settings.weblink.split("/#/")[0];
    let apiUrl = settings.apilink;
    if (paymentStatus == "Complete") {
      var updateData = {
        payment: "Complete",
        MID: post_data.MID,
        TXNID: post_data.TXNID,
        TXNAMOUNT: post_data.TXNAMOUNT,
        PAYMENTMODE: post_data.PAYMENTMODE,
        CURRENCY: post_data.CURRENCY,
        TXNDATE: post_data.TXNDATE,
        STATUS: post_data.STATUS,
        RESPCODE: post_data.RESPCODE,
        RESPMSG: post_data.RESPMSG,
        GATEWAYNAME: post_data.GATEWAYNAME,
        BANKTXNID: post_data.BANKTXNID,
        BANKNAME: post_data.BANKNAME,
        CHECKSUMHASH: post_data.CHECKSUMHASH,
      };
      Subscriptions.findOneAndUpdate(
        { SubscriptionID },
        { $set: updateData },
        async (err, isUpdated) => {
          let sub = await Subscriptions.findOne({ SubscriptionID }).lean();
          if (sub.preOrder === true) {
            var subPrimeryID = sub._id;
            await module.exports.reducePreOrderQtyFormproductAndInventory(
              subPrimeryID
            );
            await module.exports.processLoyaltyAndRefferal(
              SubscriptionID,
              settings.loyalityProgramOnOff,
              settings.refferalPointsOnOff
            );
          }
          var regionID = sub.regionID;
          var user_id = sub.user_id;
          if (err) {
            return res.status(500).json({
              message: "error",
              error: err,
              code: 0,
            });
          } else {
            let jsonData = {
              user_id: user_id,
              totalCartPrice: 0,
              regionID: regionID,
              CartDetail: [],
            };

            addToCartDataBase.findOneAndUpdate(
              { user_id: user_id },
              { $set: jsonData },
              { new: true },
              async function (err, data) {
                if (err) {
                  return res.status(500).json({
                    message: "error in emptying the cart",
                    error: err,
                    code: 0,
                  });
                } else {
                  let notifs = await OnOffDataBase.findOne({}).lean();
                  let userData = await User.findOne({
                    _id: user_id,
                  });

                  var orderDetails = {
                    name: sub.userName,
                    SubscriptionID: SubscriptionID,
                    createDate: sub.createDate,
                    BookingStatusByAdmin: sub.BookingStatusByAdmin,
                    products: sub.bookingdetail,
                    address:
                      sub.booking_address.address +
                      ", " +
                      sub.booking_address.locality +
                      ", " +
                      sub.booking_address.city,
                    paymentMethod: sub.paymentmethod,
                    paymentStatus: sub.payment,
                    gst: sub.gst ? sub.gst : 0,
                    allGstLists: sub.allGstLists,
                    totalCartPrice: sub.totalCartPriceWithoutGST
                      ? sub.totalCartPriceWithoutGST
                      : 0,
                    deliveryCharges: sub.deliveryCharges
                      ? sub.deliveryCharges
                      : 0,
                    adminDiscount: sub.adminDiscount ? sub.adminDiscount : 0,
                    discountAmount: sub.discountAmount ? sub.discountAmount : 0,
                    redeemDiscount: sub.redeemDiscount ? sub.redeemDiscount : 0,
                    referralDiscount: sub.referralDiscount
                      ? sub.referralDiscount
                      : 0,
                    codCharges: sub.codCharges ? sub.codCharges : 0,
                    total_payment: sub.total_payment ? sub.total_payment : 0,
                    dates: sub.dates,
                    preOrder: sub.preOrder,
                    deliverySlot: sub.deliverySlot ? sub.deliverySlot : "",
                  };

                  if (orderDetails.preOrder === true) {
                    var abc = "on the pre-order date";
                    var adminAbc = "on the pre-order date";
                  } else {
                    var abc = "to you on the following days";
                    var adminAbc = "on the following days";
                  }

                  var email = userData.email;
                  var name = userData.name;
                  let subject = "Order Placed Successfully";
                  var message = `<p>Thank You for placing your order with Krishi Cress. It will be delivered ${abc} –<br/>
              ${orderDetails.dates
                .map((item) => `${item.date.toDateString()}`)
                .join(`, </br>`)}
              <p> Please see subscription details below.</p>`;
                  var adminMessage = `A subscription has been placed successfully. It will be delivered ${adminAbc} – <br/> 
            ${orderDetails.dates
              .map((item) => `${item.date.toDateString()}`)
              .join(`, <br/>`)}
            <p> Please see subscription details below.</p>
            <p><strong>Name: </strong>${module.exports.toTitleCase(name)}</p>
              <p style="margin-top: -10px;"><strong>Mobile: </strong>${
                userData.contactNumber
              }</p>
              <p style="margin-top: -10px;"><strong>Email: </strong>${email}</p>`;

                  var data = SubscriptionID;
                  if (notifs.subscription_placed.user_email) {
                    module.exports.sendMail(
                      email,
                      subject,
                      name,
                      message,
                      data,
                      orderDetails
                    );
                  }

                  let users = await Admin.find(
                    {
                      user_role: {
                        $in: notifs.subscription_placed.admin_roles,
                      },
                    },
                    { username: 1, email: 1 }
                  ).lean();

                  if (notifs.subscription_placed.admin_email) {
                    users.forEach((user) => {
                      module.exports.sendMail(
                        user.email,
                        subject,
                        user.username,
                        adminMessage,
                        data,
                        orderDetails
                      );
                    });
                  }

                  res.statusCode = 302;
                  res.setHeader("Location", hostUrl + "/thankyou");
                  return res.end();
                }
              }
            );
          }
        }
      );
    } else {
      Subscriptions.deleteOne({ SubscriptionID })
        .then(function () {
          // res.status(400).json({
          //   message: "error",
          //   data: _result.RESPMSG,
          //   status: _result.STATUS,
          //   code: 0,
          // });
          res.statusCode = 302;
          res.setHeader("Location", hostUrl + "/failed/" + SubscriptionID);
          res.end();
        })
        .catch(function (error) {
          errorLogger.error(err, "\n", "\n");
          // res.status(400).json({
          //   message: "error",
          //   data: _result.RESPMSG,
          //   status: _result.STATUS,
          //   code: 0,
          // });
          res.statusCode = 302;
          res.setHeader("Location", hostUrl + "/failed/" + SubscriptionID);
          res.end();
        });
    }
  },

  // Paytm methods for Wallet
  WalletPayNow: async (paymentDetails, res) => {
    let settings = await Settings.findOne({}).lean();

    let hostUrl = settings.weblink.split("/#/")[0];
    let apiUrl = settings.apilink;

    let [paytm_doc] = await PaymentOptions.aggregate([
      { $match: { name: "Paytm" } },
    ]);
    console.log("walletPayNow paytm_doc ::: ", paytm_doc);

    if (paymentDetails.CHANNEL_ID === "WAP") {
      var environment = Paytm.LibraryConstants.STAGING_ENVIRONMENT;
      //var environment = Paytm.LibraryConstants.PRODUCTION_ENVIRONMENT;

      // var mid = "JLAwJU93944774287842";
      // var key = "3BrUaj7p5XLu!B9d";
      // var website = "WEBSTAGING";
      var mid = paytm_doc.keys.merchantid;
      var key = paytm_doc.keys.key;
      var website = paytm_doc.keys.website;
      var client_id = paymentDetails.customerId;

      var callbackUrl = apiUrl + "/PaytmResponseCallbackForWalletsMobile";
      //var callbackUrl = "http://18.190.24.89:3003/PaytmResponseCallbackForWalletsMobile";
      Paytm.MerchantProperties.setCallbackUrl(callbackUrl);

      Paytm.MerchantProperties.initialize(
        environment,
        mid,
        key,
        client_id,
        website
      );

      var channelId = Paytm.EChannelId.WAP;
      var orderId = paymentDetails.ORDER_ID;
      var txnAmount = Paytm.Money.constructWithCurrencyAndValue(
        Paytm.EnumCurrency.INR,
        paymentDetails.amount
      );
      var userInfo = new Paytm.UserInfo("customer_id");
      var paymentDetailBuilder = new Paytm.PaymentDetailBuilder(
        channelId,
        orderId,
        txnAmount,
        userInfo
      );
      var paymentDetail = paymentDetailBuilder.build();
      var response = Paytm.Payment.createTxnToken(paymentDetail);

      response.then((resdata) => {
        var object = {};
        object.orderId = orderId;
        object.txnAmount = txnAmount;
        object.resdata = resdata;
        return res.status(200).json({
          message: "ok",
          data: object,
          code: 0,
        });
        //res.end();
        //return res
      });
    } else {
      var params = {};
      params["MID"] = paytm_doc.keys.merchantid;
      params["WEBSITE"] = paytm_doc.keys.website;
      params["CHANNEL_ID"] = "WEB";
      params["INDUSTRY_TYPE_ID"] = "Retail";
      params["ORDER_ID"] = paymentDetails.ORDER_ID;
      params["CUST_ID"] = paymentDetails.customerId;
      params["TXN_AMOUNT"] = paymentDetails.amount;
      params["CALLBACK_URL"] = apiUrl + "/PaytmResponseCallbackForWallets";
      params["EMAIL"] = paymentDetails.customerEmail;
      params["MOBILE_NO"] = paymentDetails.customerPhone;

      checksum_lib.genchecksum(params, paytm_doc.keys.key, function (
        err,
        checksum
      ) {
        var txn_url = paytm_doc.staging
          ? paytm_doc.staging_txn_url
          : paytm_doc.production_txn_url;

        var form_fields = "";
        for (var x in params) {
          form_fields +=
            "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
        }
        form_fields +=
          "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";

        res.writeHead(200, { "Content-Type": "text/html" });
        res.write(
          '<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' +
            txn_url +
            '" name="f1">' +
            form_fields +
            '</form><script type="text/javascript">document.f1.submit();</script></body></html>'
        );
        console.log("sending paytm html !!!!");
        res.end();
      });
    }
  },

  updatePaymentStatusByPaytmForWallets: async (
    post_data,
    paymentStatus,
    res
  ) => {
    let user_id = post_data.ORDERID.split("-")[0];

    let settings = await Settings.findOne({}).lean();

    let hostUrl = settings.weblink.split("/#/")[0];
    let apiUrl = settings.apilink;

    console.log("updatePaymentStatusByPaytmForWallets ends");

    if (paymentStatus == "Complete") {
      var walletHistory = {
        user_id,
        amount: post_data.TXNAMOUNT,
        type: "credit",
        paymentStatus: "Complete",
        TXNID: post_data.TXNID,
        TXNAMOUNT: post_data.TXNAMOUNT,
        PAYMENTMODE: post_data.PAYMENTMODE,
        CURRENCY: post_data.CURRENCY,
        TXNDATE: post_data.TXNDATE,
        STATUS: post_data.STATUS,
        RESPCODE: post_data.RESPCODE,
        RESPMSG: post_data.RESPMSG,
        GATEWAYNAME: post_data.GATEWAYNAME,
        BANKTXNID: post_data.BANKTXNID,
        BANKNAME: post_data.BANKNAME,
        CHECKSUMHASH: post_data.CHECKSUMHASH,
      };

      User.findOneAndUpdate(
        { _id: user_id },
        { $inc: { walletAmount: post_data.TXNAMOUNT } },
        (err, updated) => {
          if (err) {
            res.status(500).json({
              msg: "Something went wrong",
              status: "error while updating wallet amount",
              error: err,
              code: 0,
            });
          } else {
            WalletHistories.create(walletHistory, async (err, doc) => {
              if (err) {
                res.status(500).json(err);
              } else {
                let notifs = await OnOffDataBase.findOne({}).lean();

                let userData = await User.findOne({
                  _id: user_id,
                });
                //let message = `An amount of Rs ${post_data.TXNAMOUNT} has been successfully credited to your wallet`;

                let name = userData.name;
                let contactNumber = userData.contactNumber;
                let email = userData.email;
                let subject = "Money added to wallet successfully!";
                let data = "Money added to wallet successfully!";
                // module.exports.sendOtp(contactNumber, message);
                if (notifs.wallet_add.user_email) {
                  var keys = {
                    userName: name,
                    walletAmount: post_data.TXNAMOUNT,
                    type: "user",
                    template_name: "wallet money added mail to user",
                    userEmail: email,
                  };
                  module.exports.dynamicEmail(keys);
                  //module.exports.sendMail(email, subject, name, message, data);
                }

                let users = await Admin.find(
                  { user_role: { $in: notifs.wallet_add.admin_roles } },
                  { username: 1, email: 1 }
                ).lean();
                //   admin user message
                let adminMessage = ``;

                if (notifs.wallet_add.admin_email) {
                  users.forEach((user) => {
                    var keys = {
                      userName: name,
                      userMobile: userData.contactNumber,
                      walletAmount: post_data.TXNAMOUNT,
                      type: "admin",
                      template_name: "wallet money added mail to admin",
                      userEmail: email,
                      adminEmail: user.email,
                      adminName: user.username,
                    };
                    module.exports.dynamicEmail(keys);
                  });
                }

                res.statusCode = 302;
                res.setHeader("Location", hostUrl + "/#/Thank-you");
                return res.end();

                // res.status(200).json({
                //     message: "ok",
                //     data: "wallet money added successfully",
                //     code: 1,
                // });
              }
            });
          }
        }
      );
    } else {
      res.statusCode = 302;
      res.setHeader("Location", hostUrl + "/failed");
      return res.end();
    }
  },

  // reduceLostQtyFromInventory: async (product_id, regionID, qty, voucherType, variant_name = null) => {
  //   console.log(product_id, regionID, qty, voucherType);
  //   try {
  //     var lostQTY = voucherType == "lost" ? qty : 0;
  //     var returnQTY = voucherType == "return" ? qty : 0;
  //     var inhouseQTY = voucherType == "inhouse" ? qty : 0;

  //     //qty reduce from inventory
  //     let remaining_qty = +qty;
  //     let skip = 0;
  //     while (+remaining_qty !== 0) {
  //       {
  //         console.log("ab");
  //         let data = await inventoryItemTable
  //           .find({
  //             product_id: product_id,
  //             region: regionID,
  //             availableQuantity: { $gt: 0 },
  //           })
  //           .sort({
  //             created_at: 1,
  //           })
  //           // .skip(skip)
  //           .limit(1)
  //           .lean();
  //         let check = false;
  //         if (data.length > 0) {
  //           let inventory = data[0];
  //           let inventory_id = inventory._id;
  //           delete inventory._id;
  //           //console.log(inventory, "lost inventory");

  //           if (+remaining_qty <= +inventory.availableQuantity) {
  //             // remove remaining_qty from this single record and exit loop
  //             var lostQTY = voucherType == "lost" ? +remaining_qty : 0;
  //             var returnQTY = voucherType == "return" ? +remaining_qty : 0;
  //             var inhouseQTY = voucherType == "inhouse" ? +remaining_qty : 0;

  //             inventory.availableQuantity = Decimal(+inventory.availableQuantity).minus(remaining_qty);
  //             // inventory.lostQuantity = Decimal(+inventory.lostQuantity).plus(
  //             //   lostQTY
  //             // );
  //             inventory.returnQuantity = Decimal(+inventory.returnQuantity).plus(returnQTY);
  //             inventory.inhouseQuantity = Decimal(+inventory.inhouseQuantity).plus(inhouseQTY);
  //             inventory.lostQuantity = Decimal(+inventory.lostQuantity).plus(lostQTY);

  //             check = true;
  //           } else {
  //             console.log("elseeeeeeeeeeeeeeeeeeeeeeee");
  //             // make this single record empty and get next in line record and reduce the extra from it
  //             var lostQTY = voucherType == "lost" ? +qty : 0;
  //             var returnQTY = voucherType == "return" ? +qty : 0;
  //             var inhouseQTY = voucherType == "inhouse" ? +qty : 0;
  //             if (voucherType == "lost") {
  //               var qtyReduce = lostQTY;
  //             } else if (voucherType == "return") {
  //               var qtyReduce = returnQTY;
  //             } else if (voucherType == "inhouse") {
  //               var qtyReduce = inhouseQTY;
  //             }
  //             inventory.lostQuantity = Decimal(+qty).plus(lostQTY);

  //             inventory.returnQuantity = Decimal(+inventory.returnQuantity).plus(returnQTY);

  //             inventory.inhouseQuantity = Decimal(+inventory.inhouseQuantity).plus(inhouseQTY);

  //             inventory.availableQuantity = Number(Decimal(+inventory.availableQuantity).minus(+qtyReduce));

  //             inventory.product_expiry = inventory.product_expiry ? inventory.product_expiry : null;

  //             remaining_qty = Number(Decimal(+remaining_qty).minus(+qty));
  //             skip++;
  //           }

  //           //console.log(inventory);
  //           await inventoryItemTable.findOneAndUpdate(
  //             {
  //               _id: inventory_id,
  //             },
  //             {
  //               $set: inventory,
  //             }
  //           );
  //         } else {
  //           break;
  //         }
  //         if (check) {
  //           break;
  //         }
  //       }
  //     }
  //   } catch (err) {
  //     errorLogger.error(err, "\n", "\n");
  //     console.log("errorr in reduceLostQtyFromInventory :::::: ", err);
  //   }
  // },

  reduceLostQtyFromInventory: async (
    product_id,
    regionID,
    qty,
    voucherType,
    variant_name 
  ) => {
    try {
      var lostQTY = voucherType == "lost" ? qty : 0;
      var returnQTY = voucherType == "return" ? qty : 0;
      var inhouseQTY = voucherType == "inhouse" ? qty : 0;

      //qty reduce from inventory
      let remaining_qty = +qty;
      let skip = 0;
      while (+remaining_qty !== 0) {
        {
          console.log("ab");
          let obj = {
            product_id: product_id,
            region: regionID,
            availableQuantity: { $gt: 0 },
          }
          if(variant_name){
            obj = { ...obj,variant_name:variant_name}
          }
          let data = await inventoryItemTable
            .find(obj)
            .sort({
              created_at: 1,
            })
            // .skip(skip)
            .limit(1)
            .lean();
          let check = false;
          if (data.length > 0) {
            //console.log(data, "datadatadatadatadata");
            let inventory = data[0];
            let inventory_id = inventory._id;
            delete inventory._id;
            //console.log(inventory, "lost inventory");
            let reducedQty = 0;
            if (+remaining_qty <= +inventory.availableQuantity) {
              reducedQty = +remaining_qty;
              // remove remaining_qty from this single record and exit loop
              var lostQTY = voucherType == "lost" ? +reducedQty : 0;
              var returnQTY = voucherType == "return" ? +reducedQty : 0;
              var inhouseQTY = voucherType == "inhouse" ? +reducedQty : 0;

              inventory.availableQuantity = Decimal(
                +inventory.availableQuantity
              ).minus(reducedQty);
              // inventory.lostQuantity = Decimal(+inventory.lostQuantity).plus(
              //   lostQTY
              // );
              inventory.returnQuantity = Decimal(
                +inventory.returnQuantity
              ).plus(returnQTY);
              inventory.inhouseQuantity = Decimal(
                +inventory.inhouseQuantity
              ).plus(inhouseQTY);
              inventory.lostQuantity = Decimal(+inventory.lostQuantity).plus(
                lostQTY
              );

              check = true;
            } else {
              reducedQty = +inventory.availableQuantity;
              // make this single record empty and get next in line record and reduce the extra from it
              var lostQTY = voucherType == "lost" ? +reducedQty : 0;
              var returnQTY = voucherType == "return" ? +reducedQty : 0;
              var inhouseQTY = voucherType == "inhouse" ? +reducedQty : 0;
              if (voucherType == "lost") {
                var qtyReduce = lostQTY;
              } else if (voucherType == "return") {
                var qtyReduce = returnQTY;
              } else if (voucherType == "inhouse") {
                var qtyReduce = inhouseQTY;
              }

              inventory.lostQuantity = Decimal(+inventory.lostQuantity).plus(
                lostQTY
              );

              inventory.returnQuantity = Decimal(
                +inventory.returnQuantity
              ).plus(returnQTY);

              inventory.inhouseQuantity = Decimal(
                +inventory.inhouseQuantity
              ).plus(inhouseQTY);

              inventory.availableQuantity = Number(
                Decimal(+inventory.availableQuantity).minus(+qtyReduce)
              );

              inventory.product_expiry = inventory.product_expiry
                ? inventory.product_expiry
                : null;

              remaining_qty = Number(
                Decimal(+remaining_qty).minus(+reducedQty)
              );
              console.log(
                Number(Decimal(+remaining_qty).minus(+reducedQty)),
                " Number(Decimal(+remaining_qty).minus(+qty))"
              );
              skip++;
            }

            await inventoryItemTable.findOneAndUpdate(
              {
                _id: inventory_id,
              },
              {
                $set: inventory,
              }
            );
          } else {
            break;
          }
          if (check) {
            break;
          }
        }
      }
    } catch (err) {
      errorLogger.error(err, "\n", "\n");
      console.log("errorr in reduceLostQtyFromInventory :::::: ", err);
    }
  },
  //preorder qty code start########################################
  //qty reduce form inventory and product in case of preorder booking
  reducePreOrderQty: async (
    product_id,
    regionID,
    qty,
    subPrimeryID,
    MainProductId,
    res
  ) => {
    try {
      //qty reduce from inventory
      let remaining_qty = qty;
      let skip = 0;
      while (+remaining_qty !== 0) {
        let prevInventory = null;
        let nextInventory = null;
        {
          // simple inventory reduction
          let data = await inventoryItemTable
            .find({
              product_id: product_id,
              region: regionID,
              availableQuantity: { $gt: 0 },
            })
            .sort({
              created_at: 1,
            })
            // .skip(skip)
            .limit(1)
            .lean();
          // console.log("inside 1");
          let check = false;
          console.log(data, "chitraaaaaaaaaaaaaaaaaaaaaaaaa");
          if (data.length > 0) {
            let inventory = data[0];
            let inventory_id = inventory._id;
            delete inventory._id;

            let reducedQty = 0;
            if (remaining_qty <= +inventory.availableQuantity) {
              // remove remaining_qty from this single record and exit loop
              reducedQty = +remaining_qty;
              inventory.bookingQuantity = Decimal(
                +inventory.bookingQuantity
              ).plus(+reducedQty);
              inventory.availableQuantity = Number(
                Decimal(+inventory.availableQuantity).minus(+reducedQty)
              );

              check = true;
            } else {
              // make this single record empty and get next in line record and reduce the extra from it
              reducedQty = +inventory.availableQuantity;
              inventory.bookingQuantity = Decimal(
                +inventory.bookingQuantity
              ).plus(+reducedQty);
              inventory.availableQuantity = Number(
                Decimal(+inventory.availableQuantity).minus(+reducedQty)
              );
              remaining_qty = Number(
                Decimal(+remaining_qty).minus(+reducedQty)
              );
              skip++;
            }

            await inventoryItemTable.findOneAndUpdate(
              {
                _id: inventory_id,
              },
              {
                $set: inventory,
              }
            );
            await Subscriptions.update(
              { _id: subPrimeryID },
              {
                $push: {
                  inventory_ids: {
                    inventory_id,
                    product_id,
                    qty: reducedQty,
                    variant_name: null,
                  },
                },
              }
            );

            // console.log("inside 3");
          } else {
            break;
          }
          if (check) {
            break;
          }
        }
      }
    } catch (err) {
      errorLogger.error(err, "\n", "\n");
      console.log("errorr in reducePreOrderQty :::::: ", err);
    }
  },

  reducePreOrderQtyFormproductAndInventory: async (subPrimeryID) => {
    try {
      var CreateBookingData = await Subscriptions.findOne({
        _id: subPrimeryID,
      }).lean();
      var BookingDetail = CreateBookingData.bookingdetail;

      for (var z = 0; z < BookingDetail.length; z++) {
        var BookingDetailZ = BookingDetail[z];
        var MainProductId = BookingDetailZ.product_id._id;

        //if (BookingDetailZ.preOrder === false) {
        if (BookingDetailZ.TypeOfProduct == "group") {
          for (let j = 0; j < BookingDetailZ.groupData.length; j++) {
            let set = BookingDetailZ.groupData[j];
            let setQty = 0;
            for (let k = 0; k < set.sets.length; k++) {
              let product_id = set.sets[k].product._id;
              var regionID = CreateBookingData.regionID;
              var qty = (set.sets[k].package
                ? Decimal(set.sets[k].package.packet_size)
                : Decimal(set.sets[k].unitQuantity)
              )
                .times(set.sets[k].qty)
                .times(BookingDetailZ.qty);
              qty = qty ? qty : 0;
              await module.exports.reducePreOrderQty(
                product_id,
                regionID,
                +qty,
                subPrimeryID,
                MainProductId
              );
            }
          }
        } else if (BookingDetailZ.TypeOfProduct == "simple") {
          var product_id = BookingDetailZ.product_id._id;
          var regionID = CreateBookingData.regionID;
          var qty = (BookingDetailZ.without_package
            ? Decimal(BookingDetailZ.unitQuantity)
            : Decimal(BookingDetailZ.simpleItem.packet_size)
          ).times(BookingDetailZ.qty);
          qty = qty ? qty : 0;
          await module.exports.reducePreOrderQty(
            product_id,
            regionID,
            +qty,
            subPrimeryID,
            MainProductId
          );
        } else {
          var product_id = BookingDetailZ.product_id._id;
          var regionID = CreateBookingData.regionID;
          var qty = Decimal(BookingDetailZ.unitQuantity).times(
            BookingDetailZ.qty
          );
          qty = qty ? qty : 0;
          await module.exports.reducePreOrderQty(
            product_id,
            regionID,
            +qty,
            subPrimeryID,
            MainProductId,
            BookingDetailZ.variant_name
          );
        }
        //}
      }
    } catch (err) {
      errorLogger.error(err, "\n", "\n");
      console.log(
        "errorr in reducePreOrderQtyFormproductAndInventory :::::: ",
        err
      );
    }
  },

  reversePreOrderQtyToInventory: async (subPrimeryID) => {
    try {
      let CreateBookingData = await Subscriptions.findOne({
        _id: subPrimeryID,
      }).lean();
      var inventory_ids = CreateBookingData.inventory_ids;
      for (const obj of inventory_ids) {
        {
          // update inventory
          await inventoryItemTable.findOneAndUpdate(
            { _id: obj.inventory_id },
            {
              $inc: {
                bookingQuantity: -obj.qty,
                availableQuantity: obj.qty,
              },
            }
          );
        }
        {
          // pull inventory ids array from booking
          await Subscriptions.update(
            { _id: subPrimeryID },
            {
              $pull: {
                inventory_ids: obj,
              },
            }
          );
        }
      }
      console.log("preorder qty Reversedddddddddddddddddd");
    } catch (err) {
      errorLogger.error(err, "\n", "\n");
      console.log("errorr in reverseQtyToInventory :::::: ", err);
    }
  },
  //preorder qty code end

  //reduce qty function start while booking
  reduceQty: async (
    product_id,
    regionID,
    qty,
    bookingID,
    MainProductId,
    variant_name
  ) => {
    let timeStamp = +new Date();
    try {
      ilogger.info(
        "starting for id " +
          timeStamp +
          " :::::: " +
          JSON.stringify({
            product_id,
            regionID,
            total_quantity: qty,
            bookingID,
            MainProductId,
            variant_name,
          })
      );

      //qty reduce from inventory
      let remaining_qty = qty;
      let skip = 0;
      while (+remaining_qty !== 0) {
        {
          // simple inventory reduction
          let data = await inventoryItemTable
            .find({
              product_id: product_id,
              region: regionID,
              availableQuantity: { $gt: 0 },
            })
            .sort({
              created_at: 1,
            })
            // .skip(skip)
            .lean();
            if(variant_name){
              data = data.filter((cur)=>cur.variant_name = variant_name)
            }
          // console.log("inside 1");
          let check = false;
          if (data.length > 0) {
            let inventory = data[0];
            let inventory_id = inventory._id;
            delete inventory._id;

            let reducedQty = 0;
            console.log(remaining_qty, inventory.availableQuantity);
            if (remaining_qty <= +inventory.availableQuantity) {
              // remove remaining_qty from this single record and exit loop
              console.log(
                "remove remaining_qty from this single record and exit loop"
              );
              reducedQty = +remaining_qty;
              inventory.bookingQuantity = Decimal(
                +inventory.bookingQuantity
              ).plus(+reducedQty);
              inventory.availableQuantity = Number(
                Decimal(+inventory.availableQuantity).minus(+reducedQty)
              );

              check = true;
            } else {
              // make this single record empty and get next in line record and reduce the extra from it
              console.log(
                "make this single record empty and get next in line record and reduce the extra from it"
              );
              reducedQty = +inventory.availableQuantity;
              inventory.bookingQuantity = Decimal(
                +inventory.bookingQuantity
              ).plus(+reducedQty);
              inventory.availableQuantity = Number(
                Decimal(+inventory.availableQuantity).minus(+reducedQty)
              );
              remaining_qty = Number(
                Decimal(+remaining_qty).minus(+reducedQty)
              );
              skip++;
            }

            await inventoryItemTable.findOneAndUpdate(
              {
                _id: inventory_id,
              },
              {
                $set: inventory,
              }
            );
            await bookingDataBase.updateOne(
              { _id: bookingID },
              {
                $push: {
                  inventory_ids: {
                    inventory_id,
                    product_id,
                    qty: reducedQty,
                    variant_name: null,
                  },
                },
              }
            );

            // console.log("inside 3");
          } else {
            break;
          }
          if (check) {
            break;
          }
        }
      }

      ilogger.info("end successfull for id " + timeStamp);
    } catch (err) {
      errorLogger.error(err, "\n", "\n");
      console.log("errorr in reduceQty :::::: ", err);
    }
  },

  reduceQtyFormproductAndInventory: async (bookingID) => {
    try {
      const e = new Error();
      const Location = e.stack.split("\n")[2].split(" at ")[1];

      ilogger.debug("Reduce Quantity Start");
      ilogger.trace(Location);

      let CreateBookingData = await bookingDataBase
        .findOne({
          _id: bookingID,
        })
        .lean();

      ilogger.info(
        "booking Id and code: ",
        bookingID,
        CreateBookingData.booking_code
      );
      var BookingDetail = CreateBookingData.bookingdetail;

      for (var z = 0; z < BookingDetail.length; z++) {
        var BookingDetailZ = BookingDetail[z];
        var MainProductId = BookingDetailZ.product_id._id;
        //if (BookingDetailZ.preOrder === false) {
        if (BookingDetailZ.TypeOfProduct == "group") {
          for (let j = 0; j < BookingDetailZ.groupData.length; j++) {
            let set = BookingDetailZ.groupData[j];
            let setQty = 0;
            for (let k = 0; k < set.sets.length; k++) {
              let product_id = set.sets[k].product._id;
              var regionID = CreateBookingData.regionID;
              var qty = (set.sets[k].package
                ? Decimal(set.sets[k].package.packet_size)
                : Decimal(set.sets[k].unitQuantity)
              )
                .times(set.sets[k].qty)
                .times(BookingDetailZ.qty);
              qty = qty ? qty : 0;
              await module.exports.reduceQty(
                product_id,
                regionID,
                +qty,
                bookingID,
                MainProductId
              );
            }
          }
        } else if (BookingDetailZ.TypeOfProduct == "simple") {
          var product_id = BookingDetailZ.product_id._id;
          var regionID = CreateBookingData.regionID;
          var qty = (BookingDetailZ.without_package
            ? Decimal(BookingDetailZ.unitQuantity)
            : Decimal(BookingDetailZ.simpleItem.packet_size)
          ).times(BookingDetailZ.qty);
          qty = qty ? qty : 0;
          await module.exports.reduceQty(
            product_id,
            regionID,
            +qty,
            bookingID,
            MainProductId
          );
        } else {
          var product_id = BookingDetailZ.product_id._id;
          var regionID = CreateBookingData.regionID;
          // var qty = Decimal(BookingDetailZ.unitQuantity).times(
          //   BookingDetailZ.qty
          // );
          qty = qty ? qty : 0;
          await module.exports.reduceQty(
            product_id,
            regionID,
            +qty,
            bookingID,
            MainProductId,
            BookingDetailZ.variant_name
          );
        }
        //}
      }

      var ab = await bookingDataBase.updateMany(
        { _id: bookingID },
        { $set: { qtyReduce: true } }
      );
      ilogger.debug("Reduce Quantity End", "\n");
    } catch (err) {
      errorLogger.error(err, "\n", "\n");
      console.log("errorr in reduceQtyFormproductAndInventory :::::: ", err);
    }
  },
  //end code

  // reverse quantity code start-------------------------------------
  reverseQtyToInventory: async (bookingID) => {
    try {
      let CreateBookingData = await bookingDataBase
        .findOne({ _id: bookingID })
        .lean();

      var inventory_ids = CreateBookingData.inventory_ids;

      ilogger.info(
        "reverseQty start for booking_id " + CreateBookingData.booking_code
      );
      for (const obj of inventory_ids) {
        ilogger.info("reverseQty item ::: " + obj);
        {
          // update inventory
          await inventoryItemTable.findOneAndUpdate(
            { _id: obj.inventory_id },
            {
              $inc: {
                bookingQuantity: -obj.qty,
                availableQuantity: obj.qty,
              },
            }
          );
        }
        {
          // pull inventory ids array from booking
          await bookingDataBase.update(
            { _id: bookingID },
            {
              $pull: {
                inventory_ids: obj,
              },
            }
          );
        }
      }

      ilogger.info(
        "reverseQty end for booking_id " + CreateBookingData.booking_code
      );
    } catch (err) {
      errorLogger.error(err, "\n", "\n");
      console.log("errorr in reverseQtyToInventory :::::: ", err);
    }
  },

  processLoyaltyAndRefferal: async (
    orderId,
    loyalityProgramOnOff,
    refferalPointsOnOff
  ) => {
    try {
      let order;
      if (orderId.includes("KC")) {
        order = await bookingDataBase
          .findOne({
            booking_code: orderId,
          })
          .lean();
      } else {
        order = await Subscriptions.findOne({
          SubscriptionID: orderId,
        }).lean();
      }

      let userData = await User.findOne({
        _id: mongoose.Types.ObjectId(order.user_id),
      }).lean();

      if (loyalityProgramOnOff == "on") {
        // add redeem history (loyalty points)

        if (order.redeem_point) {
          await LoyalityProgramHistory.create({
            user_id: order.user_id,
            [orderId.includes("KC") ? "orderID" : "subscriptionID"]: order._id,
            [orderId.includes("KC")
              ? "booking_code"
              : "subscription_code"]: orderId,
            point:
              Math.round(Number(order.redeem_point)) *
              (orderId.includes("KC") ? 1 : order.dates.length),
            pointStatus: "Redeemed",
            loyalityName: order.loyaltyProgram.name,
            loyalityPercentage: order.loyaltyProgram.redeem,
          });

          //var email = userData.email;
          // var email = "chitra@mailinator.com";
          // var name = userData.name;
          // var subject = "Redeemed Loyalty Points";
          // var message = `Congratualtion, you have just redeemed ${Math.round(Number(order.redeem_point))} loyalty points by placing order on Krishi Cress.`;

          // var data = orderId;

          // await common.sendMail(email, subject, name, message, data);
        }

        // add loyalty points gained history
        let pointsGained =
          (Number(order.total_payment) *
            Number(order.loyaltyProgram.accumulation)) /
          100;
        await LoyalityProgramHistory.create({
          user_id: order.user_id,
          [orderId.includes("KC") ? "orderID" : "subscriptionID"]: order._id,
          [orderId.includes("KC")
            ? "booking_code"
            : "subscription_code"]: orderId,
          point:
            Math.round(Number(pointsGained)) *
            (orderId.includes("KC") ? 1 : order.dates.length),
          pointStatus: "Added",
          loyalityName: order.loyaltyProgram.name,
          loyalityPercentage: order.loyaltyProgram.accumulation,
          TotalAmount:
            +order.total_payment *
            (orderId.includes("KC") ? 1 : order.dates.length),
        });

        //var email = userData.email;
        // var email = "chitra@mailinator.com";
        // var name = userData.name;
        // var subject = "Gained Loyalty Points";
        // var message = `Congratualtion, you have just gained ${Math.round(Number(pointsGained))} loyalty points by placing order on Krishi Cress.`;

        // var data = orderId;

        // await common.sendMail(email, subject, name, message, data);

        var ab = await User.findOneAndUpdate(
          { _id: userData._id },
          {
            $set: { oneweek: false, twentyfourhour: false },
            $inc: {
              TotalPoint:
                Math.round(+pointsGained) *
                  (orderId.includes("KC") ? 1 : order.dates.length) -
                Math.round(+order.redeem_point) *
                  (orderId.includes("KC") ? 1 : order.dates.length),
            },
          }
        );
      }

      // referral discount
      if (refferalPointsOnOff == "on" && order.referralDiscount > 0) {
        var referralUser = await User.findOne({
          myRefferalCode: userData.refferalCodeFrom,
        }).lean();

        // add loyalty points to referral user
        let pointsGained =
          userData.NoOfOrder + userData.prevNoOfOrder == 0
            ? 50
            : userData.NoOfOrder + userData.prevNoOfOrder == 1
            ? 100
            : 150;
        // console.log(
        //     "pointsGained::::::::::::::::",
        //     pointsGained
        // );
        await LoyalityProgramHistory.create({
          user_id: referralUser._id,
          [orderId.includes("KC") ? "orderID" : "subscriptionID"]: order._id,
          [orderId.includes("KC")
            ? "booking_code"
            : "subscription_code"]: orderId,
          point: Number(pointsGained),
          pointStatus: "Added",
          reason: `Referral Benefit for order ${
            userData.NoOfOrder + userData.prevNoOfOrder + 1
          } placed by ${userData.name}`,
          TotalAmount:
            order.total_payment *
            (orderId.includes("KC") ? 1 : order.dates.length),
        });

        if (notifs.referral_benefit.user_email) {
          var email = referralUser.email;
          var name = referralUser.name;
          var point = Number(pointsGained);
          var referralBy = module.exports.toTitleCase(referralUser.name);
          var data = orderId;
          var keys = {
            userName: module.exports.toTitleCase(name),
            Referral_Benefit_Points: point,
            Referral_By: referralBy,
            type: "user",
            template_name: "referral benefit mail to user",
            userEmail: email,
          };
          await module.exports.dynamicEmail(keys);
          //common.sendMail(email, subject, name, message, data);
        }

        // var d = new Date();
        // d.setDate(d.getDate() + 90);
        // let expiryDate = new Date(
        //     d
        // );

        await User.findOneAndUpdate(
          {
            _id: referralUser._id,
          },
          {
            $inc: {
              TotalPoint: pointsGained,
            },
          }
        );
      }

      var d = new Date();
      d.setDate(d.getDate() + 90);
      let expiryDate = new Date(d);

      await User.findOneAndUpdate(
        { _id: userData._id },
        {
          $inc: {
            NoOfOrder: 1,
          },
          LastOrderDate: new Date(),
          expiryDate: expiryDate,
        }
      );
    } catch (err) {
      errorLogger.error(err, "\n", "\n");
      console.log("errorr in processLoyaltyAndRefferal :::::: ", err);
    }
  },
  uniqueFieldsCheckerForAdd: async function (uniqueFields, database, res, req) {
    var error = {};
    for (i = 0; i < uniqueFields.length; i++) {
      var filterData = await database.find(uniqueFields[i]);
      var fld = uniqueFields[i];
      if (filterData.length > 0) {
        error[Object.keys(fld)[0]] = "already exist";
      }
    }
    return error;
  },
  uniqueFieldsCheckerForUpdate: async function (
    _id,
    uniqueFields,
    database,
    res,
    req
  ) {
    var error = {};
    for (i = 0; i < uniqueFields.length; i++) {
      var filterData = await database.find(uniqueFields[i]);
      var fld = uniqueFields[i];
      if (filterData.length > 0) {
        if (filterData[0]._id != _id) {
          error[Object.keys(fld)[0]] = "already exist";
        }
      }
    }
    return error;
  },
  uniqueId: function (length) {
    var result = "";
    var characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  },

  //common function to get all document from collection
  GetAllDocument: async function (StagesData, database, req, res) {
    try {
      console.log(StagesData, "hhhhhhhhhhhhhhhh", database);
      let GetData = await database.aggregate([
        ...StagesData,
        {
          $facet: {
            resultData: [{ $match: {} }],
            pageInfo: [{ $count: "TotalRecords" }],
          },
        },
      ]);
      if (GetData) {
        console.log(GetData[0].resultData);
        return res.status(200).json({
          data: GetData[0] ? GetData[0].resultData : null,
          error: null,
          success: true,
        });
      } else {
        return res
          .status(404)
          .json({ data: "no data found", error: null, success: false });
      }
    } catch (err) {
      console.log(err);
      return res
        .status(500)
        .json({ data: "Something Went Wrong", error: err, success: false });
    }
  },

  //common function to get one document from collection
  GetOneDocument: async function (StagesData, _id, database, req, res) {
    try {
      let missing = module.exports.bodyValidate({ _id });
      if (missing && missing.length > 0) {
        return res.status(403).json({ required: missing, success: false });
      }
      let GetData = await database.aggregate(StagesData);
      if (GetData.length > 0) {
        return res
          .status(200)
          .json({ data: GetData, error: null, success: true });
      } else {
        return res
          .status(404)
          .json({ data: "No data found", error: null, success: false });
      }
    } catch (err) {
      console.log(err);
      return res
        .status(500)
        .json({ data: "Something Went Wrong", error: err, success: false });
    }
  },

  //common function to delete document from collection
  DeleteDocument: async function (_id, database, req, res) {
    try {
      let missing = module.exports.bodyValidate({ _id });
      if (missing && missing.length > 0) {
        return res.status(403).json({ required: missing, success: false });
      }
      let GetData = await database.remove({ _id: _id });
      return res
        .status(200)
        .json({ data: "Data Deleted", error: null, success: true });
    } catch (err) {
      console.log(err);
      return res
        .status(500)
        .json({ data: "Something Went Wrong", error: err, success: false });
    }
  },

  StateCode: (state) => {
    if (state) {
      if (state === "Andhra Pradesh" || state === "andhra pradesh") {
        return "37";
      }
      if (state === "Arunachal Pradesh" || state === "arunachal pradesh") {
        return "12";
      }
      if (state === "Assam" || state === "assam") {
        return "18";
      }
      if (state === "Bihar" || state === "bihar") {
        return "10";
      }
      if (state === "Chattisgarh" || state === "chattisgarh") {
        return "22";
      }
      if (state === "Delhi" || state === "delhi") {
        return "07";
      }
      if (state === "Goa" || state === "goa") {
        return "30";
      }
      if (state === "Gujarat" || state === "gujarat") {
        return "24";
      }
      if (state === "Haryana" || state === "haryana") {
        var ab = "06";
        return ab;
      }
      if (state === "Himachal Pradesh" || state === "himachal pradesh") {
        return "02";
      }
      if (state === "Jammu and Kashmir" || state === "jammu and kashmir") {
        return "01";
      }
      if (state === "Jharkhand" || state === "jharkhand") {
        return "20";
      }
      if (state === "Karnataka" || state === "karnataka") {
        return "29";
      }
      if (state === "Kerala" || state === "kerala") {
        return "32";
      }
      if (state === "Lakshadweep Islands" || state === "lakshadweep islands") {
        return "31";
      }
      if (state === "Madhya Pradesh" || state === "madhya pradesh") {
        return "23";
      }
      if (state === "Maharashtra" || state === "maharashtra") {
        return "27";
      }
      if (state === "Manipur" || state === "manipur") {
        return "14";
      }
      if (state === "Meghalaya" || state === "meghalaya") {
        return "17";
      }
      if (state === "Mizoram" || state === "mizoram") {
        return "15";
      }
      if (state === "Nagaland" || state === "nagaland") {
        return "13";
      }
      if (state === "Odisha" || state === "odisha") {
        return "21";
      }
      if (state === "Pondicherry" || state === "pondicherry") {
        return "34";
      }
      if (state === "Punjab" || state === "punjab") {
        return "03";
      }
      if (state === "Rajasthan" || state === "rajasthan") {
        return "08";
      }
      if (state === "Sikkim" || state === "sikkim") {
        return "11";
      }
      if (state === "Tamil Nadu" || state === "tamil nadu") {
        return "33";
      }
      if (state === "Telangana" || state === "telangana") {
        return "36";
      }
      if (state === "Tripura" || state === "tripura") {
        return "16";
      }
      if (state === "Uttar Pradesh" || state === "uttar pradesh") {
        return "09";
      }
      if (state === "Uttarakhand" || state === "uttarakhand") {
        return "05";
      }
      if (state === "West Bengal" || state === "west bengal") {
        return "19";
      }
      if (
        state === "Andaman and Nicobar Islands" ||
        state === "andaman and Nicobar Islands"
      ) {
        return "35";
      }
      if (state === "Chandigarh" || state === "chandigarh") {
        return "04";
      }
      if (
        state === "Dadra & Nagar Haveli and Daman & Diu" ||
        state === "dadra & nagar haveli and daman & diu"
      ) {
        return "26";
      }
      if (state === "Ladakh" || state === "ladakh") {
        return "38";
      }
    } else {
      null;
    }
  },

  logger,
  ilogger,
  paytmLogger,
  paytmStatusLogger,
  orderStatusLogs,
  ThresholdLogger,
  OutOfStockLogger,
  iBodyLogger,
  errorLogger,
};
