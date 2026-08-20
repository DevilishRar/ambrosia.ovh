const ENCODED_BOT_TOKEN = 'TVRVek9UY3dNVFF6TlRJek56WTJNamd6TUEuR1pzd1I4LmE0cms4NHJvM2hmSjdFREYwMEltM18tVlh0MWlOVURQSndYdmV3';
const GUILD_ID = '1539404742055166045';
const SECRET = 'ambrosia-setup-2026';

function getBotToken() {
  try { return atob(ENCODED_BOT_TOKEN); } catch { return ''; }
}

const P = {
  ADMIN: '8', VIEW_CHANNEL: '1024', SEND_MESSAGES: '2048',
  SEND_MESSAGES_THREADS: '274877906944', CREATE_PUBLIC_THREADS: '1073741824',
  CREATE_PRIVATE_THREADS: '16', EMBED_LINKS: '16384', ATTACH_FILES: '4096',
  READ_MESSAGE_HISTORY: '65536', MENTION_EVERYONE: '131072',
  MANAGE_MESSAGES: '8192', MANAGE_THREADS: '34359738368', MANAGE_CHANNELS: '32',
  MANAGE_ROLES: '134217728', ADD_REACTIONS: '64', CONNECT: '2097152',
  SPEAK: '4194304', MUTE_MEMBERS: '8388608', DEAFEN_MEMBERS: '16777216',
  MOVE_MEMBERS: '33554432', USE_APPLICATION_COMMANDS: '2147483648'
};

function ab() {
  var r = BigInt(0);
  for (var i = 0; i < arguments.length; i++) {
    if (arguments[i] != null) r = r | BigInt(String(arguments[i]));
  }
  return r.toString();
}

var STAFF_P = ab(P.VIEW_CHANNEL, P.SEND_MESSAGES, P.SEND_MESSAGES_THREADS, P.CREATE_PUBLIC_THREADS, P.CREATE_PRIVATE_THREADS, P.EMBED_LINKS, P.ATTACH_FILES, P.READ_MESSAGE_HISTORY, P.MENTION_EVERYONE, P.MANAGE_MESSAGES, P.MANAGE_THREADS, P.ADD_REACTIONS, P.USE_APPLICATION_COMMANDS);
var SELLER_P = ab(P.VIEW_CHANNEL, P.SEND_MESSAGES, P.SEND_MESSAGES_THREADS, P.CREATE_PUBLIC_THREADS, P.CREATE_PRIVATE_THREADS, P.EMBED_LINKS, P.ATTACH_FILES, P.READ_MESSAGE_HISTORY, P.MENTION_EVERYONE, P.MANAGE_MESSAGES, P.MANAGE_THREADS, P.MANAGE_CHANNELS, P.ADD_REACTIONS, P.USE_APPLICATION_COMMANDS);
var MEMBER_P = ab(P.VIEW_CHANNEL, P.SEND_MESSAGES, P.READ_MESSAGE_HISTORY, P.ADD_REACTIONS, P.EMBED_LINKS, P.ATTACH_FILES, P.CREATE_PUBLIC_THREADS, P.SEND_MESSAGES_THREADS, P.USE_APPLICATION_COMMANDS);
var RO_P = ab(P.VIEW_CHANNEL, P.READ_MESSAGE_HISTORY, P.ADD_REACTIONS, P.EMBED_LINKS);
var NO_TALK = ab(P.VIEW_CHANNEL, P.READ_MESSAGE_HISTORY);
var VOICE_P = ab(P.VIEW_CHANNEL, P.CONNECT, P.SPEAK);
var VOICE_STAFF = ab(P.VIEW_CHANNEL, P.CONNECT, P.SPEAK, P.MUTE_MEMBERS, P.DEAFEN_MEMBERS, P.MOVE_MEMBERS);
var DENY_VIEW = ab(P.VIEW_CHANNEL);

