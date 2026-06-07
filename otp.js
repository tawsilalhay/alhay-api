export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://alhay.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, phone, otp } = req.body;

  if (!phone) return res.status(400).json({ error: 'phone required' });

  // تنسيق الرقم
  let formattedPhone = phone.replace(/\D/g, '');
  if (formattedPhone.startsWith('0')) formattedPhone = '966' + formattedPhone.slice(1);
  if (!formattedPhone.startsWith('966')) formattedPhone = '966' + formattedPhone;

  // إرسال OTP
  if (action === 'send') {
    try {
      const response = await fetch('https://api.authentica.sa/api/sdk/v1/sendOTP', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AUTHENTICA_API_KEY}`
        },
        body: JSON.stringify({
          phone: formattedPhone,
          method: 'whatsapp',
          number_of_digits: 4,
          otp_format: 'numeric'
        })
      });

      const data = await response.json();
      if (response.ok) {
        return res.status(200).json({ success: true, ref: data.ref || data.id || null });
      } else {
        return res.status(400).json({ error: data.message || 'Failed to send OTP' });
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // التحقق من OTP
  if (action === 'verify') {
    if (!otp) return res.status(400).json({ error: 'otp required' });
    try {
      const response = await fetch('https://api.authentica.sa/api/sdk/v1/verifyOTP', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AUTHENTICA_API_KEY}`
        },
        body: JSON.stringify({
          phone: formattedPhone,
          otp: otp
        })
      });

      const data = await response.json();
      if (response.ok && data.valid) {
        return res.status(200).json({ success: true });
      } else {
        return res.status(400).json({ error: 'رمز غير صحيح' });
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(400).json({ error: 'Invalid action' });
}
