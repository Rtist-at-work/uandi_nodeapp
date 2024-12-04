const mongoose = require('mongoose');
require('dotenv').config(); 
//ok

const connect = ()=>{
    const url = process.env.MONGO_URI;
    try{
        mongoose.connect(url,{
            useNewUrlParser: true,
            useUnifiedTopology: true,
            ssl: true,
          });
    }
    catch(err){
        console.log(err);
    }
}

module.exports = connect