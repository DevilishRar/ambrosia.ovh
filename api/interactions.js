const nacl = require('tweetnacl');

const ENCODED_BOT_TOKEN = 'TVRVek9UY3dNVFF6TlRJek56WTJNamd6TUEuR1pzd1I4LmE0cms4NHJvM2hmSjdFREYwMEltM18tVlh0MWlOVURQSndYdmV3';

const APPLICATION_PUBLIC_KEY = process.env.DISCORD_APPLICATION_PUBLIC_KEY || 'b9f4224b6bcc697b8d910f4095fb586c987552a63c2b53b945880f0ec5c29454';
const GUILD_ID = process.env.DISCORD_GUILD_ID || '1539404742055166045';
const CATEGORY_ID = process.env.DISCORD_TICKETS_CATEGORY_ID || '1539707872416636939';
const STAFF_ROLE_ID = process.env.DISCORD_STAFF_ROLE_ID || '1539709640240005220';

const XMR_MAP = {
  'ambrosia-ow-lite': { name: 'Ambrosia OW Lite', game: 'Overwatch 2' },
  'ambrosia-ow-pro': { name: 'Ambrosia OW Pro', game: 'Overwatch 2' },
  'ambrosia-cs2-web': { name: 'CS2 Web Radar', game: 'Counter-Strike 2' },
  'ambrosia-fn': { name: 'Ambrosia FN', game: 'Fortnite' },
  'general-support': { name: 'General Support', game: null }
};

function getBotToken() {
  try { return atob(ENCODED_BOT_TOKEN); } catch { return ''; }
}

function parseField(fields, name) {
  if (!fields) return '';
  const f = fields.find(f => f.name === name);
  return f ? f.value : '';
}

function extractUserId(val) {
  if (!val) return '';
  const m = val.match(/(\d{17,20})/);
  return m ? m[1] : '';
}

