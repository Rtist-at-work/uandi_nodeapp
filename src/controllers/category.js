const express = require('express');
const router = express.Router();
const Category = require('../models/category'); 

router.post('/', async (req, res) => {
    try {
        const { category, posters, style } = req.body;

        if (!Array.isArray(style) || !style.every(item => Array.isArray(item) && item.length === 2)) {
            return res.json({
                status: false,
                message: "Invalid style data format. Expected an array of arrays."
            });
        }
        const formattedStyle = style.map(item => ({
            style: item[0],      // Style name (e.g., "a")
            sizes: item[1]       // Sizes array (e.g., ["A", "B"])
        }));
        

        const updatedCategory = await Category.findOneAndUpdate(
            { category },
            {
                $addToSet: {
                    posters: { $each: posters }, // Adds multiple posters without duplicates
                    style: { $each: formattedStyle }       // Adds multiple styles without duplicates
                }
            },
            { new: true, upsert: true }
        );

        return res.json({
            status: true,
            message: "Category created or updated successfully",
            data: updatedCategory
        });
    } catch (err) {
        console.log(err);
        return res.json({
            status: false,
            message: "Error creating category. Please try again later"
        });
    }
});

router.put('/update/:editId',async(req,res)=>{
    try {
        const { category,posters, style } = req.body;
        const {editId} = req.params;
      
        const updatedCategory = await Category.findByIdAndUpdate(
            editId,
           { category,
            posters,
            style}
        );
        if (!updatedCategory) {
            return res.json({ status: false, message: "Category not found" });
        }
        return res.json({ status: true, message: "Category updated Successfully"});
    } catch (err) {
        console.log(err);
        return res.json({ status: false, message: "Error updating category Please try again later" });
    }
})
router.delete('/delete', async (req, res) => {
    const { delItem, delId } = req.query;
  
    try {
        let category;

        if (delItem === "category") {
            category = await Category.findById(delId);
            if (!category) {
                return res.status(404).json({ status: false, message: "Category not found" });
            }
            await Category.findByIdAndDelete(delId);
        }
        else if (delItem === "style") {
            category = await Category.findOne({ "style._id": delId });
            if (!category) {
                return res.status(404).json({ status: false, message: "Style not found" });
            }
            category.style = category.style.filter(style => style._id.toString() !== delId);
            await category.save();
        }

        res.status(200).json({ status: true, message: 'Item deleted successfully' });
    }
    catch (err) {
        res.status(500).json({ status: false, message: err.message });
    }
});

  
module.exports = router;
