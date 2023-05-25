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
const DashboardController = require('../app/controllers/seller/dashboard-controller');
const NotificationController = require('../app/controllers/seller/notification-controller');
const TicketController = require('../app/controllers/seller/ticket-controller');
const CheckPriceController = require('../app/controllers/expedition/check-price-controller');

router.group('/auth', (route) => {
  route.post('/login', AuthController.login);
});

router.group('/', (route) => {
  route.post('/check-service-fee', Authorization, CheckPriceController);
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
  route.get('/all', Authorization, OrderController.listall);
  route.get('/mutasi', Authorization, OrderController.mutasi);
  route.get('/batch', Authorization, OrderController.batch);
  route.post('/export', Authorization, OrderController.export);
  route.post('/print', Authorization, OrderController.print);
  route.get('/:id', Authorization, OrderController.detail);
});

router.group('/payment', (route) => {
  route.post('/topup', Authorization, PaymentController.topup);
  route.post('/withdraw', Authorization, PaymentController.withdraw);
  route.post('/callback', PaymentController.callback);
  route.get('/history', Authorization, PaymentController.history);
  route.get('/referral-history', Authorization, PaymentController.referralHistory);
  route.get('/summary', Authorization, PaymentController.summary);
});

router.group('/notification', (route) => {
  route.get('/', Authorization, NotificationController.index);
  route.get('/:id', Authorization, NotificationController.read);
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
