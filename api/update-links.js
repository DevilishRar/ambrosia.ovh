const ENCODED_BOT_TOKEN = 'TVRVek9UY3dNVFF6TlRJek56WTJNamd6TUEuR1pzd1I4LmE0cms4NHJvM2hmSjdFREYwMEltM18tVlh0MWlOVURQSndYdmV3';
const LINKS_CHANNEL_ID = process.env.DISCORD_LINKS_CHANNEL_ID;
const SECRET = 'ambrosia-update-links-2026';

function getBotToken() {
  try { return Buffer.from(ENCODED_BOT_TOKEN, 'base64').toString('utf-8'); } catch { return ''; }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var BT = getBotToken();
  if (!BT) return res.status(500).json({ error: 'No bot token' });
  if (!LINKS_CHANNEL_ID) return res.status(500).json({ error: 'DISCORD_LINKS_CHANNEL_ID not set in env' });
  if (!req.body || req.body.secret !== SECRET) return res.status(403).json({ error: 'Bad secret' });

  var inviteUrl = req.body.inviteUrl || 'https://discord.gg/V5hcFpehb5';

  try {
    var msgsRes = await fetch('https://discord.com/api/v10/channels/' + LINKS_CHANNEL_ID + '/messages?limit=10', {
      headers: { Authorization: 'Bot ' + BT }
    });
    if (!msgsRes.ok) {
      var err = await msgsRes.text();
      return res.status(500).json({ error: 'Failed to fetch messages', details: err.substring(0, 200) });
    }
    var msgs = await msgsRes.json();

    for (var i = 0; i < msgs.length; i++) {
      if (msgs[i].author && msgs[i].author.bot) {
        await fetch('https://discord.com/api/v10/channels/' + LINKS_CHANNEL_ID + '/messages/' + msgs[i].id, {
          method: 'DELETE',
          headers: { Authorization: 'Bot ' + BT }
        });
      }
    }

    var embed = {
      title: '\uD83D\uDD17 Official Links',
      color: 0x5865f2,
      fields: [
        { name: 'Product Server', value: 'https://discord.gg/bT9dpnerP4', inline: false },
        { name: 'Support Server', value: inviteUrl, inline: false },
        { name: 'Seller Website', value: 'https://ambrosiaovh.vercel.app/', inline: false },
        { name: 'Official Website (Dashboard)', value: 'https://ambrosia.ovh', inline: false }
      ],
      footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' },
      timestamp: new Date().toISOString()
    };

    var sendRes = await fetch('https://discord.com/api/v10/channels/' + LINKS_CHANNEL_ID + '/messages', {
      method: 'POST',
      headers: { Authorization: 'Bot ' + BT, 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });

    if (!sendRes.ok) {
      var err2 = await sendRes.text();
      return res.status(500).json({ error: 'Failed to send embed', details: err2.substring(0, 200) });
    }

    var sent = await sendRes.json();
    return res.status(200).json({ success: true, messageId: sent.id, channelId: LINKS_CHANNEL_ID, inviteUrl: inviteUrl });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
