const ENCODED_BOT_TOKEN = 'TVRVek9UY3dNVFF6TlRJek56WTJNamd6TUEuR1pzd1I4LmE0cms4NHJvM2hmSjdFREYwMEltM18tVlh0MWlOVURQSndYdmV3';
const TICKET_PANEL_CHANNEL_ID = '1539954048722010193';
const GUILD_ID = '1539404742055166045';
const TICKET_CATEGORY_ID = '1539707872416636939';
const STAFF_ROLE_ID = '1539709640240005220';

function getBotToken() {
  try { return atob(ENCODED_BOT_TOKEN); } catch { return ''; }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const BOT_TOKEN = getBotToken();
  if (!BOT_TOKEN) return res.status(500).json({ error: 'Bot token not configured' });

  const { secret } = req.body || {};
  if (secret !== 'ambrosia-send-panel-2026') {
    return res.status(403).json({ error: 'Invalid secret' });
  }

  const panelEmbeds = [
    {
      title: '\u2728 Ambrosia Support Hub',
      description: '> Your gateway to **premium gaming assistance**. Select a product below and a private ticket will be created instantly where our dedicated staff will assist you one-on-one.\n\n> \uD83D\uDCA1 **How it works:** Choose your product \u2192 Private channel created \u2192 Staff assists you directly',
      color: 0x2563eb,
      image: {
        url: 'https://ambrosia.ovh/og-image.png'
      },
      timestamp: new Date().toISOString()
    },
    {
      title: '\uD83C\uDFAE Available Products',
      description: '\u200b',
      color: 0x1e3a8a,
      fields: [
        {
          name: '\uD83C\uDFAF **Ambrosia OW Lite**',
          value: '```ansi\n\u001b[1;34mOverwatch 2\u001b[0m\n```'
            + '**\u2022** Aimbot, Triggerbot & Flickbot\n'
            + '**\u2022** Auto Bunnyhop & SnapTap\n'
            + '**\u2022** Streamproof & Record Proof\n'
            + '**\u2022** 10 Configs & Keybinds\n'
            + '`$5/week` \u2022 `$10/month`',
          inline: true
        },
        {
          name: '\u26A1 **Ambrosia OW Pro**',
          value: '```ansi\n\u001b[1;35mOverwatch 2 \u2022 FULL SUITE\u001b[0m\n```'
            + '**\u2022** Hero Action Scripting\n'
            + '**\u2022** Ult Shower HUD & Cooldowns\n'
            + '**\u2022** Dual Aim/Trigger Slots\n'
            + '**\u2022** Outline ESP & Off-Screen Arrows\n'
            + '`$20/week` \u2022 `$45/month`',
          inline: true
        },
        {
          name: '\u200b',
          value: '\u200b',
          inline: false
        },
        {
          name: '\uD83D\uDCE1 **CS2 Web Radar**',
          value: '```ansi\n\u001b[1;36mCounter-Strike 2\u001b[0m\n```'
            + '**\u2022** Triggerbot & RCS Recoil Control\n'
            + '**\u2022** 2D Tactical Web Radar\n'
            + '**\u2022** Works on Phone & 2nd Screen\n'
            + '**\u2022** Bomb, Defuse & Grenade Tracking\n'
            + '`$5/week` \u2022 `$15/month`',
          inline: true
        },
        {
          name: '\uD83C\uDF96\uFE0F **Ambrosia FN**',
          value: '```ansi\n\u001b[1;32mFortnite\u001b[0m\n```'
            + '**\u2022** Aimbot with Prediction\n'
            + '**\u2022** Box, Skeleton & China Hat ESP\n'
            + '**\u2022** Loot ESP with Rarity & Distance\n'
            + '**\u2022** On-Screen Customizable Radar\n'
            + '`$20/week` \u2022 `$45/month`',
          inline: true
        },
        {
          name: '\u200b',
          value: '\u200b',
          inline: false
        },
        {
          name: '\uD83D\uDCAC **General Support**',
          value: '```ansi\n\u001b[1;37mQuestions & Issues\u001b[0m\n```'
            + '**\u2022** Pre-purchase questions\n'
            + '**\u2022** Order issues or delays\n'
            + '**\u2022** Technical support\n'
            + '**\u2022** Account assistance\n'
            + '`Free` \u2022 `No purchase required`',
          inline: true
        },
        {
          name: '\u200b',
          value: '\u200b',
          inline: true
        }
      ],
      thumbnail: {
        url: 'https://ambrosia.ovh/favicon.ico'
      }
    },
    {
      title: '\uD83D\uDEE1\uFE0F Why Ambrosia?',
      description: '\u200b',
      color: 0x065f46,
      fields: [
        {
          name: '\u2714\ufe0f **Undetected**',
          value: 'Virtualized client software with streamproof rendering',
          inline: true
        },
        {
          name: '\u26A1 **Instant Setup**',
          value: 'Receive your license key within minutes of payment',
          inline: true
        },
        {
          name: '\uD83D\uDD12 **Private & Secure**',
          value: 'Zero KYC Monero payments with encrypted tickets',
          inline: true
        },
        {
          name: '\uD83C\uDFAF **10 Config Slots**',
          value: 'Save, share, and switch configs with keybinds instantly',
          inline: true
        },
        {
          name: '\uD83D\uDCF1 **Multi-Device**',
          value: 'CS2 Web Radar works on phones, tablets, and Linux',
          inline: true
        },
        {
          name: '\uD83D\uDEE1\uFE0F **Record Proof**',
          value: 'OBS, recording software, and screen captures cannot detect it',
          inline: true
        }
      ]
    },
    {
      title: '\uD83D\uDCCB Quick Start Guide',
      description: '``` \n 1. Select a product from the dropdown below \n 2. A private ticket channel is created \n 3. Share your Discord User ID in the ticket \n 4. Staff will assist you with your order \n 5. Send XMR payment when ready \n 6. Receive your license key instantly \n ```',
      color: 0x5865f2,
      footer: {
        text: 'Ambrosia.ovh \u2022 Official Reseller \u2022 est. 2025',
        icon_url: 'https://ambrosia.ovh/favicon.ico'
      },
      timestamp: new Date().toISOString()
    }
  ];

  const panelComponents = [
    {
      type: 1,
      components: [
        {
          type: 3,
          custom_id: 'select_ticket_product',
          placeholder: '\uD83C\uDFAE Select a product to open a ticket...',
          min_values: 1,
          max_values: 1,
          options: [
            {
              label: 'Ambrosia OW Lite',
              description: 'Overwatch 2 \u2022 $5/wk \u00b7 $10/mo \u2022 Aimbot, Triggerbot, Streamproof',
              value: 'ambrosia-ow-lite',
              emoji: { name: '\uD83C\uDFAF' },
              default: false
            },
            {
              label: 'Ambrosia OW Pro',
              description: 'Overwatch 2 \u2022 $20/wk \u00b7 $45/mo \u2022 Hero Scripting, Ult HUD',
              value: 'ambrosia-ow-pro',
              emoji: { name: '\u26A1' },
              default: false
            },
            {
              label: 'CS2 Web Radar',
              description: 'Counter-Strike 2 \u2022 $5/wk \u00b7 $15/mo \u2022 Triggerbot, RCS, Web Radar',
              value: 'ambrosia-cs2-web',
              emoji: { name: '\uD83D\uDCE1' },
              default: false
            },
            {
              label: 'Ambrosia FN',
              description: 'Fortnite \u2022 $20/wk \u00b7 $45/mo \u2022 Aimbot, ESP, Loot Radar',
              value: 'ambrosia-fn',
              emoji: { name: '\uD83C\uDF96\uFE0F' },
              default: false
            },
            {
              label: 'General Support',
              description: 'Questions, issues, or anything else \u2022 Our staff will help',
              value: 'general-support',
              emoji: { name: '\uD83D\uDCAC' },
              default: false
            }
          ]
        }
      ]
    }
  ];

  try {
    const resp = await fetch('https://discord.com/api/v10/channels/' + TICKET_PANEL_CHANNEL_ID + '/messages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bot ' + BOT_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        embeds: panelEmbeds,
        components: panelComponents
      })
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error('[Ambrosia Panel] Discord API error ' + resp.status + ': ' + err);
      return res.status(502).json({ error: 'Discord API error: ' + resp.status, details: err.substring(0, 200) });
    }

    const msg = await resp.json();
    return res.status(200).json({
      success: true,
      messageId: msg.id,
      channelId: TICKET_PANEL_CHANNEL_ID
    });
  } catch (e) {
    console.error('[Ambrosia Panel] Failed to send panel:', e);
    return res.status(500).json({ error: 'Failed to send panel' });
  }
};
