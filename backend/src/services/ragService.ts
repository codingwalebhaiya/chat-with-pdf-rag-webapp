// src/services/rag.service.ts
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import prisma from '../config/database.js';

export class RAGService {
  private chatModel: ChatGoogleGenerativeAI;
  private embeddings: GoogleGenerativeAIEmbeddings;

  constructor() {
    this.chatModel = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
      model: "gemini-pro",
      temperature: 0.7,
      maxOutputTokens: 1024,
    });
    
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      modelName: "embedding-001",
    });
  }

  // Search for relevant chunks
  private async searchRelevantChunks(pdfId: string, query: string, limit: number = 4) {
    try {
      // Generate embedding for query
      const queryEmbedding = await this.embeddings.embedQuery(query);
      
      // Search for similar chunks using pgvector cosine similarity
      const relevantChunks = await prisma.$queryRaw`
        SELECT 
          dc.id,
          dc.content,
          dc.pageNumber,
          dc.metadata,
          1 - (dc.embedding <=> ${queryEmbedding}::vector) as similarity
        FROM "DocumentChunk" dc
        WHERE dc."pdfId" = ${pdfId}
        ORDER BY dc.embedding <=> ${queryEmbedding}::vector
        LIMIT ${limit}
      `;
      
      return relevantChunks;
    } catch (error) {
      console.error('Error searching chunks:', error);
      return [];
    }
  }

  // Create context from chunks
  private createContext(chunks: any[]): string {
    if (!chunks || chunks.length === 0) {
      return 'No relevant context found.';
    }
    
    const contextParts = chunks.map((chunk, index) => {
      return `[Source ${index + 1}, Page ${chunk.pagenumber}]:
${chunk.content}`;
    });
    
    return contextParts.join('\n\n');
  }

  // Create RAG chain
  private createRAGChain(context: string) {
    const prompt = PromptTemplate.fromTemplate(`
You are a helpful AI assistant that answers questions based on the provided context from a PDF document.

CONTEXT:
{context}

INSTRUCTIONS:
1. Answer the question based ONLY on the context provided above.
2. If the answer cannot be found in the context, say "I cannot find this information in the document."
3. Keep your answer concise and relevant.
4. If referring to specific parts, mention the page number from the context.

QUESTION: {question}

ANSWER:`);

    const chain = RunnableSequence.from([
      {
        context: () => context,
        question: new RunnablePassthrough(),
      },
      prompt,
      this.chatModel,
      new StringOutputParser(),
    ]);

    return chain;
  }

  // Query PDF with RAG
  async queryPDF(pdfId: string, question: string, userId: string) {
    try {
      // Verify PDF belongs to user
      const pdf = await prisma.pDFDocument.findFirst({
        where: {
          id: pdfId,
          userId,
        },
      });

      if (!pdf) {
        throw new Error('PDF not found or access denied');
      }

      if (pdf.status !== 'COMPLETED') {
        throw new Error('PDF is still processing');
      }

      // Search for relevant chunks
      const relevantChunks = await this.searchRelevantChunks(pdfId, question, 4);
      
      // Create context
      const context = this.createContext(relevantChunks);
      
      // Create and run RAG chain
      const chain = this.createRAGChain(context);
      const answer = await chain.invoke(question);
      
      // Get sources for citations
      const sources = relevantChunks.map((chunk: any) => ({
        pageNumber: chunk.pagenumber,
        content: chunk.content.substring(0, 200) + '...',
        similarity: chunk.similarity,
      }));
      
      return {
        answer,
        sources,
        contextLength: context.length,
      };
    } catch (error) {
      console.error('Error in RAG query:', error);
      throw new Error(`Failed to process query: ${error}`);
    }
  }
}