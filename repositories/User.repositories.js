const User = require("../models/user.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
const Otp = require("../models/otp.model");
const Coupon = require("../models/coupon.model");
const Review = require("../models/review.model");
const Fuse = require("fuse.js");

const userRepository = {
  // adding wishlist

  addWishlist: async (productId, userId) => {
    try {
      let message = "";
      const user = await User.findById(userId);

      if (!user) throw new Error("User not found");

      // Check if product already exists
      const exists = user.wishlist.includes(productId);

      let updatedUser;

      if (exists) {
        message = "Removed from wishlist";
        // REMOVE product from wishlist
        updatedUser = await User.findByIdAndUpdate(
          userId,
          { $pull: { wishlist: productId } },
          { new: true },
        ).lean();
      } else {
        message = "Added to wishlist";
        // ADD product to wishlist
        updatedUser = await User.findByIdAndUpdate(
          userId,
          { $addToSet: { wishlist: productId } },
          { new: true },
        ).lean();
      }

      return { message, updatedUser };
    } catch (err) {
      throw err;
    }
  },

  // verify otp

  verifyOtp: async (email, otp) => {
    return await Otp.findOne({ email, otp });
  },

  // find product by id

  findProductById: async (productId, userId) => {
    try {
      // 1️⃣ Fetch main product and populate user addresses in reviews
      const product = await Product.findById(productId)
        .populate({
          path: "reviews",
          populate: {
            path: "user",
            select: "addresses.name", // only fetch addresses.name
          },
        })
        .lean();

      if (!product) throw new Error("Product not found");

      // 2️⃣ Flatten review user names
      const reviewsWithName = (product.reviews || []).map((r) => ({
        _id: r._id,
        product: r.product,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        name: r.user?.addresses?.[0]?.name || "Anonymous", // flatten name
      }));

      product.reviews = reviewsWithName;

      // 3️⃣ Fetch user wishlist only once
      let wishlistSet = new Set();
      if (userId) {
        const user = await User.findById(userId).select("wishlist").lean();
        if (user?.wishlist) {
          wishlistSet = new Set(user.wishlist.map((id) => id.toString()));
        }
      }

      // 4️⃣ Attach isWishlist flag to main product
      product.isWishlist = wishlistSet.has(product._id.toString());

      // 5️⃣ Fetch similar products
      const { category, style } = product;

      const similarProducts = await Product.aggregate([
        {
          $match: {
            _id: { $ne: product._id },
            category: category,
          },
        },
        {
          $addFields: {
            isSameStyle: { $cond: [{ $eq: ["$style", style] }, 1, 0] },
            reviewsCount: { $size: "$reviews" },
          },
        },
        {
          $sort: {
            isSameStyle: -1,
            averageRating: -1,
            totalSold: -1,
            reviewsCount: -1,
          },
        },
        { $limit: 12 },
      ]);

      // 6️⃣ Add wishlist flag to similar products
      const similarProductsWithWishlist = similarProducts.map((p) => ({
        ...p,
        isWishlisted: wishlistSet.has(p._id.toString()),
      }));

      return {
        product,
        similarProducts: similarProductsWithWishlist,
      };
    } catch (err) {
      throw err;
    }
  },

  // add cart products

  addToCart: async (userId, productId, size, quantity) => {
    try {
      // Check if the product with SAME SIZE exists
      const user = await User.findOne({
        _id: userId,
        "cart.productId": productId,
        "cart.size": size,
      });

      if (user) {
        // Update quantity
        return await User.findOneAndUpdate(
          {
            _id: userId,
            "cart.productId": productId,
            "cart.size": size,
          },
          {
            $inc: { "cart.$.quantity": quantity },
          },
          { new: true },
        );
      } else {
        // Add new cart item
        return await User.findByIdAndUpdate(
          userId,
          {
            $push: {
              cart: { productId, size, quantity },
            },
          },
          { new: true },
        );
      }
    } catch (err) {
      throw err;
    }
  },

  // fetch cart products

  getCartWithProducts: async (userId) => {
    try {
      const user = await User.findById(userId).lean();
      if (!user) throw new Error("User not found");

      // -------------------------
      // 1️⃣ Build Cart With Product Details
      // -------------------------
      const cart = await Promise.all(
        user.cart.map(async (item) => {
          const product = await Product.findById(item.productId).lean();
          console.log(product);
          return { ...item, product: product || null };
        }),
      );

      const cartTotal = cart.reduce((sum, item) => {
        if (!item.product) return sum;
        return sum + item.product.price * item.quantity;
      }, 0);

      // -------------------------
      // 2️⃣ Check if this is user's first purchase
      // -------------------------
      const previousOrders = await Order.countDocuments({ userId });
      const isFirstPurchase = previousOrders === 0;

      // -------------------------
      // 3️⃣ Find ALL active coupons
      // -------------------------
      const allCoupons = await Coupon.find({
        expiresAt: { $gte: new Date() },
        usageLimit: { $gt: 0 },
        isActive: true,
      }).lean();

      // -------------------------
      // 4️⃣ Filter coupons eligible to this user
      // -------------------------
      const eligibleCoupons = allCoupons.filter((coupon) => {
        // Check min purchase
        if (cartTotal < coupon.minPurchase) return false;

        // Check first purchase rule
        if (coupon.firstPurchaseOnly && !isFirstPurchase) return false;

        // ✅ Check if user has already used this coupon
        if (coupon.usedBy?.some((u) => u._id.toString() === userId.toString()))
          return false;

        return true;
      });

      // -------------------------
      // 5️⃣ Return complete response
      // -------------------------
      return {
        cart,
        addresses: user.addresses || [],
        eligibleCoupons,
        cartTotal,
      };
    } catch (err) {
      throw err;
    }
  },

  // get wishlist

  getWishlist: async (userId) => {
    try {
      // Get user's wishlist productIds
      const user = await User.findById(userId).select("wishlist");

      if (!user) return null;

      if (user.wishlist.length === 0) return [];

      // Fetch products using wishlist productIds
      const products = await Product.find({
        _id: { $in: user.wishlist },
      });

      return products;
    } catch (error) {
      console.error("Wishlist Repo Error:", error.message);
      throw error;
    }
  },

  // adding address

  addAddress: async (userId, addressData) => {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $push: {
            addresses: {
              $each: [addressData], // push new address
              $slice: -2, // keep only last 2 addresses
            },
          },
        },
        { new: true, runValidators: true },
      );

      if (!updatedUser) return null;

      // return only the last added address
      return updatedUser.addresses[updatedUser.addresses.length - 1];
    } catch (error) {
      console.error("Repository Error:", error);
      throw error;
    }
  },

  // update address

  updateAddress: async (userId, editingAddressId, newAddress) => {
    try {
      const result = await User.updateOne(
        { _id: userId, "addresses._id": editingAddressId },
        {
          $set: {
            "addresses.$": {
              _id: editingAddressId,
              ...newAddress,
            },
          },
        },
      );

      if (result.matchedCount === 0) {
        throw new Error("User or Address not found");
      }
      console.log(newAddress);
      return {
        _id: editingAddressId,
        ...newAddress,
      };
    } catch (err) {
      throw err;
    }
  },

  // order submission

  createOrder: async (userId, orderData) => {
    try {
      // Clear user's cart summary
      await User.findByIdAndUpdate(userId, { cartSummary: [] });

      // Create the order
      const order = await Order.create(orderData);
      return order;
    } catch (err) {
      console.log("Order Repo Error:", err);
      const error = new Error("Failed to create order");
      error.statusCode = 500;
      throw error;
    }
  },

  // adding sales point to ordered products

  addSalesPointsFromOrder: async (items) => {
    console.log(items);
    try {
      for (const item of items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { salesPoints: item.quantity },
        });
      }
    } catch (err) {
      const error = new Error("Failed to update product sales points");
      error.statusCode = 500;
      throw error;
    }
  },

  // find users by id

  findUserById: async (id) => {
    try {
      return await User.findById(id);
    } catch (err) {
      const error = new Error("Invalid User ID");
      error.statusCode = 400;
      throw error;
    }
  },

  // update user cart products list

  updateUserCart: async (userId, cartItems) => {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { cart: cartItems },
        { new: true },
      );
    } catch (err) {
      const error = new Error("Failed to update user cart");
      error.statusCode = 500;
      throw error;
    }
  },

  // get user orders

  getOrdersByRole: async (userId, role) => {
    try {
      if (role === "admin") {
        // ADMIN → return all orders
        return await Order.find().sort({ createdAt: -1 });
      } else {
        // USER → return only user's orders
        return await Order.find({ user: userId }).sort({ createdAt: -1 });
      }
    } catch (err) {
      const error = new Error("Failed to fetch orders from database");
      error.statusCode = 500;
      throw error;
    }
  },

  // user purchase confirmation for add review

  checkIfUserOrderedProduct: async (userId, productId) => {
    try {
      const order = await Order.findOne({
        user: userId,
        "items.product": productId,
      });

      return !!order;
    } catch (err) {
      const error = new Error("Order validation failed");
      error.statusCode = 500;
      throw error;
    }
  },

  // add user review

  createReview: async (data) => {
    try {
      return await Review.create(data);
    } catch (err) {
      const error = new Error("Failed to submit review");
      error.statusCode = 500;
      throw error;
    }
  },

  // populating reviews with products

  attachReviewToProduct: async (productId, reviewId) => {
    try {
      await Product.findByIdAndUpdate(productId, {
        $push: { reviews: reviewId },
      });
    } catch (err) {
      const error = new Error("Failed to attach review to product");
      error.statusCode = 500;
      throw error;
    }
  },

  // update product average rating while user adding reviews

  updateProductAverageRating: async (productId) => {
    try {
      const reviews = await Review.find({ product: productId });

      const avg =
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      await Product.findByIdAndUpdate(productId, {
        averageRating: avg.toFixed(1),
      });
    } catch (err) {
      const error = new Error("Failed to update product rating");
      error.statusCode = 500;
      throw error;
    }
  },

  // sending otp

 sendOtp: async (email) => {
  try {
    // Remove old OTP for same mobile (avoid duplicates)
    // await Otp.deleteMany({ email });

    // const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // const result = await Otp.create({
    //   email,
    //   otp,
    //   expiresAt,
    // });

    // ✅ Check if user exists
    let user = await User.findOne({ email });

    // ✅ If not, create user
    if (!user) {
      user = await User.create({ email });
    }

    return user;
  } catch (err) {
    throw err;
  }
},

  // search result

  searchProducts: async (searchTerm) => {
    try {
      // Fetch minimal fields from DB
      const allProducts = await Product.find(
        {},
        {
          name: 1,
          category: 1,
          style: 1,
          description: 1,
        },
      );

      if (!allProducts.length) return [];

      // Fuse config
      const fuse = new Fuse(allProducts, {
        includeScore: true,
        threshold: 0.6, // Controls fuzzy sensitivity
        keys: ["name", "category", "style", "description"],
      });

      // Perform search
      const fuseResult = fuse.search(searchTerm);

      console.log("fuse :", fuseResult);

      // Convert results to plain product objects
      const results = fuseResult.map((r) => r.item);

      if (!results.length) return [];

      const term = searchTerm.toLowerCase();
      console.log("term :", term);

      // 1️⃣ If category/style match → return those only
      const catStyleMatched = results.filter(
        (p) =>
          p.category.toLowerCase().includes(term) ||
          p.style.toLowerCase().includes(term),
      );

      if (catStyleMatched.length > 0) {
        return {
          message: "Matched category/style",
          data: catStyleMatched.map((p) => ({
            category: p.category,
            style: p.style,
          })),
        };
      }

      // 2️⃣ If description match → return product names
      const descMatched = results.filter((p) =>
        p.description.toLowerCase().includes(term),
      );

      if (descMatched.length > 0) {
        return {
          message: "Matched description",
          data: descMatched.map((p) => ({ name: p.name })),
        };
      }

      // 3️⃣ Default → full results
      return { message: "General search results", data: results };
    } catch (error) {
      throw err;
    }
  },

  // cart summary save to checkout page

  findCouponByCode: async (couponCode) => {
    try {
      return await Coupon.findOne({ code: couponCode });
    } catch (err) {
      throw new Error("Error fetching user");
    }
  },

  saveCartSummary: async (userId, summaryData) => {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { cartSummary: summaryData },
        { new: true },
      );
    } catch (err) {
      throw new Error("Error saving cart summary");
    }
  },

  updateCartItem: async (userId, productId, size, quantity) => {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error("User not found");
      console.log("user.cart :", user.cart);
      console.log(" productId, size, quantity :", productId, size, quantity);
      // Find cart item
      const index = user.cart.findIndex(
        (c) =>
          c.productId.toString() === productId &&
          c.size.trim().toUpperCase() === size.trim().toUpperCase(),
      );

      if (index === -1) {
        throw new Error("Cart item not found");
      }

      // Update or remove based on quantity
      if (quantity <= 0) {
        user.cart = user.cart.filter(
          (c) =>
            !(
              c.productId.toString() === productId &&
              c.size.trim().toUpperCase() === size.trim().toUpperCase()
            ),
        );
      } else {
        user.cart[index].quantity = quantity;
      }

      await user.save();
      return user.cart;
    } catch (err) {
      throw err;
    }
  },

  // logout

  clearAuthCookie: (res) => {
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
  },
};

module.exports = userRepository;
