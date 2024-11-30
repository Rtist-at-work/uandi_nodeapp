const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/usermodel');
const Order = require('../models/orderModel');
const product = require('../models/productSchema')
const fetchImageData = require('../../fetchImageData');
const verifyauth = require('./verifyauth')

const cookieParser = require('cookie-parser');
require('dotenv').config();

router.use(cookieParser());

router.post('/',verifyauth, async (req, res) => {
    const {id} =req.user
    try {   

        if (!id) {
            return res.status(401).json({ status: false, message: "User not found. Please login to place order" });
        }
       

        const user = await User.findById(id);
        if (!user) {
            return res.status(401).json({ status: false, message: "User not found. Please login to place order" });
        }

        const { orderId, deliveryAddress, coupon, subTotal,paymentMethod } = req.body;
        let appliedKey;
        let finalPrice;
        if(coupon){
           finalPrice = (subTotal-(subTotal*Object.entries(coupon)[0][1])/100).toFixed(2);
           appliedKey = Object.entries(coupon)[0][0]; // Get the first key from appliedCoupon         

           user.coupons = user.coupons.map((coupon) => {
               if (coupon.hasOwnProperty(appliedKey)) { 
                 return { ...coupon, [appliedKey]: false }; // Update the matched key to false
               }          
               return coupon; // Return unchanged coupon if condition doesn't match
             });             
             
        }
       // Collect all product IDs from orderSummary
        const productIds = user.cartProducts.map(order => order.product.id);
        // console.log(Object.entries(coupon)[0][0])
        // console.log(Object.entries(user.coupons)[0][1].trynew)
        // console.log(typeof(coupon))
       
          
        // Use updateMany to increment SalesPoints by 1 for each product in the list
        await product.updateMany(
        { id: { $in: productIds } },  // Match products with the IDs in productIds
        { $inc: { SalesPoints: 1 } }    // Increment SalesPoints by 1
        );

        if (!deliveryAddress || !Array.isArray(user.cartProducts) || user.cartProducts.length === 0) {
            return res.status(400).json({ status: false, message: "Invalid order data" });
        }
        const order = new Order({
            userId: id,
            orderId: orderId,
            product:  user.cartProducts,
            price: finalPrice || subTotal,
            paymentMethod : paymentMethod,
            deliveryaddress: deliveryAddress,
            coupon: appliedKey || '', // Default to empty string if no coupon
            orderDate: Date.now(),
            status: "orderplaced",
        });

        await order.save();
        
        // Update user order history
        user.orderHistory.push({
            orderId: orderId,
            productDetails: user.cartProducts.map(order => ({
                product: order.product,
                count: order.count,
                selectedSize: order.selectedSize,
                selectedColor: order.selectedColor,
            })),
            price: finalPrice,
            paymentMethod: paymentMethod,
            deliveryaddress: deliveryAddress,
            coupon: appliedKey || '',
            orderDate: Date.now(),
            status: "order placed",
        });
        

        // // Clear user's cart products
        user.cartProducts = []; // Assuming cartProducts is an array
        

        await user.save(); // Save the user instance

        return res.status(200).json({ status: true, message: "Order placed successfully" });
    } catch (error) {
        console.error("Error processing order:", error);
        return res.status(500).json({ status: false, message: "An error occurred", error: error.message });
    }
});
router.get('/orderId',verifyauth, async (req, res) => {
    const {id} = req.user;
    try {       

        if (!id) {
            return res.status(401).json({ status: false, message: "User not found. Please login to place order" });
        }

        const orderCount = await Order.countDocuments();

        return res.json({ status: true, message: "Fetched successfully", orderCount });

    } catch (err) {
        // Catch any errors related to token verification or order fetching
        console.error(err);
        return res.status(500).json({ status: false, message: "An error occurred", error: err.message });
    }
});
router.get('/orderDetails',verifyauth,async(req,res,next)=>{
    const orderId = req.query.orderId;
    const { id } =req.user;

    try {       
    
        if (!id) {
            return res.status(401).json({ status: false, message: "User not found. Please login to place order" });
        }
    
        const user = await User.findById(id);
        if (!user) {
            return res.status(401).json({ status: false, message: "User not found. Please login to place order" });
        }
    
        // const products = await product.find(); // Ensure you await the product query
    
        const extractProductDetails = user.orderHistory.flatMap((order)=>{
            return order.productDetails.map((p)=>p.product)
        })
          
        const opColor = extractProductDetails.flatMap((prd)=>prd.images.map((img)=>img[1][0].colorImage))
            const op = extractProductDetails.flatMap((prd)=>prd.images.map((img)=>img[0])).flat()
            imageIds = [              
               op,opColor
              ]
              if(orderId){
                req.orderId = orderId
              }
              req.orders = user.orderHistory
                req.imageIds = imageIds
                next()
        // if(orderId){
        //     const filteredOrder = orders.find((order)=>(order.orderId===orderId));
        //     return res.status(200).json({ status: true, filteredOrder });
        // }
        // // Send the response with orders or further processing
        // return res.status(200).json({ status: true, orders });
    
    } catch (error) {
        console.error("Error verifying token or fetching user:", error);
        return res.status(500).json({ status: false, message: "Internal server error" });
    }
    
},fetchImageData,async(req,res)=>{
    try {
      
        // let count = 0;
        // let colorCount = 0;
      
        // Process main products
        const orders = await Promise.all(
            req.orders.map(async (order) => {
              let count = 0; // Initialize count for each order
              let colorCount = 0; // Initialize colorCount for each order
          
              // Loop through productDetails and update images
              order.productDetails = await Promise.all(
                order.productDetails.map((prd) => {
                  if (prd.product && prd.product.images) {
                    prd.product.images = prd.product.images.map((img) => {
                      // Mapping img[0]
                      img[0] = img[0].map((prdImg) => req.imagesData[0][count++]);
          
                      // Mapping img[1] after img[0]
                      if (img[1] && img[1][0]) {
                        img[1][0].colorImage = req.imagesData[1][colorCount++];
                      }
          
                      return img;
                    });
                  }
          
                  return prd;
                })
              );
          
              return order;
            })
          );
            if(req.orderId){
            const filteredOrder = orders.find((order)=>(order.orderId===req.orderId));
            return res.status(200).json({ status: true, filteredOrder });
        }
          // Send response with both products and otherProducts
        //   return res.json({ products, otherProducts, review: req.review });
          return res.json({ orders });
      } catch (err) {
        console.error("Error processing final response:", err);
        res.status(500).json({ error: "Failed to process image data" });
      }
}
)




module.exports = router;
