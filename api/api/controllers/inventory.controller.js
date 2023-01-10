var mongoose = require("mongoose");
var inventoryTable = mongoose.model("inventory");
var inventoryItemTable = mongoose.model("inventory_items");
var Admin = mongoose.model("admin");
var ProductDataBase = mongoose.model("products");
var SupplierMastersTable = mongoose.model("supplier_masters");
var RegionTable = mongoose.model("regions");
var Roles = mongoose.model("role");
var multer = require("multer");
var moment = require("moment-timezone");
var nodemailer = require("nodemailer");
var common = require("../../common.js");
var Company = mongoose.model("companies");
var OnOffDataBase = mongoose.model("email_sms_on_off");
const mongodb = require("mongodb");

const iBodyLogger = common.iBodyLogger;
var errorLogger = common.errorLogger;

// For Decimal Precision
const Decimal = require("decimal.js");

const numWords = require("num-words");

// pdf-creator-node
// const pdf = require("pdf-creator-node");
var pdf = require("html-pdf");
const fs = require("fs");
const Path = require("path");

const { PDFDocument, rgb } = require("pdf-lib");

var fileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/upload/");
  },
  filename: function (req, file, cb) {
    var ext = file.mimetype.split("/");
    cb(null, uniqueId(10) + "" + Date.now() + "." + ext[1]);
  },
});
var upload = multer({
  storage: fileStorage,
}).any();

const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const { Decimal128 } = require("bson");

