const paramsMapper = ({ payload }) => ({
  serviceType: 'THIS IS FROM PARAMS MAPPER',
  specialRequests: ['TOLL_FEE_10'],
  language: 'en_HK',
  stops: [
    {
      coordinates: {
        lat: '22.33547351186244',
        lng: '114.17615807116502',
      },
      address: 'Innocentre, 72 Tat Chee Ave, Kowloon Tong',
    },
    {
      coordinates: {
        lat: '22.29553167157697',
        lng: '114.16885175766998',
      },
      address: 'Canton Rd, Tsim Sha Tsui',
    }],
  isRouteOptimized: false,
  item: {
    quantity: '12',
    weight: 'LESS_THAN_3_KG',
    categories: ['FOOD_DELIVERY', 'OFFICE_ITEM'],
    handlingInstructions: ['KEEP_UPRIGHT'],
  },
});
module.exports = paramsMapper;
