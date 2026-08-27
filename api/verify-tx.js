var ENCODED_BOT_TOKEN = 'TVRVek9UY3dNVFF6TlRJek56WTJNamd6TUEuR1pzd1I4LmE0cms4NHJvM2hmSjdFREYwMEltM18tVlh0MWlOVURQSndYdmV3';
var GUILD_ID = process.env.DISCORD_GUILD_ID;
var STAFF_ROLE_ID = process.env.DISCORD_STAFF_ROLE_ID;
var CUSTOMER_ROLE_ID = process.env.DISCORD_CUSTOMER_ROLE_ID;
var FALLBACK_RATE = parseFloat(process.env.XMR_RATE_USD || '168.51');

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
var MONERO_PRIVATE_SPEND_KEY = process.env.MONERO_PRIVATE_SPEND_KEY;

var MONERO_NODES = [
  'https://node.moneroworld.com:18082',
  'https://xmr-node.cakewallet.com:18089',
  'http://node.xmr.life:18081'
];

function getBotToken() {
  try { return Buffer.from(ENCODED_BOT_TOKEN, 'base64').toString('utf8'); } catch { return ''; }
}

function hexToBytes(hex) {
  var bytes = new Uint8Array(hex.length / 2);
  for (var i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
}

async function rpcCall(method, params) {
  for (var i = 0; i < MONERO_NODES.length; i++) {
    try {
      var resp = await fetch(MONERO_NODES[i] + '/json_rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: '0', method: method, params: params || {} }),
        signal: AbortSignal.timeout(10000)
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
        signal: AbortSignal.timeout(10000)
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

async function getBlockHeight() {
  var result = await rpcCall('get_block_count');
  return result ? result.count - 1 : 0;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var body = req.body || {};
  var txHash = body.txHash;
  var expectedAmountUsd = parseFloat(body.amountUsd);
  var discordUserId = body.discordUserId;
  var secret = body.secret;

  if (secret !== 'ambrosia-verify-' + (discordUserId || '')) {
    if (secret !== 'ambrosia-auto-scan') {
      return res.status(403).json({ error: 'Invalid secret' });
    }
  }

  if (!txHash || !/^[a-fA-F0-9]{64}$/.test(txHash)) {
    return res.status(400).json({ error: 'Invalid TX hash format. Must be 64 hex characters.' });
  }

  console.log('[VerifyTX] Checking TX:', txHash);

  var txData = await getTransaction(txHash);
  if (!txData) {
    return res.status(404).json({ error: 'Transaction not found on the blockchain. It may still be propagating.' });
  }

  if (txData.confirmed === false || txData.confirmed === 0) {
    return res.status(202).json({ error: 'Transaction not yet confirmed. Please wait.', confirmations: txData.confirmations || 0 });
  }

  var totalAmountPiconero = 0;
  var outputCount = 0;
  if (txData.tx) {
    if (txData.tx.vout) {
      for (var i = 0; i < txData.tx.vout.length; i++) {
        totalAmountPiconero += txData.tx.vout[i].amount || 0;
        outputCount++;
      }
    }
  }

  var totalAmountXmr = totalAmountPiconero / 1e12;
  var liveRate = await getXmrRate();
  var totalAmountUsd = totalAmountXmr * liveRate;

  var result = {
    success: true,
    confirmed: true,
    txHash: txHash,
    blockHeight: txData.block_height || txData.block || 0,
    confirmations: txData.confirmations || 0,
    totalAmountXmr: totalAmountXmr.toFixed(12),
    totalAmountUsd: totalAmountUsd.toFixed(2),
    outputCount: outputCount,
    feeXmr: txData.tx ? ((txData.tx.rct_signatures ? txData.tx.rct_signatures.txnFee : 0) / 1e12).toFixed(12) : 'unknown',
    paymentDetected: expectedAmountUsd ? (Math.abs(totalAmountUsd - expectedAmountUsd) < expectedAmountUsd * 0.15) : false
  };

  if (expectedAmountUsd) {
    result.expectedUsd = expectedAmountUsd;
    result.matchPercentage = ((totalAmountUsd / expectedAmountUsd) * 100).toFixed(1) + '%';
  }

  console.log('[VerifyTX] Result:', JSON.stringify(result));

  return res.status(200).json(result);
};
