const ENCODED_BOT_TOKEN = 'TVRVek9UY3dNVFF6TlRJek56WTJNamd6TUEuR1pzd1I4LmE0cms4NHJvM2hmSjdFREYwMEltM18tVlh0MWlOVURQSndYdmV3';
const GUILD_ID = '1539404742055166045';
const SECRET = 'ambrosia-setup-2026';

function getBotToken() {
  try { return Buffer.from(ENCODED_BOT_TOKEN, 'base64').toString('utf-8'); } catch { return ''; }
}

async function api(t, m, p, b) {
  var o = { method: m, headers: { Authorization: 'Bot ' + t, 'Content-Type': 'application/json' } };
  if (b) o.body = JSON.stringify(b);
  try {
    var r = await fetch('https://discord.com/api/v10' + p, o);
    var txt = await r.text();
    var d; try { d = JSON.parse(txt); } catch (e) { d = txt; }
    return { ok: r.ok, status: r.status, data: d };
  } catch (e) {
    return { ok: false, status: 0, data: e.message };
  }
}

function ab() {
  var r = BigInt(0);
  for (var i = 0; i < arguments.length; i++) {
    if (arguments[i] != null) r = r | BigInt(String(arguments[i]));
  }
  return r.toString();
}

var V = {
  VIEW_CHANNEL: 1024,
  SEND_MESSAGES: 2048,
  SEND_MESSAGES_THREADS: 274877906944,
  CREATE_PUBLIC_THREADS: 1073741824,
  CREATE_PRIVATE_THREADS: 16,
  EMBED_LINKS: 16384,
  ATTACH_FILES: 4096,
  READ_MESSAGE_HISTORY: 65536,
  MENTION_EVERYONE: 131072,
  MANAGE_MESSAGES: 8192,
  MANAGE_THREADS: 34359738368,
  MANAGE_CHANNELS: 32,
  MANAGE_ROLES: 134217728,
  ADD_REACTIONS: 64,
  CONNECT: 2097152,
  SPEAK: 4194304,
  MUTE_MEMBERS: 8388608,
  DEAFEN_MEMBERS: 16777216,
  MOVE_MEMBERS: 33554432,
  USE_APPLICATION_COMMANDS: 2147483648,
  ADMIN: 8
};

