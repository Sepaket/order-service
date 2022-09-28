const app = require('express');
require('express-group-routes');

const router = app.Router();

const Uploader = require('../app/middlewares/uploader');
const SellerAuthorization = require('../app/middlewares/seller-authentication');

const LocationController = require('../app/controllers/general/location-controller');
const FaqConrtoller = require('../app/controllers/general/faq-controller');
const UploadController = require('../app/controllers/general/upload-controller');
const BankController = require('../app/controllers/general/bank-controller');
const TicketCategory = require('../app/controllers/general/ticket-category-controller');

router.group('/location', (route) => {
  route.get('/', LocationController.index);
  route.post('/detail', LocationController.detail);
});

router.group('/faq', (route) => {
  route.get('/', FaqConrtoller.index);
  route.get('/:id', FaqConrtoller.detail);
});

router.group('/bank', (route) => {
  route.get('/', BankController.index);
  route.get('/:id', BankController.detail);
});

router.group('/ticket-category', (route) => {
  route.get('/', TicketCategory.index);
  route.get('/:id', TicketCategory.detail);
});

router.group('/upload', (route) => {
  route.post('/', [SellerAuthorization, Uploader], UploadController);
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
