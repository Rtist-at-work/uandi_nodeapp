const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    type: { type: String, enum: ["home", "work", "other"], default: "home" },
  },
  { _id: true },
);

// CART ITEM
const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String },
  },
  { _id: false },
);

// CART SUMMARY FOR CHECKOUT
const cartSummarySchema = new mongoose.Schema(
  {
    subtotal: { type: Number, default: 0 }, // total MRP
    productDiscount: { type: Number, default: 0 }, // product offers discount
    appliedCoupon: { type: String }, // coupon discount
    couponDiscount: { type: Number, default: 0 }, // coupon discount
    finalAmount: { type: Number, default: 0 }, // final price user pays
  },
  { _id: false },
);

// USER
const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    role: { type: String, default: "customer" },
    // mobile: {
    //   type: String,
    //   required: true,
    //   unique: true,
    //   match: /^[0-9]{10}$/,
    // },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    addresses: [addressSchema],
    wishlist: [{ type: String }],

    // USER CART
    cart: [cartItemSchema],

    // ⭐ NEW: Full backend-safe totals stored here
    cartSummary: cartSummarySchema,
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
module.exports = User;
