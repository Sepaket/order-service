require('dotenv').config();
const cors = require('cors');
const path = require('path');
const express = require('express');
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');

const application = express();
const bodyParser = require('body-parser');

const errorHandler = require('./src/app/middlewares/errorHandler');

// const batchScheduler = require('./src/scheduler/batch-scheduler');
// const cleanerNinjaTokenScheduler = require('./src/scheduler/clear-token-scheduler');
//
const createOrderScheduler = require('./src/scheduler/create-order-scheduler');
// const ninjaScheduler = require('./src/scheduler/ninja-scheduler')
// const trackingScheduler = require('./src/scheduler/tracking-scheduler');


const port = process.env.APP_PORT || 6000;

// errror tracing global
Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({ application }),
  ],
});

// routes load
const adminRoute = require('./src/routes/admin');
const sellerRoute = require('./src/routes/seller');
const generalRoute = require('./src/routes/general');
const partnerRoute = require('./src/routes/partner');
const expeditionRoute = require('./src/routes/expedition');

const corsOptions = {
  optionsSuccessStatus: 200,
  origin: [
    'http://localhost:4200',
    'https://sepaket.co.id',
    'https://frontend.sepaket.co.id',
    'https://api.xendit.co/',
    '*',
  ],
};



// application.use(cors(corsOptions));
application.use(cors());
application.use(Sentry.Handlers.requestHandler());
application.use(Sentry.Handlers.tracingHandler());
application.use(bodyParser.urlencoded({ extended: true }));
application.use(bodyParser.text({ defaultCharset: 'utf-8' }));
// application.use(bodyParser.json({ limit: '500mb', type: 'application/json' }));
application.use(bodyParser.json({ limit: 1024102420, type: 'application/json' }));
application.use(express.json({ type: ['text/*', '*/json'] }));
application.listen(port);

application.use('/api/v1/partner', partnerRoute);
application.use('/api/v1/admin', adminRoute);
application.use('/api/v1/seller', sellerRoute);
application.use('/api/v1/general', generalRoute);
application.use('/api/v1/expedition', expeditionRoute);


application.use(Sentry.Handlers.errorHandler());
application.use(express.static(path.join(__dirname)));
application.use(errorHandler);

// eslint-disable-next-line no-console
console.log(`server run on ${process.env.APP_HOST}:${process.env.APP_PORT}`);
