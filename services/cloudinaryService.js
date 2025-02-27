const cloudinary = require('../config/cloudinaryConfig');
const streamifier = require("streamifier");
// Upload image to Cloudinary
// const uploadImageToCloudinary = async (imagePath) => {
//     try {
//         const result = await cloudinary.uploader.upload(imagePath, {
//             folder: 'image_processing',  
//             quality: 'auto:good'         
//         });

//         console.log(`✅ Image uploaded to Cloudinary: ${result.secure_url}`);
//         return result.secure_url;  // Cloudinary URL of the uploaded image
//     } catch (error) {
//         console.error('❌ Error uploading image to Cloudinary:', error);
//         throw error;
//     }
// };
const uploadImageToCloudinary = async (imageBuffer) => {
  return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
          { resource_type: "image" },
          (error, result) => {
              if (error) {
                  console.error("❌ Cloudinary upload failed:", error);
                  return reject(error);
              }
              resolve(result.secure_url);
          }
      );

      streamifier.createReadStream(imageBuffer).pipe(stream);
  });
};

// Function to upload CSV to Cloudinary

const uploadCsvToCloudinary = (filePath) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(filePath, { resource_type: 'raw' }, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  };

module.exports = { uploadImageToCloudinary, uploadCsvToCloudinary };
