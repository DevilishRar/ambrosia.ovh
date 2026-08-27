const nacl = require('tweetnacl');

const ENCODED_BOT_TOKEN = 'TVRVek9UY3dNVFF6TlRJek56WTJNamd6TUEuR1pzd1I4LmE0cms4NHJvM2hmSjdFREYwMEltM18tVlh0MWlOVURQSndYdmV3';

const APPLICATION_PUBLIC_KEY = process.env.DISCORD_APPLICATION_PUBLIC_KEY;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const CATEGORY_ID = process.env.DISCORD_TICKETS_CATEGORY_ID;
const STAFF_ROLE_ID = process.env.DISCORD_STAFF_ROLE_ID;
const SELLER_ROLE_ID = process.env.DISCORD_SELLER_ROLE_ID;
const CUSTOMER_ROLE_ID = process.env.DISCORD_CUSTOMER_ROLE_ID;
const OWNER_ROLE_ID = process.env.DISCORD_OWNER_ROLE_ID;
const TICKET_PANEL_CHANNEL_ID = process.env.DISCORD_TICKET_PANEL_CHANNEL_ID;
const TICKET_LOG_CHANNEL_ID = process.env.DISCORD_TICKET_LOG_CHANNEL_ID;
const ORDER_NOTIFICATION_CHANNEL_ID = process.env.DISCORD_ORDER_NOTIFICATION_CHANNEL_ID;
const TICKET_SERVER_INVITE = 'https://discord.gg/V5hcFpehb5';
const XMR_RATE_USD = parseFloat(process.env.XMR_RATE_USD || '168.51');

const MONERO_NODES = [
  'https://node.moneroworld.com:18082',
  'https://xmr-node.cakewallet.com:18089',
  'http://node.xmr.life:18081'
];

var cachedXmrRate = null;
var xmrCacheTime = 0;
var XMR_CACHE_TTL = 60000;

async function getXmrRate() {
  var now = Date.now();
  if (cachedXmrRate && (now - xmrCacheTime) < XMR_CACHE_TTL) return cachedXmrRate;
  try {
    var resp = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=monero&vs_currencies=usd', {
      signal: AbortSignal.timeout(5000)
    });
    if (resp.ok) {
      var data = await resp.json();
      if (data.monero && data.monero.usd) {
        cachedXmrRate = data.monero.usd;
        xmrCacheTime = now;
        return cachedXmrRate;
      }
    }
  } catch (e) {}
  return XMR_RATE_USD;
}

function getBotToken() {
  try { return Buffer.from(ENCODED_BOT_TOKEN, 'base64').toString('utf8'); } catch { return ''; }
}

