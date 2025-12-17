// src/controllers/chat.controller.ts
import { Request, Response } from 'express';
import { ChatService } from '../services/chatService.js';
import { ApiResponse, AuthRequest } from '../types/index.js';

export class ChatController {
  private chatService: ChatService;

  constructor() {
    this.chatService = new ChatService();
  }

  // Create new chat session
  static async createSession(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { pdfId, title } = req.body;
      
      const session = await ChatService.createSession(userId, pdfId, title);
      
      const response: ApiResponse = {
        success: true,
        message: 'Chat session created successfully',
        data: session,
      };
      
      res.status(201).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message,
      };
      res.status(500).json(response);
    }
  }

  // Get user's chat sessions
  static async getSessions(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const sessions = await ChatService.getUserSessions(userId);
      
      const response: ApiResponse = {
        success: true,
        message: 'Chat sessions retrieved successfully',
        data: sessions,
      };
      
      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message,
      };
      res.status(500).json(response);
    }
  }

  // Get chat session by ID
  static async getSession(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { sessionId } = req.params;
      
      if (!sessionId) {
        const response: ApiResponse = {
          success: false,
          message: 'Session ID is required',
        };
        res.status(400).json(response);
        return;
      }
      
      const session = await ChatService.getSession(userId, sessionId);
      
      const response: ApiResponse = {
        success: true,
        message: 'Chat session retrieved successfully',
        data: session,
      };
      
      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message,
      };
      res.status(404).json(response);
    }
  }

  // Send message to chat session
  async sendMessage(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { sessionId } = req.params;
      const { message } = req.body;
      
      if (!sessionId) {
        const response: ApiResponse = {
          success: false,
          message: 'Session ID is required',
        };
        res.status(400).json(response);
        return;
      }
      
      const trimmedMessage = typeof message === 'string' ? message.trim() : '';
      
      if (!trimmedMessage) {
        const response: ApiResponse = {
          success: false,
          message: 'Message is required',
        };
        res.status(400).json(response);
        return;
      }
      
      const result = await this.chatService.processMessage(userId, sessionId, trimmedMessage);
      
      const response: ApiResponse = {
        success: true,
        message: 'Message processed successfully',
        data: result,
      };
      
      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message,
      };
      res.status(500).json(response);
    }
  }

  // Delete chat session
  static async deleteSession(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { sessionId } = req.params;

      if (!sessionId) {
        const response: ApiResponse = {
          success: false,
          message: 'Session ID is required',
        };
        res.status(400).json(response);
        return;
      }
      
      const result = await ChatService.deleteSession(userId, sessionId);
      
      const response: ApiResponse = {
        success: true,
        message: 'Chat session deleted successfully',
        data: result,
      };
      
      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message,
      };
      res.status(404).json(response);
    }
  }
}