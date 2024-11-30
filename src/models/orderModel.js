const mongoose = require('mongoose');


const orderSchema = new mongoose.Schema({
    userId : {
        type: String,
        sparse:true
    },
    orderId: {
        type: String,
        unique: true,
        sparse : true
    },
    product: [Object],
    price : Number,
    paymentMethod : String,
    deliveryaddress : Object,
    coupon : String,
    orderDate: { type: Date, default: Date.now },
    status: String,    

});

const ordermodel = mongoose.model("Orders", orderSchema);
module.exports = ordermodel;
//lfenjlfndojv
