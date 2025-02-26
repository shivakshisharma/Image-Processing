// const { createObjectCsvWriter } = require('csv-writer');
// const Product = require('../models/Product'); // ✅ Make sure Product is imported here
// const Image = require('../models/Image');
// const Request = require('../models/Request');
// const path = require('path');

// async function generateCSV(requestId) {
//     try {
//         // Fetch all the products for the request
//         const products = await Product.findAll({
//             where: { requestId },
//         });

//         // Fetch images for these products manually with a join
//         const images = await Image.findAll({
//             where: {
//                 productId: products.map(product => product.id), // Get the product IDs
//             }
//         });

//         const csvWriter = createObjectCsvWriter({
//             path: path.join(__dirname, `../uploads/processed_${requestId}.csv`),
//             header: [
//                 { id: 'productName', title: 'Product Name' },
//                 { id: 'inputUrl', title: 'Input Image URL' },
//                 { id: 'outputUrl', title: 'Output Image URL' },
//                 { id: 'status', title: 'Status' }
//             ]
//         });

//         // Create an array to hold the CSV data
//         const records = [];
//         products.forEach(product => {
//             // Get the images for this product
//             const productImages = images.filter(img => img.productId === product.id);
//             productImages.forEach(image => {
//                 records.push({
//                     productName: product.name,
//                     inputUrl: image.inputUrl,
//                     outputUrl: image.outputUrl,
//                     status: image.status
//                 });
//             });
//         });

//         // Write to CSV
//         await csvWriter.writeRecords(records);
//         console.log(`✅ CSV file generated for request ${requestId}`);

//         return path.join(__dirname, `../uploads/processed_${requestId}.csv`);
//     } catch (error) {
//         console.error('❌ Error generating CSV:', error);
//         throw error;
//     }
// }

// module.exports = generateCSV;

const fs = require('fs');
const Product = require('../models/Product');
const Image = require('../models/Image');

const generateCSV = async (requestId) => {
    try {
        // Fetch products and their associated images for the given requestId
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

        // Prepare CSV content with header
        let csvContent = 'S. No.,Product Name,Input Image URLs,Output Image URLs\n';

        // Add product and image data to the CSV
        let srNo = 1;  // Start from 1 for Sr. No.
        for (const product of products) {
            // Extract input and output URLs
            const inputUrls = product.Images.map(image => image.inputUrl).join(',');
            const outputUrls = product.Images.map(image => image.outputUrl).join(',');

            // Append to the CSV content
            const row = `${srNo},${product.name},${inputUrls},${outputUrls}\n`;
            csvContent += row;
            srNo++;  // Increment Sr. No.
        }

        // Save CSV to a file
        const filePath = `./uploads/processed_images_${requestId}.csv`;
        fs.writeFileSync(filePath, csvContent);

        console.log(`✅ CSV generated successfully: ${filePath}`);
        return filePath;

    } catch (error) {
        console.error(`❌ Error generating CSV: ${error.message}`);
        throw error;
    }
};

module.exports = generateCSV;
