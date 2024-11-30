const mongoose = require('mongoose');
require('dotenv').config(); 


const connect = ()=>{
    const url = process.env.MONGO_URI;
    try{
        mongoose.connect(url);
    }
    catch(err){
        console.log(err);
    }
}

module.exports = connect