function OW(id, allow, deny) {
  return { id: id, type: 0, allow: String(allow || 0), deny: String(deny || 0) };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var BT = getBotToken();
  if (!BT) return res.status(500).json({ error: 'No bot token' });
  if (!req.body || req.body.secret !== SECRET) return res.status(403).json({ error: 'Bad secret' });

  var gid = GUILD_ID;
  var log = [];

  try {
    var g = await api(BT, 'GET', '/guilds/' + gid);
    if (!g.ok) return res.status(500).json({ error: 'Cannot access guild', details: g.data });
    log.push('Guild: ' + g.data.name);

    var chR = await api(BT, 'GET', '/guilds/' + gid + '/channels');
    if (chR.ok && Array.isArray(chR.data)) {
      for (var i = 0; i < chR.data.length; i++) {
        await api(BT, 'DELETE', '/channels/' + chR.data[i].id).catch(function(){});
      }
      log.push('Deleted ' + chR.data.length + ' channels');
    }

    var rlR = await api(BT, 'GET', '/guilds/' + gid + '/roles');
    if (rlR.ok && Array.isArray(rlR.data)) {
      for (var j = 0; j < rlR.data.length; j++) {
        if (rlR.data[j].name === '@everyone' || rlR.data[j].managed) continue;
        await api(BT, 'DELETE', '/guilds/' + gid + '/roles/' + rlR.data[j].id).catch(function(){});
      }
      log.push('Deleted old roles');
    }

    var ADMIN = '8';

    var rOwner = await api(BT, 'POST', '/guilds/' + gid + '/roles', { name: 'Owner', color: 0xdc2626, permissions: ADMIN, mentionable: true, hoist: true });
    var rBot = await api(BT, 'POST', '/guilds/' + gid + '/roles', { name: 'Ambrosia Bot', color: 0xed4245, permissions: ADMIN, mentionable: false, hoist: true });
    var rSeller = await api(BT, 'POST', '/guilds/' + gid + '/roles', { name: 'Seller', color: 0xf47b67, permissions: ab(V.VIEW_CHANNEL, V.SEND_MESSAGES, V.SEND_MESSAGES_THREADS, V.CREATE_PUBLIC_THREADS, V.CREATE_PRIVATE_THREADS, V.EMBED_LINKS, V.ATTACH_FILES, V.READ_MESSAGE_HISTORY, V.MENTION_EVERYONE, V.MANAGE_MESSAGES, V.MANAGE_THREADS, V.MANAGE_CHANNELS, V.ADD_REACTIONS, V.USE_APPLICATION_COMMANDS), mentionable: true, hoist: true });
    var rStaff = await api(BT, 'POST', '/guilds/' + gid + '/roles', { name: 'Staff', color: 0x5865f2, permissions: ab(V.VIEW_CHANNEL, V.SEND_MESSAGES, V.SEND_MESSAGES_THREADS, V.CREATE_PUBLIC_THREADS, V.CREATE_PRIVATE_THREADS, V.EMBED_LINKS, V.ATTACH_FILES, V.READ_MESSAGE_HISTORY, V.MENTION_EVERYONE, V.MANAGE_MESSAGES, V.MANAGE_THREADS, V.ADD_REACTIONS, V.USE_APPLICATION_COMMANDS), mentionable: true, hoist: true });
    var rCust = await api(BT, 'POST', '/guilds/' + gid + '/roles', { name: 'Verified Customer', color: 0x57f287, permissions: ab(V.VIEW_CHANNEL, V.SEND_MESSAGES, V.READ_MESSAGE_HISTORY, V.ADD_REACTIONS, V.EMBED_LINKS, V.ATTACH_FILES, V.CREATE_PUBLIC_THREADS, V.SEND_MESSAGES_THREADS, V.USE_APPLICATION_COMMANDS), mentionable: false, hoist: true });
    var rMember = await api(BT, 'POST', '/guilds/' + gid + '/roles', { name: 'Member', color: 0x99aab5, permissions: ab(V.VIEW_CHANNEL, V.SEND_MESSAGES, V.READ_MESSAGE_HISTORY, V.ADD_REACTIONS, V.EMBED_LINKS, V.ATTACH_FILES, V.CREATE_PUBLIC_THREADS, V.SEND_MESSAGES_THREADS, V.USE_APPLICATION_COMMANDS), mentionable: false, hoist: false });

    log.push('Owner: ' + (rOwner.ok ? rOwner.data.id : 'FAIL'));
    log.push('Bot: ' + (rBot.ok ? rBot.data.id : 'FAIL'));
    log.push('Seller: ' + (rSeller.ok ? rSeller.data.id : 'FAIL'));
    log.push('Staff: ' + (rStaff.ok ? rStaff.data.id : 'FAIL'));
    log.push('Customer: ' + (rCust.ok ? rCust.data.id : 'FAIL'));
    log.push('Member: ' + (rMember.ok ? rMember.data.id : 'FAIL'));

    var botId = rBot.ok ? rBot.data.id : '';
    var ownerId = rOwner.ok ? rOwner.data.id : '';
    var sellerId = rSeller.ok ? rSeller.data.id : '';
    var staffId = rStaff.ok ? rStaff.data.id : '';
    var custId = rCust.ok ? rCust.data.id : '';
    var memberId = rMember.ok ? rMember.data.id : '';

    var DENY_VIEW = ab(V.VIEW_CHANNEL);
    var ALLOW_FULL = ab(V.VIEW_CHANNEL, V.SEND_MESSAGES, V.SEND_MESSAGES_THREADS, V.CREATE_PUBLIC_THREADS, V.CREATE_PRIVATE_THREADS, V.EMBED_LINKS, V.ATTACH_FILES, V.READ_MESSAGE_HISTORY, V.MENTION_EVERYONE, V.ADD_REACTIONS, V.USE_APPLICATION_COMMANDS);
    var ALLOW_STAFF = ab(V.VIEW_CHANNEL, V.SEND_MESSAGES, V.SEND_MESSAGES_THREADS, V.CREATE_PUBLIC_THREADS, V.CREATE_PRIVATE_THREADS, V.EMBED_LINKS, V.ATTACH_FILES, V.READ_MESSAGE_HISTORY, V.MENTION_EVERYONE, V.MANAGE_MESSAGES, V.MANAGE_THREADS, V.ADD_REACTIONS, V.USE_APPLICATION_COMMANDS);
    var ALLOW_SELLER = ab(V.VIEW_CHANNEL, V.SEND_MESSAGES, V.SEND_MESSAGES_THREADS, V.CREATE_PUBLIC_THREADS, V.CREATE_PRIVATE_THREADS, V.EMBED_LINKS, V.ATTACH_FILES, V.READ_MESSAGE_HISTORY, V.MENTION_EVERYONE, V.MANAGE_MESSAGES, V.MANAGE_THREADS, V.MANAGE_CHANNELS, V.ADD_REACTIONS, V.USE_APPLICATION_COMMANDS);
    var ALLOW_READONLY = ab(V.VIEW_CHANNEL, V.READ_MESSAGE_HISTORY, V.ADD_REACTIONS, V.EMBED_LINKS);
    var ALLOW_NOTALK = ab(V.VIEW_CHANNEL, V.READ_MESSAGE_HISTORY);
    var ALLOW_TICKET_BTN = ab(V.VIEW_CHANNEL, V.READ_MESSAGE_HISTORY, V.USE_APPLICATION_COMMANDS);
    var ALLOW_VOICE = ab(V.VIEW_CHANNEL, V.CONNECT, V.SPEAK);
    var ALLOW_VOICE_STAFF = ab(V.VIEW_CHANNEL, V.CONNECT, V.SPEAK, V.MUTE_MEMBERS, V.DEAFEN_MEMBERS, V.MOVE_MEMBERS);

    function infoOw() {
      return [
        OW(gid, ALLOW_READONLY, 0),
        OW(staffId, ALLOW_STAFF, 0),
        OW(sellerId, ALLOW_SELLER, 0),
        OW(ownerId, ALLOW_SELLER, 0),
        OW(botId, ALLOW_SELLER, 0)
      ];
    }

    function generalOw() {
      return [
        OW(gid, ALLOW_FULL, 0),
        OW(staffId, ALLOW_STAFF, 0),
        OW(sellerId, ALLOW_SELLER, 0),
        OW(ownerId, ALLOW_SELLER, 0),
        OW(botId, ALLOW_SELLER, 0)
      ];
    }

    function staffOw() {
      return [
        OW(gid, 0, DENY_VIEW),
        OW(staffId, ALLOW_STAFF, 0),
        OW(sellerId, ALLOW_SELLER, 0),
        OW(ownerId, ALLOW_SELLER, 0),
        OW(botId, ALLOW_SELLER, 0)
      ];
    }

    function voiceOw() {
      return [
        OW(gid, ALLOW_VOICE, 0),
        OW(staffId, ALLOW_VOICE_STAFF, 0),
        OW(sellerId, ALLOW_VOICE_STAFF, 0),
        OW(ownerId, ALLOW_VOICE_STAFF, 0),
        OW(botId, ALLOW_SELLER, 0)
      ];
    }

    async function mkCat(name, perms) {
      var r = await api(BT, 'POST', '/guilds/' + gid + '/channels', { name: name, type: 4, permission_overwrites: perms });
      log.push('Cat ' + name + ': ' + (r.ok ? r.data.id : 'FAIL ' + JSON.stringify(r.data).substring(0, 100)));
      return r.ok ? r.data.id : null;
    }

    async function mkCh(name, type, pid, perms) {
      var r = await api(BT, 'POST', '/guilds/' + gid + '/channels', { name: name, type: type, parent_id: pid, permission_overwrites: perms || [] });
      log.push('Ch ' + name + ': ' + (r.ok ? r.data.id : 'FAIL ' + JSON.stringify(r.data).substring(0, 100)));
      return r.ok ? r.data.id : null;
    }

    var catInfoId = await mkCat('INFORMATION', infoOw());
    var catGenId = await mkCat('GENERAL', generalOw());
    var catStfId = await mkCat('STAFF', staffOw());
    var catVceId = await mkCat('VOICE', voiceOw());

    var ch = {};

    ch.rules = await mkCh('rules', 0, catInfoId, [
      OW(gid, ALLOW_NOTALK, 0),
      OW(staffId, ab(V.VIEW_CHANNEL, V.SEND_MESSAGES, V.READ_MESSAGE_HISTORY, V.MANAGE_MESSAGES), 0),
      OW(sellerId, ab(V.VIEW_CHANNEL, V.SEND_MESSAGES, V.READ_MESSAGE_HISTORY, V.MANAGE_MESSAGES), 0),
      OW(ownerId, ab(V.VIEW_CHANNEL, V.SEND_MESSAGES, V.READ_MESSAGE_HISTORY, V.MANAGE_MESSAGES), 0),
      OW(botId, ab(V.ADMIN), 0)
    ]);

    ch.announcements = await mkCh('announcements', 0, catInfoId, [
      OW(gid, ALLOW_READONLY, 0),
      OW(staffId, ab(V.VIEW_CHANNEL, V.SEND_MESSAGES, V.READ_MESSAGE_HISTORY, V.MENTION_EVERYONE), 0),
      OW(sellerId, ab(V.VIEW_CHANNEL, V.SEND_MESSAGES, V.READ_MESSAGE_HISTORY, V.MENTION_EVERYONE), 0),
      OW(ownerId, ab(V.VIEW_CHANNEL, V.SEND_MESSAGES, V.READ_MESSAGE_HISTORY, V.MENTION_EVERYONE), 0),
      OW(botId, ab(V.ADMIN), 0)
    ]);

    ch.catalog = await mkCh('product-catalog', 0, catInfoId, [
      OW(gid, ALLOW_READONLY, 0),
      OW(staffId, ab(V.VIEW_CHANNEL, V.SEND_MESSAGES, V.READ_MESSAGE_HISTORY), 0),
      OW(sellerId, ab(V.VIEW_CHANNEL, V.SEND_MESSAGES, V.READ_MESSAGE_HISTORY), 0),
      OW(ownerId, ab(V.VIEW_CHANNEL, V.SEND_MESSAGES, V.READ_MESSAGE_HISTORY), 0),
      OW(botId, ab(V.ADMIN), 0)
    ]);

    ch.links = await mkCh('links', 0, catInfoId, [
      OW(gid, ALLOW_READONLY, 0),
      OW(staffId, ALLOW_READONLY, 0),
      OW(sellerId, ALLOW_READONLY, 0),
      OW(ownerId, ALLOW_READONLY, 0),
      OW(botId, ab(V.ADMIN), 0)
    ]);

    ch.generalChat = await mkCh('general-chat', 0, catGenId, generalOw());
    ch.offTopic = await mkCh('off-topic', 0, catGenId, generalOw());

    var catSupId = await mkCat('SUPPORT', [
      OW(gid, ab(V.VIEW_CHANNEL, V.READ_MESSAGE_HISTORY), 0),
      OW(staffId, ALLOW_STAFF, 0),
      OW(sellerId, ALLOW_SELLER, 0),
      OW(ownerId, ALLOW_SELLER, 0),
      OW(botId, ab(V.ADMIN), 0)
    ]);

    ch.ticketChannel = await mkCh('open-your-own-ticket', 0, catSupId, [
      OW(gid, ALLOW_TICKET_BTN, 0),
      OW(staffId, ab(V.VIEW_CHANNEL, V.READ_MESSAGE_HISTORY, V.USE_APPLICATION_COMMANDS), 0),
      OW(sellerId, ab(V.VIEW_CHANNEL, V.READ_MESSAGE_HISTORY, V.USE_APPLICATION_COMMANDS), 0),
      OW(ownerId, ab(V.VIEW_CHANNEL, V.READ_MESSAGE_HISTORY, V.USE_APPLICATION_COMMANDS), 0),
      OW(botId, ab(V.ADMIN), 0)
    ]);

    ch.ticketLogs = await mkCh('ticket-logs', 0, catSupId, staffOw());
    ch.staffChat = await mkCh('staff-chat', 0, catStfId, staffOw());
    ch.orderNotifications = await mkCh('order-notifications', 0, catStfId, staffOw());

    ch.generalVoice = await mkCh('General Voice', 2, catVceId, voiceOw());
    ch.supportVoice = await mkCh('Support Voice', 2, catVceId, voiceOw());

    log.push('All channels created');

    async function postMsg(chanId, body) {
      if (!chanId) return;
      var r = await api(BT, 'POST', '/channels/' + chanId + '/messages', body);
      if (!r.ok) log.push('Embed fail ' + chanId + ': ' + JSON.stringify(r.data).substring(0, 150));
    }

    await postMsg(ch.rules, { embeds: [{
      title: '\u26A0\uFE0F Server Rules',
      color: 0x2563eb,
      description: 'Welcome to the official Ambrosia Discord server. Please read and follow these rules.',
      fields: [
        { name: 'Rule 1', value: 'Be respectful to all members. No harassment, hate speech, or personal attacks.', inline: false },
        { name: 'Rule 2', value: 'No spamming, self-promotion, or unsolicited advertising.', inline: false },
        { name: 'Rule 3', value: 'Keep conversations in the appropriate channels.', inline: false },
        { name: 'Rule 4', value: 'Do not share personal information, payment addresses, or license keys.', inline: false },
        { name: 'Rule 5', value: 'Staff decisions are final. Open a ticket for issues.', inline: false },
        { name: 'Support', value: 'Open a ticket in <#' + ch.ticketChannel + '>', inline: false }
      ],
      image: { url: 'https://ambrosia.ovh/og-image.png' },
      footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' },
      timestamp: new Date().toISOString()
    }]});

    await postMsg(ch.announcements, { embeds: [{
      title: '\uD83D\uDCE2 Welcome to Ambrosia',
      color: 0x5865f2,
      description: 'Official Ambrosia support server. Premium game cheats for Overwatch 2, Counter-Strike 2, and Fortnite.',
      fields: [
        { name: 'Website', value: '[ambrosia.ovh](https://ambrosia.ovh)', inline: true },
        { name: 'Products', value: 'OW Lite, OW Pro, CS2 Web Radar, FN', inline: true },
        { name: 'Support', value: 'Open a ticket in <#' + ch.ticketChannel + '>', inline: true }
      ],
      image: { url: 'https://ambrosia.ovh/og-image.png' },
      footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' },
      timestamp: new Date().toISOString()
    }]});

    await postMsg(ch.catalog, { embeds: [
      { title: '\uD83D\uDED2 Product Catalog', color: 0x2563eb, description: 'All Ambrosia products. Visit the website or open a ticket.', image: { url: 'https://ambrosia.ovh/og-image.png' }, footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' }, timestamp: new Date().toISOString() },
      { title: 'OW Lite', color: 0x5865f2, fields: [{ name: 'Game', value: 'Overwatch 2', inline: true }, { name: 'Price', value: '$5/wk, $10/mo', inline: true }, { name: 'Features', value: 'Aimbot, Triggerbot, Flickbot, Streamproof, 10 Configs', inline: false }] },
      { title: 'OW Pro', color: 0xf59e0b, fields: [{ name: 'Game', value: 'Overwatch 2', inline: true }, { name: 'Price', value: '$20/wk, $45/mo', inline: true }, { name: 'Features', value: 'Hero Scripting, Ult HUD, Dual Slots, Streamproof', inline: false }] },
      { title: 'CS2 Web Radar', color: 0x10b981, fields: [{ name: 'Game', value: 'Counter-Strike 2', inline: true }, { name: 'Price', value: '$5/wk, $15/mo', inline: true }, { name: 'Features', value: 'Triggerbot, RCS, Interactive 2D Tactical Radar', inline: false }] },
      { title: 'Ambrosia FN', color: 0xed4245, fields: [{ name: 'Game', value: 'Fortnite', inline: true }, { name: 'Price', value: '$20/wk, $45/mo', inline: true }, { name: 'Status', value: 'Under Development', inline: false }] }
    ]});

    await postMsg(ch.links, { embeds: [{
      title: '\uD83D\uDD17 Official Links',
      color: 0x5865f2,
      fields: [
        { name: 'Product Server', value: 'https://discord.gg/bT9dpnerP4', inline: false },
        { name: 'Support Server', value: 'https://discord.gg/fE4QFQVBfD', inline: false },
        { name: 'Website', value: 'https://ambrosia.ovh', inline: false }
      ],
      footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' },
      timestamp: new Date().toISOString()
    }]});

    await postMsg(ch.ticketChannel, {
      embeds: [{
        title: 'Open a Support Ticket',
        description: 'Select a product below to open a private ticket.\nYou must be a member of this server.',
        color: 0x2563eb,
        thumbnail: { url: 'https://ambrosia.ovh/favicon.ico' },
        image: { url: 'https://ambrosia.ovh/og-image.png' },
        timestamp: new Date().toISOString()
      }],
      components: [{
        type: 1,
        components: [{
          type: 3, custom_id: 'select_ticket_product',
          placeholder: 'Select a product...',
          min_values: 1, max_values: 1,
          options: [
            { label: 'Ambrosia OW Lite', description: 'Overwatch 2 | $5/wk | $10/mo', value: 'ambrosia-ow-lite', emoji: { name: '\uD83C\uDFAF' } },
            { label: 'Ambrosia OW Pro', description: 'Overwatch 2 | $20/wk | $45/mo', value: 'ambrosia-ow-pro', emoji: { name: '\u26A1' } },
            { label: 'CS2 Web Radar', description: 'Counter-Strike 2 | $5/wk | $15/mo', value: 'ambrosia-cs2-web', emoji: { name: '\uD83D\uDCE1' } },
            { label: 'Ambrosia FN', description: 'Fortnite | $20/wk | $45/mo', value: 'ambrosia-fn', emoji: { name: '\uD83C\uDF96\uFE0F' } },
            { label: 'General Support', description: 'Questions or anything else', value: 'general-support', emoji: { name: '\uD83D\uDCAC' } }
          ]
        }]
      }]
    });

    await postMsg(ch.staffChat, { embeds: [
      { title: '\uD83D\uDD28 Staff Channel', color: 0x5865f2, description: 'Staff, Seller, and Owner only. Hidden from members.' },
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
    ] });

    await postMsg(ch.orderNotifications, { embeds: [{
      title: '\uD83D\uDCCA Order Notifications',
      color: 0xf59e0b,
      description: 'New orders appear here with a **Create Ticket** button.',
      footer: { text: 'Ambrosia Order System', icon_url: 'https://ambrosia.ovh/favicon.ico' },
      timestamp: new Date().toISOString()
    }]});

    var envVars = {
      DISCORD_GUILD_ID: gid,
      DISCORD_TICKETS_CATEGORY_ID: catSupId || '',
      DISCORD_STAFF_ROLE_ID: staffId || '',
      DISCORD_SELLER_ROLE_ID: sellerId || '',
      DISCORD_OWNER_ROLE_ID: ownerId || '',
      DISCORD_BOT_ROLE_ID: botId || '',
      DISCORD_TICKET_LOG_CHANNEL_ID: ch.ticketLogs || '',
      DISCORD_ORDER_NOTIFICATION_CHANNEL_ID: ch.orderNotifications || '',
      DISCORD_STAFF_CHAT_CHANNEL_ID: ch.staffChat || '',
      DISCORD_TICKET_PANEL_CHANNEL_ID: ch.ticketChannel || '',
      DISCORD_RULES_CHANNEL_ID: ch.rules || '',
      DISCORD_ANNOUNCEMENTS_CHANNEL_ID: ch.announcements || '',
      DISCORD_PRODUCT_CATALOG_CHANNEL_ID: ch.catalog || '',
      DISCORD_LINKS_CHANNEL_ID: ch.links || '',
      DISCORD_GENERAL_CHAT_CHANNEL_ID: ch.generalChat || '',
      DISCORD_OFF_TOPIC_CHANNEL_ID: ch.offTopic || '',
      DISCORD_MEMBER_ROLE_ID: memberId || '',
      DISCORD_CUSTOMER_ROLE_ID: custId || ''
    };

    return res.status(200).json({ success: true, guild: g.data.name, channels: ch, env: envVars, log: log });

  } catch (e) {
    console.error('[Setup] Fatal:', e);
    return res.status(500).json({ error: e.message, log: log });
  }
};
