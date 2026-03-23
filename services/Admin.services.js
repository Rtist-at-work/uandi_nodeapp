const AdminRepository = require("../repositories/Admin.repository");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const AdminServices = {
  // dashboard

  dashboard: async ({ type, days, from, to }) => {
    try {
      const result = AdminRepository.dashboard({
        type,
        days,
        from,
        to,
      });
      return result;
    } catch (err) {
      console.log(err);
    }
  },
  // dashboard salesReport

  salesReport: async ({ type, days, from, to }) => {
    try {
      const result = AdminRepository.salesReport({ type, days, from, to });
      return result;
    } catch (err) {
      console.log(err);
    }
  },

  // login

  login: async (identifier, password) => {
    try {
      const db = mongoose.connection.db;

      // 1️⃣ Find admin
      const admin = await db.collection("admin").findOne({
        $or: [{ email: identifier }, { username: identifier }],
      });

      console.log(admin);

      if (!admin) {
        const error = new Error("Invalid credentials");
        error.statusCode = 401;
        throw error;
      }

      // 2️⃣ Compare password
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        const error = new Error("Invalid Password");
        error.statusCode = 401;
        throw error;
      }

      // 3️⃣ Generate JWT
      const token = jwt.sign(
        { id: admin._id, role: admin.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      // 4️⃣ Update lastLogin
      await db
        .collection("admin")
        .updateOne({ _id: admin._id }, { $set: { lastLogin: new Date() } });

      return { admin, token };
    } catch (err) {
      console.log(err);
      throw err;
    }
  },

  // order ststus updation

  updateOrderStatus: async (orderId, newStatus) => {
    try {
      const result = await AdminRepository.updateStatus(orderId, newStatus);
      if (result.modifiedCount === 0) {
        const error = new Error("Order not found or status unchanged");
        error.statusCode = 404;
        throw error;
      }
      return { message: "Order status updated successfully" };
    } catch (err) {
      throw err;
    }
  },

  // get categories

  getCategories: async (userId) => {
    try {
      const result = await AdminRepository.getCategories(userId);
      return result;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  // get category products

  getCategoryProducts: async (selecetedProducts, style, userId) => {
    try {
      const result = await AdminRepository.getCategoryProducts(
        selecetedProducts,
        style,
        userId
      );
      return result;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  // get Products by id

  getProductsByIds: async (ids, userId) => {
    try {
      return await AdminRepository.getProductsByIds(ids, userId);
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  // admin create categories

  postCategories: async (category, styles, files, categoryId = null) => {
    try {
      const parsedStyles = JSON.parse(styles).map((s) => ({
        style: s.name,
        sizes: s.sizes,
      }));

      const posterIds = files?.map((f) => f.toString()) || [];

      return await AdminRepository.postCategories(
        category,
        parsedStyles,
        posterIds,
        categoryId
      );
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  // admin delete categpry

  deleteCategory: async (categoryId) => {
    try {
      return await AdminRepository.deleteCategoryById(categoryId);
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  // admin product upload

  productUpload: async (productData) => {
    try {
      // ✅ Send to repository
      return await AdminRepository.productUpload(productData);
    } catch (err) {
      throw err;
    }
  },

  // admin edit product

  editProduct: async (productId, payload) => {
    try {
      const { body, files } = payload;

      // EXISTING IMAGE IDS
      const existingImages = body.existingImages
        ? JSON.parse(body.existingImages)
        : [];

      // NEW IMAGE IDS FROM MULTER
      const uploadedImageIds = (files || []).map((file) => file.toString());

      // MERGE ALL IMAGES
      const finalImages = [...existingImages, ...files];

      const updateData = {
        name: body.productName,
        price: body.price,
        description: body.description,
        category: body.category,
        style: body.style,
        sizes: JSON.parse(body.size || "[]"),
        offertype: body.offerType,
        offer: body.offerValue,
        stockCount: body.stockCount,
        productImages: finalImages,
      };

      return await AdminRepository.updateProduct(productId, updateData);
    } catch (err) {
      throw err;
    }
  },

  // create banners

  createBanner: async (data) => {
    try {
      if (!data.bannerType) throw new Error("Banner type is required");
      if (!data.heading) throw new Error("Heading is required");
      if (!data.bannerImg) throw new Error("Banner image is required");

      if (!Array.isArray(data.products)) {
        throw new Error("Products must be an array");
      }

      return await AdminRepository.createBanner(data);
    } catch (err) {
      throw err;
    }
  },

  // get all banners

  getAllBanners: async () => {
    try {
      return await AdminRepository.getBanners();
    } catch (err) {
      throw err;
    }
  },

  // admin banner updation

  updateBanner: async (id, data) => {
    try {
      const bannerExists = await AdminRepository.getBannerById(id);
      if (!bannerExists) throw new Error("Banner not found");

      return await AdminRepository.updateBanner(id, data);
    } catch (err) {
      throw err;
    }
  },

  // admin banner deletion

  deleteBanner: async (id) => {
    try {
      const banner = await AdminRepository.deleteBanner(id);

      if (!banner) throw new Error("Banner not found");

      return banner;
    } catch (err) {
      throw err;
    }
  },

  // update policies

  updatePolicy: async (type, content) => {
    if (!type || !content) {
      throw new Error("Type and content required");
    }

    const validTypes = ["privacy", "terms", "contact"];
    if (!validTypes.includes(type)) {
      throw new Error("Invalid policy type");
    }

    try {
      const updated = await AdminRepository.upsertPolicy(type, content);
      return updated;
    } catch (err) {
      throw err;
    }
  },

  // get policies

  getPolicy: async (type) => {
    try {
      const policy = await AdminRepository.findByType(type);
      if (!policy) throw new Error("Policy not found");
      return policy;
    } catch (err) {
      throw err;
    }
  },

  // admin coupon creation

  adminCoupon: async (data) => {
    try {
      // Check duplicate code
      const exist = await AdminRepository.getCouponByCode(data.code);
      if (exist) {
        throw new Error("Coupon code already exists");
      }

      const coupon = await AdminRepository.createCoupon(data);
      return coupon;
    } catch (err) {
      throw new Error(err.message);
    }
  },

  applyCoupon: async (userId, code) => {
    try {
      const coupon = await AdminRepository.findByCode(code);

      if (!coupon) {
        return { success: false, message: "Invalid coupon!" };
      }

      // Check active dates
      const now = new Date();
      if (now < coupon.startDate || now > coupon.endDate) {
        return { success: false, message: "Coupon expired!" };
      }

      // Check user usage
      const usage = coupon.usedBy.find((u) => u.userId.toString() === userId);

      if (usage && usage.usedCount >= coupon.perUserLimit) {
        return {
          success: false,
          message: "You have already used this coupon!",
        };
      }

      return {
        success: true,
        coupon,
      };
    } catch (err) {
      console.error("Error applying coupon:", err);
      throw new Error("Failed to apply coupon");
    }
  },

  markCouponUsed: async (userId, code) => {
    try {
      const coupon = await AdminRepository.findByCode(code);
      if (!coupon) return;

      const index = coupon.usedBy.findIndex(
        (u) => u.userId.toString() === userId
      );

      if (index >= 0) {
        coupon.usedBy[index].usedCount += 1;
      } else {
        coupon.usedBy.push({
          userId: new mongoose.Types.ObjectId(userId),
          usedCount: 1,
        });
      }

      await coupon.save();
    } catch (err) {
      console.error("Error marking coupon usage:", err);
    }
  },

  // admin get all coupon

  getAllCoupons: async () => {
    try {
      return await AdminRepository.getAllCoupons();
    } catch (err) {
      throw new Error(err.message);
    }
  },

  // delete coupon admin

  deleteCoupon: async (id) => {
    try {
      const deleted = await AdminRepository.deleteCoupon(id);
      if (!deleted) throw new Error("Coupon not found");
      return deleted;
    } catch (err) {
      throw new Error(err.message);
    }
  },

  //

  updateAbout: async ({ aboutData, videoPath }) => {
    if (videoPath) {
      aboutData.ceo.videoUrl = videoPath;
    }

    return AdminRepository.saveAbout(aboutData);
  },

  getAbout: async () => {
    return AdminRepository.findAbout();
  },
};

module.exports = AdminServices;
