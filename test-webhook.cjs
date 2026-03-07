const crypto = require('crypto');

const secret = "MonSuperSecretPrezta2026";
const body = '{"test":"data"}';

const signature = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex');
console.log("Calculated Signature:", signature);
