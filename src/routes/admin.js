const app = require('express');
require('express-group-routes');

const router = app.Router();
const Authorization = require('../app/middlewares/admin-authentication');

const AuthController = require('../app/controllers/admin/auth-controller');
const ProfileController = require('../app/controllers/admin/profile-controller');

router.group('/auth', (route) => {
  route.post('/login', AuthController.login);
});

router.group('/profile', (route) => {
  route.get('/me', Authorization, ProfileController.index);
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
