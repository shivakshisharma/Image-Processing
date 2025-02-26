

const { Worker, Queue } = require('bullmq');
const sharp = require('sharp');
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const axios = require('axios'); // Add axios for downloading images
const { sequelize } = require('../config/dbConfig');
const Image = require('../models/Image');
const Request = require('../models/Request');
const Product = require('../models/Product');
const Redis = require('ioredis');
const { Op } = require('sequelize');
const { uploadImageToCloudinary } = require('../services/cloudinaryService'); // Assuming this is a service for Cloudinary upload
const generateCSV = require('../services/generateCSV'); // Import generateCSV
const notifyWebhook = require('../services/webhook'); // Import notifyWebhook

// Configure Redis connection
const redisConnection = require('../config/redisConnection')

const imageQueue = new Queue('imageProcessingQueue', { connection: redisConnection });

// Helper function to download the image from a URL
const downloadImage = async (url, outputPath) => {
    try {
        const response = await axios({
            url,
            responseType: 'stream'
        });

        return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(outputPath);
            response.data.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('❌ Error downloading image:', error);
        throw error;
    }
};

// Update request status after processing all images
const checkAndUpdateRequestStatus = async (requestId, webhookUrl) => {
    try {
        // Get all products linked to the request
        const products = await Product.findAll({ where: { requestId } });
        if (!products.length) {
            console.log(`❌ No products found for Request ${requestId}`);
            return;
        }

        // Get all product IDs
        const productIds = products.map(product => product.id);

        // Count pending images across all products
        const pendingImages = await Image.count({
            where: {
                productId: productIds,
                status: 'pending'
            }
        });

        if (pendingImages === 0) {
            console.log(`✅ Request ${requestId} marked as completed.`);
            await Request.update({ status: 'completed' }, { where: { id: requestId } });

            // ✅ Generate CSV after all images are processed
            const csvFilePath = await generateCSV(requestId);

            // ✅ Notify webhook with the generated CSV
            if (webhookUrl) {
                await notifyWebhook(webhookUrl, requestId, csvFilePath);
            }
        } else {
            console.log(`🔄 Request ${requestId}: Remaining Pending Images = ${pendingImages}`);
        }
    } catch (error) {
        console.error(`❌ Error updating request status:`, error);
    }
};

// Image worker to process images
const imageWorker = new Worker('imageProcessingQueue', async (job) => {
    console.log(`🔄 Processing Image: ${job.data.inputUrl}`);

    try {
        const imageRecord = await Image.findByPk(job.data.imageId);
        if (!imageRecord) {
            console.error('❌ Image record not found in database.');
            return;
        }

        // Fetch the product associated with this image
        const product = await Product.findByPk(imageRecord.productId);
        if (!product) {
            console.error('❌ Product not found for image.');
            return;
        }

        const tempImagePath = path.join(__dirname, `../uploads/original-${Date.now()}.jpg`);
        await downloadImage(job.data.inputUrl, tempImagePath);

        const compressedImagePath = path.join(__dirname, `../uploads/compressed-${Date.now()}.jpg`);
        await sharp(tempImagePath)
            .jpeg({ quality: 50 })
            .toFile(compressedImagePath);

        console.log(`✅ Image Processed: ${compressedImagePath}`);

        // ✅ Upload compressed image to Cloudinary
        const cloudinaryUrl = await uploadImageToCloudinary(compressedImagePath);

        // ✅ Update image record in the database with the Cloudinary URL
        await imageRecord.update({ outputUrl: cloudinaryUrl, status: 'completed' });

        // Delete the temporary downloaded image
        fs.unlinkSync(tempImagePath);
        fs.unlinkSync(compressedImagePath); // Remove the compressed image from local storage

        // ✅ Check and update request status using requestId
        await checkAndUpdateRequestStatus(product.requestId, job.data.webhookUrl);  // FIXED: Passing correct request ID and webhook URL

    } catch (error) {
        console.error('❌ Error processing image:', error);
        await Image.update({ status: 'failed' }, { where: { id: job.data.imageId } });
    }
}, { connection: redisConnection });

console.log('🔄 Image processing worker is running...');

module.exports = { imageQueue };
