// const { Worker, Queue } = require('bullmq');
// const sharp = require('sharp');
// const { Sequelize } = require('sequelize');
// const fs = require('fs');
// const path = require('path');
// const axios = require('axios'); 
// const { sequelize } = require('../config/dbConfig');
// const Image = require('../models/Image');
// const Request = require('../models/Request');
// const Product = require('../models/Product');
// const Redis = require('ioredis');
// const { Op } = require('sequelize');
// const { uploadImageToCloudinary } = require('../services/cloudinaryService'); 
// const generateCSV = require('../services/generateCSV'); 
// const notifyWebhook = require('../services/webhook'); 

// // Configuring Redis connection
// const redisConnection = require('../config/redisConnection')

// const imageQueue = new Queue('imageProcessingQueue', { connection: redisConnection });

// // Helper function to download the image from a URL
// const downloadImage = async (url, outputPath) => {
//     try {
//         const response = await axios({
//             url,
//             responseType: 'stream'
//         });

//         return new Promise((resolve, reject) => {
//             const writer = fs.createWriteStream(outputPath);
//             response.data.pipe(writer);
//             writer.on('finish', resolve);
//             writer.on('error', reject);
//         });
//     } catch (error) {
//         console.error('❌ Error downloading image:', error);
//         throw error;
//     }
// };

// // Updating request status after processing all images
// const checkAndUpdateRequestStatus = async (requestId, webhookUrl) => {
//     try {
//         // Get all products linked to the request
//         const products = await Product.findAll({ where: { requestId } });
//         if (!products.length) {
//             console.log(`❌ No products found for Request ${requestId}`);
//             return;
//         }

//         // Get all product IDs
//         const productIds = products.map(product => product.id);

//         // Count pending images across all products
//         const pendingImages = await Image.count({
//             where: {
//                 productId: productIds,
//                 status: 'pending'
//             }
//         });

//         if (pendingImages === 0) {
//             console.log(`✅ Request ${requestId} marked as completed.`);
//             await Request.update({ status: 'completed' }, { where: { id: requestId } });

//             // Generate CSV after all images are processed
//             const csvFilePath = await generateCSV(requestId);

//             // Notify webhook with the generated CSV
//             if (webhookUrl) {
//                 await notifyWebhook(webhookUrl, requestId, csvFilePath);
//             }
//         } else {
//             console.log(`🔄 Request ${requestId}: Remaining Pending Images = ${pendingImages}`);
//         }
//     } catch (error) {
//         console.error(`❌ Error updating request status:`, error);
//     }
// };

// // Image worker to process images
// const imageWorker = new Worker('imageProcessingQueue', async (job) => {
//     console.log(`🔄 Processing Image: ${job.data.inputUrl}`);

//     try {
//         const imageRecord = await Image.findByPk(job.data.imageId);
//         if (!imageRecord) {
//             console.error('❌ Image record not found in database.');
//             return;
//         }

//         // Fetch the product associated with this image
//         const product = await Product.findByPk(imageRecord.productId);
//         if (!product) {
//             console.error('❌ Product not found for image.');
//             return;
//         }

//         const tempImagePath = path.join(__dirname, `../uploads/original-${Date.now()}.jpg`);
//         await downloadImage(job.data.inputUrl, tempImagePath);

//         const compressedImagePath = path.join(__dirname, `../uploads/compressed-${Date.now()}.jpg`);
//         await sharp(tempImagePath)
//             .jpeg({ quality: 50 })
//             .toFile(compressedImagePath);

//         console.log(`✅ Image Processed: ${compressedImagePath}`);

//         // Uploading compressed image to Cloudinary
//         const cloudinaryUrl = await uploadImageToCloudinary(compressedImagePath);

//         //Updating image record in the database with the Cloudinary URL
//         await imageRecord.update({ outputUrl: cloudinaryUrl, status: 'completed' });

//         // Deleting the temporary downloaded image
//         fs.unlinkSync(tempImagePath);
//         fs.unlinkSync(compressedImagePath); // Remove the compressed image from local storage

//         await checkAndUpdateRequestStatus(product.requestId, job.data.webhookUrl);  

//     } catch (error) {
//         console.error('❌ Error processing image:', error);
//         await Image.update({ status: 'failed' }, { where: { id: job.data.imageId } });
//     }
// }, { connection: redisConnection });

