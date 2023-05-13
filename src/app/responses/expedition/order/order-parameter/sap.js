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
  console.log('INSIDE SAP PARAMETER');
  const pickupAddress = await pickupAddressFormatter({ payload });
  const receiverAddress = await receiverAddressFormatter({ payload });

  return {
    customer_code: payload?.is_cod ? "DEV001" : "DEV000",
    awb_no : payload?.resi,
    reference_no: payload?.resi,
    description_item: payload?.goods_content,
    pickup_name: payload?.sellerLocation?.picName || '',
    pickup_address: pickupAddress?.replace(/\n/g, ' ')?.replace(/  +/g, ' '),
    pickup_phone: payload?.sellerLocation?.picPhoneNumber || '',
    pickup_district_code: "JB07",
    service_type_code: payload?.service_code,
    pickup_place: 1,
    quantity: payload?.goods_qty,
    weight: payload?.weight,
    volumetric: "1x1x1",
    shipment_type_code: "SHTPC",
    insurance_flag: payload?.is_insurance ? 2 : 1,
    insurance_type_code: "INS01",
    insurance_value: payload?.is_insurance ? payload.insuranceSelected * payload?.goodsAmount : 0,
    shipper_name: payload?.sender_name,
    shipper_address: pickupAddress?.replace(/\n/g, ' ')?.replace(/  +/g, ' '),
    shipper_phone: payload?.sender_phone,
    destination_district_code: "JB07",
    receiver_name: payload?.receiver_name,
    receiver_address: receiverAddress?.replace(/\n/g, ' ')?.replace(/  +/g, ' '),
    receiver_phone: payload?.receiver_phone,
    item_value: payload?.is_insurance ? payload?.goodsAmount : 0,
    cod_flag: payload?.is_cod ? 2 : 1,
    cod_value: payload?.is_cod ? payload?.cod_value : null

  };
};

module.exports = paramsMapper;
