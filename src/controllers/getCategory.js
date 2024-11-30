const express = require('express');
const router = express.Router();
const categorymodel = require('../models/category');
const product = require('../models/productSchema')
const fetchImageData = require('../../fetchImageData')


router.get('/',async(req,res,next)=>{
  let imageIds = [] ; 

    try{
        const category = await categorymodel.find();
        const categorynav = req.query.categorynav || "";
        const products = await product.find();

        if(category && categorynav){  
            const styleList = category.filter(                
                (category) => {  
                    return(
                       category.category.trim().toLowerCase() === categorynav.trim().toLowerCase()
                    )
                }                
              );
            return res.json({category,styleList});   
        }
        
        else{

            const catProducts = category
                    .map((cat) => {
                        const productWithOffer = products.find(( ) => product.category === cat.category && product.offer > 0);
                        return productWithOffer || products.find((product) => product.category === cat.category) || null;
                    })
                    .filter(product => product !== null);
                    
                    const fColors = catProducts.flatMap((prd)=>prd.images.map((img)=>img[1][0].colorImage))
                    const f = catProducts.flatMap((prd)=>prd.images.map((img)=>img[0])).flat()
                    const bestsellers = await product
                .find({})
                .sort({ SalesPoints: -1 })
                .limit(7);
                const bsColor = bestsellers.flatMap((prd)=>prd.images.map((img)=>img[1][0].colorImage))
                const bs = bestsellers.flatMap((prd)=>prd.images.map((img)=>img[0])).flat()
                imageIds = [
                  f,
                  fColors,
                  bs,
                  bsColor
                ]

                const categories = await categorymodel.aggregate([
                    // Unwind the 'style' array to get individual style documents
                    { $unwind: "$style" },
              
                    // Unwind the 'sizes' array within each style
                    { $unwind: "$style.sizes" },
              
                    // Group by category, style, and collect sizes for each style
                    { $group: {
                      _id: { category: "$category", style: "$style.style" },
                      sizes: { $addToSet: "$style.sizes" }
                    } },
              
                    // Re-group by category to get the final structure
                    { $group: {
                      _id: "$_id.category",
                      styles: {
                        $push: {
                          style: "$_id.style",
                          sizes: "$sizes"
                        }
                      }
                    } },
              
                    // Project the category structure
                    { $project: {
                      _id: 0,
                      category: "$_id",
                      styles: 1
                    } }
                  ]);
              
                  // Format the data into the desired structure
                  const categoryData = categories.reduce((acc, category) => {
                    const sizes = category.styles.reduce((styleAcc, style) => {
                      styleAcc[style.style] = style.sizes;
                      return styleAcc;
                    }, {});
              
                    acc[category.category] = {
                      sizes: [...new Set(category.styles.flatMap(style => style.sizes))], // Combine all sizes for this category
                      styles: sizes
                    };
                    return acc;
                  }, {});

                  req.imageIds = imageIds
                  req.category =category
                  req.catProducts = catProducts
                  req.bestsellers = bestsellers
                  req.categoryData = categoryData
                  next()
        }

    }
    catch(err){
        console.log(err);
    }
    

},fetchImageData, async(req,res)=>{
  try{
    let count = 0 ;
    const catProducts = await Promise.all(
      req.catProducts.map((prd,index) => {
        prd.images = prd.images?.map((img) => {
  
          // Mapping img[0]
          img[0] = img[0].map((prdImg) => {
            return req.imagesData[0][count++];
          });
  
          // Mapping img[1] after img[0]
          img[1][0].colorImage = req.imagesData[1][index];
          
  
          return img;
        });
        return prd;
      })
    );
    count = 0 ; 
    const bestsellers = await Promise.all(
      req.bestsellers.map((prd,index) => {
        prd.images = prd.images?.map((img) => {
  
          // Mapping img[0]
          img[0] = img[0].map((prdImg) => {
            return req.imagesData[2][count++];
          });
  
          // Mapping img[1] after img[0]
          img[1][0].colorImage = req.imagesData[3][index];
          return img;
        });
        return prd;
      })
    );
  
    
    res.json({category:req.category,catProducts,bestsellers,categoryData:req.categoryData});

  }
  catch (err) {
    console.error("Error processing final response:", err);
    res.status(500).json({ error: "Failed to process image data" });
  }
}
) 

module.exports = router 