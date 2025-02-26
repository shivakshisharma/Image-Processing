const cloudinary = require('../config/cloudinaryConfig');

// Upload image to Cloudinary
const uploadImageToCloudinary = async (imagePath) => {
    try {
        const result = await cloudinary.uploader.upload(imagePath, {
            folder: 'image_processing',  // Customize the folder name as needed
            quality: 'auto:good'         // Optional: Apply automatic quality optimization
        });

        console.log(`✅ Image uploaded to Cloudinary: ${result.secure_url}`);
        return result.secure_url;  // Cloudinary URL of the uploaded image
    } catch (error) {
        console.error('❌ Error uploading image to Cloudinary:', error);
        throw error;
    }
};



module.exports = { uploadImageToCloudinary };
