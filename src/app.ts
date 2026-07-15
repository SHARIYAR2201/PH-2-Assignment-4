import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { AppRoutes } from './routes';
import { PaymentController } from './modules/payment/payment.controller';
import { globalErrorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFound';
import swaggerDocument from './docs/swagger.json';

const app: Application = express();

app.use(helmet({ contentSecurityPolicy: false }));

app.use(compression());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.', errorDetails: null },
});
app.use('/api', apiLimiter);

// Stripe webhook needs the RAW body, so it must be registered before express.json()
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), PaymentController.webhook);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'GearUp API is running 🏋️ - Rent Sports & Outdoor Gear Instantly',
    data: null,
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'OK', data: { uptime: process.uptime() } });
});

app.get('/api/payments/success', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Payment completed. Call POST /api/payments/confirm with your session_id to finalize it.',
    data: null,
  });
});

app.get('/api/payments/cancel', (_req: Request, res: Response) => {
  res.status(200).json({ success: false, message: 'Payment was cancelled.', data: null });
});

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js',
    ],
  })
);

app.use('/api', AppRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
