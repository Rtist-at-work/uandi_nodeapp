const mongoose = require('mongoose');

const styleSchema = new mongoose.Schema({
  style : String,
  sizes : [String]
})

  // Define the main category schema
  const categorySchema = new mongoose.Schema({
    category: {
      type: String,
      required: true,
      unique: true,
    },
    posters: [String],          // Array of strings for poster URLs or identifiers
    style: [styleSchema],       // Array of `styleSchema` to match [["a", ["A", "b"]], ...]
  });
  
const Category = mongoose.model('Category', categorySchema);

module.exports = Category
//lfenjlfndojv
