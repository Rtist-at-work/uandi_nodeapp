const express = require("express");
const router = express.Router();
const Order = require("../models/orderModel");
const ReturnSchema = require("../models/Return");

// Handle POST request for return requests
router.post("/", async (req, res) => {
  try {
    const { orderid, email, reason } = req.body;

    // Validate input data
    if (!orderid || !email || !reason) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Find the order by order ID
    const foundOrder = await Order.findOne({ orderId: orderid });
    if (!foundOrder) {
      return res.status(400).json({ error: "No such order found." });
    }

    // Save the return request to the database
    const newRequest = new ReturnSchema({
      orderid,
      email,
      reason,
      createdAt: new Date(),
    });

    await newRequest.save();

    // Respond to the client
    res.status(200).json({
      message: "Return request submitted successfully.",
      data: newRequest,
    });
  } catch (error) {
    console.error("Error processing return request:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
