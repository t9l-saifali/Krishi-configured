require("./api/data/db.js");
const http = require("http");
const https = require("https");
var express = require("express");
var app = express();
var path = require("path");
var bodyParser = require("body-parser");
var routes = require("./api/routes");
const fs = require("fs");
var common = require("./common");
const { paytmLogger } = common;

var TimeZone = require("moment-timezone");
// require("./whatsapp");

const Paytm = require("paytm-pg-node-sdk");
const PaytmChecksum = require("./Paytm/PaytmChecksum");
const axios = require("axios");
const dateMiddleware = require("./api/middlewares/date.js");
var mongoose = require("mongoose");

var bookingDataBase = mongoose.model("bookings");
var Subscription = mongoose.model("subscriptions");

// const socketModule = require("./socket");

// var DevOptions = {
//   key: fs.readFileSync("../key.pem"),
//   cert: fs.readFileSync("../cert.pem"),
// };

// var options = {
//   key: fs.readFileSync("/home/krishicress/www/privkey.pem"),
//   cert: fs.readFileSync("/home/krishicress/www/cert.pem"),
// };

// Listen for requests
// const port = process.env.PORT || 3003;
// const server = https.createServer(app);

// socketModule.setServer(server);

// server.listen(port, function () {
//   var port = server.address().port;
//   console.log("Magic happens on port " + port);
// });

// const server = http.createServer(app);
// server.listen(port);
// console.log("Magic happens on port " + port);

app.use(
  express.urlencoded({
    limit: "50mb",
    parameterLimit: 100000,
    extended: "true",
  })
);
app.use(express.json({ limit: "150mb" }));
//app.use(dateMiddleware.substract530)
//app.use(express.bodyParser({limit: '100mb'}));
//**********************///////////////////////////
const qs = require("querystring");
const checksum_lib = require("./Paytm/checksum");
const config = require("./Paytm/config");
const parseUrl = express.urlencoded({ extended: false });
const parseJson = express.json({ extended: false });

app.get("/", (req, res) => {
  // Subscription.resetCount(function (err, nextCount) {
  //   res.status(400).json({
  //     msg: "ok",
  //     data: "0",
  //   });
  // });
  // bookingDataBase.resetCount(function (err, nextCount) {
  //   res.status(400).json({
  //     msg: "ok",
  //     data: "0",
  //   });
  // });
  res.status(400).json({
    msg: "error",
    data: "not found anything",
  });
});

