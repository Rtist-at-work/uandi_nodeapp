const express = require('express');
const userloginmodel = require('../models/usermodel');
const jwt = require("jsonwebtoken");
require('dotenv').config();
const nodemailer = require('nodemailer');

const router = express.Router();

router.post('/',async(req,res)=>{
    
    try{
        const {email} = req.body;
        const user = await userloginmodel.findOne({ 'personalInfo.email': email });

        if(!user){
            return res.json({status: true , message:"user not found"})
        }        
        const token = jwt.sign({id : user._id},process.env.KEY,{expiresIn:"1hr"})

        var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'karthik18tech@gmail.com',
            pass: 'ypdr wxlu vjxr cxss'
        }
        });

        var mailOptions = {
        from: 'karthik18tech@gmail.com',
        to: email,
        subject: 'reset password',
        text: `http://localhost:5173/auth/resetpassword/${token}`
        };

        transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            return res.json({message:"error sending email"})
        } else {
            return res.json({status:true,message:"email sent"})
            
        }
        });

    }
    catch(err){
        console.log(err);
    }
    
    
    
})

module.exports = router
