var express = require("express");
var router = express.Router();

const auth = require("../middlewares/auth.js");

var ctrlUsers = require("../controllers/users.controllers.js");
var ctrlProductCotegory = require("../controllers/product_category.controller.js");
var ctrlProductCategories = require("../controllers/category.controller.js");
var ctrlSizeMaster = require("../controllers/size_master.controller.js");
var ctrlColorMaster = require("../controllers/color_master.controller.js");
var ctrlCouponMaster = require("../controllers/coupon_master.controller.js");
var ctrlVoucherHeadMaster = require("../controllers/voucher_head_master.controller.js");
var ctrlStockMaster = require("../controllers/stock_master.controller.js");
var ctrlSupplierMaster = require("../controllers/supplier_master.controller.js");
var ctrlProduct = require("../controllers/product.controller.js");
var ctrlOrder = require("../controllers/orders.controller.js");
var ctrlCron = require("../controllers/cron.controller.js");
var ctrlReport = require("../controllers/report_summary.controller.js");
var ctrlBanner = require("../controllers/banner.controller");
var ctrlSlide = require("../controllers/slides.controller");
var ctrlPayment = require("../controllers/payment.controller");
var ctrlPaymentOptions = require("../controllers/payment_options.controller");
var ctrlSMSGateway = require("../controllers/sms_gateways.controller");
var ctrlUserAddress = require("../controllers/userAddress.controller");
var ctrlBlog = require("../controllers/blog.controller");
var ctrlFeedback = require("../controllers/feedback.controller");
var ctrlAdmin = require("../controllers/adminLogin.controllers");
var ctrlNewsletter = require("../controllers/newsletter.controller");
var ctrlSubCat1 = require("../controllers/subCat1.controller");
var ctrlSubCat2 = require("../controllers/subCat2.controller");
var ctrlAttributeGroup = require("../controllers/attribute_group.controller");
var ctrlAttribute = require("../controllers/attribute.controller");
var ctrlAccountHead = require("../controllers/account_head.controller");
var ctrlRegion = require("../controllers/region.controller");
var ctrlMeasure = require("../controllers/unit_measurement.controller");
var ctrlRole = require("../controllers/role.controller");
var ctrlRoleModule = require("../controllers/role_modules.controller");
var ctrlBlogCat = require("../controllers/blog_category.controller");
var ctrlTax = require("../controllers/tax.controller");
var ctrlInventory = require("../controllers/inventory.controller");
var ctrlAddTocart = require("../controllers/addtocart.controller");
var ctrlFAQ = require("../controllers/faq.controller");
var ctrlBooking = require("../controllers/booking.controller");
var voucherInventory = require("../controllers/voucherInventory.controller");
var ctrlDriver = require("../controllers/drivers.controller");
var ctrlSetting = require("../controllers/setting.controller");
var ctrlStoreheySetting = require("../controllers/storeheysetting.controller");
var ctrlSubscription = require("../controllers/subscription.controller");
var ctrlLoyality = require("../controllers/loyality_program.controller");
var ctrlWallet = require("../controllers/wallet.controller");
var ctrlCompany = require("../controllers/company.controller");
var ctrlPincode = require("../controllers/pincode.controller");
var ctrlOnOff = require("../controllers/email_sms_on_off.controller");
var EmailDynamic = require("../controllers/emailTemplate.controller");
var ctrlPages = require("../controllers/pages.controller");
var ctrlRR = require("../controllers/ratingreviews.controller");
// router
//   .route('/paynow')
//   .post(ctrlUsers.paynow);

// router
//   .route('/callback')
//   .post(ctrlUsers.callback)

router.route("/ratingreviews/add").post(ctrlRR.AddOne);
router.route("/ratingreviews/GetAll").post(ctrlRR.GetAll);

// email dynamic api
router.route("/emailTemp/add").post(EmailDynamic.AddOne);
router.route("/emailTemp/all").post(EmailDynamic.GetAll);
router.route("/emailTemp/one").post(EmailDynamic.GetOne);
router.route("/emailTemp/active/one").post(EmailDynamic.GetActiveOne);
router.route("/emailTemp/update").post(EmailDynamic.Update);
router.route("/emailTemp/delete").post(EmailDynamic.DeleteOne);

router.route("/admin/page/AddOne").post(ctrlPages.AddOne);
router.route("/admin/page/GetAll").post(ctrlPages.GetAll);
router.route("/admin/page/GetOne").post(ctrlPages.GetOne);
router.route("/admin/page/GetActiveOne").post(ctrlPages.GetActiveOne);
router.route("/admin/page/UpdateOne").post(ctrlPages.UpdateOne);
router.route("/admin/page/DeleteOne").post(ctrlPages.DeleteOne);

// User route
router.route("/users").post(ctrlUsers.usersAddOne);

router.route("/admin/usersGetAllActive").get(auth.authenticateAdmin, ctrlUsers.usersGetAllActive);

router.route("/admin/usersGetAll").post(auth.authenticateAdmin, ctrlUsers.usersGetAll);
router.route("/admin/AdminUsersGetAll").post(auth.authenticateAdmin, ctrlUsers.AdminUsersGetAll);
router.route("/admin/getAllUsersBrief").get(auth.authenticateAdmin, ctrlUsers.getAllUsersBrief);