app.post("/getPlaceSuggestions", (req, res) => {
  let query = req.body.query ? req.body.query : "";
  let google_API_key = "AIzaSyDzzqGUOXRM1nD-WL-sfX3ZS96_yfV0Nao";
  let uri = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${google_API_key}`;
  let encodedURI = encodeURI(uri);
  axios
    .get(encodedURI)
    .then((response) => {
      res.status(200).json({
        msg: "ok",
        data: response.data,
      });
    })
    .catch((error) => {
      res.status(500).json({
        msg: "something went wrong",
        data: [],
      });
    });
});

// app.post("/paynow", [parseUrl, parseJson], (req, res) => {
//   // Route for making payment

//   var paymentDetails = {
//     amount: req.body.amount,
//     customerId: req.body.name,
//     customerEmail: req.body.email,
//     customerPhone: req.body.phone,
//   };
//   if (!paymentDetails.amount || !paymentDetails.customerId || !paymentDetails.customerEmail || !paymentDetails.customerPhone) {
//     res.status(400).send("Payment failed");
//   } else {
//     var params = {};
//     params["MID"] = config.PaytmConfig.mid;
//     params["WEBSITE"] = config.PaytmConfig.website;
//     params["CHANNEL_ID"] = "WEB";
//     params["INDUSTRY_TYPE_ID"] = "Retail";
//     params["ORDER_ID"] = "TEST_" + new Date().getTime();
//     params["CUST_ID"] = paymentDetails.customerId;
//     params["TXN_AMOUNT"] = paymentDetails.amount;
//     params["CALLBACK_URL"] = "https://krishicress.store:3003/PaytmResponseCallback";
//     params["EMAIL"] = paymentDetails.customerEmail;
//     params["MOBILE_NO"] = paymentDetails.customerPhone;

//     checksum_lib.genchecksum(params, config.PaytmConfig.key, function (err, checksum) {
//       var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for staging
//       // var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for production

//       var form_fields = "";
//       for (var x in params) {
//         form_fields += "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
//       }
//       form_fields += "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";

//       res.writeHead(200, { "Content-Type": "text/html" });
//       res.write(
//         '<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' +
//           txn_url +
//           '" name="f1">' +
//           form_fields +
//           '</form><script type="text/javascript">document.f1.submit();</script></body></html>'
//       );
//       res.end();
//     });
//   }
// });

app.get("/genratePaytmLink", (req, res) => {
  var paytmParams = {};
  paytmParams.body = {
    mid: "dHEEmJ20619257356211",
    linkName: "Test",
    linkDescription: "Test Payment",
    linkType: "GENERIC",
    amount: 100,
  };

  PaytmChecksum.generateSignature(
    JSON.stringify(paytmParams.body),
    "&1qSpwi2UdJkmMta"
  ).then(function (checksum) {
    paytmParams.head = {
      tokenType: "AES",
      signature: checksum,
    };

    var post_data = JSON.stringify(paytmParams);
    var options = {
      /* for Staging */
      //$url = "https://securegw.paytm.in/link/create";

      /* for Production */
      // $url = "https://securegw.paytm.in/link/create";
      /* for Staging */
      hostname: "securegw.paytm.in",

      /* for Production */
      // hostname: 'securegw.paytm.in',

      port: 443,
      path: "/link/create",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": post_data.length,
      },
    };

    var response = "";
    var post_req = https.request(options, function (post_res) {
      post_res.on("data", function (chunk) {
        response += chunk;
      });
      post_res.on("end", function () {
        res.json(response);
      });
    });
    post_req.write(post_data);
    post_req.end();
  });
});
app.post("/PaytmResponseCallback", (req, res) => {
  // Route for verifiying payment
  var body = req.body;
  var html = "";
  var post_data = req.body;

  // verify the checksum
  var checksumhash = post_data.CHECKSUMHASH;
  // delete post_data.CHECKSUMHASH;
  var result = checksum_lib.verifychecksum(
    post_data,
    config.PaytmConfig.key,
    checksumhash
  );

  // Send Server-to-Server request to verify Order Status
  var params = { MID: config.PaytmConfig.mid, ORDERID: post_data.ORDERID };

  checksum_lib.genchecksum(params, config.PaytmConfig.key, function (
    err,
    checksum
  ) {
    params.CHECKSUMHASH = checksum;
    post_data = "JsonData=" + JSON.stringify(params);

    var options = {
      //hostname: 'securegw.paytm.in', // for staging
      hostname: "securegw.paytm.in", // for production
      port: 443,
      path: "/merchant-status/getTxnStatus",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": post_data.length,
      },
    };

    // Set up the request
    var response = "";
    var post_req = https.request(options, function (post_res) {
      post_res.on("data", function (chunk) {
        response += chunk;
      });

      post_res.on("end", async function () {
        var _result = JSON.parse(response);
        var RESdata = req.body;
        console.log(RESdata);

        paytmLogger.debug(
          "/PaytmResponseCallback :::::: ",
          "getting following from paytm : ",
          JSON.stringify(RESdata)
        );

        if (RESdata.STATUS == "TXN_SUCCESS") {
          var paymentStatus = "Complete";
          await common.updatePaymentStatusByPaytm(RESdata, paymentStatus, res);
          //res.send('payment sucess')
        } else {
          var paymentStatus = "Failed";
          await common.updatePaymentStatusByPaytm(RESdata, paymentStatus, res);
        }
      });
    });

    // post the data
    post_req.write(post_data);
    post_req.end();
  });
});

//webhook url
app.post("/PaytmResponseWebhook", async (req, res) => {

  var resData = res.req.body
  var ORDERID = res.req.body.ORDERID
 
  if (resData.STATUS == "TXN_FAILURE") {
    var BookingStatusByAdmin = "Failed";
    var paymentStatus = "Failed"
  } 
  if (resData.STATUS == "TXN_SUCCESS") {
    var BookingStatusByAdmin = "Pending";
    var paymentStatus = "Complete"
  }
  var updateData = {
    payment: paymentStatus,
    MID: resData.MID,
    TXNID: resData.TXNID,
    TXNAMOUNT: resData.TXNAMOUNT,
    PAYMENTMODE: resData.PAYMENTMODE,
    CURRENCY: resData.CURRENCY,
    TXNDATE: resData.TXNDATE,
    STATUS: resData.STATUS,
    RESPCODE: resData.RESPCODE,
    RESPMSG: resData.RESPMSG,
    GATEWAYNAME: resData.GATEWAYNAME,
    BANKTXNID: resData.BANKTXNID,
    BANKNAME: resData.BANKNAME,
    CHECKSUMHASH: resData.CHECKSUMHASH,
    BookingStatusByAdmin: BookingStatusByAdmin,
    TXNDATETIME:resData.TXNDATETIME
  };
  let data = await bookingDataBase.updateMany({ booking_code: ORDERID }, { $set: updateData });
});

//callback url for mobile paytm
app.post("/PaytmResponseCallbackForMobile", (req, res) => {
  // Route for verifiying payment
  var orderId = req.body.ORDERID;
  var readTimeout = 80000;
  var paymentStatusDetailBuilder = new Paytm.PaymentStatusDetailBuilder(
    orderId
  );
  var paymentStatusDetail = paymentStatusDetailBuilder
    .setReadTimeout(readTimeout)
    .build();
  var response = Paytm.Payment.getPaymentStatus(paymentStatusDetail);
  var RESdata = req.body;

  paytmLogger.debug(
    "/PaytmResponseCallbackForMobile :::::: ",
    "getting following from paytm : ",
    JSON.stringify(RESdata)
  );
  if (req.body.STATUS == "TXN_SUCCESS") {
    var paymentStatus = "Complete";
    common.updatePaymentStatusByPaytm(RESdata, paymentStatus, res);
    //res.send('payment sucess')
  } else {
    var paymentStatus = "Failed";
    common.updatePaymentStatusByPaytm(RESdata, paymentStatus, res);
  }
});

app.post("/PaytmResponseCallbackForSubscriptionsMobile", (req, res) => {
  // Route for verifiying payment
  var orderId = req.body.ORDERID;
  var readTimeout = 80000;
  var paymentStatusDetailBuilder = new Paytm.PaymentStatusDetailBuilder(
    orderId
  );
  var paymentStatusDetail = paymentStatusDetailBuilder
    .setReadTimeout(readTimeout)
    .build();
  var response = Paytm.Payment.getPaymentStatus(paymentStatusDetail);
  var RESdata = req.body;

  var RESdata = req.body;

  paytmLogger.debug(
    "/PaytmResponseCallbackForSubscriptionsMobile :::::: ",
    "getting following from paytm : ",
    JSON.stringify(RESdata)
  );
  var paymentStatus = req.body.STATUS == "TXN_SUCCESS" ? "Complete" : "Failed";
  common.updatePaymentStatusByPaytmForSubscriptions(
    RESdata,
    paymentStatus,
    res
  );
});

app.post("/PaytmResponseCallbackForSubscriptions", (req, res) => {
  // Route for verifiying payment
  var body = req.body;
  var html = "";
  var post_data = req.body;
  // verify the checksum
  var checksumhash = post_data.CHECKSUMHASH;
  // delete post_data.CHECKSUMHASH;
  var result = checksum_lib.verifychecksum(
    post_data,
    config.PaytmConfig.key,
    checksumhash
  );

  // Send Server-to-Server request to verify Order Status
  var params = { MID: config.PaytmConfig.mid, ORDERID: post_data.ORDERID };
  console.log("params=====> ", params);
  checksum_lib.genchecksum(params, config.PaytmConfig.key, function (
    err,
    checksum
  ) {
    params.CHECKSUMHASH = checksum;
    post_data = "JsonData=" + JSON.stringify(params);

    var options = {
      hostname: "securegw.paytm.in", // for staging
      // hostname: 'securegw.paytm.in', // for production
      port: 443,
      path: "/merchant-status/getTxnStatus",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": post_data.length,
      },
    };

    // Set up the request
    var response = "";
    var post_req = https.request(options, function (post_res) {
      post_res.on("data", function (chunk) {
        response += chunk;
      });

      post_res.on("end", function () {
        var _result = JSON.parse(response);
        console.log("_result ", _result);
        var RESdata = req.body;

        paytmLogger.debug(
          "/PaytmResponseCallbackForSubscriptions :::::: ",
          "getting following from paytm : ",
          JSON.stringify(RESdata)
        );
        var paymentStatus =
          _result.STATUS == "TXN_SUCCESS" ? "Complete" : "Failed";
        common.updatePaymentStatusByPaytmForSubscriptions(
          RESdata,
          paymentStatus,
          _result,
          res
        );
      });
    });

    // post the data
    post_req.write(post_data);
    post_req.end();
  });
});

app.post("/PaytmResponseCallbackForWalletsMobile", (req, res) => {
  // Route for verifiying payment
  var orderId = req.body.ORDERID;
  var readTimeout = 80000;
  var paymentStatusDetailBuilder = new Paytm.PaymentStatusDetailBuilder(
    orderId
  );
  var paymentStatusDetail = paymentStatusDetailBuilder
    .setReadTimeout(readTimeout)
    .build();
  var response = Paytm.Payment.getPaymentStatus(paymentStatusDetail);
  var RESdata = req.body;

  var RESdata = req.body;
  var paymentStatus = req.body.STATUS == "TXN_SUCCESS" ? "Complete" : "Failed";
  common.updatePaymentStatusByPaytmForWallets(RESdata, paymentStatus, res);
});
app.post("/PaytmResponseCallbackForWallets", (req, res) => {
  // Route for verifiying payment
  var body = req.body;

  var html = "";
  var post_data = req.body;
  // verify the checksum
  var checksumhash = post_data.CHECKSUMHASH;
  // delete post_data.CHECKSUMHASH;
  var result = checksum_lib.verifychecksum(
    post_data,
    config.PaytmConfig.key,
    checksumhash
  );

  // Send Server-to-Server request to verify Order Status
  var params = { MID: config.PaytmConfig.mid, ORDERID: post_data.ORDERID };

  checksum_lib.genchecksum(params, config.PaytmConfig.key, function (
    err,
    checksum
  ) {
    params.CHECKSUMHASH = checksum;
    post_data = "JsonData=" + JSON.stringify(params);

    var options = {
      hostname: "securegw.paytm.in", // for staging
      // hostname: 'securegw.paytm.in', // for production
      port: 443,
      path: "/merchant-status/getTxnStatus",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": post_data.length,
      },
    };

    // Set up the request
    var response = "";
    var post_req = https.request(options, function (post_res) {
      post_res.on("data", function (chunk) {
        response += chunk;
      });

      post_res.on("end", function () {
        var _result = JSON.parse(response);
        var RESdata = req.body;
        var paymentStatus =
          _result.STATUS == "TXN_SUCCESS" ? "Complete" : "Failed";
        common.updatePaymentStatusByPaytmForWallets(
          RESdata,
          paymentStatus,
          res
        );
      });
    });

    // post the data
    post_req.write(post_data);
    post_req.end();
  });
});
///////////////////////////////////////////////////////////////////////
// app.use(bodyParser.json({
//     type: 'application/vnd.api+json'
// }));

app.use(function (req, res, next) {
  // var allowedOrigins = ['http://172.16.14.246:3000','http://172.16.14.23:3000','http://172.16.15.203:3000','http://18.190.24.89','https://krishicress.store']
  // var origin = req.headers.origin;
  // if (allowedOrigins.includes(origin)) {
  //    res.setHeader('Access-Control-Allow-Origin', origin);
  // }
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,HEAD,OPTIONS,POST,PUT,DELETE"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, contentType,Content-Type, Accept, Authorization"
  );
  next();
});

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// Add middleware to console log every request

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, contentType,Content-Type, Accept, Authorization"
  );
  next();
});

// Set static directory before defining routes
app.use(express.static(path.join(__dirname, "public")));

// Enable parsing of posted forms
// app.use(bodyParser.urlencoded({ extended: true }));

// Add some routing
app.use("/api", routes);

// // Listen for requests
// var server = app.listen(app.get("port"), function () {
//     var port = server.address().port;
//     console.log("Magic happens on port " + port);
// });

/* define server port here*/
// const port = process.env.PORT || 3003;
// const server = https.createServer(options, app);
// server.listen(port);
// console.log("Magic happens on port " + port);
const server = app.listen(process.env.PORT || 1234, (err) => {
  if (err) {
    console.log("Error During Server Start " + JSON.stringify(err));
  } else {
    console.log("Server Start At " + server.address().port);
  }
});