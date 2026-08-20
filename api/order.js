const ENCODED_BOT_TOKEN = 'TVRVek9UY3dNVFF6TlRJek56WTJNamd6TUEuR1pzd1I4LmE0cms4NHJvM2hmSjdFREYwMEltM18tVlh0MWlOVURQSndYdmV3';
const NOTIFICATION_CHANNEL_ID = '1539405270374154361';

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

  const { discordUserId, product, duration, price, xmrAmount, address, txHash, ticketRef, timezone, localTime } = req.body;

  if (!discordUserId) return res.status(400).json({ error: 'Discord User ID is mandatory' });

  let username = 'unknown';
  try {
    const userRes = await fetch('https://discord.com/api/v10/users/' + discordUserId, {
      headers: { Authorization: 'Bot ' + BOT_TOKEN }
    });
    if (userRes.ok) {
      const userData = await userRes.json();
      username = userData.username || 'unknown';
    }
  } catch (e) {
    console.error('[Ambrosia] Failed to fetch user:', e);
  }

  const mentionText = '<@' + discordUserId + '>';
  const avatarUrl = 'https://cdn.discordapp.com/avatars/' + discordUserId + '.png?size=128';

  const payload = {
    username: 'Ambrosia Order Bot',
    avatar_url: 'https://ambrosia.ovh/favicon.ico',
    content: mentionText + ' \u2014 **New Order Received!**',
    embeds: [
      {
        title: '\uD83D\uDCE6 NEW ORDER \u2014 #' + ticketRef,
        color: 0xf59e0b,
        description: '> A customer has completed checkout and is waiting in line. **Create a private ticket** to begin assisting them.',
        fields: [
          {
            name: '\uD83D\uDC64 **Customer**',
            value: mentionText + '\n`' + username + '` \u2022 `' + discordUserId + '`',
            inline: true
          },
          {
            name: '\uD83C\uDFAE **Product**',
            value: '**' + product + '**',
            inline: true
          },
          {
            name: '\u23F0 **Duration**',
            value: '`' + duration + '`',
            inline: true
          },
          {
            name: '\u200b',
            value: '\u200b',
            inline: false
          },
          {
            name: '\uD83D\uDCB0 **Price (USD)**',
            value: '```ansi\n\u001b[1;32m$' + price + ' USD\u001b[0m\n```',
            inline: true
          },
          {
            name: '\uD83D\uDCB0 **Price (XMR)**',
            value: '```ansi\n\u001b[1;36m~' + xmrAmount + ' XMR\u001b[0m\n```',
            inline: true
          },
          {
            name: '\u23F3 **Payment Status**',
            value: '```ansi\n\u001b[1;33mPENDING\u001b[0m\n```',
            inline: true
          },
          {
            name: '\u200b',
            value: '\u200b',
            inline: false
          },
          {
            name: '\uD83D\uDCB3 **XMR Payment Address**',
            value: '```\n' + address + '\n```',
            inline: false
          },
          {
            name: '\uD83D\uDCC3 **TXID / Status**',
            value: '`' + (txHash || 'Pending in ticket') + '`',
            inline: false
          },
          {
            name: '\u200b',
            value: '\u200b',
            inline: false
          },
          {
            name: '\uD83D\uDCC5 **Order Placed**',
            value: localTime + '\n`' + timezone + '`',
            inline: true
          },
          {
            name: '\uD83D\uDD27 **Ticket Reference**',
            value: '`' + ticketRef + '`',
            inline: true
          }
        ],
        thumbnail: {
          url: avatarUrl
        },
        image: {
          url: 'https://ambrosia.ovh/og-image.png'
        },
        footer: {
          text: 'Ambrosia.ovh \u2022 Staff Action Required',
          icon_url: 'https://ambrosia.ovh/favicon.ico'
        },
        timestamp: new Date().toISOString()
      },
      {
        title: '\u2705 **Staff Checklist**',
        color: 0x065f46,
        description:
          '``` \n'
          + ' 1. \u2705 Click **Create Ticket** below \n'
          + ' 2. \uD83D\uDC4B Welcome customer in the new ticket \n'
          + ' 3. \uD83D\uDD0D Verify XMR payment on-chain \n'
          + ' 4. \uD83D\uDCE6 Deliver license key \n'
          + ' 5. \u2B50 Assign Verified Customer role \n'
          + ' 6. \uD83D\uDD12 Close ticket when complete \n'
          + ' ```',
        footer: {
          text: 'Ambrosia.ovh \u2022 Automated Order System',
          icon_url: 'https://ambrosia.ovh/favicon.ico'
        },
        timestamp: new Date().toISOString()
      }
    ],
    components: [{
      type: 1,
      components: [{
        type: 2,
        custom_id: 'create_ticket',
        label: 'Create Ticket',
        style: 3,
        emoji: { name: '\uD83C\uDFAB' }
      }]
    }]
  };

  try {
    const resp = await fetch('https://discord.com/api/v10/channels/' + NOTIFICATION_CHANNEL_ID + '/messages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bot ' + BOT_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error('[Ambrosia] Discord API error ' + resp.status + ': ' + err);
      return res.status(502).json({ error: 'Discord API error: ' + resp.status });
    }

    return res.status(200).json({ success: true, ticketRef: ticketRef, username: username });
  } catch (e) {
    console.error('[Ambrosia] Failed to send message:', e);
    return res.status(500).json({ error: 'Failed to send message' });
  }
};
