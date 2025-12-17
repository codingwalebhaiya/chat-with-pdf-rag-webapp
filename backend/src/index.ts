
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import { AuthRequest } from './types/index.js';
import authRouter from './routes/authRoute.js';
import pdfRouter from './routes/pdfRoute.js';
import chatRouter from './routes/chatRoute.js';
import { errorHandler, notFound } from './middlewares/errorMiddleware.js';

dotenv.config();

const app = express();

const uploadPath = process.env.UPLOAD_PATH || './uploads/pdfs';
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'chat-with-pdf-api',
  });
});

app.use('/api/auth', authRouter);
app.use('/api/pdfs', pdfRouter);
app.use('/api/chat', chatRouter);

app.get('/api/protected', (req: AuthRequest, res) => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  
  res.json({
    message: 'Welcome to protected route',
    user: req.user,
  });
});

app.use(notFound);
app.use(errorHandler);

export default app;