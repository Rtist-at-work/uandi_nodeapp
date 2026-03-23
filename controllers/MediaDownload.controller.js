const mediaDownloadService = require('../services/MediaDownload.service');

const mediaDownload = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Requested file id:", id);

    // ✅ call service directly
    const { file, stream } = await mediaDownloadService(id);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    console.log("Serving file with contentType:", file.contentType);

    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Type", file.contentType);
    res.setHeader("Access-Control-Expose-Headers", "Content-Range, Accept-Ranges");

    stream.pipe(res);
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = mediaDownload;
