const express = require('express');
const router = express.Router();
const productForm = require('../models/productSchema');
const upload = require('../../uploadProduct')

router.put("/:pid", 
    (req, res, next) => {
      upload.fields([
        { name: 'productImages', maxCount: 10 },
        { name: 'colorImages', maxCount: 10 }
      ])(req, res, (err) => {
        if (err) {
        console.log("jnjnj")
          console.error("File upload error:", err);
          return res.status(500).json({ error: "File upload failed", details: err.message });
        }
        next();
      });
    },
    async (req, res) => {
      const { pid } = req.params;
  
      try {
        const productImages = req.files?.productImages || [];
        const colorImages = req.files?.colorImages || [];
        const metadata = req.body.productImageslength 
          ? Array.isArray(req.body.productImageslength)
            ? req.body.productImageslength.map(Number)
            : [Number(req.body.productImageslength)]
          : [];
  
        if (!metadata.length) {
          return res.status(400).json({ error: "Invalid metadata: No lengths provided" });
        }
  
        const colorGroups = [];
        let currentIndex = 0;
  
        metadata.forEach((length, index) => {
          const productSlice = productImages.slice(currentIndex, currentIndex + length);
          const productImageIds = productSlice.map((img) => img.id);
  
          const colorImage = colorImages[index] || null;
          const colorData = colorImage
            ? { colorname: colorImage.originalname.split(".")[0], colorImage: colorImage.id }
            : null;
  
          colorGroups.push([productImageIds, colorData ? [colorData] : []]);
          currentIndex += length;
        });
        
        const { name, price, category, description, offer, stock, sizes, style } = req.body;

        // Directly updating the product document using `findOneAndUpdate`
        const updatedProduct = await productForm.findOneAndUpdate(
          { id: pid }, // Find the product by its ID
          {
            $set: {
              name,
              price,
              offer,
              stock,
              sizes: Array.isArray(sizes) ? sizes : [sizes],
              category,
              style,
              description,
            },
            $push: {
              images: { $each: colorGroups} // Append new images to the existing ones
            }
          },
          { new: true } // Return the updated document
        );
        console.log(updatedProduct)
  
        if (!updatedProduct) {
          return res.status(404).json({ error: "Product not found" });
        }
        return res.status(200).json({ success: true, message: "Product updated successfully", data: updatedProduct });
      } catch (err) {
        console.error("Error updating product:", err);
        return res.status(500).json({ success: false, message: "An error occurred", details: err.message });
      }
    }
  );
  
router.get('/getProducts',async(req,res)=>{
    
    const { editId } = req.query;
    try{
        const product = await productForm.findOne({id:editId});
        if(product){
            res.json({status:true,message:"product fetched successfully",product})
        }
    }
    catch(err){
        res.json({status:false,err});

    }
})
router.delete('/deleteProducts',async(req,res)=>{
    
    const { editId } = req.query;
    try{
        const product = await productForm.deleteOne({id:editId});
        if(product){
            res.json({status:true,message:"product deleted successfully"})
        }
    }
    catch(err){
        res.json({status:false,err});

    }
})

router.delete('/deleteColor/:pid', async (req, res) => {
    try {
      const { pid } = req.params;
      const { colorname } = req.query;
  
      if (!pid || !colorname) {
        return res.status(400).json({ message: 'Product ID and colorname are required.' });
      }
  
      // Find the product
      const product = await productForm.findOne({ id: pid });
  
      if (!product) {
        return res.status(404).json({ message: 'Product not found.' });
      }
  
      // Filter the images to remove the matching colorname
      product.images = product.images.filter((imageArray) => {
        // Check if colorname exists and matches
        return imageArray[1] && 
               imageArray[1][0] && 
               imageArray[1][0].colorname && 
               imageArray[1][0].colorname.toLowerCase().trim() !== colorname.toLowerCase().trim();
      });
  
      // Save the updated product
      await product.save();
  
      return res.status(200).json({ message: 'Color removed successfully from images.' });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error.', error });
    }
  });
  

module.exports = router;

module.exports = router;
    