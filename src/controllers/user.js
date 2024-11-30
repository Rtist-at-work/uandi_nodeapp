const express = require('express');
const bcrypt = require('bcryptjs');
const usermodel = require('../models/usermodel');
const multer = require('multer')
const uploadImage = require('../../uploadProduct')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const product = require('../models/productSchema')
require('dotenv').config();
const { body, validationResult } = require('express-validator'); // Import express-validator
const { v4: uuidv4 } = require('uuid');
const verifyauth = require('./verifyauth'); 
const fetchImageData = require('../../fetchImageData');


const storage = multer.memoryStorage();

const upload = multer();

const router = express.Router();
router.use(cookieParser())


const registerValidation = [
    body('username').notEmpty().withMessage('Username is required.'),
    body('emailOrMobile').notEmpty().withMessage('Email or Mobile is required.').custom(value => {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        if (!isEmail && isNaN(value)) {
            throw new Error('Email or Mobile must be a valid email or a mobile number.');
        }
        return true;
    }),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
    body('name').optional().isString().withMessage('Name must be a string.'),
    body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other.')
];

router.post('/register', registerValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: false, message: "Validation errors", errors: errors.array() });
    }

    const { username, emailOrMobile, password, name, gender } = req.body;


    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrMobile);
    const existingUser = await usermodel.findOne(isEmail ? { 'personalInfo.email': emailOrMobile } : { 'personalInfo.mobile': emailOrMobile });
    const existingUsername = await usermodel.findOne({'personalInfo.username':username});

    if (existingUser || existingUsername) {
        return res.json({ status: false, message: "User already exists" });
    }
    const hashpassword = await bcrypt.hash(password, 10);
    if(!username){
        return res.status(400).json({ status: false, message: "Username is required" });
    }

    const newUser = new usermodel({
        personalInfo: { 
            username,
            password: hashpassword,
            email: isEmail ? emailOrMobile : undefined,
            mobile: isEmail ? undefined : emailOrMobile,
            name,
            gender
        },
        coupons:{
            trynew : true
        }
    });

    try {
        await newUser.save();
        return res.json({ status: true, message: "User registered successfully" });
    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            return res.status(400).json({ status: false, message: "Username, email, or mobile already exists." });
        }
        return res.status(500).json({ status: false, message: "Error registering user" });
    }
});


// Add or update personal information (name, gender)
router.post('/:userId/personalInfo', async (req, res) => {
    const { username, password, email, mobile, name, gender } = req.body;
    const user = await usermodel.findById(req.params.userId);

    if (!user) {
        return res.status(404).json({ status: false, message: 'User not found' });
    }

    const hashpassword = await bcrypt.hash(password, 10);

    // Update fields only if they are provided
    if (username) user.personalInfo.username = username;
    if (password) user.personalInfo.password = hashpassword;
    if (email) user.personalInfo.email = email;
    if (mobile) user.personalInfo.mobile = mobile;
    if (name) user.personalInfo.name = name;
    if (gender) user.personalInfo.gender = gender;

    await user.save();

    res.json({ status: true, message: 'Personal information updated', user });
});


router.post('/address',verifyauth, async (req, res) => {
    const {name,
        mobile,
        locality,
        address,
        city,
        state,
        landmark,
        adressType,
        alternateMobile,
        pincode} = req.body;

    try{
        const { id } = req.user; 
        if (!id) {
            return res.status(401).json({ message: 'Token missing or invalid' });
        }
        const user = await usermodel.findById(id);
    
        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }
        user.addresses.push({
            'name':name,
            'mobile':mobile,
            'locality':locality,
            'address':address,
            'city':city,
            'state':state,
            'landmark':landmark,
            'adressType':adressType,
            'alternateMobile':alternateMobile,
            'pincode':pincode
        });
        await user.save();
    
        res.json({ status: true, message: 'Address added', user });
    }
    catch(err){
        res.json(err);
    }
        
   
});