function uniqueId(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function getImageName(files, image) {
  for (var j = 0; j < files.length; j++) {
    if (files[j].originalname == image) {
      return files[j].filename;
    }
  }
}

// module.exports.AddOne = async function (req, res) {
//   var ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
//   // console.log(ip);
//   // return;
//   iBodyLogger.info("Adding New Inventory");
//   iBodyLogger.debug(JSON.stringify(req.body), "\n", "\n", "\n");
//   var supplier_id = req.body.supplier_id;
//   var admin_id = req.body.admin_id;
//   var InvoiceNumber = req.body.InvoiceNumber;

//   if (
//     supplier_id == "" ||
//     !supplier_id ||
//     supplier_id == undefined ||
//     supplier_id == null
//   ) {
//     common.formValidate("supplier_id", res);
//     return false;
//   }
//   if (
//     admin_id == "" ||
//     !admin_id ||
//     admin_id == undefined ||
//     admin_id == null
//   ) {
//     common.formValidate("admin_id", res);
//     return false;
//   }

//   let notifs = await OnOffDataBase.findOne({}).lean();
//   let inventory_notifs = notifs?.inventory_add;

//   var createDate_formatted = moment
//     .utc(req.body.InvoiceDate)
//     .tz("Asia/Kolkata");
//   var InvoiceDate = createDate_formatted.format("DD-MM-YYYY");
//   var error = {};
//   // console.log(req.body)
//   // console.log(nameFilter, 'nameFilter')
//   let GetFilter = [];
//   if (InvoiceNumber) {
//     let nameFilter = InvoiceNumber
//       ? { InvoiceNumber: InvoiceNumber.toLocaleLowerCase() }
//       : {};
//     GetFilter = await inventoryTable.find(nameFilter).lean();
//   }

//   let getAdmin = await Admin.findOne({ _id: admin_id }).lean();
//   let supplierData = await SupplierMastersTable.findOne({
//     _id: supplier_id,
//   }).lean();

//   if (getAdmin == null) {
//     error["admin_id"] = "admin not found in database";
//   }
//   if (GetFilter.length > 0) {
//     error["InvoiceNumber"] = "Bill Number already exist";
//   }
//   var errorArray = Object.keys(error).length;
//   if (errorArray > 0) {
//     return res.status(400).json({
//       message: "error",
//       data: [error],
//       code: 0,
//     });
//   } else {
//     if (req.body.product_data) {
//       // console.log("111111111111111 m3");
//       try {
//         var product_data = req.body.product_data;
//         var product_data = JSON.parse(product_data);
//         var inventory_items = [];
//         var inventory_items_ids = [];
//         for (k = 0; k < product_data.length; k++) {
//           let batchID = 0;
//           if (product_data[k].batchID) {
//             batchID = parseInt(product_data[k].batchID);
//           }

//           let item = new inventoryItemTable({
//             product_id: product_data[k].product,
//             product_name: product_data[k].product_name,
//             TypeOfProduct: product_data[k].prodType,
//             product_measurment: product_data[k].product_measurment,
//             region: product_data[k].regionalData[0].region,
//             variant_name: product_data[k].regionalData[0].variant_name,

//             productQuantity: +product_data[k].regionalData[0].quantity,
//             availableQuantity: +product_data[k].regionalData[0].quantity,
//             itemTotalPrice: product_data[k].regionalData[0].total_amount,
//             product_costPrice: +product_data[k].product_costPrice,
//             gst_percentage: product_data[k].gst_percentage,
//             gst: product_data[k].gst,
//             singlepricewithoutgst: product_data[k].singlepricewithoutgst,
//             invoice_without_gst: product_data[k].invoice_without_gst,

//             product_expiry: product_data[k].product_expiry,
//             // ProductAvailableQuantity: product_data[k].AvailableQuantity, // don't delete, this is for mail
//             batchID: batchID + 1,
//           });

//           inventory_items_ids.push(item._id);
//           inventory_items.push(item);
//         }
//       } catch (err) {
//         errorLogger.error(err, "\n", "\n");
//         console.log(err);
//       }
//       var adminName = getAdmin.username;
//       var admin_name = adminName.toLowerCase();
//       let data = await inventoryTable.create({
//         admin_id: req.body.admin_id,
//         admin_name: admin_name,
//         supplier_id: req.body.supplier_id,
//         AccountHead: req.body.AccountHead,
//         Date: req.body.Date,
//         Time: req.body.Time,
//         addedByIP: ip,
//         InvoiceNumber: req.body.InvoiceNumber,
//         InvoiceDate: req.body.InvoiceDate,
//         InvoiceAmount: +req.body.InvoiceAmount,
//         InvoiceDueDate: req.body.InvoiceDueDate,
//         inventoryItems: inventory_items_ids,
//         delivery_charges: req.body.delivery_charges
//           ? req.body.delivery_charges
//           : 0,
//         total_gst: req.body.total_gst ? req.body.total_gst : 0,
//         AmountWithoutGSTandDelivery: req.body.AmountWithoutGSTandDelivery
//           ? req.body.AmountWithoutGSTandDelivery
//           : 0,
//       });

//       for (const item of inventory_items) {
//         item.inventory_id = data._id;
//         await item.save();
//       }

//       var billNo = "KC" + data.counter;
//       let updated = await inventoryTable.update(
//         {
//           _id: data._id,
//         },
//         { billNo }
//       );

//       let supplierName = supplierData.name;
//       let supplierEmail = supplierData.email;
//       let subject = "Inventory Added";
//       const productDataArray = [];
//       inventory_items.forEach((x) => {
//         const obj = productDataArray.find(
//           (o) => o.product_id.toString() === x.product_id.toString()
//         );
//         if (obj) {
//           obj.productQuantity = +obj.productQuantity + +x.productQuantity;
//         } else {
//           productDataArray.push(x);
//         }
//       });
//       if (productDataArray.length > 0) {
//         //admin msg start
//         var ProductDetail = "";
//         ProductDetail +=
//           "<tr><td style='text-transform: capitalize;padding:5px 10px;'><strong>Items</strong></td><td style='text-transform: capitalize;padding:5px 10px;'><strong>Inventory Added</strong></td><td style='text-transform: capitalize;padding:5px 10px;'><strong>Stock in Hand </strong></td><td style='text-transform: capitalize;padding:5px 10px;'><strong>Pricing </strong></td></tr>";
//         for (var i = 0; i < productDataArray.length; i++) {
//           let data = await inventoryItemTable.aggregate([
//             { $match: { product_id: productDataArray[i].product_id } },
//             {
//               $group: {
//                 _id: null,
//                 productQuantity: { $sum: "$productQuantity" },
//                 bookingQuantity: { $sum: "$bookingQuantity" },
//                 availableQuantity: { $sum: "$availableQuantity" },
//                 lostQuantity: { $sum: "$lostQuantity" },
//                 returnQuantity: { $sum: "$returnQuantity" },
//                 inhouseQuantity: { $sum: "$inhouseQuantity" },
//               },
//             },
//           ]);
//           ProductDetail += "<tr>";
//           ProductDetail +=
//             "<td style='text-transform: capitalize;padding:5px 10px;'>" +
//             productDataArray[i].product_name +
//             "</td>";
//           ProductDetail +=
//             "<td style='padding:5px 10px;'>" +
//             productDataArray[i].productQuantity +
//             " " +
//             productDataArray[i].product_measurment +
//             "</td>";
//           ProductDetail +=
//             "<td style='padding:5px 10px;'>" +
//             +data[0].availableQuantity +
//             " " +
//             productDataArray[i].product_measurment +
//             "</td>";
//           ProductDetail +=
//             "<td style='padding:5px 10px;'>" +
//             productDataArray[i].product_costPrice +
//             "</td>";
//           ProductDetail += "</tr>";
//         }
//         //admin msg end

//         //supplier msg start
//         var supplierMsg = "";
//         supplierMsg +=
//           "<tr><td style='text-transform: capitalize;padding:5px 10px;'><strong>Items</strong></td><td style='text-transform: capitalize;padding:5px 10px;'><strong>Qty</strong></td><td style='text-transform: capitalize;padding:5px 10px;'><strong>Pricing </strong></td></tr>";
//         var totalQty = 0;
//         var totalCost = 0;
//         for (var i = 0; i < productDataArray.length; i++) {
//           totalQty += productDataArray[i].productQuantity;
//           totalCost += +productDataArray[i].product_costPrice;
//           supplierMsg += "<tr>";
//           supplierMsg +=
//             "<td style='text-transform: capitalize;padding:5px 10px;'>" +
//             productDataArray[i].product_name +
//             "</td>";
//           supplierMsg +=
//             "<td style='padding:5px 10px;'>" +
//             productDataArray[i].productQuantity +
//             " " +
//             productDataArray[i].product_measurment +
//             "</td>";
//           supplierMsg +=
//             "<td style='padding:5px 10px;'>" +
//             productDataArray[i].product_costPrice +
//             " Rs</td>";
//           supplierMsg += "</tr>";
//         }
//         supplierMsg +=
//           "<p><tr><td style='text-transform: capitalize;padding:5px 10px;'><strong>Total</strong></td><td style='text-transform: capitalize;padding:5px 10px;'><strong>" +
//           totalQty +
//           "</strong></td> <td style='text-transform: capitalize;padding:5px 10px;'><strong>" +
//           totalCost +
//           " </strong></td></tr></p>";

//         var keys = {
//           BillDate: InvoiceDate,
//           BillTime: req.body.Time,
//           BillNo: req.body.InvoiceNumber,
//           supplierName: common.toTitleCase(supplierName),
//           TotalQty: totalQty,
//           TotalCost: totalCost,
//           ProductDetail: supplierMsg,
//           type: "supplier",
//           template_name: "inventory added mail to supplier",
//           supplierEmail: supplierEmail,
//           supplierName: supplierName,
//         };
//         if (notifs?.supplier_inventory_add) {
//           common.dynamicEmail(keys);
//         }

//         //supplier msg end

//         if (inventory_notifs?.admin_email) {
//           let users = await Admin.find(
//             {
//               user_role: {
//                 $in: inventory_notifs?.admin_roles,
//               },
//             },
//             { username: 1, email: 1 }
//           ).lean();

//           users.forEach((user) => {
//             var keys = {
//               BillDate: InvoiceDate,
//               BillTime: req.body.Time,
//               BillNo: req.body.InvoiceNumber,
//               supplierName: common.toTitleCase(supplierName),
//               ProductDetail: ProductDetail,
//               type: "admin",
//               template_name: "inventory added mail to admin",
//               adminEmail: user.email,
//               adminName: user.username,
//             };
//             common.dynamicEmail(keys);
//           });
//         }

//         res.status(200).json({
//           message: "ok",
//           data: data,
//           code: 1,
//         });
//       }
//     }
//   }
// };

module.exports.AddOne = async function (req, res) {
  var ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  // console.log(ip);
  // return;
  iBodyLogger.info("Adding New Inventory");
  iBodyLogger.debug(JSON.stringify(req.body), "\n", "\n", "\n");
  var supplier_id = req.body.supplier_id;
  var admin_id = req.body.admin_id;
  var InvoiceNumber = req.body.InvoiceNumber;

  if (
    supplier_id == "" ||
    !supplier_id ||
    supplier_id == undefined ||
    supplier_id == null
  ) {
    common.formValidate("supplier_id", res);
    return false;
  }
  if (
    admin_id == "" ||
    !admin_id ||
    admin_id == undefined ||
    admin_id == null
  ) {
    common.formValidate("admin_id", res);
    return false;
  }

  let notifs = await OnOffDataBase.findOne({}).lean();
  let inventory_notifs = notifs?.inventory_add;

  var createDate_formatted = moment
    .utc(req.body.InvoiceDate)
    .tz("Asia/Kolkata");
  var InvoiceDate = createDate_formatted.format("DD-MM-YYYY");
  var error = {};
  // console.log(req.body)
  // console.log(nameFilter, 'nameFilter')
  let GetFilter = [];
  if (InvoiceNumber) {
    let nameFilter = InvoiceNumber
      ? { InvoiceNumber: InvoiceNumber.toLocaleLowerCase() }
      : {};
    GetFilter = await inventoryTable.find(nameFilter).lean();
  }

  let getAdmin = await Admin.findOne({ _id: admin_id }).lean();
  let supplierData = await SupplierMastersTable.findOne({
    _id: supplier_id,
  }).lean();

  if (getAdmin == null) {
    //error["admin_id"] = "admin not found in database";
    return res.status(400).json({
      message: "error",
      data: "admin not found in database",
      code: 0,
    });
  }
  if (GetFilter.length > 0) {
    // error["InvoiceNumber"] = "Bill Number already exist";
    return res.status(400).json({
      message: "error",
      data: "Bill Number already exist  ",
      code: 0,
    });
  }
  var errorArray = Object.keys(error).length;
  if (errorArray > 0) {
    return res.status(400).json({
      message: "error",
      data: [error],
      code: 0,
    });
  } else {
    if (req.body.product_data) {
      //error if same admin enter inventory within 5 second code start
      var lastInventory = await inventoryTable
        .findOne({}, { created_at: 1, admin_id: 1 })
        .sort({ _id: -1 })
        .limit(1);

      var LatestDate = new Date(Date.now());
      var LatestAdminID = mongoose.Types.ObjectId(req.body.admin_id);
      // var lastAdmin_id = mongoose.Types.ObjectId(lastInventory.admin_id);

      var TimeDiffer = Math.abs(
        LatestDate -new Date(Date.now())
      );

      if (
        false
      ) {
        return res.status(400).json({
          message: "error",
          data:
            "you can not add inventory twice with in 5 second. please wait and try again.",
          code: 0,
        });
        //error if same admin enter inventory within 5 second code end
      } else {
        try {
          var product_data = req.body.product_data;
          var product_data = JSON.parse(product_data);
          var inventory_items = [];
          var inventory_items_ids = [];
          for (k = 0; k < product_data.length; k++) {
            let batchID = 0;
            if (product_data[k].batchID) {
              batchID = parseInt(product_data[k].batchID);
            }

             let item = new inventoryItemTable({
              product_id: product_data[k].product,
              product_name: product_data[k].product_name,
              TypeOfProduct: product_data[k].prodType,
              product_measurment: product_data[k].product_measurment,
              region: product_data[k].regionalData[0].region,
              variant_name: product_data[k].regionalData[0].variant_name,

              productQuantity: +product_data[k].regionalData[0].quantity,
              availableQuantity: +product_data[k].regionalData[0].quantity,
              itemTotalPrice: product_data[k].regionalData[0].total_amount,
              product_costPrice: +product_data[k].product_costPrice,
              gst_percentage: product_data[k].gst_percentage,
              gst: product_data[k].gst,
              singlepricewithoutgst: product_data[k].singlepricewithoutgst,
              invoice_without_gst: product_data[k].invoice_without_gst,

              product_expiry: product_data[k].product_expiry,
              // ProductAvailableQuantity: product_data[k].AvailableQuantity, // don't delete, this is for mail
              batchID: batchID + 1,
            });

            inventory_items_ids.push(item._id);
            inventory_items.push(item);
          }
        } catch (err) {
          errorLogger.error(err, "\n", "\n");
          console.log(err);
        }
        var adminName = getAdmin.username;
        var admin_name = adminName.toLowerCase();
        let data = await inventoryTable.create({
          admin_id: req.body.admin_id,
          admin_name: admin_name,
          supplier_id: req.body.supplier_id,
          AccountHead: req.body.AccountHead,
          Date: req.body.Date,
          Time: req.body.Time,
          addedByIP: ip,
          InvoiceNumber: req.body.InvoiceNumber,
          InvoiceDate: req.body.InvoiceDate,
          InvoiceAmount: +req.body.InvoiceAmount,
          InvoiceDueDate: req.body.InvoiceDueDate,
          inventoryItems: inventory_items_ids,
          delivery_charges: req.body.delivery_charges
            ? req.body.delivery_charges
            : 0,
          total_gst: req.body.total_gst ? req.body.total_gst : 0,
          AmountWithoutGSTandDelivery: req.body.AmountWithoutGSTandDelivery
            ? req.body.AmountWithoutGSTandDelivery
            : 0,
        });

        for (const item of inventory_items) {
          item.inventory_id = data._id;
          await item.save();
        }

        var billNo = "KC" + data.counter;
        let updated = await inventoryTable.update(
          {
            _id: data._id,
          },
          { billNo }
        );

        let supplierName = supplierData.name;
        let supplierEmail = supplierData.email;
        let subject = "Inventory Added";
        const productDataArray = [];
        inventory_items.forEach((x) => {
          const obj = productDataArray.find(
            (o) => o.product_id.toString() === x.product_id.toString()
          );
          if (obj) {
            obj.productQuantity = +obj.productQuantity + +x.productQuantity;
          } else {
            productDataArray.push(x);
          }
        });
        if (productDataArray.length > 0) {
          //admin msg start
          var ProductDetail = "";
          ProductDetail +=
            "<tr><td style='text-transform: capitalize;padding:5px 10px;'><strong>Items</strong></td><td style='text-transform: capitalize;padding:5px 10px;'><strong>Inventory Added</strong></td><td style='text-transform: capitalize;padding:5px 10px;'><strong>Stock in Hand </strong></td><td style='text-transform: capitalize;padding:5px 10px;'><strong>Pricing </strong></td></tr>";
          for (var i = 0; i < productDataArray.length; i++) {
            let data = await inventoryItemTable.aggregate([
              { $match: { product_id: productDataArray[i].product_id } },
              {
                $group: {
                  _id: null,
                  productQuantity: { $sum: "$productQuantity" },
                  bookingQuantity: { $sum: "$bookingQuantity" },
                  availableQuantity: { $sum: "$availableQuantity" },
                  lostQuantity: { $sum: "$lostQuantity" },
                  returnQuantity: { $sum: "$returnQuantity" },
                  inhouseQuantity: { $sum: "$inhouseQuantity" },
                },
              },
            ]);
            ProductDetail += "<tr>";
            ProductDetail +=
              "<td style='text-transform: capitalize;padding:5px 10px;'>" +
              productDataArray[i].product_name +
              "</td>";
            ProductDetail +=
              "<td style='padding:5px 10px;'>" +
              productDataArray[i].productQuantity +
              " " +
              productDataArray[i].product_measurment +
              "</td>";
            ProductDetail +=
              "<td style='padding:5px 10px;'>" +
              +data[0].availableQuantity +
              " " +
              productDataArray[i].product_measurment +
              "</td>";
            ProductDetail +=
              "<td style='padding:5px 10px;'>" +
              productDataArray[i].product_costPrice +
              "</td>";
            ProductDetail += "</tr>";
          }
          //admin msg end

          //supplier msg start
          var supplierMsg = "";
          supplierMsg +=
            "<tr><td style='text-transform: capitalize;padding:5px 10px;'><strong>Items</strong></td><td style='text-transform: capitalize;padding:5px 10px;'><strong>Qty</strong></td><td style='text-transform: capitalize;padding:5px 10px;'><strong>Pricing </strong></td></tr>";
          var totalQty = 0;
          var totalCost = 0;
          for (var i = 0; i < productDataArray.length; i++) {
            totalQty += productDataArray[i].productQuantity;
            totalCost += +productDataArray[i].product_costPrice;
            supplierMsg += "<tr>";
            supplierMsg +=
              "<td style='text-transform: capitalize;padding:5px 10px;'>" +
              productDataArray[i].product_name +
              "</td>";
            supplierMsg +=
              "<td style='padding:5px 10px;'>" +
              productDataArray[i].productQuantity +
              " " +
              productDataArray[i].product_measurment +
              "</td>";
            supplierMsg +=
              "<td style='padding:5px 10px;'>" +
              productDataArray[i].product_costPrice +
              " Rs</td>";
            supplierMsg += "</tr>";
          }
          supplierMsg +=
            "<p><tr><td style='text-transform: capitalize;padding:5px 10px;'><strong>Total</strong></td><td style='text-transform: capitalize;padding:5px 10px;'><strong>" +
            totalQty +
            "</strong></td> <td style='text-transform: capitalize;padding:5px 10px;'><strong>" +
            totalCost +
            " </strong></td></tr></p>";

          var keys = {
            BillDate: InvoiceDate,
            BillTime: req.body.Time,
            BillNo: req.body.InvoiceNumber,
            supplierName: common.toTitleCase(supplierName),
            TotalQty: totalQty,
            TotalCost: totalCost,
            ProductDetail: supplierMsg,
            type: "supplier",
            template_name: "inventory added mail to supplier",
            supplierEmail: supplierEmail,
            supplierName: supplierName,
          };
          if (notifs?.supplier_inventory_add) {
            common.dynamicEmail(keys);
          }

          //supplier msg end

          if (inventory_notifs?.admin_email) {
            let users = await Admin.find(
              {
                user_role: {
                  $in: inventory_notifs?.admin_roles,
                },
              },
              { username: 1, email: 1 }
            ).lean();

            users.forEach((user) => {
              var keys = {
                BillDate: InvoiceDate,
                BillTime: req.body.Time,
                BillNo: req.body.InvoiceNumber,
                supplierName: common.toTitleCase(supplierName),
                ProductDetail: ProductDetail,
                type: "admin",
                template_name: "inventory added mail to admin",
                adminEmail: user.email,
                adminName: user.username,
              };
              common.dynamicEmail(keys);
            });
          }

          res.status(200).json({
            message: "ok",
            data: data,
            code: 1,
          });
        }
      }
    }
  }
};

module.exports.UpdateOne = async function (req, res) {
  var ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  iBodyLogger.info("Updating Inventory");
  iBodyLogger.debug(JSON.stringify(req.body), "\n", "\n", "\n");
  var _id = req.body._id;
  var supplier_id = req.body.supplier_id;
  var admin_id = req.body.admin_id;
  var InvoiceNumber = req.body.InvoiceNumber;
  console.log(req.body, "req.bodyreq.body");
  if (
    supplier_id == "" ||
    !supplier_id ||
    supplier_id == undefined ||
    supplier_id == null
  ) {
    common.formValidate("supplier_id", res);
    return false;
  }
  if (
    admin_id == "" ||
    !admin_id ||
    admin_id == undefined ||
    admin_id == null
  ) {
    common.formValidate("admin_id", res);
    return false;
  }

  let notifs = await OnOffDataBase.findOne({}).lean();
  let inventory_notifs = notifs?.inventory_edit;

  var createDate_formatted = moment
    .utc(req.body.InvoiceDate)
    .tz("Asia/Kolkata");
  var InvoiceDate = createDate_formatted.format("DD-MM-YYYY");
  var error = {};
  // console.log(req.body)
  // console.log(nameFilter, 'nameFilter')
  let GetFilter = [];
  if (InvoiceNumber) {
    let nameFilter = InvoiceNumber
      ? { InvoiceNumber: InvoiceNumber.toLocaleLowerCase() }
      : {};
    GetFilter = await inventoryTable.find(nameFilter).lean();
  }

  let getAdmin = await Admin.findOne({ _id: admin_id }).lean();
  let supplierData = await SupplierMastersTable.findOne({
    _id: supplier_id,
  }).lean();

  if (getAdmin == null) {
    error["admin_id"] = "Admin not found in database";
  }
  if (GetFilter.length > 0) {
    if (GetFilter[0]._id != _id) {
      error["InvoiceNumber"] = "Bill Number alreday exist";
    }
  }
  var errorArray = Object.keys(error).length;
  if (errorArray > 0) {
    return res.status(400).json({
      message: "error",
      data: [error],
      code: 0,
    });
  } else {
    if (req.body.product_data) {
      try {
        var product_data = req.body.product_data;
        var product_data = JSON.parse(product_data);
        var inventory_items = [];
        var inventory_itemsForMail = [];
        var inventory_items_ids = [];
        for (k = 0; k < product_data.length; k++) {
          let batchID = 0;
          if (product_data[k].batchID) {
            batchID = parseInt(product_data[k].batchID);
          }
          console.log(
            product_data[k]._id,
            "product_data[k]._idproduct_data[k]._id"
          );
          var oldInventory = await inventoryItemTable
            .findOne(
              { _id: product_data[k]._id },
              {
                _id: 1,
                bookingQuantity: 1,
                availableQuantity: 1,
                lostQuantity: 1,
                returnQuantity: 1,
                inhouseQuantity: 1,
              }
            )
            .lean();
          if (oldInventory) {
            console.log("old inventory", product_data[k]._id);
            var updateData = {
              product_id: product_data[k].product,
              product_name: product_data[k].product_name,
              TypeOfProduct: product_data[k].prodType,
              product_measurment: product_data[k].product_measurment,
              region: product_data[k].regionalData[0].region,
              inventory_id: _id,
              variant_name: product_data[k].regionalData[0].variant_name,
              productQuantity: +product_data[k].regionalData[0].quantity,
              availableQuantity:
                +product_data[k].regionalData[0].quantity -
                (+oldInventory.bookingQuantity +
                  +oldInventory.lostQuantity +
                  +oldInventory.returnQuantity +
                  +oldInventory.inhouseQuantity),
              itemTotalPrice: product_data[k].regionalData[0].total_amount,
              product_costPrice: +product_data[k].product_costPrice,
              gst_percentage: product_data[k].gst_percentage,
              gst: product_data[k].gst,
              singlepricewithoutgst: product_data[k].singlepricewithoutgst,
              invoice_without_gst: product_data[k].invoice_without_gst,
              product_expiry: product_data[k].product_expiry,
            };
            await inventoryItemTable.updateOne(
              { _id: product_data[k]._id },
              { $set: updateData }
            );
            inventory_items_ids.push(product_data[k]._id);
            //console.log(updateData, "iff");
            inventory_itemsForMail.push(updateData);
          } else {
            let item = new inventoryItemTable({
              product_id: product_data[k].product,
              product_name: product_data[k].product_name,
              TypeOfProduct: product_data[k].prodType,
              product_measurment: product_data[k].product_measurment,
              region: product_data[k].regionalData[0].region,
              inventory_id: _id,
              variant_name: product_data[k].regionalData[0].variant_name,

              productQuantity: +product_data[k].regionalData[0].quantity,
              availableQuantity: +product_data[k].regionalData[0].quantity,
              itemTotalPrice: product_data[k].regionalData[0].total_amount,
              product_costPrice: +product_data[k].product_costPrice,
              gst_percentage: product_data[k].gst_percentage,
              gst: product_data[k].gst,
              singlepricewithoutgst: product_data[k].singlepricewithoutgst,
              invoice_without_gst: product_data[k].invoice_without_gst,

              product_expiry: product_data[k].product_expiry,
              // ProductAvailableQuantity: product_data[k].AvailableQuantity, // don't delete, this is for mail
              batchID: batchID + 1,
            });

            //console.log("new inventory", item._id, item);
            inventory_items_ids.push(item._id);
            //.log(item, "else");
            inventory_items.push(item);
            inventory_itemsForMail.push(item);
          }
        }
      } catch (err) {
        errorLogger.error(err, "\n", "\n");
        console.log(err);
      }
      var adminName = getAdmin.username;
      var admin_name = adminName.toLowerCase();
      var updateData = {
        admin_id: req.body.admin_id,
        admin_name: admin_name,
        supplier_id: req.body.supplier_id,
        AccountHead: req.body.AccountHead,
        Date: req.body.Date,
        Time: req.body.Time,
        InvoiceNumber: req.body.InvoiceNumber,
        InvoiceDate: req.body.InvoiceDate,
        InvoiceAmount: +req.body.InvoiceAmount,
        InvoiceDueDate: req.body.InvoiceDueDate,
        inventoryItems: inventory_items_ids,
        delivery_charges: req.body.delivery_charges
          ? req.body.delivery_charges
          : 0,
        total_gst: req.body.total_gst ? req.body.total_gst : 0,
        AmountWithoutGSTandDelivery: req.body.AmountWithoutGSTandDelivery
          ? req.body.AmountWithoutGSTandDelivery
          : 0,
      };
      let data = await inventoryTable.updateOne(
        { _id: _id },
        { $set: updateData, $push: { updatedByIP: ip } }
      );
      console.log(data, "data._iddata._iddata._id");
      for (const item of inventory_items) {
        console.log(item, "forloop");
        item.inventory_id = _id;
        await item.save();
      }
      let supplierName = supplierData.name;
      let supplierEmail = supplierData.email;
      let subject = "Inventory Updated";
      const productDataArray = [];
      inventory_itemsForMail.forEach((x) => {
        const obj = productDataArray.find(
          (o) => o.product_id.toString() === x.product_id.toString()
        );
        if (obj) {
          obj.productQuantity = +obj.productQuantity + +x.productQuantity;
        } else {
          productDataArray.push(x);
        }
      });

      if (productDataArray.length > 0) {
        //admin msg start
        var ProductDetail = "";
        ProductDetail +=
          "<tr><td style='text-transform: capitalize;padding:5px 10px;'><strong>Items</strong></td><td style='text-transform: capitalize;padding:5px 10px;'><strong>Inventory Updated</strong></td><td style='text-transform: capitalize;padding:5px 10px;'><strong>Stock in Hand </strong></td><td style='text-transform: capitalize;padding:5px 10px;'><strong>Pricing </strong></td></tr>";
        for (var i = 0; i < productDataArray.length; i++) {
          let data = await inventoryItemTable.aggregate([
            {
              $match: {
                product_id: mongoose.Types.ObjectId(
                  productDataArray[i].product_id
                ),
              },
            },
            {
              $group: {
                _id: null,
                availableQuantity: { $sum: "$availableQuantity" },
              },
            },
          ]);
          ProductDetail += "<tr>";
          ProductDetail +=
            "<td style='text-transform: capitalize;padding:5px 10px;'>" +
            productDataArray[i].product_name +
            "</td>";
          ProductDetail +=
            "<td style='padding:5px 10px;'>" +
            productDataArray[i].productQuantity +
            " " +
            productDataArray[i].product_measurment +
            "</td>";
          ProductDetail +=
            "<td style='padding:5px 10px;'>" +
            +data[0].availableQuantity +
            " " +
            productDataArray[i].product_measurment +
            "</td>";
          ProductDetail +=
            "<td style='padding:5px 10px;'>" +
            productDataArray[i].product_costPrice +
            "</td>";
          ProductDetail += "</tr>";
        }
        //admin msg end

        //supplier msg start
        var supplierMsg = "";
        supplierMsg +=
          "<tr><td style='text-transform: capitalize;padding:5px 10px;'><strong>Items</strong></td><td style='text-transform: capitalize;padding:5px 10px;'><strong>Qty</strong></td><td style='text-transform: capitalize;padding:5px 10px;'><strong>Pricing </strong></td></tr>";
        var totalQty = 0;
        var totalCost = 0;
        for (var i = 0; i < productDataArray.length; i++) {
          totalQty += productDataArray[i].productQuantity;
          totalCost += +productDataArray[i].product_costPrice;
          supplierMsg += "<tr>";
          supplierMsg +=
            "<td style='text-transform: capitalize;padding:5px 10px;'>" +
            productDataArray[i].product_name +
            "</td>";
          supplierMsg +=
            "<td style='padding:5px 10px;'>" +
            productDataArray[i].productQuantity +
            " " +
            productDataArray[i].product_measurment +
            "</td>";
          supplierMsg +=
            "<td style='padding:5px 10px;'>" +
            productDataArray[i].product_costPrice +
            " Rs</td>";
          supplierMsg += "</tr>";
        }
        supplierMsg +=
          "<p><tr><td style='text-transform: capitalize;padding:5px 10px;'><strong>Total</strong></td><td style='text-transform: capitalize;padding:5px 10px;'><strong>" +
          totalQty +
          "</strong></td> <td style='text-transform: capitalize;padding:5px 10px;'><strong>" +
          totalCost +
          " </strong></td></tr></p>";

        var keys = {
          BillDate: InvoiceDate,
          BillTime: req.body.Time,
          BillNo: req.body.InvoiceNumber,
          supplierName: common.toTitleCase(supplierName),
          TotalQty: totalQty,
          TotalCost: totalCost,
          ProductDetail: supplierMsg,
          type: "supplier",
          template_name: "inventory updated mail to supplier",
          supplierEmail: supplierEmail,
          supplierName: supplierName,
        };
        //console.log(notifs);
        if (notifs?.supplier_inventory_update) {
          await common.dynamicEmail(keys);
        }
        //supplier msg end

        if (inventory_notifs?.admin_email) {
          let users = await Admin.find(
            {
              user_role: {
                $in: inventory_notifs?.admin_roles,
              },
            },
            { username: 1, email: 1 }
          ).lean();

          users.forEach((user) => {
            var keys = {
              BillDate: InvoiceDate,
              BillTime: req.body.Time,
              BillNo: req.body.InvoiceNumber,
              supplierName: common.toTitleCase(supplierName),
              ProductDetail: ProductDetail,
              type: "admin",
              template_name: "inventory updated mail to admin",
              adminEmail: user.email,
              adminName: user.username,
            };
            common.dynamicEmail(keys);
          });
        }

        res.status(200).json({
          message: "ok",
          data: data,
          code: 1,
        });
      }
    }
  }
};

module.exports.GetAll = async function (req, res) {
  var skip = 0;
  var limit = 5;
  var maxCount = 50;

  if (req.body && req.body.skip) {
    skip = +req.body.skip;
  }

  if (req.body && req.body.limit) {
    limit = +req.body.limit;
  }

  if (req.body.InvoiceNumber) {
    var InvoiceNumber = req.body.InvoiceNumber;
  }
  if (req.body.InvoiceAmount) {
    var InvoiceAmount = +req.body.InvoiceAmount;
  }
  if (req.body.date) {
    var date = req.body.date;
    var to_date1 = new Date(date);
    to_date1.setDate(to_date1.getDate() + 1);
  }
  if (req.body.admin_name) {
    var admin_name = req.body.admin_name;
  }

  var DataFilter = {};
  if (InvoiceNumber != null) {
    DataFilter["InvoiceNumber"] = { $regex: InvoiceNumber };
  }
  if (InvoiceAmount != null) {
    DataFilter["InvoiceAmount"] = InvoiceAmount;
  }
  if (req.body.supplier) {
    DataFilter["supplier_id"] = mongoose.Types.ObjectId(req.body.supplier);
  }
  if (req.body.admin) {
    DataFilter["admin_id"] = mongoose.Types.ObjectId(req.body.admin);
  }
  if (admin_name != null) {
    DataFilter["admin_name"] = { $regex: admin_name, $options: "i" };
  }
  if (date != null) {
    DataFilter["created_at"] = {
      $gte: new Date(date),
      $lte: new Date(to_date1),
    };
  }

  var paymentStatusFilter = {};
  if (req.body.payment_status) {
    paymentStatusFilter["paymentStatus"] = req.body.payment_status;
  }

  var todayDate = new Date().setHours(0, 0, 0, 0);

  try {
    let aggregateData = await inventoryTable.aggregate([
      { $match: DataFilter },
      // { $addFields: { due_date: { $dateFromString: { dateString: "$InvoiceDate" } } } },
      {
        $addFields: {
          paymentStatus: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [
                      { $eq: ["$paymentStatus", "pending"] },
                      {
                        $lt: [
                          new Date(todayDate),
                          {
                            $dateFromString: { dateString: "$InvoiceDueDate" },
                          },
                        ],
                      },
                    ],
                  },
                  then: "pending",
                },
                {
                  case: {
                    $and: [
                      { $eq: ["$paymentStatus", "pending"] },
                      {
                        $gt: [
                          new Date(todayDate),
                          {
                            $dateFromString: { dateString: "$InvoiceDueDate" },
                          },
                        ],
                      },
                    ],
                  },
                  then: "Over Due",
                },
                {
                  case: {
                    $and: [
                      { $eq: ["$paymentStatus", "pending"] },
                      {
                        $eq: [
                          new Date(todayDate),
                          {
                            $dateFromString: { dateString: "$InvoiceDueDate" },
                          },
                        ],
                      },
                    ],
                  },
                  then: "Due",
                },
                {
                  case: { $eq: ["$paymentStatus", "Complete"] },
                  then: "Complete",
                },
              ],
              default: "pending",
            },
          },
        },
      },
      { $match: paymentStatusFilter },
      { $sort: { created_at: -1 } },
      {
        $facet: {
          count: [{ $count: "count" }],
          docs: [
            { $skip: skip },
            { $limit: limit },
            // populate admin_id
            {
              $lookup: {
                from: "admins",
                localField: "admin_id",
                foreignField: "_id",
                as: "admin_id",
              },
            },
            { $unwind: "$admin_id" },

            // populate supplier_id
            {
              $lookup: {
                from: "supplier_masters",
                localField: "supplier_id",
                foreignField: "_id",
                as: "supplier_id",
              },
            },
            { $unwind: "$supplier_id" },

            // populate inventoryItems
            ...[
              {
                $unwind: {
                  path: "$inventoryItems",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $lookup: {
                  from: "inventory_items",
                  let: { inventoryItemId: "$inventoryItems" },
                  pipeline: [
                    {
                      $match: {
                        $expr: { $eq: ["$_id", "$$inventoryItemId"] },
                      },
                    },
                    {
                      $lookup: {
                        from: "regions",
                        localField: "region",
                        foreignField: "_id",
                        as: "region",
                      },
                    },
                    {
                      $unwind: {
                        path: "$region",
                        preserveNullAndEmptyArrays: true,
                      },
                    },
                    {
                      $addFields: {
                        productQuantity: {
                          $ifNull: [{ $toDouble: "$productQuantity" }, 0],
                        },
                        bookingQuantity: {
                          $ifNull: [{ $toDouble: "$bookingQuantity" }, 0],
                        },
                        availableQuantity: {
                          $ifNull: [{ $toDouble: "$availableQuantity" }, 0],
                        },
                        lostQuantity: {
                          $ifNull: [{ $toDouble: "$lostQuantity" }, 0],
                        },
                        returnQuantity: {
                          $ifNull: [{ $toDouble: "$returnQuantity" }, 0],
                        },
                        inhouseQuantity: {
                          $ifNull: [{ $toDouble: "$inhouseQuantity" }, 0],
                        },
                      },
                    },
                  ],
                  as: "inventoryItems",
                },
              },
              {
                $unwind: {
                  path: "$inventoryItems",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $group: {
                  _id: "$_id",
                  inventoryItems: { $push: "$inventoryItems" },
                  admin_id: { $first: "$admin_id" },
                  admin_name: { $first: "$admin_name" },
                  addedByIP: { $first: "$addedByIP" },
                  updatedByIP: { $first: "$updatedByIP" },
                  billNo: { $first: "$billNo" },
                  supplier_id: { $first: "$supplier_id" },
                  AccountHead: { $first: "$AccountHead" },
                  Date: { $first: "$Date" },
                  Time: { $first: "$Time" },
                  InvoiceNumber: { $first: "$InvoiceNumber" },
                  InvoiceDate: { $first: "$InvoiceDate" },
                  InvoiceAmount: { $first: "$InvoiceAmount" },
                  total_gst: { $first: "$total_gst" },
                  AmountWithoutGSTandDelivery: {
                    $first: "$AmountWithoutGSTandDelivery",
                  },
                  InvoiceDueDate: { $first: "$InvoiceDueDate" },
                  paymentStatus: { $first: "$paymentStatus" },
                  paymentMethod: { $first: "$paymentMethod" },
                  paymentDate: { $first: "$paymentDate" },
                  note: { $first: "$note" },
                  delivery_charges: { $first: "$delivery_charges" },
                  paymentUpdateByAdminID: { $first: "$paymentUpdateByAdminID" },
                  status: { $first: "$status" },
                  created_at: { $first: "$created_at" },
                },
              },
            ],

            { $sort: { created_at: -1 } },
          ],
        },
      },
    ]);

    return res.status(200).json({
      message: "ok",
      data: aggregateData[0].docs,
      count: aggregateData[0].count[0] ? aggregateData[0].count[0].count : 0,
      code: 1,
    });
  } catch (err) {
    errorLogger.error(err, "\n", "\n");
    console.log("errrr::", err);
    return res.status(500).json({ msg: "error", error: err, code: 0 });
  }
};

