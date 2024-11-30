const mongoose = require('mongoose');


const policySchema = new mongoose.Schema({
    PrivacyPolicy : {type:String,sparse:true},
    ShippingPolicy : {type:String,sparse:true},
    ReturnPolicy : {type:String,sparse:true},
    TermsConditions : {type:String,sparse:true}
      

});

const policymodel = mongoose.model("Policies", policySchema);
module.exports = policymodel;
//lfenjlfndojv
