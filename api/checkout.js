var ENCODED_BOT_TOKEN = 'TVRVek9UY3dNVFF6TlRJek56WTJNamd6TUEuR1pzd1I4LmE0cms4NHJvM2hmSjdFREYwMEltM18tVlh0MWlOVURQSndYdmV3';
var GUILD_ID = process.env.DISCORD_GUILD_ID;
var XMR_RATE_USD = parseFloat(process.env.XMR_RATE_USD || '168.51');

function getBotToken() {
  try { return Buffer.from(ENCODED_BOT_TOKEN, 'base64').toString('utf8'); } catch { return ''; }
}

var PRODUCTS = {
  'ow-lite': { name: 'Ambrosia OW Lite', game: 'Overwatch 2', weekly: 5, monthly: 10, yearly: 100 },
  'ow-pro': { name: 'Ambrosia OW Pro', game: 'Overwatch 2', weekly: 20, monthly: 45, yearly: 450 },
  'fn': { name: 'Ambrosia FN', game: 'Fortnite', weekly: 20, monthly: 45, yearly: 450 },
  'cs2-web': { name: 'CS2 Web Radar', game: 'Counter-Strike 2', weekly: 5, monthly: 15, yearly: 150 }
};

function encodeVarint(n) {
  var buf = [];
  while (n > 0x7f) { buf.push((n & 0x7f) | 0x80); n >>>= 7; }
  buf.push(n & 0x7f);
  return Buffer.from(buf);
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

var BASE58_CHARS = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(buffer) {
  var num = BigInt('0x' + bytesToHex(buffer));
  var result = '';
  while (num > 0n) {
    var remainder = num % 58n;
    num = num / 58n;
    result = BASE58_CHARS[Number(remainder)] + result;
  }
  for (var i = 0; i < buffer.length && buffer[i] === 0; i++) {
    result = '1' + result;
  }
  return result;
}

async function getSubaddress(privateSpendKeyHex, major, minor) {
  var ed25519Module = await import('@noble/curves/ed25519.js');
  var ed25519 = ed25519Module.ed25519;
  var sha3Module = await import('@noble/hashes/sha3.js');
  var sha3_256 = sha3Module.sha3_256;

  var a = hexToBytes(privateSpendKeyHex);
  var B = ed25519.getPublicKey(a);

  var data = Buffer.concat([
    Buffer.from(a),
    encodeVarint(major),
    encodeVarint(minor)
  ]);
  var h = sha3_256(data);

  var hClamped = new Uint8Array(h);
  hClamped[0] &= 0xf8;
  hClamped[31] &= 0x7f;
  hClamped[31] |= 0x40;

  var G = ed25519.CURVE.G;
  var BPoint = ed25519.Point.fromHex(B);

  var hScalar = ed25519.utils.normPrivateKeyToScalar(hClamped);
  var H = G.multiply(hScalar);
  var A = H.add(BPoint);

  var ABytes = A.toRawBytes();
  var spendKey32 = ABytes.slice(0, 32);

  var networkByte = Buffer.from([0x2a]);
  var spendKeyBuf = Buffer.from(spendKey32);
  var preAddress = Buffer.concat([networkByte, spendKeyBuf]);
  var hashPayload = Buffer.concat([preAddress, Buffer.from('monero')]);
  var checksum = sha3_256(hashPayload);
  var addrChecksum = Buffer.from(checksum).slice(0, 4);

  var fullAddress = Buffer.concat([preAddress, addrChecksum]);
  return base58Encode(fullAddress);
}

function generateSubaddressIndex() {
  var now = Date.now();
  var rand = Math.floor(Math.random() * 1000000);
  return ((now % 2000000000) * 1000000 + rand) % 2000000000;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var body = req.body || {};
  var discordUserId = body.discordUserId;
  var product = body.product;
  var duration = body.duration;
  var sellerName = body.sellerName || 'Devil';
  var preview = body.preview === true;

  if (!discordUserId || !/^\d{17,19}$/.test(discordUserId)) {
    return res.status(400).json({ error: 'Invalid Discord User ID. Must be 17-19 numeric digits.' });
  }

  if (!PRODUCTS[product]) {
    return res.status(400).json({ error: 'Invalid product. Must be one of: ow-lite, ow-pro, fn, cs2-web' });
  }

  if (!['weekly', 'monthly', 'yearly'].includes(duration)) {
    return res.status(400).json({ error: 'Invalid duration. Must be weekly, monthly, or yearly.' });
  }

  var BOT_TOKEN = getBotToken();
  if (!BOT_TOKEN) return res.status(500).json({ error: 'Bot token not configured' });
  if (!GUILD_ID) return res.status(500).json({ error: 'DISCORD_GUILD_ID not set' });

  if (!preview) {
    try {
      var memberRes = await fetch('https://discord.com/api/v10/guilds/' + GUILD_ID + '/members/' + discordUserId, {
        headers: { Authorization: 'Bot ' + BOT_TOKEN }
      });
      if (!memberRes.ok) {
        return res.status(403).json({
          error: 'not_member',
        message: 'You must join our Discord server first before purchasing.'
      });
    }
    } catch (e) {
      console.error('[Checkout] Membership check failed:', e);
      return res.status(500).json({ error: 'Failed to verify Discord membership' });
    }
  }

  var productInfo = PRODUCTS[product];
  var priceUsd = productInfo[duration];
  var priceXmr = (priceUsd / XMR_RATE_USD).toFixed(5);
  var subaddressIndex = generateSubaddressIndex();

  var privateSpendKey = process.env.MONERO_PRIVATE_SPEND_KEY;
  if (!privateSpendKey) {
    return res.status(500).json({ error: 'MONERO_PRIVATE_SPEND_KEY not configured' });
  }

  var address;
  try {
    address = await getSubaddress(privateSpendKey, 0, subaddressIndex);
  } catch (e) {
    console.error('[Checkout] Subaddress generation failed:', e);
    return res.status(500).json({ error: 'Failed to generate payment address: ' + e.message });
  }

  var ticketRef = 'AMB-' + Math.floor(1000 + Math.random() * 9000);

  return res.status(200).json({
    success: true,
    address: address,
    priceUsd: priceUsd,
    priceXmr: priceXmr,
    product: productInfo.name,
    game: productInfo.game,
    duration: duration,
    ticketRef: ticketRef,
    subaddressIndex: subaddressIndex,
    sellerName: sellerName,
    xmrRateUsd: XMR_RATE_USD
  });
};
