const ENCODED_BOT_TOKEN = 'TVRVek9UY3dNVFF6TlRJek56WTJNamd6TUEuR1pzd1I4LmE0cms4NHJvM2hmSjdFREYwMEltM18tVlh0MWlOVURQSndYdmV3';
const GUILD_ID = '1539404742055166045';
const SECRET = 'ambrosia-setup-2026';

function getBotToken() {
  try { return atob(ENCODED_BOT_TOKEN); } catch { return ''; }
}

const PERMISSIONS = {
  ADMIN: '8',
  VIEW_CHANNEL: '1024',
  SEND_MESSAGES: '2048',
  SEND_MESSAGES_THREADS: '274877906944',
  CREATE_PUBLIC_THREADS: '1073741824',
  CREATE_PRIVATE_THREADS: '16',
  EMBED_LINKS: '16384',
  ATTACH_FILES: '4096',
  READ_MESSAGE_HISTORY: '65536',
  MENTION_EVERYONE: '131072',
  MANAGE_MESSAGES: '8192',
  MANAGE_THREADS: '34359738368',
  MANAGE_CHANNELS: '16',
  MANAGE_ROLES: '134217728',
  ADD_REACTIONS: '64',
  CONNECT: '1048576',
  SPEAK: '2097152',
  USE_APPLICATION_COMMANDS: '2147483648'
};

function allowBit() {
  let result = BigInt(0);
  for (let i = 0; i < arguments.length; i++) {
    result |= BigInt(arguments[i]);
  }
  return result.toString();
}

function denyBit() {
  let result = BigInt(0);
  for (let i = 0; i < arguments.length; i++) {
    result |= BigInt(arguments[i]);
  }
  return result.toString();
}

function adminPerms() { return PERMISSIONS.ADMIN; }

function staffPerms() {
  return allowBit(
    PERMISSIONS.VIEW_CHANNEL, PERMISSIONS.SEND_MESSAGES, PERMISSIONS.SEND_MESSAGES_THREADS,
    PERMISSIONS.CREATE_PUBLIC_THREADS, PERMISSIONS.CREATE_PRIVATE_THREADS,
    PERMISSIONS.EMBED_LINKS, PERMISSIONS.ATTACH_FILES, PERMISSIONS.READ_MESSAGE_HISTORY,
    PERMISSIONS.MENTION_EVERYONE, PERMISSIONS.MANAGE_MESSAGES, PERMISSIONS.MANAGE_THREADS,
    PERMISSIONS.ADD_REACTIONS, PERMISSIONS.USE_APPLICATION_COMMANDS
  );
}

function sellerPerms() {
  return allowBit(
    PERMISSIONS.VIEW_CHANNEL, PERMISSIONS.SEND_MESSAGES, PERMISSIONS.SEND_MESSAGES_THREADS,
    PERMISSIONS.CREATE_PUBLIC_THREADS, PERMISSIONS.CREATE_PRIVATE_THREADS,
    PERMISSIONS.EMBED_LINKS, PERMISSIONS.ATTACH_FILES, PERMISSIONS.READ_MESSAGE_HISTORY,
    PERMISSIONS.MENTION_EVERYONE, PERMISSIONS.MANAGE_MESSAGES, PERMISSIONS.MANAGE_THREADS,
    PERMISSIONS.MANAGE_CHANNELS, PERMISSIONS.ADD_REACTIONS, PERMISSIONS.USE_APPLICATION_COMMANDS
  );
}

function memberPerms() {
  return allowBit(
    PERMISSIONS.VIEW_CHANNEL, PERMISSIONS.SEND_MESSAGES, PERMISSIONS.READ_MESSAGE_HISTORY,
    PERMISSIONS.ADD_REACTIONS, PERMISSIONS.EMBED_LINKS, PERMISSIONS.ATTACH_FILES,
    PERMISSIONS.CREATE_PUBLIC_THREADS, PERMISSIONS.SEND_MESSAGES_THREADS,
    PERMISSIONS.USE_APPLICATION_COMMANDS
  );
}

function readOnly() {
  return allowBit(PERMISSIONS.VIEW_CHANNEL, PERMISSIONS.READ_MESSAGE_HISTORY, PERMISSIONS.ADD_REACTIONS, PERMISSIONS.EMBED_LINKS);
}

function noTalk() {
  return allowBit(PERMISSIONS.VIEW_CHANNEL, PERMISSIONS.READ_MESSAGE_HISTORY);
}

