var trackedAddresses = {};
var MAX_ACTIVE_TICKETS = 3;

function trackAddress(address, userId, ticketRef, product, duration, priceUsd, priceXmr, channelId, orderNotificationMessageId) {
  trackedAddresses[address] = {
    userId: userId,
    ticketRef: ticketRef,
    product: product,
    duration: duration,
    priceUsd: priceUsd,
    priceXmr: priceXmr,
    channelId: channelId,
    orderNotificationMessageId: orderNotificationMessageId || null,
    status: 'active',
    createdAt: new Date().toISOString()
  };
  console.log('[Tracking] Registered address for user ' + userId + ': ' + address.substring(0, 20) + '...');
}

function closeTicketTracking(channelId) {
  var count = 0;
  for (var addr in trackedAddresses) {
    if (trackedAddresses[addr].channelId === channelId && trackedAddresses[addr].status === 'active') {
      trackedAddresses[addr].status = 'closed';
      trackedAddresses[addr].closedAt = new Date().toISOString();
      count++;
    }
  }
  console.log('[Tracking] Closed ' + count + ' address(es) for channel ' + channelId);
  return count;
}

function getActiveTracking() {
  var active = {};
  for (var addr in trackedAddresses) {
    if (trackedAddresses[addr].status === 'active') {
      active[addr] = trackedAddresses[addr];
    }
  }
  return active;
}

function getActiveTicketCount(userId) {
  var count = 0;
  for (var addr in trackedAddresses) {
    if (trackedAddresses[addr].userId === userId && trackedAddresses[addr].status === 'active') {
      count++;
    }
  }
  return count;
}

function canOpenTicket(userId) {
  return getActiveTicketCount(userId) < MAX_ACTIVE_TICKETS;
}

function getTrackingByChannelId(channelId) {
  for (var addr in trackedAddresses) {
    if (trackedAddresses[addr].channelId === channelId) {
      return trackedAddresses[addr];
    }
  }
  return null;
}

module.exports = {
  trackedAddresses: trackedAddresses,
  trackAddress: trackAddress,
  closeTicketTracking: closeTicketTracking,
  getActiveTracking: getActiveTracking,
  getActiveTicketCount: getActiveTicketCount,
  canOpenTicket: canOpenTicket,
  getTrackingByChannelId: getTrackingByChannelId,
  MAX_ACTIVE_TICKETS: MAX_ACTIVE_TICKETS
};
