const express = require('express');
const multer = require('multer');
const path = require('path');
const { processCSV } = require('../services/csvProcessor'); 

const router = express.Router();

// Configuring Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

router.post('/upload', upload.single('file'), async (req, res) => {
    console.log('📂 Uploaded File Details:', req.file);

    if (!req.file) {
        console.error('❌ CSV file is missing');
        return res.status(400).json({ error: 'CSV file is required' });
    }

    try {
        // console.log(`✅ Processing CSV: ${req.file.path}`);
        const requestId = await processCSV(req.file.path); 
        res.json({ requestId });
    } catch (error) {
        console.error('❌ Error processing CSV:', error);
        res.status(500).json({ error: 'Error processing CSV' });
    }
});

module.exports = router;
