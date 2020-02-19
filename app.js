const createError = require('http-errors');
const express = require('express');
const session = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const random = require("random");

const app = module.exports = express();

const indexRouter = require('./routes/index');
const validateRouter = require('./routes/validate');
const compileRouter = require('./routes/compile');
const convertRouter = require('./routes/convert');
const downloadRouter = require('./routes/download');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Note: cookie: { secure: false } prevents session id to change when using http
app.use(session({resave: true, saveUninitialized: true, secret: 'XCR3rsasa%RDHHH', cookie: { maxAge: 60000 }, cookie: { secure: false }}));

app.use('/', indexRouter);
app.use('/validate', validateRouter);
app.use('/compile', compileRouter);
app.use('/convert', convertRouter);
app.use('/download', downloadRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
