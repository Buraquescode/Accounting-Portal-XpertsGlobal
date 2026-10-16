// The Express app: security middleware, routes, then the 404 and error handlers (order matters).
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(helmet()); // safe default HTTP headers
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true })); // only our frontend may call the API, with cookies
app.use(express.json({ limit: '1mb' })); // parse JSON bodies, reject huge ones
app.use(cookieParser()); // read the session cookie
if (env.NODE_ENV === 'development') app.use(morgan('dev')); // request log while developing

app.use('/api', apiLimiter);

// Quick "is it alive" check for the demo and for deployment monitors.
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', time: new Date().toISOString(), uptime: process.uptime() } });
});

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
