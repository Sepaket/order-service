const app = require('express');
require('express-group-routes');

const router = app.Router();

const AuthController = require('../app/controllers/seller/auth-controller');

router.group('/auth', (route) => {
  route.post('/register', AuthController.register);
  route.post('/login', AuthController.login);
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
