const mongoose = require('mongoose');
const productForm = require('./productSchema');

const addressSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    mobile: {
        type: Number,
        required: [true, 'Mobile number is required'],
        min: 1000000000, max: 9999999999,
        validate: {
          validator: Number.isInteger,
          message: '{VALUE} is not a valid mobile number'
        }},// Assuming 10-digit number
    locality: { type: String, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true },
    addressType: { type: String, enum: ["Home", "Office", "Other"], default: "Home" }, // Enum for predefined types
    alternateMobile: { type: Number, min: 1000000000, max: 9999999999 }, // Optional but with length validation
    pincode: { type: Number, required: true, trim: true, minlength: 6, maxlength: 6 }, // Assuming 6-digit pincode
});
const review = new mongoose.Schema({
    text : {
        type : [String],
        sparse : true,
    },
    image : {
        type : [String],
        sparse : true,
    },
    stars : {
        type : Number,
        sparse : true,
        default : 0
    }
})
const product = new mongoose.Schema({
    product : Object,
    count : Number,
    selectedSize : String,
    selectedColor : {type:String},
    review :{type :review, default:{}, sparse:true}
})

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
        sparse : true
    },
    productDetails : [product],
    price:Number,
    paymentMethod : String,
    deliveryaddress : Object,
    coupon : Object,
    orderDate: { type: Date, default: Date.now },
    status: String,
});

const cartSchema = new mongoose.Schema({
    product:Object,
    count : {type:Number,default:1},
    selectedSize : {type:String} , 
    selectedColor : {type:String}  
})

const whishlistSchema = new mongoose.Schema({
    productId:String
})

const personalInfoSchema = new mongoose.Schema({
    username: { type: String, unique : true },
    email: { type: String,unique: true, sparse: true  },
    mobile: { type: Number, unique: true, sparse: true },
    password: { type: String, required: true },
    name: String,
    gender: String
});

const userSchema = new mongoose.Schema({
    personalInfo: personalInfoSchema, // Separate schema for personal information
    addresses: [addressSchema], // Multiple addresses
    coupons:[Object],
    refferal : {type:String,unique:true},
    refferalPoints: {type:Number},
    orderHistory: { type: [orderSchema], default: [] }, // Order history
    cartProducts : [cartSchema],
    whishlist : [whishlistSchema]
}, {
    validate: {
        validator: function () {
            return this.email || this.mobile;
        },
        message: 'Either email or mobile number must be provided'
    }
});

const usermodel = mongoose.model("User", userSchema);
module.exports = usermodel;
//lfenjlfndojv

