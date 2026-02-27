import path from 'path';
import logger from 'morgan';
import express from 'express';
import createError from 'http-errors';
import errorHandler from './middlewares/errorHandler.js';
import router from './routes/index.js';
import cors from "./middlewares/cors.js";
import './migrate.js';

const app = express();


app.use(cors);

app.set('views', path.resolve('views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.resolve('public')));

app.use(router);

app.use(errorHandler);


app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json(err);
});

export default app;



// import path from 'path';
// import logger from 'morgan';
// import express from 'express';
// import createError from 'http-errors';
// import errorHandler from './middlewares/errorHandler.js';
// import router from './routes/index.js';
//
// import './migrate.js';
//
// const app = express();
//
// app.set('views', path.resolve('views'));
// app.set('view engine', 'ejs');
//
// app.use(logger('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(express.static(path.resolve('public')));
//
// app.use(router);
//
// app.use((req, res, next) => {
//   next(createError(404, 'Not Found'));
// });
//
// app.use(errorHandler);
//
// export default app;
