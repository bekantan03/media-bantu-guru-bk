// Vercel Serverless Function - Proxy aman ke Google Apps Script
// Token API disimpan di Environment Variable Vercel (SHEETS_API_TOKEN & SHEETS_WEB_APP_URL),
// TIDAK PERNAH dikirim ke browser. Frontend cukup panggil /api/sheets-proxy
// tanpa tahu token maupun URL Apps Script sama sekali.

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method tidak diizinkan' });
  }

  const APPS_SCRIPT_URL = process.env.SHEETS_WEB_APP_URL;
  const API_TOKEN = process.env.SHEETS_API_TOKEN;

  if (!APPS_SCRIPT_URL || !API_TOKEN) {
    return res.status(500).json({
      status: 'error',
      message: 'Konfigurasi server belum lengkap (SHEETS_WEB_APP_URL / SHEETS_API_TOKEN belum di-set di Vercel).',
    });
  }

  try {
    if (req.method === 'GET') {
      const url = `${APPS_SCRIPT_URL}?token=${encodeURIComponent(API_TOKEN)}`;
      const upstream = await fetch(url, { method: 'GET' });
      const data = await upstream.json();
      return res.status(200).json(data);
    }

    // POST: frontend mengirim Content-Type "text/plain", jadi Vercel TIDAK
    // otomatis parse req.body jadi object -- di sini req.body bisa berupa
    // string mentah atau Buffer. Kita parse manual dulu sebelum disisipi token.
    let parsedBody = {};
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      // Sudah ke-parse otomatis oleh Vercel (mis. Content-Type application/json)
      parsedBody = req.body;
    } else {
      // Masih string/Buffer mentah -> parse manual
      const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf-8') : req.body;
      try {
        parsedBody = raw ? JSON.parse(raw) : {};
      } catch {
        parsedBody = {};
      }
    }

    const body = { ...parsedBody, token: API_TOKEN };

    const upstream = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Gagal menghubungi Apps Script: ' + String(err) });
  }
}