// console.log('🔄 Image processing worker is running...');

// module.exports = { imageQueue };

const sharp = require("sharp");
const axios = require("axios");
const Image = require("../models/Image");
const Request = require("../models/Request");
const Product = require("../models/Product");
const { uploadImageToCloudinary } = require("../services/cloudinaryService");
const generateCSV = require("../services/generateCSV");
const notifyWebhook = require("../services/webhook");

const imageQueue = [];
let isProcessing = false;

// Helper function to download image
const downloadImage = async (url) => {
    try {
        // console.log(`🔽 Downloading image: ${url}`);
        const response = await axios({ url, responseType: "arraybuffer" });
        return Buffer.from(response.data);
    } catch (error) {
        // console.error(`❌ Error downloading image (${url}):`, error.message);
        throw error;
    }
};

// Function to process the image queue sequentially
const processQueue = async () => {
    if (isProcessing || imageQueue.length === 0) {
        // console.log(`⚠️ Queue not processing. isProcessing: ${isProcessing}, Queue Length: ${imageQueue.length}`);
        return;
    }

    // console.log("🔄 Starting image processing queue...");
    isProcessing = true;

    while (imageQueue.length > 0) {
        const { imageId, inputUrl, requestId, webhookUrl } = imageQueue.shift();
        // console.log(`🟡 Processing image from queue: ${inputUrl}`);

        try {
            await processImage(imageId, inputUrl, requestId, webhookUrl);
            await new Promise((resolve) => setTimeout(resolve, 2000)); // ✅ Add delay to free memory

        } catch (error) {
            console.error("❌ Error in image processing:", error);
        }
    }

    // console.log("✅ Queue processing completed.");
    isProcessing = false;

    if (imageQueue.length > 0) {
        // console.log("🔁 Queue has remaining tasks, restarting...");
        processQueue();
    }
};

// Function to process a single image
const processImage = async (imageId, inputUrl, requestId, webhookUrl) => {
    try {
        // console.log(`🔄 Processing Image: ${inputUrl}`);
        const imageRecord = await Image.findByPk(imageId);
        if (!imageRecord) throw new Error("Image record not found.");

        const product = await Product.findByPk(imageRecord.productId);
        if (!product) throw new Error("Product not found for image.");

        const imageBuffer = await downloadImage(inputUrl);

    
        const compressedImageBuffer = await sharp(imageBuffer)
        .jpeg({ quality: 50 })
        .resize({ width: 800 }) // ✅ Reduce resolution
        .toBuffer();

        // console.log("✅ Image processed successfully.");
        const cloudinaryUrl = await uploadImageToCloudinary(compressedImageBuffer);

        await imageRecord.update({ outputUrl: cloudinaryUrl, status: "completed" });

        await checkAndUpdateRequestStatus(requestId, webhookUrl);
    } catch (error) {
        console.error(`❌ Error processing image (${inputUrl}):`, error.message);
        await Image.update({ status: "failed" }, { where: { id: imageId } });
    }
};

// Function to check request status
const checkAndUpdateRequestStatus = async (requestId, webhookUrl) => {
    try {
        const products = await Product.findAll({ where: { requestId } });
        if (!products.length) return console.log(`❌ No products found for Request ${requestId}`);

        const productIds = products.map((product) => product.id);
        const pendingImages = await Image.count({ where: { productId: productIds, status: "pending" } });

        if (pendingImages === 0) {
            
            await Request.update({ status: "completed" }, { where: { id: requestId } });

            const csvFilePath = await generateCSV(requestId);
            if (webhookUrl) {
                await notifyWebhook(webhookUrl, requestId, csvFilePath);
            }
        } else {
            // console.log(`🔄 Request ${requestId}: Remaining Pending Images = ${pendingImages}`);
        }
    } catch (error) {
        console.error("❌ Error updating request status:", error.message);
    }
};

// Function to add an image processing job to the queue
const addToQueue = (imageId, inputUrl, requestId, webhookUrl) => {
    imageQueue.push({ imageId, inputUrl, requestId, webhookUrl });
    // console.log(`🟢 Added image to queue: ${inputUrl} (Queue Length: ${imageQueue.length})`);
    processQueue();
};



module.exports = { addToQueue, processImage };
