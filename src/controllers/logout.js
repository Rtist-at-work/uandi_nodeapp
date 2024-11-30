const express = require('express');
const router = express.Router();
const verifyauth = require('./verifyauth') ;

//lndajnj
router.get('/',verifyauth,async(req,res)=>{
    const {id} = req.user;    
    if(!id){
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
try{
res.clearCookie('token');
return res.json({status:true},{message:"Loggedout Successfully"})
}
catch(err){
    return res.json(err)

}
})

module.exports = router ;