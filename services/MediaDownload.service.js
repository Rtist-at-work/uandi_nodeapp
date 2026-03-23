const mediaDownloadRepository = require("../repositories/MediaDownload.repository");

const mediaDownloadService = async (id) => {
  const file = await mediaDownloadRepository.findMediaFileById(id);
  if (!file) {
    return { file: null };
  }

  const bucket = mediaDownloadRepository.getMediaBucket();
  const stream = bucket.openDownloadStream(file._id);

  const fileLength = file.length;
  let downloaded = 0;

  stream.on("data", (chunk) => {
    downloaded += chunk.length;
    // const percent = ((downloaded / fileLength) * 100).toFixed(2);
  });

  return { file, stream };
};


module.exports = mediaDownloadService