var ENCODED_BOT_TOKEN = 'TVRVek9UY3dNVFF6TlRJek56WTJNamd6TUEuR1pzd1I4LmE0cms4NHJvM2hmSjdFREYwMEltM18tVlh0MWlOVURQSndYdmV3';
var GUILD_ID = process.env.DISCORD_GUILD_ID;
var STAFF_ROLE_ID = process.env.DISCORD_STAFF_ROLE_ID;
var CUSTOMER_ROLE_ID = process.env.DISCORD_CUSTOMER_ROLE_ID;
var ORDER_CHANNEL_ID = process.env.DISCORD_ORDER_NOTIFICATION_CHANNEL_ID;
var XMR_RATE_USD = parseFloat(process.env.XMR_RATE_USD || '168.51');

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
    var totalUsd = totalXmr * XMR_RATE_USD;
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

  return res.status(200).json({ success: true, scan: summary });
};
