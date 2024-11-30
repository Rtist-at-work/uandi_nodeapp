const express = require("express");
const router = express.Router();
const Policy = require('../models/policy'); // Assuming you have a Policy model
const faqs = require('../models/faq')

// Get policy by type
router.get("/getpolicy/:policyType", async (req, res) => {
  try {
    const { policyType } = req.params;
    let type = (policyType.toLowerCase()).replace(/\s+/g, "");
    const policy = await Policy.findOne();
    const faq = await faqs.find();
    console.log(faq)
    if(type==="privacypolicy") type=policy.PrivacyPolicy;
    if(type==="shippingpolicy") type=policy.ShippingPolicy;
    if(type==="terms&conditions") type=policy.TermsConditions;
    if(type==="frequentlyaskedquestions") type=faq;
    if (policy) {
      return res.status(200).json(type);
    } else {
      return res.status(404).json({ message: "Policy not found" });
    }
  } 
catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
// Save or update policy
router.post("/", async (req, res) => {
    try {
      const { type, content } = req.body;
  
      // Sanitize type input
      const policyType = (type.toLowerCase()).replace(/\s+/g, "");
      console.log(policyType)
      // Find or create a single policy document
      let existingPolicy = await Policy.findOne();
      if (!existingPolicy) {
        existingPolicy = new Policy({});
      }
  
      // Update the respective policy content based on type
      if (policyType === "privacypolicy") {
        existingPolicy.PrivacyPolicy = content;
      } else if (policyType === "shippingpolicy") {
        existingPolicy.ShippingPolicy = content;
      } else if (policyType === "returnpolicy") {
        existingPolicy.ReturnPolicy = content;
      } else if (policyType === "terms&conditions") { // Renamed field for MongoDB compatibility
        existingPolicy.TermsConditions = content;
      } else {
        return res.status(400).json({ message: "Invalid policy type" });
      }
  
      // Save updated policy
      await existingPolicy.save();
  
      res.status(200).json({ message: "Policy saved successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  });
  
module.exports = router;
