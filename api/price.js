var FALLBACK_RATE = parseFloat(process.env.XMR_RATE_USD || '168.51');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    var resp = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=monero&vs_currencies=usd', {
      signal: AbortSignal.timeout(5000)
    });
    if (resp.ok) {
      var data = await resp.json();
      if (data.monero && data.monero.usd) {
        return res.status(200).json({ rate: data.monero.usd, source: 'coingecko' });
      }
    }
  } catch (e) {}

  return res.status(200).json({ rate: FALLBACK_RATE, source: 'fallback' });
};
