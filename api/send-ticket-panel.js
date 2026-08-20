const ENCODED_BOT_TOKEN = 'TVRVek9UY3dNVFF6TlRJek56WTJNamd6TUEuR1pzd1I4LmE0cms4NHJvM2hmSjdFREYwMEltM18tVlh0MWlOVURQSndYdmV3';
const TICKET_PANEL_CHANNEL_ID = '1539954048722010193';
const GUILD_ID = '1539404742055166045';

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
      title: 'Ambrosia Support Hub',
      description: 'Need help with an order or have a question? Open a private ticket and our staff will assist you directly.\n\n**You must be a member of this Discord server to open a ticket.** If you cannot interact with the dropdown below, join our server first.',
      color: 0x2563eb,
      thumbnail: { url: 'https://ambrosia.ovh/favicon.ico' },
      image: { url: 'https://ambrosia.ovh/og-image.png' },
      timestamp: new Date().toISOString()
    },
    {
      title: 'Product Catalog and XMR Addresses',
      color: 0x1e3a8a,
      fields: [
        {
          name: 'Ambrosia OW Lite',
          value: 'Overwatch 2 | Aimbot, Triggerbot, Flickbot, Streamproof\n'
            + '$5/week, $10/month\n\n'
            + 'Weekly Address:\n'
            + '```\n89aFGA5EWqvJUnNacSNW6RGPctm74XKx8Nvz5t45BDm8ZfDWdBH2xJgZsL4mFi47kHaamwu2PcQAT3E1vUJmpPhD15WjkiB\n```\n'
            + 'Monthly Address:\n'
            + '```\n8AGpdyaAkKyb8daJ3xksAr9m6y5L6ChND2KHthouN4YcEXMtm5cH72DghMc2ZeMHdP2ewXWxWWRPTUuoMefj1DSg7FVf8kU\n```',
          inline: false
        },
        {
          name: 'Ambrosia OW Pro',
          value: 'Overwatch 2 | Hero Scripting, Ult Shower HUD, Dual Slots\n'
            + '$20/week, $45/month\n\n'
            + 'Weekly Address:\n'
            + '```\n8AGpdyaAkKyb8daJ3xksAr9m6y5L6ChND2KHthouN4YcEXMtm5cH72DghMc2ZeMHdP2ewXWxWWRPTUuoMefj1DSg7FVf8kU\n```\n'
            + 'Monthly Address:\n'
            + '```\n4BE8WBPizoyfveG6Sbtd66V184WktCEoq8EQ2d3ayxKLQxhRiFB4shQDHSVU8f188diVst9thbTtWh4KmrGKZXwwRm6fvyL\n```',
          inline: false
        },
        {
          name: 'CS2 Web Radar',
          value: 'Counter-Strike 2 | Triggerbot, RCS, 2D Tactical Radar\n'
            + '$5/week, $15/month\n\n'
            + 'Weekly Address:\n'
            + '```\n84hxPfyebV85yHJi6BuBnnKxBjYRGc1dMURtmv4By4QjNF9Czaho5EPQzeGEeNtVfpCyX1v4dRLac2LWLEnSC4EK7BsKZKc\n```\n'
            + 'Monthly Address:\n'
            + '```\n8AVUcXxR3ircP1BhpUi3fhczeag4LQjCaJKBe2opbDrKCexzqYAwjk3U63uGeaU4Wk7ztyDtoYEuHXxQ46f27c4AR2c6mQf\n```',
          inline: false
        },
        {
          name: 'Ambrosia FN',
          value: 'Fortnite | Aimbot, ESP, Loot Radar\n'
            + '$20/week, $45/month\n\n'
            + 'Contact staff in the ticket for the payment address.',
          inline: false
        }
      ]
    },
    {
      title: 'How It Works',
      color: 0x5865f2,
      fields: [
        {
          name: 'For Customers',
          value: '1. Select a product from the dropdown below\n'
            + '2. A private ticket channel will be created\n'
            + '3. Send your Discord User ID in the ticket (right click your profile, Copy User ID)\n'
            + '4. Describe what you need help with\n'
            + '5. Send your XMR payment to the address shown above\n'
            + '6. Staff will verify your payment on chain\n'
            + '7. You will receive your license key\n'
            + '8. Staff will close the ticket',
          inline: true
        },
        {
          name: 'Payment Verification',
          value: 'After you send XMR, staff will check the blockchain to confirm your transaction. Once verified, your license key will be delivered in the ticket. No verification is needed from your side beyond sending the correct amount to the shown address.',
          inline: true
        }
      ],
      footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' },
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
            {
              label: 'Ambrosia OW Lite',
              description: 'Overwatch 2 | $5/wk | $10/mo | Aimbot, Triggerbot, Streamproof',
              value: 'ambrosia-ow-lite',
              emoji: { name: '\uD83C\uDFAF' },
              default: false
            },
            {
              label: 'Ambrosia OW Pro',
              description: 'Overwatch 2 | $20/wk | $45/mo | Hero Scripting, Ult HUD',
              value: 'ambrosia-ow-pro',
              emoji: { name: '\u26A1' },
              default: false
            },
            {
              label: 'CS2 Web Radar',
              description: 'Counter-Strike 2 | $5/wk | $15/mo | Triggerbot, RCS, Web Radar',
              value: 'ambrosia-cs2-web',
              emoji: { name: '\uD83D\uDCE1' },
              default: false
            },
            {
              label: 'Ambrosia FN',
              description: 'Fortnite | $20/wk | $45/mo | Aimbot, ESP, Loot Radar',
              value: 'ambrosia-fn',
              emoji: { name: '\uD83C\uDF96\uFE0F' },
              default: false
            },
            {
              label: 'General Support',
              description: 'Questions, issues, or anything else',
              value: 'general-support',
              emoji: { name: '\uD83D\uDCAC' },
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
