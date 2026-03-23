const userService = require("../services/User.services");

const userController = {
  // adding wishlist

  addWishlist: async (req, res) => {
    try {
      const { productId } = req.body;
      console.log(req.user);
      const userId = req.user.id; // FIXED

      if (!productId || !userId) {
        return res.status(400).json({ message: "Missing data" });
      }

      const result = await userService.addWishlist(productId, userId);

      return res.status(200).json({
        message: result.message,
        data: result.updatedUser,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        message: "Server error",
        error: err,
        message: "Item not added to wishlist",
      });
    }
  },

  // send otp

  sendOtp: async (req, res) => {
    try {
      const { data } = req.body;

      if (!data.mobile) {
        return res.status(400).json({ message: "Mobile number is required" });
      }

      const result = await userService.sendOtp(data.mobile);

      return res
        .status(200)
        .json({ result: result, message: "Otp sent successfully" });
    } catch (err) {
      console.error("Send OTP Error:", err);
      return res
        .status(500)
        .json({ error: err, message: "Sending Otp failed" });
    }
  },

  // otp verification

  verifyOtp: async (req, res) => {
    try {
      const { data } = req.body;

      if (!data.otp)
        return res.status(400).json({ message: "Otp is required" });

      const { user, token } = await userService.verifyOtp(
        data.mobile,
        data.otp
      );

      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        message: "Login successful",
        user,
      });
    } catch (err) {
      res.status(500).json({ error: err, message: "Login failed" });
    }
  },

  // fetch product by id

  findProductById: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id; // FIXED

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Product ID is required",
        });
      }

      const product = await userService.findProductById(id, userId);

      return res.status(200).json({
        success: true,
        product,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Product fetching failed",
      });
    }
  },

  // add products to user cart

  addCart: async (req, res) => {
    try {
      const userId = req.user.id; // assuming JWT middleware sets req.user
      // const userId = req.user.id; // assuming JWT middleware sets req.user

      const { productId, size, quantity } = req.body;

      const response = await userService.addCartItem(
        userId,
        productId,
        size,
        quantity
      );

      res
        .status(200)
        .json({ response: response, message: "Item added to cart" });
    } catch (err) {
      console.log(err);
      res.status(500).json({ success: false, error: err });
    }
  },

  // get cart items

  getCart: async (req, res) => {
    try {
      const userId = req.user.id; // From JWT middleware

      const response = await userService.getCartItems(userId);

      return res.status(200).json(response);
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        success: false,
        error: err,
      });
    }
  },

  // get wishlist

  getWishlist: async (req, res) => {
    try {
      const userId = req.user.id; // from middleware

      const products = await userService.getWishlist(userId);

      return res.status(200).json({ products });
    } catch (error) {
      console.error("Wishlist Controller Error:", error.message);

      return res.status(error.statusCode || 500).json({
        success: false,
        error: error,
        message: "fetching products failed",
      });
    }
  },

  // add address

  addAddress: async (req, res) => {
    try {
      const userId = req.user.id; // assuming auth middleware sets req.user
      const addressData = req.body;

      const result = await userService.addAddress(userId, addressData);

      return res.status(200).json({
        success: true,
        message: "Address added successfully",
        data: result,
      });
    } catch (error) {
      console.error("Controller Error:", error);

      return res.status(error.statusCode || 500).json({
        success: false,
        error: error,
        message: "Address added successfully",
      });
    }
  },

  // update user delivery address

  updateAddress: async (req, res) => {
    const userId = req.user.id; // assuming userId is in URL params
    const { editingAddressId } = req.params; // editingAddressId is in URL params
    const newAddress = req.body;
    try {
      const updatedAddress = await userService.updateUserAddress(
        userId,
        editingAddressId,
        newAddress
      );
      res.status(200).json({
        success: true,
        message: "Address updated successfully",
        data: updatedAddress,
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({
        success: false,
        message: "Failed to update address",
      });
    }
  },

  // place order

  placeOrder: async (req, res) => {
    try {
      const userId = req.user.id; // From auth middleware
      const orderData = req.body;

      const result = await userService.placeOrder(userId, orderData);

      res.status(200).json({
        status: "success",
        message: "Order placed",
        data: result,
      });
    } catch (error) {
      console.log("Order Controller Error:", error);

      res.status(error.statusCode || 500).json({
        status: "error",
        error: error,
        message: "order failed",
      });
    }
  },

  // get user's order

  getMyOrders: async (req, res) => {
    try {
      console.log(req.user.id, req.user.role);
      const result = await userService.getMyOrders(req.user.id, req.user.role);

      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      console.log(error);
      res.status(error.statusCode || 500).json({
        status: "error",
        error: error,
        message: "Order fetching failed",
      });
    }
  },

  // add user review

  addReview: async (req, res) => {
    try {
      const userId = req.user.id;
      const { productId, rating, comment } = req.body;

      const result = await userService.addReview(
        userId,
        productId,
        rating,
        comment
      );

      res.status(200).json({
        status: "success",
        message: "Review Added!",
        data: result,
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        status: "error",
        error: error,
        message: "Review added failed",
      });
    }
  },

  // data search

  search: async (req, res) => {
    try {
      const { searchTerm } = req.query;

      if (!searchTerm || searchTerm.trim() === "") {
        return res.status(400).json({ message: "Search term required" });
      }

      const result = await userService.search(searchTerm);

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        message: "Internal Server Error",
        error: error,
      });
    }
  },

  //

  saveCartSummary: async (req, res) => {
    try {
      const userId = req.user.id; // from auth middleware

      const {
        subtotal,
        productDiscount,
        appliedCoupon,
        couponDiscount,
        finalAmount,
      } = req.body;

      const summary = {
        subtotal,
        productDiscount,
        appliedCoupon,
        couponDiscount,
        finalAmount,
      };

      const response = await userService.saveCartSummaryService(
        userId,
        summary
      );

      res.status(200).json({
        status: "success",
        cartSummary: response.cartSummary,
      });
    } catch (err) {
      res.status(500).json({
        status: "failed",
        message: err.message || "Error saving cart summary",
      });
    }
  },

  //

  getCartSummary: async (req, res) => {
    try {
      const userId = req.user.id;

      const response = await userService.getCartSummary(userId);

      console.log("res :", response);

      res.status(200).json(response);
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: 500,
        message: "Failed to fetch cart summary",
        error: err.message,
      });
    }
  },

  //

  updateCartItem: async (req, res) => {
    try {
      const userId = req.user.id;
      const { productId, size, quantity } = req.body;
      console.log(req.body);

      if (!productId || !size || quantity == null) {
        return res
          .status(400)
          .json({
            status: 400,
            message: "productId, size & quantity required",
          });
      }

      const updatedCart = await userService.updateCart(
        userId,
        productId,
        size,
        quantity
      );

      res.status(200).json({ status: 200, cart: updatedCart });
    } catch (err) {
      console.log("Update Cart Error:", err);
      res.status(500).json({ status: 500, message: err.message });
    }
  },

  // logout

  logout: async (req, res) => {
    try {
      const result = await userService.logout(res);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.log(error)
      return res.status(500).json({
        success: false,
        message: "Logout failed",
      });
    }
  },
};

module.exports = userController;
