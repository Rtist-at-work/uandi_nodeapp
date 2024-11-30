const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('../models/usermodel');  // Assuming you have a User model
const verifyauth = require('./verifyauth')

router.put('/',verifyauth, async (req, res) => {
  const {id} = req.user;

  if (!id) {
    return res.status(401).json({ message: 'Token missing or invalid' });
}
  const  addresses  = req.body;
 
  if (!addresses || !Array.isArray(addresses)) {
    return res.status(400).json({ error: "Invalid addresses format" });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      { _id: id },       // Filter by username
      { $set: { addresses: addresses } },  // Update the addresses field
      { new: true }                 // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "Addresses updated successfully", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
