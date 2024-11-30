const express = require('express');
const userloginmodel = require('../models/usermodel');
const jwt = require("jsonwebtoken");
require('dotenv').config();

const router = express.Router();

router.post('/',async(req,res)=>{
    const {email} = req.body;

    const user = await userloginmodel.findOne({email})

    const token = jwt.sign({username : user.username}, process.env.KEY,{expiresIn:"1hr"})
    res.cookie('token',token,{httpOnly:true,maxAge:360000})
    return token;
    
})

module.exports = router;
