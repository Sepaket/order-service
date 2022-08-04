const app = require('express');
require('express-group-routes');

const router = app.Router();

const Authorization = require('../app/middlewares/seller-authentication');

const AuthController = require('../app/controllers/seller/auth-controller');
const ProfileController = require('../app/controllers/seller/profile-controller');
const AddressController = require('../app/controllers/seller/address-controller');
const OrderController = require('../app/controllers/seller/order-controller');
const ReportController = require('../app/controllers/seller/report-controller');
const PaymentController = require('../app/controllers/seller/payment-controller');

router.group('/auth', (route) => {
  route.post('/register', AuthController.register);
  route.post('/login', AuthController.login);
  route.post('/social', AuthController.social);
  route.get('/activate/:token', AuthController.activateEmail);
  route.post('/forgot-password', AuthController.forgotPassword);
  route.post('/reset-password', AuthController.resetPassword);
});

router.group('/profile', (route) => {
  route.get('/me', Authorization, ProfileController.index);
  route.post('/update', Authorization, ProfileController.update);
  route.post('/change-password', Authorization, ProfileController.changePassword);
  route.post('/update-payment-method', Authorization, ProfileController.updatePaymentMethod);
});

router.group('/address', (route) => {
  route.get('/', Authorization, AddressController.index);
  route.post('/', Authorization, AddressController.create);
  route.get('/:id', Authorization, AddressController.detail);
  route.post('/:id', Authorization, AddressController.update);
  route.delete('/:id', Authorization, AddressController.delete);
  route.get('/toggle-hide/:id', Authorization, AddressController.toggleHide);
});

router.group('/order', (route) => {
  route.get('/', Authorization, OrderController.index);
  route.get('/batch', Authorization, OrderController.batch);
  route.post('/export', Authorization, OrderController.export);
  route.post('/print', Authorization, OrderController.print);
  route.get('/:id', Authorization, OrderController.detail);
});

router.group('/reports', (route) => {
  route.get('/total-order', Authorization, ReportController.totalOrder);
  route.get('/waiting-for-pickup', Authorization, ReportController.waitingForPickup);
  route.get('/cod-processing', Authorization, ReportController.codProcessing);
  route.get('/non-cod-processing', Authorization, ReportController.nonCodProcessing);
  route.get('/percentage-processing', Authorization, ReportController.percentageProcessing);
  route.get('/cod-sent', Authorization, ReportController.codSent);
  route.get('/non-cod-sent', Authorization, ReportController.nonCodSent);
  route.get('/return-to-seller', Authorization, ReportController.returnToSeller);
  route.get('/need-attention', Authorization, ReportController.needAttention);
  route.get('/rate-retur', Authorization, ReportController.rateRetur);
  route.get('/rate-success-delivered', Authorization, ReportController.rateSuccess);
  route.get('/order-total-chart', Authorization, ReportController.orderTotalChart);
});

router.group('/payment', (route) => {
  route.post('/topup', Authorization, PaymentController.topup);
  route.post('/callback', Authorization, PaymentController.callback);
  route.get('/history', Authorization, PaymentController.history);
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
