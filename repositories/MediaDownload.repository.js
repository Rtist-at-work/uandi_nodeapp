const mongoose = require('mongoose')
const { Types } = require("mongoose");

const mediaDownloadRepository = {
      findMediaFileById: async (id) => {
    const db = mongoose.connection.db;
    const fileId = new Types.ObjectId(id);
    return await db.collection("media.files").findOne({ _id: fileId });
  },

  getMediaBucket: () => {
    const db = mongoose.connection.db;
    return new mongoose.mongo.GridFSBucket(db, {
      bucketName: "media",
    });
  },
}

module.exports = mediaDownloadRepository;