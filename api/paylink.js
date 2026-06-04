export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://alhay.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { amount, orderNumber, customerName, customerPhone } = req.body;

  if (!amount || !orderNumber) {
    return res.status(400).json({ error: 'amount and orderNumber required' });
  }

  try {
    // الحصول على token
    const authRes = await fetch('https://restpaylink.com/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiId: process.env.PAYLINK_API_ID,
        secretKey: process.env.PAYLINK_SECRET_KEY,
        persistToken: false
      })
    });

    const authText = await authRes.text();
    console.log('Auth response:', authText);
    
    let authData;
    try { authData = JSON.parse(authText); } 
    catch(e) { return res.status(500).json({ error: 'Auth parse error', raw: authText }); }
    
    if (!authData.id_token) {
      return res.status(500).json({ error: 'No token', details: authData });
    }

    // إنشاء الفاتورة
    const invoiceRes = await fetch('https://restpaylink.com/api/addInvoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.id_token}`
      },
      body: JSON.stringify({
        amount: parseFloat(amount),
        currency: 'SAR',
        orderNumber: orderNumber,
        callBackUrl: 'https://alhay.app',
        cancelUrl: 'https://alhay.app',
        clientName: customerName || 'عميل',
        clientMobile: customerPhone || '0500000000',
        clientEmail: 'customer@alhay.app',
        products: [{ title: 'طلب توصيل الحي', price: parseFloat(amount), qty: 1 }],
        supportedCardBrands: ['mada', 'visaMastercard', 'applePay'],
        displayPending: true
      })
    });

    const invoiceText = await invoiceRes.text();
    console.log('Invoice response:', invoiceText);
    
    let invoiceData;
    try { invoiceData = JSON.parse(invoiceText); }
    catch(e) { return res.status(500).json({ error: 'Invoice parse error', raw: invoiceText }); }

    if (invoiceData.url) {
      return res.status(200).json({ url: invoiceData.url });
    } else {
      return res.status(500).json({ error: 'No URL', details: invoiceData });
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