async function api(t, m, p, b) {
  var o = { method: m, headers: { Authorization: 'Bot ' + t, 'Content-Type': 'application/json' } };
  if (b) o.body = JSON.stringify(b);
  var r = await fetch('https://discord.com/api/v10' + p, o);
  var txt = await r.text();
  var d; try { d = JSON.parse(txt); } catch (e) { d = txt; }
  return { ok: r.ok, data: d };
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
  try {
    var g = await api(BT, 'GET', '/guilds/' + gid + '?with_counts=true');
    if (!g.ok) return res.status(500).json({ error: 'No guild access' });

    var chR = await api(BT, 'GET', '/guilds/' + gid + '/channels');
    if (chR.ok && Array.isArray(chR.data)) {
      var dels = chR.data.map(function(c) { return api(BT, 'DELETE', '/channels/' + c.id).catch(function(){return}); });
      await Promise.all(dels);
    }

    var rlR = await api(BT, 'GET', '/guilds/' + gid + '/roles');
    if (rlR.ok && Array.isArray(rlR.data)) {
      var rdels = rlR.data.filter(function(r) { return r.name !== '@everyone' && !r.managed; }).map(function(r) {
        return api(BT, 'DELETE', '/guilds/' + gid + '/roles/' + r.id).catch(function(){return});
      });
      await Promise.all(rdels);
    }

    var rBot = await api(BT, 'POST', '/guilds/' + gid + '/roles', { name: 'Ambrosia Bot', color: 0xed4245, permissions: ab(P.ADMIN), mentionable: false, hoist: true });
    var rSeller = await api(BT, 'POST', '/guilds/' + gid + '/roles', { name: 'Seller', color: 0xf47b67, permissions: SELLER_P, mentionable: true, hoist: true });
    var rStaff = await api(BT, 'POST', '/guilds/' + gid + '/roles', { name: 'Staff', color: 0x5865f2, permissions: STAFF_P, mentionable: true, hoist: true });
    var rCust = await api(BT, 'POST', '/guilds/' + gid + '/roles', { name: 'Verified Customer', color: 0x57f287, permissions: MEMBER_P, mentionable: false, hoist: true });
    var rMember = await api(BT, 'POST', '/guilds/' + gid + '/roles', { name: 'Member', color: 0x99aab5, permissions: MEMBER_P, mentionable: false, hoist: false });

    var botId = rBot.ok ? rBot.data.id : null;
    var sellerId = rSeller.ok ? rSeller.data.id : null;
    var staffId = rStaff.ok ? rStaff.data.id : null;
    var custId = rCust.ok ? rCust.data.id : null;
    var memberId = rMember.ok ? rMember.data.id : null;
    if (!botId) return res.status(500).json({ error: 'Bot role failed' });

    function mkOw(isMember) {
      var base = [
        { id: gid, type: 0, allow: isMember ? MEMBER_P : RO_P, deny: '0' },
        { id: staffId, type: 0, allow: STAFF_P, deny: '0' },
        { id: sellerId, type: 0, allow: SELLER_P, deny: '0' },
        { id: botId, type: 0, allow: ab(P.ADMIN), deny: '0' }
      ];
      return base;
    }

    var catInfo = await api(BT, 'POST', '/guilds/' + gid + '/channels', { name: 'INFORMATION', type: 4, permission_overwrites: mkOw(false) });
    var catGen = await api(BT, 'POST', '/guilds/' + gid + '/channels', { name: 'GENERAL', type: 4, permission_overwrites: mkOw(true) });
    var catStaff = await api(BT, 'POST', '/guilds/' + gid + '/channels', { name: 'STAFF', type: 4, permission_overwrites: [
      { id: gid, type: 0, allow: '0', deny: DENY_VIEW },
      { id: staffId, type: 0, allow: STAFF_P, deny: '0' },
      { id: sellerId, type: 0, allow: SELLER_P, deny: '0' },
      { id: botId, type: 0, allow: ab(P.ADMIN), deny: '0' }
    ]});
    var catVoice = await api(BT, 'POST', '/guilds/' + gid + '/channels', { name: 'VOICE', type: 4, permission_overwrites: [
      { id: gid, type: 0, allow: VOICE_P, deny: '0' },
      { id: staffId, type: 0, allow: VOICE_STAFF, deny: '0' },
      { id: sellerId, type: 0, allow: VOICE_STAFF, deny: '0' },
      { id: botId, type: 0, allow: ab(P.ADMIN), deny: '0' }
    ]});

    var infoId = catInfo.ok ? catInfo.data.id : null;
    var genId = catGen.ok ? catGen.data.id : null;
    var staffCatId = catStaff.ok ? catStaff.data.id : null;
    var voiceId = catVoice.ok ? catVoice.data.id : null;

    var chPromises = [];

    chPromises.push(api(BT, 'POST', '/guilds/' + gid + '/channels', { name: 'rules', type: 0, parent_id: infoId, permission_overwrites: [
      { id: gid, type: 0, allow: NO_TALK, deny: '0' },
      { id: staffId, type: 0, allow: ab(P.VIEW_CHANNEL, P.SEND_MESSAGES, P.READ_MESSAGE_HISTORY, P.MANAGE_MESSAGES), deny: '0' },
      { id: sellerId, type: 0, allow: ab(P.VIEW_CHANNEL, P.SEND_MESSAGES, P.READ_MESSAGE_HISTORY, P.MANAGE_MESSAGES), deny: '0' },
      { id: botId, type: 0, allow: ab(P.ADMIN), deny: '0' }
    ]}));

    chPromises.push(api(BT, 'POST', '/guilds/' + gid + '/channels', { name: 'announcements', type: 0, parent_id: infoId, permission_overwrites: [
      { id: gid, type: 0, allow: RO_P, deny: '0' },
      { id: staffId, type: 0, allow: ab(P.VIEW_CHANNEL, P.SEND_MESSAGES, P.READ_MESSAGE_HISTORY, P.MENTION_EVERYONE), deny: '0' },
      { id: sellerId, type: 0, allow: ab(P.VIEW_CHANNEL, P.SEND_MESSAGES, P.READ_MESSAGE_HISTORY, P.MENTION_EVERYONE), deny: '0' },
      { id: botId, type: 0, allow: ab(P.ADMIN), deny: '0' }
    ]}));

    chPromises.push(api(BT, 'POST', '/guilds/' + gid + '/channels', { name: 'product-catalog', type: 0, parent_id: infoId, permission_overwrites: [
      { id: gid, type: 0, allow: RO_P, deny: '0' },
      { id: staffId, type: 0, allow: ab(P.VIEW_CHANNEL, P.SEND_MESSAGES, P.READ_MESSAGE_HISTORY), deny: '0' },
      { id: sellerId, type: 0, allow: ab(P.VIEW_CHANNEL, P.SEND_MESSAGES, P.READ_MESSAGE_HISTORY), deny: '0' },
      { id: botId, type: 0, allow: ab(P.ADMIN), deny: '0' }
    ]}));

    chPromises.push(api(BT, 'POST', '/guilds/' + gid + '/channels', { name: 'links', type: 0, parent_id: infoId, permission_overwrites: [
      { id: gid, type: 0, allow: RO_P, deny: '0' },
      { id: staffId, type: 0, allow: RO_P, deny: '0' },
      { id: sellerId, type: 0, allow: RO_P, deny: '0' },
      { id: botId, type: 0, allow: ab(P.ADMIN), deny: '0' }
    ]}));

    chPromises.push(api(BT, 'POST', '/guilds/' + gid + '/channels', { name: 'general-chat', type: 0, parent_id: genId, permission_overwrites: mkOw(true) }));
    chPromises.push(api(BT, 'POST', '/guilds/' + gid + '/channels', { name: 'off-topic', type: 0, parent_id: genId, permission_overwrites: mkOw(true) }));

    var supOw = [
      { id: gid, type: 0, allow: ab(P.VIEW_CHANNEL, P.READ_MESSAGE_HISTORY), deny: '0' },
      { id: staffId, type: 0, allow: STAFF_P, deny: '0' },
      { id: sellerId, type: 0, allow: SELLER_P, deny: '0' },
      { id: botId, type: 0, allow: ab(P.ADMIN), deny: '0' }
    ];
    var catSup = await api(BT, 'POST', '/guilds/' + gid + '/channels', { name: 'SUPPORT', type: 4, permission_overwrites: supOw });
    var supId = catSup.ok ? catSup.data.id : null;

    chPromises.push(api(BT, 'POST', '/guilds/' + gid + '/channels', { name: 'open-your-own-ticket', type: 0, parent_id: supId, permission_overwrites: [
      { id: gid, type: 0, allow: ab(P.VIEW_CHANNEL, P.READ_MESSAGE_HISTORY, P.USE_APPLICATION_COMMANDS), deny: '0' },
      { id: staffId, type: 0, allow: ab(P.VIEW_CHANNEL, P.READ_MESSAGE_HISTORY, P.USE_APPLICATION_COMMANDS), deny: '0' },
      { id: sellerId, type: 0, allow: ab(P.VIEW_CHANNEL, P.READ_MESSAGE_HISTORY, P.USE_APPLICATION_COMMANDS), deny: '0' },
      { id: botId, type: 0, allow: ab(P.ADMIN), deny: '0' }
    ]}));

    var staffOw = [
      { id: gid, type: 0, allow: '0', deny: DENY_VIEW },
      { id: staffId, type: 0, allow: STAFF_P, deny: '0' },
      { id: sellerId, type: 0, allow: SELLER_P, deny: '0' },
      { id: botId, type: 0, allow: ab(P.ADMIN), deny: '0' }
    ];
    chPromises.push(api(BT, 'POST', '/guilds/' + gid + '/channels', { name: 'ticket-logs', type: 0, parent_id: supId, permission_overwrites: staffOw }));
    chPromises.push(api(BT, 'POST', '/guilds/' + gid + '/channels', { name: 'staff-chat', type: 0, parent_id: staffCatId, permission_overwrites: staffOw }));
    chPromises.push(api(BT, 'POST', '/guilds/' + gid + '/channels', { name: 'order-notifications', type: 0, parent_id: staffCatId, permission_overwrites: staffOw }));

    chPromises.push(api(BT, 'POST', '/guilds/' + gid + '/channels', { name: 'General Voice', type: 2, parent_id: voiceId, permission_overwrites: [
      { id: gid, type: 0, allow: VOICE_P, deny: '0' },
      { id: staffId, type: 0, allow: VOICE_STAFF, deny: '0' },
      { id: sellerId, type: 0, allow: VOICE_STAFF, deny: '0' },
      { id: botId, type: 0, allow: ab(P.ADMIN), deny: '0' }
    ]}));
    chPromises.push(api(BT, 'POST', '/guilds/' + gid + '/channels', { name: 'Support Voice', type: 2, parent_id: voiceId, permission_overwrites: [
      { id: gid, type: 0, allow: VOICE_P, deny: '0' },
      { id: staffId, type: 0, allow: VOICE_STAFF, deny: '0' },
      { id: sellerId, type: 0, allow: VOICE_STAFF, deny: '0' },
      { id: botId, type: 0, allow: ab(P.ADMIN), deny: '0' }
    ]}));

    var chResults = await Promise.all(chPromises);
    var chIds = {};
    var chNames = ['rules','announcements','product-catalog','links','general-chat','off-topic','open-your-own-ticket','ticket-logs','staff-chat','order-notifications','General Voice','Support Voice'];
    for (var i = 0; i < chResults.length; i++) {
      if (chResults[i].ok && chResults[i].data && chResults[i].data.id) {
        chIds[chNames[i]] = chResults[i].data.id;
      }
    }

    var ticketPanelId = chIds['open-your-own-ticket'];
    var staffChatId = chIds['staff-chat'];
    var rulesId = chIds['rules'];
    var annId = chIds['announcements'];
    var catId = chIds['product-catalog'];
    var linksId = chIds['links'];
    var ordId = chIds['order-notifications'];

    var msgPromises = [];

    if (rulesId) msgPromises.push(api(BT, 'POST', '/channels/' + rulesId + '/messages', { embeds: [{
      title: '\u26A0\uFE0F Server Rules',
      color: 0x2563eb,
      description: 'Welcome to the official Ambrosia Discord server. Please read and follow these rules.',
      fields: [
        { name: 'Rule 1', value: 'Be respectful. No harassment, hate speech, or personal attacks.', inline: false },
        { name: 'Rule 2', value: 'No spamming, self-promotion, or advertising.', inline: false },
        { name: 'Rule 3', value: 'Keep conversations in the appropriate channels.', inline: false },
        { name: 'Rule 4', value: 'Do not share personal information, payment addresses, or license keys.', inline: false },
        { name: 'Rule 5', value: 'Staff decisions are final. Open a ticket for issues.', inline: false },
        { name: 'Support', value: 'Open a ticket in <#' + ticketPanelId + '>.', inline: false }
      ],
      image: { url: 'https://ambrosia.ovh/og-image.png' },
      footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' },
      timestamp: new Date().toISOString()
    }}) }));

    if (annId) msgPromises.push(api(BT, 'POST', '/channels/' + annId + '/messages', { embeds: [{
      title: '\uD83D\uDCE2 Welcome to Ambrosia',
      color: 0x5865f2,
      description: 'Official Ambrosia support server. Premium game cheats for OW2, CS2, and Fortnite.',
      fields: [
        { name: 'Website', value: '[ambrosia.ovh](https://ambrosia.ovh)', inline: true },
        { name: 'Products', value: 'OW Lite, OW Pro, CS2 Web Radar, FN', inline: true },
        { name: 'Support', value: 'Open a ticket in <#' + ticketPanelId + '>', inline: true }
      ],
      image: { url: 'https://ambrosia.ovh/og-image.png' },
      footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' },
      timestamp: new Date().toISOString()
    }}) }));

    if (catId) msgPromises.push(api(BT, 'POST', '/channels/' + catId + '/messages', { embeds: [
      { title: '\uD83D\uDED2 Product Catalog', color: 0x2563eb, description: 'All Ambrosia products. Visit the website or open a ticket.', image: { url: 'https://ambrosia.ovh/og-image.png' }, footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' }, timestamp: new Date().toISOString() },
      { title: 'OW Lite', color: 0x5865f2, fields: [{ name: 'Game', value: 'Overwatch 2', inline: true }, { name: 'Price', value: '$5/wk, $10/mo', inline: true }, { name: 'Features', value: 'Aimbot, Triggerbot, Flickbot, Streamproof', inline: false }] },
      { title: 'OW Pro', color: 0xf59e0b, fields: [{ name: 'Game', value: 'Overwatch 2', inline: true }, { name: 'Price', value: '$20/wk, $45/mo', inline: true }, { name: 'Features', value: 'Hero Scripting, Ult HUD, Dual Slots', inline: false }] },
      { title: 'CS2 Web Radar', color: 0x10b981, fields: [{ name: 'Game', value: 'Counter-Strike 2', inline: true }, { name: 'Price', value: '$5/wk, $15/mo', inline: true }, { name: 'Features', value: 'Triggerbot, RCS, 2D Tactical Radar', inline: false }] },
      { title: 'Ambrosia FN', color: 0xed4245, fields: [{ name: 'Game', value: 'Fortnite', inline: true }, { name: 'Price', value: '$20/wk, $45/mo', inline: true }, { name: 'Status', value: 'Under Development', inline: false }] }
    ]) }));

    if (linksId) msgPromises.push(api(BT, 'POST', '/channels/' + linksId + '/messages', { embeds: [{
      title: '\uD83D\uDD17 Official Links',
      color: 0x5865f2,
      fields: [
        { name: 'Product Server', value: 'https://discord.gg/bT9dpnerP4', inline: false },
        { name: 'Support Server', value: 'https://discord.gg/fE4QFQVBfD', inline: false },
        { name: 'Website', value: '[ambrosia.ovh](https://ambrosia.ovh)', inline: false }
      ],
      footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' },
      timestamp: new Date().toISOString()
    }}) }));

    if (ticketPanelId) msgPromises.push(api(BT, 'POST', '/channels/' + ticketPanelId + '/messages', {
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
          placeholder: 'Select a product to open a ticket...',
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
    }) }));

    if (staffChatId) msgPromises.push(api(BT, 'POST', '/channels/' + staffChatId + '/messages', { embeds: [
      { title: '\uD83D\uDD28 Staff Channel', color: 0x5865f2, description: 'Staff and Seller only. Hidden from members.' },
      { title: 'Order Handling Guide (XMR Only)', color: 0x991b1b, description: 'Do not share with customers.',
        fields: [
          { name: '1. Verify User ID', value: 'Check it matches the ticket creator.', inline: false },
          { name: '2. Check XMR Payment', value: 'Use xmrchain.net to verify payment on chain.', inline: false },
          { name: '3. Deliver Key', value: 'Once confirmed, send the license key.', inline: false },
          { name: '4. Verify Purchase', value: 'Click the green button to assign Verified Customer role.', inline: false },
          { name: '5. Close Ticket', value: 'Click the red Close Ticket button.', inline: false }
        ],
        footer: { text: 'Private \u2022 Staff Only', icon_url: 'https://ambrosia.ovh/favicon.ico' },
        timestamp: new Date().toISOString() }
    ] }) }));

    if (ordId) msgPromises.push(api(BT, 'POST', '/channels/' + ordId + '/messages', { embeds: [{
      title: '\uD83D\uDCCA Order Notifications',
      color: 0xf59e0b,
      description: 'New orders appear here with a **Create Ticket** button.',
      footer: { text: 'Ambrosia Order System', icon_url: 'https://ambrosia.ovh/favicon.ico' },
      timestamp: new Date().toISOString()
    }}) }));

    await Promise.all(msgPromises);

    var envVars = {
      DISCORD_GUILD_ID: gid,
      DISCORD_TICKETS_CATEGORY_ID: supId || '',
      DISCORD_STAFF_ROLE_ID: staffId || '',
      DISCORD_SELLER_ROLE_ID: sellerId || '',
      DISCORD_BOT_ROLE_ID: botId || '',
      DISCORD_TICKET_LOG_CHANNEL_ID: chIds['ticket-logs'] || '',
      DISCORD_ORDER_NOTIFICATION_CHANNEL_ID: ordId || '',
      DISCORD_STAFF_CHAT_CHANNEL_ID: staffChatId || '',
      DISCORD_TICKET_PANEL_CHANNEL_ID: ticketPanelId || '',
      DISCORD_RULES_CHANNEL_ID: rulesId || '',
      DISCORD_ANNOUNCEMENTS_CHANNEL_ID: annId || '',
      DISCORD_PRODUCT_CATALOG_CHANNEL_ID: catId || '',
      DISCORD_LINKS_CHANNEL_ID: linksId || '',
      DISCORD_GENERAL_CHAT_CHANNEL_ID: chIds['general-chat'] || '',
      DISCORD_OFF_TOPIC_CHANNEL_ID: chIds['off-topic'] || '',
      DISCORD_MEMBER_ROLE_ID: memberId || '',
      DISCORD_CUSTOMER_ROLE_ID: custId || ''
    };

    return res.status(200).json({ success: true, guild: g.data.name, channels: chIds, env: envVars });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