router.route("/admin/usersDeleteOne").post(auth.authenticateAdmin, ctrlUsers.usersDeleteOne);

router.route("/usersGetOne").get(auth.authenticateUser, ctrlUsers.usersGetOne);
router.route("/admin/usersGetOne").post(auth.authenticateAdmin, ctrlUsers.admin_usersGetOne);

router.route("/userUpdate").post(auth.authenticateUser, ctrlUsers.userUpdate);

router.route("/admin/userCreateByAdmin").post(auth.authenticateAdmin, ctrlUsers.userCreateByAdmin);

router.route("/admin/userUpdateByAdmin").post(auth.authenticateAdmin, ctrlUsers.userUpdateByAdmin);

router.route("/userLogin").post(ctrlUsers.userLogin);

// router
//   .route('/ProductThresholdMail')
//   .get(ctrlReport.ProductThresholdMail)
router.route("/userImport").get(ctrlReport.userImport);
router.route("/admin/LastMonthsaleSummary").get(auth.authenticateAdmin, ctrlReport.LastMonthsaleSummary);
router.route("/admin/TopTenCustomer").get(auth.authenticateAdmin, ctrlReport.TopTenCustomer);

router.route("/TopTenProductsOfUser").post(auth.authenticateUser, ctrlReport.TopTenProductsOfUser);
router.route("/admin/TopTenProductsOfUser").post(auth.authenticateAdmin, ctrlReport.TopTenProductsOfUserForAdmin);

router.route("/admin/DailySaleReport").post(auth.authenticateAdmin, ctrlReport.DailySaleReport);
router.route("/admin/TotalSaleReport").get(auth.authenticateAdmin, ctrlReport.TotalSaleReport);

router.route("/admin/dashboard-counts").get(auth.authenticateAdmin, ctrlReport.getDashboardCounts);
router.route("/admin/analytics-dashboard").post(ctrlReport.getAnalyticsDashboard);

router.route("/TopTenBestSellerProducts").get(ctrlReport.TopTenBestSellerProducts);
router.route("/admin/TopTenBestSellerProducts").get(auth.authenticateAdmin, ctrlReport.TopTenBestSellerProducts);

router.route("/admin/TopFiveBestSellerCategory").get(auth.authenticateAdmin, ctrlReport.TopFiveBestSellerCategory);

// router.route("/ItemConsolidated").post(ctrlReport.ItemConsolidated);

// router.route("/CSVItemConsolidated").post(ctrlReport.CSVItemConsolidated);

// router.route("/OrderWiseReport").post(ctrlReport.OrderWiseReport);

// router
//     .route("/CSVReportOrderWiseReport")
//     .post(ctrlReport.CSVReportOrderWiseReport);

// router.route("/OrderWiseSalesSummery").post(ctrlReport.OrderWiseSalesSummery);

// router
//     .route("/CSVReportOrderWiseSalesSummery")
//     .post(ctrlReport.CSVReportOrderWiseSalesSummery);

// router.route("/CustomerDataReport").post(ctrlReport.CustomerDataReport);

// router.route("/CSVCustomerDataReport").post(ctrlReport.CSVCustomerDataReport);

router.route("/admin/CSVReportGenrate").post(auth.authenticateAdmin, ctrlReport.CSVReportGenrate);

router.route("/admin/CSVReportListing").post(auth.authenticateAdmin, ctrlReport.CSVReportListing);

// Product category route
router
  .route("/admin/product_category")
  .get(auth.authenticateAdmin, ctrlProductCategories.GetAll)
  .post(auth.authenticateAdmin, ctrlProductCategories.AddOne);

router.route("/admin/product_category/update").post(ctrlProductCategories.Update);

router.route("/admin/product_category/GetAll").post(auth.authenticateAdmin, ctrlProductCategories.GetAll);

router.route("/product_category/active").get(ctrlProductCotegory.GetAllActive);

router.route("/admin/allproductCategory").get(auth.authenticateAdmin, ctrlProductCotegory.getAllCategories);

router.route("/admin/deleteAllCategory").post(auth.authenticateAdmin, ctrlProductCategories.deleteCategory);
router.route("/admin/updateCategoryStatus").post(auth.authenticateAdmin, ctrlProductCategories.updateCategoryStatus);

router.route("/updateAnyCategory").post(ctrlProductCotegory.updateAnyCategory);

router.route("/product_category/:Id").get(ctrlProductCotegory.GetOne).delete(ctrlProductCotegory.DeleteOne);

// Size master route
router.route("/size_master").get(ctrlSizeMaster.GetAll).post(ctrlSizeMaster.AddOne).put(ctrlSizeMaster.Update);

router.route("/size_master/active").get(ctrlSizeMaster.GetAllActive);

router.route("/size_master/:Id").get(ctrlSizeMaster.GetOne).delete(ctrlSizeMaster.DeleteOne);

// color master route
router.route("/color_master").get(ctrlColorMaster.GetAll).post(ctrlColorMaster.AddOne).put(ctrlColorMaster.Update);

router.route("/color_master/active").get(ctrlColorMaster.GetAllActive);

