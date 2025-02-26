const express = require('express');
const Request = require('../models/Request');
const Product = require('../models/Product');
const Image = require('../models/Image');

const router = express.Router();

router.get('/status/:requestId', async (req, res) => {
    const { requestId } = req.params;

    try {
        const request = await Request.findByPk(requestId);
        if (!request) return res.status(404).json({ error: 'Request ID not found' });

        const products = await Product.findAll({ where: { requestId } });
        const productIds = products.map(p => p.id);
        const images = await Image.findAll({ where: { productId: productIds } });

        res.json({
            requestId,
            status: request.status,
            products: products.map(product => ({
                name: product.name,
                images: images.filter(img => img.productId === product.id).map(img => ({
                    inputUrl: img.inputUrl,
                    outputUrl: img.outputUrl,
                    status: img.status
                }))
            }))
        });

    } catch (error) {
        console.error('❌ Error fetching status:', error);
        res.status(500).json({ error: 'Error fetching status' });
    }
});

module.exports = router;
