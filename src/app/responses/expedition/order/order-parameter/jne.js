const shortid = require('shortid-36');

const parameterHandler = ({ payload }) => ({
  pickup_name: payload?.seller?.name || '',
  pickup_date: payload?.pickup_date?.split('-')?.reverse()?.join('-'),
  pickup_time: payload?.pickup_time,
  pickup_pic: payload?.sellerLocation?.picName || '',
  pickup_pic_phone: payload?.sellerLocation?.picPhoneNumber || '',
  pickup_address: payload?.sellerLocation?.address || '',
  pickup_district: payload?.origin?.district || '',
  pickup_city: payload?.origin?.city || '',
  pickup_service: 'REG',
  pickup_vechile: payload?.should_pickup_with,
  branch: payload?.origin?.jneOriginCode || '',
  cust_id: payload?.is_cod ? process.env.JNE_CUSTOMER_COD : process.env.JNE_CUSTOMER_NCOD,
  order_id: `${shortid.generate()}${shortid.generate()}`.slice(0, 15),
  shipper_name: payload?.sender_name || '',
  shipper_addr1: payload?.sellerLocation?.address?.slice(0, 80) || '',
  shipper_city: payload?.origin?.city || '',
  shipper_zip: payload?.origin?.postalCode || '',
  shipper_region: payload?.origin?.province || '',
  shipper_country: 'Indonesia',
  shipper_contact: payload?.sender_name,
  shipper_phone: payload?.sellerLocation?.picPhoneNumber || '',
  receiver_name: payload?.receiver_name,
  receiver_addr1: payload?.receiver_address,
  receiver_city: payload?.destination?.city || '',
  receiver_zip: payload?.destination?.postalCode || '',
  receiver_region: payload?.destination?.province || '',
  receiver_country: 'Indonesia',
  receiver_contact: payload?.receiver_name,
  receiver_phone: payload?.receiver_phone,
  origin_code: payload?.origin?.jneOriginCode || '',
  destination_code: payload?.destination?.jneDestinationCode || '',
  service_code: payload?.service_code,
  weight: payload?.weight,
  qty: payload?.goods_qty,
  goods_desc: payload?.goods_content,
  goods_amount: payload?.goodsAmount,
  insurance_flag: payload?.is_insurance ? 'Y' : 'N',
  special_ins: payload?.notes || 'FRAGILE',
  merchant_id: parseInt(`${payload?.seller?.id}${payload?.sellerLocation?.id}`, 10),
  type: 'PICKUP',
  cod_flag: payload?.is_cod ? 'Y' : 'N',
  cod_amount: payload?.is_cod ? payload?.cod_value : 0,
  awb: payload?.resi,
});

const paramsMapper = async ({ payload }) => {
  const parameter = await parameterHandler({ payload });

  return Object.keys(parameter).reduce((accumulator, key) => {
    accumulator[key.toUpperCase()] = parameter[key];
    return accumulator;
  }, {});
};

module.exports = paramsMapper;
