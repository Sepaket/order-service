const ninjaStatus = {
  PROCESSED: [
    'pending pickup',
    'successful pickup',
    'en-route to sorting hub',
    'arrived at sorting hub',
    'transferred to 3PL',
    'arrived at origin hub',
    'on vehicle for delivery',
    'on vehicle for delivery (rts)',
    'arrived at distribution point',
    'pending reschedule',
    'pending pickup at distribution point',
    'van en-route to pickup',
    'parcel size',
    'parcel weight',
    'parcel measurements update',
    'staging',
    'cross border transit',
    'customs cleared',
  ],
  DELIVERED: [
    'successful delivered',
    'completed',
    'customs held',
    'successful delivery',
  ],
  CANCELED: [
    'cancelled',
  ],
  RETURN_TO_SELLER: [
    'returned to sender',
    'return to sender triggered',
    'returned to sender',
  ],
  PROBLEM: [
    'pickup fail',
    'first attempt delivery fail',
  ],
};

module.exports = ninjaStatus;
