const app = require('express');
require('express-group-routes');

const router = app.Router();
const Authorization = require('../app/middlewares/admin-authentication');

const AuthController = require('../app/controllers/admin/auth-controller');
const ProfileController = require('../app/controllers/admin/profile-controller');
const SellerController = require('../app/controllers/admin/seller-controller');
const UserController = require('../app/controllers/admin/user-controller');
const TransactionFeeController = require('../app/controllers/admin/transaction-fee-controller');
const InsuranceController = require('../app/controllers/admin/insurance-controller');
const DiscountRateController = require('../app/controllers/admin/discount-rate-controller');
const TrackingController = require('../app/controllers/admin/order-tracking-controller');
const BalanceController = require('../app/controllers/admin/balance-controller');
const OrderController = require('../app/controllers/admin/order-controller');
const DashboardController = require('../app/controllers/admin/dashboard-controller');
const TicketController = require('../app/controllers/admin/ticket-controller');
const NotificationController = require('../app/controllers/admin/notification-controller');
const CancelController = require('../app/controllers/expedition/cancel-order-controller');

router.group('/auth', (route) => {
  route.post('/login', AuthController.login);
  route.get('/getreferralcode', AuthController.getreferralcode);
});

router.group('/profile', (route) => {
  route.get('/me', Authorization, ProfileController.index);
});

router.group('/dashboard', (route) => {
  route.get('/cod-total', Authorization, DashboardController.codTotal);
});

router.group('/seller', (route) => {
  route.get('/', Authorization, SellerController.index);
  route.get('/special-rate', Authorization, SellerController.specialRate);
  route.get('/:id', Authorization, SellerController.detail);
  route.post('/', Authorization, SellerController.create);
  route.post('/update-balance', Authorization, SellerController.updateBalance);
  route.post('/set-special-rate', Authorization, SellerController.setSpecialRate);
  route.post('/reset-special-rate', Authorization, SellerController.resetSpecialRate);
  route.delete('/:id', Authorization, SellerController.delete);
  route.post('/generate-referral-code/:id', Authorization, SellerController.generateReferralCode);
  route.post('/set-referral-code/:id', Authorization, SellerController.setReferralCode);
});

router.group('/user', (route) => {
  route.get('/', Authorization, UserController.index);
  route.get('/:id', Authorization, UserController.detail);
  route.post('/', Authorization, UserController.create);
  route.delete('/:id', Authorization, UserController.delete);
});

router.group('/transaction-fee', (route) => {
  route.get('/', Authorization, TransactionFeeController.index);
  route.post('/update', Authorization, TransactionFeeController.update);
});

router.group('/insurance', (route) => {
  route.get('/', Authorization, InsuranceController.index);
  route.post('/update', Authorization, InsuranceController.update);
});

router.group('/discount-rate', (route) => {
  route.get('/', Authorization, DiscountRateController.index);
  route.post('/update', Authorization, DiscountRateController.update);
});

router.group('/tracking', (route) => {
  route.post('/', Authorization, TrackingController);
});

router.group('/balance', (route) => {
  route.get('/total-balance', Authorization, BalanceController.totalBalance);
  route.get('/balance-history', Authorization, BalanceController.balanceHistory);
  route.get('/order-history', Authorization, BalanceController.orderHistory);
  route.get('/combined-history', Authorization, BalanceController.combinedHistory);
});

router.group('/order', (route) => {
  route.get('/lala-all', Authorization, OrderController.lalalistall);
  route.get('/', Authorization, OrderController.index);
  route.get('/all', Authorization, OrderController.listall);
  route.get('/batch', Authorization, OrderController.batch);
  route.post('/export', Authorization, OrderController.export);
  route.post('/print', Authorization, OrderController.print);
  route.get('/:id', Authorization, OrderController.detail);
  route.post('/set-return-status/:id', Authorization, OrderController.setReturnStatus);
  route.get('/cancel/:id', Authorization, OrderController.cancel);
  route.get('/retur/all', Authorization, OrderController.retur);

});

router.group('/notification', (route) => {
  route.get('/', Authorization, NotificationController.index);
  route.post('/', Authorization, NotificationController.create);
  route.post('/:id', Authorization, NotificationController.update);
  route.get('/:id', Authorization, NotificationController.detail);
  route.delete('/:id', Authorization, NotificationController.delete);
});

router.group('/ticket', (route) => {
  route.get('/', Authorization, TicketController.index);
  route.get('/:id', Authorization, TicketController.detail);
  route.post('/:id', Authorization, TicketController.comment);
  route.get('/:id/:status', Authorization, TicketController.update);
  route.post('/', Authorization, TicketController.create);
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
