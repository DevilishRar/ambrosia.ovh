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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var BT = getBotToken();
  if (!BT) return res.status(500).json({ error: 'No bot token decoded' });
  if (!req.body || req.body.secret !== SECRET) return res.status(403).json({ error: 'Bad secret' });

  var gid = GUILD_ID;
  var log = [];

  try {
    var g = await api(BT, 'GET', '/guilds/' + gid);
    if (!g.ok) return res.status(500).json({ error: 'Cannot access guild', details: g.data, step: 'guild_fetch' });
    log.push('Guild: ' + g.data.name);

    var chR = await api(BT, 'GET', '/guilds/' + gid + '/channels');
    if (chR.ok && Array.isArray(chR.data)) {
      log.push('Found ' + chR.data.length + ' channels to delete');
      for (var i = 0; i < chR.data.length; i++) {
        var del = await api(BT, 'DELETE', '/channels/' + chR.data[i].id);
        if (!del.ok) log.push('Failed to delete channel ' + chR.data[i].name + ': ' + JSON.stringify(del.data).substring(0, 100));
      }
      log.push('Channels deleted');
    }

    var rlR = await api(BT, 'GET', '/guilds/' + gid + '/roles');
    if (rlR.ok && Array.isArray(rlR.data)) {
      log.push('Found ' + rlR.data.length + ' roles');
      for (var j = 0; j < rlR.data.length; j++) {
        if (rlR.data[j].name === '@everyone') continue;
        if (rlR.data[j].managed) continue;
        var delR = await api(BT, 'DELETE', '/guilds/' + gid + '/roles/' + rlR.data[j].id);
        if (!delR.ok) log.push('Failed to delete role ' + rlR.data[j].name + ': ' + JSON.stringify(delR.data).substring(0, 100));
      }
      log.push('Roles deleted');
    }

    var rBot = await api(BT, 'POST', '/guilds/' + gid + '/roles', { name: 'Ambrosia Bot', color: 0xed4245, permissions: '8', mentionable: false, hoist: true });
    log.push('Bot role: ' + (rBot.ok ? rBot.data.id : 'FAILED ' + JSON.stringify(rBot.data).substring(0, 200)));
    if (!rBot.ok) return res.status(500).json({ error: 'Bot role failed', details: rBot.data, step: 'create_bot_role', log: log });

    var rSel = await api(BT, 'POST', '/guilds/' + gid + '/roles', { name: 'Seller', color: 0xf47b67, permissions: '2147483647', mentionable: true, hoist: true });
    log.push('Seller role: ' + (rSel.ok ? rSel.data.id : 'FAILED'));

    var rStf = await api(BT, 'POST', '/guilds/' + gid + '/roles', { name: 'Staff', color: 0x5865f2, permissions: '2147483647', mentionable: true, hoist: true });
    log.push('Staff role: ' + (rStf.ok ? rStf.data.id : 'FAILED'));

    var rCst = await api(BT, 'POST', '/guilds/' + gid + '/roles', { name: 'Verified Customer', color: 0x57f287, permissions: '2147500032', mentionable: false, hoist: true });
    log.push('Customer role: ' + (rCst.ok ? rCst.data.id : 'FAILED'));

    var rMem = await api(BT, 'POST', '/guilds/' + gid + '/roles', { name: 'Member', color: 0x99aab5, permissions: '2147500032', mentionable: false, hoist: false });
    log.push('Member role: ' + (rMem.ok ? rMem.data.id : 'FAILED'));

    var botId = rBot.data.id;
    var sellerId = rSel.ok ? rSel.data.id : '';
    var staffId = rStf.ok ? rStf.data.id : '';
    var custId = rCst.ok ? rCst.data.id : '';
    var memberId = rMem.ok ? rMem.data.id : '';

    var ALL_PERMS = '2147500032';

    function ow(allow, deny, id, type) {
      return { id: id || gid, type: type || 0, allow: String(allow || 0), deny: String(deny || 0) };
    }

    var staffOw = [ow(0, '1024'), ow(ALL_PERMS, 0, staffId), ow(ALL_PERMS, 0, sellerId), ow('8', 0, botId)];
    var memberOw = [ow(ALL_PERMS, 0), ow(ALL_PERMS, 0, staffId), ow(ALL_PERMS, 0, sellerId), ow('8', 0, botId)];
    var readOnlyOw = [ow('66560'), ow(ALL_PERMS, 0, staffId), ow(ALL_PERMS, 0, sellerId), ow('8', 0, botId)];
    var voiceOw = [ow('3145728'), ow('25231360', 0, staffId), ow('25231360', 0, sellerId), ow('8', 0, botId)];

    var catInfo = await api(BT, 'POST', '/guilds/' + gid + '/channels', { name: 'INFORMATION', type: 4, permission_overwrites: readOnlyOw });
    log.push('Cat INFO: ' + (catInfo.ok ? catInfo.data.id : 'FAILED'));
    var infoId = catInfo.ok ? catInfo.data.id : null;

    var catGen = await api(BT, 'POST', '/guilds/' + gid + '/channels', { name: 'GENERAL', type: 4, permission_overwrites: memberOw });
    log.push('Cat GEN: ' + (catGen.ok ? catGen.data.id : 'FAILED'));
    var genId = catGen.ok ? catGen.data.id : null;

    var catSup = await api(BT, 'POST', '/guilds/' + gid + '/channels', { name: 'SUPPORT', type: 4, permission_overwrites: [ow(ab('1024', '65536')), ow(ALL_PERMS, 0, staffId), ow(ALL_PERMS, 0, sellerId), ow('8', 0, botId)] });
    log.push('Cat SUP: ' + (catSup.ok ? catSup.data.id : 'FAILED'));
    var supId = catSup.ok ? catSup.data.id : null;

    var catStf = await api(BT, 'POST', '/guilds/' + gid + '/channels', { name: 'STAFF', type: 4, permission_overwrites: staffOw });
    log.push('Cat STF: ' + (catStf.ok ? catStf.data.id : 'FAILED'));
    var stfId = catStf.ok ? catStf.data.id : null;

    var catVce = await api(BT, 'POST', '/guilds/' + gid + '/channels', { name: 'VOICE', type: 4, permission_overwrites: voiceOw });
    log.push('Cat VCE: ' + (catVce.ok ? catVce.data.id : 'FAILED'));
    var vceId = catVce.ok ? catVce.data.id : null;

    async function mkCh(name, type, pid, perms) {
      var r = await api(BT, 'POST', '/guilds/' + gid + '/channels', { name: name, type: type, parent_id: pid, permission_overwrites: perms || [] });
      log.push(name + ': ' + (r.ok ? r.data.id : 'FAIL'));
      return r.ok ? r.data.id : null;
    }

    var ch = {};
    ch.rules = await mkCh('rules', 0, infoId, [ow('66560'), ow('11264', 0, staffId), ow('11264', 0, sellerId), ow('8', 0, botId)]);
    ch.announcements = await mkCh('announcements', 0, infoId, readOnlyOw);
    ch.catalog = await mkCh('product-catalog', 0, infoId, readOnlyOw);
    ch.links = await mkCh('links', 0, infoId, readOnlyOw);
    ch.generalChat = await mkCh('general-chat', 0, genId, memberOw);
    ch.offTopic = await mkCh('off-topic', 0, genId, memberOw);
    ch.ticketChannel = await mkCh('open-your-own-ticket', 0, supId, [ow('327744'), ow(ALL_PERMS, 0, staffId), ow(ALL_PERMS, 0, sellerId), ow('8', 0, botId)]);
    ch.ticketLogs = await mkCh('ticket-logs', 0, supId, staffOw);
    ch.staffChat = await mkCh('staff-chat', 0, stfId, staffOw);
    ch.orderNotifications = await mkCh('order-notifications', 0, stfId, staffOw);
    ch.generalVoice = await mkCh('General Voice', 2, vceId, voiceOw);
    ch.supportVoice = await mkCh('Support Voice', 2, vceId, voiceOw);

    log.push('All channels created');

    async function postMsg(chanId, body) {
      if (!chanId) return;
      var r = await api(BT, 'POST', '/channels/' + chanId + '/messages', body);
      if (!r.ok) log.push('Embed fail ' + chanId + ': ' + JSON.stringify(r.data).substring(0, 100));
    }

    await postMsg(ch.rules, { embeds: [{ title: '\u26A0\uFE0F Server Rules', color: 0x2563eb, description: 'Be respectful. No spam. Staff decisions final. Open a ticket for help.', fields: [{ name: 'Support', value: 'Open a ticket in <#' + ch.ticketChannel + '>', inline: false }], image: { url: 'https://ambrosia.ovh/og-image.png' }, footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' }, timestamp: new Date().toISOString() }] });

    await postMsg(ch.announcements, { embeds: [{ title: '\uD83D\uDCE2 Welcome to Ambrosia', color: 0x5865f2, description: 'Official Ambrosia support server. Premium game cheats.', fields: [{ name: 'Website', value: '[ambrosia.ovh](https://ambrosia.ovh)', inline: true }, { name: 'Support', value: '<#' + ch.ticketChannel + '>', inline: true }], image: { url: 'https://ambrosia.ovh/og-image.png' }, footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' }, timestamp: new Date().toISOString() }] });

    await postMsg(ch.catalog, { embeds: [
      { title: '\uD83D\uDED2 Products', color: 0x2563eb, description: 'OW Lite ($5/wk $10/mo), OW Pro ($20/wk $45/mo), CS2 Web ($5/wk $15/mo), FN ($20/wk $45/mo)', image: { url: 'https://ambrosia.ovh/og-image.png' }, footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' }, timestamp: new Date().toISOString() }
    ] });

    await postMsg(ch.links, { embeds: [{ title: '\uD83D\uDD17 Links', color: 0x5865f2, fields: [{ name: 'Product Server', value: 'https://discord.gg/bT9dpnerP4', inline: false }, { name: 'Support Server', value: 'https://discord.gg/fE4QFQVBfD', inline: false }, { name: 'Website', value: 'https://ambrosia.ovh', inline: false }], footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' }, timestamp: new Date().toISOString() }] });

    await postMsg(ch.ticketChannel, {
      embeds: [{ title: 'Open a Support Ticket', description: 'Select a product below to open a private ticket.\nYou must be a member.', color: 0x2563eb, thumbnail: { url: 'https://ambrosia.ovh/favicon.ico' }, image: { url: 'https://ambrosia.ovh/og-image.png' }, timestamp: new Date().toISOString() }],
      components: [{ type: 1, components: [{ type: 3, custom_id: 'select_ticket_product', placeholder: 'Select a product...', min_values: 1, max_values: 1, options: [
        { label: 'Ambrosia OW Lite', description: 'Overwatch 2 | $5/wk | $10/mo', value: 'ambrosia-ow-lite', emoji: { name: '\uD83C\uDFAF' } },
        { label: 'Ambrosia OW Pro', description: 'Overwatch 2 | $20/wk | $45/mo', value: 'ambrosia-ow-pro', emoji: { name: '\u26A1' } },
        { label: 'CS2 Web Radar', description: 'Counter-Strike 2 | $5/wk | $15/mo', value: 'ambrosia-cs2-web', emoji: { name: '\uD83D\uDCE1' } },
        { label: 'Ambrosia FN', description: 'Fortnite | $20/wk | $45/mo', value: 'ambrosia-fn', emoji: { name: '\uD83C\uDF96\uFE0F' } },
        { label: 'General Support', description: 'Questions or anything else', value: 'general-support', emoji: { name: '\uD83D\uDCAC' } }
      ] }] }]
    });

    await postMsg(ch.staffChat, { embeds: [
      { title: '\uD83D\uDD28 Staff Channel', color: 0x5865f2, description: 'Staff and Seller only.' },
      { title: 'Order Handling (XMR Only)', color: 0x991b1b, description: '1. Verify User ID\n2. Check payment on xmrchain.net\n3. Deliver key\n4. Click Verify Purchase\n5. Close Ticket', footer: { text: 'Private', icon_url: 'https://ambrosia.ovh/favicon.ico' }, timestamp: new Date().toISOString() }
    ] });

    await postMsg(ch.orderNotifications, { embeds: [{ title: '\uD83D\uDCCA Orders', color: 0xf59e0b, description: 'New orders appear here with a Create Ticket button.', footer: { text: 'Ambrosia', icon_url: 'https://ambrosia.ovh/favicon.ico' }, timestamp: new Date().toISOString() }] });

    log.push('All embeds sent');

    var envVars = {
      DISCORD_GUILD_ID: gid,
      DISCORD_TICKETS_CATEGORY_ID: supId || '',
      DISCORD_STAFF_ROLE_ID: staffId || '',
      DISCORD_SELLER_ROLE_ID: sellerId || '',
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
