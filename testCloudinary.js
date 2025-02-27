const cloudinary = require('./config/cloudinaryConfig');

async function testUpload() {
    try {
        const imagePath = '/home/shivakshi/Desktop/test.jpeg'; 

        const result = await cloudinary.uploader.upload(imagePath, {
            folder: 'test_uploads' 
        });

        console.log('✅ Image uploaded successfully:');
        console.log('URL:', result.secure_url);
    } catch (error) {
        console.error('❌ Cloudinary upload error:', error);
    }
}

testUpload();
