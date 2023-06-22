const shortid = require('shortid-36');

const parameterHandler = ({ payload }) => ({
  pickup_name: payload?.seller?.name.slice(0, 50) || '',
  pickup_date: payload?.pickup_date?.split('-')?.reverse()?.join('-'),
  pickup_time: payload?.pickup_time,
  pickup_pic: payload?.sellerLocation?.picName.slice(0, 30) || '',
  pickup_pic_phone: payload?.sellerLocation?.picPhoneNumber || '',
  pickup_address: payload?.sellerLocation?.address || '',
  pickup_district: payload?.origin?.district || '',
  pickup_city: payload?.origin?.city || '',
  pickup_service: 'REG',
  pickup_vehicle: payload?.should_pickup_with,
  branch: payload?.origin?.jneOriginCode || '',
  cust_id: payload?.is_cod ? process.env.JNE_CUSTOMER_COD : process.env.JNE_CUSTOMER_NCOD,
  order_id: `${shortid.generate()}${shortid.generate()}`.slice(0, 15),
  shipper_name: payload?.sender_name.slice(0, 30) || '',
  shipper_addr1: payload?.sellerLocation?.address?.slice(0, 80) || '',
  shipper_addr2: payload?.sellerLocation?.address?.slice(80, 160) || '',
  shipper_addr3: payload?.sellerLocation?.address?.slice(160, 240) || '',
  shipper_city: payload?.origin?.city.slice(0, 20) || '',
  shipper_zip: payload?.origin?.postalCode || '',
  shipper_region: payload?.origin?.province.slice(0, 20) || '',
  shipper_country: 'Indonesia',
  shipper_contact: payload?.sender_name.slice(0, 20),
  shipper_phone: payload?.sellerLocation?.picPhoneNumber || '',
  receiver_name: payload?.receiver_name.slice(0, 30),
  receiver_addr1: payload?.receiver_address.slice(0, 80),
  receiver_addr2: payload?.receiver_address.slice(80, 160),
  receiver_addr3: payload?.receiver_address.slice(160, 240),
  receiver_city: payload?.destination?.city.slice(0, 20) || '',
  receiver_zip: payload?.destination?.postalCode || '',
  receiver_region: payload?.destination?.province.slice(0, 20) || '',
  receiver_country: 'Indonesia',
  receiver_contact: payload?.receiver_name.slice(0, 20),
  receiver_phone: payload?.receiver_phone,
  origin_code: payload?.origin?.jneOriginCode || '',
  destination_code: payload?.destination?.jneDestinationCode || '',
  service_code: payload?.service_code === 'JNECOD' ? 'REG19' : payload.service_code,
  weight: payload?.weight,
  qty: payload?.goods_qty,
  goods_desc: payload?.goods_content.slice(0, 55) || '',
  goods_amount: payload?.goodsAmount,
  insurance_flag: payload?.is_insurance ? 'Y' : 'N',
  special_ins: payload?.notes.slice(0, 55) || 'FRAGILE',
  merchant_id: `${payload?.seller?.id}-${payload?.sellerLocation?.id}`,
  type: 'PICKUP',
  cod_flag: payload?.is_cod ? 'Y' : 'N',
  cod_amount: payload?.is_cod ? payload?.cod_value : 0,
  awb: payload?.resi,
  return_name: process.env.RETURN_NAME,
  return_addr1: payload?.is_cod ? process.env.RETURN_ADDR1 : '',
  return_addr2: payload?.is_cod ? process.env.RETURN_ADDR2 : '',
  return_addr3: payload?.is_cod ? process.env.RETURN_ADDR3 : '',
  return_city: payload?.is_cod ? process.env.RETURN_CITY : '',
  return_zip: payload?.is_cod ? process.env.RETURN_ZIP : '',
  return_region: payload?.is_cod ? process.env.RETURN_REGION : '',
  return_country: payload?.is_cod ? process.env.RETURN_COUNTRY : '',
  return_contact: payload?.is_cod ? process.env.RETURN_CONTACT : '',
  return_branch: payload?.is_cod ? process.env.RETURN_BRANCH : '',
  return_phone: payload?.is_cod ? process.env.RETURN_PHONE : '',

});

const paramsMapper = async ({ payload }) => {
  const parameter = await parameterHandler({ payload });

  return Object.keys(parameter).reduce((accumulator, key) => {
    accumulator[key.toUpperCase()] = parameter[key];
    return accumulator;
  }, {});
};

module.exports = paramsMapper;
