const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    couponName: { type: String, required: true },
    description: { type: String },
    code: { type: String, required: true, unique: true },

    type: {
      type: String,
      enum: ["percentage", "flat"],
      required: true,
    },

    discountValue: { type: Number, required: true },
    minPurchase: { type: Number, default: 0 },
    firstPurchaseOnly: { type: Boolean, default: false },

    usageLimit: { type: Number, default: 999999 },
    usedCount: { type: Number, default: 0 },

    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    usedBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        usedCount: { type: Number, default: 1 },
      },
    ],
  },
  { timestamps: true }
);

const coupon = mongoose.model("coupon", couponSchema);
module.exports = coupon;
