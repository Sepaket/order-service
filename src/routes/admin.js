const app = require('express');
require('express-group-routes');

const router = app.Router();
const Authorization = require('../app/middlewares/admin-authentication');

const AuthController = require('../app/controllers/admin/auth-controller');
const ProfileController = require('../app/controllers/admin/profile-controller');
const SellerController = require('../app/controllers/admin/seller-controller');
const UserController = require('../app/controllers/admin/user-controller');

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
