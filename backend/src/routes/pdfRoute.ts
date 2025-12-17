// src/routes/pdf.routes.ts
import { Router } from 'express';
import { PDFController } from '../controllers/pdfController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const pdfRouter = Router();

pdfRouter.use(authenticate);

pdfRouter.post('/upload', upload.single('pdf'), PDFController.uploadPDF);
pdfRouter.get('/', PDFController.getPDFs);
pdfRouter.get('/:id', PDFController.getPDF);
pdfRouter.delete('/:id', PDFController.deletePDF);

export default pdfRouter;