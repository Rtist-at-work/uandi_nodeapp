const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    bannerType: {
      type: String,
      enum: ["main", "offer", "featured"], // UPDATED
      required: true,
    },
    heading: {
      type: String,
      required: true,
      trim: true,
    },
    subHeading: {
      type: String,
      trim: true,
      default: "",
    },
    bannerImg: {
      type: String, // Cloudinary URL or GridFS reference
      required: true,
    },
    products: {
      type: [Number], // 1–200 product ID references
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Banner = mongoose.model("Banner", bannerSchema);

module.exports = Banner;
