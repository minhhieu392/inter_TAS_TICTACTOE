import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import routes from '../server/routes/v1';
import passport from 'passport';
import { morganSuccessHandler, morganErrorHandler } from './morgan';
import { errorConverter, errorHandler, notFoundHandler } from '../server/middleware/error';
// import { strategy } from '../api/middleware/auth.middleware';
// import '../api/services/cronjob'

const app = express();

// app.use(passport.initialize());
// passport.use('jwt', strategy);

app.use(morganSuccessHandler);
app.use(morganErrorHandler);

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(mongoSanitize());

// gzip compression
app.use(compression());

app.use(cors());

app.use('/api', routes);

// convert error to ApiError, if needed
app.use(errorConverter);

// send back a 404 error for any unknown api request
app.use(notFoundHandler);

// handle error
app.use(errorHandler);

export default app;
