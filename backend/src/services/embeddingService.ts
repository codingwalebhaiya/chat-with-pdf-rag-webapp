// backend/src/services/embedding.service.ts
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PrismaClient } from "@prisma/client";

export class EmbeddingService {
  private embeddings: GoogleGenerativeAIEmbeddings;
  private prisma: PrismaClient;

  constructor() {
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      modelName: "embedding-001", // Gemini embedding model
    });
    this.prisma = new PrismaClient();
  }

  async processPDF(filePath: string, pdfId: string): Promise<void> {
    try {
      // Load PDF
      const loader = new PDFLoader(filePath);
      const docs = await loader.load();

      // Split text
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      
      const splitDocs = await textSplitter.splitDocuments(docs);

      // Generate embeddings and store
      for (let i = 0; i < splitDocs.length; i++) {
        const doc = splitDocs[i];
        const embedding = await this.embeddings.embedQuery(doc.pageContent);
        
        await this.prisma.embedding.create({
          data: {
            pdfId,
            pageNumber: doc.metadata.page || 1,
            text: doc.pageContent,
            vector: embedding, // Store in pgvector
            metadata: doc.metadata,
          },
        });
      }

      // Update PDF status
      await this.prisma.pDFDocument.update({
        where: { id: pdfId },
        data: { status: "COMPLETED" },
      });
    } catch (error) {
      await this.prisma.pDFDocument.update({
        where: { id: pdfId },
        data: { status: "FAILED" },
      });
      throw error;
    }
  }
}