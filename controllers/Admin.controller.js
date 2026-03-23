const AdminServices = require("../services/Admin.services");

const AdminController = {
  // dashboard

  dashboard: async (req, res) => {
    try {
      const { type, days, from, to } = req.query;
      console.log('jfgfg')
      const result = await AdminServices.dashboard({
        type,
        days,
        from,
        to,
      });
      res.status(200).json(result);
    } catch (err) {
      console.log(err);
    }
  },
  // dashboard salesReport

  salesReport: async (req, res) => {
    try {
      const { type, days, from, to } = req.query;

      const result = await AdminServices.salesReport({
        type,
        days,
        from,
        to,
      });

      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch sales report" });
    }
  },

  // login
  login: async (req, res) => {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        return res
          .status(400)
          .json({ message: "Username/Email and password are required" });
      }

      const { admin, token } = await AdminServices.login(identifier, password);

      // Send JWT as HttpOnly cookie
      res
        .cookie("auth_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 24 * 60 * 60 * 1000, // 1 day
        })
        .status(200)
        .json({
          message: "Login successful",
        });
    } catch (err) {
      res.status(err.statusCode || 500).json({
        message: err.message || "Server error",
      });
    }
  },

  // order status updation

  updateStatus: async (req, res) => {
    try {
      const { orderId, newStatus } = req.body;
      if (!orderId || !newStatus) {
        return res
          .status(400)
          .json({ message: "Order ID and status are required" });
      }

      const result = await AdminServices.updateOrderStatus(orderId, newStatus);
      res.status(200).json(result);
    } catch (err) {
      console.log(err);
      res.status(err.statusCode || 500).json({ message: err.message });
    }
  },

  // get categories

  getCategories: async (req, res) => {
    try {
      const userId = req.user.id;
      console.log("req.user :", req.user);

      const result = await AdminServices.getCategories(userId);

      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err });
    }
  },

  // Admin Category creation

  postCategories: async (req, res) => {
    try {
      const { category, styles, _id } = req.body;

      if (!category || !styles) {
        return res.status(400).json({ error: "Category or styles missing" });
      }

      const result = await AdminServices.postCategories(
        category,
        styles,
        req.mediaIds.media,
        _id
      );

      res.status(200).json({
        message: _id ? "Category updated" : "Category created",
        data: result,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: error,
        message: _id ? "Category updation failed" : "Category creation failed",
      });
    }
  },

  // admin category deletion

  deleteCategory: async (req, res) => {
    try {
      const { categoryToDelete } = req.params;
      
      if (!categoryToDelete)
        return res
          .status(400)
          .json({ error: error, message: "Category ID required" });

      const deleted = await AdminServices.deleteCategory(categoryToDelete);

      res.status(200).json({
        message: "Category deleted successfully",
        data: deleted,
      });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ error: err, message: "Category deletion failed" });
    }
  },

  // product upload

  productUpload: async (req, res) => {
    try {
      const {
        name,
        price,
        offerType,
        offerValue,
        stockCount,
        sizes,
        category,
        style,
        description,
      } = req.body;

      // 🔥 Parse sizes (because frontend stringifies it)
      let parsedSizes = [];

      if (sizes) {
        if (typeof sizes === "string") {
          try {
            parsedSizes = JSON.parse(sizes);
          } catch (err) {
            return res.status(400).json({
              error: "Invalid sizes format",
            });
          }
        } else if (Array.isArray(sizes)) {
          parsedSizes = sizes;
        }
      }


      if (!name || !price || !category) {
        return res.status(400).json({ error: "Required fields missing" });
      }

      const mediaIds = req.mediaIds;
      console.log("mediaIds :", req.mediaIds);

      const productData = {
        name: name.trim(),
        price: Number(price) || 0,
        offertype: offerType || "none",
        offer: Number(offerValue) || 0,
        stockCount: Number(stockCount) || 0,

        // ✅ Correct sizes array
        sizes: parsedSizes.map((s) => ({
          size: s.size,
          stock: Number(s.stock) || 0,
        })),

        category,
        style: style || null,
        description: description?.trim() || "",
        productImages: (mediaIds.media || []).map(String),
      };

      const result = await AdminServices.productUpload(productData);

      return res.status(201).json({
        message: "Product uploaded",
        product: result,
      });
    } catch (err) {
      console.error("Product upload failed:", err);
      return res.status(500).json({
        error: "Product upload failed",
      });
    }
  },

  // edit banner

  editProduct: async (req, res) => {
    try {
      const productId = req.params.id;

      const payload = {
        body: req.body,
        files: req.mediaIds.media,
      };

      const updatedProduct = await AdminServices.editProduct(
        productId,
        payload
      );

      return res.status(200).json({
        message: "Product updated",
        product: updatedProduct,
      });
    } catch (err) {
      console.error("editProduct error :", err);

      return res.status(err.statusCode || 500).json({
        error: err,
        message: "Product updation failed",
      });
    }
  },

  // get category products

  getCategoryProducts: async (req, res) => {
    try {
      const userId = req.user.id;
      const { selectedCategory, style, productIds } = req.query;

      // CASE 1: Banner products (only product ids)
      if (productIds) {
        const ids = productIds.split(",").map((id) => id.trim());
        const result = await AdminServices.getProductsByIds(ids, userId);
        return res.status(200).json(result);
      }

      // CASE 2: Normal category browsing
      if (!selectedCategory) {
        return res.status(400).json({ error: "Category is required" });
      }

      const result = await AdminServices.getCategoryProducts(
        selectedCategory.toString(),
        style,
        userId
      );

      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err });
    }
  },

  //  banners

  createBanner: async (req, res) => {
    try {
      const { bannerType, heading, subHeading, products } = req.body;

      const bannerData = {
        bannerType,
        heading,
        subHeading: bannerType === "featured" ? "" : subHeading, // IMPORTANT
        bannerImg: String(req.mediaIds.media[0]),
        products: products ? JSON.parse(products) : [],
      };

      const result = await AdminServices.createBanner(bannerData);

      return res.status(201).json({
        success: true,
        message: "Banner created successfully",
        banner: result,
      });
    } catch (err) {
      console.log(err);
      return res
        .status(400)
        .json({ success: false, message: "Banner creation failed" });
    }
  },

  // get banners

  getAllBanners: async (req, res) => {
    try {
      const banners = await AdminServices.getAllBanners();
      res.status(200).json({ success: true, banners });
    } catch (err) {
      console.log(err);
      res.status(500).json({ success: false });
    }
  },

  // update Banner

  updateBanner: async (req, res) => {
    try {
      const { id } = req.params;

      const data = {
        ...req.body,
      };

      if (req.mediaIds.media.length > 0)
        data.bannerImg = String(req.mediaIds.media[0]);

      if (data.products) {
        data.products = data.products ? JSON.parse(data.products) : [];
      }

      const updated = await AdminServices.updateBanner(id, data);

      res.status(200).json({
        success: true,
        message: "Banner updated successfully",
        banner: updated,
      });
    } catch (err) {
      console.log(err);
      res
        .status(400)
        .json({ success: false, message: "Banner updation failed" });
    }
  },

  // delete banner

  deleteBanner: async (req, res) => {
    try {
      const { id } = req.params;

      await AdminServices.deleteBanner(id);

      res.status(200).json({
        success: true,
        message: "Banner deleted successfully",
      });
    } catch (err) {
      res
        .status(404)
        .json({ success: false, message: "Banner deletion failed" });
    }
  },

  // admin coupon creation

  adminCoupon: async (req, res) => {
    try {
      const data = req.body;

      if (!data) res.status(400).json({ mssage: " data is missing " });
      const coupon = await AdminServices.adminCoupon(data);
      return res.status(200).json({
        success: true,
        message: "Coupon created successfully",
        data: coupon,
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  },

  // admin get all coupon

  getAllCoupons: async (req, res) => {
    try {
      const coupons = await AdminServices.getAllCoupons();
      return res.status(200).json({
        success: true,
        data: coupons,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },

  //  delete coupon admin

  deleteCoupon: async (req, res) => {
    try {
      console.log("Deleting coupon:", req.params.id);

      await AdminServices.deleteCoupon(req.params.id);

      return res.status(200).json({
        success: true,
        message: "Coupon deleted successfully",
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  },

  // applyCoupon: async (req, res) => {
  //   try {
  //     const { couponCode } = req.body;
  //     const userId = req.user.id;

  //     const result = await AdminServices.applyCoupon(userId, couponCode);

  //     if (!result.success) {
  //       return res.status(400).json(result);
  //     }

  //     res.json({
  //       success: true,
  //       coupon: result.coupon,
  //     });
  //   } catch (err) {
  //     console.error("Controller error:", err);
  //     res.status(500).json({ success: false, message: "Server error" });
  //   }
  // },

  // confirmOrder: async (req, res) => {
  //   try {
  //     const { couponCode } = req.body;
  //     const userId = req.user.id;

  //     // After order success
  //     await AdminServices.markCouponUsed(userId, couponCode);

  //     res.json({ success: true, message: "Order placed!" });
  //   } catch (err) {
  //     console.error(err);
  //     res.status(500).json({ success: false, message: "Server error" });
  //   }
  // },

  updateAbout: async (req, res) => {
    try {
      const aboutData = JSON.parse(req.body.about);
      const videoPath = req.mediaIds.media[0].toString();

      await AdminServices.updateAbout({ aboutData, videoPath });

      res.status(200).json({
        success: true,
        message: "About page updated successfully",
      });
    } catch (err) {
      console.error("Update About Error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  getAbout: async (req, res) => {
    try {
      const about = await AdminServices.getAbout();
      res.status(200).json({ success: true, data: about });
    } catch (err) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

    // Update Policy

  updatePolicy: async (req, res) => {
    try {
      const { type } = req.params;
      const { content } = req.body;

      const updated = await AdminServices.updatePolicy(type, content);

      res.status(200).json({
        message: "Policy updated successfully",
        data: updated,
      });
    } catch (err) {
      console.log(err);
      res.status(400).json({ error: err, message: "Policy Updation failed" });
    }
  },

  // get POlicies

  getPolicy: async (req, res) => {
    try {
      const { type } = req.params;

      const policy = await AdminServices.getPolicy(type);

      res.status(200).json(policy);
    } catch (err) {
      res.status(404).json({ error: err });
    }
  },
};

module.exports = AdminController;
