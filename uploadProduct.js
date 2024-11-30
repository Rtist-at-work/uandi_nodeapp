const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const path = require('path');
require('dotenv').config(); 

// Reuse or create MongoDB connection
let conn;
if (!conn) {
  conn = mongoose.createConnection(process.env.MONGO_URI, {
    maxPoolSize: 10 // You can keep this option for connection pooling if needed
  });
}

let gfs;
conn.once('open', () => {
  
  gfs = require('gridfs-stream')(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

const storage = new GridFsStorage({
  url: process.env.MONGO_URI,
  file: (req, file) => {
    const filename = `${Date.now()}-${file.originalname}`;
    const metadata = req.body[`metadata[${file.fieldname}]`] || {};

    return {
      filename: filename,
      bucketName: 'uploads',
      metadata: { description: metadata },
    };
  }
});

// Set up multer with GridFS storage and file size limit
const upload = multer({
  storage: storage,
  fileFilter: (req, file, callback) => {
    const fileType = /jpeg|jpg|png|webp/;
    const mimeType = fileType.test(file.mimetype);
    const extname = fileType.test(path.extname(file.originalname).toLowerCase());

    if (mimeType && extname) {
      callback(null, true);
    } else {
      callback(new Error('Invalid file format!'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
});
module.exports = upload;
