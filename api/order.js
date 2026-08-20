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
  const customerField = '<@' + discordUserId + '>\n(' + username + ' \u2022 ID: ' + discordUserId + ')';

  const payload = {
    username: 'Ambrosia Order Bot',
    avatar_url: 'https://ambrosia.ovh/favicon.ico',
    content: mentionText + ' - **New Order Ticket Created!**',
    embeds: [{
      title: 'NEW ORDER - #' + ticketRef,
      color: 0x2563eb,
      description: '> A new customer is ready to purchase. Review the details below and **create a private ticket channel**.',
      fields: [
        { name: 'Customer', value: customerField, inline: true },
        { name: 'Product', value: '**' + product + '**', inline: true },
        { name: 'Duration', value: duration, inline: true },
        { name: 'Price (USD)', value: '$' + price + ' USD', inline: true },
        { name: 'Price (XMR)', value: '~' + xmrAmount + ' XMR', inline: true },
        { name: 'TXID / Status', value: txHash || 'Pending', inline: true },
        { name: '\u200b', value: '\u200b', inline: false },
        { name: 'Monero (XMR) Payment Address', value: address, inline: false },
        { name: 'Order Placed', value: localTime + ' (' + timezone + ')', inline: false },
        { name: '\u200b', value: '\u200b', inline: false },
        { name: 'Staff Checklist', value: '1. Click **Create Ticket** below\n2. Welcome customer in the new ticket\n3. Verify XMR payment on-chain\n4. Deliver license key\n5. Assign Verified Customer role\n6. Close ticket', inline: false }
      ],
      footer: { text: 'Ambrosia.ovh Reseller System | Ticket #' + ticketRef },
      timestamp: new Date().toISOString()
    }],
    components: [{
      type: 1,
      components: [{
        type: 2,
        custom_id: 'create_ticket',
        label: 'Create Ticket',
        style: 1,
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
