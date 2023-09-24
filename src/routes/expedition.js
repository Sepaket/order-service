const app = require('express');
require('express-group-routes');

const router = app.Router();

const Authorization = require('../app/middlewares/seller-authentication');

const OrderController = require('../app/controllers/expedition/order-controller');
const ServiceController = require('../app/controllers/expedition/service-controller');
const CheckPriceController = require('../app/controllers/expedition/check-price-controller');
const ServiceCodeController = require('../app/controllers/expedition/service-code-controller');
const TrackingController = require('../app/controllers/expedition/order-tracking-controller');
const CancelController = require('../app/controllers/expedition/cancel-order-controller');

router.group('/service', (route) => {
  route.get('/', ServiceController.index);
});

router.group('/service-code', (route) => {
  route.get('/:type', ServiceCodeController.index);
  route.get('/:type/:code', ServiceCodeController.detail);
});

router.group('/', (route) => {
  route.post('/check-service-fee', CheckPriceController.checkPrice);
  route.post('/check-lalamove-fee', CheckPriceController.checkLalamovePrice);
  route.get('/get-lalamove-city', CheckPriceController.getLalamoveCity);
  route.get('/get-lalamove-service', CheckPriceController.getLalamoveService);
});

router.group('/order', (route) => {
  route.post('/', Authorization, OrderController.commonOrder);
  route.get('/lalaorder', Authorization, OrderController.getLalaOrder);
  route.post('/lalaorder', Authorization, OrderController.lalaOrder);
  route.post('/lalaquotation', Authorization, OrderController.lalaQuotation);

  route.post('/bulk', Authorization, OrderController.bulkOrder);
  route.get('/transaction-fee', Authorization, OrderController.transactionFee);
  route.get('/draft/:batch_id', Authorization, OrderController.draftOrder);
  route.post('/ninja/callback', OrderController.ninjaCallback);
});

router.group('/tracking', (route) => {
  route.post('/', Authorization, TrackingController);
});

router.group('/cancel', (route) => {
  route.get('/:id', Authorization, CancelController);
});

// method not allowed when method request http is failure
router.all('/*', (req, res) => {
  res.status(405)
    .json({
      status: '405',
      message: `${req.method} not allowed on this route`,
      data: {},
    });
});

module.exports = router;
