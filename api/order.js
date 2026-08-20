const ENCODED_BOT_TOKEN = 'TVRVek9UY3dNVFF6TlRJek56WTJNamd6TUEuR1pzd1I4LmE0cms4NHJvM2hmSjdFREYwMEltM18tVlh0MWlOVURQSndYdmV3';
const NOTIFICATION_CHANNEL_ID = '1539405270374154361';
const GUILD_ID = '1539404742055166045';
const DISCORD_INVITE = 'https://discord.gg/bT9dpnerP4';

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

  let isMember = false;
  try {
    const memberRes = await fetch('https://discord.com/api/v10/guilds/' + GUILD_ID + '/members/' + discordUserId, {
      headers: { Authorization: 'Bot ' + BOT_TOKEN }
    });
    isMember = memberRes.ok;
  } catch (e) {
    console.error('[Ambrosia] Membership check failed:', e);
  }

  if (!isMember) {
    return res.status(403).json({
      error: 'not_member',
      message: 'You must be a member of the Discord server to place an order. Join here: ' + DISCORD_INVITE
    });
  }

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
    content: mentionText + ' placed a new order.',
    embeds: [
      {
        title: 'NEW ORDER \u2014 #' + ticketRef,
        color: 0xf59e0b,
        description: 'A customer has completed checkout. Create a private ticket to begin assisting them.',
        fields: [
          { name: 'Customer', value: mentionText + '\n`' + username + '` \u2022 `' + discordUserId + '`', inline: true },
          { name: 'Product', value: '**' + product + '**', inline: true },
          { name: 'Duration', value: '`' + duration + '`', inline: true },
          { name: '\u200b', value: '\u200b', inline: false },
          { name: 'Price (USD)', value: '`$' + price + ' USD`', inline: true },
          { name: 'Price (XMR)', value: '`~' + xmrAmount + ' XMR`', inline: true },
          { name: 'Payment Status', value: '`PENDING`', inline: true },
          { name: '\u200b', value: '\u200b', inline: false },
          { name: 'XMR Payment Address', value: '```\n' + address + '\n```', inline: false },
          { name: 'TXID / Status', value: '`' + (txHash || 'Pending in ticket') + '`', inline: false },
          { name: '\u200b', value: '\u200b', inline: false },
          { name: 'Order Placed', value: localTime + '\n`' + timezone + '`', inline: true },
          { name: 'Ticket Reference', value: '`' + ticketRef + '`', inline: true }
        ],
        thumbnail: { url: avatarUrl },
        image: { url: 'https://ambrosia.ovh/og-image.png' },
        footer: { text: 'Ambrosia.ovh \u2022 Staff Action Required', icon_url: 'https://ambrosia.ovh/favicon.ico' },
        timestamp: new Date().toISOString()
      },
      {
        title: 'Staff Checklist',
        color: 0x065f46,
        description: '1. Click **Create Ticket** below\n'
          + '2. Welcome customer in the new ticket\n'
          + '3. Verify XMR payment on chain\n'
          + '4. Deliver license key\n'
          + '5. Assign Verified Customer role\n'
          + '6. Close ticket when complete',
        footer: { text: 'Ambrosia.ovh \u2022 Automated Order System', icon_url: 'https://ambrosia.ovh/favicon.ico' },
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
