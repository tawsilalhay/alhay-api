const https = require('https');

export default async function handler(req, res) {
  // Allow CORS from alhay.app
  res.setHeader('Access-Control-Allow-Origin', 'https://alhay.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { validationURL } = req.body;

  if (!validationURL) {
    return res.status(400).json({ error: 'validationURL is required' });
  }

  // Validate that the URL is from Apple
  if (!validationURL.includes('apple.com')) {
    return res.status(400).json({ error: 'Invalid validation URL' });
  }

  try {
    // Call Apple's validation endpoint
    const response = await fetch(validationURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantIdentifier: process.env.APPLE_MERCHANT_ID || 'merchant.app.alhay',
        domainName: 'alhay.app',
        displayName: 'الحي'
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Apple Pay validation error:', error);
    return res.status(500).json({ error: 'Validation failed' });
  }
}
