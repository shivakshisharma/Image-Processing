const fs = require('fs');
const csv = require('csv-parser');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../config/database');
const Request = require('../models/Request');
const Product = require('../models/Product');
const Image = require('../models/Image');

async function processCSV(filePath) {
    return new Promise((resolve, reject) => {
        const requestId = uuidv4();
        
        // Insert Request ID into database
        Request.create({ id: requestId, status: 'pending' })
            .then(() => {
                const products = [];

                fs.createReadStream(filePath)
                    .pipe(csv())
                    .on('data', (row) => {
                        const productId = uuidv4();
                        products.push({
                            id: productId,
                            requestId,
                            name: row['Product Name'],
                        });

                        // Insert images for each product
                        const imageUrls = row['Input Image Urls'].split(',');
                        imageUrls.forEach(url => {
                            Image.create({
                                id: uuidv4(),
                                productId,
                                inputUrl: url.trim(),
                                status: 'pending'
                            });
                        });
                    })
                    .on('end', async () => {
                        // Insert products into database
                        await Product.bulkCreate(products);
                        resolve(requestId);
                    })
                    .on('error', reject);
            })
            .catch(reject);
    });
}

module.exports = { processCSV };
