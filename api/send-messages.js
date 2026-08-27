const ENCODED_BOT_TOKEN = 'TVRVek9UY3dNVFF6TlRJek56WTJNamd6TUEuR1pzd1I4LmE0cms4NHJvM2hmSjdFREYwMEltM18tVlh0MWlOVURQSndYdmV3';

const RULES_CHANNEL_ID = process.env.DISCORD_RULES_CHANNEL_ID;
const ANNOUNCEMENTS_CHANNEL_ID = process.env.DISCORD_ANNOUNCEMENTS_CHANNEL_ID;
const STAFF_CHAT_CHANNEL_ID = process.env.DISCORD_STAFF_CHAT_CHANNEL_ID;
const ORDER_NOTIFICATION_CHANNEL_ID = process.env.DISCORD_ORDER_NOTIFICATION_CHANNEL_ID;
const XMR_ADDRESSES_CHANNEL_ID = process.env.DISCORD_XMR_ADDRESSES_CHANNEL_ID;
const TICKET_PANEL_CHANNEL_ID = process.env.DISCORD_TICKET_PANEL_CHANNEL_ID;

const TICKET_SERVER_INVITE = 'https://discord.gg/UwYWZZ4Z6c';
const PRODUCT_SERVER_INVITE = 'https://discord.gg/bT9dpnerP4';
const SELLER_WEBSITE = 'https://ambrosiaovh.vercel.app';
const OFFICIAL_WEBSITE = 'https://ambrosia.ovh';
const SECRET = 'ambrosia-send-messages-2026';

function getBotToken() {
  try { return Buffer.from(ENCODED_BOT_TOKEN, 'base64').toString('utf8'); } catch { return ''; }
}

