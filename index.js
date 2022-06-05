require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const application = express();
const bodyParser = require('body-parser');

const errorHandler = require('./src/app/middlewares/errorHandler');

// port load
const port = process.env.APP_PORT || 6000;

// routes load
// const sellerRoute = require('./src/routes/seller');
const generalRoute = require('./src/routes/general');
// const bloggerRoute = require('./src/routes/blogger');

const corsOptions = {
  optionsSuccessStatus: 200,
  origin: [
    'http://localhost:4200',
  ],
};

application.use(cors(corsOptions));
application.use(bodyParser.urlencoded({ extended: true }));
application.use(bodyParser.json({ limit: 1024102420, type: 'application/json' }));
application.listen(port);
application.use('/api/v1/general', generalRoute);
// application.use('/api/v1/seller', sellerRoute);
application.use(express.static(path.join(__dirname)));
application.use(errorHandler);

// eslint-disable-next-line no-console
console.log(`server run on ${process.env.APP_HOST}:${process.env.APP_PORT}`);
