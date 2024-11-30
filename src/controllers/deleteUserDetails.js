const express = require('express')
const router = express.Router();
const usermodel = require('../models/usermodel');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const verifyauth = require('./verifyauth')
 

router.delete('/',verifyauth, async(req,res)=>{
const {id} = req.user;

  if (!id) {
    return res.status(401).json({ message: 'Token missing or invalid' });
}
    const {delId} = req.body ;

    try{
        const user = await usermodel.findById(id);
                  
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        const addressIndex = user.addresses.findIndex(address => address._id.toString() === delId);

        if (addressIndex === -1) {
          return res.status(404).json({ error: 'Address not found' });
        }

        user.addresses.splice(addressIndex, 1);

        await user.save();
        res.status(200).json({ message: 'Address deleted successfully' });
    }
    catch(err){     
        res.json(err)
    }
   
    
 



})

module.exports = router ;