
const fs = require('fs');
const Product = require('../models/Product');
const Image = require('../models/Image');
const { uploadCsvToCloudinary } = require('./cloudinaryService');  // Import existing Cloudinary config

const generateCSV = async (requestId) => {
    try {
        // Fetching products and their associated images for the given requestId
        const products = await Product.findAll({
            where: { requestId },
            include: {
                model: Image,
                where: { status: 'completed' },
                attributes: ['inputUrl', 'outputUrl']
            }
            
        });

        if (!products.length) {
            throw new Error(`No products found for request ID ${requestId}`);
        }

        // Preparing the ouput CSV content with header
        let csvContent = 'S. No.,Product Name,Input Image URLs,Output Image URLs\n';

        // Adding product and image data to the CSV
        let srNo = 1;  // Start from 1 for Sr. No.
        for (const product of products) {
            // Extract input and output URLs
            const inputUrls = product.Images.map(image => image.inputUrl).join(',');
            const outputUrls = product.Images.map(image => image.outputUrl).join(',');

            // Appending to the CSV content
            const row = `${srNo},${product.name},${inputUrls},${outputUrls}\n`;
            csvContent += row;
            srNo++;  // Increment Sr. No.
        }

        // Saving CSV to a file
        const filePath = `./uploads/processed_images_${requestId}.csv`;
        fs.writeFileSync(filePath, csvContent);

        console.log(`✅ CSV generated successfully: ${filePath}`);

           
        const cloudinaryResult = await uploadCsvToCloudinary(filePath);

        console.log(`✅ CSV uploaded to Cloudinary: ${cloudinaryResult.secure_url}`);

        return cloudinaryResult.secure_url;


    } catch (error) {
        console.error(`❌ Error generating CSV: ${error.message}`);
        throw error;
    }
};

module.exports = generateCSV;
