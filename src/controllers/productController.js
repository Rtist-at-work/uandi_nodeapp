const express = require('express');
const router = express.Router();
const productForm = require('../models/productSchema');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const multer = require('multer');
const upload = require('../../uploadProduct')

router.post('/', (req, res, next) => {
  upload.fields([
    { name: 'productImages', maxCount: 10 },
    { name: 'colorImages', maxCount: 10 }
  ])(req, res, (err) => {
    if (err) {
      console.error('File upload error:', err);
      return res.status(500).json({ error: 'File upload failed', details: err.message });
    }
    next();
  });
},
async (req, res) => {
  try {
    const { name, price, category, description,offertype, offer, stock, sizes, style } = req.body;

    // Group the images and metadata into the required nested array structure
    
    const productImages = req.files.productImages || [];
    const colorImages = req.files.colorImages || [];
    const metadata = Array.isArray(req.body.productImageslength) ? req.body.productImageslength : [req.body.productImageslength] || [];

    const colorGroups = []; // To store the final grouped result

    let currentIndex = 0; // Keeps track of the current index in productImages
    // Iterate over metadata (lengths of product image slices)
  
    metadata.forEach((length, index) => {
      // Slice the productImages array based on the current length
      const productSlice = productImages.slice(currentIndex, currentIndex + Number(length)); // Slice based on metadata value
      const productImageIds = productSlice.map((productImage) => productImage.id);
      // console.log(productImageIds)
      // Get the corresponding color image
      const colorImage = colorImages[index] || null; // Get the color image corresponding to the index
      // Push the productSlice and colorImage into the result array

      colorGroups.push([productImageIds, [{colorname:colorImage.originalname.split('.')[0], colorImage : colorImage.id}]]);    
      // Update the currentIndex to the next section of productImages
      currentIndex += Number(length);
    });
     const product = new productForm({
            id: uuidv4(),
            name,
            price,
            offertype,
            offer,
            stock,
            sizes,
            category,
            style,
            description,
            images:colorGroups            
        });

    //     // Save the product to the database
        const result = await product.save();

    res.status(200).json({ message: 'Product uploaded successfully', data: colorGroups, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


  module.exports = router ;