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

router.group('/auth', (route) => {
  route.post('/login', AuthController.login);
});

router.group('/profile', (route) => {
  route.get('/me', Authorization, ProfileController.index);
});

router.group('/seller', (route) => {
  route.get('/', Authorization, SellerController.index);
  route.get('/:id', Authorization, SellerController.detail);
  route.post('/', Authorization, SellerController.create);
  route.delete('/:id', Authorization, SellerController.delete);
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