async function api(token, method, path, body) {
  var opts = {
    method: method,
    headers: { Authorization: 'Bot ' + token, 'Content-Type': 'application/json' }
  };
  if (body) opts.body = JSON.stringify(body);
  var res = await fetch('https://discord.com/api/v10' + path, opts);
  var text = await res.text();
  var data;
  try { data = JSON.parse(text); } catch (e) { data = text; }
  return { ok: res.ok, status: res.status, data: data };
}

async function createRole(token, guildId, name, color, perms, mentionable) {
  var res = await api(token, 'POST', '/guilds/' + guildId + '/roles', {
    name: name, color: color, permissions: perms, mentionable: mentionable || false, hoist: true
  });
  if (res.ok && res.data && res.data.id) {
    console.log('[Setup] Role: ' + name + ' (' + res.data.id + ')');
    return res.data.id;
  }
  console.error('[Setup] Failed role: ' + name);
  return null;
}

async function createCategory(token, guildId, name, overwrites) {
  var res = await api(token, 'POST', '/guilds/' + guildId + '/channels', {
    name: name, type: 4, permission_overwrites: overwrites || []
  });
  if (res.ok && res.data && res.data.id) {
    console.log('[Setup] Category: ' + name + ' (' + res.data.id + ')');
    return res.data.id;
  }
  console.error('[Setup] Failed category: ' + name);
  return null;
}

async function createChannel(token, guildId, name, type, parentId, overwrites) {
  var body = { name: name, type: type, permission_overwrites: overwrites || [] };
  if (parentId) body.parent_id = parentId;
  var res = await api(token, 'POST', '/guilds/' + guildId + '/channels', body);
  if (res.ok && res.data && res.data.id) {
    console.log('[Setup] Channel: #' + name + ' (' + res.data.id + ')');
    return res.data.id;
  }
  console.error('[Setup] Failed channel: #' + name);
  return null;
}

