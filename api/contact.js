const limits = {name: 120, email: 254, phone: 100, service: 40, message: 2500};
const services = new Set(['', 'marketing', 'ai-marketing', 'branding', 'it-solutions', 'other']);

export default async function contact(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ok: false});
  }
  const origins = new Set(['https://nomu.uz', 'https://www.nomu.uz']);
  if (process.env.VERCEL_URL) origins.add(`https://${process.env.VERCEL_URL}`);
  if (req.headers.origin && !origins.has(req.headers.origin)) return res.status(403).json({ok: false});
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return res.status(415).json({ok: false});
  if (Number(req.headers['content-length']) > 16000) return res.status(413).json({ok: false});
  let body = req.body;
  try { if (typeof body === 'string') body = JSON.parse(body); } catch { return res.status(400).json({ok: false}); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).json({ok: false});
  const data = {};
  for (const [key, max] of Object.entries(limits)) {
    if (body[key] !== undefined && typeof body[key] !== 'string') return res.status(400).json({ok: false});
    data[key] = (body[key] || '').trim();
    if (data[key].length > max) return res.status(400).json({ok: false});
  }
  if (!data.name || !data.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || !services.has(data.service)) return res.status(400).json({ok: false});
  const token = process.env.TELEGRAM_BOT_TOKEN, chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return res.status(503).json({ok: false});
  const text = ['NOMU — New Lead', `Name: ${data.name}`, `Email: ${data.email}`, `Phone: ${data.phone || '—'}`, `Service: ${data.service || '—'}`, 'Message:', data.message].join('\n');
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({chat_id: chatId, text}), signal: AbortSignal.timeout(10000)
    });
    const result = await response.json();
    if (!response.ok || !result.ok) return res.status(502).json({ok: false});
    return res.status(200).json({ok: true});
  } catch { return res.status(502).json({ok: false}); }
}
