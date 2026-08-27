var ENCODED_BOT_TOKEN = 'TVRVek9UY3dNVFF6TlRJek56WTJNamd6TUEuR1pzd1I4LmE0cms4NHJvM2hmSjdFREYwMEltM18tVlh0MWlOVURQSndYdmV3';
var GUILD_ID = process.env.DISCORD_GUILD_ID;
var CATEGORY_ID = process.env.DISCORD_TICKETS_CATEGORY_ID;
var STAFF_ROLE_ID = process.env.DISCORD_STAFF_ROLE_ID;
var SELLER_ROLE_ID = process.env.DISCORD_SELLER_ROLE_ID;
var CUSTOMER_ROLE_ID = process.env.DISCORD_CUSTOMER_ROLE_ID;
var ORDER_CHANNEL_ID = process.env.DISCORD_ORDER_NOTIFICATION_CHANNEL_ID;
var FALLBACK_RATE = parseFloat(process.env.XMR_RATE_USD || '168.51');
var pendingOrders = require('../lib/pending-orders.js');

var cachedRate = null;
var cacheTime = 0;

async function getXmrRate() {
  var now = Date.now();
  if (cachedRate && (now - cacheTime) < 60000) return cachedRate;
  try {
    var resp = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=monero&vs_currencies=usd', {
      signal: AbortSignal.timeout(5000)
    });
    if (resp.ok) {
      var data = await resp.json();
      if (data.monero && data.monero.usd) {
        cachedRate = data.monero.usd;
        cacheTime = now;
        return cachedRate;
      }
    }
  } catch (e) {}
  return FALLBACK_RATE;
}

var MONERO_NODES = [
  'https://node.moneroworld.com:18082',
  'https://xmr-node.cakewallet.com:18089',
  'http://node.xmr.life:18081'
];

function getBotToken() {
  try { return Buffer.from(ENCODED_BOT_TOKEN, 'base64').toString('utf8'); } catch { return ''; }
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
}

