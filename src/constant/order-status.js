const jneStatus = require('./jne-status');
const sicepatStatus = require('./sicepat-status');
const ninjaStatus = require('./ninja-status');
const sapStatus = require('./sap-status');
const idxStatus = require('./idx-status');

const orderStatus = {
  WAITING_PICKUP: {
    text: 'WAITING_PICKUP',
    statuses: [],
  },
  PROCESSED: {
    text: 'PROCESSED',
    statuses: {
      JNE: jneStatus.PROCESSED,
      SICEPAT: sicepatStatus.PROCESSED,
      NINJA: ninjaStatus.PROCESSED,
      SAP: sapStatus.PROCESSED,
      IDEXPRESS: idxStatus.PROCESSED,
    },
  },
  DELIVERED: {
    text: 'DELIVERED',
    statuses: {
      JNE: jneStatus.DELIVERED,
      SICEPAT: sicepatStatus.DELIVERED,
      NINJA: ninjaStatus.DELIVERED,
      SAP: sapStatus.DELIVERED,
      IDEXPRESS: idxStatus.DELIVERED,
    },
  },
  CANCELED: {
    text: 'CANCELED',
    statuses: {
      JNE: jneStatus.CANCELED,
      SICEPAT: sicepatStatus.CANCELED,
      NINJA: ninjaStatus.CANCELED,
      SAP: sapStatus.CANCELED,
      IDEXPRESS: idxStatus.CANCELED,
    },
  },
  RETURN_TO_SELLER: {
    text: 'RETURN_TO_SELLER',
    statuses: {
      JNE: jneStatus.RETURN_TO_SELLER,
      SICEPAT: sicepatStatus.RETURN_TO_SELLER,
      NINJA: ninjaStatus.RETURN_TO_SELLER,
      SAP: sapStatus.RETURN_TO_SELLER,
      IDEXPRESS: idxStatus.RETURN_TO_SELLER,
    },
  },
  PROBLEM: {
    text: 'PROBLEM',
    statuses: {
      JNE: jneStatus.PROBLEM,
      SICEPAT: sicepatStatus.PROBLEM,
      NINJA: ninjaStatus.PROBLEM,
      SAP: sapStatus.PROBLEM,
      IDEXPRESS: idxStatus.PROBLEM,
    },
  },
};

module.exports = orderStatus;
