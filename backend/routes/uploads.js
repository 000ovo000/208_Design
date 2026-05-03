const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const router = express.Router();
const uploadsDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsDir);
  },
  filename: (_req, file, callback) => {
    const originalName = path.basename(file.originalname).replace(/\s+/g, "-");
    callback(null, `${Date.now()}-${originalName}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("Only image files are allowed."));
      return;
    }

    callback(null, true);
  },
});

router.post("/", (req, res) => {
  upload.single("image")(req, res, (error) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!req.file) {
      return res.status(500).json({ error: "No image uploaded." });
    }

    return res.json({
      imageUrl: `http://localhost:3001/uploads/${req.file.filename}`,
    });
  });
});

module.exports = router;
