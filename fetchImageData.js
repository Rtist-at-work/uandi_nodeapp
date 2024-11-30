const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

const fetchImageData = async (req, res, next) => {
  try {
    const gfs = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
    const imageIds = req.imageIds || [];  // IDs to fetch, assumed to be in `req.imageIds`
    // Prepare an array to store image data
    const imagesData = [];

    // Loop through the imageIds array (which contains sub-arrays)
    for (let i = 0; i < imageIds.length; i++) {
      // For each sub-array of image IDs, fetch images concurrently
      const imageDataArray = await Promise.all(
        imageIds[i].map((imageId) => retrieveImageData(gfs, imageId))
      );      
      // Filter out any `null` values (for missing images) and push into `imagesData`
      imagesData.push(imageDataArray.filter(imageData => imageData !== null));
    }
    // Attach the fetched images data to the request object
    req.imagesData = imagesData;
    
    // Move to the next middleware or route handler
    next();
  } catch (err) {
    next(err); // Pass error to the error-handling middleware
  }
};

// Helper function to retrieve image data from GridFS by ID
const retrieveImageData = (gfs, imageId) => {
  return new Promise((resolve, reject) => {
    const _id = new mongoose.Types.ObjectId(imageId); // Convert imageId to ObjectId
    const chunks = [];

    // Open a read stream to fetch the image from GridFS
    const readStream = gfs.openDownloadStream(_id);
    
    readStream.on('data', (chunk) => chunks.push(chunk));  // Collect data chunks
    readStream.on('end', () => {
      if (chunks.length > 0) {
        // Concatenate chunks and convert to base64 string
        const imageData = Buffer.concat(chunks).toString('base64');
        resolve(`data:image/png;base64,${imageData}`);  // Resolve with base64 image data
      } else {
        resolve(null);  // Resolve with null if image not found
      }
    });
    
    readStream.on('error', (err) => {
      if (err.message.includes('FileNotFound')) {
        resolve(null);  // Return null if file not found
      } else {
        reject(err);  // Reject for any other errors
      }
    });
  });
};

module.exports = fetchImageData;
