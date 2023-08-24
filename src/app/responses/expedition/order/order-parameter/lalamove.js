const paramsMapper = ({ payload }) => ({
  serviceType: 'MOTORCYCLE',
  specialRequests: ['DOOR_TO_DOOR'],
  language: 'en_ID',
  stops: [
    {
      coordinates: {
        lat: '-6.278963',
        lng: '106.814267',
      },
      address: 'Jl Benda 70, Cilandak Timur, Jakarta selatan',
    },
    {
      coordinates: {
        lat: '-6.273184',
        lng: '106.839068',
      },
      address: 'RS Siaga, Pejaten',
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
