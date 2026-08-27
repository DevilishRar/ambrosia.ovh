var FALLBACK_RATE = parseFloat(process.env.XMR_RATE_USD || '168.51');

var cachedRate = null;
var cacheTime = 0;
var CACHE_TTL = 60000;

async function getXmrRate() {
  var now = Date.now();
  if (cachedRate && (now - cacheTime) < CACHE_TTL) return cachedRate;
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

  var G = ed25519.Point.BASE;
  var BHex = bytesToHex(B);
  var BPoint = ed25519.Point.fromHex(BHex);

  var hScalar = ed25519.utils.getExtendedPublicKey(hClamped).scalar;
  var H = G.multiply(hScalar);
  var A = H.add(BPoint);

  var ABytes = A.toBytes();
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

async function generateAddress(productKey, duration) {
  var productInfo = PRODUCTS[productKey];
  if (!productInfo) throw new Error('Invalid product: ' + productKey);

  var priceUsd = productInfo[duration];
  if (!priceUsd) throw new Error('Invalid duration: ' + duration);

  var XMR_RATE_USD = await getXmrRate();
  var priceXmr = (priceUsd / XMR_RATE_USD).toFixed(5);
  var subaddressIndex = generateSubaddressIndex();

  var privateSpendKey = process.env.MONERO_PRIVATE_SPEND_KEY;
  if (!privateSpendKey) throw new Error('MONERO_PRIVATE_SPEND_KEY not configured');

  var address = await getSubaddress(privateSpendKey, 0, subaddressIndex);
  var ticketRef = 'AMB-' + Math.floor(1000 + Math.random() * 9000);

  return {
    address: address,
    priceUsd: priceUsd,
    priceXmr: priceXmr,
    product: productInfo.name,
    game: productInfo.game,
    duration: duration,
    ticketRef: ticketRef,
    subaddressIndex: subaddressIndex,
    xmrRateUsd: XMR_RATE_USD
  };
}

module.exports = {
  getXmrRate: getXmrRate,
  getSubaddress: getSubaddress,
  generateAddress: generateAddress,
  PRODUCTS: PRODUCTS,
  generateSubaddressIndex: generateSubaddressIndex
};
