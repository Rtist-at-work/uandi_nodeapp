const express = require('express');
const bcrypt = require('bcryptjs');
const usermodel = require('../models/usermodel');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const router = express.Router();
const verifyauth = require('./verifyauth')


router.get("/check", verifyauth,async (req, res) => {
    const {id} = req.user;
    const { password } = req.query;

    if (!id) {
        return res.status(401).json({ status: false, message: 'No token provided' });
    }

    if (!password) {
        return res.status(400).json({ status: false, message: 'Password is required' });
    }

    try {

        const user = await usermodel.findById(id);
        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found' });
        }

        if (!user.personalInfo || !user.personalInfo.password) {
            return res.status(500).json({ status: false, message: 'User password not found' });
        }

        const isMatch = await bcrypt.compare(password, user.personalInfo.password);
        if (!isMatch) {
            return res.status(401).json({ status: false, message: 'Password is incorrect' });
        }

        return res.status(200).json({ status: true, message: 'Password check success' });
    } catch (err) {
        return res.status(400).json({ status: false, message: 'Error processing request', error: err.message });
    }
});
router.put("/update", async (req, res) => {
    const token = req.cookies?.token || req.query;
    const { newpassword } = req.query;

    if (!token) {
        return res.status(401).json({ status: false, message: 'No token provided' });
    }

    if (!newpassword) {
        return res.status(400).json({ status: false, message: 'Password is required' });
    }

    try {
        const decoded = await jwt.verify(token, process.env.KEY);
        const id = decoded.id;
        const user = await usermodel.findById(id);

        if (user) {
            // Check if the new password is the same as the old password
            const validation = await bcrypt.compare(newpassword, user.personalInfo.password);
            if (validation) {
                return res.status(400).json({ status: false, message: "New password matches your current password" });
            }
        }

        // Hash the new password
        const hashpassword = await bcrypt.hash(newpassword, 10);

        const updateUser = await usermodel.findByIdAndUpdate(
            { _id: id },
            { $set: { "personalInfo.password": hashpassword } },
            { new: true }
        );

        if (updateUser) {
            return res.status(200).json({ status: true, message: 'Password updated successfully' });
        } else {
            return res.status(400).json({ status: false, message: 'User not found' });
        }
    } catch (err) {
        return res.status(400).json({ status: false, message: 'Error processing request', error: err.message });
    }
});

module.exports = router;
