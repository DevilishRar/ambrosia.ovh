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
      title: '\u2728 **Ambrosia Support Hub**',
      description: 'Your gateway to **premium gaming assistance**. Select a product below and a private ticket will be created instantly.\n\n'
        + '\uD83D\uDCA1 **How it works:** Choose your product \u2192 Private channel created \u2192 Staff assists you directly\n'
        + '\uD83D\uDD12 **Privacy:** Only you and staff can see your ticket. All conversations are confidential.\n'
        + '\u23F0 **Speed:** Tickets are created instantly. Staff typically respond within minutes.',
      color: 0x2563eb,
      image: { url: 'https://ambrosia.ovh/og-image.png' },
      timestamp: new Date().toISOString()
    },
    {
      title: '\uD83C\uDFAF **Ambrosia OW Lite** \u2014 Overwatch 2',
      color: 0x1e3a8a,
      description: '```ansi\n\u001b[1;34mAimbot \u2022 Triggerbot \u2022 Flickbot \u2022 Streamproof\u001b[0m\n```'
        + '\u2714\ufe0f Auto Bunnyhop & Null Binding (SnapTap)\n'
        + '\u2714\ufe0f Multipoint Visualisation & Hitbox Customisation\n'
        + '\u2714\ufe0f Streamproof & Record Proof Rendering\n'
        + '\u2714\ufe0f 10 Configs, Config Sharing & Keybind Switcher\n'
        + '\u2714\ufe0f GUI Customisation (Accent, Window Color, Logos)\n\n'
        + '**\u23F0 Pricing:**\n'
        + '`Weekly:  $5 USD`  \u2502  `\u2191 0.02968 XMR`\n'
        + '`Monthly: $10 USD` \u2502  `\u2191 0.05935 XMR`\n\n'
        + '**\uD83D\uDCB3 Weekly XMR Address:**\n'
        + '```\n89aFGA5EWqvJUnNacSNW6RGPctm74XKx8Nvz5t45BDm8ZfDWdBH2xJgZsL4mFi47kHaamwu2PcQAT3E1vUJmpPhD15WjkiB\n```\n'
        + '**\uD83D\uDCB3 Monthly XMR Address:**\n'
        + '```\n8AGpdyaAkKyb8daJ3xksAr9m6y5L6ChND2KHthouN4YcEXMtm5cH72DghMc2ZeMHdP2ewXWxWWRPTUuoMefj1DSg7FVf8kU\n```',
      thumbnail: { url: 'https://ambrosia.ovh/favicon.ico' }
    },
    {
      title: '\u26A1 **Ambrosia OW Pro** \u2014 Overwatch 2',
      color: 0x1e3a8a,
      description: '```ansi\n\u001b[1;35mFULL SUITE \u2022 Hero Scripting \u2022 Ult HUD \u2022 Dual Slots\u001b[0m\n```'
        + '\u2714\ufe0f Hero Action Scripting (up to 10 scripts)\n'
        + '\u2714\ufe0f Ult Shower HUD & Ability Cooldown Panel\n'
        + '\u2714\ufe0f Dual Aim & Trigger Slots (independent configs)\n'
        + '\u2714\ufe0f Player Outline ESP & Skeleton Hitbox Visuals\n'
        + '\u2714\ufe0f FOV Changer, Third Person & Streamproof Mode\n\n'
        + '**\u23F0 Pricing:**\n'
        + '`Weekly:  $20 USD` \u2502  `\u2191 0.11869 XMR`\n'
        + '`Monthly: $45 USD` \u2502  `\u2191 0.26706 XMR`\n\n'
        + '**\uD83D\uDCB3 Weekly XMR Address:**\n'
        + '```\n8AGpdyaAkKyb8daJ3xksAr9m6y5L6ChND2KHthouN4YcEXMtm5cH72DghMc2ZeMHdP2ewXWxWWRPTUuoMefj1DSg7FVf8kU\n```\n'
        + '**\uD83D\uDCB3 Monthly XMR Address:**\n'
        + '```\n4BE8WBPizoyfveG6Sbtd66V184WktCEoq8EQ2d3ayxKLQxhRiFB4shQDHSVU8f188diVst9thbTtWh4KmrGKZXwwRm6fvyL\n```',
      thumbnail: { url: 'https://ambrosia.ovh/favicon.ico' }
    },
    {
      title: '\uD83D\uDCE1 **CS2 Web Radar** \u2014 Counter-Strike 2',
      color: 0x1e3a8a,
      description: '```ansi\n\u001b[1;36mTriggerbot \u2022 RCS \u2022 2D Tactical Web Radar\u001b[0m\n```'
        + '\u2714\ufe0f Triggerbot with Custom Delay & Trigger Key\n'
        + '\u2714\ufe0f RCS Recoil Control (Weapon Profiles, Humanize)\n'
        + '\u2714\ufe0f 2D Tactical Web Radar (Themes, Calibration, Zoom)\n'
        + '\u2714\ufe0f Bomb Carrier, Defusing, Flashed & Grenade Tracking\n'
        + '\u2714\ufe0f Works on Phone, Tablet & Linux (any browser)\n\n'
        + '**\u23F0 Pricing:**\n'
        + '`Weekly:  $5 USD`  \u2502  `\u2191 0.02968 XMR`\n'
        + '`Monthly: $15 USD` \u2502  `\u2191 0.08902 XMR`\n\n'
        + '**\uD83D\uDCB3 Weekly XMR Address:**\n'
        + '```\n84hxPfyebV85yHJi6BuBnnKxBjYRGc1dMURtmv4By4QjNF9Czaho5EPQzeGEeNtVfpCyX1v4dRLac2LWLEnSC4EK7BsKZKc\n```\n'
        + '**\uD83D\uDCB3 Monthly XMR Address:**\n'
        + '```\n8AVUcXxR3ircP1BhpUi3fhczeag4LQjCaJKBe2opbDrKCexzqYAwjk3U63uGeaU4Wk7ztyDtoYEuHXxQ46f27c4AR2c6mQf\n```',
      thumbnail: { url: 'https://ambrosia.ovh/favicon.ico' }
    },
    {
      title: '\uD83C\uDF96\uFE0F **Ambrosia FN** \u2014 Fortnite',
      color: 0x1e3a8a,
      description: '```ansi\n\u001b[1;32mAimbot \u2022 ESP \u2022 Loot Radar \u2022 On-Screen Radar\u001b[0m\n```'
        + '\u2714\ufe0f Aimbot with Prediction & Visible Check\n'
        + '\u2714\ufe0f Box, Skeleton, China Hat, Rank & Distance ESP\n'
        + '\u2714\ufe0f World Loot ESP with Rarity & Distance Customisation\n'
        + '\u2714\ufe0f On-Screen Radar (Circle or Square styles)\n'
        + '\u2714\ufe0f 10 Config Slots & Config Sharing System\n\n'
        + '**\u23F0 Pricing:**\n'
        + '`Weekly:  $20 USD` \u2502  `\u2191 0.11869 XMR`\n'
        + '`Monthly: $45 USD` \u2502  `\u2191 0.26706 XMR`\n\n'
        + '**\uD83D\uDCB3 Weekly XMR Address:**\n'
        + '```\n8AGpdyaAkKyb8daJ3xksAr9m6y5L6ChND2KHthouN4YcEXMtm5cH72DghMc2ZeMHdP2ewXWxWWRPTUuoMefj1DSg7FVf8kU\n```\n'
        + '**\uD83D\uDCB3 Monthly XMR Address:**\n'
        + '```\n4BE8WBPizoyfveG6Sbtd66V184WktCEoq8EQ2d3ayxKLQxhRiFB4shQDHSVU8f188diVst9thbTtWh4KmrGKZXwwRm6fvyL\n```',
      thumbnail: { url: 'https://ambrosia.ovh/favicon.ico' }
    },
    {
      title: '\uD83D\uDCCB **Customer Instructions**',
      color: 0x5865f2,
      description: 'Follow these steps to complete your purchase:\n\n'
        + '**\u2460 Choose Your Product** \u2014 Select from the dropdown below. Each product has its own XMR wallet address listed above.\n\n'
        + '**\u2461 Join Our Discord** \u2014 You **must** be in our server. Invite: **discord.gg/bT9dpnerP4**\n\n'
        + '**\u2462 Open a Ticket** \u2014 A **private ticket channel** is created. Only you and staff can see it.\n\n'
        + '**\u2463 Share Your Discord User ID** \u2014 Inside the ticket:\n'
        + '``` \n'
        + ' 1. Go to Discord Settings \n'
        + ' 2. Advanced \u2192 Enable Developer Mode \n'
        + ' 3. Go back \u2192 Right-click your profile \n'
        + ' 4. Click "Copy User ID" \n'
        + ' ```\n'
        + '**\u2464 Send XMR Payment** \u2014 Copy the address from above, send the **exact amount** from your wallet.\n\n'
        + '**\u2465 Paste Your TXID** \u2014 After sending, copy the Transaction ID and paste it in the ticket.\n\n'
        + '**\u2466 Wait for Verification** \u2014 Staff verifies payment on-chain, then delivers your license key.',
      footer: { text: 'Ambrosia.ovh \u2022 Official Reseller \u2022 All Payments Verified On-Chain', icon_url: 'https://ambrosia.ovh/favicon.ico' },
      timestamp: new Date().toISOString()
    },
    {
      title: '\u2714\ufe0F \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510',
      color: 0x065f46,
      fields: [
        { name: '\u2714\ufe0f **Undetected & Virtualized**', value: 'All clients run virtualized with streamproof rendering. No anti-cheat detection.', inline: true },
        { name: '\u26A1 **Instant Key Delivery**', value: 'Receive your license key within minutes of payment verification.', inline: true },
        { name: '\uD83D\uDD12 **Zero KYC Monero**', value: 'Pay with XMR \u2014 no identity verification, no KYC, no personal data collected.', inline: true },
        { name: '\uD83C\uDFAF **10 Config Slots**', value: 'Save up to 10 unique configurations per product. Switch with keybinds or share.', inline: true },
        { name: '\uD83D\uDCF1 **Multi-Device**', value: 'CS2 Web Radar works on phones, tablets, and Linux. OW & FN on Win 10/11.', inline: true },
        { name: '\uD83D\uDEE1\uFE0F **Record & Stream Proof**', value: 'OBS, screen recorders, and streaming software cannot detect overlays or ESP.', inline: true },
        { name: '\uD83D\uDCAA **Performance Optimized**', value: 'GPU/CPU renderer selection, VSync, and performance mode for minimal FPS impact.', inline: true },
        { name: '\uD83D\uDC65 **Dedicated Staff Team**', value: 'Our staff is available to help with setup, troubleshooting, and questions.', inline: true }
      ]
    },
    {
      title: '\u26A0\uFE0F **Rules & Warnings**',
      color: 0x991b1b,
      description: '``` \n'
        + ' \u2716  Do NOT take screenshots or record videos of yourself cheating \n'
        + ' \u2716  Do NOT share your license key with anyone \n'
        + ' \u2716  Do NOT reverse engineer, crack, or decompile the software \n'
        + ' \u2716  Do NOT attempt to resell or redistribute the product \n'
        + ' \u2716  Do NOT discuss drama, politics, or religion in tickets \n'
        + ' \u2716  Do NOT impersonate staff, admins, or owners \n'
        + ' ```\n'
        + '**Violation of these rules results in an immediate permanent ban with no refund.**\n\n'
        + '\uD83D\uDEAB **Refund Policy:** All sales are final. No refunds will be issued under any circumstances including game bans, server bans, or user error.',
      footer: { text: 'Ambrosia.ovh \u2022 Rules are strictly enforced', icon_url: 'https://ambrosia.ovh/favicon.ico' },
      timestamp: new Date().toISOString()
    },
    {
      title: '\uD83D\uDD35 **Open a Ticket**',
      description: 'Select a product from the dropdown menu below to **instantly create a private ticket** with our staff team.\n\n'
        + '\uD83D\uDCA1 **Tip:** Check the XMR addresses listed above for your chosen product before sending payment.',
      color: 0x5865f2,
      footer: { text: 'Ambrosia.ovh \u2022 Official Reseller \u2022 est. 2025', icon_url: 'https://ambrosia.ovh/favicon.ico' },
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
            { label: 'Ambrosia OW Lite', description: 'Overwatch 2 \u2022 $5/wk \u00b7 $10/mo \u2022 Aimbot, Triggerbot, Streamproof', value: 'ambrosia-ow-lite', emoji: { name: '\uD83C\uDFAF' } },
            { label: 'Ambrosia OW Pro', description: 'Overwatch 2 \u2022 $20/wk \u00b7 $45/mo \u2022 Hero Scripting, Ult HUD', value: 'ambrosia-ow-pro', emoji: { name: '\u26A1' } },
            { label: 'CS2 Web Radar', description: 'Counter-Strike 2 \u2022 $5/wk \u00b7 $15/mo \u2022 Triggerbot, RCS, Web Radar', value: 'ambrosia-cs2-web', emoji: { name: '\uD83D\uDCE1' } },
            { label: 'Ambrosia FN', description: 'Fortnite \u2022 $20/wk \u00b7 $45/mo \u2022 Aimbot, ESP, Loot Radar', value: 'ambrosia-fn', emoji: { name: '\uD83C\uDF96\uFE0F' } },
            { label: 'General Support', description: 'Questions, issues, or anything else \u2022 Our staff will help', value: 'general-support', emoji: { name: '\uD83D\uDCAC' } }
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
