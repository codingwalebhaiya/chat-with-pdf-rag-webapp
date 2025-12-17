// src/services/chat.service.ts
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database.js';
import { RAGService } from './ragService.js';

export class ChatService {
  private ragService: RAGService;

  constructor() {
    this.ragService = new RAGService();
  }

  // Create new chat session
  static async createSession(userId: string, pdfId?: string, title?: string) {
    const sessionTitle = title || `Chat ${new Date().toLocaleDateString()}`;
    
    const session = await prisma.chatSession.create({
      data: {
        id: uuidv4(),
        userId,
        pdfId,
        title: sessionTitle,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 10,
        },
      },
    });
    
    return session;
  }

  // Get user's chat sessions
  static async getUserSessions(userId: string) {
    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        pdf: {
          select: {
            id: true,
            originalName: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    });
    
    return sessions;
  }

  // Get chat session by ID
  static async getSession(userId: string, sessionId: string) {
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        pdf: {
          select: {
            id: true,
            originalName: true,
            status: true,
          },
        },
      },
    });
    
    if (!session) {
      throw new Error('Chat session not found');
    }
    
    return session;
  }

  // Add message to chat session
  static async addMessage(sessionId: string, role: 'USER' | 'ASSISTANT', content: string, metadata?: any) {
    const message = await prisma.chatMessage.create({
      data: {
        id: uuidv4(),
        sessionId,
        role,
        content,
        metadata,
      },
    });
    
    // Update session's updatedAt
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });
    
    return message;
  }

  // Process user message with RAG
  async processMessage(userId: string, sessionId: string, message: string) {
    try {
      // Get session with PDF info
      const session = await ChatService.getSession(userId, sessionId);
      
      if (!session.pdfId) {
        throw new Error('This chat session is not associated with a PDF');
      }
      
      // Add user message to chat
      await ChatService.addMessage(sessionId, 'USER', message);
      
      // Process with RAG if PDF is available
      let response;
      let sources = [];
      
      if (session.pdfId) {
        const ragResponse = await this.ragService.queryPDF(session.pdfId, message, userId);
        response = ragResponse.answer;
        sources = ragResponse.sources;
      } else {
        // Fallback to general chat (optional)
        response = "I can only answer questions about uploaded PDF documents. Please upload a PDF first.";
      }
      
      // Add assistant response to chat
      await ChatService.addMessage(sessionId, 'ASSISTANT', response, { sources });
      
      return {
        response,
        sources,
        sessionId,
      };
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Normalize unknown error to a string message
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Add error message to chat
      await ChatService.addMessage(sessionId, 'ASSISTANT', 'Sorry, I encountered an error processing your request.', {
        error: errorMessage,
      });
      
      throw error;
    }
  }

  // Delete chat session
  static async deleteSession(userId: string, sessionId: string) {
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });
    
    if (!session) {
      throw new Error('Chat session not found');
    }
    
    await prisma.chatSession.delete({
      where: { id: sessionId },
    });
    
    return { message: 'Chat session deleted successfully' };
  }
}