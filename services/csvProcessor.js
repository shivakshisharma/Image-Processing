// const fs = require('fs');
// const csv = require('csv-parser');
// const { v4: uuidv4 } = require('uuid'); 
// const { imageQueue } = require('../workers/imageWorker');
// const Request = require('../models/Request');
// const Product = require('../models/Product');
// const Image = require('../models/Image');

// async function processCSV(filePath) {
//     return new Promise((resolve, reject) => {
//         const requestId = uuidv4(); 

//         Request.create({ id: requestId, status: 'pending' })
//             .then(async () => {
//                 fs.createReadStream(filePath)
//                     .pipe(csv())
//                     .on('data', async (row) => {
//                         console.log(`🔄 Processing row:`, row);

//                         const productId = uuidv4();
//                         const product = await Product.create({
//                             id: productId,
//                             requestId,
//                             name: row['Product Name']
//                         });

//                         if (!row['Input Image Urls']) return;
//                         const imageUrls = row['Input Image Urls'].split(',');

//                         for (const url of imageUrls) {
//                             const imageId = uuidv4();
//                             await Image.create({
//                                 id: imageId,
//                                 productId,
//                                 inputUrl: url.trim(),
//                                 status: 'pending'
//                             });

//                             // Adding image to the processing queue
//                             await imageQueue.add('processImage', { imageId, inputUrl: url.trim() });
//                             console.log(`🟢 Added image to queue: ${url.trim()}`);
//                         }
//                     })
//                     .on('end', () => resolve(requestId))
//                     .on('error', reject);
//             })
//             .catch(reject);
//     });
// }

// module.exports = { processCSV }; 
const fs = require("fs");
const csv = require("csv-parser");
const { v4: uuidv4 } = require("uuid");
const Request = require("../models/Request");
const Product = require("../models/Product");
const Image = require("../models/Image");
const { addToQueue } = require("../workers/imageWorker");

async function processCSV(filePath) {
    return new Promise((resolve, reject) => {
        const requestId = uuidv4();

        Request.create({ id: requestId, status: "pending" })
            .then(() => {
                const imagePromises = [];
                // console.log(`📥 Processing CSV: ${filePath}`);

                fs.createReadStream(filePath)
                    .pipe(csv())
                    .on("data", (row) => {
                        // console.log(`🔄 Processing row:`, row);
                        if (!row["Product Name"] || !row["Input Image Urls"]) return;

                        const productId = uuidv4();
                        const imageUrls = row["Input Image Urls"].split(",").map((url) => url.trim());

                        Product.create({ id: productId, requestId, name: row["Product Name"] })
                            .then(() => {
                                for (const url of imageUrls) {
                                    const imageId = uuidv4();
                                    Image.create({
                                        id: imageId,
                                        productId,
                                        inputUrl: url,
                                        status: "pending",
                                    }).then(() => {
                                        // console.log(`🟢 Image queued for processing: ${url}`);
                                        addToQueue(imageId, url, requestId);
                                    });
                                }
                            })
                            .catch((error) => console.error("❌ Error creating product:", error.message));
                    })
                    .on("end", () => {
                        // console.log("📌 All images queued. Ensuring processing starts...");
                        resolve(requestId);
                    })
                    .on("error", (error) => reject(error));
            })
            .catch(reject);
    });
}

module.exports = { processCSV };
