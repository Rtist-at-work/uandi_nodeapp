const mongoose = require("mongoose");
const Counter = require("./counter.model");

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: String,
        image: String,
        price: Number,
        quantity: Number,
        size: String,
        color: String,
      },
    ],

    payment: {
      method: { type: String, enum: ["COD", "ONLINE"], required: true },
      status: {
        type: String,
        enum: ["PENDING", "PAID", "FAILED"],
        default: "PENDING",
      },
      transactionId: String,
    },

    deliveryAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },

    orderStatus: {
      type: String,
      enum: [
        "PLACED",
        "CONFIRMED",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
        "RETURNED",
      ],
      default: "PLACED",
    },

    totalPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    appliedCoupon: { type: String }, // coupon discount
    couponDiscount: { type: Number, default: 0 }, // coupon discount
    shippingCharges: { type: Number, default: 0 },
    finalPrice: { type: Number, required: true },

    deliveredAt: Date,
    cancelledAt: Date,
    returnedAt: Date,
  },
  { timestamps: true }
);

/**
 * 🆕 AUTO-GENERATE HUMAN READABLE ORDER ID
 * Format → ORD-YYYYMMDD-00001
 */
orderSchema.pre("save", async function (next) {
  if (this.orderId) return next();

  try {
    const counter = await Counter.findOneAndUpdate(
      { id: "orderId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const date = new Date().toISOString().split("T")[0].replace(/-/g, "");
    this.orderId = `ORD-${date}-${String(counter.seq).padStart(5, "0")}`;

    next();
  } catch (err) {
    next(err);
  }
});

const order = mongoose.model("order", orderSchema);
module.exports = order;