module.exports.GetAllInventoryByProduct = async (req, res) => {
  var product_id = req.body.product_id;

  let data = await inventoryItemTable.aggregate([
    { $match: { product_id: mongoose.Types.ObjectId(product_id) } },
    {
      $lookup: {
        from: "regions",
        localField: "region",
        foreignField: "_id",
        as: "region",
      },
    },
    { $unwind: "$region" },
    { $set: { region: "$region.name" } },
    {
      $lookup: {
        from: "inventories",
        localField: "inventory_id",
        foreignField: "_id",
        as: "inventory_id",
      },
    },
    { $unwind: "$inventory_id" },
    {
      $lookup: {
        from: "supplier_masters",
        localField: "inventory_id.supplier_id",
        foreignField: "_id",
        as: "supplier",
      },
    },
    { $unwind: "$supplier" },
    { $set: { supplier: "$supplier.name" } },
    //{ $set: { supplier: null } },
    //{ $project: { inventory_id: 0 } },
    {
      $addFields: {
        productQuantity: {
          $ifNull: [{ $toDouble: "$productQuantity" }, { $toDouble: 0 }],
        },
        bookingQuantity: {
          $ifNull: [{ $toDouble: "$bookingQuantity" }, { $toDouble: 0 }],
        },
        availableQuantity: {
          $ifNull: [{ $toDouble: "$availableQuantity" }, { $toDouble: 0 }],
        },
        lostQuantity: {
          $ifNull: [{ $toDouble: "$lostQuantity" }, { $toDouble: 0 }],
        },
        returnQuantity: {
          $ifNull: [{ $toDouble: "$returnQuantity" }, { $toDouble: 0 }],
        },
        inhouseQuantity: {
          $ifNull: [{ $toDouble: "$inhouseQuantity" }, { $toDouble: 0 }],
        },
      },
    },
  ]);

  // console.log("jjjjllll");

  res.status(200).json({ message: "ok", data, code: 1 });

  // inventoryTable
  //   .find({ "productData.product_id": product_id })
  //   .populate("admin_id")
  //   .populate("productData.product_id")
  //   .populate("supplier_id")
  //   .populate("productData.simpleData.region")
  //   .populate("productData.configurableData.region")
  //   // .populate("productData.configurableData.ProductconfigurableObjectId")
  //   .sort({ created_at: "desc" })
  //   .lean()
  //   .exec(function (err, data) {
  //     if (err) {
  //       res.status(400).json(err);
  //     } else if (data.length == 0) {
  //       res.status(200).json({ message: "ok", data: [], code: 1 });
  //     } else {
  //       var jsonData = [];
  //       for (var i = 0; i < data.length; i++) {
  //         var DataI = data[i];

  //         var DataIProductData = DataI.productData;
  //         if (DataIProductData) {
  //           var productArray = [];
  //           for (var i1 = 0; i1 < DataIProductData.length; i1++) {
  //             var DataIProductDataI = DataIProductData[i1];
  //             if (JSON.stringify(DataIProductDataI.product_id._id) == JSON.stringify(product_id)) {
  //               productArray.push({
  //                 ...DataIProductDataI,
  //               });
  //             }
  //           }
  //         } else {
  //           productArray = [];
  //         }
  //         jsonData.push({
  //           _id: DataI._id,
  //           admin_id: DataI.admin_id,
  //           Date: DataI.Date,
  //           Time: DataI.Time,
  //           InvoiceNumber: DataI.InvoiceNumber,
  //           InvoiceDate: DataI.InvoiceDate,
  //           InvoiceAmount: DataI.InvoiceAmount,
  //           InvoiceDueDate: DataI.InvoiceDueDate,
  //           __v: DataI.__v,
  //           created_at: DataI.created_at,
  //           status: DataI.status,
  //           paymentUpdateByAdminID: DataI.paymentUpdateByAdminID,
  //           paymentMethod: DataI.paymentMethod,
  //           paymentStatus: DataI.paymentStatus,
  //           AccountHead: DataI.AccountHead,
  //           supplier_id: DataI.supplier_id,
  //           admin_name: DataI.admin_name,
  //           billNo: DataI.billNo,
  //           productData: productArray,
  //         });
  //       }
  //       res.status(200).json({ message: "ok", data: jsonData, code: 1 });
  //     }
  //   });
};