router.route("/color_master/:Id").get(ctrlColorMaster.GetOne).delete(ctrlColorMaster.DeleteOne);

// voucher head master route here ctrlVoucherHeadMaster
router.route("/voucher_head_master").get(ctrlVoucherHeadMaster.GetAll).post(ctrlVoucherHeadMaster.AddOne).put(ctrlVoucherHeadMaster.Update);

router.route("/voucher_head_master/active").get(ctrlVoucherHeadMaster.GetAllActive);

router.route("/voucher_head_master/:Id").get(ctrlVoucherHeadMaster.GetOne).delete(ctrlVoucherHeadMaster.DeleteOne);

// coupon master route here ctrlCouponMaster
router.route("/admin/coupon_master").post(auth.authenticateAdmin, ctrlCouponMaster.AddOne);

router.route("/admin/update/coupon_master").post(auth.authenticateAdmin, ctrlCouponMaster.Update);

router.route("/admin/getAll/coupon_master").post(auth.authenticateAdmin, ctrlCouponMaster.GetAll);

router.route("/GetCouponByCode").post(ctrlCouponMaster.GetCouponByCode);

router.route("/coupons/getAllForHomePage").get(ctrlCouponMaster.getAllCatelogTrue);

router.route("/coupon_master/active").get(ctrlCouponMaster.GetAllActive);

router.route("/coupon_master/:Id").get(ctrlCouponMaster.GetOne);

router.route("/admin/coupon_master_delete").post(ctrlCouponMaster.DeleteOne);

router.route("/apply_coupon").post(ctrlCouponMaster.applyCoupon);

router.route("/apply_coupon").put(ctrlCouponMaster.applyCoupon);

// stock master route here ctrlStockMaster
router.route("/stock_master").get(ctrlStockMaster.GetAll).post(ctrlStockMaster.AddOne).put(ctrlStockMaster.Update);

router.route("/stock_master/active").get(ctrlStockMaster.GetAllActive);

router.route("/stock_master/:Id").get(ctrlStockMaster.GetOne).delete(ctrlStockMaster.DeleteOne);

router.route("/stock_count").get(ctrlStockMaster.StockCount);

router.route("/get_last_voucher_no").get(ctrlStockMaster.GetVoucherNo);

router.route("/stock_master_no_available_qty").get(ctrlStockMaster.GetAllNoqty);

router.route("/stock_master_no_available_qty_count").get(ctrlStockMaster.GetAllNoqtyCount);

router.route("/stock_approved_byadmin").put(ctrlStockMaster.stockApproved);

// product route here ctrlProduct
router.route("/productbystock/:Id").get(ctrlProduct.GetAllByStock);

router.route("/admin/product").get(auth.authenticateAdmin, ctrlProduct.GetAll).post(auth.authenticateAdmin, ctrlProduct.AddOne);

router.route("/admin/update/product").post(auth.authenticateAdmin, ctrlProduct.UpdateProduct);

router.route("/admin/getAll/product").post(auth.authenticateAdmin, ctrlProduct.GetAll);

router.route("/addProduct").post(auth.authenticateAdmin, ctrlProduct.AddOne);

router.route("/updateProductStatus").post(ctrlProduct.updateProductStatus);
router.route("/updateProductShowStatus").post(ctrlProduct.updateProductShowStatus);
router.route("/admin/updateFarmPickUpStatus").post(auth.authenticateAdmin, ctrlProduct.updateFarmPickUpStatus);
router.route("/admin/updateSameDayDlvryStatus").post(auth.authenticateAdmin, ctrlProduct.updateSameDayDlvryStatus);

router.route("/admin/product/active").get(auth.authenticateAdmin, ctrlProduct.GetAllActive);
router.route("/admin/product/activeSimple").get(auth.authenticateAdmin, ctrlProduct.GetAllActiveSimple);
router.route("/admin/product/allActiveProducts").get(auth.authenticateAdmin, ctrlProduct.getAllActiveProducts);

router.route("/admin/product/inInventory").get(auth.authenticateAdmin, ctrlProduct.getAllProductsInInventory);

router.route("/admin/product/forHome/byregion/").post(auth.authenticateAdmin, ctrlProduct.GetAllActiveProductByregion);
router.route("/admin/product/forAdmin/byregion/").post(auth.authenticateAdmin, ctrlProduct.GetAllActiveProductBriefByregion);

router.route("/GetProductByregionAndProductId").post(ctrlProduct.GetProductByregionAndProductId);

router.route("/admin/product/:Id").get(auth.authenticateAdmin, ctrlProduct.GetOne).delete(auth.authenticateAdmin, ctrlProduct.DeleteOne);

router.route("/getProductDetail/:Id").get(ctrlProduct.GetOneDetail);

router.route("/product_count").get(ctrlProduct.productCount);

router.route("/get_last_product_id").get(ctrlProduct.GetProductId);

router.route("/admin/getConProductByRegion").post(auth.authenticateAdmin, ctrlProduct.checkVariantByRegion);

router.route("/product_detail_by_code/:our_product_code").get(ctrlProduct.GetOneProductByCode);
router.route("/get_product_size_by_code").post(ctrlProduct.GetProductSizeByCode);
router.route("/get_product_color_by_size").post(ctrlProduct.GetProductColorBySize);

