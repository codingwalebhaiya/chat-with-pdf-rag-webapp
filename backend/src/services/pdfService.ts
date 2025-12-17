// src/services/pdf.service.ts
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database.js';
import { PDFParser } from '../utils/pdfParser.js';
import { TextSplitter } from '../utils/textSplitter.js';
import { getEmbeddingsModel } from '../config/gemini.js';
import { IPDFUpload } from '../types/index.js';

export class PDFService {
  // Upload and process PDF
  static async uploadPDF(userId: string, file: Express.Multer.File): Promise<any> {
    try {
      // Parse PDF
      const buffer = await fs.readFile(file.path);
      const pdfData = await PDFParser.extractTextByPages(buffer);
      
      // Create PDF document record
      const pdfDocument = await prisma.pDFDocument.create({
        data: {
          id: uuidv4(),
          userId,
          filename: file.filename,
          originalName: file.originalname,
          filePath: file.path,
          fileSize: file.size,
          pages: pdfData.length,
          status: 'PROCESSING',
        },
      });
      
      // Process PDF in background (don't await)
      this.processPDF(pdfDocument.id, pdfData).catch(console.error);
      
      return {
        id: pdfDocument.id,
        filename: pdfDocument.filename,
        originalName: pdfDocument.originalName,
        fileSize: pdfDocument.fileSize,
        pages: pdfDocument.pages,
        status: pdfDocument.status,
        createdAt: pdfDocument.createdAt,
      };
    } catch (error) {
      throw new Error(`Failed to upload PDF: ${error}`);
    }
  }
  
  // Process PDF and generate embeddings
  private static async processPDF(pdfId: string, pdfData: Array<{ pageNumber: number; text: string }>) {
    try {
      // Split text into chunks
      const chunks = TextSplitter.splitByPages(pdfData);
      
      // Get embeddings model
      const embeddings = getEmbeddingsModel();
      
      // Process each chunk
      for (const chunk of chunks) {
        try {
          // Generate embedding
          const embedding = await embeddings.embedQuery(chunk.content);
          
          // Store chunk with embedding
          await prisma.documentChunk.create({
            data: {
              id: uuidv4(),
              pdfId,
              pageNumber: chunk.pageNumber,
              content: chunk.content,
              embedding: embedding as any, // Cast to any for pgvector
              metadata: {
                chunkIndex: chunk.chunkIndex,
              },
            },
          });
        } catch (error) {
          console.error(`Error processing chunk: ${error}`);
        }
      }
      
      // Update PDF status
      await prisma.pDFDocument.update({
        where: { id: pdfId },
        data: { status: 'COMPLETED' },
      });
      
      console.log(`PDF ${pdfId} processed successfully`);
    } catch (error) {
      console.error(`Error processing PDF: ${error}`);
      
      // Update PDF status to failed
      await prisma.pDFDocument.update({
        where: { id: pdfId },
        data: { status: 'FAILED' },
      });
    }
  }
  
  // Get user's PDFs
  static async getUserPDFs(userId: string) {
    const pdfs = await prisma.pDFDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        filename: true,
        originalName: true,
        fileSize: true,
        pages: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return pdfs;
  }
  
  // Get PDF by ID
  static async getPDFById(userId: string, pdfId: string) {
    const pdf = await prisma.pDFDocument.findFirst({
      where: {
        id: pdfId,
        userId,
      },
      select: {
        id: true,
        filename: true,
        originalName: true,
        fileSize: true,
        pages: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!pdf) {
      throw new Error('PDF not found');
    }
    
    return pdf;
  }
  
  // Delete PDF
  static async deletePDF(userId: string, pdfId: string) {
    // Check if PDF exists and belongs to user
    const pdf = await prisma.pDFDocument.findFirst({
      where: {
        id: pdfId,
        userId,
      },
    });
    
    if (!pdf) {
      throw new Error('PDF not found');
    }
    
    // Delete file from disk
    try {
      await fs.unlink(pdf.filePath);
    } catch (error) {
      console.error(`Error deleting file: ${error}`);
    }
    
    // Delete from database (cascade will delete chunks and related data)
    await prisma.pDFDocument.delete({
      where: { id: pdfId },
    });
    
    return { message: 'PDF deleted successfully' };
  }
}