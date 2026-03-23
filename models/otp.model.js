// models/Otp.js
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  mobile: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 300 }, // 300 seconds = 5 minutes
  },
});

const Otp = mongoose.model("Otps", otpSchema);
module.exports = Otp;