module.exports.GetAllActive = function (req, res) {
  inventoryTable
    .find({ status: true })
    // .skip(offset)
    // .limit(count)
    .populate({
      path: "product_cat_id",
    })
    .exec(function (err, data) {
      if (err) {
        res.status(500).json(err);
      } else {
        res.status(200).json({ message: "ok", data: data, code: 1 });
      }
    });
};

module.exports.GetOneInventory = async (req, res) => {
  var _id = req.body._id;
  if (_id == "" || !_id || _id == undefined || _id == null) {
    common.formValidate("_id", res);
    // return false;
  }
  // inventoryTable
  //   .findOne({ _id: _id })
  //   .populate("admin_id")
  //   .populate("inventoryItems")
  //   .populate("supplier_id")
  //   // .populate("productData.simpleData.region")
  //   // .populate("productData.configurableData.region")
  //   // .populate("productData.configurableData.attributes.attributeId")
  //   .lean()
  //   .exec(function (err, data) {
  //     if (err) {
  //       errorLogger.error(err, "\n", "\n");
  //       console.log(err);
  //       return res.status(400).json(err);
  //     } else {
  //       return res.status(200).json({ message: "ok", data: data, code: 1 });
  //     }
  //   });

  let data = await inventoryTable.aggregate([
    { $match: { _id: mongoose.Types.ObjectId(_id) } },

    // populate admin_id
    {
      $lookup: {
        from: "admins",
        localField: "admin_id",
        foreignField: "_id",
        as: "admin_id",
      },
    },
    { $unwind: "$admin_id" },

    // populate supplier_id
    {
      $lookup: {
        from: "supplier_masters",
        localField: "supplier_id",
        foreignField: "_id",
        as: "supplier_id",
      },
    },
    { $unwind: "$supplier_id" },

    // populate inventoryItems
    // populate inventoryItems
    ...[
      {
        $unwind: { path: "$inventoryItems", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "inventory_items",
          let: { inventoryItemId: "$inventoryItems" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$inventoryItemId"] },
              },
            },
            // {
            //   $lookup: {
            //     from: "regions",
            //     localField: "region",
            //     foreignField: "_id",
            //     as: "region",
            //   },
            // },
            // { $unwind: { path: "$region", preserveNullAndEmptyArrays: true } },
            {
              $addFields: {
                productQuantity: {
                  $ifNull: [{ $toDouble: "$productQuantity" }, 0],
                },
                bookingQuantity: {
                  $ifNull: [{ $toDouble: "$bookingQuantity" }, 0],
                },
                availableQuantity: {
                  $ifNull: [{ $toDouble: "$availableQuantity" }, 0],
                },
                lostQuantity: { $ifNull: [{ $toDouble: "$lostQuantity" }, 0] },
                returnQuantity: {
                  $ifNull: [{ $toDouble: "$returnQuantity" }, 0],
                },
                inhouseQuantity: {
                  $ifNull: [{ $toDouble: "$inhouseQuantity" }, 0],
                },
              },
            },
          ],
          as: "inventoryItems",
        },
      },
      {
        $unwind: { path: "$inventoryItems", preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: "$_id",
          inventoryItems: { $push: "$inventoryItems" },
          admin_id: { $first: "$admin_id" },
          admin_name: { $first: "$admin_name" },
          billNo: { $first: "$billNo" },
          supplier_id: { $first: "$supplier_id" },
          AccountHead: { $first: "$AccountHead" },
          Date: { $first: "$Date" },
          Time: { $first: "$Time" },
          InvoiceNumber: { $first: "$InvoiceNumber" },
          InvoiceDate: { $first: "$InvoiceDate" },
          InvoiceAmount: { $first: "$InvoiceAmount" },
          total_gst: { $first: "$total_gst" },
          AmountWithoutGSTandDelivery: {
            $first: "$AmountWithoutGSTandDelivery",
          },
          InvoiceDueDate: { $first: "$InvoiceDueDate" },
          paymentStatus: { $first: "$paymentStatus" },
          paymentMethod: { $first: "$paymentMethod" },
          paymentDate: { $first: "$paymentDate" },
          note: { $first: "$note" },
          delivery_charges: { $first: "$delivery_charges" },
          paymentUpdateByAdminID: { $first: "$paymentUpdateByAdminID" },
          status: { $first: "$status" },
          created_at: { $first: "$created_at" },
        },
      },
    ],
  ]);

  return res.status(200).json({ message: "ok", data: data, code: 1 });
};

