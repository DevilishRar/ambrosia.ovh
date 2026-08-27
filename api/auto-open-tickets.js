var ENCODED_BOT_TOKEN = 'TVRVek9UY3dNVFF6TlRJek56WTJNamd6TUEuR1pzd1I4LmE0cms4NHJvM2hmSjdFREYwMEltM18tVlh0MWlOVURQSndYdmV3';
var GUILD_ID = process.env.DISCORD_GUILD_ID;
var CATEGORY_ID = process.env.DISCORD_TICKETS_CATEGORY_ID;
var STAFF_ROLE_ID = process.env.DISCORD_STAFF_ROLE_ID;
var SELLER_ROLE_ID = process.env.DISCORD_SELLER_ROLE_ID;
var CUSTOMER_ROLE_ID = process.env.DISCORD_CUSTOMER_ROLE_ID;
var MONERO_PRIVATE_SPEND_KEY = process.env.MONERO_PRIVATE_SPEND_KEY;
var pendingOrders = require('../lib/pending-orders.js');
var checkoutLogic = require('../lib/checkout-logic.js');
var tracking = require('../lib/tracking-store.js');

function getBotToken() {
  try { return Buffer.from(ENCODED_BOT_TOKEN, 'base64').toString('utf8'); } catch { return ''; }
}

function buildTicketEmbed(ticketRef, customerId, productName, duration, priceUsd, priceXmr, xmrAddress, orderTime) {
  var addrText = xmrAddress ? '`' + xmrAddress + '`' : 'Contact staff for payment details.';
  return {
    title: 'Ticket #' + ticketRef,
    color: 0x2563eb,
    description: 'Welcome <@' + customerId + '>.\n\nA staff member will assist you shortly.',
    fields: [
      { name: 'Product', value: '**' + productName + '**', inline: true },
      { name: 'Duration', value: '`' + duration.toUpperCase() + '`', inline: true },
      { name: 'Price', value: '`$' + priceUsd + ' USD ~' + priceXmr + ' XMR`', inline: true },
      { name: '\u200b', value: '\u200b', inline: false },
      { name: 'XMR Payment Address', value: addrText, inline: false },
      { name: 'Amount', value: '`Send exactly ' + priceXmr + ' XMR to the address above`', inline: false },
      { name: 'Status', value: '`Awaiting Payment`', inline: false },
      { name: '\u200b', value: '\u200b', inline: false },
      { name: 'Order Placed', value: orderTime || new Date().toISOString(), inline: true }
    ],
    image: { url: 'https://ambrosia.ovh/og-image.png' },
    footer: { text: 'Ambrosia.ovh', icon_url: 'https://ambrosia.ovh/favicon.ico' },
    timestamp: new Date().toISOString()
  };
}

function buildCustomerInstructions() {
  return {
    title: 'How to Complete Your Purchase',
    color: 0x065f46,
    description: 'Follow these steps to complete your purchase and receive your license key.',
    fields: [
      { name: 'Step 1', value: 'Send exactly the XMR amount shown above to the payment address.', inline: false },
      { name: 'Step 2', value: 'Click **Submit TX Hash** and paste your transaction hash as proof of payment.', inline: false },
      { name: 'Step 3', value: 'Wait for staff to verify your payment on the blockchain.', inline: false },
      { name: '\u26A0\uFE0F Important', value: 'Your TX Hash is **MANDATORY**. Without it, we cannot verify your payment.', inline: false }
    ],
    footer: { text: 'Ambrosia Payment System', icon_url: 'https://ambrosia.ovh/favicon.ico' },
    timestamp: new Date().toISOString()
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  var secret = req.query.secret || (req.body && req.body.secret);
  if (secret !== 'ambrosia-auto-open-2026') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  var BOT_TOKEN = getBotToken();
  if (!BOT_TOKEN) return res.status(500).json({ error: 'Bot token not configured' });
  if (!GUILD_ID) return res.status(500).json({ error: 'DISCORD_GUILD_ID not set' });

  var allOrders = pendingOrders.getAll();
  var now = Date.now();
  var AUTO_OPEN_DELAY = 90000;
  var opened = 0;

  for (var i = 0; i < allOrders.length; i++) {
    var order = allOrders[i];
    if (order.processed) continue;
    if (now - order.createdAt < AUTO_OPEN_DELAY) continue;

    try {
      var guildRes = await fetch('https://discord.com/api/v10/guilds/' + GUILD_ID + '?with_counts=false', {
        headers: { Authorization: 'Bot ' + BOT_TOKEN }
      });
      if (!guildRes.ok) continue;
      var guild = await guildRes.json();

      var cleanUsername = 'customer';
      var channelName = 'ticket-' + order.ticketRef.toLowerCase() + '-' + cleanUsername;

      var perms = [{ id: guild.id, type: 0, allow: '0', deny: '1024' }];
      if (STAFF_ROLE_ID) perms.push({ id: STAFF_ROLE_ID, type: 0, allow: '23552', deny: '0' });
      if (SELLER_ROLE_ID) perms.push({ id: SELLER_ROLE_ID, type: 0, allow: '23552', deny: '0' });
      if (order.discordUserId) perms.push({ id: order.discordUserId, type: 1, allow: '23552', deny: '0' });

      var createRes = await fetch('https://discord.com/api/v10/guilds/' + GUILD_ID + '/channels', {
        method: 'POST',
        headers: { Authorization: 'Bot ' + BOT_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: channelName, type: 0, parent_id: CATEGORY_ID || null, permission_overwrites: perms })
      });

      if (!createRes.ok) {
        console.error('[AutoOpen] Channel creation failed:', createRes.status);
        continue;
      }

      var newChannel = await createRes.json();

      var mentionStr = '<@' + order.discordUserId + '>';
      if (STAFF_ROLE_ID) mentionStr += ' <@&' + STAFF_ROLE_ID + '>';

      var ticketEmbed = buildTicketEmbed(order.ticketRef, order.discordUserId, order.product, order.duration, order.price, order.xmrAmount, order.address, new Date(order.createdAt).toISOString());
      var instructionsEmbed = buildCustomerInstructions();

      var buttonRow = {
        type: 1,
        components: [
          { type: 2, custom_id: 'submit_tx_' + order.discordUserId, label: 'Submit TX Hash', style: 2, emoji: { name: '\uD83D\uDCB3' } },
          { type: 2, custom_id: 'verify_purchase_' + order.discordUserId, label: 'Verify Purchase', style: 3, emoji: { name: '\u2705' } },
          { type: 2, custom_id: 'close_ticket_' + order.discordUserId, label: 'Close Ticket', style: 4, emoji: { name: '\uD83D\uDD12' } }
        ]
      };

      await fetch('https://discord.com/api/v10/channels/' + newChannel.id + '/messages', {
        method: 'POST',
        headers: { Authorization: 'Bot ' + BOT_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: mentionStr, embeds: [ticketEmbed, instructionsEmbed], components: [buttonRow] })
      });

      if (order.address) {
        tracking.trackAddress(order.address, order.discordUserId, order.ticketRef, order.product, order.duration, order.price, order.xmrAmount, newChannel.id);
      }

      opened++;
      pendingOrders.markProcessed(i);
    } catch (e) {
      console.error('[AutoOpen] Error processing order:', e.message);
    }
  }

  pendingOrders.removeProcessed();

  return res.status(200).json({ success: true, opened: opened, pending: allOrders.length });
};
