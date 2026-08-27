const nacl = require('tweetnacl');
const tracking = require('../lib/tracking-store.js');
const checkoutLogic = require('../lib/checkout-logic.js');

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
var FALLBACK_RATE = parseFloat(process.env.XMR_RATE_USD || '168.51');

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
  return FALLBACK_RATE;
}

var trackedAddresses = tracking.trackedAddresses;

function trackAddress(address, userId, ticketRef, product, duration, priceUsd, priceXmr, channelId) {
  tracking.trackAddress(address, userId, ticketRef, product, duration, priceUsd, priceXmr, channelId);
}

function closeTicketTracking(channelId) {
  return tracking.closeTicketTracking(channelId);
}

function getActiveTracking() {
  return tracking.getActiveTracking();
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
    yearlyPrice: 100
  },
  'ambrosia-ow-pro': {
    name: 'Ambrosia OW Pro',
    game: 'Overwatch 2',
    features: 'Dual Aim and Trigger Slots, Hero Action Scripting (10 scripts), Ult Shower HUD, Ability Cooldown Panel, Player Outline ESP, Skeleton Hitbox Visuals, FOV Changer, Third Person, Streamproof',
    weeklyPrice: 20,
    monthlyPrice: 45,
    yearlyPrice: 450
  },
  'ambrosia-cs2-web': {
    name: 'CS2 Web Radar',
    game: 'Counter-Strike 2',
    features: 'Triggerbot with Custom Delay, RCS Recoil Control, Interactive 2D Tactical Web Radar, Bomb Carrier/Defusing/Flashed/Grenades Display, Players Info: Name, Health, Teams, Weapons',
    weeklyPrice: 5,
    monthlyPrice: 15,
    yearlyPrice: 150
  },
  'ambrosia-fn': {
    name: 'Ambrosia FN',
    game: 'Fortnite',
    features: 'Aimbot, Box/Skeleton/China Hat/Rank ESP, Loot ESP, On Screen Radar, 10 Configs.',
    weeklyPrice: 20,
    monthlyPrice: 45,
    yearlyPrice: 450
  }
};

