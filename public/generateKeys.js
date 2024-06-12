const crypto = require('crypto');

const secretKey = crypto.randomBytes(32).toString('hex');
console.log('Generated SECRET_KEY:', secretKey);

const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('Generated SESSION_SECRET:', sessionSecret);
