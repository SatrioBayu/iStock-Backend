// uploadMiddleware.js
const multer = require("multer");

// Atur storage untuk multer (di sini hanya menyimpan di memory sementara)
const storage = multer.memoryStorage();

// Filter hanya menerima gambar
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Hanya file gambar yang diperbolehkan"), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
