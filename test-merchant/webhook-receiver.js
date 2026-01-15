const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const WEBHOOK_SECRET = 'whsec_test_abc123';

app.post('/webhook', (req, res) => {
    const signature = req.headers['x-webhook-signature'];
    const payload = JSON.stringify(req.body);

    console.log('\n📨 Webhook received:');
    console.log('Event:', req.body.event);
    console.log('Timestamp:', new Date(req.body.timestamp * 1000).toISOString());

    // Verify signature
    const expectedSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

    if (signature !== expectedSignature) {
        console.log('❌ Invalid signature');
        console.log('Expected:', expectedSignature);
        console.log('Received:', signature);
        return res.status(401).send('Invalid signature');
    }

    console.log('✅ Webhook verified');
    console.log('Data:', JSON.stringify(req.body.data, null, 2));

    res.status(200).send('OK');
});

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`🚀 Test merchant webhook receiver running on port ${PORT}`);
    console.log(`📍 Webhook URL: http://localhost:${PORT}/webhook`);
    console.log(`🔑 Webhook Secret: ${WEBHOOK_SECRET}`);
    console.log('\nWaiting for webhooks...\n');
});
