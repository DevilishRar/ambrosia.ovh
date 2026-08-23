const ENCODED_BOT_TOKEN = 'TVRVek9UY3dNVFF6TlRJek56WTJNamd6TUEuR1pzd1I4LmE0cms4NHJvM2hmSjdFREYwMEltM18tVlh0MWlOVURQSndYdmV3';
const CATALOG_CHANNEL_ID = process.env.DISCORD_PRODUCT_CATALOG_CHANNEL_ID || '1540131361417859132';
const TICKET_CHANNEL_ID = process.env.DISCORD_TICKET_PANEL_CHANNEL_ID || '1540131367151734784';
const SECRET = 'ambrosia-update-pricing-2026';

function getBotToken() {
  try { return Buffer.from(ENCODED_BOT_TOKEN, 'base64').toString('utf-8'); } catch { return ''; }
}

async function deleteBotMessages(token, channelId) {
  var msgsRes = await fetch('https://discord.com/api/v10/channels/' + channelId + '/messages?limit=20', {
    headers: { Authorization: 'Bot ' + token }
  });
  if (!msgsRes.ok) return 0;
  var msgs = await msgsRes.json();
  var deleted = 0;
  for (var i = 0; i < msgs.length; i++) {
    if (msgs[i].author && msgs[i].author.bot) {
      await fetch('https://discord.com/api/v10/channels/' + channelId + '/messages/' + msgs[i].id, {
        method: 'DELETE',
        headers: { Authorization: 'Bot ' + token }
      });
      deleted++;
    }
  }
  return deleted;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var BT = getBotToken();
  if (!BT) return res.status(500).json({ error: 'No bot token' });
  if (!req.body || req.body.secret !== SECRET) return res.status(403).json({ error: 'Bad secret' });

  var log = [];

  try {
    var d1 = await deleteBotMessages(BT, CATALOG_CHANNEL_ID);
    log.push('Deleted ' + d1 + ' messages from catalog');

    var catalogEmbeds = [
      { title: '\uD83D\uDED2 Product Catalog', color: 0x2563eb, description: 'All Ambrosia products. Visit the website or open a ticket.', image: { url: 'https://ambrosia.ovh/og-image.png' }, footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' }, timestamp: new Date().toISOString() },
      { title: 'OW Lite', color: 0x5865f2, fields: [{ name: 'Game', value: 'Overwatch 2', inline: true }, { name: 'Price', value: '$5/wk, $10/mo, $100/yr', inline: true }, { name: 'Features', value: 'Aimbot, Triggerbot, Flickbot, Streamproof, 10 Configs', inline: false }] },
      { title: 'OW Pro', color: 0xf59e0b, fields: [{ name: 'Game', value: 'Overwatch 2', inline: true }, { name: 'Price', value: '$20/wk, $45/mo, $450/yr', inline: true }, { name: 'Features', value: 'Hero Scripting, Ult HUD, Dual Slots, Streamproof', inline: false }] },
      { title: 'CS2 Web Radar', color: 0x10b981, fields: [{ name: 'Game', value: 'Counter-Strike 2', inline: true }, { name: 'Price', value: '$5/wk, $15/mo, $150/yr', inline: true }, { name: 'Features', value: 'Triggerbot, RCS, Interactive 2D Tactical Radar', inline: false }] },
      { title: 'Ambrosia FN', color: 0xed4245, fields: [{ name: 'Game', value: 'Fortnite', inline: true }, { name: 'Price', value: '$20/wk, $45/mo, $450/yr', inline: true }, { name: 'Features', value: 'Aimbot, Box/Skeleton ESP, Loot ESP, On Screen Radar, 10 Configs', inline: false }] }
    ];

    var catRes = await fetch('https://discord.com/api/v10/channels/' + CATALOG_CHANNEL_ID + '/messages', {
      method: 'POST',
      headers: { Authorization: 'Bot ' + BT, 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: catalogEmbeds })
    });
    log.push('Catalog embed: ' + (catRes.ok ? 'OK' : 'FAIL'));

    var d2 = await deleteBotMessages(BT, TICKET_CHANNEL_ID);
    log.push('Deleted ' + d2 + ' messages from ticket panel');

    var panelEmbed = {
      title: 'Open a Support Ticket',
      description: 'Select a product below to open a private ticket.\nYou must be a member of this server.',
      color: 0x2563eb,
      thumbnail: { url: 'https://ambrosia.ovh/favicon.ico' },
      image: { url: 'https://ambrosia.ovh/og-image.png' },
      timestamp: new Date().toISOString()
    };

    var panelDropdown = {
      type: 1,
      components: [{
        type: 3, custom_id: 'select_ticket_product',
        placeholder: 'Select a product...',
        min_values: 1, max_values: 1,
        options: [
          { label: 'Ambrosia OW Lite', description: 'Overwatch 2 | $5/wk | $10/mo | $100/yr', value: 'ambrosia-ow-lite', emoji: { name: '\uD83C\uDFAF' } },
          { label: 'Ambrosia OW Pro', description: 'Overwatch 2 | $20/wk | $45/mo | $450/yr', value: 'ambrosia-ow-pro', emoji: { name: '\u26A1' } },
          { label: 'CS2 Web Radar', description: 'Counter-Strike 2 | $5/wk | $15/mo | $150/yr', value: 'ambrosia-cs2-web', emoji: { name: '\uD83D\uDCE1' } },
          { label: 'Ambrosia FN', description: 'Fortnite | $20/wk | $45/mo | $450/yr', value: 'ambrosia-fn', emoji: { name: '\uD83C\uDF96\uFE0F' } },
          { label: 'General Support', description: 'Questions or anything else', value: 'general-support', emoji: { name: '\uD83D\uDCAC' } }
        ]
      }]
    };

    var panRes = await fetch('https://discord.com/api/v10/channels/' + TICKET_CHANNEL_ID + '/messages', {
      method: 'POST',
      headers: { Authorization: 'Bot ' + BT, 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [panelEmbed], components: [panelDropdown] })
    });
    log.push('Ticket panel: ' + (panRes.ok ? 'OK' : 'FAIL'));

    return res.status(200).json({ success: true, log: log });

  } catch (e) {
    return res.status(500).json({ error: e.message, log: log });
  }
};
