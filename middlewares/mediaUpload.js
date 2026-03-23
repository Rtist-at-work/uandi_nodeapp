const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const crypto = require("crypto");
require("dotenv").config();

const storage = new GridFsStorage({
  url: process.env.MONGO_URI,
  file: (req, file) =>
    new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) return reject(err);
        const filename = `${buf.toString("hex")}-${file.originalname}`;
        resolve({
          filename,
          bucketName: "media",
          chunkSizeBytes: 1 * 1024 * 1024,
        });
      });
    }),
});

const allowedTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
];

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Invalid file format."));
  },
}).fields([
  { name: "productImages", maxCount: 10 },
]);

const mediaUpload = (req, res, next) => {
  // 🟦 STEP 1 → Detect if request has any files
  const hasFiles =
    req.headers["content-type"] &&
    req.headers["content-type"].includes("multipart/form-data");

  if (!hasFiles) {
    // No files → skip multer upload
    req.mediaIds = {
      productImages: [],
    };
    return next();
  }

  // 🟩 STEP 2 → Run multer upload
  upload(req, res, (err) => {
    if (err) {
      return res
        .status(400)
        .json({ message: err.message || "Upload failed" });
    }
    // Attach uploaded file IDs
    req.mediaIds = {
      media: req.files?.productImages?.map((f) => f.id) || [],
      // colors: req.files?.colors?.map((f) => f.id) || [],
      // productImages: req.files?.productImages?.map((f) => f.id) || [],
    };

    next();
  });
};

module.exports = mediaUpload;
