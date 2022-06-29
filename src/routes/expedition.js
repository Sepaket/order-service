const app = require('express');
require('express-group-routes');

const router = app.Router();

const Authorization = require('../app/middlewares/seller-authentication');

const ExpeditionController = require('../app/controllers/expedition/expedition-controller');

router.group('/', (route) => {
  route.post('/check-service-fee', Authorization, ExpeditionController.checkPrice);
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
