const ENCODED_BOT_TOKEN = 'TVRVek9UY3dNVFF6TlRJek56WTJNamd6TUEuR1pzd1I4LmE0cms4NHJvM2hmSjdFREYwMEltM18tVlh0MWlOVURQSndYdmV3';
const NOTIFICATION_CHANNEL_ID = process.env.DISCORD_ORDER_NOTIFICATION_CHANNEL_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const TICKET_SERVER_INVITE = 'https://discord.gg/UwYWZZ4Z6c';
var pendingOrders = require('../lib/pending-orders.js');
var tracking = require('../lib/tracking-store.js');

function getBotToken() {
  try { return Buffer.from(ENCODED_BOT_TOKEN, 'base64').toString('utf8'); } catch { return ''; }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var BOT_TOKEN = getBotToken();
  if (!BOT_TOKEN) return res.status(500).json({ error: 'Bot token not configured' });
  if (!NOTIFICATION_CHANNEL_ID) return res.status(500).json({ error: 'DISCORD_ORDER_NOTIFICATION_CHANNEL_ID not set in env' });
  if (!GUILD_ID) return res.status(500).json({ error: 'DISCORD_GUILD_ID not set in env' });

  var body = req.body || {};
  var discordUserId = body.discordUserId;
  var product = body.product;
  var duration = body.duration;
  var price = body.price;
  var xmrAmount = body.xmrAmount;
  var address = body.address;
  var txHash = body.txHash;
  var ticketRef = body.ticketRef;
  var timezone = body.timezone;
  var localTime = body.localTime;

  if (!discordUserId) return res.status(400).json({ error: 'Discord User ID is mandatory' });

  var isMember = false;
  try {
    var memberRes = await fetch('https://discord.com/api/v10/guilds/' + GUILD_ID + '/members/' + discordUserId, {
      headers: { Authorization: 'Bot ' + BOT_TOKEN }
    });
    isMember = memberRes.ok;
  } catch (e) {
    console.error('[Ambrosia] Membership check failed:', e);
  }

  if (!isMember) {
    return res.status(403).json({
      error: 'not_member',
      message: 'You must be a member of the Discord server to place an order. Join here: ' + TICKET_SERVER_INVITE
    });
  }

  var activeTicketCount = tracking.getActiveTicketCount(discordUserId);
  if (activeTicketCount >= tracking.MAX_ACTIVE_TICKETS) {
    return res.status(429).json({
      error: 'too_many_tickets',
      message: 'You already have ' + activeTicketCount + ' active ticket(s). Maximum is ' + tracking.MAX_ACTIVE_TICKETS + '. Please close existing tickets before placing a new order.'
    });
  }

  var username = 'unknown';
  try {
    var userRes = await fetch('https://discord.com/api/v10/users/' + discordUserId, {
      headers: { Authorization: 'Bot ' + BOT_TOKEN }
    });
    if (userRes.ok) {
      var userData = await userRes.json();
      username = userData.username || 'unknown';
    }
  } catch (e) {
    console.error('[Ambrosia] Failed to fetch user:', e);
  }

  var mentionText = '<@' + discordUserId + '>';
  var avatarUrl = 'https://cdn.discordapp.com/avatars/' + discordUserId + '.png?size=128';
  var addrText = address ? '```\n' + address + '\n```' : 'Contact staff for payment details.';

  var ticketEmbed = {
    title: 'Ticket #' + ticketRef,
    color: 0x2563eb,
    description: 'Welcome ' + mentionText + '.\n\nA staff member will assist you shortly. **Click Create Ticket below to begin.** If staff does not respond within 90 seconds, a ticket will be opened automatically.\n\n\u26A0\uFE0F **Do NOT send XMR until the ticket is open.** Your TX Hash is mandatory for verification.',
    fields: [
      { name: 'Product', value: '**' + product + '**', inline: true },
      { name: 'Duration', value: '`' + duration + '`', inline: true },
      { name: 'Price', value: '`$' + price + ' USD ~' + xmrAmount + ' XMR`', inline: true },
      { name: '\u200b', value: '\u200b', inline: false },
      { name: 'XMR Payment Address', value: addrText, inline: false },
      { name: 'TXID / Status', value: '`' + (txHash || 'Pending in ticket') + '`', inline: false },
      { name: '\u200b', value: '\u200b', inline: false },
      { name: 'Customer', value: mentionText + '\n`' + username + '` \u2022 `' + discordUserId + '`', inline: true },
      { name: 'Order Placed', value: localTime + '\n`' + timezone + '`', inline: true },
      { name: 'Ticket Reference', value: '`' + ticketRef + '`', inline: true }
    ],
    thumbnail: { url: avatarUrl },
    image: { url: 'https://ambrosia.ovh/og-image.png' },
    footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' },
    timestamp: new Date().toISOString()
  };

  var staffEmbed = {
    title: '\uD83D\uDCDD Staff Actions',
    color: 0x5865f2,
    description: 'Click **Create Ticket** below to open a private channel with this customer. The ticket will auto-open after 90 seconds if no staff clicks.',
    fields: [
      { name: '\uD83D\uDCAB Payment Address', value: address ? '```\n' + address + '\n```\nSend **exactly** `' + xmrAmount + ' XMR`' : 'Generated in ticket', inline: false },
      { name: '\uD83D\uDCCB Order Info', value: '**Customer:** <@' + discordUserId + '>\n**Product:** ' + product + '\n**Duration:** ' + duration + '\n**Price:** $' + price + ' USD (~' + xmrAmount + ' XMR)\n**TX Hash:** `' + (txHash || 'Pending') + '`', inline: false },
      { name: '\u26A0\uFE0F Reminder', value: 'Customer must submit their TX Hash in the ticket for verification. Do NOT verify payment without a TX Hash.', inline: false }
    ],
    footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' },
    timestamp: new Date().toISOString()
  };

  var payload = {
    username: 'Ambrosia Order Bot',
    avatar_url: 'https://ambrosia.ovh/favicon.ico',
    content: mentionText + ' placed a new order. Click **Create Ticket** below to open a private channel with them.',
    embeds: [ticketEmbed, staffEmbed],
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
    var resp = await fetch('https://discord.com/api/v10/channels/' + NOTIFICATION_CHANNEL_ID + '/messages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bot ' + BOT_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      var err = await resp.text();
      console.error('[Ambrosia] Discord API error ' + resp.status + ': ' + err);
      return res.status(502).json({ error: 'Discord API error: ' + resp.status });
    }

    var postedMsg = await resp.json().catch(function() { return {}; });

    pendingOrders.addPendingOrder({
      messageId: postedMsg.id || null,
      channelId: NOTIFICATION_CHANNEL_ID,
      guildId: GUILD_ID,
      discordUserId: discordUserId,
      product: product,
      duration: duration,
      price: price,
      xmrAmount: xmrAmount,
      address: address,
      txHash: txHash,
      ticketRef: ticketRef
    });

    return res.status(200).json({ success: true, ticketRef: ticketRef, username: username });
  } catch (e) {
    console.error('[Ambrosia] Failed to send message:', e);
    return res.status(500).json({ error: 'Failed to send message' });
  }
};
