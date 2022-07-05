const app = require('express');
require('express-group-routes');

const router = app.Router();

const Authorization = require('../app/middlewares/seller-authentication');

const OrderController = require('../app/controllers/expedition/order-controller');
const ServiceController = require('../app/controllers/expedition/service-controller');
const CheckPriceController = require('../app/controllers/expedition/check-price-controller');
const ServiceCodeController = require('../app/controllers/expedition/service-code-controller');

router.group('/service', (route) => {
  route.get('/', ServiceController.index);
});

router.group('/service-code', (route) => {
  route.get('/:type', ServiceCodeController.index);
  route.get('/:type/:code', ServiceCodeController.detail);
});

router.group('/', (route) => {
  route.post('/check-service-fee', CheckPriceController);
});

router.group('/order', (route) => {
  route.post('/single', Authorization, OrderController.singleOrder);
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
