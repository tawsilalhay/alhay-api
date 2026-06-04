export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://alhay.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, message, url, playerId } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'title and message required' });
  }

  try {
    const body = {
      app_id: '7ee1b5de-9b52-4026-a5e7-4b1e7087d787',
      headings: { ar: title, en: title },
      contents: { ar: message, en: message },
      url: url || 'https://alhay.app',
      ttl: 3600
    };

    // إرسال للعميل المحدد أو للجميع
    if (playerId) {
      body.include_player_ids = [playerId];
    } else {
      body.included_segments = ['All'];
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.ONESIGNAL_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send notification' });
  }
}