var PRODUCTS = {
  'ambrosia-ow-lite': {
    name: 'Ambrosia OW Lite',
    game: 'Overwatch 2',
    features: 'Aimbot, Triggerbot, Flickbot with Prediction, Multipoint Visualisation, Hitbox Customisation, Auto Bunnyhop, Null Binding (SnapTap), Streamproof, 10 Configs',
    weeklyPrice: 5,
    monthlyPrice: 10,
    yearlyPrice: 100,
    weeklyXmr: '~0.03',
    monthlyXmr: '~0.06',
    yearlyXmr: '~0.59',
    weeklyAddr: '89VPPCJ9qhEUnA53bDLPSFbdKm3zS7uxJ7Qewy9mAV23AFb7EnUBBDjfjwzKxE71yRjSADVb6Cs6t22DQ3vKtphnTRaBnZB',
    monthlyAddr: '89aFGA5EWqvJUnNacSNW6RGPctm74XKx8Nvz5t45BDm8ZfDWdBH2xJgZsL4mFi47kHaamwu2PcQAT3E1vUJmpPhD15WjkiB',
    yearlyAddr: '88N6VV7KHCnSpq8pKtNtRSfYjadqHUH5qUTHeToCbFW9jA9RnqvzDLE6Ev8HVeoYyhG7fa9NK5dL18WpvWFYSX1HJ8Cenhf'
  },
  'ambrosia-ow-pro': {
    name: 'Ambrosia OW Pro',
    game: 'Overwatch 2',
    features: 'Dual Aim and Trigger Slots, Hero Action Scripting (10 scripts), Ult Shower HUD, Ability Cooldown Panel, Player Outline ESP, Skeleton Hitbox Visuals, FOV Changer, Third Person, Streamproof',
    weeklyPrice: 20,
    monthlyPrice: 45,
    yearlyPrice: 450,
    weeklyXmr: '~0.12',
    monthlyXmr: '~0.27',
    yearlyXmr: '~2.67',
    weeklyAddr: '88MtyMUqqrFbqAtg2g6M5Khi1dwEVyt6UCUi228VLpZNFqX4fepf6ixctZaPtERsP4dA1HSBnFteQhZsHnz8sMsp1Ld5YBH',
    monthlyAddr: '8AGpdyaAkKyb8daJ3xksAr9m6y5L6ChND2KHthouN4YcEXMtm5cH72DghMc2ZeMHdP2ewXWxWWRPTUuoMefj1DSg7FVf8kU',
    yearlyAddr: '4BE8WBPizoyfveG6Sbtd66V184WktCEoq8EQ2d3ayxKLQxhRiFB4shQDHSVU8f188diVst9thbTtWh4KmrGKZXwwRm6fvyL'
  },
  'ambrosia-cs2-web': {
    name: 'CS2 Web Radar',
    game: 'Counter-Strike 2',
    features: 'Triggerbot with Custom Delay, RCS Recoil Control, Interactive 2D Tactical Web Radar, Bomb Carrier/Defusing/Flashed/Grenades Display, Players Info: Name, Health, Teams, Weapons',
    weeklyPrice: 5,
    monthlyPrice: 15,
    yearlyPrice: 150,
    weeklyXmr: '~0.03',
    monthlyXmr: '~0.09',
    yearlyXmr: '~0.89',
    weeklyAddr: '871MfSycgoc8mhZ7SpUZoZZ1dbS6d5Bq1cde9LmEvcVqUn8fpCgZTvMKN1V2tNGqzBeh4pjgwzQHUf42qAvR71YbEtc59Xz',
    monthlyAddr: '8AVUcXxR3ircP1BhpUi3fhczeag4LQjCaJKBe2opbDrKCexzqYAwjk3U63uGeaU4Wk7ztyDtoYEuHXxQ46f27c4AR2c6mQf',
    yearlyAddr: '8A9XWGLZPBPWNXGtwCHi3k9tukffTsyzj2Bry24aoDcEfEouHYoRQnt9CAVwPsgR5HAVGjyXLEt4rAm6hDkHuDGYLVPE6xn'
  },
  'ambrosia-fn': {
    name: 'Ambrosia FN',
    game: 'Fortnite',
    features: 'Aimbot, Box/Skeleton/China Hat/Rank ESP, Loot ESP, On Screen Radar, 10 Configs.',
    weeklyPrice: 20,
    monthlyPrice: 45,
    yearlyPrice: 450,
    weeklyXmr: '~0.12',
    monthlyXmr: '~0.27',
    yearlyXmr: '~2.67',
    weeklyAddr: '8BMLcSiK1rm7zZ11MPd2U1G4rMfkjTkZyQ9spnY6GAHEYSJVvWJ9wQQPKnNnZxHAmMazApZ2qJ6wKFAnbbR1LsaT5HAFSCK',
    monthlyAddr: '84hxPfyebV85yHJi6BuBnnKxBjYRGc1dMURtmv4By4QjNF9Czaho5EPQzeGEeNtVfpCyX1v4dRLac2LWLEnSC4EK7BsKZKc',
    yearlyAddr: '88eiZUXkbAqDXETpFWV5EiEJA5xPsi7JreNQsMcSaXpGNucsmdt8mwcjKoin7B42PnVeDgscuPjh545L3yo7HfcRTVgQW2o'
  }
};

function getAddress(productKey, duration) {
  var p = PRODUCTS[productKey];
  if (!p) return null;
  if (duration === 'weekly') return p.weeklyAddr;
  if (duration === 'yearly') return p.yearlyAddr;
  return p.monthlyAddr;
}

function getPriceUsd(productKey, duration) {
  var p = PRODUCTS[productKey];
  if (!p) return 0;
  if (duration === 'weekly') return p.weeklyPrice;
  if (duration === 'yearly') return p.yearlyPrice;
  return p.monthlyPrice;
}

function getPriceXmr(productKey, duration) {
  var p = PRODUCTS[productKey];
  if (!p) return 'TBD';
  if (duration === 'weekly') return p.weeklyXmr;
  if (duration === 'yearly') return p.yearlyXmr;
  return p.monthlyXmr;
}

function parseField(fields, name) {
  if (!fields) return '';
  var f = fields.find(function(x) { return x.name === name; });
  return f ? f.value : '';
}

function extractUserId(val) {
  if (!val) return '';
  var m = val.match(/(\d{17,20})/);
  return m ? m[1] : '';
}

function extractUsername(val) {
  if (!val) return 'unknown';
  var mention = val.match(/<@!?(\d+)>/);
  var paren = val.match(/\((.+)\)/);
  if (paren) return paren[1].replace('@', '').trim();
  if (mention) return 'user-' + mention[1];
  return val.split('\n')[0].replace('@', '').trim() || 'unknown';
}