router.route("/product_approved_byadmin").put(ctrlProduct.prodctApproved);

router.route("/check-csv").get(ctrlProduct.checkCsv);

router.route("/admin/FilterProducts").post(auth.authenticateAdmin, ctrlProduct.FilterProducts);

router.route("/checkVariant").post(ctrlProduct.checkVariant);

router.route("/searchProduct").post(ctrlProduct.searchProduct);
router.route("/filterVariantsByAttributes").post(ctrlProduct.filterVariantsByAttributes);

// orders route here ctrlOrder
router.route("/create_order").post(ctrlOrder.AddOne);

router.route("/orders").get(ctrlOrder.GetAll);

router.route("/orders/:Id").get(ctrlOrder.GetOne);

router.route("/order_count").get(ctrlOrder.orderCount);

router.route("/updateOrder").post(ctrlOrder.Update);

// router
//   .route('/updateOrderStatus')
//   .post(ctrlOrder.UpdateStatus)

// router
//   .route('/stock_count')
//   .get(ctrlStockMaster.StockCount);
// router
//   .route('/product_category_update')
//   .put(ctrlProductCotegory.Update)

// supplier master route here
router.route("/admin/supplier_master").get(auth.authenticateAdmin, ctrlSupplierMaster.GetAll).post(auth.authenticateAdmin, ctrlSupplierMaster.AddOne);

router.route("/admin/update/supplier_master").post(auth.authenticateAdmin, ctrlSupplierMaster.Update);

router.route("/admin/get/supplier_master").post(auth.authenticateAdmin, ctrlSupplierMaster.GetAll);

router.route("/supplier_master/active").get(ctrlSupplierMaster.GetAllActive);

router.route("/admin/GetInvoiceDueDate").post(auth.authenticateAdmin, ctrlSupplierMaster.GetInvoiceDueDate);

router.route("/supplier_master/:Id").get(ctrlSupplierMaster.GetOne);

router.route("/admin/supplier_master_delete").post(ctrlSupplierMaster.DeleteOne);

// All cron routes here
router.route("/shoot-email-for-available-qty").get(ctrlCron.shootEmailForAvailableQty);

// All reports routes here
router.route("/get_reports").get(ctrlReport.GetAll);

router.route("/filter_reports").put(ctrlReport.searchGetAll);

router.route("/ledger_reports").put(ctrlReport.searchLedgers);

// Banner route
router.route("/admin/getAllBanner").get(auth.authenticateAdmin, ctrlBanner.GetAll);

router.route("/admin/createBanner").post(auth.authenticateAdmin, ctrlBanner.AddOne);

router.route("/admin/updateBanner").post(auth.authenticateAdmin, ctrlBanner.Update);

router.route("/getActiveBanner").get(ctrlBanner.GetAllActive);

router.route("/admin/deleteBanner").post(auth.authenticateAdmin, ctrlBanner.DeleteOne);

// Slide route
router.route("/getAllSlide").post(ctrlSlide.GetAll);

router.route("/admin/getAllSlide").post(auth.authenticateAdmin, ctrlSlide.GetAll);

router.route("/admin/createSlide").post(auth.authenticateAdmin, ctrlSlide.AddOne);

router.route("/admin/updateSlide").post(auth.authenticateAdmin, ctrlSlide.Update);

router.route("/getActiveSlide").get(ctrlSlide.GetAllActive);

router.route("/admin/deleteSlide").post(auth.authenticateAdmin, ctrlSlide.DeleteOne);

//payment data

router.route("/addPaymentDetail").post(ctrlPayment.addPaymentDetail);

router.route("/getAllPayments").get(ctrlPayment.getAllPayments);

router.route("/getOnePayment").post(ctrlPayment.getOnePayment);

router.route("/completePayment").post(ctrlPayment.completePayment);

router.route("/admin/updateOrderStatus").post(auth.authenticateAdmin, ctrlPayment.UpdateStatus);

router.route("/getUserOrders").post(ctrlPayment.getUserOrders);

router.route("/filterPayment").post(ctrlPayment.filterPayment);

router.route("/GetCategoryProducts").get(ctrlProductCotegory.GetCategoryProducts);

router.route("/GetCategorySubCat").post(ctrlProductCategories.GetCategorySubCat);
router.route("/getAllDescendantCategories").post(ctrlProductCategories.getAllDescendantCategories);

router.route("/getUserTotalPayment").post(ctrlPayment.getUserTotalPayment);

// user auth
router.route("/mobileSignUp").post(ctrlUsers.mobileSignUp);
router.route("/createUserWhileSignup").post(ctrlUsers.createUserWhileSignup);

router.route("/userUpdate").post(ctrlUsers.userUpdate);

router.route("/userMobileVerification").post(ctrlUsers.userMobileVerification);

router.route("/resendOtp").post(ctrlUsers.resendOtp);

router.route("/updateMobile").post(ctrlUsers.updateMobile);

