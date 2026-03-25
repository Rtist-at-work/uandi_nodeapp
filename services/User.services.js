const User = require("../models/user.model");
const Coupon = require("../models/coupon.model");
const userRepository = require("../repositories/User.repositories");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const userService = {
  // adding wishlist

  addWishlist: async (productId, userId) => {
    try {
      const result = await userRepository.addWishlist(productId, userId);
      return result;
    } catch (err) {
      throw err;
    }
  },

  // sending otp

  sendOtp: async (mobile) => {
    try {
      // Generate random 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('otp :', otp)
      // Save in DB
      await userRepository.sendOtp(mobile, otp);

      // Send SMS (uncomment for real SMS)
      await sendSms(mobile, otp);

      return {
        success: true,
        message: "OTP sent successfully",
        mobile,
      };
    } catch (err) {
      throw err;
    }
  },

  // verify otp

  verifyOtp: async (mobile, otp) => {
    const record = await userRepository.verifyOtp(mobile, otp);

    if (!record) {
      throw new Error("Invalid or expired OTP");
    }

    // Find existing or create new user
    let user = await User.findOne({ mobile });

    if (!user) {
      user = await User.create({ mobile });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id, mobile: user.mobile, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return { user, token };
  },

  //find product id

  findProductById: async (productId, userId) => {
    try {
      const product = await userRepository.findProductById(productId, userId);

      if (!product) {
        throw new Error("Product not found");
      }

      return product;
    } catch (err) {
      throw err;
    }
  },

  // adding cart products

  addCartItem: async (userId, productId, size, quantity) => {
    try {
      if (!productId || !quantity) {
        throw new Error("Product ID and quantity are required");
      }

      const updatedUser = await userRepository.addToCart(
        userId,
        productId,
        size,
        quantity
      );

      return {
        success: true,
        message: "Item added to cart",
        cart: updatedUser.cart,
      };
    } catch (err) {
      throw err;
    }
  },

  // fetching cart products

  getCartItems: async (userId) => {
    try {
      const cart = await userRepository.getCartWithProducts(userId);

      return {
        success: true,
        cart,
      };
    } catch (err) {
      throw err;
    }
  },

  // getting wishlists

  getWishlist: async (userId) => {
    try {
      const wishlist = await userRepository.getWishlist(userId);

      if (!wishlist) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
      }

      return wishlist;
    } catch (error) {
      console.error("Wishlist Service Error:", error.message);
      throw error; // bubble up to controller
    }
  },

  // adding user delivery address

  addAddress: async (userId, addressData) => {
    try {
      const savedAddress = await userRepository.addAddress(userId, addressData);

      if (!savedAddress) {
        const error = new Error("Address could not be added");
        error.statusCode = 400;
        throw error;
      }

      return savedAddress;
    } catch (error) {
      console.error("Service Error:", error);
      throw error;
    }
  },

  // updating user delivery address

  updateUserAddress: async (userId, editingAddressId, newAddress) => {
    try {
      const updatedAddress = await userRepository.updateAddress(
        userId,
        editingAddressId,
        newAddress
      );
      return updatedAddress;
    } catch (error) {
      // You can add custom error handling/logging here
      throw new Error(error.message || "Failed to update address");
    }
  },

  // order placement

  placeOrder: async (userId, orderData) => {
    try {
      const user = await userRepository.findUserById(userId);

      if (!user) {
        const err = new Error("User not found");
        err.statusCode = 404;
        throw err;
      }

      if (!orderData.address) {
        const err = new Error("Delivery address is required");
        err.statusCode = 400;
        throw err;
      }

      const cartResult = await userRepository.getCartWithProducts(userId);
      const cartItems = cartResult.cart;

      if (!cartItems || cartItems.length === 0) {
        const err = new Error("Cart items missing");
        err.statusCode = 400;
        throw err;
      }

      const mappedItems = cartItems.map((item) => ({
        product: item.productId,
        name: item.product.name,
        image: item.product.productImages[0],
        price: item.product.price,
        size: item.size,
        quantity: item.quantity,
      }));

      const payload = {
        user: userId,
        items: mappedItems,
        payment: {
          method: orderData.paymentMethod === "COD" ? "COD" : "ONLINE",
          status: "PENDING",
        },
        deliveryAddress: {
          name: orderData.address.name,
          phone: orderData.address.phone,
          addressLine: orderData.address.addressLine,
          city: orderData.address.city,
          state: orderData.address.state,
          pincode: orderData.address.pincode,
        },
        totalPrice: orderData.subtotal,
        discount: orderData.productDiscount,
        shippingCharges: 0,
        finalPrice: orderData.finalAmount,
        appliedCoupon: orderData.appliedCoupon || null,
      };

      // 🔥 CREATE ORDER
      const savedOrder = await userRepository.createOrder(userId, payload);

      // 🔥 UPDATE SALES POINTS FOR PRODUCTS
      await userRepository.addSalesPointsFromOrder(mappedItems);

      // 🔥 CLEAR USER CART
      await userRepository.updateUserCart(userId, []);

      // 🔥 UPDATE COUPON USAGE
      if (orderData.appliedCoupon) {
        const coupon = await Coupon.findOne({ code: orderData.appliedCoupon });
        if (coupon) {
          // Increment usedCount and add user to usedBy
          coupon.usedCount = (coupon.usedCount || 0) + 1;
          if (!coupon.usedBy.includes(userId)) {
            coupon.usedBy.push(userId);
          }
          await coupon.save();
        }
      }

      return savedOrder;
    } catch (error) {
      console.log("Order Service Error:", error);
      throw error;
    }
  },

  // fetching user orders

  getMyOrders: async (userId, role) => {
    try {
      return await userRepository.getOrdersByRole(userId, role);
    } catch (error) {
      throw error;
    }
  },

  // adding user review

  addReview: async (userId, productId, rating, comment) => {
    try {
      const hasOrdered = await userRepository.checkIfUserOrderedProduct(
        userId,
        productId
      );

      if (!hasOrdered) {
        const err = new Error("You can review only purchased products");
        err.statusCode = 403;
        throw err;
      }

      // CREATE REVIEW ENTRY
      const review = await userRepository.createReview({
        user: userId,
        product: productId,
        rating,
        comment,
      });

      // ADD REVIEW REF TO PRODUCT
      await userRepository.attachReviewToProduct(productId, review._id);

      // UPDATE AVG RATING
      await userRepository.updateProductAverageRating(productId);

      return review;
    } catch (error) {
      throw error;
    }
  },

  // serach result

  search: async (searchTerm) => {
    try {
      const results = await userRepository.searchProducts(searchTerm);

      if (!results.length) return { message: "No products found", data: [] };

      const term = searchTerm.toLowerCase();

      // Check category + style match
      const catStyleMatched = results.filter(
        (p) =>
          p.category.toLowerCase().includes(term) ||
          p.style.toLowerCase().includes(term)
      );

      if (catStyleMatched.length > 0) {
        return {
          data: catStyleMatched.map((p) => ({
            category: p.category,
            style: p.style,
          })),
        };
      }

      // Check description match → return only name
      const descMatched = results.filter((p) =>
        p.description.toLowerCase().includes(term)
      );

      if (descMatched.length > 0) {
        return {
          data: descMatched.map((p) => ({ name: p.name })),
        };
      }

      // Default → return everything
      return { data: results };
    } catch (error) {
      throw error;
    }
  },

  //

  saveCartSummaryService: async (userId, summary) => {
    try {
      const user = await userRepository.findUserById(userId);

      if (!user) throw new Error("User not found");

      return await userRepository.saveCartSummary(userId, summary);
    } catch (err) {
      throw err;
    }
  },

  //

  getCartSummary: async (userId) => {
    try {
      const user = await userRepository.findUserById(userId);

      if (!user) throw new Error("User not found");
      const coupon = await userRepository.findCouponByCode(
        user.cartSummary.appliedCoupon
      );

      return {
        cartSummary: user.cartSummary || null,
        addresses: user.addresses || [],
        appliedCoupon: coupon,
      };
    } catch (err) {
      throw err;
    }
  },

  //

  updateCart: async (userId, productId, size, quantity) => {
    try {
      const updatedCart = await userRepository.updateCartItem(
        userId,
        productId,
        size,
        quantity
      );
      return updatedCart;
    } catch (err) {
      throw err;
    }
  },

  // logout

  logout: async (res) => {
    userRepository.clearAuthCookie(res);
    return { message: "Logged out successfully" };
  },
};

module.exports = userService;
