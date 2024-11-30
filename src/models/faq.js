const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  faqs: [
    {
      title: { type: String, required: true },  // Title for each FAQ category
      items: [
        {
          question: { type: String, required: true },
          answer: { type: String, required: true },
        }
      ]
    }
  ],
  createdAt: { type: Date, default: Date.now },
});

const FAQ = mongoose.model('FAQ', faqSchema);
module.exports = FAQ;
