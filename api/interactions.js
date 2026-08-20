const nacl = require('tweetnacl');

const ENCODED_BOT_TOKEN = 'TVRVek9UY3dNVFF6TlRJek56WTJNamd6TUEuR1pzd1I4LmE0cms4NHJvM2hmSjdFREYwMEltM18tVlh0MWlOVURQSndYdmV3';

const APPLICATION_PUBLIC_KEY = process.env.DISCORD_APPLICATION_PUBLIC_KEY || 'b9f4224b6bcc697b8d910f4095fb586c987552a63c2b53b945880f0ec5c29454';
const GUILD_ID = process.env.DISCORD_GUILD_ID || '1539404742055166045';
const CATEGORY_ID = process.env.DISCORD_TICKETS_CATEGORY_ID || '1539707872416636939';
const STAFF_ROLE_ID = process.env.DISCORD_STAFF_ROLE_ID || '1539709640240005220';
const SELLER_ROLE_ID = process.env.DISCORD_SELLER_ROLE_ID || '';
const CUSTOMER_ROLE_ID = process.env.DISCORD_CUSTOMER_ROLE_ID || '';
const DISCORD_INVITE = 'https://discord.gg/bT9dpnerP4';

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

async function isGuildMember(token, userId) {
  try {
    const res = await fetch('https://discord.com/api/v10/guilds/' + GUILD_ID + '/members/' + userId, {
      headers: { Authorization: 'Bot ' + token }
    });
    return res.ok;
  } catch (e) {
    console.error('[Ambrosia] Membership check failed:', e);
    return false;
  }
}

async function isStaffOrSeller(token, guildId, userId) {
  try {
    const res = await fetch('https://discord.com/api/v10/guilds/' + guildId + '/members/' + userId + '?with_roles=true', {
      headers: { Authorization: 'Bot ' + token }
    });
    if (!res.ok) return false;
    const member = await res.json();
    if (!member.roles) return false;
    if (STAFF_ROLE_ID && member.roles.indexOf(STAFF_ROLE_ID) !== -1) return true;
    if (SELLER_ROLE_ID && member.roles.indexOf(SELLER_ROLE_ID) !== -1) return true;
    return false;
  } catch (e) {
    console.error('[Ambrosia] Role check failed:', e);
    return false;
  }
}

