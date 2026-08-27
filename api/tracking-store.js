var trackedAddresses = {};

function trackAddress(address, userId, ticketRef, product, duration, priceUsd, priceXmr, channelId) {
  trackedAddresses[address] = {
    userId: userId,
    ticketRef: ticketRef,
    product: product,
    duration: duration,
    priceUsd: priceUsd,
    priceXmr: priceXmr,
    channelId: channelId,
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

module.exports = {
  trackedAddresses: trackedAddresses,
  trackAddress: trackAddress,
  closeTicketTracking: closeTicketTracking,
  getActiveTracking: getActiveTracking
};
