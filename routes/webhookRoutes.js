const express = require('express');
const generateCSV  = require('../services/generateCSV'); 
const { uploadCsvToCloudinary } = require('../services/cloudinaryService');  

const router = express.Router();

// Webhook to show the generated CSV file from Cloudinary
router.post('/webhook', async (req, res) => {
  try {
    // Getting the request ID from the request body
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({ message: 'Request ID is required' });
    }

    // Generating the CSV for the given request ID and upload to Cloudinary
    const cloudinaryUrl = await generateCSV(requestId);

    // Sending back the Cloudinary URL of the uploaded CSV file
    return res.status(200).json({ message: 'CSV file processed and uploaded successfully', fileUrl: cloudinaryUrl });

  } catch (error) {
    console.error('Error in webhook:', error);
    return res.status(500).json({ message: 'An error occurred while processing the webhook', error: error.message });
  }
});

module.exports = router;
