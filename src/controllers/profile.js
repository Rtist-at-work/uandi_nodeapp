const express = require('express');
const usermodel = require('../models/usermodel');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser'); // Ensure cookie-parser is added
require('dotenv').config();
const verifyauth  = require('./verifyauth')

const router = express.Router();

// Add cookie-parser middleware
router.use(cookieParser());

// router.get('/userDetails', async (req, res) => {
//   const token = req.cookies.token;

//   if (!token) {
//     return res.status(401).json({ message: 'Access denied. No token provided.' });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.KEY);
//     const { username } = decoded;
//     console.log(username)
    
//     const user = await usermodel.findOne({ username: username });

//     if (!user) {
//       return res.status(404).json({ message: 'User not found.' });
//     }
    

//     res.json({ user });
//   } catch (err) {
//     console.error(err);
//     res.status(400).json({ message: 'Invalid token.' });
//   }
// });

router.get('/getUser',verifyauth,async (req,res)=>{
  const {id} = req.user;
  if (!id) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  try {
      const user = await usermodel.findById(id);
      res.json(user);
    }
    catch(err){
        res.json(err);
    }
})

router.post('/update/:updateId',verifyauth, async (req, res) => {
 const {id} = req.user;

  if (!id) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
    

    try {
        const personalInfo = req.body;
        const { updateId } = req.params;  // Extract updateId as a string


        const user = await usermodel.findByIdAndUpdate(
            updateId, 
            { 'personalInfo': personalInfo },  // Spread personalInfo once
            
        );

        res.json(user);  // Send the updated user object as a response
    } catch (err) {
        res.json(err);  // Handle and send errors in the response
    }
});


module.exports = router;
