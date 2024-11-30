const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const usermodel = require('../models/usermodel'); 
const router = express.Router();
const verifyauth = require('./verifyauth')

router.get('/',verifyauth,async(req,res)=>{
    const {id} = req.user;
  if (!id) {
    return res.status(401).json({ message: 'Token missing or invalid' });
}
    try{
        const user = await usermodel.findById(id);
        res.json(user.addresses)
    }
    catch(err){
       res.json(err);
    }
})

module.exports = router;