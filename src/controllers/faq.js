const express = require('express');
const FAQ = require('../models/faq'); // Import the FAQ model
const router = express.Router();

router.post('/', async (req, res) => {
    const { faqs } = req.body;
  
    // Validate incoming data
    if (!faqs || !Array.isArray(faqs) || faqs.some(f => !f.title || !f.items)) {
      return res.status(400).json({ message: 'Invalid FAQ data.' });
    }
  
    try {
      // Find the FAQ document or create it if it doesn't exist
      const existingFaqDoc = await FAQ.findOne({});
  
      // If a document already exists, replace its contents with the new FAQ data
      if (existingFaqDoc) {
        // Replace the 'faqs' array entirely with the new data
        existingFaqDoc.faqs = faqs;
        
        // Save the updated document
        await existingFaqDoc.save();
        res.status(200).json({
          message: 'FAQs updated successfully.',
          data: existingFaqDoc,
        });
      } else {
        // If no document exists, create a new one with the provided FAQs
        const newFaqDoc = new FAQ({
          faqs: faqs,  // Store the FAQ data directly
        });
        await newFaqDoc.save();
        res.status(200).json({
          message: 'FAQs uploaded successfully.',
          data: newFaqDoc,
        });
      }
    } catch (error) {
      console.error('Error uploading FAQs:', error);
      res.status(500).json({ message: 'Failed to upload FAQs.' });
    }
  });
  
module.exports = router;
