const mongoose = require('mongoose')
require('dotenv').config();

const connect = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error("Mongo_URI is not defined in environment variables.");
    }
    try {
        await mongoose.connect(
            process.env.MONGO_URI
        )
        console.log("MongoDB connected successfully!");
    }
    catch (err) {
        console.log(err)
        throw err;
    }
}

module.exports = connect;