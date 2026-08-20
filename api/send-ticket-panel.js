const ENCODED_BOT_TOKEN = 'TVRVek9UY3dNVFF6TlRJek56WTJNamd6TUEuR1pzd1I4LmE0cms4NHJvM2hmSjdFREYwMEltM18tVlh0MWlOVURQSndYdmV3';
const TICKET_PANEL_CHANNEL_ID = '1539954048722010193';
const GUILD_ID = '1539404742055166045';
const TICKET_CATEGORY_ID = '1539707872416636939';
const STAFF_ROLE_ID = '1539709640240005220';

const XMR_ADDRESSES = {
  'ambrosia-ow-lite': {
    name: 'Ambrosia OW Lite',
    game: 'Overwatch 2',
    weekly: '89aFGA5EWqvJUnNacSNW6RGPctm74XKx8Nvz5t45BDm8ZfDWdBH2xJgZsL4mFi47kHaamwu2PcQAT3E1vUJmpPhD15WjkiB',
    monthly: '8AGpdyaAkKyb8daJ3xksAr9m6y5L6ChND2KHthouN4YcEXMtm5cH72DghMc2ZeMHdP2ewXWxWWRPTUuoMefj1DSg7FVf8kU',
    weeklyPrice: '$5',
    monthlyPrice: '$10'
  },
  'ambrosia-ow-pro': {
    name: 'Ambrosia OW Pro',
    game: 'Overwatch 2',
    weekly: '8AGpdyaAkKyb8daJ3xksAr9m6y5L6ChND2KHthouN4YcEXMtm5cH72DghMc2ZeMHdP2ewXWxWWRPTUuoMefj1DSg7FVf8kU',
    monthly: '4BE8WBPizoyfveG6Sbtd66V184WktCEoq8EQ2d3ayxKLQxhRiFB4shQDHSVU8f188diVst9thbTtWh4KmrGKZXwwRm6fvyL',
    weeklyPrice: '$20',
    monthlyPrice: '$45'
  },
  'ambrosia-cs2-web': {
    name: 'CS2 Web Radar',
    game: 'Counter-Strike 2',
    weekly: '84hxPfyebV85yHJi6BuBnnKxBjYRGc1dMURtmv4By4QjNF9Czaho5EPQzeGEeNtVfpCyX1v4dRLac2LWLEnSC4EK7BsKZKc',
    monthly: '8AVUcXxR3ircP1BhpUi3fhczeag4LQjCaJKBe2opbDrKCexzqYAwjk3U63uGeaU4Wk7ztyDtoYEuHXxQ46f27c4AR2c6mQf',
    weeklyPrice: '$5',
    monthlyPrice: '$15'
  },
  'ambrosia-fn': {
    name: 'Ambrosia FN',
    game: 'Fortnite',
    weekly: '8AGpdyaAkKyb8daJ3xksAr9m6y5L6ChND2KHthouN4YcEXMtm5cH72DghMc2ZeMHdP2ewXWxWWRPTUuoMefj1DSg7FVf8kU',
    monthly: '4BE8WBPizoyfveG6Sbtd66V184WktCEoq8EQ2d3ayxKLQxhRiFB4shQDHSVU8f188diVst9thbTtWh4KmrGKZXwwRm6fvyL',
    weeklyPrice: '$20',
    monthlyPrice: '$45'
  }
};

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
      title: '\u2728 \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510',
      description:
        '**Welcome to the Ambrosia Reseller Support Hub**\n\n'
        + '> This is your one-stop gateway to purchase **undetected gaming clients** and receive\n'
        + '> instant support from our dedicated staff team. Everything is handled privately through\n'
        + '> secure Discord ticket channels.\n\n'
        + '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n\n'
        + '\uD83D\uDCA1 **How it works:** Select a product below \u2192 A private ticket is created \u2192 Staff assists you one-on-one\n'
        + '\uD83D\uDD12 **Privacy:** Only you and staff can see your ticket. All conversations are confidential.\n'
        + '\u23F0 **Speed:** Tickets are created instantly. Staff typically respond within minutes.',
      color: 0x2563eb,
      image: { url: 'https://ambrosia.ovh/og-image.png' },
      timestamp: new Date().toISOString()
    },

    {
      title: '\uD83C\uDFAE \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518',
      description: '\u200b',
      color: 0x1e3a8a,
      fields: [
        {
          name: '\uD83C\uDFAF **Ambrosia OW Lite** \u2014 Overwatch 2',
          value: '```ansi\n\u001b[1;34mAimbot \u2022 Triggerbot \u2022 Flickbot \u2022 Streamproof\u001b[0m\n```'
            + '\u2714\ufe0f Auto Bunnyhop & Null Binding (SnapTap)\n'
            + '\u2714\ufe0f Multipoint Visualisation & Hitbox Customisation\n'
            + '\u2714\ufe0f Streamproof & Record Proof Rendering\n'
            + '\u2714\ufe0f 10 Configs, Config Sharing & Keybind Switcher\n'
            + '\u2714\ufe0f GUI Customisation (Accent, Window Color, Logos)\n\n'
            + '**\u23F0 Pricing:**\n'
            + '`Weekly:  $5 USD`  \u2502  `\u2191 0.02968 XMR`\n'
            + '`Monthly: $10 USD` \u2502  `\u2191 0.05935 XMR`\n\n'
            + '**\uD83D\uDCB3 Weekly Address:**\n'
            + '```\n89aFGA5EWqvJUnNacSNW6RGPctm74XKx8Nvz5t45BDm8ZfDWdBH2xJgZsL4mFi47kHaamwu2PcQAT3E1vUJmpPhD15WjkiB\n```\n'
            + '**\uD83D\uDCB3 Monthly Address:**\n'
            + '```\n8AGpdyaAkKyb8daJ3xksAr9m6y5L6ChND2KHthouN4YcEXMtm5cH72DghMc2ZeMHdP2ewXWxWWRPTUuoMefj1DSg7FVf8kU\n```',
          inline: false
        },
        {
          name: '\u200b',
          value: '\u200b',
          inline: false
        },
        {
          name: '\u26A1 **Ambrosia OW Pro** \u2014 Overwatch 2',
          value: '```ansi\n\u001b[1;35mFULL SUITE \u2022 Hero Scripting \u2022 Ult HUD \u2022 Dual Slots\u001b[0m\n```'
            + '\u2714\ufe0f Hero Action Scripting (up to 10 scripts)\n'
            + '\u2714\ufe0f Ult Shower HUD & Ability Cooldown Panel\n'
            + '\u2714\ufe0f Dual Aim & Trigger Slots (independent configs)\n'
            + '\u2714\ufe0f Player Outline ESP & Skeleton Hitbox Visuals\n'
            + '\u2714\ufe0f FOV Changer, Third Person & Streamproof Mode\n\n'
            + '**\u23F0 Pricing:**\n'
            + '`Weekly:  $20 USD` \u2502  `\u2191 0.11869 XMR`\n'
            + '`Monthly: $45 USD` \u2502  `\u2191 0.26706 XMR`\n\n'
            + '**\uD83D\uDCB3 Weekly Address:**\n'
            + '```\n8AGpdyaAkKyb8daJ3xksAr9m6y5L6ChND2KHthouN4YcEXMtm5cH72DghMc2ZeMHdP2ewXWxWWRPTUuoMefj1DSg7FVf8kU\n```\n'
            + '**\uD83D\uDCB3 Monthly Address:**\n'
            + '```\n4BE8WBPizoyfveG6Sbtd66V184WktCEoq8EQ2d3ayxKLQxhRiFB4shQDHSVU8f188diVst9thbTtWh4KmrGKZXwwRm6fvyL\n```',
          inline: false
        },
        {
          name: '\u200b',
          value: '\u200b',
          inline: false
        },
        {
          name: '\uD83D\uDCE1 **CS2 Web Radar** \u2014 Counter-Strike 2',
          value: '```ansi\n\u001b[1;36mTriggerbot \u2022 RCS \u2022 2D Tactical Web Radar\u001b[0m\n```'
            + '\u2714\ufe0f Triggerbot with Custom Delay & Trigger Key\n'
            + '\u2714\ufe0f RCS Recoil Control (Weapon Profiles, Humanize)\n'
            + '\u2714\ufe0f 2D Tactical Web Radar (Themes, Calibration, Zoom)\n'
            + '\u2714\ufe0f Bomb Carrier, Defusing, Flashed & Grenade Tracking\n'
            + '\u2714\ufe0f Works on Phone, Tablet & Linux (any browser)\n\n'
            + '**\u23F0 Pricing:**\n'
            + '`Weekly:  $5 USD`  \u2502  `\u2191 0.02968 XMR`\n'
            + '`Monthly: $15 USD` \u2502  `\u2191 0.08902 XMR`\n\n'
            + '**\uD83D\uDCB3 Weekly Address:**\n'
            + '```\n84hxPfyebV85yHJi6BuBnnKxBjYRGc1dMURtmv4By4QjNF9Czaho5EPQzeGEeNtVfpCyX1v4dRLac2LWLEnSC4EK7BsKZKc\n```\n'
            + '**\uD83D\uDCB3 Monthly Address:**\n'
            + '```\n8AVUcXxR3ircP1BhpUi3fhczeag4LQjCaJKBe2opbDrKCexzqYAwjk3U63uGeaU4Wk7ztyDtoYEuHXxQ46f27c4AR2c6mQf\n```',
          inline: false
        },
        {
          name: '\u200b',
          value: '\u200b',
          inline: false
        },
        {
          name: '\uD83C\uDF96\uFE0F **Ambrosia FN** \u2014 Fortnite',
          value: '```ansi\n\u001b[1;32mAimbot \u2022 ESP \u2022 Loot Radar \u2022 On-Screen Radar\u001b[0m\n```'
            + '\u2714\ufe0f Aimbot with Prediction & Visible Check\n'
            + '\u2714\ufe0f Box, Skeleton, China Hat, Rank & Distance ESP\n'
            + '\u2714\ufe0f World Loot ESP with Rarity & Distance Customisation\n'
            + '\u2714\ufe0f On-Screen Radar (Circle or Square styles)\n'
            + '\u2714\ufe0f 10 Config Slots & Config Sharing System\n\n'
            + '**\u23F0 Pricing:**\n'
            + '`Weekly:  $20 USD` \u2502  `\u2191 0.11869 XMR`\n'
            + '`Monthly: $45 USD` \u2502  `\u2191 0.26706 XMR`\n\n'
            + '**\uD83D\uDCB3 Weekly Address:**\n'
            + '```\n8AGpdyaAkKyb8daJ3xksAr9m6y5L6ChND2KHthouN4YcEXMtm5cH72DghMc2ZeMHdP2ewXWxWWRPTUuoMefj1DSg7FVf8kU\n```\n'
            + '**\uD83D\uDCB3 Monthly Address:**\n'
            + '```\n4BE8WBPizoyfveG6Sbtd66V184WktCEoq8EQ2d3ayxKLQxhRiFB4shQDHSVU8f188diVst9thbTtWh4KmrGKZXwwRm6fvyL\n```',
          inline: false
        }
      ],
      thumbnail: { url: 'https://ambrosia.ovh/favicon.ico' }
    },

    {
      title: '\uD83D\uDCCB \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510',
      description: '\u200b',
      color: 0x5865f2,
      fields: [
        {
          name: '\u2460 **Choose Your Product**',
          value: 'Select a product from the dropdown menu below this embed. Each product has its own dedicated XMR wallet address listed above \u2014 **make sure you send XMR to the correct address for the product and duration you want.**',
          inline: false
        },
        {
          name: '\u2461 **Join Our Discord Server**',
          value: 'You **must** be a member of our Discord server to open a ticket. If you haven\'t joined yet, use this invite: **discord.gg/bT9dpnerP4**',
          inline: false
        },
        {
          name: '\u2462 **Open a Ticket**',
          value: 'After selecting a product, a **private ticket channel** will be created. Only you and our staff can see it. Inside the ticket, you will see a welcome message with all your order details.',
          inline: false
        },
        {
          name: '\u2463 **Share Your Discord User ID**',
          value: 'Once inside the ticket, share your **Discord User ID** with staff. To get it:\n'
            + '``` \n'
            + ' 1. Go to Discord Settings \n'
            + ' 2. Advanced \u2192 Enable Developer Mode \n'
            + ' 3. Go back \u2192 Right-click your profile \n'
            + ' 4. Click "Copy User ID" \n'
            + ' ```\n'
            + 'Paste it in the ticket chat. This is needed so staff can verify your identity and add you to any additional channels if necessary.',
          inline: false
        },
        {
          name: '\u2464 **Send Your XMR Payment**',
          value: 'Copy the **Monero (XMR) wallet address** shown in the ticket welcome message (matching your chosen product and duration). Send the exact amount from your personal wallet.\n\n'
            + '**\u26A0\ufe0f IMPORTANT:**\n'
            + '\u2022 Send **only XMR** (Monero) to the address \u2014 any other cryptocurrency will be lost\n'
            + '\u2022 Send the **exact amount** shown \u2014 overpayments cannot be refunded\n'
            + '\u2022 After sending, **copy the Transaction ID (TXID)** from your wallet and paste it in the ticket\n'
            + '\u2022 If you don\'t have a TXID, type **"Paying in ticket"** and staff will verify on-chain',
          inline: false
        },
        {
          name: '\u2465 **Verification Process**',
          value: '``` \n'
            + ' \u25B6 Staff verifies your XMR payment on the blockchain \n'
            + ' \u25B6 Staff confirms the transaction has sufficient confirmations \n'
            + ' \u25B6 Staff generates your unique license key \n'
            + ' \u25B6 Staff delivers the key directly in your ticket \n'
            + ' \u25B6 Staff assigns you the "Verified Customer" role \n'
            + ' \u25B6 You receive access to the private product channels \n'
            + ' ```\n'
            + '**Typical time:** 5\u201330 minutes during staff hours.',
          inline: false
        },
        {
          name: '\u2466 **After Verification**',
          value: '\u2714\ufe0f You will receive the **Verified Customer** role in Discord\n'
            + '\u2714\ufe0f You will get access to **private product channels** with setup guides\n'
            + '\u2714\ufe0f You can ask questions in the product-specific channels\n'
            + '\u2714\ufe0f Your license key is tied to your hardware \u2014 do not share it\n'
            + '\u2714\ufe0f If you need help with setup, open a new General Support ticket',
          inline: false
        }
      ],
      footer: {
        text: 'Ambrosia.ovh \u2022 Official Reseller \u2022 All Payments Verified On-Chain',
        icon_url: 'https://ambrosia.ovh/favicon.ico'
      },
      timestamp: new Date().toISOString()
    },

    {
      title: '\uD83D\uDEE1\uFE0F \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510',
      description: '\u200b',
      color: 0x065f46,
      fields: [
        {
          name: '\u2714\ufe0f **Undetected & Virtualized**',
          value: 'All clients run in a virtualized environment with streamproof rendering. No anti-cheat detection.',
          inline: true
        },
        {
          name: '\u26A1 **Instant Key Delivery**',
          value: 'Receive your license key within minutes of payment verification. No waiting.',
          inline: true
        },
        {
          name: '\uD83D\uDD12 **Zero KYC Monero**',
          value: 'Pay with Monero (XMR) \u2014 no identity verification, no KYC, no personal data collected.',
          inline: true
        },
        {
          name: '\uD83C\uDFAF **10 Config Slots**',
          value: 'Save up to 10 unique configurations per product. Switch with keybinds or share with friends.',
          inline: true
        },
        {
          name: '\uD83D\uDCF1 **Multi-Device Support**',
          value: 'CS2 Web Radar works on phones, tablets, and Linux. OW & FN clients work on Win 10/11.',
          inline: true
        },
        {
          name: '\uD83D\uDEE1\uFE0F **Record & Stream Proof**',
          value: 'OBS, screen recorders, and streaming software cannot detect the overlays or ESP.',
          inline: true
        },
        {
          name: '\uD83D\uDCAA **Performance Optimized**',
          value: 'GPU and CPU renderer selection, VSync, and performance mode for minimal FPS impact.',
          inline: true
        },
        {
          name: '\uD83D\uDC65 **Dedicated Staff Team**',
          value: 'Our staff is available to help with setup, troubleshooting, and any questions you have.',
          inline: true
        },
        {
          name: '\uD83D\uDCC3 **Full Documentation**',
          value: 'Every product comes with comprehensive setup guides and feature documentation.',
          inline: true
        }
      ],
      thumbnail: { url: 'https://ambrosia.ovh/favicon.ico' }
    },

    {
      title: '\u26A0\uFE0F \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510',
      description: '\u200b',
      color: 0x991b1b,
      fields: [
        {
          name: '\uD83D\uDEAB **Rules & Warnings**',
          value: '``` \n'
            + ' \u2716  Do NOT take screenshots or record videos of yourself cheating \n'
            + ' \u2716  Do NOT share your license key with anyone \n'
            + ' \u2716  Do NOT reverse engineer, crack, or decompile the software \n'
            + ' \u2716  Do NOT attempt to resell or redistribute the product \n'
            + ' \u2716  Do NOT discuss drama, politics, or religion in tickets \n'
            + ' \u2716  Do NOT impersonate staff, admins, or owners \n'
            + ' ```\n'
            + '**Violation of these rules results in an immediate permanent ban with no refund.**',
          inline: false
        },
        {
          name: '\u2757 **Refund Policy**',
          value: '**All sales are final.** No refunds will be issued under any circumstances including game bans, server bans, or user error. Verify your system meets the requirements before purchasing.',
          inline: false
        },
        {
          name: '\uD83D\uDEE1\uFE0F **Spoofer Advisory**',
          value: 'Using a temp spoofer with our products may cause performance issues. Our products are heavily virtualized and some spoofers interfere with performance. Multiple tests on various systems show good performance without spoofers.',
          inline: false
        }
      ],
      footer: {
        text: 'Ambrosia.ovh \u2022 Rules are strictly enforced',
        icon_url: 'https://ambrosia.ovh/favicon.ico'
      },
      timestamp: new Date().toISOString()
    },

    {
      title: '\uD83D\uDD35 \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510',
      description: 'Select a product from the dropdown menu below to **instantly create a private ticket** with our staff team.\n\n'
        + '\uD83D\uDCA1 **Tip:** Check the XMR addresses listed above for your chosen product before sending payment.',
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
