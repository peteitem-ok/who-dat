import tls from 'tls';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const domain = req.query.domain;
  if (!domain) return res.status(400).json({ error: 'domain required' });

  try {
    const cert = await new Promise((resolve, reject) => {
      const socket = tls.connect(443, domain, { servername: domain }, () => {
        const c = socket.getPeerCertificate();
        socket.destroy();
        resolve(c);
      });
      socket.setTimeout(8000);
      socket.on('timeout', () => reject(new Error('timeout')));
      socket.on('error', reject);
    });

    const expiry = cert.valid_to;
    const days = Math.ceil((new Date(expiry) - new Date()) / 86400000);

    res.status(200).json({
      domain,
      valid_to: expiry,
      days_left: days,
      issuer: cert.issuer?.O || ''
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
