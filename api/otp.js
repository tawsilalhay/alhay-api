export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, phone, otp } = req.body || {};
  if (!phone) return res.status(400).json({ error: 'phone required' });

  // تنسيق الرقم
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('0')) p = '966' + p.slice(1);
  if (!p.startsWith('966')) p = '966' + p;

  const KEY = process.env.AUTHENTICA_API_KEY;

  if (action === 'send') {
    try {
      const r = await fetch('https://api.authentica.sa/api/sdk/v1/sendOTP', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KEY}`
        },
        body: JSON.stringify({
          phone: p,
          method: 'whatsapp',
          number_of_digits: 4,
          otp_format: 'numeric'
        })
      });
      const data = await r.json();
      if (r.ok) return res.status(200).json({ success: true });
      return res.status(400).json({ error: data.message || JSON.stringify(data) });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (action === 'verify') {
    if (!otp) return res.status(400).json({ error: 'otp required' });
    try {
      const r = await fetch('https://api.authentica.sa/api/sdk/v1/verifyOTP', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KEY}`
        },
        body: JSON.stringify({ phone: p, otp: String(otp) })
      });
      const data = await r.json();
      if (r.ok && (data.valid || data.success || data.status === 'verified')) {
        return res.status(200).json({ success: true });
      }
      return res.status(400).json({ error: 'رمز غير صحيح', raw: data });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(400).json({ error: 'Invalid action' });
}
