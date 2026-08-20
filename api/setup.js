const ENCODED_BOT_TOKEN = 'TVRVek9UY3dNVFF6TlRJek56WTJNamd6TUEuR1pzd1I4LmE0cms4NHJvM2hmSjdFREYwMEltM18tVlh0MWlOVURQSndYdmV3';
const GUILD_ID = '1539404742055166045';
const SECRET = 'ambrosia-setup-2026';

function getBotToken() {
  try { return atob(ENCODED_BOT_TOKEN); } catch { return ''; }
}

const P = {
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
  MANAGE_CHANNELS: '32',
  MANAGE_ROLES: '134217728',
  ADD_REACTIONS: '64',
  CONNECT: '2097152',
  SPEAK: '4194304',
  MUTE_MEMBERS: '8388608',
  DEAFEN_MEMBERS: '16777216',
  MOVE_MEMBERS: '33554432',
  USE_APPLICATION_COMMANDS: '2147483648'
};

function a() {
  var r = BigInt(0);
  for (var i = 0; i < arguments.length; i++) {
    if (arguments[i] !== undefined && arguments[i] !== null) r = r | BigInt(String(arguments[i]));
  }
  return r.toString();
}

function d() {
  var r = BigInt(0);
  for (var i = 0; i < arguments.length; i++) {
    if (arguments[i] !== undefined && arguments[i] !== null) r = r | BigInt(String(arguments[i]));
  }
  return r.toString();
}

function adminPerms() { return P.ADMIN; }

function staffPerms() {
  return a(P.VIEW_CHANNEL, P.SEND_MESSAGES, P.SEND_MESSAGES_THREADS, P.CREATE_PUBLIC_THREADS, P.CREATE_PRIVATE_THREADS, P.EMBED_LINKS, P.ATTACH_FILES, P.READ_MESSAGE_HISTORY, P.MENTION_EVERYONE, P.MANAGE_MESSAGES, P.MANAGE_THREADS, P.ADD_REACTIONS, P.USE_APPLICATION_COMMANDS);
}

function sellerPerms() {
  return a(P.VIEW_CHANNEL, P.SEND_MESSAGES, P.SEND_MESSAGES_THREADS, P.CREATE_PUBLIC_THREADS, P.CREATE_PRIVATE_THREADS, P.EMBED_LINKS, P.ATTACH_FILES, P.READ_MESSAGE_HISTORY, P.MENTION_EVERYONE, P.MANAGE_MESSAGES, P.MANAGE_THREADS, P.MANAGE_CHANNELS, P.ADD_REACTIONS, P.USE_APPLICATION_COMMANDS);
}

function memberPerms() {
  return a(P.VIEW_CHANNEL, P.SEND_MESSAGES, P.READ_MESSAGE_HISTORY, P.ADD_REACTIONS, P.EMBED_LINKS, P.ATTACH_FILES, P.CREATE_PUBLIC_THREADS, P.SEND_MESSAGES_THREADS, P.USE_APPLICATION_COMMANDS);
}

function readOnly() {
  return a(P.VIEW_CHANNEL, P.READ_MESSAGE_HISTORY, P.ADD_REACTIONS, P.EMBED_LINKS);
}

function noTalk() {
  return a(P.VIEW_CHANNEL, P.READ_MESSAGE_HISTORY);
}

function voicePerms() {
  return a(P.VIEW_CHANNEL, P.CONNECT, P.SPEAK);
}

function voiceStaffPerms() {
  return a(P.VIEW_CHANNEL, P.CONNECT, P.SPEAK, P.MUTE_MEMBERS, P.DEAFEN_MEMBERS, P.MOVE_MEMBERS);
}