// Add an order to the user's order history
router.post('/:userId/order', async (req, res) => {
    const { product, price, status } = req.body;
    const user = await usermodel.findById(req.params.userId);

    if (!user) {
        return res.status(404).json({ status: false, message: 'User not found' });
    }

    user.orderHistory.push({ product, price, status });
    await user.save();

    res.json({ status: true, message: 'Order added', user });
});
router.post('/cart', upload.none(),verifyauth, async (req, res) => {
    const { id } = req.user; 
    const { productDetails, count, selectedSize,selectedColor } = req.body;
    const parsedCount = count ? Number(count) : 1;     
    if (!id) {
        return res.status(401).json({ message: 'Token missing or invalid' });
    }
 
    try {
     
        const user = await usermodel.findById(id);

        if (!user) {
            return res.status(401).json({ status: false, message: "User not found. Please log in again." });
        }
        const existingProduct = user.cartProducts.find(product => product.product.id === productDetails && product.selectedSize === selectedSize && product.selectedColor === selectedColor);
        if (existingProduct) {
            if(isNaN(parsedCount)||parsedCount<=0){
                return ( res.json({status:false,message:"error updating count"}))
            }
            
            existingProduct.count = parsedCount; 
        } else {
            const cartProduct = await product.findOne({ id: productDetails });
            user.cartProducts.push({
                id: uuidv4(),
                product: cartProduct,
                count: parsedCount,
                selectedSize: selectedSize,
                selectedColor,selectedColor
            });
        }

        await user.save();
        return res.json({ status: true, message: "Cart product updated successfully" });
    } catch (err) {
        console.log(err)
        res.status(404).json({ message: 'Token verification failed',err });
    }
});