async function sendMsg(token, channelId, body) {
  var res = await api(token, 'POST', '/channels/' + channelId + '/messages', body);
  return res.ok;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var BOT_TOKEN = getBotToken();
  if (!BOT_TOKEN) return res.status(500).json({ error: 'Bot token not configured' });

  var secret = req.body ? req.body.secret : '';
  if (secret !== SECRET) {
    return res.status(403).json({ error: 'Invalid secret' });
  }

  var guildId = GUILD_ID;

  try {
    console.log('[Setup] ========================================');
    console.log('[Setup] STARTING FULL SERVER SETUP');
    console.log('[Setup] Guild: ' + guildId);
    console.log('[Setup] ========================================');

    var guildRes = await api(BOT_TOKEN, 'GET', '/guilds/' + guildId + '?with_counts=true');
    if (!guildRes.ok) {
      return res.status(500).json({ error: 'Cannot access guild. Check bot permissions.', details: guildRes.data });
    }
    console.log('[Setup] Guild name: ' + guildRes.data.name);

    var existingRolesRes = await api(BOT_TOKEN, 'GET', '/guilds/' + guildId + '/roles');
    var existingRoleNames = [];
    if (existingRolesRes.ok && Array.isArray(existingRolesRes.data)) {
      existingRoleNames = existingRolesRes.data.map(function(r) { return r.name.toLowerCase(); });
    }

    var existingChannelsRes = await api(BOT_TOKEN, 'GET', '/guilds/' + guildId + '/channels');
    var existingChannelNames = [];
    if (existingChannelsRes.ok && Array.isArray(existingChannelsRes.data)) {
      existingChannelNames = existingChannelsRes.data.map(function(c) { return c.name.toLowerCase(); });
    }

    function roleExists(name) { return existingRoleNames.indexOf(name.toLowerCase()) !== -1; }
    function channelExists(name) { return existingChannelNames.indexOf(name.toLowerCase()) !== -1; }

    var roles = {};
    var channels = {};
    var categories = {};
    var embedCount = 0;
    var errors = [];

    if (!roleExists('Ambrosia Bot')) {
      roles.bot = await createRole(token, guildId, 'Ambrosia Bot', 0xed4245, adminPerms(), false);
    } else {
      var r = existingRolesRes.data.find(function(x) { return x.name === 'Ambrosia Bot'; });
      roles.bot = r ? r.id : null;
    }
    if (!roles.bot) { errors.push('Failed to create Ambrosia Bot role'); return res.status(500).json({ error: 'Role creation failed', errors: errors }); }

    if (!roleExists('Seller')) {
      roles.seller = await createRole(token, guildId, 'Seller', 0xf47b67, sellerPerms(), true);
    } else {
      var r2 = existingRolesRes.data.find(function(x) { return x.name === 'Seller'; });
      roles.seller = r2 ? r2.id : null;
    }

    if (!roleExists('Staff')) {
      roles.staff = await createRole(token, guildId, 'Staff', 0x5865f2, staffPerms(), true);
    } else {
      var r3 = existingRolesRes.data.find(function(x) { return x.name === 'Staff'; });
      roles.staff = r3 ? r3.id : null;
    }

    if (!roleExists('Verified Customer')) {
      roles.customer = await createRole(token, guildId, 'Verified Customer', 0x57f287, memberPerms(), false);
    } else {
      var r4 = existingRolesRes.data.find(function(x) { return x.name === 'Verified Customer'; });
      roles.customer = r4 ? r4.id : null;
    }

    if (!roleExists('Member')) {
      roles.member = await createRole(token, guildId, 'Member', 0x99aab5, memberPerms(), false);
    } else {
      var r5 = existingRolesRes.data.find(function(x) { return x.name === 'Member'; });
      roles.member = r5 ? r5.id : null;
    }

    console.log('[Setup] Roles done. Bot=' + roles.bot + ' Seller=' + roles.seller + ' Staff=' + roles.staff);

    try {
      await api(BOT_TOKEN, 'PATCH', '/guilds/' + guildId + '/roles/' + roles.bot, { position: 100 });
      await api(BOT_TOKEN, 'PATCH', '/guilds/' + guildId + '/roles/' + roles.seller, { position: 99 });
    } catch (e) { console.error('[Setup] Position error:', e); }

    var infoPerms = [
      { id: guildId, type: 0, allow: allowBit(PERMISSIONS.VIEW_CHANNEL, PERMISSIONS.READ_MESSAGE_HISTORY, PERMISSIONS.ADD_REACTIONS, PERMISSIONS.EMBED_LINKS), deny: '0' },
      { id: roles.staff, type: 0, allow: staffPerms(), deny: '0' },
      { id: roles.seller, type: 0, allow: sellerPerms(), deny: '0' },
      { id: roles.bot, type: 0, allow: adminPerms(), deny: '0' }
    ];

    if (!channelExists('INFORMATION')) {
      categories.information = await createCategory(token, guildId, 'INFORMATION', infoPerms);
    } else {
      var c1 = existingChannelsRes.data.find(function(x) { return x.name === 'INFORMATION'; });
      categories.information = c1 ? c1.id : null;
    }

    var rulesPerms = [
      { id: guildId, type: 0, allow: noTalk(), deny: '0' },
      { id: roles.staff, type: 0, allow: allowBit(PERMISSIONS.VIEW_CHANNEL, PERMISSIONS.SEND_MESSAGES, PERMISSIONS.READ_MESSAGE_HISTORY, PERMISSIONS.MANAGE_MESSAGES), deny: '0' },
      { id: roles.seller, type: 0, allow: allowBit(PERMISSIONS.VIEW_CHANNEL, PERMISSIONS.SEND_MESSAGES, PERMISSIONS.READ_MESSAGE_HISTORY, PERMISSIONS.MANAGE_MESSAGES), deny: '0' },
      { id: roles.bot, type: 0, allow: adminPerms(), deny: '0' }
    ];

    if (!channelExists('rules')) {
      channels.rules = await createChannel(token, guildId, 'rules', 0, categories.information, rulesPerms);
    } else {
      var ch1 = existingChannelsRes.data.find(function(x) { return x.name === 'rules'; });
      channels.rules = ch1 ? ch1.id : null;
    }

    var announcePerms = [
      { id: guildId, type: 0, allow: readOnly(), deny: '0' },
      { id: roles.staff, type: 0, allow: allowBit(PERMISSIONS.VIEW_CHANNEL, PERMISSIONS.SEND_MESSAGES, PERMISSIONS.READ_MESSAGE_HISTORY, PERMISSIONS.MENTION_EVERYONE), deny: '0' },
      { id: roles.seller, type: 0, allow: allowBit(PERMISSIONS.VIEW_CHANNEL, PERMISSIONS.SEND_MESSAGES, PERMISSIONS.READ_MESSAGE_HISTORY, PERMISSIONS.MENTION_EVERYONE), deny: '0' },
      { id: roles.bot, type: 0, allow: adminPerms(), deny: '0' }
    ];

    if (!channelExists('announcements')) {
      channels.announcements = await createChannel(token, guildId, 'announcements', 0, categories.information, announcePerms);
    } else {
      var ch2 = existingChannelsRes.data.find(function(x) { return x.name === 'announcements'; });
      channels.announcements = ch2 ? ch2.id : null;
    }

    var catalogPerms = [
      { id: guildId, type: 0, allow: readOnly(), deny: '0' },
      { id: roles.staff, type: 0, allow: allowBit(PERMISSIONS.VIEW_CHANNEL, PERMISSIONS.SEND_MESSAGES, PERMISSIONS.READ_MESSAGE_HISTORY), deny: '0' },
      { id: roles.seller, type: 0, allow: allowBit(PERMISSIONS.VIEW_CHANNEL, PERMISSIONS.SEND_MESSAGES, PERMISSIONS.READ_MESSAGE_HISTORY), deny: '0' },
      { id: roles.bot, type: 0, allow: adminPerms(), deny: '0' }
    ];

    if (!channelExists('product-catalog')) {
      channels.catalog = await createChannel(token, guildId, 'product-catalog', 0, categories.information, catalogPerms);
    } else {
      var ch3 = existingChannelsRes.data.find(function(x) { return x.name === 'product-catalog'; });
      channels.catalog = ch3 ? ch3.id : null;
    }

    var linksPerms = [
      { id: guildId, type: 0, allow: readOnly(), deny: '0' },
      { id: roles.staff, type: 0, allow: readOnly(), deny: '0' },
      { id: roles.seller, type: 0, allow: readOnly(), deny: '0' },
      { id: roles.bot, type: 0, allow: adminPerms(), deny: '0' }
    ];

    if (!channelExists('links')) {
      channels.links = await createChannel(token, guildId, 'links', 0, categories.information, linksPerms);
    } else {
      var chLinks = existingChannelsRes.data.find(function(x) { return x.name === 'links'; });
      channels.links = chLinks ? chLinks.id : null;
    }

    var generalPerms = [
      { id: guildId, type: 0, allow: memberPerms(), deny: '0' },
      { id: roles.staff, type: 0, allow: staffPerms(), deny: '0' },
      { id: roles.seller, type: 0, allow: sellerPerms(), deny: '0' },
      { id: roles.bot, type: 0, allow: adminPerms(), deny: '0' }
    ];

    if (!channelExists('GENERAL')) {
      categories.general = await createCategory(token, guildId, 'GENERAL', generalPerms);
    } else {
      var c2 = existingChannelsRes.data.find(function(x) { return x.name === 'GENERAL'; });
      categories.general = c2 ? c2.id : null;
    }

    if (!channelExists('general-chat')) {
      channels.generalChat = await createChannel(token, guildId, 'general-chat', 0, categories.general, generalPerms);
    } else {
      var ch4 = existingChannelsRes.data.find(function(x) { return x.name === 'general-chat'; });
      channels.generalChat = ch4 ? ch4.id : null;
    }

    if (!channelExists('off-topic')) {
      channels.offTopic = await createChannel(token, guildId, 'off-topic', 0, categories.general, generalPerms);
    } else {
      var ch5 = existingChannelsRes.data.find(function(x) { return x.name === 'off-topic'; });
      channels.offTopic = ch5 ? ch5.id : null;
    }

    var supportPerms = [
      { id: guildId, type: 0, allow: allowBit(PERMISSIONS.VIEW_CHANNEL, PERMISSIONS.READ_MESSAGE_HISTORY), deny: '0' },
      { id: roles.staff, type: 0, allow: staffPerms(), deny: '0' },
      { id: roles.seller, type: 0, allow: sellerPerms(), deny: '0' },
      { id: roles.bot, type: 0, allow: adminPerms(), deny: '0' }
    ];

    if (!channelExists('SUPPORT')) {
      categories.support = await createCategory(token, guildId, 'SUPPORT', supportPerms);
    } else {
      var c3 = existingChannelsRes.data.find(function(x) { return x.name === 'SUPPORT'; });
      categories.support = c3 ? c3.id : null;
    }

    var ticketPerms = [
      { id: guildId, type: 0, allow: allowBit(PERMISSIONS.VIEW_CHANNEL, PERMISSIONS.READ_MESSAGE_HISTORY, PERMISSIONS.USE_APPLICATION_COMMANDS), deny: '0' },
      { id: roles.staff, type: 0, allow: allowBit(PERMISSIONS.VIEW_CHANNEL, PERMISSIONS.READ_MESSAGE_HISTORY, PERMISSIONS.USE_APPLICATION_COMMANDS), deny: '0' },
      { id: roles.seller, type: 0, allow: allowBit(PERMISSIONS.VIEW_CHANNEL, PERMISSIONS.READ_MESSAGE_HISTORY, PERMISSIONS.USE_APPLICATION_COMMANDS), deny: '0' },
      { id: roles.bot, type: 0, allow: adminPerms(), deny: '0' }
    ];

    if (!channelExists('open-your-own-ticket')) {
      channels.ticketChannel = await createChannel(token, guildId, 'open-your-own-ticket', 0, categories.support, ticketPerms);
    } else {
      var ch6 = existingChannelsRes.data.find(function(x) { return x.name === 'open-your-own-ticket'; });
      channels.ticketChannel = ch6 ? ch6.id : null;
    }

    var ticketLogPerms = [
      { id: guildId, type: 0, allow: '0', deny: denyBit(PERMISSIONS.VIEW_CHANNEL) },
      { id: roles.staff, type: 0, allow: staffPerms(), deny: '0' },
      { id: roles.seller, type: 0, allow: sellerPerms(), deny: '0' },
      { id: roles.bot, type: 0, allow: adminPerms(), deny: '0' }
    ];

    if (!channelExists('ticket-logs')) {
      channels.ticketLogs = await createChannel(token, guildId, 'ticket-logs', 0, categories.support, ticketLogPerms);
    } else {
      var ch7 = existingChannelsRes.data.find(function(x) { return x.name === 'ticket-logs'; });
      channels.ticketLogs = ch7 ? ch7.id : null;
    }

    var staffPermsOverwrite = [
      { id: guildId, type: 0, allow: '0', deny: denyBit(PERMISSIONS.VIEW_CHANNEL) },
      { id: roles.staff, type: 0, allow: staffPerms(), deny: '0' },
      { id: roles.seller, type: 0, allow: sellerPerms(), deny: '0' },
      { id: roles.bot, type: 0, allow: adminPerms(), deny: '0' }
    ];

    if (!channelExists('STAFF')) {
      categories.staff = await createCategory(token, guildId, 'STAFF', staffPermsOverwrite);
    } else {
      var c4 = existingChannelsRes.data.find(function(x) { return x.name === 'STAFF'; });
      categories.staff = c4 ? c4.id : null;
    }

    if (!channelExists('staff-chat')) {
      channels.staffChat = await createChannel(token, guildId, 'staff-chat', 0, categories.staff, staffPermsOverwrite);
    } else {
      var ch8 = existingChannelsRes.data.find(function(x) { return x.name === 'staff-chat'; });
      channels.staffChat = ch8 ? ch8.id : null;
    }

    if (!channelExists('order-notifications')) {
      channels.orderNotifications = await createChannel(token, guildId, 'order-notifications', 0, categories.staff, staffPermsOverwrite);
    } else {
      var ch9 = existingChannelsRes.data.find(function(x) { return x.name === 'order-notifications'; });
      channels.orderNotifications = ch9 ? ch9.id : null;
    }

    var voicePerms = [
      { id: guildId, type: 0, allow: allowBit(PERMISSIONS.VIEW_CHANNEL, PERMISSIONS.CONNECT, PERMISSIONS.SPEAK), deny: '0' },
      { id: roles.staff, type: 0, allow: allowBit(PERMISSIONS.VIEW_CHANNEL, PERMISSIONS.CONNECT, PERMISSIONS.SPEAK, PERMISSIONS.MUTE_MEMBERS, PERMISSIONS.DEAFEN_MEMBERS, PERMISSIONS.MOVE_MEMBERS), deny: '0' },
      { id: roles.seller, type: 0, allow: allowBit(PERMISSIONS.VIEW_CHANNEL, PERMISSIONS.CONNECT, PERMISSIONS.SPEAK, PERMISSIONS.MUTE_MEMBERS, PERMISSIONS.DEAFEN_MEMBERS, PERMISSIONS.MOVE_MEMBERS), deny: '0' },
      { id: roles.bot, type: 0, allow: adminPerms(), deny: '0' }
    ];

    if (!channelExists('VOICE')) {
      categories.voice = await createCategory(token, guildId, 'VOICE', voicePerms);
    } else {
      var c5 = existingChannelsRes.data.find(function(x) { return x.name === 'VOICE'; });
      categories.voice = c5 ? c5.id : null;
    }

    if (!channelExists('General Voice')) {
      channels.generalVoice = await createChannel(token, guildId, 'General Voice', 2, categories.voice, voicePerms);
    } else {
      var ch10 = existingChannelsRes.data.find(function(x) { return x.name === 'General Voice'; });
      channels.generalVoice = ch10 ? ch10.id : null;
    }

    if (!channelExists('Support Voice')) {
      channels.supportVoice = await createChannel(token, guildId, 'Support Voice', 2, categories.voice, voicePerms);
    } else {
      var ch11 = existingChannelsRes.data.find(function(x) { return x.name === 'Support Voice'; });
      channels.supportVoice = ch11 ? ch11.id : null;
    }

    console.log('[Setup] All channels done. Sending embeds...');

    if (channels.rules) {
      var rulesEmbed = {
        title: '\u26A0\uFE0F Server Rules',
        color: 0x2563eb,
        description: 'Welcome to the official Ambrosia Discord server. Please read and follow these rules at all times.',
        fields: [
          { name: '\u26A0\uFE0F Rule 1', value: 'Be respectful to all members. No harassment, hate speech, or personal attacks.', inline: false },
          { name: '\u26A0\uFE0F Rule 2', value: 'No spamming, self-promotion, or unsolicited advertising in any channel.', inline: false },
          { name: '\u26A0\uFE0F Rule 3', value: 'Keep conversations in the appropriate channels. Use the correct ticket category for support.', inline: false },
          { name: '\u26A0\uFE0F Rule 4', value: 'Do not share other people\'s personal information, payment addresses, or license keys.', inline: false },
          { name: '\u26A0\uFE0F Rule 5', value: 'Staff decisions are final. If you have an issue, open a ticket and explain your situation.', inline: false },
          { name: '\u26A0\uFE0F Rule 6', value: 'No discussion of cheats, exploits, or any illegal activity outside of designated support channels.', inline: false },
          { name: '\u2139\uFE0F Support', value: 'If you need help, open a ticket in <#' + channels.ticketChannel + '>. A staff member will assist you.', inline: false }
        ],
        image: { url: 'https://ambrosia.ovh/og-image.png' },
        footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' },
        timestamp: new Date().toISOString()
      };
      if (await sendMsg(token, channels.rules, { embeds: [rulesEmbed] })) embedCount++;
    }

    if (channels.announcements) {
      var welcomeEmbed = {
        title: '\uD83D\uDCE2 Welcome to Ambrosia',
        color: 0x5865f2,
        description: 'This is the official Ambrosia support server. We provide premium game cheats for Overwatch 2, Counter-Strike 2, and Fortnite.',
        fields: [
          { name: '\uD83C\uDF10 Website', value: '[ambrosia.ovh](https://ambrosia.ovh)', inline: true },
          { name: '\uD83D\uDED2 Products', value: 'OW Lite, OW Pro, CS2 Web Radar, Ambrosia FN', inline: true },
          { name: '\uD83D\uDD11 Support', value: 'Open a ticket in <#' + channels.ticketChannel + '>', inline: true },
          { name: '\u2B50 Payment', value: 'We accept Monero (XMR) for all purchases. Visit the website to place an order.', inline: false }
        ],
        image: { url: 'https://ambrosia.ovh/og-image.png' },
        footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' },
        timestamp: new Date().toISOString()
      };
      if (await sendMsg(token, channels.announcements, { embeds: [welcomeEmbed] })) embedCount++;
    }

    if (channels.catalog) {
      var catalogEmbeds = [
        {
          title: '\uD83D\uDED2 Product Catalog',
          color: 0x2563eb,
          description: 'All available Ambrosia products. Visit the website to purchase, or open a ticket if you need assistance.',
          image: { url: 'https://ambrosia.ovh/og-image.png' },
          footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' },
          timestamp: new Date().toISOString()
        },
        {
          title: 'Ambrosia OW Lite',
          color: 0x5865f2,
          fields: [
            { name: 'Game', value: 'Overwatch 2', inline: true },
            { name: 'Price', value: '$5/week, $10/month', inline: true },
            { name: 'Features', value: 'Aimbot, Triggerbot, Flickbot with Prediction\nMultipoint Visualisation and Hitbox Customisation\nMovement: Auto Bunnyhop, Null Binding (SnapTap)\nStreamproof and Record Proof Rendering\n10 Configs, Config Sharing and Keybind Switcher', inline: false }
          ]
        },
        {
          title: 'Ambrosia OW Pro',
          color: 0xf59e0b,
          fields: [
            { name: 'Game', value: 'Overwatch 2', inline: true },
            { name: 'Price', value: '$20/week, $45/month', inline: true },
            { name: 'Features', value: 'Dual Aim and Trigger Slots with Independent Configs\nHero Action Scripting (Up to 10 simultaneous scripts)\nUlt Shower HUD and Ability Cooldown Panel\nPlayer Outline ESP and Skeleton Hitbox Visuals\nFOV Changer, Third Person and Streamproof Mode', inline: false }
          ]
        },
        {
          title: 'CS2 Web Radar',
          color: 0x10b981,
          fields: [
            { name: 'Game', value: 'Counter-Strike 2', inline: true },
            { name: 'Price', value: '$5/week, $15/month', inline: true },
            { name: 'Features', value: 'Triggerbot with Custom Delay and Trigger Key\nRCS Recoil Control (Weapon Profiles, Humanize, Pattern Preview)\nInteractive 2D Tactical Web Radar (Themes, Calibration, Zoom)\nDisplays Bomb Carrier, Defusing, Flashed and Grenades\nPlayers Info: Name, Health, Teams and Weapons', inline: false }
          ]
        },
        {
          title: 'Ambrosia FN',
          color: 0xed4245,
          fields: [
            { name: 'Game', value: 'Fortnite', inline: true },
            { name: 'Price', value: '$20/week, $45/month', inline: true },
            { name: 'Status', value: 'Under Development and Maintenance. Updates will be announced in Discord.', inline: false }
          ]
        }
      ];
      if (await sendMsg(token, channels.catalog, { embeds: catalogEmbeds })) embedCount++;
    }

    if (channels.links) {
      var linksEmbed = {
        title: '\uD83D\uDD17 Official Links',
        color: 0x5865f2,
        description: 'Official Ambrosia product server and website links.',
        fields: [
          { name: '\uD83C\uDF10 Official Product Server', value: 'https://discord.gg/bT9dpnerP4\nThis is the main Ambrosia product server for news, updates, and community.', inline: false },
          { name: '\uD83D\uDD11 Support Server (You Are Here)', value: 'https://discord.gg/fE4QFQVBfD\nThis server is for support tickets, order assistance, and staff communication.', inline: false },
          { name: '\uD83D\uDED2 Website', value: '[ambrosia.ovh](https://ambrosia.ovh)\nPlace orders, view products, and check XMR prices.', inline: false }
        ],
        image: { url: 'https://ambrosia.ovh/og-image.png' },
        footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' },
        timestamp: new Date().toISOString()
      };
      if (await sendMsg(token, channels.links, { embeds: [linksEmbed] })) embedCount++;
    }

    if (channels.ticketChannel) {
      var panelEmbeds = [
        {
          title: 'Open a Support Ticket',
          description: 'Select a product from the dropdown below to open a private ticket with our staff.\n\nYou must be a member of this server to open a ticket.',
          color: 0x2563eb,
          thumbnail: { url: 'https://ambrosia.ovh/favicon.ico' },
          image: { url: 'https://ambrosia.ovh/og-image.png' },
          timestamp: new Date().toISOString()
        }
      ];

      var panelComponents = [
        {
          type: 1,
          components: [
            {
              type: 3,
              custom_id: 'select_ticket_product',
              placeholder: 'Select a product to open a ticket...',
              min_values: 1,
              max_values: 1,
              options: [
                { label: 'Ambrosia OW Lite', description: 'Overwatch 2 | $5/wk | $10/mo | Aimbot, Triggerbot, Streamproof', value: 'ambrosia-ow-lite', emoji: { name: '\uD83C\uDFAF' } },
                { label: 'Ambrosia OW Pro', description: 'Overwatch 2 | $20/wk | $45/mo | Hero Scripting, Ult HUD', value: 'ambrosia-ow-pro', emoji: { name: '\u26A1' } },
                { label: 'CS2 Web Radar', description: 'Counter-Strike 2 | $5/wk | $15/mo | Triggerbot, RCS, Web Radar', value: 'ambrosia-cs2-web', emoji: { name: '\uD83D\uDCE1' } },
                { label: 'Ambrosia FN', description: 'Fortnite | $20/wk | $45/mo | Aimbot, ESP, Loot Radar', value: 'ambrosia-fn', emoji: { name: '\uD83C\uDF96\uFE0F' } },
                { label: 'General Support', description: 'Questions, issues, or anything else', value: 'general-support', emoji: { name: '\uD83D\uDCAC' } }
              ]
            }
          ]
        }
      ];

      if (await sendMsg(token, channels.ticketChannel, { embeds: panelEmbeds, components: panelComponents })) embedCount++;
    }

    if (channels.staffChat) {
      var staffEmbed = {
        title: '\uD83D\uDD28 Staff Channel',
        color: 0x5865f2,
        description: 'This channel is for Staff and Seller role members only. Use this channel to coordinate support, discuss tickets, and communicate with the team.',
        fields: [
          { name: '\uD83D\uDC65 Roles', value: 'Staff and Seller roles have access to this channel.', inline: false },
          { name: '\uD83D\uDEE1\uFE0F Permissions', value: 'Members with these roles can see this channel, send messages, and manage tickets.', inline: false },
          { name: '\u2139\uFE0F Note', value: 'This channel is hidden from regular members and customers.', inline: false }
        ],
        footer: { text: 'Ambrosia Staff Hub', icon_url: 'https://ambrosia.ovh/favicon.ico' },
        timestamp: new Date().toISOString()
      };
      var staffInstructionsEmbed = {
        title: 'Staff Order Handling Guide (XMR Only)',
        color: 0x991b1b,
        description: 'Private instructions for Staff and Seller roles. Do not share this with customers.',
        fields: [
          { name: 'Step 1: Verify User ID', value: 'Ask the customer for their Discord User ID if not already provided. Verify it matches the ticket creator.', inline: false },
          { name: 'Step 2: Check XMR Payment', value: 'Use a blockchain explorer (xmrchain.net or similar) to verify the customer sent the correct XMR amount to the shown address.', inline: false },
          { name: 'Step 3: Confirm Amount', value: 'Make sure the amount received matches the expected price. Account for small fluctuations in XMR value.', inline: false },
          { name: 'Step 4: Deliver License Key', value: 'Once payment is confirmed on chain, deliver the license key to the customer in this ticket.', inline: false },
          { name: 'Step 5: Verify Purchase', value: 'Click the **Verify Purchase** button to give the customer the Verified Customer role.', inline: false },
          { name: 'Step 6: Close Ticket', value: 'After the key is delivered and role is assigned, click **Close Ticket** to close this channel.', inline: false },
          { name: '\u274C Do Not', value: 'Do not deliver keys before payment is confirmed on chain. Do not close tickets without verifying the purchase first.', inline: false }
        ],
        footer: { text: 'Ambrosia Staff Hub \u2022 Private', icon_url: 'https://ambrosia.ovh/favicon.ico' },
        timestamp: new Date().toISOString()
      };
      if (await sendMsg(token, channels.staffChat, { embeds: [staffEmbed, staffInstructionsEmbed] })) embedCount++;
    }

    if (channels.orderNotifications) {
      var orderEmbed = {
        title: '\uD83D\uDCCA Order Notifications',
        color: 0xf59e0b,
        description: 'All new orders will appear here as they come in. Each order includes a **Create Ticket** button to begin assisting the customer.',
        fields: [
          { name: '\u2139\uFE0F How It Works', value: '1. A customer places an order on the website\n2. An embed appears here with their details\n3. Click **Create Ticket** to begin assisting them\n4. Verify payment on chain\n5. Deliver license key\n6. Close the ticket', inline: false }
        ],
        footer: { text: 'Ambrosia Order System', icon_url: 'https://ambrosia.ovh/favicon.ico' },
        timestamp: new Date().toISOString()
      };
      if (await sendMsg(token, channels.orderNotifications, { embeds: [orderEmbed] })) embedCount++;
    }

    var envVars = {
      DISCORD_GUILD_ID: guildId,
      DISCORD_TICKETS_CATEGORY_ID: categories.support || '',
      DISCORD_STAFF_ROLE_ID: roles.staff || '',
      DISCORD_SELLER_ROLE_ID: roles.seller || '',
      DISCORD_BOT_ROLE_ID: roles.bot || '',
      DISCORD_TICKET_LOG_CHANNEL_ID: channels.ticketLogs || '',
      DISCORD_ORDER_NOTIFICATION_CHANNEL_ID: channels.orderNotifications || '',
      DISCORD_STAFF_CHAT_CHANNEL_ID: channels.staffChat || '',
      DISCORD_TICKET_PANEL_CHANNEL_ID: channels.ticketChannel || '',
      DISCORD_RULES_CHANNEL_ID: channels.rules || '',
      DISCORD_ANNOUNCEMENTS_CHANNEL_ID: channels.announcements || '',
      DISCORD_PRODUCT_CATALOG_CHANNEL_ID: channels.catalog || '',
      DISCORD_LINKS_CHANNEL_ID: channels.links || '',
      DISCORD_GENERAL_CHAT_CHANNEL_ID: channels.generalChat || '',
      DISCORD_OFF_TOPIC_CHANNEL_ID: channels.offTopic || '',
      DISCORD_MEMBER_ROLE_ID: roles.member || '',
      DISCORD_CUSTOMER_ROLE_ID: roles.customer || ''
    };

    console.log('\n[Setup] ========================================');
    console.log('[Setup] SERVER SETUP COMPLETE');
    console.log('[Setup] ========================================');
    console.log('[Setup] Roles: ' + Object.keys(roles).length);
    console.log('[Setup] Categories: ' + Object.keys(categories).length);
    console.log('[Setup] Channels: ' + Object.keys(channels).length);
    console.log('[Setup] Embeds: ' + embedCount);
    console.log('[Setup] Errors: ' + errors.length);
    console.log('[Setup] ========================================');

    return res.status(200).json({
      success: true,
      guild: guildRes.data.name,
      roles: roles,
      categories: categories,
      channels: channels,
      embeds: embedCount,
      errors: errors,
      env: envVars
    });

  } catch (e) {
    console.error('[Setup] Fatal error:', e);
    return res.status(500).json({ error: 'Setup failed: ' + e.message });
  }
};
