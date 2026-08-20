const ENCODED_BOT_TOKEN = 'TVRVek9UY3dNVFF6TlRJek56WTJNamd6TUEuR1pzd1I4LmE0cms4NHJvM2hmSjdFREYwMEltM18tVlh0MWlOVURQSndYdmV3';
const TICKET_PANEL_CHANNEL_ID = '1539954048722010193';
const GUILD_ID = '1539404742055166045';
const TICKET_CATEGORY_ID = '1539707872416636939';
const STAFF_ROLE_ID = '1539709640240005220';

function getBotToken() {
  try { return atob(ENCODED_BOT_TOKEN); } catch { return ''; }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const BOT_TOKEN = getBotToken();
  if (!BOT_TOKEN) return res.status(500).json({ error: 'Bot token not configured' });

  const { secret } = req.body || {};
  if (secret !== 'ambrosia-send-panel-2026') {
    return res.status(403).json({ error: 'Invalid secret' });
  }

  const panelEmbed = {
    title: '🎫 Open a Support Ticket',
    description: '> Need help with an order or have a question? Select a product below to open a **private support ticket** with our staff team.\n\n> After selecting, a private channel will be created where our **@staff** team will assist you directly.',
    color: 0x2563eb,
    fields: [
      { name: '\u200b', value: '**🎮 Available Products**', inline: false },
      { name: 'Ambrosia OW Lite', value: 'Overwatch 2 | Aimbot, Triggerbot, Flickbot\nStreamproof visuals, auto bunnyhop, SnapTap\n`$5/week · $10/month`', inline: true },
      { name: 'Ambrosia OW Pro', value: 'Overwatch 2 | Full combat suite\nHero scripting, Ult Shower HUD, dual slots\n`$20/week · $45/month`', inline: true },
      { name: '\u200b', value: '\u200b', inline: false },
      { name: 'CS2 Web Radar', value: 'Counter-Strike 2 | Triggerbot + RCS\n2D tactical web radar for phone/2nd screen\n`$5/week · $15/month`', inline: true },
      { name: 'Ambrosia FN', value: 'Fortnite | Aimbot, ESP, loot radar\nOn-screen radar, 10 configs\n`$20/week · $45/month`', inline: true },
      { name: '\u200b', value: '\u200b', inline: false },
      { name: '\u2714\ufe0f How It Works', value: '1. Select a product from the dropdown below\n2. A **private ticket channel** is created instantly\n3. Share your **Discord User ID** in the ticket\n4. Staff will assist you with your order\n5. Close the ticket when done', inline: false },
      { name: '\u26a0\ufe0f Important', value: 'You **must** be a member of this Discord server to open a ticket. If you cannot open a ticket, please join our server first using the invite link below.', inline: false }
    ],
    image: {
      url: 'https://ambrosia.ovh/og-image.png'
    },
    thumbnail: {
      url: 'https://ambrosia.ovh/favicon.ico'
    },
    footer: {
      text: 'Ambrosia.ovh | Official Reseller',
      icon_url: 'https://ambrosia.ovh/favicon.ico'
    },
    timestamp: new Date().toISOString()
  };

  const panelComponents = [
    {
      type: 1,
      components: [
        {
          type: 3,
          custom_id: 'select_ticket_product',
          placeholder: '🎮 Select a product to open a ticket...',
          min_values: 1,
          max_values: 1,
          options: [
            {
              label: 'Ambrosia OW Lite',
              description: 'Overwatch 2 | $5/wk · $10/mo — Aimbot, Triggerbot, Streamproof',
              value: 'ambrosia-ow-lite',
              emoji: { name: '🎯' },
              default: false
            },
            {
              label: 'Ambrosia OW Pro',
              description: 'Overwatch 2 | $20/wk · $45/mo — Hero Scripting, Ult HUD',
              value: 'ambrosia-ow-pro',
              emoji: { name: '⚡' },
              default: false
            },
            {
              label: 'CS2 Web Radar',
              description: 'Counter-Strike 2 | $5/wk · $15/mo — Triggerbot, RCS, Web Radar',
              value: 'ambrosia-cs2-web',
              emoji: { name: '📡' },
              default: false
            },
            {
              label: 'Ambrosia FN',
              description: 'Fortnite | $20/wk · $45/mo — Aimbot, ESP, Loot Radar',
              value: 'ambrosia-fn',
              emoji: { name: '🔫' },
              default: false
            },
            {
              label: 'General Support',
              description: 'Questions, issues, or anything else — our staff will help',
              value: 'general-support',
              emoji: { name: '💬' },
              default: false
            }
          ]
        }
      ]
    }
  ];

  try {
    const resp = await fetch('https://discord.com/api/v10/channels/' + TICKET_PANEL_CHANNEL_ID + '/messages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bot ' + BOT_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        embeds: [panelEmbed],
        components: panelComponents
      })
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error('[Ambrosia Panel] Discord API error ' + resp.status + ': ' + err);
      return res.status(502).json({ error: 'Discord API error: ' + resp.status, details: err.substring(0, 200) });
    }

    const msg = await resp.json();
    return res.status(200).json({
      success: true,
      messageId: msg.id,
      channelId: TICKET_PANEL_CHANNEL_ID
    });
  } catch (e) {
    console.error('[Ambrosia Panel] Failed to send panel:', e);
    return res.status(500).json({ error: 'Failed to send panel' });
  }
};
