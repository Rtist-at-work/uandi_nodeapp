const Category = require("../models/category.model");
const product = require("../models/product.model");
const Banner = require("../models/Banner.model");
const Policy = require("../models/policy.model");
const User = require("../models/user.model");
const Coupon = require("../models/coupon.model");
const Order = require("../models/order.model");
const About = require("../models/adminAbout.model");
const mongoose = require("mongoose");

const compare = require("../utils/compare");
const { getWishlistSet, attachWishlistFlag } = require("../utils/wishlist");

const AdminRepository = {
  // dashboard

  dashboard: async ({ type, days, from, to }) => {
    try {
      const now = new Date();
      let startDate = new Date();

      // ------------------ CURRENT PERIOD ------------------
      if (type === "last" && days) {
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(now.getDate() - Number(days));
      }

      if (type === "range" && from && to) {
        startDate = new Date(from);
        startDate.setHours(0, 0, 0, 0);

        now.setTime(new Date(to).getTime());
        now.setHours(23, 59, 59, 999);
      }

      // ------------------ PREVIOUS PERIOD ------------------
      let previousStartDate = new Date(startDate);
      let previousEndDate = new Date(now);
      const diffMs = now.getTime() - startDate.getTime();
      previousStartDate = new Date(startDate.getTime() - diffMs);
      previousEndDate = new Date(startDate.getTime());

      // ------------------ CURRENT PERIOD QUERIES ------------------
      const [
        revenueStats,
        totalOrders,
        totalUsers,
        totalProducts,
        salesChart,
        recentOrders,
        lowStock,
        coupons,
        stockValue,
      ] = await Promise.all([
        // Revenue
        Order.aggregate([
          {
            $match: {
              "payment.status": "PENDING",
              orderStatus: { $nin: ["CANCELLED", "RETURNED"] },
              createdAt: { $gte: startDate, $lte: now },
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$finalPrice" },
            },
          },
        ]),

        // Orders count
        Order.countDocuments({
          createdAt: { $gte: startDate, $lte: now },
        }),

        // Users count
        User.countDocuments(),

        // Products count
        product.countDocuments(),

        // Sales chart data
        Order.aggregate([
          {
            $match: {
              "payment.status": "PENDING",
              createdAt: { $gte: startDate, $lte: now },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              revenue: { $sum: "$totalPrice" },
            },
          },
          { $sort: { _id: 1 } },
        ]),

        // Recent orders
        Order.find()
          .sort({ createdAt: -1 })
          .limit(10)
          .populate("user", "addresses.name")
          .select("totalPrice orderStatus orderId createdAt deliveryAddress")
          .lean(),

        // Low stock (size-wise)
        product.aggregate([
          { $unwind: "$sizes" },
          { $match: { "sizes.stock": { $lte: 5 } } },
          {
            $group: {
              _id: "$_id",
              productId: { $first: "$productId" },
              name: { $first: "$name" },
              category: { $first: "$category" },
              style: { $first: "$style" },
              price: { $first: "$price" },
              lowStockSizes: {
                $push: {
                  size: "$sizes.size",
                  stock: "$sizes.stock",
                },
              },
            },
          },
          { $sort: { "lowStockSizes.stock": 1 } },
          { $limit: 10 },
        ]),

        // Active coupons
        Coupon.find({
          isActive: true,
          expiresAt: { $gte: now },
        })
          .select("code type discountValue usageLimit usedCount")
          .lean(),

        // Stock value
        product.aggregate([
          {
            $group: {
              _id: null,
              totalStockValue: {
                $sum: { $multiply: ["$stockCount", "$price"] },
              },
            },
          },
        ]),
      ]);

      // ------------------ PREVIOUS PERIOD QUERIES ------------------
      const [prevRevenueStats, prevTotalOrders] = await Promise.all([
        // Previous Revenue
        Order.aggregate([
          {
            $match: {
              "payment.status": "PENDING",
              orderStatus: { $nin: ["CANCELLED", "RETURNED"] },
              createdAt: { $gte: previousStartDate, $lte: previousEndDate },
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$finalPrice" },
            },
          },
        ]),

        // Previous Orders count
        Order.countDocuments({
          createdAt: { $gte: previousStartDate, $lte: previousEndDate },
        }),
      ]);

      const currentRevenue = revenueStats[0]?.totalRevenue || 0;
      const previousRevenue = prevRevenueStats[0]?.totalRevenue || 0;

      // ------------------ FINAL RESPONSE ------------------
      return {
        stats: {
          revenue: {
            value: currentRevenue,
            comparison: compare(currentRevenue, previousRevenue),
          },
          orders: {
            value: totalOrders,
            comparison: compare(totalOrders, prevTotalOrders),
          },
          users: {
            value: totalUsers,
            comparison: { direction: "up", percentage: 0 },
          },
          products: {
            value: totalProducts,
            comparison: { direction: "up", percentage: 0 },
          },
        },

        salesSeries: salesChart.map((d) => ({
          date: d._id,
          revenue: d.revenue,
        })),

        recentOrders: recentOrders.map((o) => ({
          id: o.orderId,
          customer: o.deliveryAddress?.name || "Guest",
          amount: o.totalPrice,
          status: o.orderStatus,
          date: new Date(o.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
        })),

        lowStock: lowStock.map((p) => ({
          productId: p.productId,
          name: p.name,
          category: p.category,
          style: p.style,
          lowStockSizes: p.lowStockSizes,
          price: p.price,
        })),

        coupons: coupons.map((c) => ({
          code: c.code,
          type: c.type,
          value: c.discountValue,
          usesLeft: c.usageLimit - c.usedCount,
        })),

        stockValue: {
          value: stockValue[0]?.totalStockValue || 0,
          comparison: { direction: "up", percentage: 0 },
        },
      };
    } catch (err) {
      console.error("Dashboard error:", err);
      throw err;
    }
  },

  // admin salereport

  salesReport: async ({ type, days, from, to }) => {
    try {
      let startDate;
      let endDate = new Date(); // default = now

      /* ------------------ DATE LOGIC ------------------ */
      if (type === "last" && days) {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - Number(days));
      }

      if (type === "range" && from && to) {
        startDate = new Date(from);
        endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999); // include full end day
      }

      if (!startDate) {
        throw new Error("Invalid date parameters");
      }

      /* ------------------ AGGREGATION ------------------ */
      const salesReport = await Order.aggregate([
        {
          $match: {
            orderStatus: { $nin: ["CANCELLED", "RETURNED"] },
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },

        { $unwind: "$items" },

        /* 1️⃣ SIZE LEVEL */
        {
          $group: {
            _id: {
              product: "$items.product",
              size: "$items.size",
            },

            productName: { $first: "$items.name" },
            size: { $first: "$items.size" },

            soldCount: { $sum: "$items.quantity" },

            productDiscount: { $sum: "$discount" },
            couponDiscount: { $sum: "$couponDiscount" },

            couponsUsed: { $addToSet: "$appliedCoupon" },

            address: { $first: "$deliveryAddress.addressLine" },
            phone: { $first: "$deliveryAddress.phone" },

            purchasedPrice: { $first: "$finalPrice" },
            originalPrice: { $first: "$totalPrice" },
          },
        },

        /* 2️⃣ PRODUCT LEVEL */
        {
          $group: {
            _id: "$_id.product",

            productName: { $first: "$productName" },

            sizes: {
              $push: {
                size: "$size",
                sold: "$soldCount",
              },
            },

            totalSold: { $sum: "$soldCount" },

            productDiscount: { $sum: "$productDiscount" },
            couponDiscount: { $sum: "$couponDiscount" },

            couponsUsed: { $first: "$couponsUsed" },

            address: { $first: "$address" },
            phone: { $first: "$phone" },

            purchasedPrice: { $first: "$purchasedPrice" },
            originalPrice: { $first: "$originalPrice" },
          },
        },

        /* 3️⃣ SORT (NO LIMIT) */
        { $sort: { totalSold: -1 } },
      ]);

      /* ------------------ RESPONSE ------------------ */
      return {
        from: startDate,
        to: endDate,
        count: salesReport.length,

        salesReport: salesReport.map((p) => ({
          productName: p.productName,
          totalSold: p.totalSold,
          sizes: p.sizes,

          couponsUsed: p.couponsUsed.filter(Boolean),

          productDiscount: p.productDiscount,
          couponDiscount: p.couponDiscount,

          purchasedPrice: p.purchasedPrice,
          originalPrice: p.originalPrice,

          address: p.address,
          phone: p.phone,
        })),
      };
    } catch (err) {
      console.error("Sales report error:", err);
      throw err;
    }
  },

  // login

  findByEmailOrUsername: async (identifier) => {
    try {
      const db = mongoose.connection.db;
      return await db.collection("admin").findOne({
        $or: [{ email: identifier }, { username: identifier }],
      });
    } catch (err) {
      console.error(err);
      throw new Error("Failed to fetch admin");
    }
  },

  // order status update

  updateStatus: async (orderId, newStatus) => {
    try {
      const db = mongoose.connection.db;
      const result = await db
        .collection("orders")
        .updateOne(
          { _id: new mongoose.Types.ObjectId(orderId) },
          { $set: { orderStatus: newStatus, updatedAt: new Date() } }
        );
      return result;
    } catch (err) {
      throw new Error("Failed to update order status");
    }
  },

  // get categories

  getCategories: async (userId) => {
    try {
      // Fetch categories & best sellers
      const categories = await Category.find();
      let bestSellers = await product
        .find()
        .sort({ salesPoints: -1 })
        .limit(5)
        .lean(); // IMPORTANT: lean() makes objects editable and faster

      // Fetch wishlist (only ids)
      let wishlistIds = [];

      if (userId) {
        const wishlistData = await User.findById(userId)
          .select("wishlist")
          .lean();
        wishlistIds = wishlistData?.wishlist || [];
      }

      // Convert wishlist ids to string for fast match
      const wishlistSet = new Set(wishlistIds.map(String));

      // Add isWishlisted to each product
      bestSellers = bestSellers.map((item) => ({
        ...item,
        isWishlisted: wishlistSet.has(String(item._id)),
      }));

      return {
        categories,
        bestSellers,
      };
    } catch (err) {
      throw err;
    }
  },

  // get products by category

  getCategoryProducts: async (selectedCategory, style, userId) => {
    try {
      let result = await product.aggregate([
        { $match: { category: selectedCategory } },

        {
          $lookup: {
            from: "reviews",
            localField: "reviews",
            foreignField: "_id",
            as: "reviews",
          },
        },

        { $sort: { price: -1 } },

        {
          $group: {
            _id: "$style",
            products: { $push: "$$ROOT" },
            highestPrice: { $first: "$price" },
            sizes: { $addToSet: "$sizes" },
          },
        },

        {
          $project: {
            _id: 0,
            style: "$_id",
            products: 1,
            highestPrice: 1,
            sizes: {
              $reduce: {
                input: "$sizes",
                initialValue: [],
                in: { $setUnion: ["$$value", "$$this"] },
              },
            },
          },
        },
      ]);

      // ------------------------------
      // FETCH WISHLIST (COMMON LOGIC)
      // ------------------------------
      const wishlistSet = await getWishlistSet(userId);

      // ------------------------------
      // ADD isWishlisted FLAG
      // ------------------------------
      result = result.map((group) => ({
        ...group,
        products: attachWishlistFlag(group.products, wishlistSet),
      }));

      // ------------------------------
      // FILTER BY STYLE (IF PROVIDED)
      // ------------------------------
      if (style && style.trim() !== "") {
        return result.find((item) => item.style === style) || null;
      }
      console.log('rsult :', result[0].products)
      return result;
    } catch (err) {
      console.error("Error in getCategoryProducts:", err.message);
      throw err;
    }
  },

  /**
   * GET PRODUCTS BY PRODUCT IDS
   */
  getProductsByIds: async (ids, userId) => {
    try {
      const numericIds = ids.map((id) => Number(id));

      const result = await product.aggregate([
        {
          $match: {
            productId: { $in: numericIds },
          },
        },

        {
          $lookup: {
            from: "reviews",
            localField: "reviews",
            foreignField: "_id",
            as: "reviews",
          },
        },

        { $sort: { price: -1 } },

        {
          $group: {
            _id: null,
            products: { $push: "$$ROOT" },
            highestPrice: { $first: "$price" },
            sizes: { $addToSet: "$sizes" },
          },
        },

        {
          $project: {
            _id: 0,
            products: 1,
            highestPrice: 1,
            sizes: {
              $reduce: {
                input: "$sizes",
                initialValue: [],
                in: { $setUnion: ["$$value", "$$this"] },
              },
            },
          },
        },
      ]);

      const data = result[0] || {
        products: [],
        highestPrice: 0,
        sizes: [],
      };

      // ------------------------------
      // FETCH WISHLIST (COMMON LOGIC)
      // ------------------------------
      const wishlistSet = await getWishlistSet(userId);

      // ------------------------------
      // ADD isWishlisted FLAG
      // ------------------------------
      data.products = attachWishlistFlag(data.products, wishlistSet);

      return data;
    } catch (err) {
      console.error("Error in getProductsByIds:", err.message);
      throw err;
    }
  },

  // admin category creation

  postCategories: async (
    category,
    parsedStyles,
    posterIds,
    categoryId = null
  ) => {
    try {
      if (categoryId) {
        const existingCategory = await Category.findById(categoryId);
        if (!existingCategory) throw new Error("Category not found");

        // Update category name
        existingCategory.category = category;

        // Update posters (avoid duplicates)
        posterIds.forEach((id) => {
          if (!existingCategory.posters.includes(id)) {
            existingCategory.posters.push(id);
          }
        });

        // Replace styles completely (this handles deletion too)
        existingCategory.style = parsedStyles;

        return await existingCategory.save();
      } else {
        // Create new category
        return await Category.create({
          category,
          posters: posterIds,
          style: parsedStyles,
        });
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  // admin category deletion

  deleteCategoryById: async (categoryId) => {
    try {
      const deleted = await Category.findByIdAndDelete(categoryId);
      if (!deleted) throw new Error("Category not found");
      return deleted;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  // admin product upload

  productUpload: async (productData) => {
    try {
      const prd = new product(productData); // <-- defaults apply HERE
      return await prd.save();
    } catch (err) {
      console.log(err);
      throw err;
    }
  },

  // admin product update

  updateProduct: async (productId, updateData) => {
    try {
      const updated = await product.findByIdAndUpdate(
        productId,
        { $set: updateData },
        { new: true }
      );

      if (!updated) {
        throw { statusCode: 404, message: "Product not found" };
      }

      return updated;
    } catch (err) {
      throw {
        statusCode: err.statusCode || 500,
        message: err.message || "Database update error",
      };
    }
  },

  // admin banner creation

  createBanner: async (data) => {
    try {
      const banner = new Banner(data);
      return await banner.save();
    } catch (err) {
      console.log(err)
      throw err;
    }
  },

  // banner fetching

  getBanners: async () => {
    try {
      return await Banner.find().sort({ createdAt: -1 });
    } catch (err) {
      throw err;
    }
  },

  // get Banner by id (  )

  getBannerById: async (id) => {
    try {
      return await Banner.findById(id);
    } catch (err) {
      throw err;
    }
  },

  // admin Banner edit

  updateBanner: async (id, data) => {
    try {
      return await Banner.findByIdAndUpdate(id, data, { new: true });
    } catch (err) {
      throw err;
    }
  },

  // admin delete banner

  deleteBanner: async (id) => {
    try {
      return await Banner.findByIdAndDelete(id);
    } catch (err) {
      throw err;
    }
  },

  // fetching policy by policy type

  findByType: async (type) => {
    try {
      return await Policy.findOne({ type });
    } catch (err) {
      throw new Error("Database error while fetching policy");
    }
  },

  // admin policy update

  upsertPolicy: async (type, content) => {
    try {
      return await Policy.findOneAndUpdate(
        { type },
        { content },
        { new: true, upsert: true }
      );
    } catch (err) {
      throw new Error("Database error while updating policy");
    }
  },

  // admin coupon creation

  adminCoupon: async (coupon) => {
    try {
      const result = await Coupon.create(coupon);
    } catch (err) {}
  },

  // get coupon by code

  getCouponByCode: async (code) => {
    return await Coupon.findOne({ code });
  },

  updateCoupon: async (id, updateData) => {
    return await Coupon.findByIdAndUpdate(id, updateData, { new: true });
  },

  createCoupon: async (data) => {
    return await Coupon.create(data);
  },

  // get all coupon admin

  getAllCoupons: async () => {
    return await Coupon.find().sort({ createdAt: -1 });
  },

  // delete coupon admin

  deleteCoupon: async (id) => {
    return await Coupon.findByIdAndDelete(id);
  },

  //

  findAbout: async () => {
    return About.findOne();
  },

  // 

  saveAbout: async (data) => {
    const existing = await About.findOne();

    if (existing) {
      Object.assign(existing, data);
      return existing.save();
    }

    return About.create(data);
  },
};

module.exports = AdminRepository;
