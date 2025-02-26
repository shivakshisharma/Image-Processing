const fs = require('fs');
const csv = require('csv-parser');
const { v4: uuidv4 } = require('uuid'); // ✅ FIX: Import uuidv4
const { imageQueue } = require('../workers/imageWorker');
const Request = require('../models/Request');
const Product = require('../models/Product');
const Image = require('../models/Image');

async function processCSV(filePath) {
    return new Promise((resolve, reject) => {
        const requestId = uuidv4(); // ✅ Now uuidv4() is defined

        Request.create({ id: requestId, status: 'pending' })
            .then(async () => {
                fs.createReadStream(filePath)
                    .pipe(csv())
                    .on('data', async (row) => {
                        console.log(`🔄 Processing row:`, row);

                        const productId = uuidv4();
                        const product = await Product.create({
                            id: productId,
                            requestId,
                            name: row['Product Name']
                        });

                        if (!row['Input Image Urls']) return;
                        const imageUrls = row['Input Image Urls'].split(',');

                        for (const url of imageUrls) {
                            const imageId = uuidv4();
                            await Image.create({
                                id: imageId,
                                productId,
                                inputUrl: url.trim(),
                                status: 'pending'
                            });

                            // Add image to the processing queue
                            await imageQueue.add('processImage', { imageId, inputUrl: url.trim() });
                            console.log(`🟢 Added image to queue: ${url.trim()}`);
                        }
                    })
                    .on('end', () => resolve(requestId))
                    .on('error', reject);
            })
            .catch(reject);
    });
}

module.exports = { processCSV }; // ✅ Ensure function is exported