module.exports.GetNewBillNo = async (req, res) => {
  var lastBillNo = await inventoryTable
    .findOne({})
    .select({ billNo: 1, _id: 0 })
    .sort({ _id: -1 })
    .limit(1)
    .lean();

  let billNo = lastBillNo ? lastBillNo.billNo : "0";
  let lastBill = billNo.replace("KC", "");
  var newBillNo = +lastBill + 1;
  res.status(200).json({ message: "ok", data: "KC" + newBillNo, code: 1 });
};

module.exports.DeleteOne = async (req, res) => {
  try {
    var Id = req.params.Id;
    let data = await inventoryTable
      .findOne({ _id: mongoose.Types.ObjectId(Id) })
      .lean();
    for (const item of data.inventoryItems) {
      await inventoryItemTable.findOneAndRemove({
        _id: mongoose.Types.ObjectId(item),
      });
    }
    await inventoryTable.findOneAndRemove({ _id: mongoose.Types.ObjectId(Id) });
    res.status(200).json({ message: "ok", data: "", code: 1 });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "", data: err, code: 0 });
  }
  // .exec(function (err, data) {
  //   if (err) {
  //     res.status(404).json({ message: "", data: err, code: 0 });
  //   } else {
  //     res.status(200).json({ message: "ok", data: "", code: 1 });
  //     return;
  //   }
  // });
};