// payment keys
router.route("/admin/payment/gateway/add").post(auth.authenticateAdmin, ctrlPaymentOptions.Add);
router.route("/admin/payment/gateway/update").post(auth.authenticateAdmin, ctrlPaymentOptions.Update);
router.route("/admin/payment/gateway/getAll").get(auth.authenticateAdmin, ctrlPaymentOptions.GetAll);
router.route("/admin/payment/gateway/getOne").get(auth.authenticateAdmin, ctrlPaymentOptions.GetOne);
router.route("/admin/payment/gateway/delete").post(auth.authenticateAdmin, ctrlPaymentOptions.DeleteOne);

// sms api
router.route("/admin/sms/gateway/add").post(ctrlSMSGateway.Add);
router.route("/admin/sms/gateway/update").post(ctrlSMSGateway.Update);
router.route("/admin/sms/gateway/getAll").get(ctrlSMSGateway.GetAll);
router.route("/admin/sms/gateway/getOne").get(ctrlSMSGateway.GetOne);
router.route("/admin/sms/gateway/delete").post(ctrlSMSGateway.DeleteOne);

// user address

router.route("/getUserAddress").get(auth.authenticateUser, ctrlUserAddress.GetUserAddress);
router.route("/admin/getUserAddress").post(auth.authenticateAdmin, ctrlUserAddress.admin_GetUserAddress);

router.route("/addUserAddress").post(auth.authenticateUser, ctrlUserAddress.AddOne);
router.route("/admin/addUserAddress").post(auth.authenticateAdmin, ctrlUserAddress.admin_AddOne);

router.route("/admin/deleteUserAddress").post(auth.authenticateAdmin, ctrlUserAddress.DeleteOne);
router.route("/deleteUserAddress").post(auth.authenticateUser, ctrlUserAddress.DeleteOne);

router.route("/updateUserAddress").post(auth.authenticateUser, ctrlUserAddress.Update);
router.route("/admin/updateUserAddress").post(auth.authenticateAdmin, ctrlUserAddress.admin_Update);

// blogs

router.route("/admin/getAllBlog").get(auth.authenticateAdmin, ctrlBlog.GetAll);

router.route("/admin/getAllBlog").post(auth.authenticateAdmin, ctrlBlog.GetAll);

router.route("/SearchBlog").post(ctrlBlog.SearchBlog);

router.route("/getOneBlog").post(ctrlBlog.GetOne);

router.route("/admin/addBlog").post(auth.authenticateAdmin, ctrlBlog.AddOne);

router.route("/admin/deleteBlog").post(auth.authenticateAdmin, ctrlBlog.DeleteOne);

router.route("/admin/updateBlog").post(auth.authenticateAdmin, ctrlBlog.Update);

// Feedbacks

router.route("/admin/getAllFeedback").post(auth.authenticateAdmin, ctrlFeedback.GetAll);

router.route("/addFeedback").post(ctrlFeedback.AddOne);

router.route("/admin/deleteFeedback").post(auth.authenticateAdmin, ctrlFeedback.DeleteOne);

router.route("/updateFeedback").post(ctrlFeedback.Update);

//adminLogin

router.route("/admin/adminAddOne").post(auth.authenticateAdmin, ctrlAdmin.adminAddOne);

router.route("/adminLogin").post(ctrlAdmin.adminLogin);

router.route("/admin/adminGetAll").post(auth.authenticateAdmin, ctrlAdmin.adminGetAll);

router.route("/admin/adminDeleteOne").post(auth.authenticateAdmin, ctrlAdmin.adminDeleteOne);

router.route("/admin/updateAdmin").post(auth.authenticateAdmin, ctrlAdmin.updateAdmin);

// newsletter

router.route("/addNewsletter").post(ctrlNewsletter.AddOne);

router.route("/getAllNewsletter").post(ctrlNewsletter.GetAll);

router.route("/deleteNewsletter").post(ctrlNewsletter.DeleteOne);

//sub category 1
router.route("/admin/addSubCat1").post(auth.authenticateAdmin, ctrlSubCat1.createSubCat1);

router.route("/admin/updateSubCat1").post(auth.authenticateAdmin, ctrlSubCat1.updateSubCat1);

router.route("/getSubCat1").get(ctrlSubCat1.getAllSubCat1);

router.route("/deleteSubCat1").post(ctrlSubCat1.deleteSubCat1);

//sub category 2
router.route("/admin/addSubCat2").post(auth.authenticateAdmin, ctrlSubCat2.createSubCat2);

router.route("/admin/updateSubCat2").post(auth.authenticateAdmin, ctrlSubCat2.updateSubCat2);

router.route("/getSubCat2").get(ctrlSubCat2.getAllSubCat2);

router.route("/deleteSubCat2").post(ctrlSubCat2.deleteSubCat2);

//account head api
router.route("/getAccountHead").post(ctrlAccountHead.GetAll);

router.route("/addAccountHead").post(ctrlAccountHead.AddOne);

router.route("/deleteAccountHead").post(ctrlAccountHead.DeleteOne);

router.route("/updateAccountHead").post(ctrlAccountHead.Update);

// Attribute Groups
router.route("/admin/attributeGroups/getAll").post(auth.authenticateAdmin, ctrlAttributeGroup.GetAll);

router.route("/admin/attributeGroups/add").post(auth.authenticateAdmin, ctrlAttributeGroup.AddOne);

