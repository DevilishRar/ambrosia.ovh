const ENCODED_BOT_TOKEN = 'TVRVek9UY3dNVFF6TlRJek56WTJNamd6TUEuR1pzd1I4LmE0cms4NHJvM2hmSjdFREYwMEltM18tVlh0MWlOVURQSndYdmV3';
const NOTIFICATION_CHANNEL_ID = '1539405270374154361';
const GUILD_ID = '1539404742055166045';
const TICKET_SERVER_INVITE = 'https://discord.gg/fE4QFQVBfD';

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
      message: 'You must be a member of the Discord server to place an order. Join here: ' + TICKET_SERVER_INVITE
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

  const ticketEmbed = {
    title: 'Ticket #' + ticketRef,
    color: 0x2563eb,
    description: 'Welcome ' + mentionText + '.\n\nA staff member will assist you shortly. Please follow the instructions below to get verified.',
    fields: [
      { name: 'Product', value: '**' + product + '**', inline: true },
      { name: 'Duration', value: '`' + duration + '`', inline: true },
      { name: 'Price', value: '`' + price + ' USD ~' + xmrAmount + ' XMR`', inline: true },
      { name: '\u200b', value: '\u200b', inline: false },
      { name: 'XMR Payment Address', value: '```\n' + address + '\n```', inline: false },
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

  const instructionsEmbed = {
    title: 'How to Get Verified',
    color: 0x065f46,
    description: 'Follow these steps to complete your purchase and receive your license key.',
    fields: [
      { name: 'Step 1', value: 'Send your Discord User ID in this ticket. Right click your profile in Discord and click "Copy User ID".', inline: false },
      { name: 'Step 2', value: 'Send the correct XMR amount to the payment address shown above. Make sure you send the exact amount.', inline: false },
      { name: 'Step 3', value: 'Wait for a staff member to verify your payment on the blockchain. This usually takes a few minutes.', inline: false },
      { name: 'Step 4', value: 'Once verified, you will receive your license key in this ticket.', inline: false },
      { name: 'Step 5', value: 'After receiving your key, a staff member will close this ticket.', inline: false },
      { name: '\u26A0\uFE0F Important', value: 'Do not send XMR to any address other than the one shown in this ticket. Always verify the address matches exactly.', inline: false }
    ],
    footer: { text: 'Ambrosia Payment System', icon_url: 'https://ambrosia.ovh/favicon.ico' },
    timestamp: new Date().toISOString()
  };

  const staffEmbed = {
    title: 'Staff Order Handling Guide',
    color: 0x991b1b,
    description: 'Private instructions for Staff and Seller roles. Do not share this with customers.',
    fields: [
      { name: 'Step 1: Verify User ID', value: 'Ask the customer for their Discord User ID if not already provided. Verify it matches the ticket creator.', inline: false },
      { name: 'Step 2: Check XMR Payment', value: 'Use a blockchain explorer (xmrchain.net or similar) to verify the customer sent the correct XMR amount to the shown address.', inline: false },
      { name: 'Step 3: Confirm Amount', value: 'Make sure the amount received matches the expected price. Account for small fluctuations in XMR value.', inline: false },
      { name: 'Step 4: Deliver License Key', value: 'Once payment is confirmed on chain, deliver the license key to the customer in this ticket.', inline: false },
      { name: 'Step 5: Verify Purchase', value: 'Click the **Verify Purchase** button below to give the customer the Verified Customer role.', inline: false },
      { name: 'Step 6: Close Ticket', value: 'After the key is delivered and role is assigned, click **Close Ticket** to close this channel.', inline: false },
      { name: '\u274C Do Not', value: 'Do not deliver keys before payment is confirmed on chain. Do not close tickets without verifying the purchase first.', inline: false }
    ],
    footer: { text: 'Ambrosia Staff Hub \u2022 Private', icon_url: 'https://ambrosia.ovh/favicon.ico' },
    timestamp: new Date().toISOString()
  };

  const payload = {
    username: 'Ambrosia Order Bot',
    avatar_url: 'https://ambrosia.ovh/favicon.ico',
    content: mentionText + ' placed a new order. A ticket channel will be created for you.',
    embeds: [ticketEmbed, instructionsEmbed, staffEmbed],
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