function getPriceUsd(productKey, duration) {
  var p = PRODUCTS[productKey];
  if (!p) return 0;
  if (duration === 'weekly') return p.weeklyPrice;
  if (duration === 'yearly') return p.yearlyPrice;
  return p.monthlyPrice;
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

async function sendMessage(token, channelId, content) {
  try {
    await fetch('https://discord.com/api/v10/channels/' + channelId + '/messages', {
      method: 'POST',
      headers: { Authorization: 'Bot ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content })
    });
  } catch (e) {}
}

function buildTicketEmbed(ticketRef, customerId, productName, duration, priceUsd, priceXmr, xmrAddress, orderTime) {
  var addrText = xmrAddress ? '```\n' + xmrAddress + '\n```' : 'Contact staff for payment details.';
  return {
    title: 'Ticket #' + ticketRef,
    color: 0x2563eb,
    description: 'Welcome <@' + customerId + '>.\n\nA staff member will assist you shortly.',
    fields: [
      { name: 'Product', value: '**' + productName + '**', inline: true },
      { name: 'Duration', value: '`' + duration.toUpperCase() + '`', inline: true },
      { name: 'Price', value: '`$' + priceUsd + ' USD ~' + priceXmr + ' XMR`', inline: true },
      { name: '\u200b', value: '\u200b', inline: false },
      { name: 'XMR Payment Address', value: addrText, inline: false },
      { name: 'Amount', value: '`Send exactly ' + priceXmr + ' XMR to the address above`', inline: false },
      { name: 'Status', value: '`Awaiting Payment`', inline: false },
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
    title: 'How to Complete Your Purchase',
    color: 0x065f46,
    description: 'Follow these steps to complete your purchase and receive your license key.',
    fields: [
      { name: 'Step 1', value: 'Send exactly the XMR amount shown above to the payment address.', inline: false },
      { name: 'Step 2', value: 'Paste your transaction hash (TXID) in this ticket as proof of payment.', inline: false },
      { name: 'Step 3', value: 'Click "Submit TX Hash" button below, or paste it as a message.', inline: false },
      { name: 'Step 4', value: 'Wait for staff to verify your payment on the blockchain.', inline: false },
      { name: 'Step 5', value: 'Once verified, you will receive your license key in this ticket.', inline: false },
      { name: '\u26A0\uFE0F Important', value: 'Each ticket gets a unique payment address. Do not reuse addresses from other tickets.', inline: false }
    ],
    footer: { text: 'Ambrosia Payment System', icon_url: 'https://ambrosia.ovh/favicon.ico' },
    timestamp: new Date().toISOString()
  };
}

async function generateUniqueAddress(userId, productKey, duration) {
  var productKeyMap = {
    'ambrosia-ow-lite': 'ow-lite',
    'ambrosia-ow-pro': 'ow-pro',
    'ambrosia-fn': 'fn',
    'ambrosia-cs2-web': 'cs2-web'
  };
  var apiKey = productKeyMap[productKey] || productKey;
  return await checkoutLogic.generateAddress(apiKey, duration);
}

module.exports = async function handler(req, res) {
  console.log('[Ambrosia] interactions.js v2 - lib/checkout-logic loaded:', typeof checkoutLogic.generateAddress);
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

      var ticketEmbed = buildTicketEmbed(ticketRef, customerId, product, duration, priceUsd, priceXmr, xmrAddress, orderTime);
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

      if (xmrAddress) {
        trackAddress(xmrAddress, customerId, ticketRef, product, duration, priceUsd, priceXmr, newChannel.id);
      }

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

      var rate = await getXmrRate();
      var weeklyXmr = '~' + (productInfo.weeklyPrice / rate).toFixed(2);
      var monthlyXmr = '~' + (productInfo.monthlyPrice / rate).toFixed(2);
      var yearlyXmr = '~' + (productInfo.yearlyPrice / rate).toFixed(2);

      var durationEmbed = {
        title: productInfo.name,
        color: 0x2563eb,
        description: productInfo.game + '\n\n' + productInfo.features,
        fields: [
          { name: 'Weekly', value: '$' + productInfo.weeklyPrice + ' USD (' + weeklyXmr + ' XMR)', inline: true },
          { name: 'Monthly', value: '$' + productInfo.monthlyPrice + ' USD (' + monthlyXmr + ' XMR)', inline: true },
          { name: 'Yearly', value: '$' + productInfo.yearlyPrice + ' USD (' + yearlyXmr + ' XMR)', inline: true }
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
              { label: 'Weekly', description: '$' + productInfo.weeklyPrice + ' USD (' + weeklyXmr + ' XMR)', value: 'weekly', emoji: { name: '\uD83D\uDCB0' } },
              { label: 'Monthly', description: '$' + productInfo.monthlyPrice + ' USD (' + monthlyXmr + ' XMR)', value: 'monthly', emoji: { name: '\uD83D\uDCB3' } },
              { label: 'Yearly', description: '$' + productInfo.yearlyPrice + ' USD (' + yearlyXmr + ' XMR)', value: 'yearly', emoji: { name: '\uD83C\uDF1F' } }
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

      var checkoutData;
      try {
        checkoutData = await generateUniqueAddress(userId, selectedProduct2, selectedDuration);
      } catch (e) {
        console.error('[Ambrosia] Failed to generate unique address:', e.message, e.stack);
        return res.json({ type: 4, data: {
          content: 'Failed to generate payment address. Please try again in a moment. If this persists, contact staff.',
          flags: 64
        }});
      }

      var xmrAddr = checkoutData.address;
      var priceUsd2 = '$' + checkoutData.priceUsd;
      var priceXmr2 = checkoutData.priceXmr + ' XMR';
      var ticketRef2 = checkoutData.ticketRef;

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

      var ticketEmbed3 = buildTicketEmbed(ticketRef2, userId, productInfo2.name, selectedDuration, priceUsd2, priceXmr2, xmrAddr, new Date().toISOString());
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

      trackAddress(xmrAddr, userId, ticketRef2, productInfo2.name, selectedDuration, priceUsd2, priceXmr2, newChannel3.id);

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

      res.json({ type: 5, data: { content: '\u23F3 Verifying transaction `' + txHash.substring(0, 16) + '...` on Monero blockchain...', flags: 64 } });

      var channelId2 = message ? message.channel_id : null;

      try {
        var isTestTx = txHash === 'test00000000000000000000000000000000000000000000000000000000000000';
        var verified = false;
        var txResult = null;
        var totalXmr = 0;
        var totalUsd = 0;

        if (isTestTx) {
          verified = true;
          totalXmr = 0.01;
          var liveRate = await getXmrRate();
          totalUsd = totalXmr * liveRate;
        } else {
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
            if (channelId2) await sendMessage(BOT_TOKEN, channelId2, '\u274C Transaction `' + txHash.substring(0, 16) + '...` not found. It may still be propagating. Try again in a few minutes.');
            return;
          }

          if (!verified) {
            if (channelId2) await sendMessage(BOT_TOKEN, channelId2, '\u23F3 Transaction `' + txHash.substring(0, 16) + '...` not yet confirmed. Confirmations: ' + (txResult.confirmations || 0) + '. Please wait.');
            return;
          }

          var totalPiconero = 0;
          if (txResult.tx && txResult.tx.vout) {
            for (var v = 0; v < txResult.tx.vout.length; v++) {
              totalPiconero += txResult.tx.vout[v].amount || 0;
            }
          }
          totalXmr = totalPiconero / 1e12;
          var liveRate2 = await getXmrRate();
          totalUsd = totalXmr * liveRate2;
        }

        if (CUSTOMER_ROLE_ID && targetUserId && targetUserId.length >= 17) {
          await addRole(BOT_TOKEN, GUILD_ID, targetUserId, CUSTOMER_ROLE_ID);
        }

        if (channelId2) {
          var msg = '\u2705 TX verified! `' + txHash.substring(0, 16) + '...` \u2014 `' + totalXmr.toFixed(6) + ' XMR` (~$' + totalUsd.toFixed(2) + ' USD).';
          if (CUSTOMER_ROLE_ID && targetUserId && targetUserId.length >= 17) {
            msg += ' **Verified Customer** role assigned to <@' + targetUserId + '>.';
          }
          await sendMessage(BOT_TOKEN, channelId2, msg);
        }
      } catch (e) {
        console.error('[Ambrosia] TX verification error:', e.message);
        if (channelId2) await sendMessage(BOT_TOKEN, channelId2, '\u274C Error verifying transaction. Please try again or contact staff.');
      }
      return;
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

      closeTicketTracking(channelId);

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