router.route("/admin/attributeGroups/delete").post(auth.authenticateAdmin, ctrlAttributeGroup.DeleteOne);

router.route("/admin/attributeGroups/update").post(auth.authenticateAdmin, ctrlAttributeGroup.UpdateOne);

router.route("/admin/attributeGroups/getAllActive").post(auth.authenticateAdmin, ctrlAttributeGroup.GetAllActive);

// Attributes
router.route("/admin/attributes/getAll").post(auth.authenticateAdmin, ctrlAttribute.GetAll);

router.route("/admin/attributes/add").post(auth.authenticateAdmin, ctrlAttribute.AddOne);

router.route("/admin/attributes/delete").post(auth.authenticateAdmin, ctrlAttribute.DeleteOne);

router.route("/admin/attributes/update").post(auth.authenticateAdmin, ctrlAttribute.Update);

router.route("/admin/attributes/getAllActive").post(ctrlAttribute.GetAllActive);

router.route("/admin/getAttributesInSingleGroup").get(auth.authenticateAdmin, ctrlAttribute.GetAttributesInSingleGroup);

//region
router.route("/admin/getRegion").post(auth.authenticateAdmin, ctrlRegion.GetAll);

router.route("/GetAllCity").get(ctrlRegion.GetAllCity);

router.route("/admin/GetAllCity").get(auth.authenticateAdmin, ctrlRegion.GetAllCity);

router.route("/admin/addRegion").post(auth.authenticateAdmin, ctrlRegion.AddOne);

router.route("/admin/deleteRegion").post(auth.authenticateAdmin, ctrlRegion.DeleteOne);

router.route("/admin/updateRegion").post(auth.authenticateAdmin, ctrlRegion.Update);

router.route("/GetAllActiveRegion").get(ctrlRegion.GetAllActive);

router.route("/admin/GetAllActiveRegion").get(auth.authenticateAdmin, ctrlRegion.GetAllActive);
//tax
router.route("/admin/getTax").post(auth.authenticateAdmin, ctrlTax.GetAll);
router.route("/admin/getTax/active").get(auth.authenticateAdmin, ctrlTax.GetAllActive);

router.route("/admin/addTax").post(auth.authenticateAdmin, ctrlTax.AddOne);

router.route("/admin/deleteTax").post(auth.authenticateAdmin, ctrlTax.DeleteOne);

router.route("/admin/updateTax").post(auth.authenticateAdmin, ctrlTax.Update);

// ctrlMeasure
router.route("/admin/getUnitMeasurement").post(auth.authenticateAdmin, ctrlMeasure.GetAll);

router.route("/admin/addUnitMeasurement").post(auth.authenticateAdmin, ctrlMeasure.AddOne);

router.route("/admin/deleteUnitMeasurement").post(auth.authenticateAdmin, ctrlMeasure.DeleteOne);

router.route("/admin/updateUnitMeasurement").post(auth.authenticateAdmin, ctrlMeasure.Update);

router.route("/admin/GetAllActiveUnitMeasurement").get(auth.authenticateAdmin, ctrlMeasure.GetAllActive);

// role
router.route("/admin/getAllRole").post(auth.authenticateAdmin, ctrlRole.GetAll);

router.route("/admin/addRole").post(auth.authenticateAdmin, ctrlRole.AddOne);

router.route("/admin/deleteRole").post(auth.authenticateAdmin, ctrlRole.DeleteOne);

router.route("/admin/updateRole").post(auth.authenticateAdmin, ctrlRole.Update);

// role modules
router.route("/admin/getRoleModules").post(auth.authenticateAdmin, ctrlRoleModule.GetAll);

router.route("/addRoleModules").post(ctrlRoleModule.AddOne);

router.route("/deleteRoleModules").post(ctrlRoleModule.DeleteOne);

router.route("/updateRoleModules").post(ctrlRoleModule.Update);

//blog category 1
router.route("/admin/getBlogCat").post(auth.authenticateAdmin, ctrlBlogCat.GetAll);

router.route("/GetCategoryBlogs").get(ctrlBlogCat.GetCategoryBlogs);
router.route("/GetCategoryBlogsMobile").get(ctrlBlogCat.GetCategoryBlogsMobile);

router.route("/admin/GetAllBlogByCategory").post(auth.authenticateAdmin, ctrlBlogCat.GetAllBlogByCategory);

router.route("/GetAllBlogByCategory").post(ctrlBlogCat.GetAllBlogByCategory);

router.route("/admin/addBlogCat").post(auth.authenticateAdmin, ctrlBlogCat.AddOne);

router.route("/admin/deleteBlogCat").post(auth.authenticateAdmin, ctrlBlogCat.DeleteOne);

router.route("/admin/updateBlogCat").post(auth.authenticateAdmin, ctrlBlogCat.Update);

router.route("/admin/addInventory").post(auth.authenticateAdmin, ctrlInventory.AddOne);
router.route("/admin/GetNewBillNo").get(auth.authenticateAdmin, ctrlInventory.GetNewBillNo);
router.route("/admin/editInventory").post(auth.authenticateAdmin, ctrlInventory.UpdateOne);
router.route("/admin/generate/supplier_bill").post(auth.authenticateAdmin, ctrlInventory.generateSupplierBill);

