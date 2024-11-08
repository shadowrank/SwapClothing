const express = require('express');
const xss = require('xss-clean');
const morgan = require('morgan');
const helmet = require('helmet');
const hpp = require('hpp');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError'); 
const globalErrorHandler = require('./controllers/errorController');
const cookieParser = require('cookie-parser');


const app = express();
//use cookies
app.use(cookieParser());

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser, reading data from body into req.body
app.use(express.json());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Enable CORS
app.use(cors());

// Middleware to add request time to req object
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Simple route handler
app.use('/api/v1/user', userRouter);
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
app.use(globalErrorHandler);

// Export the app
module.exports = app;
