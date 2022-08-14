const idxStatus = {
  PROCESSED: [
    'pick up scan',
    'loading scan',
    'sending scan',
    'arival scan',
    'unloading scan',
    'delivery scan',
    'pod scan',
    'return pod',
    'pickup failure',
  ],
  DELIVERED: [],
  CANCELED: [],
  RETURN_TO_SELLER: [
    'confirm return bill',
  ],
  PROBLEM: [
    'problem on shipment scan',
    'create return bill',
  ],
};

module.exports = idxStatus;
