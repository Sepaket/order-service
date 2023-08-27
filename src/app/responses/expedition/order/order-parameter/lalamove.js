const paramsMapper = ({ payload }) => ({
  data: {
    serviceType: 'MOTORCYCLE',
    specialRequests: ['DOOR_TO_DOOR'],
    language: 'en_ID',
    stops: [
      {
        // coordinates: {
        //   lat: '-6.278963',
        //   lng: '106.814267',
        // },
        address: payload?.sellerLocation?.address,

      },
      {
        // coordinates: {
        //   lat: '-6.273184',
        //   lng: '106.839068',
        // },
        address: payload?.receiver_address,
      }],
    isRouteOptimized: true,
    item: {
      quantity: payload?.order_items.goods_qty,
      weight: 'LESS_THAN_3_KG',
      //
      // quantity: payload?.order_items.goods_qty,
      // weight: payload?.weight,
      categories: ['FOOD_DELIVERY', 'OFFICE_ITEM'],
      handlingInstructions: ['KEEP_UPRIGHT'],
    },
  },
});
module.exports = paramsMapper;
