const express = require("express");
const multer = require("multer");
const admin = require("firebase-admin");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
const serviceAccount = require("./firebase-admin.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://schoolone-firebase.firebasestorage.app",
});

const bucket = admin.storage().bucket();

// Configure Multer for file uploads
const upload = multer({ dest: "devservers/uploads/" });

// Upload endpoint
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  try {
    const filePath = path.join(__dirname, req.file.path);

    // Extract the file extension
    const fileExtension = path.extname(req.file.originalname);

    // Create a custom file name with the extension
    const fileName = `uploads/${Date.now()}_Schoolone${fileExtension}`;

    await bucket.upload(filePath, {
      destination: fileName,
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    // Get the file URL
    const file = bucket.file(fileName);
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: "03-01-2030",
    });

    // Delete temp file
    fs.unlinkSync(filePath);

    res.status(200).json({ message: "File uploaded successfully", url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// Start Server
const PORT = process.env.PORT || 6010;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
