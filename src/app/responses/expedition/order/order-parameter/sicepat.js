const pickupAddressFormatter = async ({ payload }) => {
  const address = payload?.sellerLocation;

  return `
    ${address?.address || ''},
    Kec. ${address?.location?.subDistrict || ''},
    Kota ${address?.location?.city || ''},
    ${address?.location?.province || ''},
    ${address?.location?.postalCode || ''}
  `;
};

const receiverAddressFormatter = async ({ payload }) => {
  const address = payload?.destination;

  return `
    ${payload?.address || ''},
    Kec. ${address?.subDistrict || ''},
    Kota ${address?.city || ''},
    ${address?.province || ''},
    ${address?.postalCode || ''}
  `;
};

const paramsMapper = async ({ payload }) => {
  const pickupAddress = await pickupAddressFormatter({ payload });
  const receiverAddress = await receiverAddressFormatter({ payload });

  return {
    reference_number: `${process.env.SICEPAT_ORDER_PREFIX}${payload.resi}`,
    pickup_request_date: `${payload.pickup_date} ${payload.pickup_time}`,
    pickup_method: 'PICKUP',
    pickup_merchant_code: `Sepaket-${payload.seller.id}`,
    pickup_merchant_name: payload?.sellerLocation.picName,
    pickup_address: pickupAddress.replace(/\n/g, ' ').replace(/  +/g, ' '),
    pickup_city: payload?.sellerLocation?.location?.city?.toUpperCase() || '',
    pickup_merchant_phone: payload?.sellerLocation?.picPhoneNumber || '',
    pickup_merchant_email: payload.seller?.email || '',
    PackageList: [
      {
        receipt_number: payload.resi,
        origin_code: payload?.origin?.sicepatOriginCode,
        delivery_type: payload.service_code,
        parcel_category: payload.goods_category,
        parcel_content: payload.goods_content,
        parcel_qty: payload.goods_qty,
        parcel_uom: 'Pcs',
        parcel_value: payload.goodsAmount,
        total_weight: payload.weight,
        shipper_name: payload.sender_name,
        shipper_address: pickupAddress.replace(/\n/g, ' ').replace(/  +/g, ' '),
        shipper_province: payload?.sellerLocation?.location?.province || '',
        shipper_city: payload?.sellerLocation?.location?.city || '',
        shipper_district: payload?.sellerLocation?.location?.district || '',
        shipper_zip: payload?.sellerLocation?.location?.postalCode || '',
        shipper_phone: payload.sender_phone,
        shipper_longitude: '',
        shipper_latitude: '',
        recipient_title: 'Mr',
        recipient_name: payload.receiver_name,
        recipient_address: receiverAddress.replace(/\n/g, ' ').replace(/  +/g, ' '),
        recipient_province: payload?.destination?.province || '',
        recipient_city: payload?.destination?.city || '',
        recipient_district: payload?.destination?.district || '',
        recipient_zip: payload?.destination?.postalCode || '',
        recipient_phone: payload.receiver_phone,
        recipient_longitude: '',
        recipient_latitude: '',
        destination_code: payload?.destination?.sicepatDestinationCode || '',
      },
    ],
  };
};

module.exports = paramsMapper;
