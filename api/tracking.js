var tracking = require('./tracking-store.js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  var authHeader = req.headers.authorization;
  var secret = req.query.secret;
  if (secret !== 'ambrosia-tracking-2026' && (!authHeader || authHeader !== 'Bearer ambrosia-tracking-2026')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  var active = tracking.getActiveTracking();
  var count = Object.keys(active).length;

  var summary = {};
  for (var addr in active) {
    var entry = active[addr];
    summary[addr.substring(0, 20) + '...' + addr.substring(addr.length - 8)] = {
      userId: entry.userId,
      ticketRef: entry.ticketRef,
      product: entry.product,
      duration: entry.duration,
      priceUsd: entry.priceUsd,
      priceXmr: entry.priceXmr,
      channelId: entry.channelId,
      createdAt: entry.createdAt
    };
  }

  return res.status(200).json({
    activeCount: count,
    totalTracked: Object.keys(tracking.trackedAddresses).length,
    activeAddresses: summary
  });
};