async function api(token, method, path, body) {
  const opts = { method, headers: { Authorization: 'Bot ' + token, 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const resp = await fetch('https://discord.com/api/v10' + path, opts);
  return { ok: resp.ok, status: resp.status, data: await resp.json().catch(() => null) };
}

async function sendEmbeds(token, channelId, embeds) {
  const r = await api(token, 'POST', '/channels/' + channelId + '/messages', { embeds });
  return r.ok;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = getBotToken();
  if (!token) return res.status(500).json({ error: 'No bot token' });
  if (!req.body || req.body.secret !== SECRET) return res.status(403).json({ error: 'Bad secret' });

  const missing = [];
  if (!RULES_CHANNEL_ID) missing.push('DISCORD_RULES_CHANNEL_ID');
  if (!ANNOUNCEMENTS_CHANNEL_ID) missing.push('DISCORD_ANNOUNCEMENTS_CHANNEL_ID');
  if (!STAFF_CHAT_CHANNEL_ID) missing.push('DISCORD_STAFF_CHAT_CHANNEL_ID');
  if (!ORDER_NOTIFICATION_CHANNEL_ID) missing.push('DISCORD_ORDER_NOTIFICATION_CHANNEL_ID');
  if (!XMR_ADDRESSES_CHANNEL_ID) missing.push('DISCORD_XMR_ADDRESSES_CHANNEL_ID');
  if (!TICKET_PANEL_CHANNEL_ID) missing.push('DISCORD_TICKET_PANEL_CHANNEL_ID');
  if (missing.length) return res.status(500).json({ error: 'Missing env vars: ' + missing.join(', ') });

  const log = [];
  let delay = 0;

  async function send(channelId, embeds) {
    await new Promise(r => setTimeout(r, delay));
    const ok = await sendEmbeds(token, channelId, embeds);
    log.push(channelId + ': ' + (ok ? 'OK' : 'FAIL'));
    delay = 500;
  }

  await send(RULES_CHANNEL_ID, [{
    title: '⚠️ Server Rules',
    color: 0x2563eb,
    description: 'Welcome to the official Ambrosia Discord server. Please read and follow these rules.',
    fields: [
      { name: 'Rule 1', value: 'Be respectful to all members. No harassment, hate speech, or personal attacks.', inline: false },
      { name: 'Rule 2', value: 'No spamming, self-promotion, or unsolicited advertising.', inline: false },
      { name: 'Rule 3', value: 'Keep conversations in the appropriate channels.', inline: false },
      { name: 'Rule 4', value: 'Do not share personal information, payment addresses, or license keys.', inline: false },
      { name: 'Rule 5', value: 'Staff decisions are final. Open a ticket for issues.', inline: false },
      { name: 'Support', value: 'Open a ticket in <#' + TICKET_PANEL_CHANNEL_ID + '>', inline: false }
    ],
    image: { url: 'https://ambrosia.ovh/og-image.png' },
    footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' },
    timestamp: new Date().toISOString()
  }]);

  await send(ANNOUNCEMENTS_CHANNEL_ID, [{
    title: '📢 Welcome to Ambrosia',
    color: 0x5865f2,
    description: 'Official Ambrosia support server. Premium game cheats for Overwatch 2, Counter-Strike 2, and Fortnite.',
    fields: [
      { name: 'Website', value: '[ambrosia.ovh](' + OFFICIAL_WEBSITE + ')', inline: true },
      { name: 'Products', value: 'OW Lite, OW Pro, CS2 Web Radar, FN', inline: true },
      { name: 'Support', value: 'Open a ticket in <#' + TICKET_PANEL_CHANNEL_ID + '>', inline: true }
    ],
    image: { url: 'https://ambrosia.ovh/og-image.png' },
    footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' },
    timestamp: new Date().toISOString()
  }]);

  await send(STAFF_CHAT_CHANNEL_ID, [
    { title: '🔨 Staff Channel', color: 0x5865f2, description: 'Staff, Seller, and Owner only. Hidden from members.' },
    { title: 'Order Handling (XMR Only)', color: 0x991b1b, description: 'Do not share with customers.',
      fields: [
        { name: '1. Verify User ID', value: 'Check it matches the ticket creator.', inline: false },
        { name: '2. Check XMR Payment', value: 'Use xmrchain.net to verify payment on chain.', inline: false },
        { name: '3. Deliver Key', value: 'Once confirmed, send the license key.', inline: false },
        { name: '4. Verify Purchase', value: 'Click the green button to assign Verified Customer role.', inline: false },
        { name: '5. Close Ticket', value: 'Click the red Close Ticket button.', inline: false }
      ],
      footer: { text: 'Private', icon_url: 'https://ambrosia.ovh/favicon.ico' },
      timestamp: new Date().toISOString() }
  ]);

  await send(ORDER_NOTIFICATION_CHANNEL_ID, [{
    title: '📊 Order Notifications',
    color: 0xf59e0b,
    description: 'New orders appear here with a **Create Ticket** button.',
    footer: { text: 'Ambrosia Order System', icon_url: 'https://ambrosia.ovh/favicon.ico' },
    timestamp: new Date().toISOString()
  }]);

  await send(XMR_ADDRESSES_CHANNEL_ID, [
    {
      title: '💰 Official XMR Payment Addresses',
      color: 0x10b981,
      description: '**Staff and Seller only.** Do not share these addresses outside of staff channels.\nEach product and billing cycle has its own unique Monero address.',
      image: { url: 'https://ambrosia.ovh/og-image.png' },
      footer: { text: 'Ambrosia Payment System', icon_url: 'https://ambrosia.ovh/favicon.ico' },
      timestamp: new Date().toISOString()
    },
    {
      title: 'Ambrosia OW Lite',
      color: 0x5865f2,
      fields: [
        { name: 'Weekly — $5 USD', value: '```\n89VPPCJ9qhEUnA53bDLPSFbdKm3zS7uxJ7Qewy9mAV23AFb7EnUBBDjfjwzKxE71yRjSADVb6Cs6t22DQ3vKtphnTRaBnZB\n```', inline: false },
        { name: 'Monthly — $10 USD', value: '```\n89aFGA5EWqvJUnNacSNW6RGPctm74XKx8Nvz5t45BDm8ZfDWdBH2xJgZsL4mFi47kHaamwu2PcQAT3E1vUJmpPhD15WjkiB\n```', inline: false },
        { name: 'Yearly — $100 USD', value: '```\n88N6VV7KHCnSpq8pKtNtRSfYjadqHUH5qUTHeToCbFW9jA9RnqvzDLE6Ev8HVeoYyhG7fa9NK5dL18WpvWFYSX1HJ8Cenhf\n```', inline: false }
      ]
    },
    {
      title: 'Ambrosia OW Pro',
      color: 0xf59e0b,
      fields: [
        { name: 'Weekly — $20 USD', value: '```\n88MtyMUqqrFbqAtg2g6M5Khi1dwEVyt6UCUi228VLpZNFqX4fepf6ixctZaPtERsP4dA1HSBnFteQhZsHnz8sMsp1Ld5YBH\n```', inline: false },
        { name: 'Monthly — $45 USD', value: '```\n8AGpdyaAkKyb8daJ3xksAr9m6y5L6ChND2KHthouN4YcEXMtm5cH72DghMc2ZeMHdP2ewXWxWWRPTUuoMefj1DSg7FVf8kU\n```', inline: false },
        { name: 'Yearly — $450 USD', value: '```\n4BE8WBPizoyfveG6Sbtd66V184WktCEoq8EQ2d3ayxKLQxhRiFB4shQDHSVU8f188diVst9thbTtWh4KmrGKZXwwRm6fvyL\n```', inline: false }
      ]
    },
    {
      title: 'Ambrosia CS2 Web Radar',
      color: 0x8b5cf6,
      fields: [
        { name: 'Weekly — $5 USD', value: '```\n871MfSycgoc8mhZ7SpUZoZZ1dbS6d5Bq1cde9LmEvcVqUn8fpCgZTvMKN1V2tNGqzBeh4pjgwzQHUf42qAvR71YbEtc59Xz\n```', inline: false },
        { name: 'Monthly — $15 USD', value: '```\n8AVUcXxR3ircP1BhpUi3fhczeag4LQjCaJKBe2opbDrKCexzqYAwjk3U63uGeaU4Wk7ztyDtoYEuHXxQ46f27c4AR2c6mQf\n```', inline: false },
        { name: 'Yearly — $150 USD', value: '```\n8A9XWGLZPBPWNXGtwCHi3k9tukffTsyzj2Bry24aoDcEfEouHYoRQnt9CAVwPsgR5HAVGjyXLEt4rAm6hDkHuDGYLVPE6xn\n```', inline: false }
      ]
    },
    {
      title: 'Ambrosia FN',
      color: 0x06b6d4,
      fields: [
        { name: 'Weekly — $20 USD', value: '```\n8BMLcSiK1rm7zZ11MPd2U1G4rMfkjTkZyQ9spnY6GAHEYSJVvWJ9wQQPKnNnZxHAmMazApZ2qJ6wKFAnbbR1LsaT5HAFSCK\n```', inline: false },
        { name: 'Monthly — $45 USD', value: '```\n84hxPfyebV85yHJi6BuBnnKxBjYRGc1dMURtmv4By4QjNF9Czaho5EPQzeGEeNtVfpCyX1v4dRLac2LWLEnSC4EK7BsKZKc\n```', inline: false },
        { name: 'Yearly — $450 USD', value: '```\n88eiZUXkbAqDXETpFWV5EiEJA5xPsi7JreNQsMcSaXpGNucsmdt8mwcjKoin7B42PnVeDgscuPjh545L3yo7HfcRTVgQW2o\n```', inline: false }
      ]
    }
  ]);

  return res.status(200).json({ success: true, log });
};
