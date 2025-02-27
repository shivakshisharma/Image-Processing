// services/webhook.js
const axios = require('axios');  
const fs = require('fs');
const FormData = require('form-data');  

const notifyWebhook = async (webhookUrl, requestId, csvFilePath) => {
    try {
        const form = new FormData();
        form.append('requestId', requestId);
        form.append('csvFile', fs.createReadStream(csvFilePath));  

        const response = await axios.post(webhookUrl, form, {
            headers: {
                ...form.getHeaders()  // Including headers required for form-data
            }
        });

        console.log(`✅ Webhook notified with CSV for requestId: ${requestId}`);
        console.log(`Response from webhook: ${response.status} ${response.statusText}`);
    } catch (error) {
        console.error('❌ Error notifying webhook:', error);
    }
};

module.exports = notifyWebhook;