router.get('/getCart',verifyauth, async (req, res, next) => {
    try {
        const { id } = req.user; 

        if (!id) {
            return res.status(401).json({ status: false, message: "Please login" });
        }

        const user = await usermodel.findById(id);
        if (!user || !user.cartProducts) {
            return res.status(404).json({ status: false, message: "Cart not found" });
        }

        const cart = user.cartProducts;
        
        const cartColor = cart.flatMap((prd) => prd.product.images?.map((img) => img[1][0].colorImage));
        const cartProducts = cart.flatMap((prd) => prd.product.images.map((img) => img[0])).flat();
        
        const imageIds = [cartProducts, cartColor];
        req.cart = cart;
        req.imageIds = imageIds;
        req.user = user
        console.log(imageIds)

        next();
    } catch (err) {
        console.log(err)
        return res.status(500).json({ status: false, message: err.message });
    }
}, fetchImageData, async (req, res) => {
    try {
        let count = 0;
        let colorCount = 0;
        const cart = await Promise.all(
            req.cart.map((prd, index) => {
                prd.images = prd.product.images?.map((img) => {
                    img[0] = img[0].map(() => req.imagesData[0][count++]);
                    img[1][0].colorImage = req.imagesData[1][colorCount++];
                    return img;
                });
                return prd;
            })
        );
        res.status(200).json({ status: true, message: "Cart successfully fetched", cart,address : req.user.addresses,coupons : req.user.coupons });
    } catch (err) {
        console.error("Error processing final response:", err);
        res.status(500).json({ status: false, message: "Failed to process image data" });
    }
});
router.put('/deleteCartProduct/:productId',verifyauth, async(req,res)=>{
    const {productId} = req.params;
    const { id } = req.user; 
    try{
        
        const user = await usermodel.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });
        const cart = user.cartProducts;
        const updatedCart = cart.filter((product)=>product._id!=productId);
        user.cartProducts = updatedCart;
        await user.save();
        return res.status(200).json({status:true,message:"cart product delelated successfully"})

}
catch(err){
    console.log(err);
}

});
router.put('/editCartProduct/:productId/:editedcount',verifyauth, async(req,res)=>{
    const {productId} = req.params;
    const {editedcount} = req.params;
    const { id } = req.user; 
    console.log(productId)
    try {        
        const user = await usermodel.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });
    
    
        const updatedCart = user.cartProducts.map((product) => {
            console.log(product.product.id)
            console.log(productId)
            console.log(productId===product.product.id )
            if (product.product.id === productId) {
                
                product.count = editedcount;
            }
            return product;
        });
    
        user.cartProducts = updatedCart;
        await user.save();
    
        res.status(200).json({ message: "Cart updated successfully", cart: user.cartProducts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
    


});router.post('/whishlist', verifyauth, async (req, res) => {
    const { productId } = req.body; // Product from request body
    const { id } = req.user; // Extract user ID from the decoded token
    try {
        const user = await usermodel.findById(id);
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found. Please log in." });
        }

        // Check if the product already exists in the user's wishlist
        const existingProduct = user.whishlist.find(
            (wishlistItem) => wishlistItem.productId === productId
        );

        if (existingProduct) {
            // Remove the product from the wishlist
            user.whishlist = user.whishlist.filter((p) => p.productId !== productId);
            await user.save();
            return res.status(200).json({ status: true, message: "Product removed successfully" });
        } else {
            // Add the product to the wishlist
            user.whishlist.push({ productId });
            await user.save();
            return res.status(200).json({ status: true, message: "Product added to wishlist successfully" });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({ status: false, message: "An error occurred", error: err.message });
    }
});

router.get(
    "/getWhishlist",verifyauth,    
    async (req, res, next) => {
      try {
        // Verify token
        const { id } = req.user; 
        if (!id) {
          return res.status(401).json({ status: false, message: "Token is not valid" });
        }  
        // Fetch user and wishlist products
        const user = await usermodel.findById(id);
        if (!user ) {
          return res.status(404).json({ status: false, message: "No wishlist items found" });
        }
        if (!user.whishlist.length ) {
            return res.status(200).json({ products: [] });
        }
  
        const productIds = user.whishlist.map((p) => p.productId); // Extract product IDs
        const products = await product.find({ id: { $in: productIds } }); // Fetch all matching products
  
        // Process images
        const productColors = products.flatMap((prd)=>prd.images.map((img)=>img[1][0].colorImage))
        const productImages = products.flatMap((prd)=>prd.images.map((img)=>img[0])).flat()
       
        // Prepare data for the next middleware
        req.products = products;
        req.imageIds = [productImages, productColors];

        next();
      } catch (err) {
        console.error("Error fetching wishlist:", err);
        return res.status(500).json({ status: false, message: err.message });
      }
    },
    fetchImageData,
    async (req, res) => {
      try {
        // Map processed images back to products
        let count = 0;
        let colorCount = 0;
  
        const updatedProducts = req.products.map((prd) => ({
          ...prd._doc,
          images: prd.images.map((img) => ({
            ...img,
            0: img[0].map(() => req.imagesData[0][count++]), // Map main images
            1: [{ ...img[1][0], colorImage: req.imagesData[1][colorCount++] }], // Map color images
          })),
        }));
        // Send response with updated products
        return res.status(200).json({ products: updatedProducts });
      } catch (err) {
        console.error("Error processing final response:", err);
        return res.status(500).json({ error: "Failed to process image data" });
      }
    }
  );
  
router.put('/deletewhishlist/:productId',verifyauth, async(req,res)=>{
    try{
        const { id } = req.user; 
        if (!id) {
            return res.status(401).json({ status: false, message: "Token is not valid" });
        }
        const user = await usermodel.findById(id);
        if(!user){
            return res.json({status:false,message:"user not found"});
        }
        const whishlist = user.whishlist;
        
        const updatedwhishlist = whishlist.filter((product)=>product.productId!=productId);
        user.whishlist = updatedwhishlist;
        await user.save();      

}
catch(err){
    console.log(err);
}

})
router.post('/review',(req, res, next) => {
    const contentType = req.headers['content-type'];

    if (contentType.startsWith('multipart/form-data')) {
        uploadImage.array('images', 10)(req, res, (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            next();
        });
    } else if (contentType === 'application/json') {
        next();
    } else {
        return res.status(400).json({ error: "Unsupported content type" });
    }
},verifyauth,  async (req, res) => {
   

    try {
        const { rating, orderId, review, productId } = req.body;
        const {id} = req.user;
        if (!id) {
            return res.status(401).json({ status: false, message: "Token is not valid" });
        }

        // Ensure files are checked only when they are sent
        const images = req.files ? req.files.map(file => file.id) : [];

        const user = await usermodel.findById(id);
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found" });
        }

        const order = user.orderHistory.find(order => order.orderId === orderId);
        if (!order) {
            return res.status(404).json({ status: false, message: "Order not found" });
        }
        const product = order.productDetails.find((product)=>
            (product.product._id).toString() === productId
        );
        // Update logic for ratings and reviews
        if (rating) {
            product.review = {
                ...product.review,
                stars: rating
            };
        }
        if (images.length > 0 || review) {
            product.review = {
                ...product.review,
                // Check if order.review.text exists, if not initialize as an empty array
                text: review ? [...(product.review.text || []), review] : product.review.text,
                // Check if order.review.image exists, if not initialize as an empty array
                image: images.length > 0 ? [...(product.review.image || []), ...images] : product.review.image
            };
        }
        

        await user.save();
        return res.json({ status: true, message: "Review updated successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: "Internal server error" });
    }
});


module.exports = router;
