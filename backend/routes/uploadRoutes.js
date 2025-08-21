const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const fs = require('fs');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Upload endpoint
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or invalid file type' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
    
    res.status(201).json({
      url: fileUrl,
      type: fileType,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Server error during file upload' });
  }
});

// Delete endpoint
router.delete('/:filename', async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../uploads', req.params.filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    fs.unlinkSync(filePath);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Server error during file deletion' });
  }
});

module.exports = router;