async function addRole(token, guildId, userId, roleId) {
  try {
    const res = await fetch('https://discord.com/api/v10/guilds/' + guildId + '/members/' + userId + '/roles/' + roleId, {
      method: 'PUT',
      headers: { Authorization: 'Bot ' + token }
    });
    return res.ok;
  } catch (e) {
    console.error('[Ambrosia] Add role failed:', e);
    return false;
  }
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

  if (type === 3 && data && data.custom_id) {
    const BOT_TOKEN = getBotToken();
    if (!BOT_TOKEN) return res.json({ type: 4, data: { content: 'Bot not configured.', flags: 64 } });

    const customId = data.custom_id;
    const userId = (req.body.member && req.body.member.user) ? req.body.member.user.id : ((req.body.user && req.body.user.id) ? req.body.user.id : '');
    const username = (req.body.member && req.body.member.user) ? req.body.member.user.username : ((req.body.user && req.body.user.username) ? req.body.user.username : 'unknown');

    if (customId === 'create_ticket') {
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
        return res.json({ type: 4, data: { content: 'Failed to access guild.', flags: 64 } });
      }
      const guild = await guildRes.json();

      const perms = [{ id: guild.id, type: 0, allow: '0', deny: '1024' }];
      if (STAFF_ROLE_ID) perms.push({ id: STAFF_ROLE_ID, type: 0, allow: '23552', deny: '0' });
      if (SELLER_ROLE_ID) perms.push({ id: SELLER_ROLE_ID, type: 0, allow: '23552', deny: '0' });
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

      const welcomeEmbed = {
        title: 'Ticket #' + ticketRef,
        color: 0x2563eb,
        description: 'Welcome ' + (customerId ? '<@' + customerId + '>' : '**' + customerRaw + '**') + '.\n\nA staff member will assist you shortly. Please share your Discord User ID and send your XMR payment in this channel.',
        fields: [
          { name: 'Product', value: '**' + product + '**', inline: true },
          { name: 'Duration', value: '`' + duration.toUpperCase() + '`', inline: true },
          { name: 'Price', value: '`' + priceUsd + ' ~' + priceXmr + '`', inline: true },
          { name: '\u200b', value: '\u200b', inline: false },
          { name: 'XMR Payment Address', value: '```\n' + xmrAddress + '\n```', inline: false },
          { name: 'TXID / Status', value: '`' + txHash + '`', inline: false },
          { name: '\u200b', value: '\u200b', inline: false },
          { name: 'Order Placed', value: orderTime, inline: true }
        ],
        image: { url: 'https://ambrosia.ovh/og-image.png' },
        footer: { text: 'Ambrosia.ovh \u2022 Staff Only: Verify Purchase then Close Ticket', icon_url: 'https://ambrosia.ovh/favicon.ico' },
        timestamp: new Date().toISOString()
      };

      const buttonRow = {
        type: 1,
        components: [
          { type: 2, custom_id: 'verify_purchase_' + customerId, label: 'Verify Purchase', style: 3, emoji: { name: '\u2705' } },
          { type: 2, custom_id: 'close_ticket_' + customerId, label: 'Close Ticket', style: 4, emoji: { name: '\uD83D\uDD12' } }
        ]
      };

      await fetch('https://discord.com/api/v10/channels/' + newChannel.id + '/messages', {
        method: 'POST',
        headers: { Authorization: 'Bot ' + BOT_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: mentionStr, embeds: [welcomeEmbed], components: [buttonRow] })
      });

      return res.json({ type: 4, data: { content: 'Ticket channel created: <#' + newChannel.id + '>', flags: 64 } });
    }

    if (customId.startsWith('verify_purchase_')) {
      const customerId = customId.replace('verify_purchase_', '');

      const hasPermission = await isStaffOrSeller(BOT_TOKEN, GUILD_ID, userId);
      if (!hasPermission) {
        return res.json({
          type: 4,
          data: { content: 'Only Staff and Seller roles can verify purchases.', flags: 64 }
        });
      }

      if (!customerId || customerId.length < 17) {
        return res.json({ type: 4, data: { content: 'No customer ID found in this ticket.', flags: 64 } });
      }

      if (!CUSTOMER_ROLE_ID) {
        return res.json({ type: 4, data: { content: 'Verified Customer role not configured. Set DISCORD_CUSTOMER_ROLE_ID in Vercel.', flags: 64 } });
      }

      const roleAdded = await addRole(BOT_TOKEN, GUILD_ID, customerId, CUSTOMER_ROLE_ID);

      if (!roleAdded) {
        return res.json({ type: 4, data: { content: 'Failed to assign role. Check bot permissions.', flags: 64 } });
      }

      let customerName = 'Unknown';
      try {
        const userRes = await fetch('https://discord.com/api/v10/users/' + customerId, {
          headers: { Authorization: 'Bot ' + BOT_TOKEN }
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          customerName = userData.username || 'Unknown';
        }
      } catch (e) {}

      return res.json({
        type: 4,
        data: {
          content: '<@' + customerId + '> has been given the **Verified Customer** role. You can now close this ticket.',
          flags: 0
        }
      });
    }

    if (customId.startsWith('close_ticket_')) {
      const customerId = customId.replace('close_ticket_', '');
      const channelId = message ? message.channel_id : null;

      const hasPermission = await isStaffOrSeller(BOT_TOKEN, GUILD_ID, userId);
      if (!hasPermission) {
        return res.json({
          type: 4,
          data: { content: 'Only Staff and Seller roles can close tickets.', flags: 64 }
        });
      }

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

    if (customId === 'select_ticket_product') {
      const selectedValue = data.values && data.values[0] ? data.values[0] : 'general-support';

      if (!userId) {
        return res.json({ type: 4, data: { content: 'Could not identify your account. Please try again.', flags: 64 } });
      }

      const memberCheck = await isGuildMember(BOT_TOKEN, userId);
      if (!memberCheck) {
        return res.json({
          type: 4,
          data: {
            content: 'You must be a member of this Discord server to open a ticket.\n\nJoin here: ' + DISCORD_INVITE,
            flags: 64
          }
        });
      }

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
          return res.json({ type: 4, data: { content: 'Failed to access guild.', flags: 64 } });
        }
        const guild = await guildRes.json();

        const perms = [{ id: guild.id, type: 0, allow: '0', deny: '1024' }];
        if (STAFF_ROLE_ID) perms.push({ id: STAFF_ROLE_ID, type: 0, allow: '23552', deny: '0' });
        if (SELLER_ROLE_ID) perms.push({ id: SELLER_ROLE_ID, type: 0, allow: '23552', deny: '0' });
        perms.push({ id: userId, type: 1, allow: '23552', deny: '0' });

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

        const mentionStr = '<@' + userId + '>' + (STAFF_ROLE_ID ? ' <@&' + STAFF_ROLE_ID + '>' : '');

        const welcomeEmbed = {
          title: 'Ticket #' + ticketRef,
          color: 0x2563eb,
          description: 'Welcome <@' + userId + '>.\n\nA staff member will assist you shortly. Describe your request below.',
          fields: [
            { name: 'Product', value: '**' + productName + '**', inline: true },
            { name: 'Status', value: '`Awaiting Staff`', inline: true },
            { name: '\u200b', value: '\u200b', inline: false },
            { name: 'Next Steps', value: '1. Describe what you need help with\n2. Wait for a staff member to respond\n3. Send your XMR payment when ready\n4. Receive your license key', inline: false }
          ],
          image: { url: 'https://ambrosia.ovh/og-image.png' },
          footer: { text: 'Ambrosia.ovh \u2022 Ticket #' + ticketRef, icon_url: 'https://ambrosia.ovh/favicon.ico' },
          timestamp: new Date().toISOString()
        };

        const buttonRow = {
          type: 1,
          components: [
            { type: 2, custom_id: 'verify_purchase_' + userId, label: 'Verify Purchase', style: 3, emoji: { name: '\u2705' } },
            { type: 2, custom_id: 'close_ticket_' + userId, label: 'Close Ticket', style: 4, emoji: { name: '\uD83D\uDD12' } }
          ]
        };

        await fetch('https://discord.com/api/v10/channels/' + newChannel.id + '/messages', {
          method: 'POST',
          headers: { Authorization: 'Bot ' + BOT_TOKEN, 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: mentionStr, embeds: [welcomeEmbed], components: [buttonRow] })
        });

        return res.json({ type: 4, data: { content: 'Ticket created: <#' + newChannel.id + '>', flags: 64 } });

      } catch (error) {
        console.error('[Ambrosia] select_ticket_product error:', error);
        return res.json({ type: 4, data: { content: 'Error creating ticket.', flags: 64 } });
      }
    }

    return res.status(404).json({ error: 'Unknown interaction' });
  }

  return res.status(404).json({ error: 'Unknown interaction' });
};