function extractUsername(val) {
  if (!val) return 'unknown';
  const mention = val.match(/<@!?(\d+)>/);
  const paren = val.match(/\((.+)\)/);
  if (paren) return paren[1].replace('@', '').trim();
  if (mention) return 'user-' + mention[1];
  return val.split('\n')[0].replace('@', '').trim() || 'unknown';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const signature = req.headers['x-signature-ed25519'];
  const timestamp = req.headers['x-signature-timestamp'];
  const body = JSON.stringify(req.body);

  if (!signature || !timestamp) return res.status(401).json({ error: 'Missing signature headers' });
  if (!APPLICATION_PUBLIC_KEY) return res.status(500).json({ error: 'Server misconfigured' });

  const isValid = nacl.sign.detached.verify(
    Buffer.from(timestamp + body),
    Buffer.from(signature, 'hex'),
    Buffer.from(APPLICATION_PUBLIC_KEY, 'hex')
  );

  if (!isValid) return res.status(401).json({ error: 'Invalid request signature' });

  const { type, data, message } = req.body;

  if (type === 1) return res.json({ type: 1 });

  if (type === 3 && data && data.custom_id === 'create_ticket') {
    const BOT_TOKEN = getBotToken();
    if (!BOT_TOKEN) return res.json({ type: 4, data: { content: 'Bot token not configured.', flags: 64 } });

    try {
      const embed = message && message.embeds ? message.embeds[0] : null;
      const fields = embed ? embed.fields : null;

      const titleText = embed ? embed.title : '';
      const ticketMatch = titleText.match(/#([A-Z]+-\d+)/);
      const ticketRef = ticketMatch ? ticketMatch[1] : 'NEW-' + Math.floor(1000 + Math.random() * 9000);

      const customerRaw = parseField(fields, 'Customer');
      const product = parseField(fields, 'Product').replace(/\*\*/g, '').trim() || 'Ambrosia Client';
      const duration = parseField(fields, 'Duration').trim() || 'MONTHLY';
      const priceUsd = parseField(fields, 'Price (USD)').trim() || '$45 USD';
      const priceXmr = parseField(fields, 'Price (XMR)').trim() || '~0.26 XMR';
      const txHash = parseField(fields, 'TXID / Status').trim() || 'Pending in ticket';
      const xmrAddress = parseField(fields, 'Monero (XMR) Payment Address').trim() || 'Address provided on website';
      const orderTime = parseField(fields, 'Order Placed').trim() || new Date().toISOString();

      const customerId = extractUserId(customerRaw);
      const cleanUsername = extractUsername(customerRaw).replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
      const channelName = 'ticket-' + ticketRef.toLowerCase() + '-' + cleanUsername;

      const guildRes = await fetch('https://discord.com/api/v10/guilds/' + GUILD_ID + '?with_counts=false', {
        headers: { Authorization: 'Bot ' + BOT_TOKEN }
      });
      if (!guildRes.ok) {
        const err = await guildRes.text();
        console.error('[Ambrosia] Guild fetch failed:', guildRes.status, err);
        return res.json({ type: 4, data: { content: 'Failed to access guild.', flags: 64 } });
      }
      const guild = await guildRes.json();

      const perms = [{ id: guild.id, type: 0, allow: '0', deny: '1024' }];
      if (STAFF_ROLE_ID) perms.push({ id: STAFF_ROLE_ID, type: 0, allow: '23552', deny: '0' });
      if (customerId) perms.push({ id: customerId, type: 1, allow: '23552', deny: '0' });

      const createRes = await fetch('https://discord.com/api/v10/guilds/' + GUILD_ID + '/channels', {
        method: 'POST',
        headers: { Authorization: 'Bot ' + BOT_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: channelName, type: 0, parent_id: CATEGORY_ID || null, permission_overwrites: perms })
      });

      if (!createRes.ok) {
        const err = await createRes.text();
        console.error('[Ambrosia] Channel creation failed:', createRes.status, err);
        return res.json({ type: 4, data: { content: 'Failed to create channel.', flags: 64 } });
      }

      const newChannel = await createRes.json();

      const mentionStr = customerId
        ? '<@' + customerId + '>' + (STAFF_ROLE_ID ? ' <@&' + STAFF_ROLE_ID + '>' : '')
        : (STAFF_ROLE_ID ? '<@&' + STAFF_ROLE_ID + '>' : '');

      const productKey = Object.keys(XMR_MAP).find(k => XMR_MAP[k].name === product) || 'general-support';
      const productInfo = XMR_MAP[productKey] || { name: product, game: null };

      const welcomeEmbed = {
        title: '\uD83C\uDFAB **' + productInfo.name + '** \u2014 Ticket #' + ticketRef,
        color: 0x2563eb,
        description: 'Welcome ' + (customerId ? '<@' + customerId + '>' : '**' + customerRaw + '**') + '!\n\n'
          + '> Your private ticket has been created. A staff member will assist you shortly.\n'
          + '> Please follow the instructions below to complete your purchase.',
        fields: [
          { name: '\uD83C\uDFAE **Product**', value: '**' + product + '**', inline: true },
          { name: '\u23F0 **Duration**', value: '`' + duration.toUpperCase() + '`', inline: true },
          { name: '\uD83D\uDCB0 **Price**', value: '`' + priceUsd + ' ~' + priceXmr + '`', inline: true },
          { name: '\u200b', value: '\u200b', inline: false },
          { name: '\uD83D\uDCC5 **Order Placed**', value: orderTime, inline: true },
          { name: '\u2705 **Status**', value: '`Awaiting Payment`', inline: true },
          { name: '\u200b', value: '\u200b', inline: false },
          { name: '\uD83D\uDCA1 **How to Complete Your Order**', value: '``` \n'
            + ' \u2460 Share your Discord User ID in this ticket \n'
            + '   (Settings \u2192 Advanced \u2192 Enable Dev Mode \u2192 Right-click profile \u2192 Copy ID) \n'
            + ' \u2461 Copy the XMR payment address below \n'
            + ' \u2462 Send the EXACT amount from your personal XMR wallet \n'
            + ' \u2463 Copy the Transaction ID (TXID) and paste it here \n'
            + ' \u2464 Wait for staff to verify your payment on-chain \n'
            + ' \u2465 Receive your license key \n'
            + ' ```', inline: false },
          { name: '\u200b', value: '\u200b', inline: false },
          { name: '\uD83D\uDCB3 **XMR Payment Address**', value: '```\n' + xmrAddress + '\n```', inline: false },
          { name: '\uD83D\uDCC3 **TXID / Status**', value: '`' + txHash + '`', inline: false },
          { name: '\u200b', value: '\u200b', inline: false },
          { name: '\u2757 **Important**', value: '\u2022 Send **only XMR** (Monero) to the address\n'
            + '\u2022 Send the **exact amount** shown \u2014 overpayments cannot be refunded\n'
            + '\u2022 If you don\'t have a TXID, type **"Paying in ticket"** and staff will verify\n'
            + '\u2022 All sales are final \u2014 no refunds under any circumstances', inline: false }
        ],
        image: { url: 'https://ambrosia.ovh/og-image.png' },
        thumbnail: { url: 'https://ambrosia.ovh/favicon.ico' },
        footer: { text: 'Ambrosia.ovh \u2022 Ticket #' + ticketRef, icon_url: 'https://ambrosia.ovh/favicon.ico' },
        timestamp: new Date().toISOString()
      };

      const closeRow = {
        type: 1,
        components: [{ type: 2, custom_id: 'close_ticket', label: 'Close Ticket', style: 4, emoji: { name: '\uD83D\uDD12' } }]
      };

      await fetch('https://discord.com/api/v10/channels/' + newChannel.id + '/messages', {
        method: 'POST',
        headers: { Authorization: 'Bot ' + BOT_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: mentionStr, embeds: [welcomeEmbed], components: [closeRow] })
      });

      return res.json({ type: 4, data: { content: 'Ticket channel created: <#' + newChannel.id + '>', flags: 64 } });

    } catch (error) {
      console.error('[Ambrosia] create_ticket error:', error);
      return res.json({ type: 4, data: { content: 'Error creating ticket.', flags: 64 } });
    }
  }

  if (type === 3 && data && data.custom_id === 'select_ticket_product') {
    const BOT_TOKEN = getBotToken();
    if (!BOT_TOKEN) return res.json({ type: 4, data: { content: 'Bot not configured.', flags: 64 } });

    const selectedValue = data.values && data.values[0] ? data.values[0] : 'general-support';
    const userId = (req.body.member && req.body.member.user) ? req.body.member.user.id : ((req.body.user && req.body.user.id) ? req.body.user.id : '');
    const username = (req.body.member && req.body.member.user) ? req.body.member.user.username : ((req.body.user && req.body.user.username) ? req.body.user.username : 'unknown');

    const productNames = {
      'ambrosia-ow-lite': 'Ambrosia OW Lite',
      'ambrosia-ow-pro': 'Ambrosia OW Pro',
      'ambrosia-cs2-web': 'CS2 Web Radar',
      'ambrosia-fn': 'Ambrosia FN',
      'general-support': 'General Support'
    };
    const productName = productNames[selectedValue] || 'General Support';
    const ticketRef = 'AMB-' + Math.floor(1000 + Math.random() * 9000);
    const cleanUser = username.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
    const channelName = 'ticket-' + ticketRef.toLowerCase() + '-' + cleanUser;

    try {
      const guildRes = await fetch('https://discord.com/api/v10/guilds/' + GUILD_ID + '?with_counts=false', {
        headers: { Authorization: 'Bot ' + BOT_TOKEN }
      });
      if (!guildRes.ok) {
        const err = await guildRes.text();
        console.error('[Ambrosia] Guild fetch failed:', guildRes.status, err);
        return res.json({ type: 4, data: { content: 'Failed to access guild.', flags: 64 } });
      }
      const guild = await guildRes.json();

      const perms = [{ id: guild.id, type: 0, allow: '0', deny: '1024' }];
      if (STAFF_ROLE_ID) perms.push({ id: STAFF_ROLE_ID, type: 0, allow: '23552', deny: '0' });
      if (userId) perms.push({ id: userId, type: 1, allow: '23552', deny: '0' });

      const createRes = await fetch('https://discord.com/api/v10/guilds/' + GUILD_ID + '/channels', {
        method: 'POST',
        headers: { Authorization: 'Bot ' + BOT_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: channelName, type: 0, parent_id: CATEGORY_ID || null, permission_overwrites: perms })
      });

      if (!createRes.ok) {
        const err = await createRes.text();
        console.error('[Ambrosia] Channel creation failed:', createRes.status, err);
        return res.json({ type: 4, data: { content: 'Failed to create channel.', flags: 64 } });
      }

      const newChannel = await createRes.json();

      const mentionStr = userId
        ? '<@' + userId + '>' + (STAFF_ROLE_ID ? ' <@&' + STAFF_ROLE_ID + '>' : '')
        : (STAFF_ROLE_ID ? '<@&' + STAFF_ROLE_ID + '>' : '');

      const productInfo = XMR_MAP[selectedValue] || { name: productName, game: null };

      const isGeneral = selectedValue === 'general-support';

      const welcomeEmbed = {
        title: '\uD83C\uDFAB **' + productInfo.name + '** \u2014 Ticket #' + ticketRef,
        color: 0x2563eb,
        description: 'Welcome ' + (userId ? '<@' + userId + '>' : '**' + username + '**') + '!\n\n'
          + '> Your private ticket has been created. A staff member will assist you shortly.\n'
          + (isGeneral
            ? '> Please describe what you need help with below.'
            : '> Please follow the instructions below to complete your purchase.'),
        fields: [
          { name: '\uD83C\uDFAE **Product**', value: '**' + productInfo.name + '**', inline: true },
          { name: '\u2705 **Status**', value: '`Awaiting Staff`', inline: true },
          { name: '\u200b', value: '\u200b', inline: false },
          ...(isGeneral
            ? [
                { name: '\uD83D\uDCCB **How It Works**', value: '``` \n'
                  + ' \u2460 Describe your question or issue below \n'
                  + ' \u2461 Wait for a staff member to respond \n'
                  + ' \u2462 Staff will assist you with your request \n'
                  + ' \u2463 Once resolved, staff will close this ticket \n'
                  + ' ```', inline: false },
                { name: '\u200b', value: '\u200b', inline: false },
                { name: '\u26A0\ufe0F **Reminder**', value: '\u2022 Do NOT take screenshots or record videos of yourself cheating\n'
                  + '\u2022 Do NOT share your license key with anyone\n'
                  + '\u2022 Do NOT discuss drama, politics, or religion\n'
                  + '\u2022 Do NOT impersonate staff, admins, or owners', inline: false }
              ]
            : [
                { name: '\uD83D\uDCA1 **How to Complete Your Order**', value: '``` \n'
                  + ' \u2460 Share your Discord User ID in this ticket \n'
                  + '   (Settings \u2192 Advanced \u2192 Enable Dev Mode \u2192 Right-click profile \u2192 Copy ID) \n'
                  + ' \u2461 Copy the XMR payment address from the product embed \n'
                  + ' \u2462 Send the EXACT amount from your personal XMR wallet \n'
                  + ' \u2463 Copy the Transaction ID (TXID) and paste it here \n'
                  + ' \u2464 Wait for staff to verify your payment on-chain \n'
                  + ' \u2465 Receive your license key \n'
                  + ' ```', inline: false },
                { name: '\u200b', value: '\u200b', inline: false },
                { name: '\u2757 **Important**', value: '\u2022 Send **only XMR** (Monero) to the address\n'
                  + '\u2022 Send the **exact amount** shown \u2014 overpayments cannot be refunded\n'
                  + '\u2022 If you don\'t have a TXID, type **"Paying in ticket"** and staff will verify\n'
                  + '\u2022 All sales are final \u2014 no refunds under any circumstances', inline: false }
              ]),
          { name: '\u200b', value: '\u200b', inline: false },
          { name: '\uD83D\uDEE1\uFE0F **After Verification**', value: '\u2714\ufe0f You receive the **Verified Customer** role\n'
            + '\u2714\ufe0f Access to **private product channels** with setup guides\n'
            + '\u2714\ufe0f License key is tied to your hardware \u2014 do not share it\n'
            + '\u2714\ufe0f Need help? Open a new General Support ticket', inline: false }
        ],
        image: { url: 'https://ambrosia.ovh/og-image.png' },
        thumbnail: { url: 'https://ambrosia.ovh/favicon.ico' },
        footer: { text: 'Ambrosia.ovh \u2022 Ticket #' + ticketRef, icon_url: 'https://ambrosia.ovh/favicon.ico' },
        timestamp: new Date().toISOString()
      };

      const closeRow = {
        type: 1,
        components: [{ type: 2, custom_id: 'close_ticket', label: 'Close Ticket', style: 4, emoji: { name: '\uD83D\uDD12' } }]
      };

      await fetch('https://discord.com/api/v10/channels/' + newChannel.id + '/messages', {
        method: 'POST',
        headers: { Authorization: 'Bot ' + BOT_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: mentionStr, embeds: [welcomeEmbed], components: [closeRow] })
      });

      return res.json({ type: 4, data: { content: 'Ticket created: <#' + newChannel.id + '>', flags: 64 } });

    } catch (error) {
      console.error('[Ambrosia] select_ticket_product error:', error);
      return res.json({ type: 4, data: { content: 'Error creating ticket.', flags: 64 } });
    }
  }

  if (type === 3 && data && data.custom_id === 'close_ticket') {
    const BOT_TOKEN = getBotToken();
    const channelId = message ? message.channel_id : null;

    if (!BOT_TOKEN || !channelId) return res.json({ type: 4, data: { content: 'Cannot close ticket.', flags: 64 } });

    try {
      await fetch('https://discord.com/api/v10/channels/' + channelId, {
        method: 'DELETE',
        headers: { Authorization: 'Bot ' + BOT_TOKEN }
      });
      return res.json({ type: 4, data: { content: 'Ticket closed.', flags: 64 } });
    } catch (error) {
      return res.json({ type: 4, data: { content: 'Failed to close ticket.', flags: 64 } });
    }
  }

  return res.status(404).json({ error: 'Unknown interaction' });
};
