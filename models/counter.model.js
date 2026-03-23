const mongoose = require('mongoose')

const counterSchema = new mongoose.Schema({
  id: { type: String, required: true },
  seq: { type: Number, default: 1000 }, // starting number
});

// Index for faster searching
// productSchema.index({ name: "text", category: 1, style: 1 });

const counter = mongoose.model("counter", counterSchema);
module.exports = counter;

