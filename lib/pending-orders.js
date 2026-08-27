var pendingOrders = [];

function addPendingOrder(order) {
  order.createdAt = Date.now();
  order.processed = false;
  pendingOrders.push(order);
}

function getAll() {
  return pendingOrders;
}

function getPendingOrders() {
  return pendingOrders.filter(function(o) { return !o.processed; });
}

function markProcessed(orderIndex) {
  if (pendingOrders[orderIndex]) {
    pendingOrders[orderIndex].processed = true;
  }
}

function markProcessedByTicketRef(ticketRef) {
  for (var i = 0; i < pendingOrders.length; i++) {
    if (pendingOrders[i].ticketRef === ticketRef) {
      pendingOrders[i].processed = true;
      return true;
    }
  }
  return false;
}

function removeProcessed() {
  pendingOrders = pendingOrders.filter(function(o) { return !o.processed; });
}

module.exports = {
  addPendingOrder: addPendingOrder,
  getAll: getAll,
  getPendingOrders: getPendingOrders,
  markProcessed: markProcessed,
  markProcessedByTicketRef: markProcessedByTicketRef,
  removeProcessed: removeProcessed
};
