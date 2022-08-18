const ninjaStatus = {
  PROCESSED: [
    'Pending Pickup',
    'Successful Pickup',
    'En-route to Sorting Hub',
    'Arrived at Sorting Hub',
    'Transferred to 3PL',
    'Arrived at Origin Hub',
    'On Vehicle for Delivery',
    'On Vehicle for Delivery (RTS)',
    'Arrived at Distribution Point',
    'Pending Reschedule',
    'Pending Pickup at Distribution Point',
    'Van En-route to Pickup',
    'Parcel Size',
    'Parcel Weight',
    'Parcel Measurements Update',
    'Staging',
    'Cross Border Transit',
    'Customs Cleared',
  ],
  DELIVERED: [
    'Successful Delivered', // ninja has status "Delivered" in API response but different status in documentation
    // 'Successful Delivery',
    'Completed',
    'Customs Held',
  ],
  CANCELED: [
    'Cancelled',
  ],
  RETURN_TO_SELLER: [
    'Returned to Sender',
    'Return to Sender Triggered',
    'Returned to Sender',
  ],
  PROBLEM: [
    'Pickup Fail',
    'First Attempt Delivery Fail',
  ],
};

module.exports = ninjaStatus;
