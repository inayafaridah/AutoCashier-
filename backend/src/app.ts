import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import apiRouter from './routes';
import { swaggerSpec } from './config/swagger';

dotenv.config();

const app = express();

const configuredOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001,http://localhost:3010,http://127.0.0.1:3010';
const allowedOrigins = configuredOrigin
	.split(',')
	.map(origin => origin.trim())
	.filter(Boolean);

app.use(helmet({
  contentSecurityPolicy: false,          // Allow Swagger UI inline scripts
  crossOriginResourcePolicy: false,      // Allow cross-origin image loading
}));
app.use(cors({
	origin(origin, callback) {
		if (!origin) {
			callback(null, true);
			return;
		}

		if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
			callback(null, true);
			return;
		}

		callback(null, true);
	},
}));
app.use(express.json({ limit: '10mb' }));

// Serve uploaded product images — allow cross-origin so frontend (port 3000) can load from backend (port 5000)
app.use('/uploads', (_req, res, next) => {
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(process.cwd(), 'uploads')));

// Swagger UI
const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
  customSiteTitle: 'AutoCashier API Docs',
  customCss: `
    .swagger-ui .topbar { background: #0F172A; }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
    .swagger-ui .info .title { color: #6366f1; font-size: 2rem; font-weight: 900; }
    .swagger-ui .scheme-container { background: #f8fafc; border-radius: 12px; padding: 16px; }
    .swagger-ui .opblock.opblock-post .opblock-summary { background: rgba(99,102,241,0.08); }
    .swagger-ui .opblock.opblock-get .opblock-summary { background: rgba(16,185,129,0.08); }
    .swagger-ui .opblock.opblock-delete .opblock-summary { background: rgba(239,68,68,0.08); }
    .swagger-ui .opblock.opblock-put .opblock-summary { background: rgba(245,158,11,0.08); }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
};

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

app.use('/api', apiRouter);

app.get('/', (_req, res) => res.json({ 
  status: 'ok', 
  message: 'AutoCashier Backend',
  docs: 'http://localhost:5000/api/docs',
}));

export default app;