function hexToBytes(hex) {
  var bytes = new Uint8Array(hex.length / 2);
  for (var i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

async function rpcCall(method, params) {
  for (var i = 0; i < MONERO_NODES.length; i++) {
    try {
      var resp = await fetch(MONERO_NODES[i] + '/json_rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: '0', method: method, params: params || {} }),
        signal: AbortSignal.timeout(8000)
      });
      if (resp.ok) {
        var data = await resp.json();
        if (data.result) return data.result;
      }
    } catch (e) {
      continue;
    }
  }
  return null;
}

async function getTransaction(txHash) {
  for (var i = 0; i < MONERO_NODES.length; i++) {
    try {
      var resp = await fetch(MONERO_NODES[i] + '/get_transaction?tx_hash=' + txHash + '&prune=false', {
        signal: AbortSignal.timeout(8000)
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      continue;
    }
  }
  return null;
}

async function addRole(guildId, userId, roleId) {
  var BOT_TOKEN = getBotToken();
  try {
    var resp = await fetch('https://discord.com/api/v10/guilds/' + guildId + '/members/' + userId + '/roles/' + roleId, {
      method: 'PUT',
      headers: { Authorization: 'Bot ' + BOT_TOKEN }
    });
    return resp.ok;
  } catch (e) {
    return false;
  }
}

async function sendMessage(channelId, content) {
  var BOT_TOKEN = getBotToken();
  try {
    var resp = await fetch('https://discord.com/api/v10/channels/' + channelId + '/messages', {
      method: 'POST',
      headers: { Authorization: 'Bot ' + BOT_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content })
    });
    return resp.ok;
  } catch (e) {
    return false;
  }
}

async function addReaction(channelId, messageId, emoji) {
  var BOT_TOKEN = getBotToken();
  try {
    await fetch('https://discord.com/api/v10/channels/' + channelId + '/messages/' + messageId + '/reactions/' + encodeURIComponent(emoji) + '/@me', {
      method: 'PUT',
      headers: { Authorization: 'Bot ' + BOT_TOKEN }
    });
  } catch (e) {}
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  var authHeader = req.headers['authorization'] || '';
  var cronSecret = req.query && req.query.secret;
  if (authHeader !== 'Bearer ambrosia-cron-2026' && cronSecret !== 'ambrosia-cron-2026') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('[CheckPayments] Starting payment scan...');

  var BOT_TOKEN = getBotToken();
  if (!BOT_TOKEN) return res.status(500).json({ error: 'Bot token not configured' });
  if (!GUILD_ID) return res.status(500).json({ error: 'DISCORD_GUILD_ID not set' });
  if (!ORDER_CHANNEL_ID) return res.status(500).json({ error: 'DISCORD_ORDER_NOTIFICATION_CHANNEL_ID not set' });
  if (!CUSTOMER_ROLE_ID) return res.status(500).json({ error: 'DISCORD_CUSTOMER_ROLE_ID not set' });

  var messages = [];
  var after = '0';
  for (var page = 0; page < 5; page++) {
    try {
      var url = 'https://discord.com/api/v10/channels/' + ORDER_CHANNEL_ID + '/messages?limit=100';
      if (after !== '0') url += '&after=' + after;
      var resp = await fetch(url, { headers: { Authorization: 'Bot ' + BOT_TOKEN } });
      if (!resp.ok) break;
      var batch = await resp.json();
      if (!batch.length) break;
      messages = messages.concat(batch);
      after = batch[batch.length - 1].id;
      if (batch.length < 100) break;
    } catch (e) {
      break;
    }
  }

  console.log('[CheckPayments] Found', messages.length, 'messages in order channel');

  var checked = 0;
  var found = 0;
  var errors = 0;
  var alreadyVerified = 0;

  for (var m = 0; m < messages.length; m++) {
    var msg = messages[m];

    if (msg.author && msg.author.bot) {
      if (msg.reactions) {
        for (var r = 0; r < msg.reactions.length; r++) {
          if (msg.reactions[r].emoji.name === '\u2705') {
            alreadyVerified++;
            break;
          }
        }
      }
    }

    if (!msg.embeds || !msg.embeds.length) continue;

    var embed = msg.embeds[0];
    var fields = embed.fields || [];
    var userId = null;
    var xmrAddress = null;
    var priceUsd = null;
    var priceXmr = null;
    var product = null;
    var txStatus = null;

    for (var f = 0; f < fields.length; f++) {
      var fname = fields[f].name;
      var fval = fields[f].value.replace(/`/g, '').replace(/\*\*/g, '').trim();

      if (fname === 'Customer') {
        var idMatch = fval.match(/(\d{17,19})/);
        if (idMatch) userId = idMatch[1];
      }
      if (fname === 'XMR Payment Address') {
        xmrAddress = fval;
      }
      if (fname === 'Price') {
        var priceMatch = fval.match(/\$(\d+)/);
        if (priceMatch) priceUsd = parseFloat(priceMatch[1]);
        var xmrMatch = fval.match(/~?([\d.]+)\s*XMR/);
        if (xmrMatch) priceXmr = parseFloat(xmrMatch[1]);
      }
      if (fname === 'Product') {
        product = fval;
      }
      if (fname === 'TXID / Status') {
        txStatus = fval;
      }
    }

    if (!userId || !xmrAddress || xmrAddress === 'Contact staff for payment details.') continue;
    if (!priceUsd) continue;

    var hasVerifyReaction = false;
    if (msg.reactions) {
      for (var r2 = 0; r2 < msg.reactions.length; r2++) {
        if (msg.reactions[r2].emoji.name === '\u2705') {
          hasVerifyReaction = true;
          break;
        }
      }
    }
    if (hasVerifyReaction) continue;

    checked++;

    try {
      var isMember = await fetch('https://discord.com/api/v10/guilds/' + GUILD_ID + '/members/' + userId + '?with_roles=true', {
        headers: { Authorization: 'Bot ' + BOT_TOKEN }
      });
      if (isMember.ok) {
        var memberData = await isMember.json();
        if (memberData.roles && memberData.roles.indexOf(CUSTOMER_ROLE_ID) !== -1) {
          await addReaction(ORDER_CHANNEL_ID, msg.id, '\u2705');
          continue;
        }
      }
    } catch (e) {}

    var txHash = null;
    if (txStatus && /^[a-fA-F0-9]{64}$/.test(txStatus)) {
      txHash = txStatus;
    }

    if (!txHash) continue;

    console.log('[CheckPayments] Checking TX:', txHash, 'for user:', userId);

    var txData = null;
    for (var n = 0; n < MONERO_NODES.length; n++) {
      try {
        var txResp = await fetch(MONERO_NODES[n] + '/get_transaction?tx_hash=' + txHash + '&prune=false', {
          signal: AbortSignal.timeout(8000)
        });
        if (txResp.ok) {
          txData = await txResp.json();
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!txData || !txData.confirmed) {
      errors++;
      continue;
    }

    var totalPiconero = 0;
    if (txData.tx && txData.tx.vout) {
      for (var v = 0; v < txData.tx.vout.length; v++) {
        totalPiconero += txData.tx.vout[v].amount || 0;
      }
    }

    var totalXmr = totalPiconero / 1e12;
    var liveRate = await getXmrRate();
    var totalUsd = totalXmr * liveRate;
    var tolerance = priceUsd * 0.15;
    var paymentValid = Math.abs(totalUsd - priceUsd) < tolerance;

    if (paymentValid) {
      console.log('[CheckPayments] Payment detected!', 'User:', userId, 'Amount:', totalUsd.toFixed(2), 'USD');

      if (CUSTOMER_ROLE_ID) {
        var roleAdded = await addRole(GUILD_ID, userId, CUSTOMER_ROLE_ID);
        console.log('[CheckPayments] Role assigned:', roleAdded);
      }

      await addReaction(ORDER_CHANNEL_ID, msg.id, '\u2705');

      await sendMessage(ORDER_CHANNEL_ID, '<@' + userId + '> Payment auto-verified! TX: `' + txHash + '` — `' + totalXmr.toFixed(6) + ' XMR` (~$' + totalUsd.toFixed(2) + ' USD). **Verified Customer** role assigned.');

      found++;
    }
  }

  var summary = { checked: checked, verified: found, errors: errors, alreadyVerified: alreadyVerified, total: messages.length };
  console.log('[CheckPayments] Scan complete:', JSON.stringify(summary));

  var autoOpened = 0;
  try {
    var allOrders = pendingOrders.getAll();
    var now = Date.now();
    var AUTO_OPEN_DELAY = 90000;

    for (var oi = 0; oi < allOrders.length; oi++) {
      var order = allOrders[oi];
      if (order.processed) continue;
      if (now - order.createdAt < AUTO_OPEN_DELAY) continue;

      if (order.discordUserId) {
        var userTicketCount = require('../lib/tracking-store.js').getActiveTicketCount(order.discordUserId);
        if (userTicketCount >= 3) {
          console.log('[CheckPayments] Auto-open skipped for ' + order.discordUserId + ': ' + userTicketCount + ' active tickets');
          pendingOrders.markProcessed(oi);
          continue;
        }
      }

      try {
        var guildRes2 = await fetch('https://discord.com/api/v10/guilds/' + GUILD_ID + '?with_counts=false', {
          headers: { Authorization: 'Bot ' + BOT_TOKEN }
        });
        if (!guildRes2.ok) continue;
        var guild2 = await guildRes2.json();

        var channelName2 = 'ticket-' + order.ticketRef.toLowerCase() + '-auto';
        var perms2 = [{ id: guild2.id, type: 0, allow: '0', deny: '1024' }];
        if (STAFF_ROLE_ID) perms2.push({ id: STAFF_ROLE_ID, type: 0, allow: '23552', deny: '0' });
        if (SELLER_ROLE_ID) perms2.push({ id: SELLER_ROLE_ID, type: 0, allow: '23552', deny: '0' });
        if (order.discordUserId) perms2.push({ id: order.discordUserId, type: 1, allow: '23552', deny: '0' });

        var createRes2 = await fetch('https://discord.com/api/v10/guilds/' + GUILD_ID + '/channels', {
          method: 'POST',
          headers: { Authorization: 'Bot ' + BOT_TOKEN, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: channelName2, type: 0, parent_id: CATEGORY_ID || null, permission_overwrites: perms2 })
        });
        if (!createRes2.ok) continue;
        var newCh = await createRes2.json();

        var mention2 = '<@' + order.discordUserId + '>';
        if (STAFF_ROLE_ID) mention2 += ' <@&' + STAFF_ROLE_ID + '>';

        var ticketEmbed2 = {
          title: 'Ticket #' + order.ticketRef,
          color: 0x2563eb,
          description: 'Welcome <@' + order.discordUserId + '>.\n\nThis ticket was opened automatically after 90 seconds.',
          fields: [
            { name: 'Product', value: '**' + order.product + '**', inline: true },
            { name: 'Duration', value: '`' + order.duration.toUpperCase() + '`', inline: true },
            { name: 'Price', value: '`$' + order.price + ' USD ~' + order.xmrAmount + ' XMR`', inline: true },
            { name: '\u200b', value: '\u200b', inline: false },
            { name: 'XMR Payment Address', value: order.address ? '`' + order.address + '`' : 'Contact staff', inline: false },
            { name: 'Amount', value: '`Send exactly ' + order.xmrAmount + ' XMR to the address above`', inline: false },
            { name: 'Status', value: '`Awaiting Payment`', inline: false },
            { name: 'Order Placed', value: new Date(order.createdAt).toISOString(), inline: true }
          ],
          image: { url: 'https://ambrosia.ovh/og-image.png' },
          footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' },
          timestamp: new Date().toISOString()
        };

        var instrEmbed2 = {
          title: '\uD83D\uDEA8 Complete Your Purchase',
          color: 0xdc2626,
          fields: [
            { name: 'Step 1', value: 'Send exactly the XMR amount shown above to the payment address.', inline: false },
            { name: 'Step 2', value: 'Click **Submit TX Hash** and paste your transaction hash. **TX Hash is MANDATORY.**', inline: false },
            { name: 'Step 3', value: 'Wait for staff to verify your payment on the blockchain.', inline: false }
          ],
          footer: { text: 'Ambrosia Payment System', icon_url: 'https://ambrosia.ovh/favicon.ico' },
          timestamp: new Date().toISOString()
        };

        var btnRow2 = {
          type: 1,
          components: [
            { type: 2, custom_id: 'submit_tx_' + order.discordUserId, label: 'Submit TX Hash', style: 2, emoji: { name: '\uD83D\uDCB3' } },
            { type: 2, custom_id: 'verify_purchase_' + order.discordUserId, label: 'Verify Purchase', style: 3, emoji: { name: '\u2705' } },
            { type: 2, custom_id: 'close_ticket_' + order.discordUserId, label: 'Close Ticket', style: 4, emoji: { name: '\uD83D\uDD12' } }
          ]
        };

        await fetch('https://discord.com/api/v10/channels/' + newCh.id + '/messages', {
          method: 'POST',
          headers: { Authorization: 'Bot ' + BOT_TOKEN, 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: mention2, embeds: [ticketEmbed2, instrEmbed2], components: [btnRow2] })
        });

        pendingOrders.markProcessed(oi);
        autoOpened++;
      } catch (e2) {
        console.error('[CheckPayments] Auto-open error:', e2.message);
      }
    }
    pendingOrders.removeProcessed();
  } catch (e3) {
    console.error('[CheckPayments] Auto-open failed:', e3.message);
  }

  return res.status(200).json({ success: true, scan: summary, autoOpened: autoOpened });
};
