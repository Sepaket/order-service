const app = require('express');
require('express-group-routes');

const router = app.Router();

const Authorization = require('../app/middlewares/seller-authentication');

const AuthController = require('../app/controllers/seller/auth-controller');
const ProfileController = require('../app/controllers/seller/profile-controller');
const SellerAddressController = require('../app/controllers/seller/seller-address-controller');

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
});

router.group('/address', (route) => {
  route.get('/', Authorization, SellerAddressController.index);
  route.post('/create', Authorization, SellerAddressController.create);
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
