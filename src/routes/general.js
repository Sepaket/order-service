const app = require('express');
require('express-group-routes');

const router = app.Router();

const Uploader = require('../app/middlewares/uploader');
const SellerAuthorization = require('../app/middlewares/seller-authentication');

const LocationController = require('../app/controllers/general/location-controller');
const FaqConrtoller = require('../app/controllers/general/faq-controller');
const UploadController = require('../app/controllers/general/upload-controller');

router.group('/location', (route) => {
  route.get('/province', LocationController.provinceList);
  route.get('/province/:id', LocationController.provinceDetail);
  route.get('/city', LocationController.cityList);
  route.get('/city/:id', LocationController.cityDetail);
  route.get('/district', LocationController.districtList);
  route.get('/district/:id', LocationController.districtDetail);
  route.get('/sub-district', LocationController.subDistrictList);
  route.get('/sub-district/:id', LocationController.subDistrictDetail);
  route.get('/list', LocationController.locationList);
});

router.group('/faq', (route) => {
  route.get('/', FaqConrtoller.index);
  route.get('/:id', FaqConrtoller.detail);
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