router.route("/admin/updateInventoryPaymentByAdmin").post(auth.authenticateAdmin, ctrlInventory.UpdatePaymentStatus);

router.route("/admin/getInventory").post(auth.authenticateAdmin, ctrlInventory.GetAll);

router.route("/admin/GetOneInventory").post(auth.authenticateAdmin, ctrlInventory.GetOneInventory);

router.route("/GetAllInventoryByProduct").post(ctrlInventory.GetAllInventoryByProduct);

router.route("/addtocart").post(ctrlAddTocart.AddOne);

router.route("/update/addtocart").post(ctrlAddTocart.UpdateOne);

// router
//  .route('/add/addtocart')
//  .post(ctrlAddTocart.AddAllItem)

router.route("/get/addtocart/:user_id").get(ctrlAddTocart.GetAll).post(ctrlAddTocart.GetAll);

//variant category 1
router.route("/getFAQ").post(ctrlFAQ.GetAll);

router.route("/getFAQ/active").post(ctrlFAQ.GetAllActive);

router.route("/addFAQ").post(ctrlFAQ.AddOne);

router.route("/deleteFAQ").post(ctrlFAQ.DeleteOne);

router.route("/updateFAQ").post(ctrlFAQ.Update);

router.route("/createBooking").post(ctrlBooking.createBooking);
router.route("/admin/updateBooking").post(auth.authenticateAdmin, ctrlBooking.updateBookingByAdmin);
router.route("/admin/UpdateBalancePaymentStatus").post(auth.authenticateAdmin, ctrlBooking.UpdateBalancePaymentStatus);

router.route("/admin/createBookingFromAdmin").post(auth.authenticateAdmin, ctrlBooking.createBookingFromAdmin);

router.route("/re-order").post(auth.authenticateUser, ctrlBooking.repeatOrder);

router.route("/admin/getAllBooking").post(auth.authenticateAdmin, ctrlBooking.getAllBooking);

router.route("/admin/getOneBooking").post(auth.authenticateAdmin, ctrlBooking.getOneBooking);

router.route("/getUserBooking").post(auth.authenticateUser, ctrlBooking.getUserBooking);

router.route("/admin/UpdateBookingStatus").post(auth.authenticateAdmin, ctrlBooking.UpdateBookingStatus);
router.route("/admin/BulkUpdateBookingStatus").post(auth.authenticateAdmin, ctrlBooking.BulkUpdateBookingStatus);

router.route("/UpdateDriverDetail").post(ctrlBooking.UpdateDriverDetail);
router.route("/admin/bulk/UpdateDriverDetail").post(auth.authenticateAdmin, ctrlBooking.BulkUpdateDriverDetail);

router.route("/admin/UpdateDeliveryStatus").post(auth.authenticateAdmin, ctrlBooking.UpdateDeliveryStatus);
router.route("/admin/bulk/UpdateDeliveryStatus").post(auth.authenticateAdmin, ctrlBooking.BulkUpdateDeliveryStatus);

router.route("/admin/UpdatePaymentStatus").post(auth.authenticateAdmin, ctrlBooking.UpdatePaymentStatus);

router.route("/admin/getTotalNumberOrder").get(auth.authenticateAdmin, ctrlBooking.getTotalNumberOrder);

router.route("/getCustomerManagement").post(ctrlBooking.getCustomerManagement);

router.route("/admin/add/voucherInventory").post(auth.authenticateAdmin, voucherInventory.AddOne);

router.route("/admin/all/voucherInventory").post(auth.authenticateAdmin, voucherInventory.GetAll);

router.route("/one/voucherInventory").post(voucherInventory.GetOne);

//ctrlDriver head api
router.route("/admin/getDriver").post(auth.authenticateAdmin, ctrlDriver.GetAll);

router.route("/admin/addDriver").post(auth.authenticateAdmin, ctrlDriver.AddOne);

router.route("/admin/deleteDriver").post(auth.authenticateAdmin, ctrlDriver.DeleteOne);

router.route("/admin/updateDriver").post(auth.authenticateAdmin, ctrlDriver.Update);

//setting API
router.route("/getSetting").get(ctrlSetting.GetAll);
router.route("/admin/getSetting").get(auth.authenticateAdmin, ctrlSetting.GetAll);
router.route("/Setting/AddOne").post(ctrlSetting.AddOne);
router.route("/Setting/getAbout").get(ctrlSetting.getAbout);
router.route("/imageUpload").post(ctrlSetting.imageUpload);

router.route("/admin/Setting/addAbout").post(auth.authenticateAdmin, ctrlSetting.addAbout);
router.route("/admin/Setting/getAbout").get(auth.authenticateAdmin, ctrlSetting.getAbout);

router.route("/admin/Setting/addTC").post(auth.authenticateAdmin, ctrlSetting.addTC);

router.route("/Setting/getTC").get(ctrlSetting.getTC);
router.route("/admin/Setting/getTC").get(auth.authenticateAdmin, ctrlSetting.getTC);