async function api(token, method, path, body) {
  var opts = { method: method, headers: { Authorization: 'Bot ' + token, 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  var res = await fetch('https://discord.com/api/v10' + path, opts);
  var text = await res.text();
  var data;
  try { data = JSON.parse(text); } catch (e) { data = text; }
  return { ok: res.ok, status: res.status, data: data };
}

async function createRole(token, guildId, name, color, perms, mentionable) {
  var res = await api(token, 'POST', '/guilds/' + guildId + '/roles', { name: name, color: color, permissions: perms, mentionable: mentionable || false, hoist: true });
  if (res.ok && res.data && res.data.id) { console.log('[Setup] Role: ' + name + ' (' + res.data.id + ')'); return res.data.id; }
  console.error('[Setup] Failed role: ' + name); return null;
}

async function createCategory(token, guildId, name, overwrites) {
  var res = await api(token, 'POST', '/guilds/' + guildId + '/channels', { name: name, type: 4, permission_overwrites: overwrites || [] });
  if (res.ok && res.data && res.data.id) { console.log('[Setup] Category: ' + name + ' (' + res.data.id + ')'); return res.data.id; }
  console.error('[Setup] Failed category: ' + name); return null;
}

async function createChannel(token, guildId, name, type, parentId, overwrites) {
  var body = { name: name, type: type, permission_overwrites: overwrites || [] };
  if (parentId) body.parent_id = parentId;
  var res = await api(token, 'POST', '/guilds/' + guildId + '/channels', body);
  if (res.ok && res.data && res.data.id) { console.log('[Setup] Channel: #' + name + ' (' + res.data.id + ')'); return res.data.id; }
  console.error('[Setup] Failed channel: #' + name); return null;
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
  if (secret !== SECRET) return res.status(403).json({ error: 'Invalid secret' });

  var guildId = GUILD_ID;

  try {
    console.log('[Setup] ========================================');
    console.log('[Setup] STARTING FULL SERVER SETUP');
    console.log('[Setup] ========================================');

    var guildRes = await api(BOT_TOKEN, 'GET', '/guilds/' + guildId + '?with_counts=true');
    if (!guildRes.ok) return res.status(500).json({ error: 'Cannot access guild.' });
    console.log('[Setup] Guild: ' + guildRes.data.name);

    console.log('[Setup] Deleting channels...');
    var chRes = await api(BOT_TOKEN, 'GET', '/guilds/' + guildId + '/channels');
    if (chRes.ok && Array.isArray(chRes.data)) {
      var sorted = chRes.data.sort(function(x, y) { return x.type === 4 ? -1 : y.type === 4 ? 1 : 0; });
      for (var i = 0; i < sorted.length; i++) {
        try { await api(BOT_TOKEN, 'DELETE', '/channels/' + sorted[i].id); } catch (e) {}
      }
    }

    console.log('[Setup] Deleting roles...');
    var rlRes = await api(BOT_TOKEN, 'GET', '/guilds/' + guildId + '/roles');
    if (rlRes.ok && Array.isArray(rlRes.data)) {
      for (var j = 0; j < rlRes.data.length; j++) {
        var rl = rlRes.data[j];
        if (rl.name === '@everyone') continue;
        if (rl.managed) continue;
        try { await api(BOT_TOKEN, 'DELETE', '/guilds/' + guildId + '/roles/' + rl.id); } catch (e) {}
      }
    }

    console.log('[Setup] Creating roles...');
    var roles = {};
    roles.bot = await createRole(BOT_TOKEN, guildId, 'Ambrosia Bot', 0xed4245, adminPerms(), false);
    roles.seller = await createRole(BOT_TOKEN, guildId, 'Seller', 0xf47b67, sellerPerms(), true);
    roles.staff = await createRole(BOT_TOKEN, guildId, 'Staff', 0x5865f2, staffPerms(), true);
    roles.customer = await createRole(BOT_TOKEN, guildId, 'Verified Customer', 0x57f287, memberPerms(), false);
    roles.member = await createRole(BOT_TOKEN, guildId, 'Member', 0x99aab5, memberPerms(), false);
    if (!roles.bot) return res.status(500).json({ error: 'Failed to create bot role' });

    var categoryPerms = [
      { id: guildId, type: 0, allow: readOnly(), deny: '0' },
      { id: roles.staff, type: 0, allow: staffPerms(), deny: '0' },
      { id: roles.seller, type: 0, allow: sellerPerms(), deny: '0' },
      { id: roles.bot, type: 0, allow: adminPerms(), deny: '0' }
    ];

    var memberCategoryPerms = [
      { id: guildId, type: 0, allow: memberPerms(), deny: '0' },
      { id: roles.staff, type: 0, allow: staffPerms(), deny: '0' },
      { id: roles.seller, type: 0, allow: sellerPerms(), deny: '0' },
      { id: roles.bot, type: 0, allow: adminPerms(), deny: '0' }
    ];

    var staffOnlyPerms = [
      { id: guildId, type: 0, allow: '0', deny: d(P.VIEW_CHANNEL) },
      { id: roles.staff, type: 0, allow: staffPerms(), deny: '0' },
      { id: roles.seller, type: 0, allow: sellerPerms(), deny: '0' },
      { id: roles.bot, type: 0, allow: adminPerms(), deny: '0' }
    ];

    var voiceCategoryPerms = [
      { id: guildId, type: 0, allow: voicePerms(), deny: '0' },
      { id: roles.staff, type: 0, allow: voiceStaffPerms(), deny: '0' },
      { id: roles.seller, type: 0, allow: voiceStaffPerms(), deny: '0' },
      { id: roles.bot, type: 0, allow: adminPerms(), deny: '0' }
    ];

    var channels = {};
    var categories = {};
    var embedCount = 0;

    console.log('[Setup] Creating INFORMATION category...');
    categories.information = await createCategory(BOT_TOKEN, guildId, 'INFORMATION', categoryPerms);

    channels.rules = await createChannel(BOT_TOKEN, guildId, 'rules', 0, categories.information, [
      { id: guildId, type: 0, allow: noTalk(), deny: '0' },
      { id: roles.staff, type: 0, allow: a(P.VIEW_CHANNEL, P.SEND_MESSAGES, P.READ_MESSAGE_HISTORY, P.MANAGE_MESSAGES), deny: '0' },
      { id: roles.seller, type: 0, allow: a(P.VIEW_CHANNEL, P.SEND_MESSAGES, P.READ_MESSAGE_HISTORY, P.MANAGE_MESSAGES), deny: '0' },
      { id: roles.bot, type: 0, allow: adminPerms(), deny: '0' }
    ]);

    channels.announcements = await createChannel(BOT_TOKEN, guildId, 'announcements', 0, categories.information, [
      { id: guildId, type: 0, allow: readOnly(), deny: '0' },
      { id: roles.staff, type: 0, allow: a(P.VIEW_CHANNEL, P.SEND_MESSAGES, P.READ_MESSAGE_HISTORY, P.MENTION_EVERYONE), deny: '0' },
      { id: roles.seller, type: 0, allow: a(P.VIEW_CHANNEL, P.SEND_MESSAGES, P.READ_MESSAGE_HISTORY, P.MENTION_EVERYONE), deny: '0' },
      { id: roles.bot, type: 0, allow: adminPerms(), deny: '0' }
    ]);

    channels.catalog = await createChannel(BOT_TOKEN, guildId, 'product-catalog', 0, categories.information, [
      { id: guildId, type: 0, allow: readOnly(), deny: '0' },
      { id: roles.staff, type: 0, allow: a(P.VIEW_CHANNEL, P.SEND_MESSAGES, P.READ_MESSAGE_HISTORY), deny: '0' },
      { id: roles.seller, type: 0, allow: a(P.VIEW_CHANNEL, P.SEND_MESSAGES, P.READ_MESSAGE_HISTORY), deny: '0' },
      { id: roles.bot, type: 0, allow: adminPerms(), deny: '0' }
    ]);

    channels.links = await createChannel(BOT_TOKEN, guildId, 'links', 0, categories.information, [
      { id: guildId, type: 0, allow: readOnly(), deny: '0' },
      { id: roles.staff, type: 0, allow: readOnly(), deny: '0' },
      { id: roles.seller, type: 0, allow: readOnly(), deny: '0' },
      { id: roles.bot, type: 0, allow: adminPerms(), deny: '0' }
    ]);

    console.log('[Setup] Creating GENERAL category...');
    categories.general = await createCategory(BOT_TOKEN, guildId, 'GENERAL', memberCategoryPerms);
    channels.generalChat = await createChannel(BOT_TOKEN, guildId, 'general-chat', 0, categories.general, memberCategoryPerms);
    channels.offTopic = await createChannel(BOT_TOKEN, guildId, 'off-topic', 0, categories.general, memberCategoryPerms);

    console.log('[Setup] Creating SUPPORT category...');
    categories.support = await createCategory(BOT_TOKEN, guildId, 'SUPPORT', [
      { id: guildId, type: 0, allow: a(P.VIEW_CHANNEL, P.READ_MESSAGE_HISTORY), deny: '0' },
      { id: roles.staff, type: 0, allow: staffPerms(), deny: '0' },
      { id: roles.seller, type: 0, allow: sellerPerms(), deny: '0' },
      { id: roles.bot, type: 0, allow: adminPerms(), deny: '0' }
    ]);

    channels.ticketChannel = await createChannel(BOT_TOKEN, guildId, 'open-your-own-ticket', 0, categories.support, [
      { id: guildId, type: 0, allow: a(P.VIEW_CHANNEL, P.READ_MESSAGE_HISTORY, P.USE_APPLICATION_COMMANDS), deny: '0' },
      { id: roles.staff, type: 0, allow: a(P.VIEW_CHANNEL, P.READ_MESSAGE_HISTORY, P.USE_APPLICATION_COMMANDS), deny: '0' },
      { id: roles.seller, type: 0, allow: a(P.VIEW_CHANNEL, P.READ_MESSAGE_HISTORY, P.USE_APPLICATION_COMMANDS), deny: '0' },
      { id: roles.bot, type: 0, allow: adminPerms(), deny: '0' }
    ]);

    channels.ticketLogs = await createChannel(BOT_TOKEN, guildId, 'ticket-logs', 0, categories.support, staffOnlyPerms);

    console.log('[Setup] Creating STAFF category...');
    categories.staff = await createCategory(BOT_TOKEN, guildId, 'STAFF', staffOnlyPerms);
    channels.staffChat = await createChannel(BOT_TOKEN, guildId, 'staff-chat', 0, categories.staff, staffOnlyPerms);
    channels.orderNotifications = await createChannel(BOT_TOKEN, guildId, 'order-notifications', 0, categories.staff, staffOnlyPerms);

    console.log('[Setup] Creating VOICE category...');
    categories.voice = await createCategory(BOT_TOKEN, guildId, 'VOICE', voiceCategoryPerms);
    channels.generalVoice = await createChannel(BOT_TOKEN, guildId, 'General Voice', 2, categories.voice, voiceCategoryPerms);
    channels.supportVoice = await createChannel(BOT_TOKEN, guildId, 'Support Voice', 2, categories.voice, voiceCategoryPerms);

    console.log('[Setup] Sending embeds...');

    if (channels.rules) {
      if (await sendMsg(BOT_TOKEN, channels.rules, { embeds: [{
        title: '\u26A0\uFE0F Server Rules',
        color: 0x2563eb,
        description: 'Welcome to the official Ambrosia Discord server. Please read and follow these rules at all times.',
        fields: [
          { name: 'Rule 1', value: 'Be respectful to all members. No harassment, hate speech, or personal attacks.', inline: false },
          { name: 'Rule 2', value: 'No spamming, self-promotion, or unsolicited advertising in any channel.', inline: false },
          { name: 'Rule 3', value: 'Keep conversations in the appropriate channels.', inline: false },
          { name: 'Rule 4', value: 'Do not share other people\'s personal information, payment addresses, or license keys.', inline: false },
          { name: 'Rule 5', value: 'Staff decisions are final. Open a ticket if you have an issue.', inline: false },
          { name: 'Support', value: 'Open a ticket in <#' + channels.ticketChannel + '>. A staff member will assist you.', inline: false }
        ],
        image: { url: 'https://ambrosia.ovh/og-image.png' },
        footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' },
        timestamp: new Date().toISOString()
      }})) embedCount++; }

    if (channels.announcements) {
      if (await sendMsg(BOT_TOKEN, channels.announcements, { embeds: [{
        title: '\uD83D\uDCE2 Welcome to Ambrosia',
        color: 0x5865f2,
        description: 'This is the official Ambrosia support server. We provide premium game cheats for Overwatch 2, Counter-Strike 2, and Fortnite.',
        fields: [
          { name: 'Website', value: '[ambrosia.ovh](https://ambrosia.ovh)', inline: true },
          { name: 'Products', value: 'OW Lite, OW Pro, CS2 Web Radar, Ambrosia FN', inline: true },
          { name: 'Support', value: 'Open a ticket in <#' + channels.ticketChannel + '>', inline: true }
        ],
        image: { url: 'https://ambrosia.ovh/og-image.png' },
        footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' },
        timestamp: new Date().toISOString()
      }})) embedCount++; }

    if (channels.catalog) {
      if (await sendMsg(BOT_TOKEN, channels.catalog, { embeds: [
        { title: '\uD83D\uDED2 Product Catalog', color: 0x2563eb, description: 'All available Ambrosia products. Visit the website to purchase, or open a ticket if you need assistance.', image: { url: 'https://ambrosia.ovh/og-image.png' }, footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' }, timestamp: new Date().toISOString() },
        { title: 'Ambrosia OW Lite', color: 0x5865f2, fields: [{ name: 'Game', value: 'Overwatch 2', inline: true }, { name: 'Price', value: '$5/week, $10/month', inline: true }, { name: 'Features', value: 'Aimbot, Triggerbot, Flickbot, Streamproof, 10 Configs', inline: false }] },
        { title: 'Ambrosia OW Pro', color: 0xf59e0b, fields: [{ name: 'Game', value: 'Overwatch 2', inline: true }, { name: 'Price', value: '$20/week, $45/month', inline: true }, { name: 'Features', value: 'Hero Scripting, Ult Shower HUD, Dual Slots, Streamproof', inline: false }] },
        { title: 'CS2 Web Radar', color: 0x10b981, fields: [{ name: 'Game', value: 'Counter-Strike 2', inline: true }, { name: 'Price', value: '$5/week, $15/month', inline: true }, { name: 'Features', value: 'Triggerbot, RCS, Interactive 2D Tactical Web Radar', inline: false }] },
        { title: 'Ambrosia FN', color: 0xed4245, fields: [{ name: 'Game', value: 'Fortnite', inline: true }, { name: 'Price', value: '$20/week, $45/month', inline: true }, { name: 'Status', value: 'Under Development', inline: false }] }
      ]})) embedCount++; }

    if (channels.links) {
      if (await sendMsg(BOT_TOKEN, channels.links, { embeds: [{
        title: '\uD83D\uDD17 Official Links',
        color: 0x5865f2,
        fields: [
          { name: 'Official Product Server', value: 'https://discord.gg/bT9dpnerP4\nMain server for news, updates, and community.', inline: false },
          { name: 'Support Server (You Are Here)', value: 'https://discord.gg/fE4QFQVBfD\nTickets, order assistance, and staff communication.', inline: false },
          { name: 'Website', value: '[ambrosia.ovh](https://ambrosia.ovh)\nPlace orders, view products, and check XMR prices.', inline: false }
        ],
        image: { url: 'https://ambrosia.ovh/og-image.png' },
        footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' },
        timestamp: new Date().toISOString()
      }})) embedCount++; }

    if (channels.ticketChannel) {
      if (await sendMsg(BOT_TOKEN, channels.ticketChannel, { embeds: [{
        title: 'Open a Support Ticket',
        description: 'Select a product from the dropdown below to open a private ticket with our staff.\n\nYou must be a member of this server to open a ticket.',
        color: 0x2563eb,
        thumbnail: { url: 'https://ambrosia.ovh/favicon.ico' },
        image: { url: 'https://ambrosia.ovh/og-image.png' },
        timestamp: new Date().toISOString()
      }], components: [{
        type: 1,
        components: [{
          type: 3,
          custom_id: 'select_ticket_product',
          placeholder: 'Select a product to open a ticket...',
          min_values: 1,
          max_values: 1,
          options: [
            { label: 'Ambrosia OW Lite', description: 'Overwatch 2 | $5/wk | $10/mo', value: 'ambrosia-ow-lite', emoji: { name: '\uD83C\uDFAF' } },
            { label: 'Ambrosia OW Pro', description: 'Overwatch 2 | $20/wk | $45/mo', value: 'ambrosia-ow-pro', emoji: { name: '\u26A1' } },
            { label: 'CS2 Web Radar', description: 'Counter-Strike 2 | $5/wk | $15/mo', value: 'ambrosia-cs2-web', emoji: { name: '\uD83D\uDCE1' } },
            { label: 'Ambrosia FN', description: 'Fortnite | $20/wk | $45/mo', value: 'ambrosia-fn', emoji: { name: '\uD83C\uDF96\uFE0F' } },
            { label: 'General Support', description: 'Questions, issues, or anything else', value: 'general-support', emoji: { name: '\uD83D\uDCAC' } }
          ]
        }]
      }]})) embedCount++; }

    if (channels.staffChat) {
      if (await sendMsg(BOT_TOKEN, channels.staffChat, { embeds: [
        {
          title: '\uD83D\uDD28 Staff Channel',
          color: 0x5865f2,
          description: 'This channel is for Staff and Seller role members only.',
          fields: [
            { name: 'Roles', value: 'Staff and Seller roles have access to this channel.', inline: false },
            { name: 'Note', value: 'This channel is hidden from regular members and customers.', inline: false }
          ],
          footer: { text: 'Ambrosia Staff Hub', icon_url: 'https://ambrosia.ovh/favicon.ico' },
          timestamp: new Date().toISOString()
        },
        {
          title: 'Staff Order Handling Guide (XMR Only)',
          color: 0x991b1b,
          description: 'Private instructions for Staff and Seller roles. Do not share this with customers.',
          fields: [
            { name: 'Step 1: Verify User ID', value: 'Ask the customer for their Discord User ID. Verify it matches the ticket creator.', inline: false },
            { name: 'Step 2: Check XMR Payment', value: 'Use xmrchain.net or similar to verify the customer sent the correct XMR amount.', inline: false },
            { name: 'Step 3: Confirm Amount', value: 'Make sure the amount matches the expected price. Account for XMR fluctuations.', inline: false },
            { name: 'Step 4: Deliver License Key', value: 'Once payment is confirmed on chain, deliver the license key to the customer.', inline: false },
            { name: 'Step 5: Verify Purchase', value: 'Click the **Verify Purchase** button to give them the Verified Customer role.', inline: false },
            { name: 'Step 6: Close Ticket', value: 'After key is delivered and role is assigned, click **Close Ticket**.', inline: false },
            { name: 'Do Not', value: 'Do not deliver keys before payment is confirmed. Do not close tickets without verifying.', inline: false }
          ],
          footer: { text: 'Ambrosia Staff Hub \u2022 Private', icon_url: 'https://ambrosia.ovh/favicon.ico' },
          timestamp: new Date().toISOString()
        }
      ]})) embedCount++; }

    if (channels.orderNotifications) {
      if (await sendMsg(BOT_TOKEN, channels.orderNotifications, { embeds: [{
        title: '\uD83D\uDCCA Order Notifications',
        color: 0xf59e0b,
        description: 'All new orders will appear here. Each has a **Create Ticket** button to begin assisting the customer.',
        fields: [
          { name: 'How It Works', value: '1. Customer places an order on the website\n2. An embed appears here with their details\n3. Click **Create Ticket** to assist them\n4. Verify payment on chain\n5. Deliver license key\n6. Close the ticket', inline: false }
        ],
        footer: { text: 'Ambrosia Order System', icon_url: 'https://ambrosia.ovh/favicon.ico' },
        timestamp: new Date().toISOString()
      }})) embedCount++; }

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
    console.log('[Setup] Roles: ' + Object.keys(roles).length);
    console.log('[Setup] Categories: ' + Object.keys(categories).length);
    console.log('[Setup] Channels: ' + Object.keys(channels).length);
    console.log('[Setup] Embeds: ' + embedCount);
    console.log('[Setup] ========================================');

    return res.status(200).json({ success: true, guild: guildRes.data.name, roles: roles, categories: categories, channels: channels, embeds: embedCount, env: envVars });

  } catch (e) {
    console.error('[Setup] Fatal error:', e);
    return res.status(500).json({ error: 'Setup failed: ' + e.message });
  }
};
