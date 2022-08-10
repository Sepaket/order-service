const paramsMapper = ({ payload }) => ({
  requested_tracking_number: payload.resi,
  service_type: 'Parcel',
  service_level: payload.service_code,
  from: {
    name: payload.sender_name,
    phone_number: payload.sender_phone,
    email: payload.seller.email,
    address: {
      address1: payload.sellerLocation?.address || '',
      address2: '',
      area: payload.origin?.subDistrict || '',
      city: payload.origin?.city || '',
      state: payload.origin?.province || '',
      address_type: 'office',
      country: 'Indonesia',
      postcode: payload.origin?.postalCode || '',
    },
  },
  to: {
    name: payload.receiver_name,
    phone_number: payload.receiver_phone,
    email: '',
    address: {
      address1: `${payload.receiver_address}, Note: ${payload.receiver_address_note}`,
      address2: '',
      area: payload.destination?.subDistrict || '',
      city: payload.destination?.city || '',
      state: payload.destination?.province || '',
      address_type: 'home',
      country: 'Indonesia',
      postcode: payload.destination?.postalCode || '',
    },
  },
  parcel_job: {
    is_pickup_required: true,
    pickup_service_type: 'Scheduled',
    pickup_service_level: payload.service_code,
    pickup_date: payload.pickup_date,
    pickup_timeslot: {
      start_time: '09:00',
      end_time: '18:00',
      timezone: 'Asia/Jakarta',
    },
    pickup_instructions: payload.note,
    delivery_start_date: payload.pickup_date,
    delivery_timeslot: {
      start_time: '09:00',
      end_time: '18:00',
      timezone: 'Asia/Jakarta',
    },
    delivery_instructions: payload.note,
    'allow-weekend_delivery': true,
    dimensions: {
      weight: payload.weight,
    },
    items: [
      {
        item_description: payload.goods_content,
        quantity: payload.goods_qty,
        is_dangerous_good: payload.goods_category === 'ORGANIC',
      },
    ],
  },
});

module.exports = paramsMapper;
