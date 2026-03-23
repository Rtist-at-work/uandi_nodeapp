const express = require("express");
const router = express.Router();

const AdminController = require("../controllers/Admin.controller");
const UserController = require("../controllers/User.controller");
const mediaUpload = require("../middlewares/mediaUpload");
const mediaDownload = require("../controllers/MediaDownload.controller");

const secureRoute = require("../middlewares/secureRoute");
const adminCheck = require("../middlewares/adminCheck");
const userController = require("../controllers/User.controller");

// admin dashboard

router.get("/admindashboard", AdminController.dashboard);
router.get("/adminSalesReport", AdminController.salesReport);

// admin 

router.post("/admin/login", AdminController.login);

router.get(
  "/getCategories",
  secureRoute.optionalAuth,
  AdminController.getCategories
);
router.post(
  "/postCategories",
  secureRoute.requireAuth,
  adminCheck,
  mediaUpload,
  AdminController.postCategories
);
router.post(
  "/productupload",
  secureRoute.requireAuth,
  // adminCheck,
  mediaUpload,
  AdminController.productUpload
);
router.get("/mediaDownload/:id", mediaDownload);
router.delete(
  "/deleteCategory/:categoryToDelete",
  secureRoute.requireAuth,
  adminCheck,
  AdminController.deleteCategory
);
router.get(
  "/getCategoryProducts",
  secureRoute.optionalAuth,
  AdminController.getCategoryProducts
);

// admin orders

router.patch(
  "/orders/update-status",
  secureRoute.requireAuth,
  AdminController.updateStatus
);

// admin banners

router.post(
  "/uploadBanner",
  secureRoute.requireAuth,
  adminCheck,
  mediaUpload,
  AdminController.createBanner
);
router.get("/getBanner", AdminController.getAllBanners);
router.delete(
  "/deleteBanner/:id",
  secureRoute.requireAuth,
  adminCheck,
  AdminController.deleteBanner
);
router.post(
  "/updateBanner/:id",
  secureRoute.requireAuth,
  adminCheck,
  mediaUpload,
  AdminController.updateBanner
);

// admin policies

router.get("/getPolicy/:type", AdminController.getPolicy);
router.post(
  "/policy/:type",
  secureRoute.requireAuth,
  adminCheck,
  AdminController.updatePolicy
);
router.post("/admin/about",mediaUpload,AdminController.updateAbout)
router.get("/getabout",mediaUpload,AdminController.getAbout)

// admin edit product

router.patch(
  "/products/:id",
  secureRoute.requireAuth,
  adminCheck,
  mediaUpload,
  AdminController.editProduct
);

// admin coupons

router.post("/adminCoupon", AdminController.adminCoupon);
router.get("/getAdminCoupons", AdminController.getAllCoupons);
router.delete("/deleteAdminCoupon/:id", AdminController.deleteCoupon);

// productList Page

router.post(
  "/postWishlist",
  secureRoute.requireAuth,
  UserController.addWishlist
);
router.post("/send-otp", UserController.sendOtp);
router.post("/verify-otp", UserController.verifyOtp);
router.get(
  "/findProductById/:id",
  secureRoute.optionalAuth,
  UserController.findProductById
);
router.post("/addCart", secureRoute.requireAuth, UserController.addCart);
router.get("/getCart", secureRoute.requireAuth, UserController.getCart);
router.get("/getWishlist", secureRoute.requireAuth, UserController.getWishlist);

// cart page

router.post(
  "/cart/saveSummary",
  secureRoute.requireAuth,
  userController.saveCartSummary
);
router.patch(
  "/updateCart",
  secureRoute.requireAuth,
  userController.updateCartItem
);

// checkoutpage

router.get(
  "/getCartSUmmary",
  secureRoute.requireAuth,
  userController.getCartSummary
);
router.post("/postaddress", secureRoute.requireAuth, UserController.addAddress);
router.patch(
  "/updateaddress/:editingAddressId",
  secureRoute.requireAuth,
  UserController.updateAddress
);
router.post("/place-order", secureRoute.requireAuth, UserController.placeOrder);
router.post("/addReview", secureRoute.requireAuth, UserController.addReview);
router.get("/my-orders", secureRoute.requireAuth, UserController.getMyOrders);

// home page

router.get("/search", UserController.search);

// userlogout

router.post("/logout", secureRoute.requireAuth, UserController.logout);

module.exports = router;
