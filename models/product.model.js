const mongoose = require("mongoose");
const Counter = require("./counter.model"); // <-- Add Counter

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: Number,
      unique: true,
      index: true,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    offertype: {
      type: String,
      enum: ["flat", "percentage", "none"],
      default: "none",
    },
    offer: {
      type: Number,
      min: 0,
      default: 0,
    },
    stockCount: {
      type: Number,
      default: 0,
    },
    sizes: {
      type: [Object],
      default: [],
    },
    category: {
      type: String,
      index: true,
    },
    style: {
      type: String,
      index: true,
    },
    productImages: {
      type: [String],
      default: [],
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    salesPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  { timestamps: true }
);

/**
 * 🔥 AUTO-INCREMENT PRODUCT ID
 * Runs only on NEW products (not updates)
 */
productSchema.pre("save", async function (next) {
  if (this.productId) return next(); // skip if already exists (updated product)

  try {
    const counter = await Counter.findOneAndUpdate(
      { id: "productId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.productId = counter.seq;
    next();
  } catch (err) {
    next(err);
  }
});

// Index for faster searching
productSchema.index({ name: "text", category: 1, style: 1 });

const Product = mongoose.model("products", productSchema);
module.exports = Product;