module.exports.DeleteOneInventoryItem = async (req, res) => {
  try {
    var _id = req.body._id;
    let data = await inventoryItemTable
      .findOne(
        { _id: mongoose.Types.ObjectId(_id) },
        {
          bookingQuantity: 1,
          lostQuantity: 1,
          returnQuantity: 1,
          inhouseQuantity: 1,
        }
      )
      .lean();
    if (
      +data.bookingQuantity > 0 ||
      +data.lostQuantity > 0 ||
      +data.returnQuantity > 0 ||
      +data.inhouseQuantity > 0
    ) {
      return res.status(500).json({
        message: "error",
        data: "you can not delete this item",
        code: 0,
      });
    } else {
      await inventoryItemTable.findOneAndRemove({
        _id: mongoose.Types.ObjectId(_id),
      });
      res
        .status(200)
        .json({ message: "ok", data: "document deleted", code: 1 });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "error", data: err, code: 0 });
  }
};

module.exports.UpdatePaymentStatus = function (req, res) {
  let { inventory_id, adminID, paymentDate, note, paymentMethod } = req.body;
  {
    if (!inventory_id) {
      common.formValidate("inventory_id", res);
      return false;
    }

    if (!adminID) {
      common.formValidate("adminID", res);
      return false;
    }
    if (!paymentMethod) {
      common.formValidate("paymentMethod", res);
      return false;
    }
  }

  inventoryTable.findOne({ _id: inventory_id }).exec(function (err, data) {
    if (err) {
      res.status(404).json({ message: "error", data: err, code: 0 });
      return;
    } else if (!data) {
      res.status(404).json({
        message: "error",
        data: "inventory_id not found in the database",
        code: 0,
      });
      return;
    }

    // var updateData = {
    //   paymentStatus: "Complete",
    //   paymentMethod: paymentMethod,
    //   note: note,
    //   paymentDate: paymentDate,
    //   paymentUpdateByAdminID: adminID,
    // };
    // console.log(inventory_id)
    inventoryTable.updateOne(
      { _id: inventory_id },
      {
        $set: {
          paymentStatus: "Complete",
          paymentMethod: paymentMethod,
          note: note,
          paymentDate: paymentDate,
          paymentUpdateByAdminID: adminID,
        },
      },
      { new: true },
      function (err, data) {
        if (err) {
          res.status(500).json({ message: "", data: err, code: 0 });
        } else {
          res.status(200).json({ message: "ok", data: "", code: 1 });
          return;
        }
      }
    );
  });
};

