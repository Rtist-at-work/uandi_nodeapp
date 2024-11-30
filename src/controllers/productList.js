const express = require('express');
const router = express.Router();
const productForm = require('../models/productSchema');
const user = require('../models/usermodel');
const fetchImageData = require('../../fetchImageData');


router.get('/', async (req, res,next) => {
    try {
        const products = await productForm.find();
        const users = await user.find();
        const productId = req.query.productDetails;
        const stylenav = req.query.stylenav;
        const categorynav = req.query.categorynav;
        let reviews = [];
        let imageIds = [] ; 
       
        products.map((product) => {
            let count = 0;

            // Ensure product.review exists, or initialize it
            if (!product.review) {
                product.review = {
                    text: [],
                    image: [],
                    stars: 0
                };
            }
            let stars = [];
            // Collect stars for each product based on user orders
            users.flatMap((user) => {
                return user.orderHistory
                    .filter(order =>( 
                        (order.productDetails).map((products)=>{
                        if(products.product.id  === product.id){
                            if ( product.id === productId) {
                                if (products.review && products.review.stars) {
                                    let arr = {
                                        stars: products.review.stars || 0,
                                        text: products.review.text || null,
                                        image: products.review.image || null,
                                        username: user.personalInfo.username
                                    };
                                    reviews.push(arr); // Push the review to the array
                                }
                            }
                            
                            products.review ? stars.push(products.review.stars) : stars.push(undefined) ;
                            
                        }}))
                    
                    )   
            }).filter(star => star !== undefined); // Filter out undefined stars
            const total = stars.reduce((acc, curr) => {
                if (curr > 0) {
                    count++;
                }
                return acc + curr;
            }, 0);
            console.log(total)

            if (total === 0 && count === 0) {
                product.review.stars = 0;
            } else {
                product.review.stars = total / count;
            }
        });
        if(stylenav || categorynav){
          let pro ;
            if(stylenav && categorynav){
              pro = products.filter((product)=>product.category.toLocaleLowerCase().trim(" ") === categorynav.toLocaleLowerCase().trim(" ") && product.style.toLocaleLowerCase().trim(" ")===stylenav.toLocaleLowerCase().trim(" ") );
            }else if(categorynav && !stylenav){
              pro = products.filter((product)=>product.category.toLocaleLowerCase().trim(" ") === categorynav.toLocaleLowerCase().trim(" ") );
            }
            // const bp = (pro.flatMap((prd)=>prd.images[0].flat())).flat()
            // const bpcolor = (pro.flatMap((prd)=>prd.images[1].colorImage.flat())).flat()
            const bpColor = pro.flatMap((prd)=>prd.images.map((img)=>img[1][0].colorImage))
            const bp = pro.flatMap((prd)=>prd.images.map((img)=>img[0])).flat()
          
            imageIds = [              
              bp,bpColor
            ]
            req.products = pro
            req.imageIds = imageIds
            next()

            // return res.json({products:pro})
        }

        // If productId exists, return that product and its reviews, else return all products
        if (productId) {
            const filteredProduct = products.find(p => p.id === productId);
            const productColors = filteredProduct?.images?.map((img)=>img[1][0]?.colorImage)
            const productImages = filteredProduct?.images?.map((img)=>img[0]).flat()
            const otherProducts = products.slice(0,7) ;
            const opColor = otherProducts.flatMap((prd)=>prd.images.map((img)=>img[1][0].colorImage))
            const op = otherProducts.flatMap((prd)=>prd.images.map((img)=>img[0])).flat()
            const reviewPosters = reviews.flatMap((prd)=>prd.image).flat()
            imageIds = [              
                productImages,productColors,op,opColor,reviewPosters
              ]
                req.products = [filteredProduct]              
                req.imageIds = imageIds
                req.reviews = reviews
                req.otherProducts = otherProducts
              next()
            // return res.json({ product: filteredProduct, reviews,otherProducts:products.slice(0,7) });
        }

        // const bp = (products.flatMap((prd,ind)=>prd.images.flat())).flat()
        // imageIds = [              
        //     bp
        //   ]
        //   req.products = products
        //     req.imageIds = imageIds
        //   next()
        // // return res.json(products);
    } catch (err) {
        console.log(err);
        res.status(500).send('Server Error');
    }
},
fetchImageData,
async(req,res)=>{
    try {
      
        let count = 0;
        let colorCount = 0;
      
        // Process main products
        const products = await Promise.all(
            req.products.map((prd,index) => {
              prd.images = prd.images?.map((img) => {
        
                // Mapping img[0]
                img[0] = img[0].map((prdImg) => {
                  return req.imagesData[0][count++];
                });
        
                // Mapping img[1] after img[0]
                img[1][0].colorImage = req.imagesData[1][colorCount++];                
        
                return img;
              });
              return prd;
            })
          );
      
        // Reset count for processing otherProducts if it exists
        if (req.otherProducts) {
          count = 0;
          colorCount = 0
          // Process other products
          const otherProducts = await Promise.all(
            req.otherProducts.map((prd,index) => {
              prd.images = prd.images?.map((img) => {
        
                // Mapping img[0]
                img[0] = img[0].map((prdImg) => {
                  return req.imagesData[2][count++];
                });
                // Mapping img[1] after img[0]
                img[1][0].colorImage = req.imagesData[3][colorCount++];
                return img;
              });
              return prd;
            })
          );
          if(req.reviews){
            count = 0;
          // Process other products
          req.reviews = await Promise.all(
            req.reviews.map((prd,index) => {
              prd.image = prd.image?.map((img) => {
        
                // Mapping img[0]
                img = req.imagesData[4][count++];
                // Mapping img[1] after img[0]
                return img;
              });
              return prd;
            })
          );
          }
          // Send response with both products and otherProducts
          return res.json({ products, otherProducts, review: req.reviews });
        } else {
          // Send response with only products
          return res.json({ products });
        }
      } catch (err) {
        console.error("Error processing final response:", err);
        res.status(500).json({ error: "Failed to process image data" });
      }
      
}
);

module.exports = router;
