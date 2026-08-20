const ENCODED_BOT_TOKEN = 'TVRVek9UY3dNVFF6TlRJek56WTJNamd6TUEuR1pzd1I4LmE0cms4NHJvM2hmSjdFREYwMEltM18tVlh0MWlOVURQSndYdmV3';
const TICKET_PANEL_CHANNEL_ID = '1540131367151734784';

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

  const panelEmbeds = [
    {
      title: 'Open a Support Ticket',
      description: 'Select a product from the dropdown below to open a private ticket with our staff.\n\nYou must be a member of this server to open a ticket.',
      color: 0x2563eb,
      thumbnail: { url: 'https://ambrosia.ovh/favicon.ico' },
      image: { url: 'https://ambrosia.ovh/og-image.png' },
      timestamp: new Date().toISOString()
    }
  ];

  const panelComponents = [
    {
      type: 1,
      components: [
        {
          type: 3,
          custom_id: 'select_ticket_product',
          placeholder: 'Select a product to open a ticket...',
          min_values: 1,
          max_values: 1,
          options: [
            { label: 'Ambrosia OW Lite', description: 'Overwatch 2 | $5/wk | $10/mo | Aimbot, Triggerbot, Streamproof', value: 'ambrosia-ow-lite', emoji: { name: '\uD83C\uDFAF' } },
            { label: 'Ambrosia OW Pro', description: 'Overwatch 2 | $20/wk | $45/mo | Hero Scripting, Ult HUD', value: 'ambrosia-ow-pro', emoji: { name: '\u26A1' } },
            { label: 'CS2 Web Radar', description: 'Counter-Strike 2 | $5/wk | $15/mo | Triggerbot, RCS, Web Radar', value: 'ambrosia-cs2-web', emoji: { name: '\uD83D\uDCE1' } },
            { label: 'Ambrosia FN', description: 'Fortnite | $20/wk | $45/mo | Aimbot, ESP, Loot Radar', value: 'ambrosia-fn', emoji: { name: '\uD83C\uDF96\uFE0F' } },
            { label: 'General Support', description: 'Questions, issues, or anything else', value: 'general-support', emoji: { name: '\uD83D\uDCAC' } }
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
        embeds: panelEmbeds,
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