// Supplier Invoice/Bill Generation *************************************************************************
module.exports.generateSupplierBill = async (req, res) => {
  const { inventory_id } = req.body;

  if (!inventory_id) {
    common.formValidate("inventory_id", res);
    return false;
  }

  // get inventory details
  let inventory = await inventoryTable
    .findOne({ _id: inventory_id })
    .populate("supplier_id")
    .populate("admin_id")
    .populate("inventoryItems")
    .lean();
  //console.log("inventory ::::::::::::::::::::::", inventory);
  if (!inventory) {
    res.status(500).json({
      message: "No inventory found in db",
    });
  }

  // get company details
  var company = await Company.findOne({ isDefault: true }).lean();

  // let defaultFooterHTML = "";
  // let lastFooterHTML = "";
  // return;

  var html = `<div>
        <style>
        * {
            font-size: 7px;
        }
        .abcde {
            color: blue;
        }
        html,
        body {
            padding: 0;
            margin: 0;
            width: 100%;
            height: 100%;
        }
        td {
            vertical-align: baseline;
            padding: 0mm 1mm;
            /* background: #fff; */
        }
        .table2 > thead td {
            vertical-align: middle;
        }
        .text-right {
            text-align: right;
        }
        .border-tb-0 {
            border-top: 0px !important;
            border-bottom: 0px !important;
        }
        .no-border{
            border: none;
        }
        .table1,
        .table2,
        .table3,
        .table4 {
            border-collapse: collapse;
            border-color: black;
            width: 100%;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        .table1 {
            height: 58mm;
        }
        .table4 {
            height: 40mm;
        }
        .group-product *{
            font-size: 6px;
        }
    </style>

    <table class="table2 border-tb-0" border="1">
            <thead>
                <tr style="text-align: center; height: 5mm">
                    <td width="4%">S. No.</td>
                    <td width="40%">Description of Goods</td>
                    <td width="11%">Per</td>
                    <td width="8%">Quantity</td>
                    <td width="8%">Rate</td>
                    <td width="8%">HSN/SAC</td>
                    <td width="21%">Amount</td>
                </tr>
            </thead>
            <tbody>

                <tr class="border-tb-0" height="3mm">
                    <td class="border-tb-0"></td>
                    <td class="border-tb-0"></td>
                    <td class="border-tb-0"></td>
                    <td class="border-tb-0"></td>
                    <td class="border-tb-0"></td>
                    <td class="border-tb-0"></td>
                    <td class="border-tb-0"></td>
                </tr>

                ${inventory.inventoryItems
                  .map((inventoryItem, index) => {
                    // let subIndex = 0;
                    return `
                            <tr class="no-border" style="height: 7mm">
                                <td class="no-border">${index + 1}</td>
                                <td class="no-border"><strong>${common.toTitleCase(
                                  inventoryItem.product_name
                                )}</strong></td>
                                <td class="text-right no-border">${
                                  inventoryItem.product_measurment
                                }</td>
                                
                                <td class="text-right no-border">
                                    <strong>${common.toTitleCase(
                                      inventoryItem.productQuantity +
                                        " " +
                                        inventoryItem.product_measurment
                                    )}</strong>
                                </td>
                                <td class="text-right no-border">${
                                  inventoryItem.singlepricewithoutgst
                                    ? inventoryItem.singlepricewithoutgst.toFixed(
                                        2
                                      )
                                    : (+inventoryItem.product_costPrice).toFixed(
                                        2
                                      )
                                }</td>
                                
                                <td class="no-border">${
                                  inventoryItem.product_id.hsnCode || ""
                                }</td>
                               
                                <td class="text-right no-border">
                                    <strong>${(+inventoryItem.invoice_without_gst).toFixed(
                                      2
                                    )}</strong>
                                </td>
                            </tr>
                        `;
                  })
                  .join("")}
            </tbody>
        </table>

    </div>`;

  let defaultFooterHTML = `<div>
      <table class="table3" border="1" style="border-top: 0px">
      <tr class="border-tb-0" style="height: 7mm">
        <td class="border-tb-0" width="4%"></td>
        <td class="border-tb-0" width="40%"></td>
        <td class="border-tb-0" width="11%"></td>
        <td class="border-tb-0" width="8%"></td>
        <td class="border-tb-0" width="8%"></td>
        <td class="border-tb-0" width="8%"></td>
        <td class="border-tb-0" width="21%"></td>
      </tr>
      <tr class="border-tb-0" style="height: 7mm">
        <td class="border-tb-0"></td>
        <td class="border-tb-0"></td>
        <td class="border-tb-0"></td>
        <td class="border-tb-0"></td>
        <td class="border-tb-0"></td>
        <td class="border-tb-0"></td>
        <td class="border-tb-0"></td>
      </tr>
      <tr style="height: 5mm; vertical-align: middle">
      <td style="vertical-align: middle" colspan="6">Total</td>
      <td style="vertical-align: middle" class="text-right">${(+inventory.AmountWithoutGSTandDelivery).toFixed(
        2
      )}</td>
    </tr>
    </table>
    <table class="table4" style="border-top: none" border="1">

      <tr style="border-top: none">
        <td colspan="2">
          Tax 
        </td>
        <td class="text-right" width="50%">
        + &#8377;  ${
          inventory.total_gst ? (+inventory.total_gst).toFixed(2) : 0
        }
        </td>
      </tr>

      <tr>
        <td colspan="2">Delivery Charges</td>
        <td class="text-right" width="50%"> + &#8377; ${(inventory.delivery_charges
          ? +inventory.delivery_charges
          : 0
        ).toFixed(2)}</td>
      </tr>

      <tr>
        <td colspan="2" class="text-right" style="font-size: 20px !important; padding: 1mm"><strong> Total </strong></td>
        <td width="50%" class="text-right"><strong style="font-size: 9px"> &#8377; ${(inventory.InvoiceAmount
          ? +inventory.InvoiceAmount
          : 0
        ).toFixed(2)} </strong></td>
      </tr>
      <tr class="border-tb-0">
        <td class="border-tb-0" colspan="3">
          <div>
            <span style="float: right">E. & O.E</span>
            Amount Chargeable (in words) <br />
          </div>
          <strong style="text-transform: capitalize"
            >INR ${numWords(
              (+inventory.InvoiceAmount).toString().split(".")[0]
            )} ${
      Number((+inventory.InvoiceAmount).toString().split(".")[1])
        ? " Point "
        : ""
    } ${numWords((+inventory.InvoiceAmount).toString().split(".")[1])}
            Only</strong>
        </td>
      </tr>
      <tr class="border-tb-0">
        <td width="50%" class="border-tb-0" style="height: 15mm">
          <u>Declaration</u> <br />
          I / We hereby Certify that food/ Foods mentioned in this invoice is/ are warranted to be OD the nature and Quality which it theses puports/
          purported to be:
        </td>
        <td colspan="2" class="sign text-right border-tb-0" style="outline: 1px solid #000; height: 15mm">
          <strong>for KRISHI CRESS (2021-22)</strong>
          <br />
          <br />
          <br />
          <br />
          <span>Authorised Signatory</span>
        </td>
      </tr>
    </table>
  </div>`,
    lastFooterHTML = `<div>
    <table class="table3" border="1" style="border-top: 0px">
      <tr class="border-tb-0" style="height: 7mm">
        <td class="border-tb-0" width="4%"></td>
        <td class="border-tb-0" width="40%"></td>
        <td class="border-tb-0" width="11%"></td>
        <td class="border-tb-0" width="8%"></td>
        <td class="border-tb-0" width="8%"></td>
        <td class="border-tb-0" width="8%"></td>
        <td class="border-tb-0" width="21%"></td>
      </tr>
      <tr class="border-tb-0" style="height: 7mm">
        <td class="border-tb-0"></td>
        <td class="text-right border-tb-0" style="vertical-align: middle"></td>
        <td class="border-tb-0"></td>
        <td class="border-tb-0"></td>
        <td class="border-tb-0"></td>
        <td class="border-tb-0"></td>
        <td class="text-right border-tb-0">
          <strong></strong>
        </td>
      </tr>
      <tr style="height: 5mm; vertical-align: middle">
        <td style="vertical-align: middle" colspan="6">Total</td>
        <td style="vertical-align: middle" class="text-right">${(+inventory.AmountWithoutGSTandDelivery).toFixed(
          2
        )}</td>
      </tr>
    </table>
    <table class="table4" style="border-top: none" border="1">

      <tr style="border-top: none">
        <td colspan="2">
          Tax 
        </td>
        <td class="text-right" width="50%">
        + &#8377; ${inventory.total_gst ? (+inventory.total_gst).toFixed(2) : 0}
        </td>
      </tr>

      <tr>
        <td colspan="2">Delivery Charges</td>
        <td class="text-right" width="50%"> + &#8377; ${(inventory.delivery_charges
          ? +inventory.delivery_charges
          : 0
        ).toFixed(2)}</td>
      </tr>

      <tr>
        <td colspan="2" class="text-right" style="font-size: 20px !important; padding: 1mm"><strong> Total </strong></td>
        <td width="50%" class="text-right"><strong style="font-size: 9px"> &#8377; ${(+inventory.InvoiceAmount).toFixed(
          2
        )} </strong></td>
      </tr>
      <tr class="border-tb-0">
        <td class="border-tb-0" colspan="3">
          <div>
            <span style="float: right">E. & O.E</span>
            Amount Chargeable (in words) <br />
          </div>
          <strong style="text-transform: capitalize"
            >INR ${numWords(
              (+inventory.InvoiceAmount).toString().split(".")[0]
            )} ${
      Number((+inventory.InvoiceAmount).toString().split(".")[1])
        ? " Point "
        : ""
    } ${numWords((+inventory.InvoiceAmount).toString().split(".")[1])}
            Only</strong
          >
        </td>
      </tr>
      <tr class="border-tb-0">
        <td width="50%" class="border-tb-0" style="height: 15mm">
          <u>Declaration</u> <br />
          I / We hereby Certify that food/ Foods mentioned in this invoice is/ are warranted to be OD the nature and Quality which it theses puports/
          purported to be:
        </td>
        <td colspan="2" class="sign text-right border-tb-0" style="outline: 1px solid #000; height: 15mm">
          <strong>for KRISHI CRESS (2021-22)</strong>
          <br />
          <br />
          <br />
          <br />
          <span>Authorised Signatory</span>
        </td>
      </tr>
    </table>
  </div>`;

  // ${booking.allGstLists.length > 0 ? `(${booking.allGstLists.map((item) => `${item.tax_name} ${item.tax_percent}%`).join(" + ")})` : ""}
  // td value
  // ${booking.allGstLists.length > 0 ? `${booking.allGstLists.map((item) => (+item.totalPrice).toFixed(2)).join(" + ")} <br />` : ""}
  //         <strong style="font-size: 8px"> &#8377; ${(+taxAmount).toFixed(2)} </strong>
  var options = {
    format: "A4",
    orientation: "portrait",
    border: "5mm",
    header: {
      height: "94mm",
      // contents: "",
      contents: `<div class="header-wrapper" style="height: 61mm">
      <div style="text-align: center; height: 13mm">
        <strong style="color: #f8bb15; font-size: 8mm; font-family: sans-serif"
          >Bill of Supply</strong
        >
      </div>
      <table class="table1" border="1">
        <tr>
          <td rowspan="2" width="60%" style="vertical-align: middle;">
          <strong>${common.toTitleCase(inventory.supplier_id.name)}</strong>
          <br />
          <strong>${inventory.supplier_id.company_name.toUpperCase()}</strong>
            <br />
            ${inventory.supplier_id.address} <br />
            GSTIN/UIN: ${inventory.supplier_id.gst_no} <br />
            E-Mail : ${inventory.supplier_id.email}
          </td>
          <td width="20%">
            <span style="font-size: 6px">Bill KC No.</span> <br />
            <strong>${inventory.billNo}</strong>
          </td>
          <td width="20%">
            <span style="font-size: 6px">Dated</span> <br />
            <strong>${moment(inventory.InvoiceDate).format(
              "DD-MMM-YY"
            )}</strong>
          </td>
        </tr>
        <tr>
          <td>
            <span style="font-size: 6px">Reference No. & Date.</span> <br />
            <strong></strong>
          </td>
          <td>
            <span style="font-size: 6px">Other References</span> <br />
            <strong></strong>
          </td>
        </tr>
    
        <tr>
          <td rowspan="2" >
            <span style="font-size: 6px">Consignee (Ship to)</span> <br />
            <strong>${company.name.toUpperCase()} (${new Date()
        .getFullYear()
        .toString()}-${(new Date().getFullYear() + 1)
        .toString()
        .slice(2)})</strong>
                  <br />
                  ${company.address.address} <br />
                  ${
                    company.address.locality
                      ? `${company.address.locality} <br />`
                      : ""
                  } ${company.address.city} <br />
                  FSSAI NO - ${company.FSSAI_NO} <br />
                  ${company.address.state} - ${company.address.pincode}, ${
        company.address.country
      } <br />
                  GSTIN/UIN: ${company.GSTIN_UIN} <br />
                  State Name : ${company.address.state}, Code : ${
        company.address.state_code
      } <br />
                  E-Mail : ${company.email}
          </td>
          <td>
            <span style="font-size: 6px">Bill Number</span> <br />
            <strong>${inventory.InvoiceNumber}</strong>
          </td>
          <td>
            <span style="font-size: 6px">Due Date</span> <br />
            <strong>${moment(inventory.InvoiceDueDate).format(
              "DD-MMM-YY"
            )}</strong>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <span style="font-size: 6px">Payment Method</span> <br />
            <strong style="font-size: 12px">${
              inventory.paymentMethod ? inventory.paymentMethod : ""
            }</strong>
          </td>
        </tr>
    
        <tr>
          <td rowspan="2">
            <span style="font-size: 6px">Buyer (Bill to)</span> <br />
            <strong>${company.name.toUpperCase()} (${new Date()
        .getFullYear()
        .toString()}-${(new Date().getFullYear() + 1)
        .toString()
        .slice(2)})</strong>
                  <br />
                  ${company.address.address} <br />
                  ${
                    company.address.locality
                      ? `${company.address.locality} <br />`
                      : ""
                  } ${company.address.city} <br />
                  FSSAI NO - ${company.FSSAI_NO} <br />
                  ${company.address.state} - ${company.address.pincode}, ${
        company.address.country
      } <br />
                  GSTIN/UIN: ${company.GSTIN_UIN} <br />
                  State Name : ${company.address.state}, Code : ${
        company.address.state_code
      } <br />
                  E-Mail : ${company.email}
          </td>
          <td colspan="2">
            <span style="font-size: 6px"></span> <br />
            <strong></strong>
          </td>
        </tr>
      </table>
    </div>
    `,
      align: "start",
    },
    footer: {
      height: "78mm",
      contents: {
        default: defaultFooterHTML, // fallback value
        last: lastFooterHTML,
      },
    },
  };
  // let currentTimeInMs = new Date().getTime();

  pdf
    .create(html, options)
    .toFile(
      Path.join(__dirname, `../../public/supplier_bill/dump/bill-new.pdf`),
      async function (err, document) {
        if (err) {
          errorLogger.error(err, "\n", "\n");
          console.log(err);
          return;
        }

        //console.log(document);
        // Load a PDFDocument from the existing PDF bytes
        const existingPdfBytes = fs.readFileSync(document.filename);
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        // Get pages of the document
        const pages = pdfDoc.getPages();
        // const logoImage = await pdfDoc.embedJpg(logoBytes);
        // const watermarkImage = await pdfDoc.embedPng(watermarkBytes);

        // let watermarkWidth = 300;
        // let watermarkHeight = 300;

        pages.forEach((page) => {
          // draw header logo
          // page.drawImage(logoImage, {
          //   x: 30,
          //   y: 695,
          //   width: 80,
          //   height: 80,
          // });

          // draw water-mark image
          // page.drawImage(watermarkImage, {
          //     x: page.getWidth() / 2 - watermarkWidth / 2,
          //     y: page.getHeight() / 2 - watermarkHeight + 100,
          //     width: watermarkWidth,
          //     height: watermarkHeight,
          // });

          // draw lines to fill table void
          let svgPath = "M 14.3 282, V 610";
          page.moveTo(0, page.getHeight());
          page.drawSvgPath(svgPath, {
            borderColor: rgb(0, 0, 0),
            borderWidth: 1.1,
          });

          svgPath = "M 37.8 282, V 610";
          page.moveTo(0, page.getHeight());
          page.drawSvgPath(svgPath, {
            borderColor: rgb(0, 0, 0),
            borderWidth: 1.1,
          });

          svgPath = "M 265 282, V 610";
          page.moveTo(0, page.getHeight());
          page.drawSvgPath(svgPath, {
            borderColor: rgb(0, 0, 0),
            borderWidth: 1.1,
          });

          svgPath = "M 327.4 282, V 610";
          page.moveTo(0, page.getHeight());
          page.drawSvgPath(svgPath, {
            borderColor: rgb(0, 0, 0),
            borderWidth: 1.1,
          });

          svgPath = "M 372.5 282, V 610";
          page.moveTo(0, page.getHeight());
          page.drawSvgPath(svgPath, {
            borderColor: rgb(0, 0, 0),
            borderWidth: 1.1,
          });

          svgPath = "M 417.4 282, V 610";
          page.moveTo(0, page.getHeight());
          page.drawSvgPath(svgPath, {
            borderColor: rgb(0, 0, 0),
            borderWidth: 1.1,
          });

          svgPath = "M 462 282, V 610";
          page.moveTo(0, page.getHeight());
          page.drawSvgPath(svgPath, {
            borderColor: rgb(0, 0, 0),
            borderWidth: 1.1,
          });

          // svgPath = "M 507 282, V 610";
          // page.moveTo(0, page.getHeight());
          // page.drawSvgPath(svgPath, { borderColor: rgb(0, 0, 0), borderWidth: 1.1 });

          svgPath = "M 580.5 282, V 610";
          page.moveTo(0, page.getHeight());
          page.drawSvgPath(svgPath, {
            borderColor: rgb(0, 0, 0),
            borderWidth: 1.1,
          });
        });

        // export new pdf
        const pdfBytes = await pdfDoc.save();
        fs.writeFile(
          Path.join(__dirname, `../../public/supplier_bill/dump/bill-new.pdf`),
          pdfBytes,
          (err) => {
            if (err) throw err;
            res.json({
              pdf: {
                filename: `supplier_bill/dump/bill-new.pdf`,
                // filename: `invoices/dump/invoice.pdf`,
              },
            });
          }
        );
      }
    );
};

// ***********************************************************************************