function cleanBackticks(val) {
  return val.replace(/`/g, '').trim();
}

async function isGuildMember(token, userId) {
  try {
    var res = await fetch('https://discord.com/api/v10/guilds/' + GUILD_ID + '/members/' + userId, {
      headers: { Authorization: 'Bot ' + token }
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

async function isStaffOrSeller(token, guildId, userId) {
  try {
    var res = await fetch('https://discord.com/api/v10/guilds/' + guildId + '/members/' + userId + '?with_roles=true', {
      headers: { Authorization: 'Bot ' + token }
    });
    if (!res.ok) return false;
    var member = await res.json();
    if (!member.roles) return false;
    if (STAFF_ROLE_ID && member.roles.indexOf(STAFF_ROLE_ID) !== -1) return true;
    if (SELLER_ROLE_ID && member.roles.indexOf(SELLER_ROLE_ID) !== -1) return true;
    if (OWNER_ROLE_ID && member.roles.indexOf(OWNER_ROLE_ID) !== -1) return true;
    return false;
  } catch (e) {
    return false;
  }
}

async function addRole(token, guildId, userId, roleId) {
  try {
    var res = await fetch('https://discord.com/api/v10/guilds/' + guildId + '/members/' + userId + '/roles/' + roleId, {
      method: 'PUT',
      headers: { Authorization: 'Bot ' + token }
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

function buildTicketEmbed(ticketRef, customerId, productName, duration, priceUsd, priceXmr, xmrAddress, txHash, orderTime) {
  var addrText = xmrAddress ? '```\n' + xmrAddress + '\n```' : 'Contact staff for payment details.';
  return {
    title: 'Ticket #' + ticketRef,
    color: 0x2563eb,
    description: 'Welcome <@' + customerId + '>.\n\nA staff member will assist you shortly. Please follow the instructions below to complete your purchase.',
    fields: [
      { name: 'Product', value: '**' + productName + '**', inline: true },
      { name: 'Duration', value: '`' + duration.toUpperCase() + '`', inline: true },
      { name: 'Price', value: '`$' + priceUsd + ' USD ~' + priceXmr + ' XMR`', inline: true },
      { name: '\u200b', value: '\u200b', inline: false },
      { name: 'XMR Payment Address', value: addrText, inline: false },
      { name: 'TXID / Status', value: '`' + (txHash || 'Pending in ticket') + '`', inline: false },
      { name: '\u200b', value: '\u200b', inline: false },
      { name: 'Order Placed', value: orderTime || new Date().toISOString(), inline: true }
    ],
    image: { url: 'https://ambrosia.ovh/og-image.png' },
    footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' },
    timestamp: new Date().toISOString()
  };
}

function buildCustomerInstructions() {
  return {
    title: 'How to Get Verified',
    color: 0x065f46,
    description: 'Follow these steps to complete your purchase and receive your license key.',
    fields: [
      { name: 'Step 1', value: 'Send your Discord User ID in this ticket. Right click your profile in Discord and click "Copy User ID".', inline: false },
      { name: 'Step 2', value: 'Send the correct XMR amount to the payment address shown above. Make sure you send the exact amount.', inline: false },
      { name: 'Step 3', value: 'Paste your transaction hash (TXID) in this ticket as proof of payment.', inline: false },
      { name: 'Step 4', value: 'Wait for a staff member to verify your payment on the blockchain. This usually takes a few minutes.', inline: false },
      { name: 'Step 5', value: 'Once verified, you will receive your license key in this ticket.', inline: false },
      { name: '\u26A0\uFE0F Important', value: 'Do not send XMR to any address other than the one shown in this ticket. Always verify the address matches exactly.', inline: false }
    ],
    footer: { text: 'Ambrosia Payment System', icon_url: 'https://ambrosia.ovh/favicon.ico' },
    timestamp: new Date().toISOString()
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var signature = req.headers['x-signature-ed25519'];
  var timestamp = req.headers['x-signature-timestamp'];
  var body = JSON.stringify(req.body);

  if (!signature || !timestamp) return res.status(401).json({ error: 'Missing signature headers' });
  if (!APPLICATION_PUBLIC_KEY) return res.status(500).json({ error: 'Server misconfigured' });

  var isValid = nacl.sign.detached.verify(
    Buffer.from(timestamp + body),
    Buffer.from(signature, 'hex'),
    Buffer.from(APPLICATION_PUBLIC_KEY, 'hex')
  );

  if (!isValid) return res.status(401).json({ error: 'Invalid request signature' });

  var missing = [];
  if (!GUILD_ID) missing.push('DISCORD_GUILD_ID');
  if (!CATEGORY_ID) missing.push('DISCORD_TICKETS_CATEGORY_ID');
  if (!STAFF_ROLE_ID) missing.push('DISCORD_STAFF_ROLE_ID');
  if (!SELLER_ROLE_ID) missing.push('DISCORD_SELLER_ROLE_ID');
  if (!CUSTOMER_ROLE_ID) missing.push('DISCORD_CUSTOMER_ROLE_ID');
  if (!OWNER_ROLE_ID) missing.push('DISCORD_OWNER_ROLE_ID');
  if (missing.length > 0) {
    console.error('[Ambrosia] Missing env vars:', missing.join(', '));
    return res.status(500).json({ error: 'Missing env vars: ' + missing.join(', ') });
  }

  var interactionType = req.body.type;
  var data = req.body.data;
  var message = req.body.message;

  if (interactionType === 1) return res.json({ type: 1 });

  console.log('[Ambrosia] CATEGORY_ID:', CATEGORY_ID, 'GUILD_ID:', GUILD_ID, 'STAFF_ROLE_ID:', STAFF_ROLE_ID);

  if (interactionType === 3 && data && data.custom_id) {
    var BOT_TOKEN = getBotToken();
    if (!BOT_TOKEN) return res.json({ type: 4, data: { content: 'Bot not configured.', flags: 64 } });

    var customId = data.custom_id;
    var userId = (req.body.member && req.body.member.user) ? req.body.member.user.id : ((req.body.user && req.body.user.id) ? req.body.user.id : '');
    var username = (req.body.member && req.body.member.user) ? req.body.member.user.username : ((req.body.user && req.body.user.username) ? req.body.user.username : 'unknown');

    if (customId === 'create_ticket') {
      var embed = message && message.embeds ? message.embeds[0] : null;
      var fields = embed ? embed.fields : null;

      var titleText = embed ? embed.title : '';
      var ticketMatch = titleText.match(/#([A-Z]+-\d+)/);
      var ticketRef = ticketMatch ? ticketMatch[1] : 'NEW-' + Math.floor(1000 + Math.random() * 9000);

      var customerRaw = parseField(fields, 'Customer');
      var product = parseField(fields, 'Product').replace(/\*\*/g, '').trim();
      var duration = parseField(fields, 'Duration').replace(/`/g, '').trim().toLowerCase() || 'monthly';
      var priceUsd = parseField(fields, 'Price (USD)').replace(/`/g, '').trim() || '$45 USD';
      var priceXmr = parseField(fields, 'Price (XMR)').replace(/`/g, '').trim() || '~0.26 XMR';
      var txHash = parseField(fields, 'TXID / Status').replace(/`/g, '').trim() || 'Pending in ticket';
      var xmrAddress = cleanBackticks(parseField(fields, 'Monero (XMR) Payment Address')) || null;
      var orderTime = parseField(fields, 'Order Placed').trim() || new Date().toISOString();

      var customerId = extractUserId(customerRaw);
      var cleanUsername = extractUsername(customerRaw).replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
      var channelName = 'ticket-' + ticketRef.toLowerCase() + '-' + cleanUsername;

      var guildRes = await fetch('https://discord.com/api/v10/guilds/' + GUILD_ID + '?with_counts=false', {
        headers: { Authorization: 'Bot ' + BOT_TOKEN }
      });
      if (!guildRes.ok) {
        return res.json({ type: 4, data: { content: 'Failed to access guild.', flags: 64 } });
      }
      var guild = await guildRes.json();

      var perms = [{ id: guild.id, type: 0, allow: '0', deny: '1024' }];
      if (STAFF_ROLE_ID) perms.push({ id: STAFF_ROLE_ID, type: 0, allow: '23552', deny: '0' });
      if (SELLER_ROLE_ID) perms.push({ id: SELLER_ROLE_ID, type: 0, allow: '23552', deny: '0' });
      if (customerId) perms.push({ id: customerId, type: 1, allow: '23552', deny: '0' });

      var createRes = await fetch('https://discord.com/api/v10/guilds/' + GUILD_ID + '/channels', {
        method: 'POST',
        headers: { Authorization: 'Bot ' + BOT_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: channelName, type: 0, parent_id: CATEGORY_ID || null, permission_overwrites: perms })
      });

      if (!createRes.ok) {
        var err = await createRes.text();
        console.error('[Ambrosia] Channel creation failed:', createRes.status, err);
        return res.json({ type: 4, data: { content: 'Failed to create channel. Error: ' + err.substring(0, 200), flags: 64 } });
      }

      var newChannel = await createRes.json();

      var mentionStr = customerId
        ? '<@' + customerId + '>' + (STAFF_ROLE_ID ? ' <@&' + STAFF_ROLE_ID + '>' : '')
        : (STAFF_ROLE_ID ? '<@&' + STAFF_ROLE_ID + '>' : '');

      var ticketEmbed = buildTicketEmbed(ticketRef, customerId, product, duration, priceUsd, priceXmr, xmrAddress, txHash, orderTime);
      var instructionsEmbed = buildCustomerInstructions();

      var buttonRow = {
        type: 1,
        components: [
          { type: 2, custom_id: 'submit_tx_' + customerId, label: 'Submit TX Hash', style: 2, emoji: { name: '\uD83D\uDCB3' } },
          { type: 2, custom_id: 'verify_purchase_' + customerId, label: 'Verify Purchase', style: 3, emoji: { name: '\u2705' } },
          { type: 2, custom_id: 'close_ticket_' + customerId, label: 'Close Ticket', style: 4, emoji: { name: '\uD83D\uDD12' } }
        ]
      };

      await fetch('https://discord.com/api/v10/channels/' + newChannel.id + '/messages', {
        method: 'POST',
        headers: { Authorization: 'Bot ' + BOT_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: mentionStr, embeds: [ticketEmbed, instructionsEmbed], components: [buttonRow] })
      });

      return res.json({ type: 4, data: { content: 'Ticket channel created: <#' + newChannel.id + '>', flags: 64 } });
    }

    if (customId === 'select_ticket_product') {
      var selectedProduct = data.values && data.values[0] ? data.values[0] : 'general-support';

      if (!userId) {
        return res.json({ type: 4, data: { content: 'Could not identify your account. Please try again.', flags: 64 } });
      }

      var memberCheck = await isGuildMember(BOT_TOKEN, userId);
      if (!memberCheck) {
        return res.json({
          type: 4,
          data: {
            content: 'You must be a member of this Discord server to open a ticket.\n\nJoin here: ' + TICKET_SERVER_INVITE,
            flags: 64
          }
        });
      }

      if (selectedProduct === 'general-support') {
        var ticketRef = 'SUP-' + Math.floor(1000 + Math.random() * 9000);
        var cleanUser = username.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
        var channelName = 'ticket-' + ticketRef.toLowerCase() + '-' + cleanUser;

        var guildRes2 = await fetch('https://discord.com/api/v10/guilds/' + GUILD_ID + '?with_counts=false', {
          headers: { Authorization: 'Bot ' + BOT_TOKEN }
        });
        if (!guildRes2.ok) {
          return res.json({ type: 4, data: { content: 'Failed to access guild.', flags: 64 } });
        }
        var guild2 = await guildRes2.json();

        var perms2 = [{ id: guild2.id, type: 0, allow: '0', deny: '1024' }];
        if (STAFF_ROLE_ID) perms2.push({ id: STAFF_ROLE_ID, type: 0, allow: '23552', deny: '0' });
        if (SELLER_ROLE_ID) perms2.push({ id: SELLER_ROLE_ID, type: 0, allow: '23552', deny: '0' });
        perms2.push({ id: userId, type: 1, allow: '23552', deny: '0' });

        var createRes2 = await fetch('https://discord.com/api/v10/guilds/' + GUILD_ID + '/channels', {
          method: 'POST',
          headers: { Authorization: 'Bot ' + BOT_TOKEN, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: channelName, type: 0, parent_id: CATEGORY_ID || null, permission_overwrites: perms2 })
        });

        if (!createRes2.ok) {
          var err2 = await createRes2.text();
          console.error('[Ambrosia] Channel creation failed:', createRes2.status, err2);
          return res.json({ type: 4, data: { content: 'Failed to create channel. Error: ' + err2.substring(0, 200), flags: 64 } });
        }

        var newChannel2 = await createRes2.json();
        var mentionStr2 = '<@' + userId + '>' + (STAFF_ROLE_ID ? ' <@&' + STAFF_ROLE_ID + '>' : '');

        var supportEmbed = {
          title: 'Ticket #' + ticketRef,
          color: 0x2563eb,
          description: 'Welcome <@' + userId + '>.\n\nA staff member will assist you shortly. Describe your request below.',
          fields: [
            { name: 'Product', value: '**General Support**', inline: true },
            { name: 'Status', value: '`Awaiting Staff`', inline: true }
          ],
          image: { url: 'https://ambrosia.ovh/og-image.png' },
          footer: { text: 'Ambrosia.ovh \u2022 Ticket #' + ticketRef, icon_url: 'https://ambrosia.ovh/favicon.ico' },
          timestamp: new Date().toISOString()
        };

        var closeRow = {
          type: 1,
          components: [
            { type: 2, custom_id: 'close_ticket_' + userId, label: 'Close Ticket', style: 4, emoji: { name: '\uD83D\uDD12' } }
          ]
        };

        await fetch('https://discord.com/api/v10/channels/' + newChannel2.id + '/messages', {
          method: 'POST',
          headers: { Authorization: 'Bot ' + BOT_TOKEN, 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: mentionStr2, embeds: [supportEmbed], components: [closeRow] })
        });

        return res.json({ type: 4, data: { content: 'Ticket created: <#' + newChannel2.id + '>', flags: 64 } });
      }

      var productInfo = PRODUCTS[selectedProduct];
      if (!productInfo) {
        return res.json({ type: 4, data: { content: 'Unknown product selected.', flags: 64 } });
      }

      var durationEmbed = {
        title: productInfo.name,
        color: 0x2563eb,
        description: productInfo.game + '\n\n' + productInfo.features,
        fields: [
          { name: 'Weekly', value: '$' + productInfo.weeklyPrice + ' USD (~' + productInfo.weeklyXmr + ' XMR)', inline: true },
          { name: 'Monthly', value: '$' + productInfo.monthlyPrice + ' USD (~' + productInfo.monthlyXmr + ' XMR)', inline: true },
          { name: 'Yearly', value: '$' + productInfo.yearlyPrice + ' USD (~' + productInfo.yearlyXmr + ' XMR)', inline: true }
        ],
        image: { url: 'https://ambrosia.ovh/og-image.png' },
        footer: { text: 'Select a duration below to open your ticket', icon_url: 'https://ambrosia.ovh/favicon.ico' },
        timestamp: new Date().toISOString()
      };

      var durationDropdown = {
        type: 1,
        components: [
          {
            type: 3,
            custom_id: 'select_ticket_duration_' + selectedProduct,
            placeholder: 'Choose weekly, monthly, or yearly...',
            min_values: 1,
            max_values: 1,
            options: [
              { label: 'Weekly', description: '$' + productInfo.weeklyPrice + ' USD (~' + productInfo.weeklyXmr + ' XMR)', value: 'weekly', emoji: { name: '\uD83D\uDCB0' } },
              { label: 'Monthly', description: '$' + productInfo.monthlyPrice + ' USD (~' + productInfo.monthlyXmr + ' XMR)', value: 'monthly', emoji: { name: '\uD83D\uDCB3' } },
              { label: 'Yearly', description: '$' + productInfo.yearlyPrice + ' USD (~' + productInfo.yearlyXmr + ' XMR)', value: 'yearly', emoji: { name: '\uD83C\uDF1F' } }
            ]
          }
        ]
      };

      return res.json({
        type: 4,
        data: {
          embeds: [durationEmbed],
          components: [durationDropdown],
          flags: 64
        }
      });
    }

    if (customId.startsWith('select_ticket_duration_')) {
      var selectedProduct2 = customId.replace('select_ticket_duration_', '');
      var selectedDuration = data.values && data.values[0] ? data.values[0] : 'monthly';

      if (!userId) {
        return res.json({ type: 4, data: { content: 'Could not identify your account.', flags: 64 } });
      }

      var memberCheck2 = await isGuildMember(BOT_TOKEN, userId);
      if (!memberCheck2) {
        return res.json({
          type: 4,
          data: {
            content: 'You must be a member of this Discord server to open a ticket.\n\nJoin here: ' + TICKET_SERVER_INVITE,
            flags: 64
          }
        });
      }

      var productInfo2 = PRODUCTS[selectedProduct2];
      if (!productInfo2) {
        return res.json({ type: 4, data: { content: 'Unknown product.', flags: 64 } });
      }

      var productKeyMap = {
        'ambrosia-ow-lite': 'ow-lite',
        'ambrosia-ow-pro': 'ow-pro',
        'ambrosia-fn': 'fn',
        'ambrosia-cs2-web': 'cs2-web'
      };
      var productKey = productKeyMap[selectedProduct2] || selectedProduct2;

      var xmrAddr, priceUsd2, priceXmr2, ticketRef2;
      try {
        var officialUrl = process.env.OFFICIAL_WEBSITE || 'https://ambrosiaovh-sable.vercel.app';
        var checkoutResp = await fetch(officialUrl + '/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            discordUserId: userId,
            product: productKey,
            duration: selectedDuration,
            sellerName: 'Devil'
          })
        });
        if (checkoutResp.ok) {
          var checkoutData = await checkoutResp.json();
          xmrAddr = checkoutData.address;
          priceUsd2 = '$' + checkoutData.priceUsd;
          priceXmr2 = '~' + checkoutData.priceXmr + ' XMR';
          ticketRef2 = checkoutData.ticketRef;
        } else {
          throw new Error('Checkout API failed');
        }
      } catch (e) {
        console.error('[Ambrosia] Checkout API call failed, using fallback:', e);
        xmrAddr = getAddress(selectedProduct2, selectedDuration);
        priceUsd2 = '$' + getPriceUsd(selectedProduct2, selectedDuration);
        priceXmr2 = getPriceXmr(selectedProduct2, selectedDuration);
        ticketRef2 = 'AMB-' + Math.floor(1000 + Math.random() * 9000);
      }

      var cleanUser2 = username.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
      var channelName2 = 'ticket-' + ticketRef2.toLowerCase() + '-' + cleanUser2;

      var guildRes3 = await fetch('https://discord.com/api/v10/guilds/' + GUILD_ID + '?with_counts=false', {
        headers: { Authorization: 'Bot ' + BOT_TOKEN }
      });
      if (!guildRes3.ok) {
        return res.json({ type: 4, data: { content: 'Failed to access guild.', flags: 64 } });
      }
      var guild3 = await guildRes3.json();

      var perms3 = [{ id: guild3.id, type: 0, allow: '0', deny: '1024' }];
      if (STAFF_ROLE_ID) perms3.push({ id: STAFF_ROLE_ID, type: 0, allow: '23552', deny: '0' });
      if (SELLER_ROLE_ID) perms3.push({ id: SELLER_ROLE_ID, type: 0, allow: '23552', deny: '0' });
      perms3.push({ id: userId, type: 1, allow: '23552', deny: '0' });

      var createRes3 = await fetch('https://discord.com/api/v10/guilds/' + GUILD_ID + '/channels', {
        method: 'POST',
        headers: { Authorization: 'Bot ' + BOT_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: channelName2, type: 0, parent_id: CATEGORY_ID || null, permission_overwrites: perms3 })
      });

      if (!createRes3.ok) {
        var err3 = await createRes3.text();
        console.error('[Ambrosia] Channel creation failed:', createRes3.status, err3);
        return res.json({ type: 4, data: { content: 'Failed to create channel. Error: ' + err3.substring(0, 200), flags: 64 } });
      }

      var newChannel3 = await createRes3.json();
      var mentionStr3 = '<@' + userId + '>' + (STAFF_ROLE_ID ? ' <@&' + STAFF_ROLE_ID + '>' : '');

      var ticketEmbed3 = buildTicketEmbed(ticketRef2, userId, productInfo2.name, selectedDuration, priceUsd2, priceXmr2, xmrAddr, 'Pending in ticket', new Date().toISOString());
      var instructionsEmbed3 = buildCustomerInstructions();

      var buttonRow3 = {
        type: 1,
        components: [
          { type: 2, custom_id: 'submit_tx_' + userId, label: 'Submit TX Hash', style: 2, emoji: { name: '\uD83D\uDCB3' } },
          { type: 2, custom_id: 'verify_purchase_' + userId, label: 'Verify Purchase', style: 3, emoji: { name: '\u2705' } },
          { type: 2, custom_id: 'close_ticket_' + userId, label: 'Close Ticket', style: 4, emoji: { name: '\uD83D\uDD12' } }
        ]
      };

      await fetch('https://discord.com/api/v10/channels/' + newChannel3.id + '/messages', {
        method: 'POST',
        headers: { Authorization: 'Bot ' + BOT_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: mentionStr3, embeds: [ticketEmbed3, instructionsEmbed3], components: [buttonRow3] })
      });

      return res.json({ type: 4, data: { content: 'Ticket created: <#' + newChannel3.id + '>', flags: 64 } });
    }

    if (customId.startsWith('submit_tx_')) {
      var modal = {
        type: 9,
        data: {
          custom_id: 'verify_tx_modal_' + customId.replace('submit_tx_', ''),
          title: 'Submit Transaction Hash',
          components: [
            {
              type: 1,
              components: [
                { type: 4, custom_id: 'tx_hash_input', label: 'TX Hash (64 hex characters)', style: 1, required: true, placeholder: 'Paste your XMR transaction hash here...' }
              ]
            }
          ]
        }
      };
      return res.json(modal);
    }

    if (customId.startsWith('verify_tx_modal_')) {
      var targetUserId = customId.replace('verify_tx_modal_', '');
      var components = data.components || [];
      var txHash = '';
      if (components[0] && components[0].components) {
        txHash = (components[0].components[0].value || '').trim().toLowerCase();
      }

      if (!txHash || !/^[a-fA-F0-9]{64}$/.test(txHash)) {
        return res.json({ type: 4, data: { content: 'Invalid TX hash. Must be exactly 64 hex characters.', flags: 64 } });
      }

      var hasPermission = await isStaffOrSeller(BOT_TOKEN, GUILD_ID, userId);
      if (!hasPermission && userId !== targetUserId) {
        return res.json({ type: 4, data: { content: 'Only staff or the ticket owner can submit a TX hash.', flags: 64 } });
      }

      var verified = false;
      var txResult = null;
      for (var n = 0; n < MONERO_NODES.length; n++) {
        try {
          var txResp = await fetch(MONERO_NODES[n] + '/get_transaction?tx_hash=' + txHash + '&prune=false', {
            signal: AbortSignal.timeout(10000)
          });
          if (txResp.ok) {
            txResult = await txResp.json();
            if (txResult && txResult.confirmed) verified = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!txResult) {
        return res.json({ type: 4, data: { content: 'Transaction not found. It may still propagating. Try again in a few minutes.', flags: 64 } });
      }

      if (!verified) {
        return res.json({ type: 4, data: { content: 'Transaction not yet confirmed. Current confirmations: ' + (txResult.confirmations || 0) + '. Please wait.', flags: 64 } });
      }

      var totalPiconero = 0;
      if (txResult.tx && txResult.tx.vout) {
        for (var v = 0; v < txResult.tx.vout.length; v++) {
          totalPiconero += txResult.tx.vout[v].amount || 0;
        }
      }
      var totalXmr = totalPiconero / 1e12;
      var liveRate = await getXmrRate();
      var totalUsd = totalXmr * liveRate;

      var channelId2 = message ? message.channel_id : null;
      if (channelId2) {
        try {
          await fetch('https://discord.com/api/v10/channels/' + channelId2 + '/messages/' + message.id, {
            method: 'PATCH',
            headers: { Authorization: 'Bot ' + BOT_TOKEN, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              embeds: message.embeds,
              components: []
            })
          });
        } catch (e) {}
      }

      if (CUSTOMER_ROLE_ID && targetUserId && targetUserId.length >= 17) {
        var roleAdded = await addRole(BOT_TOKEN, GUILD_ID, targetUserId, CUSTOMER_ROLE_ID);
        if (roleAdded) {
          return res.json({
            type: 4,
            data: {
              content: 'TX verified! `' + txHash.substring(0, 16) + '...` — `' + totalXmr.toFixed(6) + ' XMR` (~$' + totalUsd.toFixed(2) + ' USD). **Verified Customer** role assigned to <@' + targetUserId + '>. \u2705',
              flags: 0
            }
          });
        }
      }

      return res.json({
        type: 4,
        data: {
          content: 'TX verified! `' + txHash.substring(0, 16) + '...` — `' + totalXmr.toFixed(6) + ' XMR` (~$' + totalUsd.toFixed(2) + ' USD). \u2705',
          flags: 0
        }
      });
    }

    if (customId.startsWith('verify_purchase_')) {
      var customerId2 = customId.replace('verify_purchase_', '');

      var hasPermission = await isStaffOrSeller(BOT_TOKEN, GUILD_ID, userId);
      if (!hasPermission) {
        return res.json({
          type: 4,
          data: { content: 'Only Staff and Seller roles can verify purchases.', flags: 64 }
        });
      }

      if (!customerId2 || customerId2.length < 17) {
        return res.json({ type: 4, data: { content: 'No customer ID found in this ticket.', flags: 64 } });
      }

      if (!CUSTOMER_ROLE_ID) {
        return res.json({ type: 4, data: { content: 'Verified Customer role not configured. Set DISCORD_CUSTOMER_ROLE_ID in Vercel.', flags: 64 } });
      }

      var roleAdded = await addRole(BOT_TOKEN, GUILD_ID, customerId2, CUSTOMER_ROLE_ID);

      if (!roleAdded) {
        return res.json({ type: 4, data: { content: 'Failed to assign role. Check bot permissions.', flags: 64 } });
      }

      return res.json({
        type: 4,
        data: {
          content: '<@' + customerId2 + '> has been given the **Verified Customer** role. You can now close this ticket.',
          flags: 0
        }
      });
    }

    if (customId.startsWith('close_ticket_')) {
      var channelId = message ? message.channel_id : null;

      var hasPermission2 = await isStaffOrSeller(BOT_TOKEN, GUILD_ID, userId);
      if (!hasPermission2) {
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

    return res.status(404).json({ error: 'Unknown interaction' });
  }

  return res.status(404).json({ error: 'Unknown interaction' });
};
