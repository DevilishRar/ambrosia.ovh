var ENCODED_BOT_TOKEN = 'TVRVek9UY3dNVFF6TlRJek56WTJNamd6TUEuR1pzd1I4LmE0cms4NHJvM2hmSjdFREYwMEltM18tVlh0MWlOVURQSndYdmV3';
var GUILD_ID = process.env.DISCORD_GUILD_ID;
var logic = require('./checkout-logic.js');

function getBotToken() {
  try { return Buffer.from(ENCODED_BOT_TOKEN, 'base64').toString('utf8'); } catch { return ''; }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var body = req.body || {};
  var discordUserId = body.discordUserId;
  var product = body.product;
  var duration = body.duration;
  var sellerName = body.sellerName || 'Devil';
  var preview = body.preview === true;

  if (!discordUserId || !/^\d{17,19}$/.test(discordUserId)) {
    return res.status(400).json({ error: 'Invalid Discord User ID. Must be 17-19 numeric digits.' });
  }

  if (!logic.PRODUCTS[product]) {
    return res.status(400).json({ error: 'Invalid product. Must be one of: ow-lite, ow-pro, fn, cs2-web' });
  }

  if (!['weekly', 'monthly', 'yearly'].includes(duration)) {
    return res.status(400).json({ error: 'Invalid duration. Must be weekly, monthly, or yearly.' });
  }

  var BOT_TOKEN = getBotToken();
  if (!BOT_TOKEN) return res.status(500).json({ error: 'Bot token not configured' });
  if (!GUILD_ID) return res.status(500).json({ error: 'DISCORD_GUILD_ID not set' });

  if (!preview) {
    try {
      var memberRes = await fetch('https://discord.com/api/v10/guilds/' + GUILD_ID + '/members/' + discordUserId, {
        headers: { Authorization: 'Bot ' + BOT_TOKEN }
      });
      if (!memberRes.ok) {
        return res.status(403).json({
          error: 'not_member',
          message: 'You must join our Discord server first before purchasing.'
        });
      }
    } catch (e) {
      console.error('[Checkout] Membership check failed:', e);
      return res.status(500).json({ error: 'Failed to verify Discord membership' });
    }
  }

  var result;
  try {
    result = await logic.generateAddress(product, duration);
  } catch (e) {
    console.error('[Checkout] Address generation failed:', e);
    return res.status(500).json({ error: 'Failed to generate payment address: ' + e.message });
  }

  return res.status(200).json({
    success: true,
    address: result.address,
    priceUsd: result.priceUsd,
    priceXmr: result.priceXmr,
    product: result.product,
    game: result.game,
    duration: result.duration,
    ticketRef: result.ticketRef,
    subaddressIndex: result.subaddressIndex,
    sellerName: sellerName,
    xmrRateUsd: result.xmrRateUsd
  });
};
