const mongoose = require('mongoose');

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

// const productImages = new mongoose.Schema({
//     images: [String],
//     colors: [String]
// });
const productSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true
    },
    name: {
        type: String
    },
    price: {
        type: Number,
        required: true,
        min: 0 // Ensure price is not negative
    },
    offertype: {
        type: String,
        required: true,      
    },
    offer: {
        type: Number,
        min: 0, // Ensure offer is not negative
        default: 0 // Provide a default value
    },
    stock: {
        type: String,
        enum: ["In Stock", "Out Of Stock"], // Limit stock to specific values
        required: true
    },
    sizes: {
        type: [String]
    },
    category: {
        type: String
    },
    style: {
        type: String
    },
    description: {
        type: String
    },
    images : [Array],
    review : review,
    SalesPoints : {
        type : Number,
        default : 0,
        saprse:true
    },
});

const productForm = mongoose.model('products', productSchema);
module.exports = productForm;
//lfenjlfndojv
