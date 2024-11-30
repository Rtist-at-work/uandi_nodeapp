const mongoose = require("mongoose");

const ReturnRequestSchema = new mongoose.Schema({
  orderid: {
    type: String,
    required: true, // Makes this field mandatory
    trim: true, // Removes unnecessary whitespace
  },
  email: {
    type: String,
    required: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"], // Regex to validate email
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set the creation date
  },
});
const ReturnRequest = mongoose.model("ReturnRequest", ReturnRequestSchema);
module.exports = ReturnRequest;

