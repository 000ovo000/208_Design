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
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
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
      const statusCode =
        error instanceof multer.MulterError || error.message === "Only image files are allowed."
          ? 400
          : 500;
      return res.status(statusCode).json({ error: error.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded." });
    }

    const publicBaseUrl = (process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");

    return res.json({
      imageUrl: `${publicBaseUrl}/uploads/${req.file.filename}`,
    });
  });
});

module.exports = router;