router.route("/admin/Setting/addPrivacyPolicy").post(auth.authenticateAdmin, ctrlSetting.addPrivacyPolicy);
router.route("/admin/Setting/getPrivacyPolicy").get(auth.authenticateAdmin, ctrlSetting.getPrivacyPolicy);

router.route("/Setting/getPrivacyPolicy").get(ctrlSetting.getPrivacyPolicy);

router.route("/admin/Setting/UpdateOne").post(auth.authenticateAdmin, ctrlSetting.UpdateOne);

//storehey setting API
router.route("/storehey/getSetting").get(ctrlStoreheySetting.GetAll);
router.route("/admin/storehey/getSetting").get(auth.authenticateAdmin, ctrlStoreheySetting.GetAll);
router.route("/storehey/AddOne").post(ctrlStoreheySetting.AddOne);
router.route("/admin/storehey/UpdateOne").post(auth.authenticateAdmin, ctrlStoreheySetting.UpdateOne);

//Loyality program API start
router.route("/loyality/addProgram").post(ctrlLoyality.addProgram);
router.route("/admin/loyality/updateProgram").post(auth.authenticateAdmin, ctrlLoyality.updateProgram);
router.route("/admin/loyality/getAllPrograms").post(auth.authenticateAdmin, ctrlLoyality.getAllPrograms);
router.route("/admin/loyality/AddPointsToUser").post(auth.authenticateAdmin, ctrlLoyality.AddPointsToUser);
router.route("/loyality/LoyalityHistoryOfAllUser").post(auth.authenticateUser, ctrlLoyality.LoyalityHistoryOfAllUser);
router.route("/admin/loyality/LoyalityHistoryOfAllUser").post(auth.authenticateAdmin, ctrlLoyality.admin_LoyalityHistoryOfAllUser);

router.route("/booking/checkLoyaltyStatus").get(auth.authenticateUser, ctrlBooking.checkLoyaltyStatus);
router.route("/booking/checkRefferalStatus").get(auth.authenticateUser, ctrlBooking.checkRefferalStatus);

// subscription Controller APIs
router.route("/subscription/cancelOne").post(ctrlSubscription.cancelOne);
router.route("/subscription/addOne").post(ctrlSubscription.addOne);
router.route("/subscription/getAll").get(auth.authenticateUser, ctrlSubscription.getAll);
router.route("/admin/subscription/admin-getAll").post(auth.authenticateAdmin, ctrlSubscription.adminGetAll);
router.route("/admin/getTotalNumberSubscriptions").get(auth.authenticateAdmin, ctrlSubscription.getTotalNumberSubscriptions);
router.route("/admin/subscription/UpdateBookingStatus").post(auth.authenticateAdmin, ctrlSubscription.UpdateBookingStatusForSubscriptions);

// Wallet API's
router.route("/wallet/addMoney").post(auth.authenticateUser, ctrlWallet.addMoney);
router.route("/wallet/getUserWalletAmount").get(auth.authenticateUser, ctrlWallet.getUserWalletAmount);
router.route("/admin/wallet/getAllTransactions").post(auth.authenticateAdmin, ctrlWallet.getAllTransactions);
router.route("/wallet/getUserTransactions").post(auth.authenticateUser, ctrlWallet.getUserTransactions);

// download invoice api's
router.route("/invoice/generate").post(auth.authenticateUser, ctrlReport.generateInvoice);
router.route("/admin/invoice/generate").post(auth.authenticateAdmin, ctrlReport.generateInvoice);

// company API's
router.route("/company/addOne").post(ctrlCompany.addOne);
router.route("/admin/company/getAll").get(auth.authenticateAdmin, ctrlCompany.getAll);

router.route("/pincode/add").post(ctrlPincode.AddOne);
router.route("/pincode/all").post(ctrlPincode.GetAll);
router.route("/pincode/CSVGet").get(ctrlPincode.CSVGet);
router.route("/pincode/one").post(ctrlPincode.GetOne);
router.route("/admin/pincodeSetting/one").get(ctrlPincode.GetOnePincodeSetting);
router.route("/admin/pincodeSetting/add").post(ctrlPincode.AddOnePincodeSetting);
router.route("/admin/pincodeSetting/update").post(auth.authenticateAdmin, ctrlPincode.UpdatePincodeSetting);

// Email and SMS enable/disable
router.route("/admin/email_sms_on_off/add").get(ctrlOnOff.addOne);
router.route("/admin/email_sms_on_off/update").post(ctrlOnOff.updateOne);
router.route("/admin/email_sms_on_off/get").get(ctrlOnOff.getOne);

//router.route("/updatealldatabase").post(ctrlBlog.updatealldatabase);
//router.route("/updatealldatabase").post(ctrlBlogCat.updatealldatabase);
router.route("/updatealldatabase").post(ctrlProduct.updatealldatabase);

//products import/export
router.route("/admin/products/exportXls").get(ctrlProduct.exportXls);
router.route("/admin/products/importXls").post(ctrlProduct.importXls);

router.route("/products/remodelPackages").get(ctrlProduct.remodelPackages);
router.route("/products/remodelPackages2").get(ctrlProduct.remodelPackages2);
router.route("/products/remodelPackages3").get(ctrlProduct.remodelPackages3);

module.exports = router;
